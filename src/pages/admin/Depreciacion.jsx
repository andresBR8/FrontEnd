import React, { useState, useEffect } from "react";
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

export default function Depreciacion() {
  const [comparisonYears, setComparisonYears] = useState([new Date().getFullYear()]);
  const [depreciationYear, setDepreciationYear] = useState(new Date().getFullYear());
  const [depreciationMethod, setDepreciationMethod] = useState('LINEA_RECTA');
  const [comparisonData, setComparisonData] = useState([]);
  const [depreciationData, setDepreciationData] = useState([]);
  const [currentYearDepreciation, setCurrentYearDepreciation] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComparisonData();
    fetchCurrentYearDepreciation();
  }, [comparisonYears]);

  useEffect(() => {
    fetchDepreciationData();
  }, [depreciationYear, depreciationMethod]);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/comparacion`, {
        params: { años: comparisonYears.join(',') }
      });
      setComparisonData(response.data.comparison);
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      toast.error('No se pudo cargar la comparación de depreciaciones.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepreciationData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/metodo`, {
        params: { año: depreciationYear, metodo: depreciationMethod }
      });
      setDepreciationData(response.data);
    } catch (error) {
      console.error('Error fetching depreciation data:', error);
      toast.error('No se pudo cargar los datos de depreciación.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentYearDepreciation = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/año-actual`);
      setCurrentYearDepreciation(response.data);
    } catch (error) {
      console.error('Error fetching current year depreciation:', error);
      toast.error('No se pudo cargar la depreciación del año actual.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddYear = () => {
    const newYear = Math.max(...comparisonYears) + 1;
    setComparisonYears([...comparisonYears, newYear]);
  };

  const handleRemoveYear = (year) => {
    setComparisonYears(comparisonYears.filter(y => y !== year));
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Depreciaciones", 14, 15);
    
    // Comparison data table
    doc.text("Comparación de Depreciaciones", 14, 25);
    const comparisonTableData = comparisonData.flatMap((yearData, index) => 
      yearData.map(monthData => [
        comparisonYears[index],
        monthData.month,
        monthData.lineaRecta.toFixed(2),
        monthData.saldosDecrecientes.toFixed(2)
      ])
    );
    doc.autoTable({
      startY: 30,
      head: [['Año', 'Mes', 'Línea Recta', 'Saldos Decrecientes']],
      body: comparisonTableData,
    });

    // Depreciation data table
    doc.addPage();
    doc.text(`Depreciación por Método (${depreciationYear})`, 14, 15);
    const depreciationTableData = depreciationData.map(item => [
      item.codigo,
      item.costoInicial.toFixed(2),
      item.valorDepreciacion.toFixed(2),
      item.nuevoCosto.toFixed(2)
    ]);
    doc.autoTable({
      startY: 20,
      head: [['Código', 'Costo Inicial', 'Valor Depreciación', 'Nuevo Costo']],
      body: depreciationTableData,
    });

    // Current year depreciation table
    doc.addPage();
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
    });

    doc.save('reporte_depreciaciones.pdf');
    toast.success('El reporte en PDF ha sido generado y descargado.');
  };

  const comparisonChartData = {
    labels: comparisonData[0]?.map(item => item.month) || [],
    datasets: comparisonYears.flatMap((year, index) => [
      {
        label: `Línea Recta ${year}`,
        data: comparisonData[index]?.map(item => item.lineaRecta) || [],
        backgroundColor: `rgba(75, 192, 192, ${0.6 - 0.1 * index})`,
        borderColor: `rgba(75, 192, 192, ${0.8 - 0.1 * index})`,
        borderWidth: 1,
      },
      {
        label: `Saldos Decrecientes ${year}`,
        data: comparisonData[index]?.map(item => item.saldosDecrecientes) || [],
        backgroundColor: `rgba(255, 159, 64, ${0.6 - 0.1 * index})`,
        borderColor: `rgba(255, 159, 64, ${0.8 - 0.1 * index})`,
        borderWidth: 1,
      }
    ])
  };

  const currentYearChartData = {
    labels: currentYearDepreciation.map(item => item.codigo),
    datasets: [
      {
        label: 'Línea Recta',
        data: currentYearDepreciation.map(item => item.valorLineaRecta),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Saldos Decrecientes',
        data: currentYearDepreciation.map(item => item.valorSaldosDecrecientes),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparación de Métodos de Depreciación',
      },
    },
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center mb-8">Dashboard de Depreciación</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Comparison Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Comparación de Depreciaciones</h2>
          <div className="mb-4">
            {comparisonYears.map(year => (
              <div key={year} className="flex items-center mb-2">
                <span className="mr-2">{year}</span>
                <button 
                  className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                  onClick={() => handleRemoveYear(year)}
                >
                  Eliminar
                </button>
              </div>
            ))}
            <button 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              onClick={handleAddYear}
            >
              Añadir Año
            </button>
          </div>
          <div className="h-80">
            <Bar data={comparisonChartData} options={chartOptions} />
          </div>
        </div>

        {/* Current Year Depreciation Section */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-4">Depreciación del Año Actual</h2>
          <div className="h-80">
            <Line 
              data={currentYearChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: `Depreciación del Año ${new Date().getFullYear()}`,
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Depreciation by Method Section */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-4">Depreciación por Método y Año</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2">Año:</label>
            <input 
              type="number" 
              value={depreciationYear}
              onChange={(e) => setDepreciationYear(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block mb-2">Método:</label>
            <select
              value={depreciationMethod}
              onChange={(e) => setDepreciationMethod(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="LINEA_RECTA">Línea Recta</option>
              <option value="SALDOS_DECRECIENTES">Saldos Decrecientes</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2 bg-gray-100">Código</th>
                <th className="px-4 py-2 bg-gray-100">Costo Inicial</th>
                <th className="px-4 py-2 bg-gray-100">Valor Depreciación</th>
                <th className="px-4 py-2 bg-gray-100">Nuevo Costo</th>
              </tr>
            </thead>
            <tbody>
              {depreciationData.map(item => (
                <tr key={item.id}>
                  <td className="border px-4 py-2">{item.codigo}</td>
                  <td className="border px-4 py-2">{item.costoInicial.toFixed(2)}</td>
                  <td className="border px-4 py-2">{item.valorDepreciacion.toFixed(2)}</td>
                  <td className="border px-4 py-2">{item.nuevoCosto.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-8 flex justify-center">
        <button 
          className="px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-bold"
          onClick={exportToPDF}
        >
          Exportar Reporte PDF
        </button>
      </div>

      <ToastContainer />
    </div>
  );
}