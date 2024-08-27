import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiUserLine, RiBriefcaseLine, RiBuildingLine, RiSearchLine, RiRefreshLine } from "react-icons/ri";
import { PDFViewer } from '@react-pdf/renderer';
import CustodyDocument from './PDF';
import axios from 'axios';
import Select from 'react-select';

const apiUrl = import.meta.env.VITE_API_URL;

const AsignarActivos = ({ onSave }) => {
  const [personal, setPersonal] = useState([]);
  const [activos, setActivos] = useState([]);
  const [filteredActivos, setFilteredActivos] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [filtroPersonal, setFiltroPersonal] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfGenerated, setPdfGenerated] = useState(false);
  const [activeModelo, setActiveModelo] = useState(null);
  const [selectedActivos, setSelectedActivos] = useState({});

  useEffect(() => {
    fetchPersonal();
    fetchActivos();
  }, []);

  const fetchPersonal = async () => {
    try {
      const response = await axios.get(`${apiUrl}/personal`);
      setPersonal(response.data.data);
    } catch (error) {
      console.error('Error fetching personal:', error);
    }
  };

  const fetchActivos = async () => {
    try {
      const response = await axios.get(`${apiUrl}/activo-modelo`);
      const activosConCantidad = response.data.data.filter(modelo => modelo.activoUnidades.filter(u => !u.asignado).length > 0);
      setActivos(activosConCantidad);
      setFilteredActivos(activosConCantidad);
    } catch (error) {
      console.error('Error fetching activos:', error);
    }
  };

  const handleSeleccionPersonal = (persona) => {
    setSelectedPersonal(persona);
    setFiltroPersonal(persona.nombre);
    setShowDropdown(false);
  };

  const handleSeleccionActivos = (modeloId, unidades) => {
    setSelectedActivos(prevSelectedActivos => ({
      ...prevSelectedActivos,
      [modeloId]: unidades
    }));
  };

  const handleSelectAll = (modeloId) => {
    const modelo = activos.find(modelo => modelo.id === modeloId);
    const unidades = modelo.activoUnidades.filter(u => !u.asignado).map(unidad => ({
      value: unidad.id,
      label: unidad.codigo,
      estado: modelo.estado,
      nombre: modelo.nombre,
      fechaIngreso: modelo.fechaIngreso,
      unidad: modelo.descripcion
    }));
    handleSeleccionActivos(modeloId, unidades);
  };

  const handleGeneratePDF = () => {
    const selectedActivosList = Object.values(selectedActivos).flat();
    if (!selectedPersonal || selectedActivosList.length === 0) {
      Swal.fire('Error', 'Por favor seleccione un personal y al menos un activo', 'error');
      return;
    }
  
    const pdfData = {
      nombre: selectedPersonal?.nombre,
      cargo: selectedPersonal?.cargo?.nombre,
      unidad: selectedPersonal?.unidad?.nombre,
      activos: selectedActivosList
    };
  
    console.log('PDF Data:', pdfData); // Asegúrate de imprimir los datos correctos
    setShowPDF(true);
    setPdfGenerated(true);
  };

  const handleAsignarActivos = async (e) => {
    e.preventDefault();
    const selectedActivosList = Object.values(selectedActivos).flat();
    const fkUsuario = localStorage.getItem('id');

    if (!selectedPersonal || selectedActivosList.length === 0) {
      Swal.fire('Error', 'Por favor seleccione un personal y al menos un activo', 'error');
      return;
    }

    const result = await Swal.fire({
      title: '¿Está seguro?',
      text: "Se asignarán los activos seleccionados.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, asignar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const activosUnidades = Object.entries(selectedActivos).map(([modeloId, unidades]) => ({
          activoModeloId: parseInt(modeloId),
          unidades: unidades.map(u => u.value)
        }));

        const fechaAsignacion = new Date().toISOString(); // Incluye fecha, hora y minutos

        const data = {
          fkUsuario,
          fkPersonal: selectedPersonal.id,
          fechaAsignacion,
          detalle: "Asignación de equipos",
          activosUnidades
        };

        await axios.post(`${apiUrl}/asignacion`, data);

        Swal.fire('¡Éxito!', 'Los activos han sido asignados con éxito.', 'success');
        onSave();
      } catch (error) {
        console.log('Error al asignar activos:', error);
        Swal.fire('Error', 'No se pudo asignar los activos.', 'error');
      }
    }
  };

  const handleFiltroModeloChange = (e) => {
    setFiltroModelo(e.target.value);
    setFilteredActivos(activos.filter(modelo => modelo.nombre.toLowerCase().includes(e.target.value.toLowerCase())));
  };

  const handleResetPersonal = () => {
    setSelectedPersonal(null);
    setFiltroPersonal('');
  };

  const toggleModeloUnidades = (modeloId) => {
    setActiveModelo(activeModelo === modeloId ? null : modeloId);
  };

  return (
    <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl w-full">
      <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_amarillo mb-8">
        Asignar <span className="text-white">Activos</span>
      </h1>
      <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
        <div className="w-full lg:w-1/2">
          <div className="mb-4">
            <div className="relative">
              <RiUserLine className="absolute top-1/2 transform -translate-y-1/2 left-2 text-emi_azul" />
              <input 
                type="text" 
                className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul"
                placeholder="Buscar personal..." 
                value={filtroPersonal} 
                onChange={e => setFiltroPersonal(e.target.value)} 
                onFocus={() => setShowDropdown(true)} 
              />
              {showDropdown && (
                <div className="absolute w-full mt-1 z-10 bg-white shadow-md max-h-60 overflow-auto rounded-lg">
                  {personal.filter(p => p.nombre.toLowerCase().includes(filtroPersonal.toLowerCase())).map(p => (
                    <div 
                      key={p.id} 
                      className="text-emi_azul p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleSeleccionPersonal(p)}
                    >
                      {p.nombre}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mb-4">
            <div className="relative">
              <RiBriefcaseLine className="absolute top-1/2 transform -translate-y-1/2 left-2 text-emi_azul" />
              <input 
                type="text" 
                readOnly 
                className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul" 
                value={selectedPersonal?.cargo?.nombre || ''} 
                placeholder="Cargo" 
              />
            </div>
          </div>
          <div className="mb-4">
            <div className="relative">
              <RiBuildingLine className="absolute top-1/2 transform -translate-y-1/2 left-2 text-emi_azul" />
              <input 
                type="text" 
                readOnly 
                className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul" 
                value={selectedPersonal?.unidad?.nombre || ''} 
                placeholder="Unidad" 
              />
            </div>
          </div>
          <button 
            type="button" 
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-[#054473] hover:text-emi_amarillo transition-colors flex items-center justify-center"
            onClick={handleResetPersonal}
          >
            <RiRefreshLine className="mr-2 inline" /> Resetear Personal
          </button>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="relative mb-4">
            <RiSearchLine className="absolute top-1/2 transform -translate-y-1/2 left-2 text-emi_azul" />
            <input 
              type="text" 
              className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul"
              placeholder="Buscar modelo de activo..." 
              value={filtroModelo} 
              onChange={handleFiltroModeloChange} 
            />
          </div>
          <div className="mb-4">
            <h3 className="text-lg text-emi_amarillo font-bold mb-2">Seleccionar Activos</h3>
            <div className="max-h-60 overflow-auto">
              {filteredActivos.map(modelo => (
                <div key={modelo.id} className="mb-4 border-b pb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-emi_amarillo cursor-pointer" onClick={() => toggleModeloUnidades(modelo.id)}>{modelo.nombre}</h4>
                      <p className="text-emi_amarillo">Cantidad disponible: {modelo.activoUnidades.filter(u => !u.asignado).length}</p>
                    </div>
                    <button 
                      className="text-emi_azul bg-emi_amarillo py-1 px-2 rounded-lg hover:bg-[#054473] hover:text-emi_amarillo transition-colors"
                      onClick={() => handleSelectAll(modelo.id)}
                    >
                      Seleccionar todos
                    </button>
                  </div>
                  {activeModelo === modelo.id && (
                    <Select
                      isMulti
                      options={modelo.activoUnidades.filter(u => !u.asignado).map(unidad => ({
                        value: unidad.id,
                        label: unidad.codigo,
                        estado: modelo.estado,
                        nombre: modelo.nombre,
                        fechaIngreso: modelo.fechaIngreso,
                        unidad: modelo.descripcion
                      }))}
                      className="basic-multi-select mt-2"
                      classNamePrefix="select"
                      onChange={(selectedOptions) => handleSeleccionActivos(modelo.id, selectedOptions)}
                      value={selectedActivos[modelo.id] || []}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button 
            type="button" 
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-[#054473] hover:text-emi_amarillo transition-colors mb-4"
            onClick={handleGeneratePDF}
          >
            Generar PDF
          </button>
        </div>
      </div>

      {showPDF && (
        <div className="w-full mt-4" style={{ height: '800px', overflow: 'auto' }}>
          <PDFViewer style={{ width: '100%', height: '100%' }}>
            <CustodyDocument 
              data={{
                nombre: selectedPersonal?.nombre,
                cargo: selectedPersonal?.cargo?.nombre,
                unidad: selectedPersonal?.unidad?.nombre
              }} 
              activos={Object.values(selectedActivos).flat()}
            />
          </PDFViewer>
        </div>
      )}
      
      {pdfGenerated && (
        <button 
          type="submit" 
          className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-[#054473] hover:text-emi_amarillo transition-colors mt-4"
          onClick={handleAsignarActivos}
        >
          Asignar Activos
        </button>
      )}
    </div>
  );
};

export default AsignarActivos;
