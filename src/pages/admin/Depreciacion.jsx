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

  useEffect(() => {
    fetchComparisonData();
    fetchDepreciationData();
  }, [comparisonYears, depreciationYear]);

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
      toast.error('No se pudo cargar los datos de depreciación.');
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
    applyFilters(dates, searchTerm, filterType);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters(dateRange, value, filterType);
  };

  const applyFilters = (dates, search, type) => {
    let filtered = [...depreciationData];

    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].startOf('day');
      const endDate = dates[1].endOf('day');
      filtered = filtered.filter(item => 
        item.fecha && moment(item.fecha).isBetween(startDate, endDate, null, '[]')
      );
    }

    if (search) {
      filtered = filtered.filter(item => 
        item.codigo.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (type !== "all") {
      filtered = filtered.filter(item => item.status === type);
    }

    setFilteredDepreciationData(filtered);
  };

  const clearFilters = () => {
    setDateRange([moment().startOf('year'), moment()]);
    setSearchTerm("");
    setFilterType("all");
    setFilteredDepreciationData(depreciationData);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Depreciación", 20, 10);
    
    const tableData = filteredDepreciationData.map(item => [
      item.codigo,
      item.costoInicial.toFixed(2),
      item.valorDepreciacion.toFixed(2),
      item.nuevoCosto.toFixed(2),
      item.status
    ]);

    doc.autoTable({
      head: [['Código', 'Costo Inicial', 'Valor Depreciación', 'Nuevo Costo', 'Estado']],
      body: tableData,
    });

    doc.save("reporte_depreciacion.pdf");
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      sorter: (a, b) => a.codigo.localeCompare(b.codigo),
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
  ];

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <h1 className="text-2xl font-bold text-left mb-4 text-emi_azul">Dashboard de Depreciación</h1>

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
                placeholder="Buscar por código"
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
                  applyFilters(dateRange, searchTerm, value);
                }}
                className="w-full"
              >
                <Option value="all">Todos</Option>
                <Option value="Cumplió vida útil">Cumplió vida útil</Option>
                <Option value="Activo">Activo</Option>
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