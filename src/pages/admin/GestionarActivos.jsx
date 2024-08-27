import React, { useState, useEffect, useMemo } from "react";
import Modal from "react-modal";
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line, RiArrowDownSLine, RiArrowUpSLine } from "react-icons/ri";
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import AsignarActivos from './AsignarActivos';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const apiUrl = import.meta.env.VITE_API_URL;

const AssetManagement = () => {
  const [assignments, setAssignments] = useState([]);
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
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`${apiUrl}/asignacion`);
      setAssignments(response.data.data);
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
        axios.delete(`${apiUrl}/asignacion/${id}`)
          .then(() => {
            Swal.fire('Eliminado!', 'La asignación ha sido eliminada.', 'success');
            fetchAssignments();
          })
          .catch(error => {
            Swal.fire('Error!', 'No se pudo eliminar la asignación.', 'error');
          });
      }
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredAssignments = useMemo(() =>
    assignments.filter(assignment =>
      assignment.personal.nombre.toLowerCase().includes(searchTerm) ||
      assignment.usuario.username.toLowerCase().includes(searchTerm) ||
      assignment.detalle.toLowerCase().includes(searchTerm) ||
      assignment.personal.unidad?.nombre?.toLowerCase().includes(searchTerm)
    ), [assignments, searchTerm]);

  const paginatedAssignments = useMemo(() =>
    filteredAssignments.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage), 
    [filteredAssignments, currentPage, itemsPerPage]);

  const handlePageClick = (pageIndex) => {
    setCurrentPage(pageIndex);
  };

  const pieChartData = {
    labels: [...new Set(assignments.map(assignment => assignment.personal.unidad?.nombre))].filter(Boolean),
    datasets: [{
      label: 'Asignaciones por Unidad',
      data: [...new Set(assignments.map(assignment => assignment.personal.unidad?.nombre))].filter(Boolean).map(unidad => (
        assignments.filter(assignment => assignment.personal.unidad?.nombre === unidad).length
      )),
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(199, 199, 199, 0.6)'
      ],
      borderColor: 'rgba(5, 68, 115, 1)',
      borderWidth: 1
    }]
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(tooltipItem) {
            return `${tooltipItem.label}: ${tooltipItem.raw}`;
          }
        }
      }
    }
  };

  const obtenerRolUsuario = (role) => {
    switch (role) {
      case 'Administrador':
        return 'Administrador';
      case 'Encargado':
        return 'Encargado';
      default:
        return 'Desconocido';
    }
  };

  const horizontalBarChartData = {
    labels: ['Administrador', 'Encargado'],
    datasets: [{
      label: 'Activos Asignados por Usuario',
      data: ['Administrador', 'Encargado'].map(rol => (
        assignments.filter(assignment => obtenerRolUsuario(assignment.usuario.role) === rol).length
      )),
      backgroundColor: 'rgba(5, 68, 115, 1)',
      borderColor: 'rgba(249, 185, 4, 1)',
      borderWidth: 1
    }]
  };

  const horizontalBarChartOptions = {
    indexAxis: 'y',
    responsive: true,
    scales: {
      x: {
        beginAtZero: true
      }
    }
  };

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    fetchAssignments(); // Refresh assignments after modal is closed
  };

  const toggleRow = (assignmentId) => {
    setExpandedRow(expandedRow === assignmentId ? null : assignmentId);
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 space-y-4 md:space-y-0">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Asignación de Activos</h1>
        <input 
          type="text" 
          placeholder="Buscar asignación..." 
          value={searchTerm} 
          onChange={handleSearchChange}
          className="text-sm p-2 text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
        />
        <button onClick={openModal} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Asignación
        </button>
      </div>
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Add additional content or charts here */}
      </div>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-2 px-1 lg:px-2"></th>
              <th scope="col" className="py-2 px-1 lg:px-2">ID</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Usuario</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Rol Usuario</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Personal</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Detalle</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Unidad</th>
              <th scope="col" className="py-2 px-2 lg:px-2">Fecha de Asignación</th>
              
            </tr>
          </thead>
          <tbody>
            {paginatedAssignments.map((assignment) => (
              <React.Fragment key={assignment.id}>
                <tr className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                  <td className="py-1 px-2 lg:px-6">
                    <button onClick={() => toggleRow(assignment.id)}>
                      {expandedRow === assignment.id ? <RiArrowUpSLine size="1.5em" /> : <RiArrowDownSLine size="1.5em" />}
                    </button>
                  </td>
                  <td className="py-1 px-2 lg:px-6">{assignment.id}</td>
                  <td className="py-1 px-2 lg:px-6">{assignment.usuario.username}</td>
                  <td className="py-1 px-2 lg:px-6">{obtenerRolUsuario(assignment.usuario.role)}</td>
                  <td className="py-1 px-2 lg:px-6">{assignment.personal.nombre}</td>
                  <td className="py-1 px-2 lg:px-6">{assignment.detalle}</td>
                  <td className="py-1 px-2 lg:px-6">{assignment.personal.unidad?.nombre || 'N/A'}</td>
                  <td className="py-1 px-2 lg:px-6">{new Date(assignment.fechaAsignacion).toLocaleString()}</td>
                  
                </tr>
                {expandedRow === assignment.id && (
                  <tr className="bg-white dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                    <td colSpan="10" className="py-4 px-6">
                      <div>
                        <h4 className="text-lg text-emi_azul font-bold">Activos Asignados</h4>
                        <ul className="list-disc pl-5">
                          {assignment.asignacionActivos.map((activo) => (
                            <li key={activo.id} className="text-emi_azul">
                              Código: {activo.activoUnidad.codigo}, Modelo: {activo.activoUnidad.fkActivoModelo}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center mt-4 mb-2">
          {Array.from({ length: Math.ceil(filteredAssignments.length / itemsPerPage) }, (_, index) => (
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
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-10 p-5">
        <div>
          <h2 className="text-lg text-emi_azul font-bold mb-4">Asignaciones por Unidad</h2>
          {pieChartData && <Pie data={pieChartData} options={pieChartOptions} />}
        </div>
        <div>
          <h2 className="text-lg text-emi_azul font-bold mb-4">Activos Asignados por Usuario</h2>
          {horizontalBarChartData && <Bar data={horizontalBarChartData} options={horizontalBarChartOptions} />}
        </div>
      </div>

      {/* Modal de Asignación de Activos */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="Asignar Activos"
      >
        <AsignarActivos onSave={closeModal} />
      </Modal>
    </div>
  );
};

export default AssetManagement;
