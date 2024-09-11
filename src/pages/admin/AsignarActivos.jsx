import React, { useState, useEffect, useMemo } from "react";
import { RiUserLine, RiBriefcaseLine, RiBuildingLine, RiSearchLine, RiRefreshLine, RiFileTextLine, RiCheckLine, RiCloseLine, RiUploadCloud2Line } from "react-icons/ri";
import { PDFViewer } from '@react-pdf/renderer';
import CustodyDocument from './PDF';
import axios from 'axios';
import Select from 'react-select';
import { message, Spin } from 'antd';
import { debounce } from 'lodash';

const apiUrl = import.meta.env.VITE_API_URL;

const PersonalSelector = ({ personal, selectedPersonal, onSelectPersonal, onResetPersonal }) => {
  const [filtroPersonal, setFiltroPersonal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const filteredPersonal = useMemo(() => {
    return personal
      .filter(p => p.nombre.toLowerCase().includes(filtroPersonal.toLowerCase()))
      .slice(0, 5); // Limit to first 5 results
  }, [personal, filtroPersonal]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <RiUserLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
        <input 
          type="text" 
          className="py-2 pl-10 pr-4 w-full text-sm text-emi_azul border border-emi_azul rounded-lg focus:ring-2 focus:ring-emi_azul focus:border-transparent"
          placeholder="Buscar personal..." 
          value={filtroPersonal} 
          onChange={e => setFiltroPersonal(e.target.value)} 
          onFocus={() => setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
          aria-label="Buscar personal"
        />
        {showDropdown && filteredPersonal.length > 0 && (
          <div className="absolute w-full mt-1 z-10 bg-white shadow-lg max-h-60 overflow-auto rounded-lg border border-emi_azul">
            {filteredPersonal.map(p => (
              <div 
                key={p.id} 
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onSelectPersonal(p);
                  setShowDropdown(false);
                }}
              >
                {p.nombre}
              </div>
            ))}
          </div>
        )}
      </div>
      {selectedPersonal && (
        <>
          <div className="relative">
            <RiBriefcaseLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
            <input 
              type="text" 
              readOnly 
              className="py-2 pl-10 pr-4 w-full text-sm bg-gray-100 text-emi_azul border border-emi_azul rounded-lg" 
              value={selectedPersonal.cargo || ''} 
              placeholder="Cargo" 
              aria-label="Cargo del personal seleccionado"
            />
          </div>
          <div className="relative">
            <RiBuildingLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
            <input 
              type="text" 
              readOnly 
              className="py-2 pl-10 pr-4 w-full text-sm bg-gray-100 text-emi_azul border border-emi_azul rounded-lg" 
              value={selectedPersonal.unidad || ''} 
              placeholder="Unidad" 
              aria-label="Unidad del personal seleccionado"
            />
          </div>
        </>
      )}
      <button 
        type="button" 
        className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
        onClick={onResetPersonal}
        aria-label="Resetear selección de personal"
      >
        <RiRefreshLine className="mr-2" /> Resetear Personal
      </button>
    </div>
  );
};

const ActivosSelector = ({ activos, selectedActivos, onSelectActivos }) => {
  const [filtroModelo, setFiltroModelo] = useState('');
  const [activeModelo, setActiveModelo] = useState(null);

  const filteredActivos = useMemo(() => {
    return activos.filter(modelo => modelo.nombre.toLowerCase().includes(filtroModelo.toLowerCase()));
  }, [activos, filtroModelo]);

  const handleSelectAll = (modeloId) => {
    const modelo = activos.find(m => m.id === modeloId);
    const unidades = modelo.activoUnidades
      .filter(u => !u.asignado && u.estadoCondicion !== 'BAJA' && u.estadoCondicion !== 'REASIGNADO')
      .map(unidad => ({
        value: unidad.id,
        label: unidad.codigo,
        estado: modelo.estado,
        nombre: modelo.nombre,
        fechaIngreso: modelo.fechaIngreso,
        unidad: modelo.descripcion
      }));
    onSelectActivos(modeloId, unidades);
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <RiSearchLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
        <input 
          type="text" 
          className="py-2 pl-10 pr-4 w-full text-sm text-emi_azul border border-emi_azul rounded-lg focus:ring-2 focus:ring-emi_azul focus:border-transparent"
          placeholder="Buscar modelo de activo..." 
          value={filtroModelo} 
          onChange={e => setFiltroModelo(e.target.value)}
          aria-label="Buscar modelo de activo" 
        />
      </div>
      <div className="max-h-60 overflow-auto space-y-4">
        {filteredActivos.map(modelo => (
          <div key={modelo.id} className="border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className="text-emi_azul font-semibold cursor-pointer" onClick={() => setActiveModelo(activeModelo === modelo.id ? null : modelo.id)}>
                  {modelo.nombre}
                </h4>
                <p className="text-sm text-gray-600">
                  Cantidad disponible: {modelo.activoUnidades.filter(u => !u.asignado && u.estadoCondicion !== 'BAJA' && u.estadoCondicion !== 'REASIGNADO').length}
                </p>
              </div>
              <button 
                className="py-1 px-2 bg-emi_amarillo text-emi_azul text-xs font-semibold rounded hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
                onClick={() => handleSelectAll(modelo.id)}
                aria-label={`Seleccionar todos los activos de ${modelo.nombre}`}
              >
                Seleccionar todos
              </button>
            </div>
            {activeModelo === modelo.id && (
              <Select
                isMulti
                options={modelo.activoUnidades
                  .filter(u => !u.asignado && u.estadoCondicion !== 'BAJA' && u.estadoCondicion !== 'REASIGNADO')
                  .map(unidad => ({
                    value: unidad.id,
                    label: unidad.codigo,
                    estado: modelo.estado,
                    nombre: modelo.nombre,
                    fechaIngreso: modelo.fechaIngreso,
                    unidad: modelo.descripcion
                  }))}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={(selectedOptions) => onSelectActivos(modelo.id, selectedOptions)}
                value={selectedActivos[modelo.id] || []}
                aria-label={`Seleccionar unidades de ${modelo.nombre}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AsignarActivos = ({ onSave }) => {
  const [personal, setPersonal] = useState([]);
  const [activos, setActivos] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [selectedActivos, setSelectedActivos] = useState({});
  const [showPDF, setShowPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [avalFile, setAvalFile] = useState(null);
  const [avalFileUrl, setAvalFileUrl] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPersonal();
    fetchActivos();
  }, []);

  const fetchPersonal = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/personal`);
      setPersonal(response.data.data);
    } catch (error) {
      console.error('Error fetching personal:', error);
      message.error('No se pudo cargar la lista de personal.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActivos = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/activo-modelo`);
      const activosConCantidad = response.data.data.filter(modelo => modelo.activoUnidades.filter(u => !u.asignado).length > 0);
      setActivos(activosConCantidad);
    } catch (error) {
      console.error('Error fetching activos:', error);
      message.error('No se pudo cargar la lista de activos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeleccionPersonal = (persona) => {
    setSelectedPersonal(persona);
    setCurrentStep(2);
  };

  const handleResetPersonal = () => {
    setSelectedPersonal(null);
    setCurrentStep(1);
  };

  const handleSeleccionActivos = (modeloId, unidades) => {
    setSelectedActivos(prevSelectedActivos => ({
      ...prevSelectedActivos,
      [modeloId]: unidades
    }));
  };

  const handleGeneratePDF = () => {
    console.log(selectedActivos);
    console.log(selectedPersonal);
    const selectedActivosList = Object.values(selectedActivos).flat();
    if (!selectedPersonal || selectedActivosList.length === 0) {
      message.error('Por favor seleccione un personal y al menos un activo');
      return;
    }
  
    setShowPDF(true);
    setPdfGenerated(true);
    setCurrentStep(3);
  };

  const handleAvalFileChange = (event) => {
    const file = event.target.files[0];
    setAvalFile(file);
  };

  const handleUploadAval = async () => {
    if (!avalFile) {
      message.error('Por favor seleccione un archivo para el aval');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', avalFile);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setAvalFileUrl(response.data.url);
      message.success('Aval subido correctamente');
      setCurrentStep(4);
    } catch (error) {
      console.error('Error al subir el aval:', error);
      message.error('No se pudo subir el aval');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAsignarActivos = async () => {
    const selectedActivosList = Object.values(selectedActivos).flat();
    const fkUsuario = localStorage.getItem('id');

    if (!selectedPersonal || selectedActivosList.length === 0 || !avalFileUrl) {
      message.error('Por favor complete todos los pasos antes de asignar');
      return;
    }

    setIsAssigning(true);
    setIsLoading(true);

    try {
      const activosUnidades = Object.entries(selectedActivos).map(([modeloId, unidades]) => ({
        activoModeloId: parseInt(modeloId),
        unidades: unidades.map(u => u.value)
      }));

      const fechaAsignacion = new Date().toISOString();

      const data = {
        fkUsuario,
        fkPersonal: selectedPersonal.id,
        avalAsignacion: avalFileUrl,
        fechaAsignacion,
        detalle: "Asignación de equipos",
        activosUnidades
      };

      await axios.post(`${apiUrl}/asignacion`, data);

      message.success('Los activos han sido asignados con éxito.');
      onSave();
    } catch (error) {
      console.error('Error al asignar activos:', error);
      message.error('No se pudo asignar los activos.');
    } finally {
      setIsAssigning(false);
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-emi_azul mb-4">Paso 1: Seleccionar Personal</h2>
            <PersonalSelector 
              personal={personal}
              selectedPersonal={selectedPersonal}
              onSelectPersonal={handleSeleccionPersonal}
              onResetPersonal={handleResetPersonal}
            />
          </div>
        );
      case 2:
        return (
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-emi_azul mb-4">Paso 2: Seleccionar Activos</h2>
            <ActivosSelector 
              activos={activos}
              selectedActivos={selectedActivos}
              onSelectActivos={handleSeleccionActivos}
            />
            {Object.keys(selectedActivos).length > 0 && (
              <button 
                className="mt-4 w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
                onClick={handleGeneratePDF}
              >
                <RiFileTextLine className="mr-2" /> Generar PDF
              </button>
            )}
          </div>
        );
      case 3:
        return (
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-emi_azul mb-4">Paso 3: Revisar y Subir Aval</h2>
            {showPDF && (
              <div className="w-full mt-4 h-64 overflow-auto border border-gray-300 rounded-lg mb-4">
                <PDFViewer width="100%" height="100%">
                  <CustodyDocument 
                    data={{
                      nombre: selectedPersonal?.nombre || '',
                      cargo: selectedPersonal?.cargo?.nombre || '',
                      unidad: selectedPersonal?.unidad?.nombre || ''
                    }}
                    activos={Object.values(selectedActivos).flat()}
                  />
                </PDFViewer>
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-emi_azul mb-2">
                Subir Aval de Asignación (PDF o Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleAvalFileChange}
                className="w-full p-2 border border-emi_amarillo rounded-md"
              />
            </div>
            <button 
              className="mt-4 w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={handleUploadAval}
              disabled={isLoading}
            >
              <RiUploadCloud2Line className="mr-2" /> 
              {isLoading ? 'Subiendo...' : 'Subir Aval'}
            </button>
          </div>
        );
      case 4:
        return (
          <div className="bg-gray-50 p-4 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-emi_azul mb-4">Paso 4: Confirmar Asignación</h2>
            <div className="mb-4">
              <h3 className="font-medium text-emi_azul">Resumen de Asignación:</h3>
              <p>Personal: {selectedPersonal.nombre}</p>
              <p>Activos: {Object.values(selectedActivos).flat().length}</p>
              <p>Aval: Subido correctamente</p>
            </div>
            <button 
              className={`w-full py-2 px-4 ${isAssigning || isLoading ? 'bg-gray-400' : 'bg-emi_amarillo'} text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center`}
              onClick={handleAsignarActivos}
              disabled={isAssigning || isLoading}
            >
              <RiCheckLine className="mr-2" /> 
              {isAssigning ? 'Asignando...' : 'Confirmar Asignación'}
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
        <h1 className="text-2xl font-bold text-emi_azul">
          Asignar Activos
        </h1>
        <button onClick={onSave} className="text-gray-500 hover:text-gray-700">
          <RiCloseLine size="24" />
        </button>
      </div>

      <div className="flex justify-center mb-6">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mr-2 ${currentStep >= step ? 'bg-emi_amarillo text-emi_azul font-bold' : 'bg-gray-300 text-gray-600'}`}>
            {step}
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
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
};

export default AsignarActivos;