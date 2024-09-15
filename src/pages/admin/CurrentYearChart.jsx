import React from 'react';
import { Line } from 'react-chartjs-2';

const CurrentYearChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.codigo),
    datasets: [
      {
        label: 'Línea Recta',
        data: data.map(item => item.valorLineaRecta),
        borderColor: 'rgb(0, 48, 135)',
        backgroundColor: 'rgba(0, 48, 135, 0.5)',
      },
      {
        label: 'Saldos Decrecientes',
        data: data.map(item => item.valorSaldosDecrecientes),
        borderColor: 'rgb(255, 191, 0)',
        backgroundColor: 'rgba(255, 191, 0, 0.5)',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Depreciación del Año ${new Date().getFullYear()}`,
        color: '#003087',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#003087',
        },
      },
      x: {
        ticks: {
          color: '#003087',
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default CurrentYearChart;