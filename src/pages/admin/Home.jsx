import React, { useState, useEffect } from "react";
import { notification, message, Skeleton } from "antd";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';
import { SmileOutlined, WarningOutlined } from '@ant-design/icons';

const COLORS = ['#4299E1', '#48BB78', '#F6AD55', '#F56565', '#9F7AEA', '#ED64A6'];

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    kpis: null,
    assetValueTrend: [],
    assetDistribution: [],
    assetStatus: [],
    latestAssignments: [],
    assetsByUnit: [],
    highValueAssets: [],
    depreciationComparison: [],
    upcomingDepreciations: [],
  });
  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [
          kpis,
          assetValueTrend,
          assetDistribution,
          assetStatus,
          latestAssignments,
          assetsByUnit,
          highValueAssets,
          depreciationComparison,
          upcomingDepreciations
        ] = await Promise.all([
          axios.get(`${apiUrl}/dashboard/kpis`),
          axios.get(`${apiUrl}/dashboard/asset-value-trend`),
          axios.get(`${apiUrl}/dashboard/asset-distribution`),
          axios.get(`${apiUrl}/dashboard/asset-status`),
          axios.get(`${apiUrl}/dashboard/latest-assignments`),
          axios.get(`${apiUrl}/dashboard/assets-by-unit`),
          axios.get(`${apiUrl}/dashboard/high-value-assets`),
          axios.get(`${apiUrl}/depreciacion/comparacion?años=${encodeURIComponent('2024')}`),
          axios.get(`${apiUrl}/dashboard/upcoming-depreciations`)
        ]);

        setDashboardData({
          kpis: kpis.data,
          assetValueTrend: assetValueTrend.data.trend,
          assetDistribution: assetDistribution.data.distribution,
          assetStatus: assetStatus.data.status,
          latestAssignments: latestAssignments.data.assignments,
          assetsByUnit: assetsByUnit.data.assetsByUnit,
          highValueAssets: highValueAssets.data.highValueAssets,
          depreciationComparison: depreciationComparison.data.comparison[0],
          upcomingDepreciations: upcomingDepreciations.data.upcomingDepreciations,
        });

        message.success('Datos del dashboard cargados correctamente');
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        notification.error({
          message: 'Error',
          description: 'No se pudieron cargar los datos del dashboard.',
          icon: <WarningOutlined style={{ color: '#ff4d4f' }} />
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' }).format(value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-BO');
  };

  const renderKPICard = (title, value, growth) => (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-emi_azul transition-all duration-300 hover:shadow-lg">
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2 text-emi_azul">{title}</h3>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          {growth && (
            <p className={`text-sm ${growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {growth > 0 ? '↑' : '↓'} {Math.abs(growth).toFixed(2)}%
            </p>
          )}
        </>
      )}
    </div>
  );

  const renderChart = (title, chart) => (
    <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-emi_azul transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-emi_azul">{title}</h2>
      {loading ? (
        <Skeleton.Input style={{ width: '100%', height: 300 }} active={true} size="large" />
      ) : (
        chart
      )}
    </div>
  );

  const renderTable = (title, headers, data, rowRenderer) => (
    <div className="bg-white rounded-lg shadow-md p-4 border-t-4 border-emi_azul transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-emi_azul">{title}</h2>
      {loading ? (
        <Skeleton active paragraph={{ rows: 5 }} />
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-emi_azul text-emi_amarillo">
                {headers.map((header, index) => (
                  <th key={index} className="px-4 py-2">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  {rowRenderer(item)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <header className="bg-emi_azul text-emi_amarillo p-4 rounded-lg shadow-md mb-6">
        <h1 className="text-3xl font-bold">Dashboard de Gestión de Activos Fijos</h1>
      </header>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {renderKPICard("Total de Activos", dashboardData.kpis?.totalAssets)}
        {renderKPICard("Valor Total", formatCurrency(dashboardData.kpis?.totalValue))}
        {renderKPICard("Activos Asignados", `${dashboardData.kpis?.assignedAssets} (${dashboardData.kpis?.assignedPercentage.toFixed(2)}%)`)}
        {renderKPICard("Bajas Pendientes", dashboardData.kpis?.pendingDisposals)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
        {renderChart("Distribución de Activos por Categoría", (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={dashboardData.assetDistribution}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {dashboardData.assetDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {renderChart("Estado de los Activos", (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.assetStatus}>
              <XAxis dataKey="condition" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#4299E1" />
            </BarChart>
          </ResponsiveContainer>
        ))}

        {renderChart("Tendencia del Valor de Activos", (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.assetValueTrend}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#F6AD55" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        ))}
      </div>

      {renderChart("Comparación de Métodos de Depreciación", (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dashboardData.depreciationComparison}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="lineaRecta" stroke="#4299E1" strokeWidth={2} />
            <Line type="monotone" dataKey="saldosDecrecientes" stroke="#F6AD55" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {renderTable(
          "Últimas Asignaciones",
          ["ID Activo", "Personal", "Fecha"],
          dashboardData.latestAssignments,
          (assignment) => (
            <>
              <td className="px-4 py-2 text-emi_azul">{assignment.assetId}</td>
              <td className="px-4 py-2 text-emi_azul">{assignment.personnel}</td>
              <td className="px-4 py-2 text-emi_azul">{formatDate(assignment.date)}</td>
            </>
          )
        )}

        {renderTable(
          "Activos de Mayor Valor",
          ["ID", "Nombre", "Valor Actual", "Estado"],
          dashboardData.highValueAssets,
          (asset) => (
            <>
              <td className="px-4 py-2 text-emi_azul">{asset.id}</td>
              <td className="px-4 py-2 text-emi_azul">{asset.name}</td>
              <td className="px-4 py-2 text-emi_azul">{formatCurrency(asset.currentValue)}</td>
              <td className="px-4 py-2 text-emi_azul">{asset.condition}</td>
            </>
          )
        )}
      </div>

      {dashboardData.upcomingDepreciations.length > 0 && (
        renderTable(
          "Próximas Depreciaciones",
          ["ID Activo", "Fecha", "Monto", "Método"],
          dashboardData.upcomingDepreciations,
          (depreciation) => (
            <>
              <td className="px-4 py-2">{depreciation.assetId}</td>
              <td className="px-4 py-2">{formatDate(depreciation.date)}</td>
              <td className="px-4 py-2">{formatCurrency(depreciation.amount)}</td>
              <td className="px-4 py-2">{depreciation.method}</td>
            </>
          )
        )
      )}
    </div>
  );
};

export default Dashboard;