import React, { useState, useEffect } from "react";
import axios from 'axios';
import {RiCloseLine } from "react-icons/ri";

const RegisterActivos = ({ activo: initialActivo, onClose, onSave }) => {
  const todayDate = new Date().toISOString();
  const [partidas, setPartidas] = useState([]);

  // Estado inicial que se actualizará con datos de partidas y el activo para editar
  const [activo, setActivo] = useState({
    id: '',
    fk_Partida: '',
    detalle: '',
    fechaIngreso: todayDate,
    costo: '',
    estado: '',
    asignado: false,
  });

  // Cargar partidas y establecer datos del activo inicial
  useEffect(() => {
    axios.get("http://192.168.100.48:5075/api/Partidas")
      .then(response => {
        setPartidas(response.data.result);
        if (initialActivo) {
          setActivo({
            ...initialActivo,
            fechaIngreso: initialActivo.fechaIngreso ? initialActivo.fechaIngreso.split('T')[0] : todayDate,
          });
        }
      })
      .catch(error => console.error('Error fetching partidas:', error));
  }, [initialActivo]);

  // Manejo de cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setActivo(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Manejo de la acción de envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...activo,
      fechaIngreso: new Date(activo.fechaIngreso).toISOString() // Asegura que la fecha está en formato correcto
    });
    onClose(); // Cierra el formulario al guardar
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative bg-secondary-100 p-8 rounded-3xl shadow-2xl w-[800px] lg:w-[1000px]">
      <button
          onClick={onClose}
          className="absolute top-0 right-0 text-2xl p-2 text-primary hover:text-white"
          aria-label="Cerrar"
        >
          <RiCloseLine />
        </button>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          {activo.id ? 'Editar' : 'Registrar'} <span className="text-primary">Activo</span>
        </h1>
        <form className="grid grid-cols-2 gap-6" onSubmit={handleSubmit}>
          <label className="flex flex-col text-white">
            ID:
            <input
              type="text"
              name="id"
              value={activo.id}
              readOnly
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            />
          </label>
          <label className="flex flex-col text-white">
            Partida:
            <select
              name="fk_Partida"
              value={activo.fk_Partida}
              onChange={handleInputChange}
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            >
              <option value="">Seleccione una partida</option>
              {partidas.map((partida) => (
                <option key={partida.id} value={partida.id}>{partida.nombre}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-white">
            Descripción:
            <input
              type="text"
              name="detalle"
              value={activo.detalle}
              onChange={handleInputChange}
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            />
          </label>
          <label className="flex flex-col text-white">
            Fecha de Ingreso:
            <input
              type="date"
              name="fechaIngreso"
              value={activo.fechaIngreso}
              onChange={handleInputChange}
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            />
          </label>
          <label className="flex flex-col text-white">
            Valor/Costo:
            <input
              type="number"
              name="costo"
              value={activo.costo}
              onChange={handleInputChange}
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            />
          </label>
          <label className="flex flex-col text-white">
            Estado:
            <select
              name="estado"
              value={activo.estado}
              onChange={handleInputChange}
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            >
              <option value="">Seleccione el estado</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Regular">Regular</option>
              <option value="Malo">Malo</option>
            </select>
          </label>
          {activo.id && (
            <label className="flex flex-col text-white col-span-2">
              Asignado:
              <div className="relative inline-block w-10 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="asignado"
                  id="toggle"
                  checked={activo.asignado}
                  onChange={handleInputChange}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
              </div>
            </label>
          )}
          <div className="col-span-2">
            <button
              type="submit"
              className="bg-primary text-black uppercase font-bold text-sm w-full py-3 px-4 rounded-lg"
            >
              {activo.id ? 'Actualizar' : 'Registrar'} Activo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterActivos;
