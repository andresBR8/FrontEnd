import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiEdit2Line, RiDeleteBin6Line } from "react-icons/ri";
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Link } from 'react-router-dom';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const apiUrl = import.meta.env.VITE_API_URL;

const AssetManagement = () => {
  const [assignments, setAssignments] = useState([]);
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
    axios.get(`${apiUrl}/asignacion`)
      .then(response => {
        setAssignments(response.data.data);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const fetchUnidades = () => {
    axios.get(`${apiUrl}/unidades`)
      .then(response => {
        const unidadesData = response.data.map(unidad => ({ value: unidad.id, label: unidad.nombre }));
        setUnidades(unidadesData);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const fetchUsuarios = () => {
    axios.get(`${apiUrl}/users`)
      .then(response => {
        const usuariosData = response.data.data.map(usuario => ({ value: usuario.id, label: usuario.username }));
        setUsuarios(usuariosData);
      })
      .catch(error => console.error('Error fetching data:', error));
  };

  const fetchActivos = () => {
    axios.get(`${apiUrl}/activo-modelo`)
      .then(response => {
        const activosData = response.data.data.map(activo => ({ value: activo.id, label: activo.nombre }));
        setActivos(activosData);
      })
      .catch(error => console.error('Error fetching data:', error));
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

  const filteredAssignments = assignments.filter(assignment =>
    assignment.personal.nombre.toLowerCase().includes(searchTerm) ||
    assignment.usuario.username.toLowerCase().includes(searchTerm) ||
    assignment.detalle.toLowerCase().includes(searchTerm) ||
    assignment.personal.unidad?.nombre?.toLowerCase().includes(searchTerm)
  );

  const barChartData = {
    labels: [...new Set(assignments.map(assignment => assignment.personal.unidad?.nombre))].filter(Boolean),
    datasets: [{
      label: 'Asignaciones por Unidad',
      data: [...new Set(assignments.map(assignment => assignment.personal.unidad?.nombre))].filter(Boolean).map(unidad => (
        assignments.filter(assignment => assignment.personal.unidad?.nombre === unidad).length
      )),
      backgroundColor: 'rgba(249, 185, 4, 0.6)',
      borderColor: 'rgba(5, 68, 115, 1)',
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
        <Link to="/asignar-activos" className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-black transition-colors">
          Agregar Asignación
        </Link>
      </div>
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-lg text-emi_azul font-bold mb-4">Asignaciones por Unidad</h2>
          {barChartData && <Bar data={barChartData} options={barChartOptions} />}
        </div>
        <div>
          <h2 className="text-lg text-emi_azul font-bold mb-4">Activos Asignados por Usuario</h2>
          {horizontalBarChartData && <Bar data={horizontalBarChartData} options={horizontalBarChartOptions} />}
        </div>
      </div>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-emi_azul">
          <thead className="text-xs text-emi_amarillo uppercase bg-white dark:bg-emi_azul dark:text-emi_amarillo">
            <tr>
              <th scope="col" className="py-2 px-6">ID</th>
              <th scope="col" className="py-2 px-6">Usuario</th>
              <th scope="col" className="py-2 px-6">Personal</th>
              <th scope="col" className="py-2 px-6">Detalle</th>
              <th scope="col" className="py-2 px-6">Unidad</th>
              <th scope="col" className="py-2 px-6">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssignments.map((assignment) => (
              <tr key={assignment.id} className="bg-white border-b dark:bg-white dark:border-emi_azul hover:bg-yellow-400 dark:hover:bg-emi_azul-900">
                <td className="py-1 px-6">{assignment.id}</td>
                <td className="py-1 px-6">{assignment.usuario.role}</td>
                <td className="py-1 px-6">{assignment.personal.nombre}</td>
                <td className="py-1 px-6">{assignment.detalle}</td>
                <td className="py-1 px-6">{assignment.personal.unidad?.nombre || 'N/A'}</td>
                <td className="py-1 px-6 text-right space-x-7">
                  <button className="font-medium text-emi_amarillo dark:text-black hover:underline">
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
