import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import RegisterActivo from "./RegisterActivos";
import Modal from 'react-modal';
import axios from 'axios';


Modal.setAppElement('#root');

const customStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-35%, -50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '50px',
    padding: '2px',
    width: '90%',
    maxWidth: '900px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

const Activos = () => {
  const [activos, setActivos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedActivo, setSelectedActivo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortType, setSortType] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [userRole, setUserRole] = useState(null);
  
  const apiUrl = import.meta.env.VITE_API_URL;


  const fetchActivos = () => {
    axios.get(`${apiUrl}/api/Activos/`)
      .then(response => {
        setActivos(response.data.result);
      })
      .catch(error => {
        console.error('Error fetching activos:', error);
      });
  };
  useEffect(() => {
    fetchActivos();
    const role = localStorage.getItem('fk_Rol');
    setUserRole(role); 
  }, []);

  const shouldHideMenu = userRole === '3';
  const onSave = (activo) => {
    const url = `${apiUrl}/${activo.id ? activo.id : ''}`;
    activo.fechaIngreso = new Date(activo.fechaIngreso).toISOString();
  
    const method = activo.id ? 'put' : 'post';
  
    axios({ method, url, data: activo })
      .then(response => {
        setIsModalOpen(false);
        Swal.fire('¡Éxito!', `El activo ha sido ${activo.id ? 'actualizado' : 'registrado'} con éxito.`, 'success')
          .then(() => {
            fetchActivos(); 
          });
      })
      .catch(error => {
        console.error(`Error al ${activo.id ? 'actualizar' : 'crear'} el activo:`, error);
        Swal.fire('Error', `No se pudo ${activo.id ? 'actualizar' : 'registrar'} el activo.`, 'error');
      });
  };

  const handleEdit = (activo) => {
    setSelectedActivo(activo);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedActivo({});
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
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
        axios.delete(`${apiUrl}/api/Activos/${id}`)
          .then(() => {
            setActivos(activos.filter(a => a.id !== id));
            Swal.fire('Eliminado!', 'El activo ha sido eliminado.', 'success');
          })
          .catch(error => {
            Swal.fire('Error!', 'No se pudo eliminar el activo.', 'error');
          });
      }
    });
  };

  const handleSort = (field) => {
    const isAsc = sortType === field && sortDirection === 'asc';
    setSortType(field);
    setSortDirection(isAsc ? 'desc' : 'asc');
    setActivos(prevActivos =>
      [...prevActivos].sort((a, b) => {
        if (field === 'fechaIngreso') {
          return isAsc ? new Date(b[field]) - new Date(a[field]) : new Date(a[field]) - new Date(b[field]);
        }
        return isAsc ? b[field].localeCompare(a[field]) : a[field].localeCompare(b[field]);
      })
    );
  };

  const filteredActivos = activos.filter(activo => activo.detalle.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Activos</h1>
        <input 
          type="text" 
          placeholder="Buscar por detalle..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)} 
          className="text-sm p-2 text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
        />
        {!shouldHideMenu && (
        <button onClick={handleAdd} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Activos
        </button>
        )}
      </div>
      <Modal isOpen={isModalOpen} onRequestClose={() => setIsModalOpen(false)} style={customStyles}>
        <RegisterActivo activo={selectedActivo} onClose={() => setIsModalOpen(false)} onSave={onSave} />
      </Modal>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => handleSort('id')}>
                ID {sortType === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => handleSort('partida')}>
                Partida {sortType === 'partida' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => handleSort('detalle')}>
                Detalle {sortType === 'detalle' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => handleSort('estado')}>
                Estado {sortType === 'estado' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6 cursor-pointer" onClick={() => handleSort('fechaIngreso')}>
                Fecha de Ingreso {sortType === 'fechaIngreso' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th scope="col" className="py-1 px-6">
                Costo
              </th>
              {!shouldHideMenu && (
              <th scope="col" className="py-1 px-6">
                Acciones
              </th>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredActivos.map((activo) => (
              <tr key={activo.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                <td className="py-1 px-6">{activo.id}</td>
                <td className="py-1 px-6">{activo.partida.nombre}</td>
                <td className="py-1 px-6">{activo.detalle}</td>
                <td className="py-1 px-6">{activo.estado}</td>
                <td className="py-1 px-6">{new Date(activo.fechaIngreso).toLocaleDateString()}</td>
                <td className="py-1 px-6">{activo.costo} Bs</td>
                {!shouldHideMenu && (
                <td className="py-1 px-6 text-right space-x-7">
                  <button onClick={() => handleEdit(activo)} className="font-medium text-emi_amarillo dark:text-black hover:underline">
                    <RiEdit2Line size="1.5em" />
                  </button>
                  <button onClick={() => handleDelete(activo.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">
                    <RiDeleteBin6Line size="1.5em" />
                  </button>
                </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Activos;
