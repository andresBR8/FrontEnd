import React, { useState, useEffect } from "react";
import axios from "axios";
import { RiCloseLine, RiArrowRightLine, RiUserLine, RiFileTextLine, RiUploadCloud2Line } from "react-icons/ri";
import { toast } from "react-toastify";
import { PDFViewer } from '@react-pdf/renderer';
import ReasignacionDocument from './PDFReasignacion';
import DevolucionDocument from './DevolucionDocument';
import "react-toastify/dist/ReactToastify.css";

const ReasignarActivos = ({ onClose, onSave, activoUnidadId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [personal, setPersonal] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [detalle, setDetalle] = useState("");
  const [ultimaAsignacion, setUltimaAsignacion] = useState(null);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [avalFile, setAvalFile] = useState(null);
  const [avalFileUrl, setAvalFileUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [devolucionStep, setDevolucionStep] = useState(1);
  const [actaDevolucionFile, setActaDevolucionFile] = useState(null);
  const [actaDevolucionUrl, setActaDevolucionUrl] = useState(null);
  const [detalleDevolucion, setDetalleDevolucion] = useState("");
  const [activoADevolver, setActivoADevolver] = useState(null);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchPersonal();
    fetchUltimaAsignacion();
  }, [activoUnidadId]);

  const fetchPersonal = async () => {
    try {
      const response = await axios.get(`${apiUrl}/personal`);
      setPersonal(response.data.data);
    } catch (error) {
      console.error("Error fetching personal:", error);
      toast.error("No se pudo cargar la lista de personal.");
    }
  };

  const fetchUltimaAsignacion = async () => {
    try {
      const response = await axios.get(`${apiUrl}/reasignacion/ultima-asignacion/${activoUnidadId}`);
      setUltimaAsignacion(response.data.data);
      setActivoADevolver(response.data.data.activoUnidad);
    } catch (error) {
      console.error("Error fetching ultima asignacion:", error);
    }
  };

  const handleDevolucion = async () => {
    if (!actaDevolucionUrl) {
      toast.error("Por favor, suba el acta de devolución.");
      return;
    }

    const devolucionData = {
      fkPersonal: ultimaAsignacion.personal.id,
      fkUsuario: localStorage.getItem("id"),
      fecha: new Date().toISOString(),
      detalle: detalleDevolucion || "Devolución de activo para reasignación",
      actaDevolucion: actaDevolucionUrl,
      activosUnidades: [{ fkActivoUnidad: activoUnidadId }],
    };

    try {
      await axios.post(`${apiUrl}/devolucion`, devolucionData);
      toast.success("Devolución realizada con éxito.");
      setCurrentStep(2); // Avanzar al paso de reasignación
    } catch (error) {
      console.error("Error al realizar la devolución:", error);
      toast.error("Hubo un problema al realizar la devolución.");
    }
  };

  const handleActaDevolucionFileChange = (event) => {
    const file = event.target.files[0];
    setActaDevolucionFile(file);
  };

  const handleUploadActaDevolucion = async () => {
    if (!actaDevolucionFile) {
      toast.error('Por favor seleccione un archivo para el acta de devolución');
      return;
    }

    const formData = new FormData();
    formData.append('file', actaDevolucionFile);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setActaDevolucionUrl(response.data.url);
      toast.success('Acta de devolución subida correctamente');
      setDevolucionStep(3);
    } catch (error) {
      console.error('Error al subir el acta de devolución:', error);
      toast.error('No se pudo subir el acta de devolución');
    }
  };

  const handleSeleccionPersonal = (persona) => {
    setSelectedPersonal(persona);
    generatePDFData(persona);
    setCurrentStep(3);
  };

  const generatePDFData = (persona) => {
    if (!persona || !ultimaAsignacion) return;

    const pdfData = {
      nombre: persona?.nombre,
      cargo: persona?.cargo?.nombre,
      unidad: persona?.unidad?.nombre,
      activos: [
        {
          codigo: ultimaAsignacion?.activoUnidad?.codigo,
          nombre: ultimaAsignacion?.activoUnidad?.activoModelo?.nombre,
          estado: ultimaAsignacion?.activoUnidad?.estado,
          fechaIngreso: ultimaAsignacion?.activoUnidad?.activoModelo?.fechaIngreso,
          usuarioAnterior: ultimaAsignacion?.usuario?.name,
          usuarioNuevo: persona?.nombre,
        }
      ]
    };

    setPdfData(pdfData);
    setShowPDF(true);
  };

  const handleAvalFileChange = (event) => {
    const file = event.target.files[0];
    setAvalFile(file);
  };

  const handleUploadAval = async () => {
    if (!avalFile) {
      toast.error('Por favor seleccione un archivo para el aval');
      return;
    }

    const formData = new FormData();
    formData.append('file', avalFile);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setAvalFileUrl(response.data.url);
      toast.success('Aval subido correctamente');
      setCurrentStep(5);
    } catch (error) {
      console.error('Error al subir el aval:', error);
      toast.error('No se pudo subir el aval');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPersonal || !avalFileUrl) {
      toast.error("Por favor complete todos los pasos antes de reasignar.");
      return;
    }

    setIsSubmitting(true);

    const data = {
      fkActivoUnidad: activoUnidadId,
      fkUsuarioAnterior: ultimaAsignacion?.usuario?.id || null,
      fkUsuarioNuevo: localStorage.getItem("id"),
      fkPersonalAnterior: ultimaAsignacion?.personal?.id || null,
      fkPersonalNuevo: selectedPersonal.id,
      detalle: detalle || "Reasignación de activos",
      fechaReasignacion: new Date().toISOString(),
      avalReasignacion: avalFileUrl,
    };

    try {
      await axios.post(`${apiUrl}/reasignacion`, data);
      toast.success("Reasignación creada exitosamente.");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error al crear reasignación:", error);
      toast.error("Error al crear la reasignación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderDevolucionStepContent = () => {
    switch (devolucionStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 1: Confirmar Devolución</h3>
            {activoADevolver && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h4 className="text-lg text-emi_azul font-bold mb-2">Activo a Devolver</h4>
                <p className="text-emi_azul">Código: {activoADevolver.codigo}</p>
                <p className="text-emi_azul">Nombre: {activoADevolver.activoModelo?.nombre}</p>
                <p className="text-emi_azul">Estado: {activoADevolver.estado}</p>
              </div>
            )}
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
              onClick={() => setDevolucionStep(2)}
            >
              Continuar con la Devolución
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 2: Subir Acta de Devolución</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-emi_azul mb-2">
                Subir Acta de Devolución (PDF o Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleActaDevolucionFileChange}
                className="w-full p-2 border border-emi_amarillo rounded-md"
              />
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
              onClick={handleUploadActaDevolucion}
            >
              <RiUploadCloud2Line className="mr-2" /> Subir Acta de Devolución
            </button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 3: Confirmar Devolución</h3>
            <div>
              <label className="block mb-2 text-sm font-medium text-emi_amarillo">Detalle de Devolución</label>
              <textarea
                value={detalleDevolucion}
                onChange={(e) => setDetalleDevolucion(e.target.value)}
                placeholder="Devolución de activo para reasignación"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
              />
            </div>
            <button
              type="button"
              onClick={handleDevolucion}
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
            >
              Confirmar Devolución
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderDevolucionStepContent();
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 2: Seleccionar Nuevo Personal</h3>
            <div className="relative">
              <RiUserLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
              <input 
                type="text" 
                className="py-2 pl-10 pr-4 w-full text-sm text-emi_azul border border-emi_azul rounded-lg focus:ring-2 focus:ring-emi_azul focus:border-transparent"
                placeholder="Buscar personal..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar personal"
              />
            </div>
            <div className="max-h-60 overflow-auto space-y-2">
              {personal.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
                <div 
                  key={p.id} 
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg"
                  onClick={() => handleSeleccionPersonal(p)}
                >
                  <p className="font-medium">{p.nombre}</p>
                  <p className="text-sm text-gray-600">{p.cargo.nombre} - {p.unidad.nombre}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 3: Revisar Reasignación</h3>
            <div className="flex items-center mt-4">
              <div className="bg-white p-4 rounded-lg shadow-md flex-1">
                <h4 className="text-lg text-emi_azul font-bold mb-2">Asignación Anterior</h4>
                <p className="text-emi_azul">Fecha: {new Date(ultimaAsignacion.fecha).toLocaleDateString()}</p>
                <p className="text-emi_azul">Detalle: {ultimaAsignacion.detalle}</p>
                <p className="text-emi_azul">Usuario: {ultimaAsignacion.usuario.name}</p>
                <p className="text-emi_azul">Personal: {ultimaAsignacion.personal.nombre}</p>
              </div>
              <RiArrowRightLine className="text-emi_azul mx-4 text-2xl" />
              <div className="bg-white p-4 rounded-lg shadow-md flex-1">
                <h4 className="text-lg font-medium text-emi_azul">Nueva Asignación</h4>
                <p className="text-sm text-gray-600">Nombre: {selectedPersonal.nombre}</p>
                <p className="text-sm text-gray-600">Cargo: {selectedPersonal.cargo.nombre}</p>
                <p className="text-sm text-gray-600">Unidad: {selectedPersonal.unidad.nombre}</p>
              </div>
            </div>
            {showPDF && pdfData && (
              <div className="w-full mt-4" style={{ height: "400px", overflow: "auto" }}>
                <PDFViewer style={{ width: "100%", height: "100%" }}>
                  <ReasignacionDocument data={pdfData} />
                </PDFViewer>
              </div>
            )}
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={() => setCurrentStep(4)}
            >
              <RiFileTextLine className="mr-2" /> Continuar
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 4: Subir Aval de Reasignación</h3>
            <div className="mt-4">
              <label className="block text-sm font-medium text-emi_azul mb-2">
                Subir Aval de Reasignación (PDF o Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleAvalFileChange}
                className="w-full p-2 border border-emi_amarillo rounded-md"
              />
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={handleUploadAval}
            >
              <RiUploadCloud2Line className="mr-2" /> Subir Aval
            </button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 5: Confirmar Reasignación</h3>
            <div>
              <label className="block mb-2 text-sm font-medium text-emi_amarillo">Detalle</label>
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Reasignación de activos"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
              />
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-2 px-4 ${isSubmitting ? 'bg-gray-400' : 'bg-emi_amarillo'} text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center`}
            >
              {isSubmitting ? 'Reasignando...' : 'Confirmar Reasignación'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl mx-auto max-h-[80vh] overflow-y-auto">
      <div className="sticky top-0 bg-white z-10 pb-4 mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-emi_azul">
          {currentStep === 1 ? "Devolución y Reasignación de Activo" : "Reasignar Activo"}
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <RiCloseLine size="24" />
        </button>
      </div>

      <div className="flex justify-center mb-6">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mr-2 ${currentStep >= step ? 'bg-emi_amarillo text-emi_azul font-bold' : 'bg-gray-300 text-gray-600'}`}>
            {step}
          </div>
        ))}
      </div>

      {renderStepContent()}

      {currentStep > 1 && (
        <button
          className="mt-4 py-2 px-4 bg-gray-200 text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-gray-300 transition-colors"
          onClick={() => setCurrentStep(currentStep - 1)}
        >
          Anterior
        </button>
      )}
    </div>
  );
};

export default ReasignarActivos;