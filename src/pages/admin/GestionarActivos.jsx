import React, { useState, useEffect, useMemo, useCallback } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { RiEdit2Line, RiDeleteBin6Line, RiArrowDownSLine, RiArrowUpSLine, RiAddLine, RiSearchLine, RiLoader4Line, RiFileDownloadLine } from "react-icons/ri";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import axios from 'axios';
import ReactPaginate from "react-paginate";
import AsignarActivos from './AsignarActivos';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

const apiUrl = import.meta.env.VITE_API_URL;

export default function AssetManagement() {
  const [assignments, setAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/asignacion`);
      setAssignments(response.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'No se pudieron cargar las asignaciones.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

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
    setCurrentPage(0);
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

  const pageCount = Math.ceil(filteredAssignments.length / itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
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

  const handleAvalClick = (avalUrl) => {
    window.open(avalUrl, '_blank');
  };

  const renderAssignedAssets = (assets) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((activo) => (
        <div key={activo.id} className="bg-gray-100 p-4 rounded-lg shadow">
          <h4 className="font-bold text-emi_azul mb-2">Código: {activo.activoUnidad.codigo}</h4>
          <p className="text-sm"><span className="font-medium">Estado:</span> {activo.activoUnidad.estadoActual}</p>
          <p className="text-sm"><span className="font-medium">Costo:</span> ${activo.activoUnidad.costoActual.toFixed(2)}</p>
          <p className="text-sm"><span className="font-medium">Condición:</span> {activo.activoUnidad.estadoCondicion}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
          <h1 className="text-3xl text-emi_azul font-bold">Gestión de Asignación de Activos</h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar asignación..." 
                value={searchTerm} 
                onChange={handleSearchChange}
                className="pl-10 pr-4 py-2 w-full sm:w-auto text-sm text-emi_azul border-emi_azul border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul focus:border-transparent transition-colors"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-emi_azul text-emi_amarillo py-2 px-4 rounded-lg hover:bg-emi_azul-700 transition-colors flex items-center justify-center"
            >
              <RiAddLine className="mr-2" />
              Agregar Asignación
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <RiLoader4Line className="animate-spin text-emi_azul text-6xl" />
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block bg-white rounded-lg shadow-md overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-emi_azul">
                  <thead className="text-xs text-emi_amarillo uppercase bg-emi_azul">
                    <tr>
                      <th scope="col" className="py-3 px-6"></th>
                      <th scope="col" className="py-3 px-6">ID</th>
                      <th scope="col" className="py-3 px-6">Usuario</th>
                      <th scope="col" className="py-3 px-6">Rol Usuario</th>
                      <th scope="col" className="py-3 px-6">Personal</th>
                      <th scope="col" className="py-3 px-6">Detalle</th>
                      <th scope="col" className="py-3 px-6">Unidad</th>
                      <th scope="col" className="py-3 px-6">Fecha de Asignación</th>
                      <th scope="col" className="py-3 px-6">Aval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedAssignments.map((assignment) => (
                      <React.Fragment key={assignment.id}>
                        <tr className="bg-white border-b hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <button onClick={() => setExpandedRow(expandedRow === assignment.id ? null : assignment.id)}>
                              {expandedRow === assignment.id ? <RiArrowUpSLine size="1.5em" /> : <RiArrowDownSLine size="1.5em" />}
                            </button>
                          </td>
                          <td className="py-4 px-6">{assignment.id}</td>
                          <td className="py-4 px-6">{assignment.usuario.username}</td>
                          <td className="py-4 px-6">{obtenerRolUsuario(assignment.usuario.role)}</td>
                          <td className="py-4 px-6">{assignment.personal.nombre}</td>
                          <td className="py-4 px-6">{assignment.detalle}</td>
                          <td className="py-4 px-6">{assignment.personal.unidad?.nombre || 'N/A'}</td>
                          <td className="py-4 px-6">{new Date(assignment.fechaAsignacion).toLocaleString()}</td>
                          <td className="py-4 px-6">
                            <button 
                              onClick={() => handleAvalClick(assignment.avalAsignacion)}
                              className="text-emi_azul hover:text-emi_amarillo transition-colors flex items-center"
                            >
                              <RiFileDownloadLine size="1.5em" className="mr-1" />
                              Descargar
                            </button>
                          </td>
                        </tr>
                        {expandedRow === assignment.id && (
                          <tr className="bg-gray-50">
                            <td colSpan="9" className="py-4 px-6">
                              <div>
                                <h4 className="text-lg text-emi_azul font-bold mb-4">Activos Asignados</h4>
                                {renderAssignedAssets(assignment.asignacionActivos)}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Stacked View */}
            <div className="md:hidden space-y-4">
              {paginatedAssignments.map((assignment) => (
                <div key={assignment.id} className="bg-white shadow-md rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold text-emi_azul">{assignment.personal.nombre}</h3>
                    <button 
                      onClick={() => setExpandedRow(expandedRow === assignment.id ? null : assignment.id)}
                      className="text-emi_azul"
                    >
                      {expandedRow === assignment.id ? <RiArrowUpSLine size="1.5em" /> : <RiArrowDownSLine size="1.5em" />}
                    </button>
                  </div>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">ID:</span> {assignment.id}</p>
                    <p><span className="font-medium">Usuario:</span> {assignment.usuario.username}</p>
                    <p><span className="font-medium">Rol:</span> {obtenerRolUsuario(assignment.usuario.role)}</p>
                    <p><span className="font-medium">Detalle:</span> {assignment.detalle}</p>
                    <p><span className="font-medium">Unidad:</span> {assignment.personal.unidad?.nombre || 'N/A'}</p>
                    <p><span className="font-medium">Fecha:</span> {new Date(assignment.fechaAsignacion).toLocaleString()}</p>
                  </div>
                  <div className="mt-2">
                    <button 
                      onClick={() => handleAvalClick(assignment.avalAsignacion)}
                      className="text-emi_azul hover:text-emi_amar
illo transition-colors flex items-center"
                    >
                      <RiFileDownloadLine size="1.5em"  className="mr-1" />
                      Descargar Aval
                    </button>
                  </div>
                  {expandedRow === assignment.id && (
                    <div className="mt-4">
                      <h4 className="text-md font-semibold text-emi_azul mb-2">Activos Asignados</h4>
                      {renderAssignedAssets(assignment.asignacionActivos)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {pageCount > 1 && (
              <div className="flex justify-center py-4">
                <ReactPaginate
                  previousLabel={"Anterior"}
                  nextLabel={"Siguiente"}
                  breakLabel={"..."}
                  breakClassName={"break-me"}
                  pageCount={pageCount}
                  marginPagesDisplayed={2}
                  pageRangeDisplayed={5}
                  onPageChange={handlePageClick}
                  containerClassName={"pagination flex flex-wrap justify-center mt-4 mb-4"}
                  pageClassName={"m-1"}
                  pageLinkClassName={"px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"}
                  activeClassName={"bg-emi_azul text-white"}
                  previousClassName={"m-1"}
                  nextClassName={"m-1"}
                  previousLinkClassName={"px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"}
                  nextLinkClassName={"px-3 py-2 rounded-lg bg-white text-emi_azul border border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"}
                  disabledClassName={"opacity-50 cursor-not-allowed"}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl text-emi_azul font-bold mb-4">Asignaciones por Unidad</h2>
                {pieChartData && <Pie data={pieChartData} options={pieChartOptions} />}
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl text-emi_azul font-bold mb-4">Activos Asignados por Usuario</h2>
                {horizontalBarChartData && <Bar data={horizontalBarChartData} options={horizontalBarChartOptions} />}
              </div>
            </div>
          </>
        )}

        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          style={{
            overlay: {
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 1000
            }
          }}
          className="outline-none"
          contentLabel="Asignar Activos"
        >
          <AsignarActivos onClose={() => setIsModalOpen(false)} onAssignmentComplete={fetchAssignments} />
        </Modal>
      </div>
    </div>
  );
}