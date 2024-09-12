import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { RiUserLine, RiSearchLine, RiCheckboxCircleLine, RiFileTextLine, RiUploadCloud2Line } from "react-icons/ri";
import { PDFViewer } from '@react-pdf/renderer';
import DevolucionDocument from './DevolucionDocument';

function DevolucionActivos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [personal, setPersonal] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [activos, setActivos] = useState([]);
  const [selectedActivos, setSelectedActivos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [actaFile, setActaFile] = useState(null);
  const [actaFileUrl, setActaFileUrl] = useState(null);
  const [detalle, setDetalle] = useState("");

  const apiUrl = "http://localhost:3000"; // Replace with your actual API URL

  useEffect(() => {
    fetchPersonal();
  }, []);

  const fetchPersonal = async () => {
    try {
      const response = await axios.get(`${apiUrl}/personal`);

      setPersonal(response.data.data);
    } catch (error) {
      console.error("Error fetching personal:", error);
      toast.error("No se pudo cargar la lista de personal.");
    }
  };

  const filteredPersonal = useMemo(() => {
    return personal.filter(p => 
      p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ci.includes(searchTerm)
    );
  }, [personal, searchTerm]);

  const handleSelectPersonal = async (persona) => {
    setSelectedPersonal(persona);
    try {
      const response = await axios.get(`${apiUrl}/devolucion/activos/${persona.id}`);
      setActivos(response.data.data);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error al obtener activos:", error);
      toast.error("Hubo un problema al obtener los activos.");
    }
  };

  const handleActivoSelection = (activoId) => {
    setSelectedActivos(prev =>
      prev.includes(activoId)
        ? prev.filter(id => id !== activoId)
        : [...prev, activoId]
    );
  };

  const generatePDFData = () => {
    if (!selectedPersonal || selectedActivos.length === 0) return;

    const pdfData = {
      nombre: selectedPersonal.nombre,
      cargo: selectedPersonal.cargo.nombre,
      unidad: selectedPersonal.unidad.nombre,
      activos: activos.filter(activo => selectedActivos.includes(activo.id))
    };

    setPdfData(pdfData);
    setShowPDF(true);
  };

  const handleActaFileChange = (event) => {
    const file = event.target.files[0];
    setActaFile(file);
  };

  const handleUploadActa = async () => {
    if (!actaFile) {
      toast.error('Por favor seleccione un archivo para el acta de devolución');
      return;
    }

    const formData = new FormData();
    formData.append('file', actaFile);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setActaFileUrl(response.data.url);
      toast.success('Acta de devolución subida correctamente');
      setCurrentStep(4);
    } catch (error) {
      console.error('Error al subir el acta:', error);
      toast.error('No se pudo subir el acta de devolución');
    }
  };

  const handleDevolucion = async () => {
    if (selectedActivos.length === 0 || !actaFileUrl) {
      toast.warn("Por favor, seleccione al menos un activo y suba el acta de devolución.");
      return;
    }

    setIsSubmitting(true);

    const devolucionData = {
      fkPersonal: selectedPersonal.id,
      fkUsuario: localStorage.getItem("id"),
      fecha: new Date().toISOString(),
      detalle: detalle || "Devolución de activos",
      actaDevolucion: actaFileUrl,
      activosUnidades: selectedActivos.map(id => ({ fkActivoUnidad: id })),
    };

    try {
      const response = await axios.post(`${apiUrl}/devolucion`, devolucionData);
      if (response.status === 201) {
        toast.success("Los activos han sido devueltos correctamente.");
        setSelectedActivos([]);
        setActivos(activos.filter(activo => !selectedActivos.includes(activo.id)));
        setCurrentStep(1);
      } else {
        throw new Error("La respuesta del servidor no fue exitosa");
      }
    } catch (error) {
      console.error("Error al realizar la devolución:", error);
      toast.error("Hubo un problema al realizar la devolución.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 1: Seleccionar Personal</h3>
            <div className="relative">
              <RiUserLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
              <input
                className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emi_azul"
                type="text"
                placeholder="Buscar por nombre o CI"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-4 max-h-60 overflow-y-auto">
              {filteredPersonal.map((persona) => (
                <div
                  key={persona.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg flex items-center"
                  onClick={() => handleSelectPersonal(persona)}
                >
                  <RiUserLine className="mr-2 text-emi_azul" />
                  <div>
                    <p className="font-medium text-emi_azul">{persona.nombre}</p>
                    <p className="text-sm text-gray-600">{persona.ci}  -{persona.cargo.nombre }- {persona.unidad.nombre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 2: Seleccionar Activos a Devolver</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-emi_azul text-white">
                  <tr>
                    <th className="w-1/12 text-left py-3 px-4 uppercase font-semibold text-sm">Seleccionar</th>
                    <th className="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Código</th>
                    <th className="w-3/12 text-left py-3 px-4 uppercase font-semibold text-sm">Nombre</th>
                    <th className="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Estado</th>
                    <th className="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Costo Actual</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {activos.map((activo) => (
                    <tr key={activo.id} className="border-b hover:bg-gray-100">
                      <td className="w-1/12 text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedActivos.includes(activo.id)}
                          onChange={() => handleActivoSelection(activo.id)}
                          className="form-checkbox h-5 w-5 text-emi_azul"
                        />
                      </td>
                      <td className="w-2/12 text-left py-3 px-4">{activo.codigo}</td>
                      <td className="w-3/12 text-left py-3 px-4">{activo.nombre}</td>
                      <td className="w-2/12 text-left py-3 px-4">{activo.estadoActual}</td>
                      <td className="w-2/12 text-left py-3 px-4">{activo.costoActual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={() => {
                generatePDFData();
                setCurrentStep(3);
              }}
              disabled={selectedActivos.length === 0}
            >
              <RiFileTextLine className="mr-2" /> Continuar
            </button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 3: Revisar y Subir Acta de Devolución</h3>
            {showPDF && pdfData && (
              <div className="w-full mt-4" style={{ height: "400px", overflow: "auto" }}>
                <PDFViewer style={{ width: "100%", height: "100%" }}>
                  <DevolucionDocument data={pdfData} />
                </PDFViewer>
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-emi_azul mb-2">
                Subir Acta de Devolución (PDF o Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleActaFileChange}
                className="w-full p-2 border border-emi_amarillo rounded-md"
              />
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={handleUploadActa}
            >
              <RiUploadCloud2Line className="mr-2" /> Subir Acta
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 4: Confirmar Devolución</h3>
            <div>
              <label className="block mb-2 text-sm font-medium text-emi_amarillo">Detalle</label>
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Devolución de activos"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
              />
            </div>
            <button
              type="button"
              onClick={handleDevolucion}
              disabled={isSubmitting}
              className={`w-full py-2 px-4 ${isSubmitting ? 'bg-gray-400' : 'bg-emi_amarillo'} text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center`}
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Devolución'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-emi_azul">Devolución de Activos</h1>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex justify-center mb-6">
          {[1, 2, 3, 4].map((step) => (
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
    </div>
  );
}

export default DevolucionActivos;