import React, { useState, useEffect, Suspense } from "react";
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  PointElement,
} from 'chart.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { DatePicker, Select, Input, Button, Table, Space, Skeleton } from 'antd';
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
  Tooltip,
  Legend
);

const apiUrl = import.meta.env.VITE_API_URL;

const ComparisonChart = React.lazy(() => import('./ComparisonChart'));
const CurrentYearChart = React.lazy(() => import('./CurrentYearChart'));

export default function Depreciacion() {
  const [comparisonYears, setComparisonYears] = useState([new Date().getFullYear()]);
  const [depreciationYear, setDepreciationYear] = useState(new Date().getFullYear());
  const [depreciationMethod, setDepreciationMethod] = useState('LINEA_RECTA');
  const [comparisonData, setComparisonData] = useState([]);
  const [depreciationData, setDepreciationData] = useState([]);
  const [filteredDepreciationData, setFilteredDepreciationData] = useState([]);
  const [currentYearDepreciation, setCurrentYearDepreciation] = useState([]);
  const [loading, setLoading] = useState({
    comparison: true,
    currentYear: true,
    depreciation: true
  });
  const [dateRange, setDateRange] = useState([moment().startOf('year'), moment()]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("codigo");
  const [sortOrder, setSortOrder] = useState("ascend");

  useEffect(() => {
    fetchComparisonData();
    fetchCurrentYearDepreciation();
  }, [comparisonYears]);

  useEffect(() => {
    fetchDepreciationData();
  }, [depreciationYear, depreciationMethod]);

  const fetchComparisonData = async () => {
    setLoading(prev => ({ ...prev, comparison: true }));
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/comparacion`, {
        params: { años: comparisonYears.join(',') }
      });
      setComparisonData(response.data.comparison);
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
        params: { año: depreciationYear, metodo: depreciationMethod }
      });
      setDepreciationData(response.data);
      setFilteredDepreciationData(response.data);
    } catch (error) {
      console.error('Error fetching depreciation data:', error);
      toast.error('No se pudo cargar los datos de depreciación.');
    } finally {
      setLoading(prev => ({ ...prev, depreciation: false }));
    }
  };

  const fetchCurrentYearDepreciation = async () => {
    setLoading(prev => ({ ...prev, currentYear: true }));
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/actual`);
      setCurrentYearDepreciation(response.data);
    } catch (error) {
      console.error('Error fetching current year depreciation:', error);
      toast.error('No se pudo cargar la depreciación del año actual.');
    } finally {
      setLoading(prev => ({ ...prev, currentYear: false }));
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
    applyFilters(dates, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters(dateRange, value);
  };

  const applyFilters = (dates, search) => {
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

    setFilteredDepreciationData(filtered);
  };

  const clearFilters = () => {
    setDateRange([moment().startOf('year'), moment()]);
    setSearchTerm("");
    setFilteredDepreciationData(depreciationData);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Add logo
    const logoUrl = 'https://i.ibb.co/QdCDD3j/ead9f229-bf68-46a1-bc0d-c585ef2995e4-logoo-emi.jpg';
    doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);

    // Add title and date
    doc.setFontSize(18);
    doc.setTextColor(0, 48, 135); // emi_azul color
    doc.text("Reporte de Depreciaciones", pageWidth / 2, 25, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Generado el: ${moment().format('DD/MM/YYYY HH:mm')}`, pageWidth / 2, 35, { align: "center" });

    // Add report characteristics
    doc.setFontSize(10);
    doc.text(`Años de comparación: ${comparisonYears.join(', ')}`, 14, 45);
    doc.text(`Método de depreciación: ${depreciationMethod === 'LINEA_RECTA' ? 'Línea Recta' : 'Saldos Decrecientes'}`, 14, 52);
    doc.text(`Año de depreciación: ${depreciationYear}`, 14, 59);

    // Comparison data table
    doc.setFontSize(14);
    doc.setTextColor(0, 48, 135); // emi_azul color
    doc.text("Comparación de Depreciaciones", 14, 70);
    const comparisonTableData = comparisonData.flatMap((yearData, index) => 
      yearData.map(monthData => [
        comparisonYears[index],
        monthData.month,
        monthData.lineaRecta.toFixed(2),
        monthData.saldosDecrecientes.toFixed(2)
      ])
    );
    doc.autoTable({
      startY: 75,
      head: [['Año', 'Mes', 'Línea Recta', 'Saldos Decrecientes']],
      body: comparisonTableData,
      theme: 'grid',
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      headStyles: { fillColor: [255, 191, 0], textColor: [0, 48, 135], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Depreciation data table
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 48, 135); // emi_azul color
    doc.text(`Depreciación por Método (${depreciationYear})`, 14, 15);
    const depreciationTableData = filteredDepreciationData.map(item => [
      item.codigo,
      item.costoInicial.toFixed(2),
      item.valorDepreciacion.toFixed(2),
      item.nuevoCosto.toFixed(2)
    ]);
    doc.autoTable({
      startY: 20,
      head: [['Código', 'Costo Inicial', 'Valor Depreciación', 'Nuevo Costo']],
      body: depreciationTableData,
      theme: 'grid',
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      headStyles: { fillColor: [255, 191, 0], textColor: [0, 48, 135], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Current year depreciation table
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(0, 48, 135); // emi_azul color
    doc.text(`Depreciación del Año Actual (${new Date().getFullYear()})`, 14, 15);
    const currentYearTableData = currentYearDepreciation.map(item => [
      item.codigo,
      item.costoInicial.toFixed(2),
      item.valorLineaRecta.toFixed(2),
      item.valorSaldosDecrecientes.toFixed(2),
      item.nuevoCostoLineaRecta.toFixed(2),
      item.nuevoCostoSaldosDecrecientes.toFixed(2)
    ]);
    doc.autoTable({
      startY: 20,
      head: [['Código', 'Costo Inicial', 'Valor LR', 'Valor SD', 'Nuevo Costo LR', 'Nuevo Costo SD']],
      body: currentYearTableData,
      theme: 'grid',
      styles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      headStyles: { fillColor: [255, 191, 0], textColor: [0, 48, 135], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });

    // Add page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - 20, pageHeight - 10);
    }

    doc.save('reporte_depreciaciones.pdf');
    toast.success('El reporte en PDF ha sido generado y descargado.');
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
  ];

  return (
    <div className="container mx-auto p-4 bg-gray-100">
      <h1 className="text-3xl font-bold text-left mb-8 text-emi_azul">Dashboard de Depreciación</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Comparison Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-emi_azul">Comparación de Depreciaciones</h2>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {comparisonYears.map(year => (
              <div key={year} className="flex items-center bg-gray-100 rounded-full px-3 py-1">
                <span className="mr-2 text-emi_azul">{year}</span>
                <button 
                  className="text-red-500 hover:text-red-700"
                  onClick={() => handleRemoveYear(year)}
                >
                  <RiSubtractLine />
                </button>
              </div>
            ))}
            <button 
              className="bg-emi_amarillo text-emi_azul rounded-full px-3 py-1 flex items-center hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
              onClick={handleAddYear}
            >
              <RiAddLine className="mr-1" /> Añadir Año
            </button>
          </div>
          <Suspense fallback={<Skeleton active />}>
            {loading.comparison ? (
              <Skeleton active />
            ) : (
              <ComparisonChart data={comparisonData} years={comparisonYears} />
            )}
          </Suspense>
        </div>

        {/* Current Year Depreciation Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4 text-emi_azul">Depreciación del Año Actual</h2>
          <Suspense fallback={<Skeleton active />}>
            {loading.currentYear ? (
              <Skeleton active />
            ) : (
              <CurrentYearChart data={currentYearDepreciation} />
            )}
          </Suspense>
        </div>
      </div>

      {/* Depreciation by Method Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-emi_azul">Depreciación por Método y Año</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-emi_azul">Año:</label>
            <DatePicker
              picker="year"
              value={moment(depreciationYear.toString())}
              onChange={(date) => setDepreciationYear(date.year())}
              className="w-full border-emi_azul"
            />
          </div>
          <div>
            <label className="block mb-2 text-emi_azul">Método:</label>
            <Select
              value={depreciationMethod}
              onChange={(value) => setDepreciationMethod(value)}
              className="w-full"
            >
              <Option value="LINEA_RECTA">Línea Recta</Option>
              <Option value="SALDOS_DECRECIENTES">Saldos Decrecientes</Option>
            </Select>
          </div>
        </div>
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div className="flex flex-wrap items-center space-x-4 mb-4">
            <RangePicker 
              onChange={handleDateRangeChange}
              value={dateRange}
              className="w-full sm:w-auto mb-2 sm:mb-0 border-emi_azul"
            />
            <Input.Search
              placeholder="Buscar por código"
              onSearch={handleSearch}
              style={{ width: 250 }}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            />
          </div>
          <Space>
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
                  <div className="p-4 bg-gray-50">
                    <p><strong>Código:</strong> {record.codigo}</p>
                    <p><strong>Costo Inicial:</strong> {record.costoInicial.toFixed(2)}</p>
                    <p><strong>Valor Depreciación:</strong> {record.valorDepreciacion.toFixed(2)}</p>
                    <p><strong>Nuevo Costo:</strong> {record.nuevoCosto.toFixed(2)}</p>
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