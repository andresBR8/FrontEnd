import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiSearchLine, RiDownloadLine, RiCheckLine, RiCloseLine } from "react-icons/ri";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Bar } from "react-chartjs-2";

const apiUrl = import.meta.env.VITE_API_URL;

const Bajas = () => {
  const [modelos, setModelos] = useState([]);
  const [filteredModelos, setFilteredModelos] = useState([]);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [bajas, setBajas] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false); // Suponiendo que hay una forma de identificar si es admin
  const [contador, setContador] = useState({});

  // Calcular el tiempo restante hasta la depreciación automática anual
  const calculateTimeLeft = () => {
    const now = new Date();
    const nextReset = new Date(now.getFullYear() + 1, 0, 1);
    const difference = nextReset - now;
    return difference > 0
      ? {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        }
      : {};
  };

  useEffect(() => {
    fetchData();
    setContador(calculateTimeLeft());
    const timer = setInterval(() => setContador(calculateTimeLeft()), 1000);
    return () => clearInterval(timer); // Limpia el temporizador cuando el componente se desmonta
  }, []);

  const fetchData = async () => {
    try {
      const modelosResponse = await axios.get(`${apiUrl}/activo-modelo`);
      setModelos(modelosResponse.data.data);
      setFilteredModelos(modelosResponse.data.data);

      const bajasResponse = await axios.get(`${apiUrl}/baja`);
      setBajas(bajasResponse.data.data);

      // Setear isAdmin en base a la autenticación (suponiendo que hay una API que lo determina)
      // setIsAdmin(chequeoDeAdmin());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleFiltroModeloChange = (e) => {
    setFilteredModelos(
      modelos.filter((modelo) =>
        modelo.nombre.toLowerCase().includes(e.target.value.toLowerCase())
      )
    );
  };

  const handleSolicitarBaja = async () => {
    if (!selectedUnidad) {
      toast.warning("Por favor, seleccione una unidad para dar de baja.");
      return;
    }

    const solicitud = {
      fkActivoUnidad: selectedUnidad.id,
      fecha: new Date().toISOString(),
      motivo: "Motivo de la baja",
    };

    try {
      await axios.post(`${apiUrl}/baja`, solicitud);
      toast.success(`Baja de la unidad ${selectedUnidad.codigo} solicitada con éxito.`);
      fetchData(); 
    } catch (error) {
      console.error("Error solicitando baja:", error);
      toast.error(`No se pudo solicitar la baja de la unidad ${selectedUnidad.codigo}.`);
    }
  };

  const handleAprobarBaja = async (id, aprobar) => {
    try {
      await axios.patch(`${apiUrl}/baja/${id}/aprobar`, { administradorId: "idAdmin", aprobar });
      toast.success(`Baja ${aprobar ? "aprobada" : "rechazada"} con éxito.`);
      fetchData(); // Actualizar las bajas
    } catch (error) {
      console.error("Error aprobando/rechazando baja:", error);
      toast.error("No se pudo procesar la solicitud.");
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Bajas", 20, 10);
    doc.autoTable({
      head: [["ID", "Fecha", "Unidad", "Motivo", "Estado"]],
      body: bajas.map((baja) => [
        baja.id,
        new Date(baja.fecha).toLocaleDateString(),
        baja.activoUnidad.codigo,
        baja.motivo,
        baja.estado,
      ]),
    });
    doc.save("reporte_bajas.pdf");
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      bajas.map((baja) => ({
        ID: baja.id,
        Fecha: new Date(baja.fecha).toLocaleDateString(),
        Unidad: baja.activoUnidad.codigo,
        Motivo: baja.motivo,
        Estado: baja.estado,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bajas");
    XLSX.writeFile(workbook, "reporte_bajas.xlsx");
  };

  const data = {
    labels: bajas.map((baja) => baja.activoUnidad.codigo),
    datasets: [
      {
        label: "Estado de las Bajas",
        data: bajas.map((baja) => baja.estado === "APROBADA" ? 1 : 0),
        backgroundColor: "rgba(75, 192, 192, 0.6)",
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="p-4 flex flex-col lg:flex-row justify-between">
      {/* Sección de selección de unidad y solicitud de baja */}
      <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl lg:w-2/5">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_amarillo mb-8">
          Solicitar <span className="text-white">Baja de Unidad</span>
        </h1>
        
        <input
          type="text"
          className="mb-4 p-2 w-full rounded-lg bg-white text-emi_azul"
          placeholder="Buscar modelo por nombre..."
          onChange={handleFiltroModeloChange}
        />
        <div className="max-h-60 overflow-auto bg-white p-4 rounded-lg">
          {filteredModelos.map((modelo) => (
            <div key={modelo.id} className="mb-4">
              <h4 className="text-emi_amarillo font-bold">{modelo.nombre}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {modelo.activoUnidades.map((unidad) => (
                  <div
                    key={unidad.id}
                    className={`p-2 rounded-lg cursor-pointer ${
                      selectedUnidad === unidad ? "bg-emi_azul text-white" : "bg-white text-emi_azul"
                    }`}
                    onClick={() => setSelectedUnidad(unidad)}
                  >
                    {unidad.codigo}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="mt-4 bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
          onClick={handleSolicitarBaja}
        >
          Solicitar Baja
        </button>
      </div>

      {/* Sección de listado de bajas y acciones */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl lg:w-3/5 mt-4 lg:mt-0">
        <h2 className="text-2xl text-center font-bold text-emi_amarillo mb-4">Bajas Registradas</h2>
        <div className="overflow-auto max-h-60 mb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-emi_amarillo p-2">ID</th>
                <th className="border-b-2 border-emi_amarillo p-2">Fecha</th>
                <th className="border-b-2 border-emi_amarillo p-2">Unidad</th>
                <th className="border-b-2 border-emi_amarillo p-2">Motivo</th>
                <th className="border-b-2 border-emi_amarillo p-2">Estado</th>
                {isAdmin && <th className="border-b-2 border-emi_amarillo p-2">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {bajas.map((baja) => (
                <tr key={baja.id}>
                  <td className="border-b border-gray-300 p-2">{baja.id}</td>
                  <td className="border-b border-gray-300 p-2">{new Date(baja.fecha).toLocaleDateString()}</td>
                  <td className="border-b border-gray-300 p-2">{baja.activoUnidad.codigo}</td>
                  <td className="border-b border-gray-300 p-2">{baja.motivo}</td>
                  <td className={`border-b border-gray-300 p-2 ${baja.estado === 'APROBADA' ? 'text-green-600' : baja.estado === 'RECHAZADA' ? 'text-red-600' : 'text-yellow-600'}`}>
                    {baja.estado}
                  </td>
                  {isAdmin && baja.estado === "PENDIENTE" && (
                    <td className="border-b border-gray-300 p-2 flex">
                      <button
                        onClick={() => handleAprobarBaja(baja.id, true)}
                        className="text-green-500 hover:text-green-700 mr-2"
                      >
                        <RiCheckLine size={20} />
                      </button>
                      <button
                        onClick={() => handleAprobarBaja(baja.id, false)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <RiCloseLine size={20} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="w-full h-96">
          <Bar data={data} options={options} />
        </div>

        <div className="flex justify-around mt-8">
          <button
            type="button"
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
            onClick={exportToPDF}
          >
            Exportar PDF
          </button>
          <button
            type="button"
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
            onClick={exportToExcel}
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Bajas;
