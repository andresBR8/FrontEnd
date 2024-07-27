import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const apiUrl = import.meta.env.VITE_API_URL;

const Reportes = () => {
  const [reportData, setReportData] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [reportType, setReportType] = useState('activos-por-modelo');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [partidas, setPartidas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [estado, setEstado] = useState('');
  const [filtroModelo, setFiltroModelo] = useState('');
  const [filteredModelos, setFilteredModelos] = useState([]);
  const [selectedPartida, setSelectedPartida] = useState(null);
  const [selectedModelo, setSelectedModelo] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (modelos.length > 0 && !selectedModelo) {
      setSelectedModelo(modelos[0].id);
    }
  }, [modelos]);

  useEffect(() => {
    if (isValidRequest()) {
      fetchReportData();
    }
  }, [reportType, fechaInicio, fechaFin, selectedPartida, selectedModelo, estado]);

  const fetchInitialData = async () => {
    try {
      const partidaResponse = await axios.get(`${apiUrl}/partida`);
      setPartidas(partidaResponse.data.data);
      const modeloResponse = await axios.get(`${apiUrl}/activo-modelo`);
      setModelos(modeloResponse.data.data);
      setFilteredModelos(modeloResponse.data.data);
    } catch (error) {
      Swal.fire('Error', 'No se pudo obtener los datos iniciales', 'error');
    }
  };

  const isValidRequest = () => {
    switch (reportType) {
      case 'activos-por-modelo':
        return selectedModelo !== null;
      case 'activos-por-partida':
        return selectedPartida !== null;
      case 'depreciaciones-por-rango-fechas':
      case 'bajas-por-rango-fechas':
      case 'mantenimientos-por-rango-fechas':
        return fechaInicio !== '' && fechaFin !== '';
      case 'activos-por-estado':
        return estado !== '';
      default:
        return true;
    }
  };

  const fetchReportData = async () => {
    try {
      let response;
      switch (reportType) {
        case 'activos-por-modelo':
          response = await axios.get(`${apiUrl}/reportes/activos-por-modelo`, {
            params: { fkActivoModelo: selectedModelo }
          });
          break;
        case 'activos-por-partida':
          response = await axios.get(`${apiUrl}/reportes/activos-por-partida`, {
            params: { fkPartida: selectedPartida }
          });
          break;
        case 'depreciaciones-por-rango-fechas':
          response = await axios.get(`${apiUrl}/reportes/depreciaciones-por-rango-fechas`, {
            params: { fechaInicio, fechaFin }
          });
          break;
        case 'bajas-por-rango-fechas':
          response = await axios.get(`${apiUrl}/reportes/bajas-por-rango-fechas`, {
            params: { fechaInicio, fechaFin }
          });
          break;
        case 'mantenimientos-por-rango-fechas':
          response = await axios.get(`${apiUrl}/reportes/mantenimientos-por-rango-fechas`, {
            params: { fechaInicio, fechaFin }
          });
          break;
        case 'activos-por-estado':
          response = await axios.get(`${apiUrl}/reportes/activos-por-estado`, { params: { estado } });
          break;
        default:
          response = { data: { data: [] } };
      }

      setReportData(response.data.data);
      generateChartData(response.data.data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      Swal.fire('Error', 'No se pudo obtener los datos del reporte', 'error');
    }
  };

  const generateChartData = async (data) => {
    if (!data || data.length === 0) {
      setChartData(null);
      return;
    }

    let labels = [];
    let values = [];
    let datasets = [];

    switch (reportType) {
      case 'activos-por-modelo':
        labels = [...new Set(data.map(item => item.activoModelo.nombre))];
        values = labels.map(label => data.filter(item => item.activoModelo.nombre === label).length);
        datasets = [
          {
            label: 'Cantidad por Modelo',
            data: values,
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ];
        break;
      case 'activos-por-partida':
        labels = [...new Set(data.map(item => item.activoModelo.partida.nombre))];
        values = labels.map(label => data.filter(item => item.activoModelo.partida.nombre === label).length);
        datasets = [
          {
            label: 'Cantidad por Partida',
            data: values,
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          }
        ];
        break;
      case 'depreciaciones-por-rango-fechas':
        labels = data.map(item => new Date(item.fecha).toLocaleDateString());
        values = labels.map(label => data.filter(item => new Date(item.fecha).toLocaleDateString() === label).length);
        datasets = [
          {
            label: 'Depreciaciones',
            data: values,
            backgroundColor: 'rgba(153, 102, 255, 0.6)',
            borderColor: 'rgba(153, 102, 255, 1)',
            borderWidth: 1
          }
        ];
        break;
      case 'bajas-por-rango-fechas':
        labels = data.map(item => new Date(item.fecha).toLocaleDateString());
        values = labels.map(label => data.filter(item => new Date(item.fecha).toLocaleDateString() === label).length);
        datasets = [
          {
            label: 'Bajas',
            data: values,
            backgroundColor: 'rgba(255, 159, 64, 0.6)',
            borderColor: 'rgba(255, 159, 64, 1)',
            borderWidth: 1
          }
        ];
        break;
      case 'mantenimientos-por-rango-fechas':
        labels = data.map(item => new Date(item.fecha).toLocaleDateString());
        values = labels.map(label => data.filter(item => new Date(item.fecha).toLocaleDateString() === label).length);
        datasets = [
          {
            label: 'Mantenimientos',
            data: values,
            backgroundColor: 'rgba(255, 206, 86, 0.6)',
            borderColor: 'rgba(255, 206, 86, 1)',
            borderWidth: 1
          }
        ];
        break;
      case 'activos-por-estado':
        const estados = ['Bueno', 'Regular', 'Malo'];
        for (const est of estados) {
          const response = await axios.get(`${apiUrl}/reportes/activos-por-estado`, { params: { estado: est } });
          labels = [...new Set([...labels, est])];
          values = [...values, response.data.data.length];
        }
        datasets = [
          {
            label: 'Cantidad por Estado',
            data: values,
            backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
            borderColor: ['rgba(54, 162, 235, 1)', 'rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
            borderWidth: 1
          }
        ];
        break;
      default:
        labels = [];
        values = [];
    }

    const chartData = {
      labels,
      datasets
    };

    setChartData(chartData);
  };

  const handleChartTypeChange = (e) => {
    setChartType(e.target.value);
  };

  const handleReportTypeChange = (e) => {
    setReportType(e.target.value);
  };

  const handleExportCSV = async () => {
    try {
      const response = await axios.get(`${apiUrl}/reportes/export-csv`, {
        params: { tipo: reportType, fechaInicio, fechaFin, fkPartida: selectedPartida, fkActivoModelo: selectedModelo, estado }
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte.csv');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      Swal.fire('Error', 'No se pudo exportar el reporte', 'error');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.get(`${apiUrl}/reportes/export-pdf`, {
        params: { tipo: reportType, fechaInicio, fechaFin, fkPartida: selectedPartida, fkActivoModelo: selectedModelo, estado }
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'reporte.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      Swal.fire('Error', 'No se pudo exportar el reporte', 'error');
    }
  };

  const ChartComponent = chartType === 'bar' ? Bar : Pie;

  const handleFiltroModeloChange = (e) => {
    setFiltroModelo(e.target.value);
    setFilteredModelos(modelos.filter((modelo) => modelo.nombre.toLowerCase().includes(e.target.value.toLowerCase())));
  };

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold">Reportes de Gestión de Activos</h1>
        <div className="flex space-x-4">
          <select value={reportType} onChange={handleReportTypeChange} className="text-sm p-2 border-2 rounded-lg">
            <option value="activos-por-modelo">Activos por Modelo</option>
            <option value="activos-por-partida">Activos por Partida</option>
            <option value="depreciaciones-por-rango-fechas">Depreciaciones por Rango de Fechas</option>
            <option value="bajas-por-rango-fechas">Bajas por Rango de Fechas</option>
            <option value="mantenimientos-por-rango-fechas">Mantenimientos por Rango de Fechas</option>
            <option value="activos-por-estado">Activos por Estado</option>
          </select>
          <select value={chartType} onChange={handleChartTypeChange} className="text-sm p-2 border-2 rounded-lg">
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col md:flex-row mb-4 space-y-4 md:space-y-0 md:space-x-4">
        {reportType === 'activos-por-modelo' && (
          <div className="w-full md:w-1/3">
            <input
              type="text"
              className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul"
              placeholder="Buscar modelo de activo..."
              value={filtroModelo}
              onChange={handleFiltroModeloChange}
            />
            <select
              className="mt-2 py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black w-full"
              value={selectedModelo}
              onChange={(e) => setSelectedModelo(e.target.value)}
            >
              <option value="">Seleccione un modelo</option>
              {filteredModelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>{modelo.nombre}</option>
              ))}
            </select>
          </div>
        )}
        {reportType === 'activos-por-partida' && (
          <div className="w-full md:w-1/3">
            <select
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black w-full"
              value={selectedPartida}
              onChange={(e) => setSelectedPartida(e.target.value)}
            >
              <option value="">Seleccione una partida</option>
              {partidas.map((partida) => (
                <option key={partida.id} value={partida.id}>{partida.nombre}</option>
              ))}
            </select>
          </div>
        )}
        {reportType.includes('rango-fechas') && (
          <div className="flex space-x-4">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="text-sm p-2 border-2 rounded-lg"
            />
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="text-sm p-2 border-2 rounded-lg"
            />
          </div>
        )}
        {reportType === 'activos-por-estado' && (
          <div className="w-full md:w-1/3">
            <select
              className="py-2 pl-4 pr-4 bg-secondary-900 outline-none rounded-lg text-black w-full"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            >
              <option value="">Seleccione un estado</option>
              <option value="Bueno">Bueno</option>
              <option value="Regular">Regular</option>
              <option value="Malo">Malo</option>
            </select>
          </div>
        )}
        <button onClick={handleExportCSV} className="bg-blue-500 text-white py-2 px-4 rounded-lg">Exportar CSV</button>
        <button onClick={handleExportPDF} className="bg-blue-500 text-white py-2 px-4 rounded-lg">Exportar PDF</button>
      </div>
      <div className="mb-10">
        {chartData ? <ChartComponent data={chartData} /> : <p>No hay datos disponibles para este reporte.</p>}
      </div>
      <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th scope="col" className="py-3 px-6">ID</th>
              <th scope="col" className="py-3 px-6">Nombre</th>
              <th scope="col" className="py-3 px-6">Descripción</th>
              <th scope="col" className="py-3 px-6">Estado</th>
              <th scope="col" className="py-3 px-6">Costo</th>
            </tr>
          </thead>
          <tbody>
            {reportData && reportData.length > 0 ? (
              reportData.map((item) => (
                <tr key={item.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td className="py-4 px-6">{item.id}</td>
                  <td className="py-4 px-6">{item.activoModelo.nombre}</td>
                  <td className="py-4 px-6">{item.activoModelo.descripcion}</td>
                  <td className="py-4 px-6">{item.activoModelo.estado}</td>
                  <td className="py-4 px-6">{item.activoModelo.costo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4">No hay datos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reportes;
