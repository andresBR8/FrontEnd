import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import Modal from 'react-modal';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import AsignarActivos from './AsignarActivos';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

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
    maxWidth: '1000px'
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)'
  }
};

const apiUrl = import.meta.env.VITE_API_URL;

const AssetManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAsignarModalOpen, setIsAsignarModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [unidades, setUnidades] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [activos, setActivos] = useState([]);

  useEffect(() => {
    fetchAssignments();
    fetchUnidades();
    fetchUsuarios();
    fetchActivos();
  }, []);

  const fetchAssignments = () => {
    axios.get(`${apiUrl}/api/Asignaciones`)
      .then(response => {
        setAssignments(response.data.result);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const fetchUnidades = () => {
    axios.get(`${apiUrl}/api/Unidades`)
      .then(response => {
        const unidadesData = response.data.result.map(unidad => ({ value: unidad.id, label: unidad.nombre }));
        setUnidades(unidadesData);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const fetchUsuarios = () => {
    axios.get(`${apiUrl}/api/Usuarios`)
      .then(response => {
        const usuariosData = response.data.result.map(usuario => ({ value: usuario.id, label: usuario.nombre }));
        setUsuarios(usuariosData);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const fetchActivos = () => {
    axios.get(`${apiUrl}/api/Activos`)
      .then(response => {
        const activosData = response.data.result.map(activo => ({ value: activo.id, label: activo.detalle }));
        setActivos(activosData);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const handleEdit = (assignment) => {
    if (!assignment) return;
    setSelectedAssignment({
      id: assignment.id,
      fechaAsignacion: assignment.fechaAsignacion,
      fk_Activo: assignment.activo.id,
      fk_Usuario: assignment.user.id,
      fk_Personal: assignment.personal.id
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setIsAsignarModalOpen(true);
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
        axios.delete(`${apiUrl}/api/Asignaciones/${id}`)
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

  const filteredAssignments = assignments.filter(assignment =>
    assignment.personal.nombre.toLowerCase().includes(searchTerm) ||
    assignment.user.nombre.toLowerCase().includes(searchTerm) ||
    assignment.activo.detalle.toLowerCase().includes(searchTerm) ||
    assignment.personal.unidad.toLowerCase().includes(searchTerm)
  );

  const barChartData = {
    labels: [...new Set(assignments.map(assignment => assignment.personal.unidad))],
    datasets: [{
      label: 'Asignaciones por Unidad',
      data: [...new Set(assignments.map(assignment => assignment.personal.unidad))].map(unidad => (
        assignments.filter(assignment => assignment.personal.unidad === unidad).length
      )),
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1
    }]
  };

  const barChartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const pieChartData = {
    labels: [...new Set(assignments.map(assignment => assignment.activo.detalle))],
    datasets: [{
      label: 'Distribución de Activos',
      data: [...new Set(assignments.map(assignment => assignment.activo.detalle))].map(activo => (
        assignments.filter(assignment => assignment.activo.detalle === activo).length
      )),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
      ],
      borderWidth: 1
    }]
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl text-emi_azul font-bold">Gestión de Asignación de Activos</h1>
        <input 
          type="text" 
          placeholder="Buscar asignación..." 
          value={searchTerm} 
          onChange={handleSearchChange}
          className="text-sm p-2 text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
        />
        <button onClick={handleAdd} className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Asignación
        </button>
      </div>
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-lg text-emi_azul font-bold mb-4">Asignaciones por Unidad</h2>
          {barChartData && <Bar data={barChartData} options={barChartOptions} />}
        </div>
        <div>
          <h2 className="text-lg text-emi_azul font-bold mb-4">Distribución de Activos</h2>
          {pieChartData && <Pie data={pieChartData} />}
        </div>
      </div>
      <Modal isOpen={isAsignarModalOpen} onRequestClose={() => setIsAsignarModalOpen(false)} style={customStyles}>
        <AsignarActivos onClose={() => setIsAsignarModalOpen(false)} onSave={fetchAssignments} />
      </Modal>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-2 px-6">ID</th>
              <th scope="col" className="py-2 px-6">Usuario</th>
              <th scope="col" className="py-2 px-6">Personal</th>
              <th scope="col" className="py-2 px-6">Activo</th>
              <th scope="col" className="py-2 px-6">Unidad</th>
              <th scope="col" className="py-2 px-6">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((assignment) => (
              <tr key={assignment.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                <td className="py-1 px-6">{assignment.id}</td>
                <td className="py-1 px-6">{assignment.user.nombre}</td>
                <td className="py-1 px-6">{assignment.personal.nombre}</td>
                <td className="py-1 px-6">{assignment.activo.detalle}</td>
                <td className="py-1 px-6">{assignment.personal.unidad}</td>
                <td className="py-1 px-6 text-right space-x-7">
                  <button onClick={() => handleEdit(assignment)} className="font-medium text-emi_amarillo dark:text-black hover:underline">
                    <RiEdit2Line size="1.5em" />
                  </button>
                  <button onClick={() => handleDelete(assignment.id)} className="font-medium text-red-600 dark:text-red-500 hover:underline">
                    <RiDeleteBin6Line size="1.5em" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AssetManagement;
