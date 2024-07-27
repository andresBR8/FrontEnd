import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiUserLine, RiBriefcaseLine, RiBuildingLine, RiCheckboxBlankLine, RiCheckboxLine, RiCheckboxMultipleLine, RiSearchLine, RiRefreshLine } from "react-icons/ri";
import { PDFViewer } from '@react-pdf/renderer';
import CustodyDocument from './PDF';
import axios from 'axios';

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

  useEffect(() => {
    axios.get(`${apiUrl}/personal`)
      .then(response => setPersonal(response.data.data))
      .catch(error => console.error('Error fetching personal:', error));

    axios.get(`${apiUrl}/activo-modelo`)
      .then(response => {
        setActivos(response.data.data);
        setFilteredActivos(response.data.data);
      })
      .catch(error => console.error('Error fetching activos:', error));
  }, []);

  const handleSeleccionPersonal = (persona) => {
    setSelectedPersonal(persona);
    setFiltroPersonal(persona.nombre);
    setShowDropdown(false);
  };

  const toggleSeleccion = (modeloId, unidadId) => {
    setActivos(prevActivos => prevActivos.map(modelo => (
      modelo.id === modeloId
        ? {
          ...modelo,
          activoUnidades: modelo.activoUnidades.map(unidad => (
            unidad.id === unidadId ? { ...unidad, seleccionado: !unidad.seleccionado } : unidad
          ))
        }
        : modelo
    )));
  };

  const toggleSeleccionarTodos = (modeloId) => {
    setActivos(prevActivos => prevActivos.map(modelo => (
      modelo.id === modeloId
        ? {
          ...modelo,
          activoUnidades: modelo.activoUnidades.map(unidad => (
            { ...unidad, seleccionado: !modelo.activoUnidades.every(u => u.seleccionado) }
          ))
        }
        : modelo
    )));
  };

  const handleGeneratePDF = () => {
    const selectedActivos = activos.flatMap(modelo => modelo.activoUnidades.filter(unidad => unidad.seleccionado));
    if (!selectedPersonal || selectedActivos.length === 0) {
      Swal.fire('Error', 'Por favor seleccione un personal y al menos un activo', 'error');
      return;
    }
    setShowPDF(true);
    setPdfGenerated(true);
  };

  const handleAsignarActivos = async (e) => {
    e.preventDefault();
    const selectedActivos = activos.flatMap(modelo => modelo.activoUnidades.filter(unidad => unidad.seleccionado));
    const fk_Usuario = localStorage.getItem('id');

    if (!selectedPersonal || selectedActivos.length === 0) {
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
        const activosUnidades = selectedActivos.reduce((acc, unidad) => {
          const existing = acc.find(item => item.activoModeloId === unidad.fkActivoModelo);
          if (existing) {
            existing.cantidad += 1;
          } else {
            acc.push({ activoModeloId: unidad.fkActivoModelo, cantidad: 1 });
          }
          return acc;
        }, []);

        const data = {
          fkUsuario: fk_Usuario,
          fkPersonal: selectedPersonal.id,
          fechaAsignacion: new Date().toISOString().split("T")[0],
          detalle: "Asignación de equipos",
          activosUnidades
        };

        await axios.post(`${apiUrl}/asignacion`, data);

        for (const unidad of selectedActivos) {
          await axios.put(`${apiUrl}/unidades/${unidad.id}`, {
            ...unidad,
            asignado: true
          });
        }

        Swal.fire('¡Éxito!', 'Los activos han sido asignados con éxito.', 'success');
        onSave();
      } catch (error) {
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
    <div className="flex flex-wrap justify-center p-4">
      <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl m-4 flex-grow lg:w-1/2">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_amarillo mb-8">
          Asignar <span className="text-white">Activos</span>
        </h1>
        <form className="mb-8" onSubmit={handleAsignarActivos}>
          <div className="relative mb-4">
            <RiUserLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
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
          <div className="relative mb-4">
            <RiBriefcaseLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input 
              type="text" 
              readOnly 
              className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul" 
              value={selectedPersonal?.cargo?.nombre || ''} 
              placeholder="Cargo" 
            />
          </div>
          <div className="relative mb-4">
            <RiBuildingLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input 
              type="text" 
              readOnly 
              className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul" 
              value={selectedPersonal?.unidad?.nombre || ''} 
              placeholder="Unidad" 
            />
          </div>
          <button 
            type="button" 
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors mb-4 flex items-center justify-center"
            onClick={handleResetPersonal}
          >
            <RiRefreshLine className="mr-2" /> Resetear Personal
          </button>
        </form>
      </div>

      {/* Sección de Selección de Activos */}
      <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl m-4 flex-grow lg:w-1/2">
        <div className="relative mb-4">
          <RiSearchLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
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
                    <p className="text-emi_amarillo">Cantidad disponible: {modelo.cantidad}</p>
                  </div>
                  <RiCheckboxMultipleLine 
                    className="text-primary cursor-pointer" 
                    onClick={() => toggleSeleccionarTodos(modelo.id)} 
                    title="Seleccionar todos" 
                  />
                </div>
                {activeModelo === modelo.id && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {modelo.activoUnidades.map(unidad => (
                      <div key={unidad.id} className={`flex items-center bg-white p-2 rounded-lg shadow-sm ${unidad.seleccionado ? 'bg-black' : ''}`}>
                        <div className="flex items-center justify-center w-8 h-8 mr-2">
                          {unidad.seleccionado ? (
                            <RiCheckboxLine className="text-primary cursor-pointer" onClick={() => toggleSeleccion(modelo.id, unidad.id)} />
                          ) : (
                            <RiCheckboxBlankLine className="text-primary cursor-pointer" onClick={() => toggleSeleccion(modelo.id, unidad.id)} />
                          )}
                        </div>
                        <div className="text-emi_azul">{unidad.codigo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <button 
          type="button" 
          className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors mb-4"
          onClick={handleGeneratePDF}
        >
          Generar PDF
        </button>
        {pdfGenerated && (
          <button 
            type="submit" 
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
            onClick={handleAsignarActivos}
          >
            Asignar Activos
          </button>
        )}
      </div>
      {showPDF && (
        <div className="w-full mt-4">
          <PDFViewer style={{ width: '100%', height: '600px' }}>
            <CustodyDocument 
              data={{ nombre: selectedPersonal?.nombre, cargo: selectedPersonal?.cargo?.nombre, unidad: selectedPersonal?.unidad?.nombre }} 
              activos={activos.flatMap(modelo => modelo.activoUnidades.filter(unidad => unidad.seleccionado))}
            />
          </PDFViewer>
        </div>
      )}
    </div>
  );
};

export default AsignarActivos;
