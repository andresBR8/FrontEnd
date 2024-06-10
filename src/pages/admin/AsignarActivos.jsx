import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiUserLine, RiBriefcaseLine, RiBuildingLine, RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { PDFViewer } from '@react-pdf/renderer';
import CustodyDocument from './PDF'; 
import axios from 'axios';

const AsignarActivos = ({ onClose, onSave }) => {
  const [personal, setPersonal] = useState([]);
  const [activos, setActivos] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [filtroPersonal, setFiltroPersonal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    axios.get(`${apiUrl}/api/Personal`)
      .then(response => setPersonal(response.data.result))
      .catch(error => console.error('Error fetching personal:', error));

    axios.get(`${apiUrl}/api/Activos`)
      .then(response => {
        const activosNoAsignados = response.data.result.filter(activo => !activo.asignado);
        setActivos(activosNoAsignados);
      })
      .catch(error => console.error('Error fetching activos:', error));
  }, []);

  const handleSeleccionPersonal = (persona) => {
    setSelectedPersonal(persona);
    setFiltroPersonal(persona.nombre);
    setShowDropdown(false);
  };

  const toggleSeleccion = (id) => {
    setActivos(prevActivos => prevActivos.map(activo => ({
      ...activo,
      seleccionado: activo.id === id ? !activo.seleccionado : activo.seleccionado
    })));
  };

  const handleAsignarActivos = async (e) => {
    e.preventDefault();
    const selectedActivos = activos.filter(a => a.seleccionado);
    const fk_Usuario = localStorage.getItem('userId'); 

    if (!selectedPersonal || selectedActivos.length === 0) {
      Swal.fire('Error', 'Por favor seleccione un personal y al menos un activo', 'error');
      return;
    }

    try {
      for (const activo of selectedActivos) {
        const data = {
          fechaAsignacion: new Date().toISOString(),
          fk_Activo: activo.id,
          fk_Usuario,
          fk_Personal: selectedPersonal.id
        };
        await axios.post(`${apiUrl}/api/Asignaciones`, data);
        
        // Update the 'asignado' status of the asset
        await axios.put(`${apiUrl}/api/Activos/${activo.id}`, {
          ...activo,
          asignado: true
        });
      }
      Swal.fire('¡Éxito!', 'Los activos han sido asignados con éxito.', 'success');
      onClose();
      onSave(); // Refrescar la lista de asignaciones
    } catch (error) {
      Swal.fire('Error', 'No se pudo asignar los activos.', 'error');
    }

    setShowPDF(true);
  };

  return (
    <div className="flex flex-wrap justify-center p-4">
      <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl m-4" style={{ maxWidth: '600px' }}>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_amarillo mb-8">
          Asignar <span className="text-emi_azul">Activos</span>
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
              value={selectedPersonal?.cargo} 
              placeholder="Cargo" 
            />
          </div>
          <div className="relative mb-4">
            <RiBuildingLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input 
              type="text" 
              readOnly 
              className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul" 
              value={selectedPersonal?.unidad} 
              placeholder="Unidad" 
            />
          </div>
          <div className="mb-4">
            <h3 className="text-lg text-emi_azul font-bold mb-2">Seleccionar Activos</h3>
            <div className="max-h-60 overflow-auto">
              {activos.map((activo) => (
                <div key={activo.id} className="flex items-center mb-2 bg-white p-2 rounded-lg shadow-sm">
                  <div className="flex items-center justify-center w-8 h-8 mr-2">
                    {activo.seleccionado ? (
                      <RiCheckboxLine className="text-primary cursor-pointer" onClick={() => toggleSeleccion(activo.id)} />
                    ) : (
                      <RiCheckboxBlankLine className="text-primary cursor-pointer" onClick={() => toggleSeleccion(activo.id)} />
                    )}
                  </div>
                  <div className="text-emi_azul">{`${activo.id} - ${activo.detalle}`}</div>
                </div>
              ))}
            </div>
          </div>
          <button type="submit" className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors">
            Asignar Activos
          </button>
        </form>
      </div>
      {showPDF && (
        <PDFViewer style={{ width: '500px', height: '600px', flex: '1 1 auto' }}>
          <CustodyDocument 
            data={{ nombre: selectedPersonal?.nombre, cargo: selectedPersonal?.cargo, unidad: selectedPersonal?.unidad }} 
            activos={activos.filter(a => a.seleccionado)}
          />
        </PDFViewer>
      )}
    </div>
  );
};

export default AsignarActivos;
