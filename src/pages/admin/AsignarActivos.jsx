import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiUserLine, RiBriefcaseLine, RiBuildingLine, RiCheckboxBlankLine, RiCheckboxLine } from "react-icons/ri";
import { PDFViewer } from '@react-pdf/renderer';
import CustodyDocument from './PDF'; 
import axios from 'axios';

const AsignarActivos = () => {
  const [personal, setPersonal] = useState([]);
  const [activos, setActivos] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [filtroPersonal, setFiltroPersonal] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showPDF, setShowPDF] = useState(false);

  useEffect(() => {
    axios.get("http://192.168.100.48:5075/api/Personal")
      .then(response => setPersonal(response.data.result))
      .catch(error => console.error('Error fetching personal:', error));

    axios.get("http://192.168.100.48:5075/api/Activos")
      .then(response => {
        const activosNoAsignados = response.data.result.filter(activo => !activo.asignado);
        setActivos(activosNoAsignados);
        console.log(activosNoAsignados);
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

  const handleAsignarActivos = (e) => {
    e.preventDefault();
    const selectedActivos = activos.filter(a => a.seleccionado);
    setShowPDF(true);
  };

  return (
    <div className="flex flex-wrap justify-center p-4">
      <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl m-4" style={{ maxWidth: '450px' }}>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          Asignar <span className="text-primary">Activos</span>
        </h1>
        <form className="mb-8" onSubmit={handleAsignarActivos}>
          <div className="relative mb-4">
            <RiUserLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input type="text" className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul"
              placeholder="Buscar personal..." value={filtroPersonal} onChange={e => setFiltroPersonal(e.target.value)} onFocus={() => setShowDropdown(true)} />
            {showDropdown && (
              <div className="absolute w-full mt-1 z-10 bg-white shadow-md max-h-60 overflow-auto ">
                {personal.filter(p => p.nombre.toLowerCase().includes(filtroPersonal.toLowerCase())).map(p => (
                  <div key={p.id} className="text-emi_azul p-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSeleccionPersonal(p)}>
                    {p.nombre}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="relative mb-4">
            <RiBriefcaseLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input type="text" readOnly className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul" value={selectedPersonal?.cargo} placeholder="Cargo" />
          </div>
          <div className="relative mb-4">
            <RiBuildingLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
            <input type="text" readOnly className="py-2 pl-8 pr-4 bg-secondary-900 w-full outline-none rounded-lg text-emi_azul" value={selectedPersonal?.unidad} placeholder="Unidad" />
          </div>
          {activos.map((activo) => (
            <div key={activo.id} className="flex items-center mb-2 bg-secondary-900 p-2 rounded-lg">
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
          <button type="submit" className="bg-primary text-black uppercase font-bold text-sm w-full py-3 px-4 rounded-lg">
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
