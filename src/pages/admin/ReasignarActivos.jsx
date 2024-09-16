import React, { useState, useEffect } from 'react';
import { RiCloseLine, RiSearchLine, RiUserLine, RiFileTextLine, RiUploadCloud2Line, RiCheckLine } from 'react-icons/ri';
import axios from 'axios';
import { PDFViewer } from '@react-pdf/renderer';
import DevolucionDocument from './DevolucionDocument';
import ReasignacionDocument from './PDFReasignacion';
import { message } from 'antd';

const apiUrl = import.meta.env.VITE_API_URL;

export default function ReasignarActivos({ onClose, onReasignmentComplete, activoUnidadId }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [personal, setPersonal] = useState([]);
  const [ultimaAsignacion, setUltimaAsignacion] = useState(null);
  const [filteredPersonal, setFilteredPersonal] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [showDevolucionPDF, setShowDevolucionPDF] = useState(false);
  const [showReasignacionPDF, setShowReasignacionPDF] = useState(false);
  const [actaDevolucionFile, setActaDevolucionFile] = useState(null);
  const [actaDevolucionUrl, setActaDevolucionUrl] = useState(null);
  const [avalReasignacionFile, setAvalReasignacionFile] = useState(null);
  const [avalReasignacionUrl, setAvalReasignacionUrl] = useState(null);
  const [isReasigning, setIsReasigning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [detalle, setDetalle] = useState('');
  

  useEffect(() => {
    fetchPersonal();
    fetchUltimaAsignacion();
  }, [activoUnidadId]);

  const fetchPersonal = async () => {
    setIsLoading(true);
    setLoadingMessage('Cargando lista de personal...');
    try {
      const response = await axios.get(`${apiUrl}/personal/activos`);
      setPersonal(response.data.data);
      setFilteredPersonal(response.data.data);
    } catch (error) {
      console.error('Error fetching personal:', error);
      message.error('No se pudo cargar la lista de personal.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const fetchUltimaAsignacion = async () => {
    setIsLoading(true);
    setLoadingMessage('Obteniendo información de la última asignación...');
    try {
      const response = await axios.get(`${apiUrl}/reasignacion/ultima-asignacion/${activoUnidadId}`);
      setUltimaAsignacion(response.data.data);
    } catch (error) {
      console.error('Error fetching ultima asignacion:', error);
      message.error('No se pudo obtener la información de la última asignación.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = personal.filter(person => 
      person.nombre.toLowerCase().includes(term) ||
      person.ci.includes(term)
    );
    setFilteredPersonal(filtered);
  };

  const handleSelectPerson = (person) => {
    setSelectedPerson(person);
    setSearchTerm(person.nombre);
    setFilteredPersonal([]);
    setCurrentStep(3);
  };

  const handleGenerateDevolucionPDF = () => {
    setShowDevolucionPDF(true);
    setCurrentStep(2);
  };

  const handleGenerateReasignacionPDF = () => {
    if (!selectedPerson) {
      message.error('Por favor seleccione un nuevo responsable');
      return;
    }
    setShowReasignacionPDF(true);
    setCurrentStep(4);
  };

  const handleFileChange = (event, setFileFunction) => {
    const file = event.target.files[0];
    setFileFunction(file);
  };

  const handleUploadFile = async (file, setUrlFunction, fileType) => {
    if (!file) {
      message.error(`Por favor seleccione un archivo para ${fileType}`);
      return false;
    }

    setIsLoading(true);
    setLoadingMessage(`Subiendo ${fileType}...`);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setUrlFunction(response.data.url);
      message.success(`${fileType} subido correctamente`);
      return true;
    } catch (error) {
      console.error(`Error al subir ${fileType}:`, error);
      message.error(`No se pudo subir ${fileType}`);
      return false;
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleReasignarActivo = async () => {
    if (!selectedPerson || !actaDevolucionUrl || !avalReasignacionUrl) {
      message.error('Por favor complete todos los pasos antes de reasignar');
      return;
    }

    setIsReasigning(true);
    setIsLoading(true);
    setLoadingMessage('Procesando reasignación...');

    try {
      // Primero, realizar la devolución
      const devolucionData = {
        fkPersonal: ultimaAsignacion.personal.id,
        fkUsuario: localStorage.getItem('id'),
        fecha: new Date().toISOString(),
        detalle: detalle || 'Devolución de activo para reasignación',
        actaDevolucion: actaDevolucionUrl,
        activosUnidades: [{ fkActivoUnidad: activoUnidadId }],
      };

      await axios.post(`${apiUrl}/devolucion`, devolucionData);

      // Luego, realizar la reasignación
      const reasignacionData = {
        fkActivoUnidad: activoUnidadId,
        fkUsuarioAnterior: ultimaAsignacion.usuario.id,
        fkUsuarioNuevo: localStorage.getItem('id'),
        fkPersonalAnterior: ultimaAsignacion.personal.id,
        fkPersonalNuevo: selectedPerson.id,
        detalle: detalle || 'Reasignación de activo',
        fechaReasignacion: new Date().toISOString(),
        avalReasignacion: avalReasignacionUrl,
      };

      await axios.post(`${apiUrl}/reasignacion`, reasignacionData);

      message.success('Reasignación completada exitosamente.');
      onReasignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error al realizar la reasignación:', error);
      message.error('Hubo un problema al realizar la reasignación.');
    } finally {
      setIsReasigning(false);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 1: Devolución de Activo</h3>
            {ultimaAsignacion && (
              <div className="bg-white p-4 rounded-lg shadow-md">
                <h4 className="text-lg text-emi_azul font-bold mb-2">Activo a Devolver</h4>
                <p className="text-emi_azul">Código: {ultimaAsignacion.activoUnidad.codigo}</p>
                <p className="text-emi_azul">Descripción: {ultimaAsignacion.activoUnidad.descripcion}</p>
                <p className="text-emi_azul">Estado: {ultimaAsignacion.activoUnidad.estadoActual}</p>
                <p className="text-emi_azul">Asignado a: {ultimaAsignacion.personal.nombre}</p>
              </div>
            )}
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={handleGenerateDevolucionPDF}
            >
              <RiFileTextLine className="mr-2" /> Generar Documento de Devolución
            </button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 2: Revisar y Subir Acta de Devolución</h3>
            {showDevolucionPDF && ultimaAsignacion && (
              <PDFViewer width="100%" height="500px">
                <DevolucionDocument data={{
                  nombre: ultimaAsignacion.personal.nombre,
                  cargo: ultimaAsignacion.personal.cargo.nombre,
                  unidad: ultimaAsignacion.personal.unidad.nombre,
                  activos: [{
                    codigo: ultimaAsignacion.activoUnidad.codigo,
                    nombre: ultimaAsignacion.activoUnidad.descripcion,
                    estadoActual: ultimaAsignacion.activoUnidad.estadoActual,
                    costoActual: ultimaAsignacion.activoUnidad.costoActual
                  }]
                }} />
              </PDFViewer>
            )}
            <div>
              <label className="block text-sm font-medium text-emi_azul mb-2">
                Subir Acta de Devolución (PDF o Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileChange(e, setActaDevolucionFile)}
                className="w-full p-2 border border-emi_amarillo rounded-md"
              />
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={() => handleUploadFile(actaDevolucionFile, setActaDevolucionUrl, 'Acta de Devolución').then(success => {
                if (success) setCurrentStep(3);
              })}
              disabled={isLoading}
            >
              <RiUploadCloud2Line className="mr-2" /> 
              {isLoading ? 'Subiendo...' : 'Subir Acta de Devolución'}
            </button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 3: Seleccionar Nuevo Responsable</h3>
            <div className="relative">
              <RiUserLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
              <input
                className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emi_azul"
                type="text"
                placeholder="Buscar por nombre o CI"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
            <div className="mt-4 max-h-60 overflow-y-auto">
              {filteredPersonal.map((persona) => (
                <div
                  key={persona.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg flex items-center"
                  onClick={() => handleSelectPerson(persona)}
                >
                  <RiUserLine className="mr-2 text-emi_azul" />
                  <div>
                    <p className="font-medium text-emi_azul">{persona.nombre}</p>
                    <p className="text-sm text-gray-600">{persona.ci} - {persona.cargo.nombre} - {persona.unidad.nombre}</p>
                  </div>
                </div>
              ))}
            </div>
            {selectedPerson && (
              <button 
                className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
                onClick={handleGenerateReasignacionPDF}
              >
                <RiFileTextLine className="mr-2" /> Generar Documento de Reasignación
              </button>
            )}
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 4: Revisar y Confirmar Reasignación</h3>
            {showReasignacionPDF && ultimaAsignacion && selectedPerson && (
              <PDFViewer width="100%" height="500px">
                <ReasignacionDocument data={{
                  nombre: selectedPerson.nombre,
                  cargo: selectedPerson.cargo.nombre,
                  unidad: selectedPerson.unidad.nombre,
                  activos: [{
                    codigo: ultimaAsignacion.activoUnidad.codigo,
                    nombre: ultimaAsignacion.activoUnidad.descripcion,
                    estado: ultimaAsignacion.activoUnidad.estadoActual,
                    fechaIngreso: ultimaAsignacion.activoUnidad.fechaIngreso
                  }]
                }} />
              </PDFViewer>
            )}
            <div>
              <label className="block text-sm font-medium text-emi_azul mb-2">
                Subir Aval de Reasignación (PDF o Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileChange(e, setAvalReasignacionFile)}
                className="w-full p-2 border border-emi_amarillo rounded-md"
              />
            </div>
            <div>
              <label className="block mb-2 text-sm font-medium text-emi_azul">Detalle (opcional)</label>
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Detalles de la reasignación"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
              />
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={() => handleUploadFile(avalReasignacionFile, setAvalReasignacionUrl, 'Aval de Reasignación')}
              disabled={isLoading}
            >
              <RiUploadCloud2Line className="mr-2" /> 
              {isLoading ? 'Subiendo...' : 'Subir Aval de Reasignación'}
            </button>
            <button
              className={`w-full py-2 px-4 ${isReasigning || isLoading ? 'bg-gray-400' : 'bg-emi_amarillo'} text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center`}
              onClick={handleReasignarActivo}
              disabled={isReasigning || isLoading}
            >
              <RiCheckLine className="mr-2" /> 
              {isReasigning ? 'Reasignando...' : 'Confirmar Reasignación'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emi_azul">Reasignar Activo</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
          <RiCloseLine size="24" />
        </button>
      </div>

      <div className="flex justify-center mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mr-2 ${currentStep >= step ? 'bg-emi_amarillo text-emi_azul font-bold' : 'bg-gray-200 text-gray-600'}`}>
            {step}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col justify-center items-center h-64">
          <div className="w-16 h-16 border-t-4 border-emi_azul border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-emi_azul font-semibold">{loadingMessage}</p>
        </div>
      ) : (
        renderStepContent()
      )}

      {currentStep > 1 && (
        <button
          className="mt-4 py-2 px-4 bg-gray-200 text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-gray-300 transition-colors"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={isLoading}
        >
          Anterior
        </button>
      )}
    </div>
  );
}