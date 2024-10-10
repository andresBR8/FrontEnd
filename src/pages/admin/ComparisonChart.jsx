import React from 'react';
import { Bar } from 'react-chartjs-2';

const ComparisonChart = ({ data, years }) => {
  const chartData = {
    labels: data[0]?.map(item => item.month) || [],
    datasets: years.flatMap((year, index) => [
      {
        label: `Línea Recta ${year}`,
        data: data[index]?.map(item => item.lineaRecta) || [],
        backgroundColor: `rgba(0, 48, 135, ${0.6 - 0.1 * index})`,
        borderColor: `rgba(0, 48, 135, ${0.8 - 0.1 * index})`,
        borderWidth: 1,
      },
     
    ])
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Comparación de Depreciación MES',
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

  return <Bar data={chartData} options={options} />;
};

export default ComparisonChart;