import React, { useState, useEffect, useMemo } from "react";
import Modal from "react-modal";
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line, RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const apiUrl = import.meta.env.VITE_API_URL;

const ReassignAssetManagement = () => {
  const [reassignments, setReassignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const itemsPerPage = 10;

  const [modalStyles, setModalStyles] = useState({
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: window.innerWidth <= 1263 ? 'translate(-50%, -50%)' : 'translate(-39%, -50%)',
      backgroundColor: 'rgba(255, 255, 255, 0.35)',
      borderRadius: '20px',
      padding: '20px',
      width: '100%',
      maxWidth: '1000px',
      maxHeight: '80vh',
      overflow: 'auto',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000
    }
  });

  const updateModalStyles = () => {
    setModalStyles(prevStyles => ({
      ...prevStyles,
      content: {
        ...prevStyles.content,
        transform: window.innerWidth <= 1263 ? 'translate(-50%, -50%)' : 'translate(-35%, -50%)'
      }
    }));
  };

  useEffect(() => {
    window.addEventListener('resize', updateModalStyles);
    return () => {
      window.removeEventListener('resize', updateModalStyles);
    };
  }, []);

  useEffect(() => {
    fetchReassignments();
  }, []);

  const fetchReassignments = async () => {
    try {
      const response = await axios.get(`${apiUrl}/reasignacion`);
      setReassignments(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
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
        axios.delete(`${apiUrl}/reasignacion/${id}`)
          .then(() => {
            Swal.fire('Eliminado!', 'La reasignación ha sido eliminada.', 'success');
            fetchReassignments();
          })
          .catch(error => {
            Swal.fire('Error!', 'No se pudo eliminar la reasignación.', 'error');
          });
      }
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredReassignments = useMemo(() =>
    reassignments.filter(reassignment =>
      reassignment.personalAnterior.nombre.toLowerCase().includes(searchTerm) ||
      reassignment.personalNuevo.nombre.toLowerCase().includes(searchTerm) ||
      reassignment.detalle.toLowerCase().includes(searchTerm) ||
      reassignment.activoUnidad.codigo.toLowerCase().includes(searchTerm)
    ), [reassignments, searchTerm]);

  const paginatedReassignments = useMemo(() =>
    filteredReassignments.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage), 
    [filteredReassignments, currentPage, itemsPerPage]);

  const handlePageClick = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    fetchReassignments(); // Refresh reassignments after modal is closed
  };

  const toggleRow = (reassignmentId) => {
    setExpandedRow(expandedRow === reassignmentId ? null : reassignmentId);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 space-y-4 md:space-y-0">
        <h1 className="text-2xl text-emi_azul font-bold">Reasignación de Activos</h1>
        <input 
          type="text" 
          placeholder="Buscar reasignación..." 
          value={searchTerm} 
          onChange={handleSearchChange}
          className="text-sm p-2 text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
        />
        <button onClick={openModal} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Realizar Reasignación
        </button>
      </div>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-2 px-1 lg:px-2"></th>
              <th scope="col" className="py-2 px-1 lg:px-2">ID</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Código Activo</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Usuario Anterior</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Personal Anterior</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Usuario Nuevo</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Personal Nuevo</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Fecha de Reasignación</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReassignments.map((reassignment) => (
              <React.Fragment key={reassignment.id}>
                <tr className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                  <td className="py-1 px-2 lg:px-6">
                    <button onClick={() => toggleRow(reassignment.id)}>
                      {expandedRow === reassignment.id ? <RiArrowUpSLine size="1.5em" /> : <RiArrowDownSLine size="1.5em" />}
                    </button>
                  </td>
                  <td className="py-1 px-2 lg:px-6">{reassignment.id}</td>
                  <td className="py-1 px-2 lg:px-6">{reassignment.activoUnidad.codigo}</td>
                  <td className="py-1 px-2 lg:px-6">{reassignment.usuarioAnterior.username}</td>
                  <td className="py-1 px-2 lg:px-6">{reassignment.personalAnterior.nombre}</td>
                  <td className="py-1 px-2 lg:px-6">{reassignment.usuarioNuevo.username}</td>
                  <td className="py-1 px-2 lg:px-6">{reassignment.personalNuevo.nombre}</td>
                  <td className="py-1 px-2 lg:px-6">{new Date(reassignment.fechaReasignacion).toLocaleString()}</td>
                  <td className="py-1 px-2 lg:px-6 text-right space-x-4 lg:space-x-7">
                    <button className="font-medium text-emi_amarillo dark:text-black hover:underline">
                      <RiEdit2Line size="1.5em" />
                    </button>
                    <button onClick={() => handleDelete(reassignment.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">
                      <RiDeleteBin6Line size="1.5em" />
                    </button>
                  </td>
                </tr>
                {expandedRow === reassignment.id && (
                  <tr className="bg-white dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                    <td colSpan="10" className="py-4 px-6">
                      <div>
                        <h4 className="text-lg text-emi_azul font-bold">Detalle de la Reasignación</h4>
                        <p className="text-emi_azul">{reassignment.detalle}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center mt-4 mb-2">
          {Array.from({ length: Math.ceil(filteredReassignments.length / itemsPerPage) }, (_, index) => (
            <button
              key={index}
              onClick={() => handlePageClick(index)}
              className={`mx-1 px-3 py-1 rounded-lg ${currentPage === index ? 'bg-emi_azul text-white' : 'bg-white text-emi_azul border border-emi_azul'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Modal de Reasignación de Activos */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="Reasignar Activos"
      >
        {/* Aquí iría el componente para realizar la reasignación */}
        <div className="p-4">
          <h2 className="text-lg text-emi_azul font-bold mb-4">Formulario de Reasignación de Activos</h2>
          {/* Añade aquí el formulario o contenido necesario para realizar la reasignación */}
          <button onClick={closeModal} className="mt-4 bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
            Guardar Reasignación
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ReassignAssetManagement;
