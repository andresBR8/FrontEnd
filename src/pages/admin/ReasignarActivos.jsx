import React, { useState, useEffect } from "react";
import axios from "axios";
import { RiCloseLine, RiUserLine, RiArrowRightLine } from "react-icons/ri";
import { toast } from "react-toastify";
import { PDFViewer } from '@react-pdf/renderer';
import ReasignacionDocument from './PDFReasignacion';
import "react-toastify/dist/ReactToastify.css";

const ReasignarActivos = ({ onClose, onSave, activoUnidadId }) => {
  const [personal, setPersonal] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [detalle, setDetalle] = useState("");
  const [ultimaAsignacion, setUltimaAsignacion] = useState(null);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfData, setPdfData] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        const response = await axios.get(`${apiUrl}/personal`);
        setPersonal(response.data.data);
      } catch (error) {
        console.error("Error fetching personal:", error);
      }
    };

    const fetchUltimaAsignacion = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reasignacion/ultima-asignacion/${activoUnidadId}`);
        setUltimaAsignacion(response.data.data);
      } catch (error) {
        console.error("Error fetching ultima asignacion:", error);
      }
    };

    fetchPersonal();
    fetchUltimaAsignacion();
  }, [apiUrl, activoUnidadId]);

  const handleSeleccionPersonal = (persona) => {
    setSelectedPersonal(persona);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPersonal) {
      toast.error("Por favor complete todos los campos obligatorios.");
      return;
    }

    const data = {
      fkActivoUnidad: activoUnidadId,
      fkUsuarioAnterior: ultimaAsignacion?.usuario?.id || null,
      fkUsuarioNuevo: localStorage.getItem("id"),
      fkPersonalAnterior: ultimaAsignacion?.personal?.id || null,
      fkPersonalNuevo: selectedPersonal.id,
      detalle: detalle || "Reasignación de activos",
      fechaReasignacion: new Date().toISOString(),
    };

    try {
      await axios.post(`${apiUrl}/reasignacion`, data);
      toast.success("Reasignación creada exitosamente.");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error al crear reasignación:", error);
      toast.error("Error al crear la reasignación.");
    }
  };

  const handleGeneratePDF = () => {
    const pdfData = {
      nombre: selectedPersonal?.nombre,
      cargo: selectedPersonal?.cargo?.nombre,
      unidad: selectedPersonal?.unidad?.nombre,
      activos: [
        {
          codigo: ultimaAsignacion?.activoUnidad?.codigo,
          nombre: ultimaAsignacion?.activoUnidad?.activoModelo?.nombre,
          estado: ultimaAsignacion?.activoUnidad?.estado,
          fechaIngreso: ultimaAsignacion?.activoUnidad?.activoModelo?.fechaIngreso,
          usuarioAnterior: ultimaAsignacion?.usuario?.name,
          usuarioNuevo: selectedPersonal?.nombre
        }
      ]
    };

    console.log("PDF Data:", pdfData); // Asegúrate de que los datos están completos
    setPdfData(pdfData);
    setShowPDF(true);
  };

  return (
    <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Reasignar Activo</h2>
        <button onClick={onClose} className="text-xl"><RiCloseLine /></button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2 text-sm font-medium text-emi_amarillo">Personal Nuevo</label>
          <div className="relative">
            <select
              value={selectedPersonal ? selectedPersonal.id : ""}
              onChange={(e) => handleSeleccionPersonal(personal.find(p => p.id === parseInt(e.target.value)))}
              className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul"
            >
              <option value="">Seleccione el personal</option>
              {personal.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        {ultimaAsignacion && (
          <div className="flex items-center mt-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex-1">
              <h3 className="text-lg text-emi_azul font-bold mb-2">Asignación Anterior</h3>
              <p className="text-emi_azul">Fecha: {new Date(ultimaAsignacion.fecha).toLocaleDateString()}</p>
              <p className="text-emi_azul">Detalle: {ultimaAsignacion.detalle}</p>
              <p className="text-emi_azul">Usuario: {ultimaAsignacion.usuario.name}</p>
              <p className="text-emi_azul">Personal: {ultimaAsignacion.personal.nombre}</p>
            </div>
            <RiArrowRightLine className="text-emi_azul mx-4 text-2xl" />
            <div className="bg-white p-4 rounded-lg shadow-md flex-1">
              <h3 className="text-lg font-medium text-gray-700">Nueva Asignación</h3>
              {selectedPersonal ? (
                <>
                  <p className="text-sm text-gray-500">Nombre: {selectedPersonal.nombre}</p>
                  <p className="text-sm text-gray-500">Cargo: {selectedPersonal.cargo.nombre}</p>
                  <p className="text-sm text-gray-500">Unidad: {selectedPersonal.unidad.nombre}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Seleccione un nuevo personal para reasignar</p>
              )}
            </div>
          </div>
        )}
        <div>
          <label className="block mb-2 text-sm font-medium text-emi_amarillo">Detalle</label>
          <textarea
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            placeholder="Reasignación de activos"
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Reasignar
        </button>
      </form>
      {showPDF && pdfData && (
        <div className="w-full mt-4" style={{ height: "800px", overflow: "auto" }}>
          <PDFViewer style={{ width: "100%", height: "100%" }}>
            <ReasignacionDocument data={pdfData} />
          </PDFViewer>
        </div>
      )}
    </div>
  );
};

export default ReasignarActivos;
