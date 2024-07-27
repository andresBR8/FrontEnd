import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import CreatableSelect from 'react-select/creatable';
import { RiCloseLine } from "react-icons/ri";
import Swal from 'sweetalert2';

const RegisterUnidades = ({ unidad: initialUnidad, onSave, onClose }) => {
  const [unidad, setUnidad] = useState({
    id: '',
    ci: '',
    nombre: '',
    fkCargo: '',
    fkUnidad: '',
    otroCargo: '',
    otraUnidad: ''
  });
  const apiUrl = import.meta.env.VITE_API_URL;

  const [cargos, setCargos] = useState([]);
  const [unidadesList, setUnidadesList] = useState([]);

  const fetchCargos = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/cargos`);
      setCargos(response.data.map(cargo => ({ value: cargo.id, label: cargo.nombre })));
    } catch (error) {
      console.error('Error fetching cargos:', error);
    }
  }, [apiUrl]);

  const fetchUnidades = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/unidades`);
      setUnidadesList(response.data.map(unidad => ({ value: unidad.id, label: unidad.nombre })));
    } catch (error) {
      console.error('Error fetching unidades:', error);
    }
  }, [apiUrl]);

  useEffect(() => {
    setUnidad(initialUnidad || {
      id: '',
      ci: '',
      nombre: '',
      fkCargo: '',
      fkUnidad: '',
      otroCargo: '',
      otraUnidad: ''
    });
    fetchCargos();
    fetchUnidades();
  }, [initialUnidad, fetchCargos, fetchUnidades]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUnidad(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSelectChange = (newValue, actionMeta) => {
    const { name } = actionMeta;
    setUnidad(prevState => ({
      ...prevState,
      [name]: newValue ? newValue.value : ''
    }));
  };

  const handleCreate = async (inputValue, actionMeta) => {
    const { name } = actionMeta;

    Swal.fire({
      title: `¿Desea crear un nuevo ${name === 'fkCargo' ? 'cargo' : 'unidad'}?`,
      text: `"${inputValue}"`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, crear',
      cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (name === 'fkCargo') {
            const response = await axios.post(`${apiUrl}/cargos`, { nombre: inputValue });
            const newCargo = response.data;
            setCargos(prev => [...prev, { value: newCargo.id, label: newCargo.nombre }]);
            setUnidad(prevState => ({
              ...prevState,
              fkCargo: newCargo.id,
              otroCargo: newCargo.nombre
            }));
          } else if (name === 'fkUnidad') {
            const response = await axios.post(`${apiUrl}/unidades`, { nombre: inputValue });
            const newUnidad = response.data;
            setUnidadesList(prev => [...prev, { value: newUnidad.id, label: newUnidad.nombre }]);
            setUnidad(prevState => ({
              ...prevState,
              fkUnidad: newUnidad.id,
              otraUnidad: newUnidad.nombre
            }));
          }
        } catch (error) {
          console.error(`Error creating ${name === 'fkCargo' ? 'cargo' : 'unidad'}:`, error);
        }
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(unidad);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="relative bg-secondary-100 p-8 rounded-3xl shadow-2xl w-full lg:w-[800px] xl:w-[1000px]">
        <button
          onClick={onClose}
          className="absolute top-0 right-0 text-2xl p-2 text-primary hover:text-white"
          aria-label="Cerrar"
        >
          <RiCloseLine />
        </button>
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-white mb-8">
          {unidad.id ? 'Editar' : 'Registrar'} <span className="text-primary">Personal</span>
        </h1>
        <form className="grid grid-cols-1 lg:grid-cols-2 gap-6" onSubmit={handleSubmit}>
          <label className="flex flex-col text-white">
            CI:
            <input
              type="text"
              name="ci"
              value={unidad.ci}
              onChange={handleInputChange}
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            />
          </label>
          <label className="flex flex-col text-white">
            Cargo:
            <CreatableSelect
              name="fkCargo"
              value={cargos.find(option => option.value === unidad.fkCargo) || { value: unidad.fkCargo, label: unidad.otroCargo }}
              onChange={handleSelectChange}
              onCreateOption={(inputValue) => handleCreate(inputValue, { name: 'fkCargo' })}
              options={cargos}
              placeholder="Seleccionar o escribir cargo"
              formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
              classNamePrefix="select"
              styles={{
                singleValue: (provided) => ({ ...provided, color: 'black' }),
                multiValue: (provided) => ({ ...provided, color: 'black' }),
                option: (provided) => ({ ...provided, color: 'black' })
              }}
            />
          </label>
          <label className="flex flex-col text-white">
            Nombre:
            <input
              type="text"
              name="nombre"
              value={unidad.nombre}
              onChange={handleInputChange}
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black"
            />
          </label>
          <label className="flex flex-col text-white">
            Unidad:
            <CreatableSelect
              name="fkUnidad"
              value={unidadesList.find(option => option.value === unidad.fkUnidad) || { value: unidad.fkUnidad, label: unidad.otraUnidad }}
              onChange={handleSelectChange}
              onCreateOption={(inputValue) => handleCreate(inputValue, { name: 'fkUnidad' })}
              options={unidadesList}
              placeholder="Seleccionar o escribir unidad"
              formatCreateLabel={(inputValue) => `Crear "${inputValue}"`}
              classNamePrefix="select"
              styles={{
                singleValue: (provided) => ({ ...provided, color: 'black' }),
                multiValue: (provided) => ({ ...provided, color: 'black' }),
                option: (provided) => ({ ...provided, color: 'black' })
              }}
            />
          </label>
          <div className="col-span-1 lg:col-span-2">
            <button
              type="submit"
              className="bg-primary text-black uppercase font-bold text-sm w-full py-3 px-4 rounded-lg"
            >
              {unidad.id ? 'Actualizar' : 'Registrar'} Personal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterUnidades;
