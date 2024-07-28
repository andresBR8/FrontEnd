import React, { useState, useEffect, useCallback, useMemo } from "react";
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import RegisterUnidades from "./RegisterUnidades";
import Modal from 'react-modal';
import axios from 'axios';
import { io } from 'socket.io-client';

Modal.setAppElement('#root');

const Personal = () => {
  const [unidades, setUnidades] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const apiUrl = import.meta.env.VITE_API_URL;
  const itemsPerPage = 10;

  const [modalStyles, setModalStyles] = useState({
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: window.innerWidth <= 768 ? 'translate(-50%, -50%)' : 'translate(-35%, -50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      borderRadius: '50px',
      padding: '2px',
      width: '90%',
      maxWidth: '900px',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)'
    }
  });

  const updateModalStyles = () => {
    setModalStyles(prevStyles => ({
      ...prevStyles,
      content: {
        ...prevStyles.content,
        transform: window.innerWidth <= 768 ? 'translate(-50%, -50%)' : 'translate(-35%, -50%)'
      }
    }));
  };

  useEffect(() => {
    window.addEventListener('resize', updateModalStyles);
    return () => {
      window.removeEventListener('resize', updateModalStyles);
    };
  }, []);

  const fetchUnidades = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/personal`);
      setUnidades(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }, [apiUrl]);

  useEffect(() => {
    fetchUnidades();

    const socket = io(apiUrl, {
      withCredentials: true,
    });

    socket.emit('setRole', localStorage.getItem('role'));

    socket.on('personal-changed', () => {
      fetchUnidades();
    });

    return () => {
      socket.disconnect();
    };
  }, [apiUrl, fetchUnidades]);

  const handleEdit = useCallback((unidad) => {
    setSelectedUnidad(unidad);
    setIsModalOpen(true);
  }, []);

  const handleAdd = useCallback(() => {
    setSelectedUnidad({
      id: '',
      ci: '',
      nombre: '',
      fkCargo: '',
      fkUnidad: ''
    });
    setIsModalOpen(true);
  }, []);

  const handleDelete = useCallback((id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: "¡No podrás revertir esto!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!'
    }).then((result) => {
      if (result.isConfirmed) {
        axios.delete(`${apiUrl}/personal/${id}`)
          .then(() => {
            Swal.fire('Eliminado!', 'El personal ha sido eliminado.', 'success');
            fetchUnidades();
          })
          .catch(error => {
            Swal.fire('Error!', 'No se pudo eliminar el personal.', 'error');
          });
      }
    });
  }, [apiUrl, fetchUnidades]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredUnidades = useMemo(() => 
    unidades.filter(unidad =>
      unidad.nombre.toLowerCase().includes(searchTerm) ||
      unidad.ci.toLowerCase().includes(searchTerm)
    ),
    [unidades, searchTerm]
  );

  const paginatedUnidades = useMemo(() => 
    filteredUnidades.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage),
    [filteredUnidades, currentPage, itemsPerPage]
  );

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  return (
    <div className="p-4 px-0 lg:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-center mb-8 space-y-4 lg:space-y-3">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Personal</h1>
        <input 
          type="text" 
          placeholder="Buscar personal..." 
          value={searchTerm} 
          onChange={handleSearchChange}
          className="text-sm p-2 text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
        />
        <button onClick={handleAdd} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Personal
        </button>
      </div>
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} style={modalStyles}>
        <RegisterUnidades unidad={selectedUnidad} onClose={() => setIsModalOpen(false)} onSave={(data) => {
          const method = data.id ? 'patch' : 'post';
          const url = `${apiUrl}/personal/${data.id ? data.id : ''}`;
          const payload = {
            ci: data.ci,
            nombre: data.nombre,
            fkCargo: data.fkCargo,
            fkUnidad: data.fkUnidad
          };
          axios({ method, url, data: payload })
            .then(() => {
              setIsModalOpen(false);
              fetchUnidades(); // Refresca la lista después de guardar
              Swal.fire('¡Éxito!', `El personal ha sido ${data.id ? 'actualizado' : 'registrado'} con éxito.`, 'success');
            })
            .catch(error => {
              console.log('Error saving personal:', error);
              Swal.fire('Error', error.message || 'Ocurrió un error al guardar el personal.', 'error');
            });
        }} />
      </Modal>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg mt-4 ">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-2 px-2 lg:px-6">ID</th>
              <th scope="col" className="py-2 px-2 lg:px-6">CI</th>
              <th scope="col" className="py-2 px-2 lg:px-6">Nombre</th>
              <th scope="col" className="py-2 px-2 lg:px-6">Cargo</th>
              <th scope="col" className="py-2 px-2 lg:px-6">Unidad</th>
              <th scope="col" className="py-2 px-2 lg:px-6">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUnidades.map((unidad) => (
              <tr key={unidad.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                <td className="py-1 px-2 lg:px-6">{unidad.id}</td>
                <td className="py-1 px-2 lg:px-6">{unidad.ci}</td>
                <td className="py-1 px-2 lg:px-6">{unidad.nombre}</td>
                <td className="py-1 px-2 lg:px-6">{unidad.cargo.nombre}</td>
                <td className="py-1 px-2 lg:px-6">{unidad.unidad.nombre}</td>
                <td className="py-1 px-2 lg:px-6 text-right space-x-4 lg:space-x-7">
                  <button onClick={() => handleEdit(unidad)} className="font-medium text-emi_amarillo dark:text-black hover:underline">
                    <RiEdit2Line size="1.5em" />
                  </button>
                  <button onClick={() => handleDelete(unidad.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">
                    <RiDeleteBin6Line size="1.5em" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4 mb-4">
        {Array.from({ length: Math.ceil(filteredUnidades.length / itemsPerPage) }, (_, index) => (
          <button
            key={index}
            onClick={() => handlePageClick({ selected: index })}
            className={`mx-1 px-3 py-1 rounded-lg ${currentPage === index ? 'bg-emi_azul text-white' : 'bg-white text-emi_azul border border-emi_azul'}`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Personal;
