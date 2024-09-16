import React, { useState, useEffect, useMemo } from 'react';
import { RiCloseLine, RiSearchLine, RiUserLine, RiRefreshLine, RiFileTextLine, RiUploadCloud2Line, RiCheckLine } from 'react-icons/ri';
import axios from 'axios';
import { PDFViewer } from '@react-pdf/renderer';
import CustodyDocument from './PDF';
import Select from 'react-select';
import { message, Spin } from 'antd';

const apiUrl = import.meta.env.VITE_API_URL;

export default function AsignarActivos({ onClose, onAssignmentComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [personal, setPersonal] = useState([]);
  const [activos, setActivos] = useState([]);
  const [filteredPersonal, setFilteredPersonal] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedActivos, setSelectedActivos] = useState({});
  const [showPDF, setShowPDF] = useState(false);
  const [avalFile, setAvalFile] = useState(null);
  const [avalFileUrl, setAvalFileUrl] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [assetSearchTerm, setAssetSearchTerm] = useState('');

  useEffect(() => {
    fetchPersonal();
  }, []);

  const fetchPersonal = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/personal/activos`);
      setPersonal(response.data.data);
      setFilteredPersonal(response.data.data);
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
      const activosDisponibles = response.data.data.filter(modelo => 
        modelo.activoUnidades.some(u => !u.asignado && u.estadoCondicion !== 'BAJA')
      );
      setActivos(activosDisponibles);
    } catch (error) {
      console.error('Error fetching activos:', error);
      message.error('No se pudo cargar la lista de activos disponibles.');
    } finally {
      setIsLoading(false);
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

  const handleSelectPerson = async (person) => {
    setSelectedPerson(person);
    setSearchTerm(person.nombre);
    setFilteredPersonal([]);
    await fetchActivos();
    setCurrentStep(2);
  };

  const handleSelectActivos = (modeloId, unidades) => {
  
    setSelectedActivos(prevSelectedActivos => ({
      ...prevSelectedActivos,
      [modeloId]: unidades
    }));
  };

  const handleGeneratePDF = () => {
    const selectedActivosList = Object.values(selectedActivos).flat();
    
    if (selectedActivosList.length === 0) {
      message.error('Por favor seleccione al menos un activo');
      return;
    }
  
    // Mapea los activos seleccionados al formato que necesita el PDF
    const activosParaPDF = selectedActivosList.map(activo => {
      const [codigo, estadoActual] = activo.label.split(' - '); // Divide el label en código y estadoActual
  
      // Encuentra el modelo completo en la lista de activos para obtener descripción y fechaIngreso
      const modelo = activos.find(m => m.activoUnidades.some(u => u.id === activo.value));
      const unidad = modelo?.activoUnidades.find(u => u.id === activo.value);
  
      return {
        codigo: unidad?.codigo || codigo,
        estadoActual: unidad?.estadoActual || estadoActual,
        descripcion: modelo?.descripcion || 'Descripción no disponible',
        fechaIngreso: modelo?.fechaIngreso || 'Fecha no disponible',
      };
    });
  
    setShowPDF(true);
    setCurrentStep(3);
  
    // Al pasar los datos al PDF, ahora estarán en el formato adecuado
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

    if (!selectedPerson || selectedActivosList.length === 0 || !avalFileUrl) {
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
        fkPersonal: selectedPerson.id,
        avalAsignacion: avalFileUrl,
        fechaAsignacion,
        detalle: "Asignación de equipos",
        activosUnidades
      };

      await axios.post(`${apiUrl}/asignacion`, data);

      message.success('Los activos han sido asignados con éxito.');
      onAssignmentComplete();
      onClose();
    } catch (error) {
      console.error('Error al asignar activos:', error);
      message.error('No se pudo asignar los activos.');
    } finally {
      setIsAssigning(false);
      setIsLoading(false);
    }
  };

  const filteredActivos = useMemo(() => {
    return activos.filter(modelo => 
      modelo.nombre.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
      modelo.descripcion.toLowerCase().includes(assetSearchTerm.toLowerCase())
    );
  }, [activos, assetSearchTerm]);

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
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 2: Seleccionar Activos</h3>
            <div className="relative mb-4">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar activos..."
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emi_azul focus:border-transparent"
              />
            </div>
            {filteredActivos.length > 0 ? (
              <div className="max-h-60 overflow-auto">
                {filteredActivos.map(modelo => {
                  const availableUnits = modelo.activoUnidades.filter(u => !u.asignado && u.estadoCondicion !== 'BAJA');
                  if (availableUnits.length === 0) return null;
                  
                  return (
                    <div key={modelo.id} className="border-b pb-4 mb-4">
                      <h4 className="font-semibold text-emi_azul mb-2">{modelo.nombre}</h4>
                      <p className="text-sm text-gray-600 mb-2">{modelo.descripcion}</p>
                      <Select
  isMulti
  options={availableUnits.map(unidad => ({
    value: unidad.id,
    label: `${unidad.codigo} - ${unidad.estadoActual}`
  }))}
  onChange={(selectedOptions) => handleSelectActivos(modelo.id, selectedOptions)}
  value={selectedActivos[modelo.id] || []}
  placeholder="Seleccionar unidades..."
  className="basic-multi-select"
  classNamePrefix="select"
  styles={{
    option: (provided, state) => ({
      ...provided,
      color: state.isSelected ? 'white' : '#054473', // emi_azul color
      backgroundColor: state.isSelected ? '#054473' : state.isFocused ? '#e6f7ff' : null,
    }),
    control: (provided) => ({
      ...provided,
      borderColor: '#054473',
      '&:hover': {
        borderColor: '#054473',
      },
    }),
    singleValue: (provided) => ({
      ...provided,
      color: '#054473', // emi_azul color
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e6f7ff',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: '#054473', // emi_azul color
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: '#054473',
      ':hover': {
        backgroundColor: '#054473',
        color: 'white',
      },
    }),
  }}
/>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-600">No hay activos disponibles para asignar.</p>
            )}
            {Object.keys(selectedActivos).length > 0 && (
              <button 
                className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
                onClick={handleGeneratePDF}
              >
                <RiFileTextLine className="mr-2" /> Generar PDF
              </button>
            )}
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-emi_azul mb-4">Paso 3: Revisar y Subir Aval</h3>
            {showPDF && (
  <div className="w-full h-64 border border-gray-300 rounded-lg overflow-hidden">
    <PDFViewer width="100%" height="100%">
      <CustodyDocument 
        data={{
          nombre: selectedPerson?.nombre || '',
          cargo: selectedPerson?.cargo?.nombre || '',
          unidad: selectedPerson?.unidad?.nombre || ''
        }}
        activos={
          Object.values(selectedActivos)
            .flat()
            .map(activo => {
              const [codigo, estadoActual] = activo.label.split(' - '); // Divide el label en código y estadoActual
              
              // Encuentra el modelo completo en la lista de activos
              const modelo = activos.find(m => m.activoUnidades.some(u => u.id === activo.value));
              const unidad = modelo?.activoUnidades.find(u => u.id === activo.value);
              return {
                codigo: unidad?.codigo || codigo,
                estadoActual: unidad?.estadoActual || estadoActual,
                descripcion: modelo?.descripcion || 'Descripción no disponible',
                fechaIngreso: modelo?.fechaIngreso || 'Fecha no disponible',
              };
            })
        }
      />
    </PDFViewer>
  </div>
)}

            <div>
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
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
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
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-emi_azul mb-4">Paso 4: Confirmar Asignación</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-emi_azul mb-2">Resumen de Asignación:</h4>
              <p>Personal: {selectedPerson.nombre}</p>
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
    <div className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emi_azul">Asignar Activos</h2>
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
}