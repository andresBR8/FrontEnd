"use client"

import React, { useState, useEffect, Suspense } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  PointElement,
} from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DatePicker, Input, Button, Table, Space, Skeleton, Select } from 'antd';
import { RiFileDownloadLine, RiFilterOffLine, RiAddLine, RiSubtractLine } from "react-icons/ri";
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip
);

const apiUrl = import.meta.env.VITE_API_URL;

const ComparisonChart = React.lazy(() => import('./ComparisonChart'));

const partidas = [
  'MUEBLES Y EQUIPOS DE OFICINA',
  'EQUIPOS DE COMPUTACIÓN',
  'EQUIPO MEDICO Y DE LABORATORIO',
  'EQUIPO DE COMUNICACIONES',
  'EQUIPO EDUCACIONAL Y RECREATIVO',
  'VEHICULOS AUTOMOTORES',
  'MAQUINARIA PARA LA CONSTRUCCIÓN',
  'OTRA MAQUINARIA Y EQUIPOS',
  'OTROS ACTIVOS FIJOS',
  'ACTIVOS INTANGIBLES'
];

export default function Depreciacion() {
  const [comparisonYears, setComparisonYears] = useState([new Date().getFullYear()]);
  const [depreciationYear, setDepreciationYear] = useState(new Date().getFullYear());
  const [comparisonData, setComparisonData] = useState([]);
  const [depreciationData, setDepreciationData] = useState([]);
  const [filteredDepreciationData, setFilteredDepreciationData] = useState([]);
  const [loading, setLoading] = useState({
    comparison: true,
    depreciation: true
  });
  const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("codigo");
  const [sortOrder, setSortOrder] = useState("ascend");
  const [filterType, setFilterType] = useState("all");
  const [filterPartida, setFilterPartida] = useState("all");
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    fetchComparisonData();
    fetchDepreciationData();
  }, [comparisonYears, depreciationYear]);

  useEffect(() => {
    const updateCountdown = () => {
      const now = moment();
      const endOfYear = moment().endOf('year');
      const duration = moment.duration(endOfYear.diff(now));
      setCountdown(`${duration.months()} meses, ${duration.days()} días, ${duration.hours()} horas, ${duration.minutes()} minutos`);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const fetchComparisonData = async () => {
    setLoading(prev => ({ ...prev, comparison: true }));
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/comparacion`, {
        params: { años: comparisonYears.join(',') }
      });
      setComparisonData(response.data.comparison.map(yearData => 
        yearData.map(monthData => ({
          month: monthData.month,
          lineaRecta: monthData.lineaRecta
        }))
      ));
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('No se pudo cargar la comparación de depreciaciones.');
    } finally {
      setLoading(prev => ({ ...prev, comparison: false }));
    }
  };

  const fetchDepreciationData = async () => {
    setLoading(prev => ({ ...prev, depreciation: true }));
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/metodo`, {
        params: { año: depreciationYear, metodo: 'LINEA_RECTA' }
      });
      console.log(response.data);
      const processedData = response.data.map(item => ({
        ...item,
        nuevoCosto: item.nuevoCosto < 0 ? 1 : item.nuevoCosto,
        valorDepreciacion: item.valorDepreciacion > item.costoInicial ? item.costoInicial - 1 : item.valorDepreciacion,
        status: item.nuevoCosto <= 1 ? 'Cumplió vida útil' : 'Activo'
      }));
      setDepreciationData(processedData);
      setFilteredDepreciationData(processedData);
    } catch (error) {
      console.error('Error fetching depreciation data:', error);
    } finally {
      setLoading(prev => ({ ...prev, depreciation: false }));
    }
  };

  const handleAddYear = () => {
    const newYear = Math.max(...comparisonYears) + 1;
    setComparisonYears([...comparisonYears, newYear]);
  };

  const handleRemoveYear = (year) => {
    setComparisonYears(comparisonYears.filter(y => y !== year));
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    applyFilters(dates, searchTerm, filterType, filterPartida);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters(dateRange, value, filterType, filterPartida);
  };

  const applyFilters = (dates, search, type, partida) => {
    let filtered = [...depreciationData];

    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].startOf('day');
      const endDate = dates[1].endOf('day');
      filtered = filtered.filter(item => 
        item.fechaIngreso && moment(item.fechaIngreso).isBetween(startDate, endDate, null, '[]')
      );
    }

    if (search) {
      filtered = filtered.filter(item => 
        item.codigo.toLowerCase().includes(search.toLowerCase()) ||
        item.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== "all") {
      filtered = filtered.filter(item => item.status === type);
    }

    if (partida !== "all") {
      filtered = filtered.filter(item => item.partidaNombre === partida);
    }

    setFilteredDepreciationData(filtered);
  };

  const clearFilters = () => {
    setDateRange([moment().startOf('year'), moment()]);
    setSearchTerm("");
    setFilterType("all");
    setFilterPartida("all");
    setFilteredDepreciationData(depreciationData);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
  
    // Add logo
    const logoUrl = 'https://i.ibb.co/QdCDD3j/ead9f229-bf68-46a1-bc0d-c585ef2995e4-logoo-emi.jpg';
    doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);
  
    // Title
    doc.setFontSize(18);
    doc.setTextColor(0, 48, 135); // EMI blue color
    doc.text('Reporte de Depreciación de Activos', 50, 25);
  
    // Date and time of report generation
    doc.setFontSize(10);
    doc.setTextColor(100);
    const now = moment().format('DD/MM/YYYY HH:mm:ss');
    doc.text(`Generado el: ${now}`, 250, 20, null, null, "right");
  
    // Total count of depreciation items
    const finalY = 35;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total de activos: ${filteredDepreciationData.length}`, 14, finalY + 10);
  
    // Applied filters box
    doc.setDrawColor(0, 48, 135); // EMI blue color for border
    doc.setLineWidth(0.5);
    doc.rect(12, finalY + 15, 270, 35);
  
    // Applied filters title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Filtros aplicados:', 14, finalY + 25);
  
    // Applied filters details
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`- Año: ${depreciationYear}`, 20, finalY + 35);
    doc.text(`- Rango de fechas: ${dateRange[0].format('DD/MM/YYYY')} - ${dateRange[1].format('DD/MM/YYYY')}`, 20, finalY + 45);
    doc.text(`- Búsqueda: ${searchTerm || 'Ninguna'}`, 20, finalY + 55);
    doc.text(`- Estado: ${filterType === 'all' ? 'Todos' : filterType}`, 140, finalY + 35);
    doc.text(`- Partida: ${filterPartida === 'all' ? 'Todas' : filterPartida}`, 140, finalY + 45);
  
    // Table start position
    const tableStartY = finalY + 60;
  
    // Table columns
    const tableColumn = [
      'Código', 
      'Nombre', 
      'Fecha Ingreso', 
      'Costo Inicial', 
      'Valor Depreciación', 
      'Nuevo Costo', 
      'Estado', 
      'Partida'
    ];
  
    // Process depreciation data for table
    const tableRows = filteredDepreciationData.map(item => [
      item.codigo,
      item.nombre,
      moment(item.fechaIngreso).format('DD/MM/YYYY'),
      item.costoInicial.toFixed(2),
      item.valorDepreciacion.toFixed(2),
      item.nuevoCosto.toFixed(2),
      item.status,
      item.partidaNombre
    ]);
  
    // Generate table
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: tableStartY,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 10, bottom: 10 },
    });
  
    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Página ${i} de ${pageCount}`, 280, 200, null, null, "right");
    }
  
    // Save the PDF
    const fileName = `reporte_depreciacion_${moment().format('YYYYMMDD_HHmmss')}.pdf`;
    doc.save(fileName);
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
    },
    {
      title: 'Nombre',
      dataIndex: 'nombre',
      key: 'nombre',
      sorter: (a, b) => a.nombre.localeCompare(b.nombre),
    },
    {
      title: 'Costo Inicial',
      dataIndex: 'costoInicial',
      key: 'costoInicial',
      render: (text) => text.toFixed(2),
      sorter: (a, b) => a.costoInicial - b.costoInicial,
    },
    {
      title: 'Valor Depreciación',
      dataIndex: 'valorDepreciacion',
      key: 'valorDepreciacion',
      render: (text) => text.toFixed(2),
      sorter: (a, b) => a.valorDepreciacion - b.valorDepreciacion,
    },
    {
      title: 'Nuevo Costo',
      dataIndex: 'nuevoCosto',
      key: 'nuevoCosto',
      render: (text) => text.toFixed(2),
      sorter: (a, b) => a.nuevoCosto - b.nuevoCosto,
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
    },
    {
      title: 'Partida',
      dataIndex: 'partidaNombre',
      key: 'partidaNombre',
      sorter: (a, b) => a.partidaNombre.localeCompare(b.partidaNombre),
    },
  ];

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <h1 className="text-2xl font-bold text-left mb-4 text-emi_azul">Dashboard de Depreciación</h1>

      <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
        <h2 className="text-xl font-semibold mb-2 text-emi_azul">Próxima Depreciación Anual Automática</h2>
        <p className="text-lg font-medium text-emi_amarillo">{countdown}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-2 text-emi_azul">Comparación de Depreciaciones</h2>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {comparisonYears.map(year => (
              <div key={year} className="flex items-center bg-gray-100 rounded-full px-2 py-1 text-sm">
                <span className="mr-1 text-emi_azul">{year}</span>
                <button 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveYear(year)}
                >
                  <RiSubtractLine />
                </button>
              </div>
            ))}
            <button 
              className="bg-emi_amarillo text-emi_azul rounded-full px-2 py-1 flex items-center text-sm hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
              onClick={handleAddYear}
            >
              <RiAddLine className="mr-1" /> Añadir Año
            </button>
          </div>
          <div className="h-64">
            <Suspense fallback={<Skeleton active />}>
              {loading.comparison ? (
                <Skeleton active />
              ) : (
                <ComparisonChart data={comparisonData} years={comparisonYears} />
              )}
            </Suspense>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-lg">
          
          <h2 className="text-xl font-semibold mb-2 text-emi_azul">Filtros</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium text-emi_azul">Año:</label>
              <DatePicker
                picker="year"
                value={moment(depreciationYear.toString())}
                onChange={(date) => setDepreciationYear(date.year())}
                className="w-full border-emi_azul"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emi_azul">Rango de Fechas:</label>
              <RangePicker 
                onChange={handleDateRangeChange}
                value={dateRange}
                className="w-full border-emi_azul"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emi_azul">Buscar:</label>
              <Input.Search
                placeholder="Buscar por código o nombre"
                onSearch={handleSearch}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-emi_azul">Estado:</label>
              <Select
                value={filterType}
                onChange={(value) => {
                  setFilterType(value);
                  applyFilters(dateRange, searchTerm, value, filterPartida);
                }}
                className="w-full"
              >
                <Option value="all">Todos</Option>
                <Option value="Cumplió vida útil">Cumplió vida útil</Option>
                <Option value="Activo">Activo</Option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-emi_azul">Partida:</label>
              <Select
                value={filterPartida}
                onChange={(value) => {
                  setFilterPartida(value);
                  applyFilters(dateRange, searchTerm, filterType, value);
                }}
                className="w-full"
              >
                <Option value="all">Todas</Option>
                {partidas.map(partida => (
                  <Option key={partida} value={partida}>{partida}</Option>
                ))}
              </Select>
            </div>
            <Space className="w-full justify-between">
              <Button
                icon={<RiFilterOffLine />}
                onClick={clearFilters}
                className="bg-emi_azul text-white hover:bg-emi_azul-dark"
              >
                Limpiar Filtros
              </Button>
              <Button
                icon={<RiFileDownloadLine />}
                onClick={exportToPDF}
                className="bg-emi_amarillo text-emi_azul hover:bg-emi_azul hover:text-emi_amarillo"
              >
                Exportar a PDF
              </Button>
            </Space>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-2 text-emi_azul">Depreciación por Año</h2>
        {loading.depreciation ? (
          <Skeleton active />
        ) : (
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={filteredDepreciationData}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
              onChange={(pagination, filters, sorter) => {
                setSortField(sorter.field);
                setSortOrder(sorter.order);
              }}
              className="border-emi_azul min-w-full"
              scroll={{ x: true }}
              expandable={{
                expandedRowRender: (record) => (
                  <div className="p-2 bg-gray-50">
                    <p><strong>Código:</strong> {record.codigo}</p>
                    <p><strong>Nombre:</strong> {record.nombre}</p>
                    <p><strong>Fecha Ingreso:</strong> {moment(record.fechaIngreso).format('YYYY-MM-DD')}</p>
                    <p><strong>Costo:</strong> {record.costo.toFixed(2)}</p>
                    <p><strong>Código Anterior:</strong> {record.codigoAnterior || 'N/A'}</p>
                    <p><strong>Código Nuevo:</strong> {record.codigoNuevo}</p>
                    <p><strong>Partida:</strong> {record.partidaNombre}</p>
                    <p><strong>Costo Inicial:</strong> {record.costoInicial.toFixed(2)}</p>
                    <p><strong>Valor Depreciación:</strong> {record.valorDepreciacion.toFixed(2)}</p>
                    <p><strong>Nuevo Costo:</strong> {record.nuevoCosto.toFixed(2)}</p>
                    <p><strong>Estado:</strong> {record.status}</p>
                  </div>
                ),
                rowExpandable: (record) => true,
              }}
            />
          </div>
        )}
      </div>

      <ToastContainer />
    </div>
  );
}