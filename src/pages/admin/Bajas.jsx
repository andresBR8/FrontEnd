import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RiSearchLine, RiFileDownloadLine, RiCheckLine, RiCloseLine, RiFilterLine } from "react-icons/ri";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { debounce } from 'lodash';

ChartJS.register(ArcElement, Tooltip, Legend);

const apiUrl = import.meta.env.VITE_API_URL;

const Bajas = () => {
  const [modelos, setModelos] = useState([]);
  const [filteredModelos, setFilteredModelos] = useState([]);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [bajas, setBajas] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("TODOS");
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  useEffect(() => {
    fetchData();
    checkRole();
  }, []);

  const checkRole = () => {
    const role = localStorage.getItem("role");
    setIsAdmin(role === "Administrador");
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [modelosResponse, bajasResponse] = await Promise.all([
        axios.get(`${apiUrl}/activo-modelo`),
        axios.get(`${apiUrl}/baja`)
      ]);

      const modelosFiltrados = modelosResponse.data.data.map((modelo) => ({
        ...modelo,
        activoUnidades: modelo.activoUnidades.filter(
          (unidad) => unidad.estadoCondicion !== "BAJA" 
        ),
      }));
      setModelos(modelosFiltrados);
      setFilteredModelos(modelosFiltrados);
      setBajas(bajasResponse.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos. Por favor, intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query) => {
      setFilteredModelos(
        modelos.map((modelo) => ({
          ...modelo,
          activoUnidades: modelo.activoUnidades.filter(
            (unidad) =>
              modelo.nombre.toLowerCase().includes(query.toLowerCase()) ||
              unidad.codigo.toLowerCase().includes(query.toLowerCase())
          ),
        }))
      );
    }, 300),
    [modelos]
  );

  const handleFiltroModeloChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleSolicitarBaja = async () => {
    if (!selectedUnidad) {
      toast.warning("Por favor, seleccione una unidad para dar de baja.");
      return;
    }

    const solicitud = {
      fkActivoUnidad: selectedUnidad.id,
      fecha: new Date().toISOString(),
      motivo: "Equipo obsoleto y no se utilizará en futuros proyectos",
      role: isAdmin ? "Administrador" : "Encargado",
    };

    try {
      await axios.post(`${apiUrl}/baja`, solicitud);
      toast.success(`Baja de la unidad ${selectedUnidad.codigo} solicitada con éxito.`);
      fetchData();
      setSelectedUnidad(null);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMessage = error.response.data.message.message;
        if (errorMessage && errorMessage.includes("El activo se encuentra asignado")) {
          setShowReturnDialog(true);
        } else {
          console.error("Error solicitando baja:", error);
          toast.error(`No se pudo solicitar la baja de la unidad ${selectedUnidad.codigo}.`);
        }
      } else {
        console.error("Error solicitando baja:", error);
        toast.error(`No se pudo solicitar la baja de la unidad ${selectedUnidad.codigo}.`);
      }
    }
  };

  const handleReturnAsset = async () => {
    if (!selectedUnidad) return;

    try {
      await axios.post(`${apiUrl}/devolucion`, {
        fkActivoUnidad: selectedUnidad.id,
        fecha: new Date().toISOString(),
        motivo: "Devolución para dar de baja",
      });

      toast.success(`Activo ${selectedUnidad.codigo} devuelto con éxito.`);
      
      // Intentar dar de baja nuevamente
      await handleSolicitarBaja();
    } catch (error) {
      console.error("Error devolviendo el activo:", error);
      toast.error(`No se pudo devolver el activo ${selectedUnidad.codigo}.`);
    } finally {
      setShowReturnDialog(false);
    }
  };

  const handleAprobarBaja = async (id, aprobar) => {
    try {
      await axios.patch(`${apiUrl}/baja/${id}/aprobar`, {
        role: "Administrador",
        aprobar,
      });
      toast.success(`Baja ${aprobar ? "aprobada" : "rechazada"} con éxito.`);
      fetchData();
    } catch (error) {
      console.error("Error aprobando/rechazando baja:", error);
      toast.error("No se pudo procesar la solicitud.");
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
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
    setIsExporting(false);
  };

  const exportToExcel = () => {
    setIsExporting(true);
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
    setIsExporting(false);
  };

  const filteredBajas = bajas.filter(baja => 
    filterStatus === "TODOS" || baja.estado === filterStatus
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBajas = filteredBajas.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const chartData = {
    labels: ['Aprobadas', 'Rechazadas', 'Pendientes'],
    datasets: [
      {
        data: [
          bajas.filter(baja => baja.estado === 'APROBADA').length,
          bajas.filter(baja => baja.estado === 'RECHAZADA').length,
          bajas.filter(baja => baja.estado === 'PENDIENTE').length,
        ],
        backgroundColor: ['#4CAF50', '#F44336', '#FFC107'],
        hoverBackgroundColor: ['#45a049', '#e53935', '#ffb300'],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Estado de las Bajas',
        font: {
          size: 16,
        },
      },
    },
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-emi_azul mb-8 text-center">Gestión de Bajas de Activos</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sección de selección de unidad y solicitud de baja */}
        <div className="lg:col-span-1 bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-emi_azul mb-4">Solicitar Baja de Unidad</h2>
          
          <div className="relative mb-4">
            <input
              type="text"
              className="w-full p-2 pl-10 border border-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul"
              placeholder="Buscar por nombre o código..."
              onChange={handleFiltroModeloChange}
              value={searchQuery}
            />
            <RiSearchLine className="absolute left-3 top-3 text-emi_azul" />
          </div>
          
          <div className="max-h-60 overflow-auto mb-4">
            {filteredModelos.map((modelo) => (
              <div key={modelo.id} className="mb-2">
                <h4 className="font-medium text-emi_azul">{modelo.nombre}</h4>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {modelo.activoUnidades.map((unidad) => (
                    <button
                      key={unidad.id}
                      className={`p-2 text-sm rounded-md transition-colors ${
                        selectedUnidad === unidad
                          ? "bg-emi_azul text-white"
                          : "bg-gray-100 text-emi_azul hover:bg-emi_azul hover:text-white"
                      }`}
                      onClick={() => setSelectedUnidad(unidad)}
                    >
                      <p><strong>Código:</strong> {unidad.codigo}</p>
                      <p><strong>Estado:</strong> {unidad.estadoActual}</p>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button
            className="w-full bg-emi_amarillo text-emi_azul font-bold py-2 px-4 rounded-md hover:bg-emi_azul hover:text-emi_amarillo transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSolicitarBaja}
            disabled={!selectedUnidad}
          >
            {isAdmin ? "Registrar Baja" : "Solicitar Baja"}
          </button>
        </div>

        {/* Sección de listado de bajas y acciones */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-emi_azul">Bajas Registradas</h2>
            <div className="flex space-x-2">
              <select
                className="p-2 border border-emi_azul rounded-md focus:ring-emi_azul focus:border-emi_azul text-black"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="TODOS">Todos</option>
                <option value="APROBADA">Aprobadas</option>
                <option value="RECHAZADA">Rechazadas</option>
                <option value="PENDIENTE">Pendientes</option>
              </select>
              <button
                className="p-2 bg-emi_azul text-white rounded-md hover:bg-emi_azul-dark transition-colors"
                onClick={exportToPDF}
                disabled={isExporting}
              >
                <RiFileDownloadLine />
              </button>
              <button
                className="p-2 bg-emi_azul text-white rounded-md hover:bg-emi_azul-dark transition-colors"
                onClick={exportToExcel}
                disabled={isExporting}
              >
                <RiFilterLine />
              </button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emi_azul"></div>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-emi_amarillo uppercase bg-emi_azul">
                    <tr>
                      <th className="px-6 py-3">ID</th>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Unidad</th>
                      <th className="px-6 py-3">Motivo</th>
                      <th className="px-6 py-3">Estado</th>
                      {isAdmin && <th className="px-6 py-3">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentBajas.map((baja) => (
                      <tr key={baja.id} className="bg-white border-b hover: bg-gray-50 text-emi_azul">
                        <td className="px-6 py-4">{baja.id}</td>
                        <td className="px-6 py-4">{new Date(baja.fecha).toLocaleDateString()}</td>
                        <td className="px-6 py-4">{baja.activoUnidad.codigo}</td>
                        <td className="px-6 py-4">{baja.motivo}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            baja.estado === "APROBADA" ? "bg-green-100 text-green-800" :
                            baja.estado === "RECHAZADA" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {baja.estado}
                          </span>
                        </td>
                        {isAdmin && baja.estado === "PENDIENTE" && (
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleAprobarBaja(baja.id, true)}
                              className="text-green-600 hover:text-green-900 mr-2"
                              aria-label="Aprobar baja"
                            >
                              <RiCheckLine size={20} />
                            </button>
                            <button
                              onClick={() => handleAprobarBaja(baja.id, false)}
                              className="text-red-600 hover:text-red-900"
                              aria-label="Rechazar baja"
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

              {/* Mobile Stacked View */}
              <div className="md:hidden bg-white shadow-md rounded-lg mb-4 p-4">
                {currentBajas.map((baja) => (
                  <div key={baja.id} className="border-b pb-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-lg font-semibold text-emi_azul">Unidad: {baja.activoUnidad.codigo}</div>
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-sm">
                      <div>
                        <span className="font-medium">ID:</span> {baja.id}
                      </div>
                      <div>
                        <span className="font-medium">Fecha:</span> {new Date(baja.fecha).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Motivo:</span> {baja.motivo}
                      </div>
                      <div>
                        <span className="font-medium">Estado:</span> <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            baja.estado === "APROBADA" ? "bg-green-100 text-green-800" :
                            baja.estado === "RECHAZADA" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                            {baja.estado}
                          </span>
                      </div>
                      {isAdmin && baja.estado === "PENDIENTE" && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleAprobarBaja(baja.id, true)}
                            className="text-green-600 hover:text-green-900 mr-2"
                            aria-label="Aprobar baja"
                          >
                            <RiCheckLine size={20} />
                          </button>
                          <button
                            onClick={() => handleAprobarBaja(baja.id, false)}
                            className="text-red-600 hover:text-red-900"
                            aria-label="Rechazar baja"
                          >
                            <RiCloseLine size={20} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-4">
                {Array.from({ length: Math.ceil(filteredBajas.length / itemsPerPage) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => paginate(i + 1)}
                    className={`mx-1 px-3 py-1 rounded ${
                      currentPage === i + 1 ? 'bg-emi_azul text-white' : 'bg-gray-200 text-emi_azul hover:bg-emi_azul hover:text-white'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Sección del gráfico */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <div className="w-full h-64">
          <Pie data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Modal de confirmación para devolución */}
      {showReturnDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-emi_azul mb-4">El activo está en uso</h3>
            <p className="mb-6">
              El activo seleccionado está actualmente en uso. ¿Desea proceder con la devolución antes de darlo de baja?
            </p>
            <div className="flex justify-end space-x-4">
              <button
                className="px-4 py-2 bg-gray-200 text-emi_azul rounded hover:bg-gray-300 transition-colors"
                onClick={() => setShowReturnDialog(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 bg-emi_amarillo text-emi_azul rounded hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
                onClick={handleReturnAsset}
              >
                Proceder con la devolución
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
};

export default Bajas;