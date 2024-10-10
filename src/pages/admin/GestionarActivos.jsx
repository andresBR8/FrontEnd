import React, { useState, useEffect, useMemo, useCallback } from "react";
import Modal from "react-modal";
import Swal from "sweetalert2";
import { RiEdit2Line, RiDeleteBin6Line, RiArrowDownSLine, RiArrowUpSLine, RiAddLine, RiSearchLine, RiLoader4Line, RiFileDownloadLine, RiFilterLine, RiRefreshLine } from "react-icons/ri";
import axios from 'axios';
import ReactPaginate from "react-paginate";
import AsignarActivos from './AsignarActivos';
import moment from 'moment-timezone';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ReactECharts from 'echarts-for-react';

const apiUrl = import.meta.env.VITE_API_URL;

export default function AssetManagement() {
  const [assignments, setAssignments] = useState([]);
  const [filteredAssignments, setFilteredAssignments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedUnit, setSelectedUnit] = useState("TODAS");
  const [selectedRole, setSelectedRole] = useState("TODOS");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const itemsPerPage = 10;

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/asignacion`);
      const processedAssignments = response.data.data.map(assignment => ({
        ...assignment,
        fechaAsignacionFormatted: moment(assignment.fechaAsignacion).tz('America/La_Paz').format('DD/MM/YYYY HH:mm'),
        fechaAsignacionMoment: moment(assignment.fechaAsignacion).tz('America/La_Paz')
      }));
      setAssignments(processedAssignments);
      setFilteredAssignments(processedAssignments);
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
    applyFilters(e.target.value.toLowerCase(), dateRange, selectedUnit, selectedRole);
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
    applyFilters(searchTerm, { ...dateRange, [name]: value }, selectedUnit, selectedRole);
  };

  const handleUnitChange = (e) => {
    setSelectedUnit(e.target.value);
    applyFilters(searchTerm, dateRange, e.target.value, selectedRole);
  };

  const handleRoleChange = (e) => {
    setSelectedRole(e.target.value);
    applyFilters(searchTerm, dateRange, selectedUnit, e.target.value);
  };

  const applyFilters = (search, dates, unit, role) => {
    let filtered = [...assignments];

    if (search) {
      filtered = filtered.filter(assignment =>
        assignment.personal.nombre.toLowerCase().includes(search) ||
        assignment.usuario.username.toLowerCase().includes(search) ||
        assignment.detalle.toLowerCase().includes(search) ||
        assignment.personal.unidad?.nombre?.toLowerCase().includes(search)
      );
    }

    if (dates.start && dates.end) {
      const startDate = moment(dates.start);
      const endDate = moment(dates.end);
      filtered = filtered.filter(assignment => {
        return assignment.fechaAsignacionMoment.isBetween(startDate, endDate, 'day', '[]');
      });
    }

    if (unit !== "TODAS") {
      filtered = filtered.filter(assignment => assignment.personal.unidad?.nombre === unit);
    }

    if (role !== "TODOS") {
      filtered = filtered.filter(assignment => obtenerRolUsuario(assignment.usuario.role) === role);
    }

    setFilteredAssignments(filtered);
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDateRange({ start: null, end: null });
    setSelectedUnit("TODAS");
    setSelectedRole("TODOS");
    setFilteredAssignments(assignments);
    setCurrentPage(0);
  };

  const paginatedAssignments = useMemo(() =>
    filteredAssignments.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage), 
    [filteredAssignments, currentPage, itemsPerPage]);

  const pageCount = Math.ceil(filteredAssignments.length / itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
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

  const handleAvalClick = (avalUrl) => {
    window.open(avalUrl, '_blank');
  };

  const renderAssignedAssets = (assets) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((activo) => (
        <div key={activo.id} className="bg-gray-100 p-4 rounded-lg shadow">
          <h4 className="font-bold text-emi_azul mb-2">Código: {activo.activoUnidad.codigo}</h4>
          <p className="text-sm text-emi_azul"><span className="font-medium text-emi_amarillo">Estado:</span> {activo.activoUnidad.estadoActual}</p>
          <p className="text-sm text-emi_azul"><span className="font-medium text-emi_amarillo">Costo:</span> ${activo.activoUnidad.costoActual.toFixed(2)}</p>
          <p className="text-sm text-emi_azul"><span className="font-medium text-emi_amarillo">Condición:</span> {activo.activoUnidad.estadoCondicion}</p>
        </div>
      ))}
    </div>
  );

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
  
    // Agregar el logo
    const logoUrl = 'https://i.ibb.co/QdCDD3j/ead9f229-bf68-46a1-bc0d-c585ef2995e4-logoo-emi.jpg';
    doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);
  
    // Título del PDF
    doc.setFontSize(18);
    doc.setTextColor(5, 68, 115); // Color emi_azul
    doc.text('Reporte de Asignaciones de Activos', 50, 25);
  
    // Mejorar la sección de "Filtros aplicados"
    const finalY = 35;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de asignaciones: ${filteredAssignments.length}`, 14, finalY + 10);
  
    // Estilo de caja y texto para los filtros aplicados
    doc.setDrawColor(5, 68, 115); // Borde en color emi_azul
    doc.setLineWidth(0.5);
    doc.rect(12, finalY + 15, 270, 35); // Dibuja un rectángulo alrededor de los filtros
  
    // Título de filtros aplicados
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Filtros aplicados:', 14, finalY + 25);
  
    // Aplicar negritas y espaciado a cada filtro
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`- Búsqueda: ${searchTerm || 'Ninguna'}`, 20, finalY + 35);
    doc.text(
      `- Rango de fechas: ${
        dateRange.start && dateRange.end
          ? `${moment(dateRange.start).format('DD/MM/YYYY')} - ${moment(dateRange.end).format('DD/MM/YYYY')}`
          : 'Ninguno'
      }`,
      20,
      finalY + 45
    );
    doc.text(`- Unidad: ${selectedUnit}`, 20, finalY + 55);
    doc.text(`- Rol de usuario: ${selectedRole}`, 20, finalY + 65);
  
    // Añadir un espaciado después de la caja de filtros
    const tableStartY = finalY + 80;
  
    // Crear las columnas de la tabla
    const tableColumn = ['ID', 'Usuario', 'Rol', 'Personal', 'Unidad', 'Fecha de Asignación', 'Detalle', 'Códigos de Activos'];
    const tableRows = [];
  
    // Procesar cada asignación
    filteredAssignments.forEach((assignment) => {
      const assetCodes = assignment.asignacionActivos.map(activo => activo.activoUnidad.codigo).join(', ');
  
      const assignmentRow = [
        assignment.id,
        assignment.usuario.username,
        obtenerRolUsuario(assignment.usuario.role),
        assignment.personal.nombre,
        assignment.personal.unidad?.nombre || 'N/A',
        assignment.fechaAsignacionFormatted,
        assignment.detalle,
        assetCodes, // Mostrar los códigos de activos asignados en una sola celda
      ];
  
      tableRows.push(assignmentRow);
    });
  
    // Generar la tabla con los datos procesados
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [5, 68, 115], textColor: [249, 185, 4] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 10, bottom: 10 },
    });
  
    // Obtener la posición final de la tabla
    const finalTableY = doc.lastAutoTable.finalY || tableStartY;
  
    // Guardar el PDF con la fecha y hora actuales en el nombre del archivo
    const fileName = `reporte_asignaciones_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
    doc.save(fileName);
  };
  
  const renderSkeletonRow = () => (
    <tr className="bg-white border-b">
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
      <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
    </tr>
  );

  // ECharts options for Asignaciones por Unidad
  const asignacionesPorUnidadOptions = {
    title: {
      text: 'Asignaciones por Unidad',
      left: 'center',
      top: '20px',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      top: 'bottom',
      align: 'auto',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        name: 'Asignaciones',
        type:  'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [...new Set(assignments.map(a => a.personal.unidad?.nombre))]
          .filter(Boolean)
          .map(unidad => ({
            name: unidad,
            value: assignments.filter(a => a.personal.unidad?.nombre === unidad).length
          }))
      }
    ],
    responsive: true,
    grid: {
      containLabel: true
    }
  };

  // ECharts options for Asignaciones por Rol de Usuario
  const asignacionesPorRolOptions = {
    title: {
      text: 'Asignaciones por Rol de Usuario',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['Administrador', 'Encargado']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Asignaciones',
        type: 'bar',
        data: ['Administrador', 'Encargado'].map(rol => 
          assignments.filter(a => obtenerRolUsuario(a.usuario.role) === rol).length
        ),
        itemStyle: {
          color: function(params) {
            const colors = ['#5470c6', '#91cc75'];
            return colors[params.dataIndex];
          }
        }
      }
    ]
  };

  // ECharts options for Asignaciones por Mes
  const asignacionesPorMesOptions = {
    title: {
      text: 'Asignaciones por Mes',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Asignaciones',
        type: 'line',
        data: Array(12).fill(0).map((_, index) => 
          assignments.filter(a => moment(a.fechaAsignacion).month() === index).length
        ),
        smooth: true
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emi_azul-100 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-emi_azul mb-2">Gestión de Asignación de Activos</h1>
          <p className="text-lg text-emi_azul-600">Administre y visualice las asignaciones de activos de la organización</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="bg-emi_azul text-white px-4 py-2 rounded-md hover:bg-emi_azul-700 transition-colors flex items-center"
          >
            <RiFilterLine className="mr-2" />
            {isFiltersOpen ? "Ocultar Filtros" : "Mostrar Filtros"}
          </button>
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-emi_amarillo text-emi_azul px-6 py-3 rounded-lg hover:bg-emi_amarillo-600 transition-colors flex items-center justify-center text-lg font-semibold"
          >
            <RiAddLine className="mr-2" />
            Agregar Asignación
          </button>
        </div>

        {isFiltersOpen && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 transition-all duration-300 hover:shadow-xl">
            <div className="p-6">
              <h2 className="text-2xl font-semibold text-emi_azul mb-6 border-b-2 border-emi_amarillo pb-2">Filtros</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emi_azul">Buscar</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Buscar asignación..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full pl-10 pr-3 py-2 border-2 text-emi_azul border-emi_azul rounded-md focus:ring-2 focus:ring-emi_amarillo focus:border-transparent"
                    />
                    <RiSearchLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emi_azul" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emi_azul">Fecha Inicial</label>
                  <input
                    type="date"
                    name="start"
                    value={dateRange.start || ''}
                    onChange={handleDateRangeChange}
                    className="w-full px-3 py-2 border-2 text-emi_azul border-emi_azul rounded-md focus:ring-2 focus:ring-emi_amarillo focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emi_azul">Fecha Final</label>
                  <input
                    type="date"
                    name="end"
                    value={dateRange.end || ''}
                    onChange={handleDateRangeChange}
                    className="w-full px-3 py-2 border-2 text-emi_azul border-emi_azul rounded-md focus:ring-2 focus:ring-emi_amarillo focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emi_azul">Unidad</label>
                  <select
                    value={selectedUnit}
                    onChange={handleUnitChange}
                    className="w-full px-3 py-2 border-2 text-emi_azul border-emi_azul rounded-md focus:ring-2 focus:ring-emi_amarillo focus:border-transparent"
                  >
                    <option value="TODAS">Todas las unidades</option>
                    {[...new Set(assignments.map(a => a.personal.unidad?.nombre))].filter(Boolean).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-emi_azul">Rol de Usuario</label>
                  <select
                    value={selectedRole}
                    onChange={handleRoleChange}
                    className="w-full px-3 py-2 border-2 text-emi_azul border-emi_azul rounded-md focus:ring-2 focus:ring-emi_amarillo focus:border-transparent"
                  >
                    <option value="TODOS">Todos los roles</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Encargado">Encargado</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap justify-end gap-4">
                <button 
                  onClick={clearFilters}
                  className="px-6 py-2 bg-emi_azul text-white rounded-md hover:bg-emi_azul-700 transition-colors flex items-center justify-center"
                >
                  <RiRefreshLine className="mr-2" />
                  Limpiar Filtros
                </button>
                <button 
                  onClick={exportToPDF}
                  className="px-6 py-2 bg-emi_amarillo text-emi_azul rounded-md hover:bg-emi_amarillo-600 transition-colors flex items-center justify-center"
                >
                  <RiFileDownloadLine className="mr-2" />
                  Exportar a PDF
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8 transition-all duration-300 hover:shadow-xl">
          <div className="p-6">
            <h2 className="text-2xl font-semibold text-emi_azul mb-6">Asignaciones</h2>
            
            {/* Desktop View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-emi_azul text-emi_amarillo">
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
                  {loading ? (
                    Array(itemsPerPage).fill().map((_, index) => renderSkeletonRow())
                  ) : (
                    paginatedAssignments.map((assignment) => (
                      <React.Fragment key={assignment.id}>
                        <tr className="bg-white border-b hover:bg-emi_azul-50 transition-colors">
                          <td className="py-4 px-6">
                            <button onClick={() => setExpandedRow(expandedRow === assignment.id ? null : assignment.id)}>
                              {expandedRow === assignment.id ? <RiArrowUpSLine size="1.5em" className="text-emi_azul" /> : <RiArrowDownSLine size="1.5em" className="text-emi_azul" />}
                            </button>
                          </td>
                          <td className="py-4 px-6 text-emi_azul">{assignment.id}</td>
                          <td className="py-4 px-6 text-emi_azul">{assignment.usuario.username}</td>
                          <td className="py-4 px-6 text-emi_azul">{obtenerRolUsuario(assignment.usuario.role)}</td>
                          <td className="py-4 px-6 text-emi_azul">{assignment.personal.nombre}</td>
                          <td className="py-4 px-6 text-emi_azul">{assignment.detalle}</td>
                          <td className="py-4 px-6 text-emi_azul">{assignment.personal.unidad?.nombre || 'N/A'}</td>
                          <td className="py-4 px-6 text-emi_azul">{assignment.fechaAsignacionFormatted}</td>
                          <td className="py-4 px-6">
                            <button 
                              onClick={() => handleAvalClick(assignment.avalAsignacion)}
                              className="text-emi_amarillo hover:text-emi_amarillo transition-colors flex items-center"
                            >
                              <RiFileDownloadLine size="1.5em" className="mr-1" />
                              Descargar
                            </button>
                          </td>
                        </tr>
                        {expandedRow === assignment.id && (
                          <tr className="bg-emi_azul-50">
                            <td colSpan="9" className="py-4 px-6">
                              <div>
                                <h4 className="text-lg text-emi_azul font-bold mb-4">Activos Asignados</h4>
                                {renderAssignedAssets(assignment.asignacionActivos)}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tablet and Mobile View */}
            <div className="lg:hidden space-y-4">
              {loading ? (
                Array(itemsPerPage).fill().map((_, index) => (
                  <div key={index} className="bg-white shadow-md rounded-lg p-4">
                    <div className="animate-pulse flex space-x-4">
                      <div className="rounded-full bg-emi_azul-200 h-12 w-12"></div>
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-emi_azul-200 rounded w-3/4"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-emi_azul-200 rounded"></div>
                          <div className="h-4 bg-emi_azul-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                paginatedAssignments.map((assignment) => (
                  <div key={assignment.id} className="bg-white shadow-md rounded-lg p-4 hover:shadow-lg transition-shadow">
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
                      <p><span className="font-medium text-emi_azul">ID:</span> {assignment.id}</p>
                      <p><span className="font-medium text-emi_azul">Usuario:</span> {assignment.usuario.username}</p>
                      <p><span className="font-medium text-emi_azul">Rol:</span> {obtenerRolUsuario(assignment.usuario.role)}</p>
                      <p><span className="font-medium text-emi_azul">Detalle:</span> {assignment.detalle}</p>
                      <p><span className="font-medium text-emi_azul">Unidad:</span> {assignment.personal.unidad?.nombre || 'N/A'}</p>
                      <p><span className="font-medium text-emi_azul">Fecha:</span> {assignment.fechaAsignacionFormatted}</p>
                    </div>
                    <div className="mt-2">
                      <button 
                        onClick={() => handleAvalClick(assignment.avalAsignacion)}
                        className="text-emi_azul hover:text-emi_amarillo transition-colors flex items-center"
                      >
                        <RiFileDownloadLine size="1.5em" className="mr-1" />
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
                ))
              )}
            </div>
          </div>
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
              containerClassName={"pagination flex flex-wrap justify-center gap-2"}
              pageClassName={""}
              pageLinkClassName={"px-3 py-2 rounded-lg bg-white text-emi_azul border-2 border-emi_azul hover:bg-emi_azul hover:text-white transition-colors"}
              activeClassName={"bg-emi_azul"}
              activeLinkClassName={"text-white"}
              previousClassName={""}
              nextClassName={""}
              previousLinkClassName={"px-4 py-2 rounded-lg bg-emi_azul text-white hover:bg-emi_azul-700 transition-colors"}
              nextLinkClassName={"px-4 py-2 rounded-lg bg-emi_azul text-white hover:bg-emi_azul-700 transition-colors"}
              disabledClassName={"opacity-50 cursor-not-allowed"}
            />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
            <ReactECharts option={asignacionesPorUnidadOptions} style={{ height: '400px' }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
            <ReactECharts option={asignacionesPorRolOptions} style={{ height: '400px' }} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl">
            <ReactECharts option={asignacionesPorMesOptions} style={{ height: '400px' }} />
          </div>
        </div>

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