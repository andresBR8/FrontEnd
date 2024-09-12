import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

interface DepreciacionItem {
  codigo: string;
  costoInicial: number;
  valorLineaRecta: number;
  valorSaldosDecrecientes: number;
}

export default function DepreciacionDashboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [depreciationData, setDepreciationData] = useState<DepreciacionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('LINEA_RECTA');

  useEffect(() => {
    fetchDepreciationData();
  }, [year, selectedMethod]);

  const fetchDepreciationData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/depreciacion/año`, {
        params: { año: year, metodo: selectedMethod }
      });
      setDepreciationData(response.data);
    } catch (error) {
      console.error('Error fetching depreciation data:', error);
      toast.error('No se pudo cargar los datos de depreciación.');
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newYear = parseInt(e.target.value);
    if (!isNaN(newYear) && newYear > 0) {
      setYear(newYear);
    }
  };

  const chartData = {
    labels: depreciationData.map(item => item.codigo),
    datasets: [
      {
        label: 'Línea Recta',
        data: depreciationData.map(item => item.valorLineaRecta),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Saldos Decrecientes',
        data: depreciationData.map(item => item.valorSaldosDecrecientes),
        backgroundColor: 'rgba(255, 159, 64, 0.6)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Depreciación del Año ${year}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Valor de Depreciación'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Código de Activo'
        }
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="bg-white shadow-md rounded-lg mb-8">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-center mb-6">Dashboard de Depreciación</h2>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1">
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Año:</label>
              <input
                id="year"
                type="number"
                value={year}
                onChange={handleYearChange}
                min="1900"
                max="2100"
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="method" className="block text-sm font-medium text-gray-700 mb-1">Método de Depreciación:</label>
              <select
                id="method"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LINEA_RECTA">Línea Recta</option>
                <option value="SALDOS_DECRECIENTES">Saldos Decrecientes</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchDepreciationData}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : 'Actualizar Datos'}
              </button>
            </div>
          </div>
          <div className="h-[400px]">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Detalles de Depreciación</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo Inicial</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Línea Recta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Saldos Decrecientes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {depreciationData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">{item.codigo}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.costoInicial.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.valorLineaRecta.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.valorSaldosDecrecientes.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
}