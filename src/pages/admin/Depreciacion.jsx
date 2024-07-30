import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { RiCheckboxBlankLine, RiCheckboxMultipleLine, RiSearchLine, RiDownloadLine } from "react-icons/ri";
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const apiUrl = import.meta.env.VITE_API_URL;

const Depreciation = () => {
  const [activos, setActivos] = useState([]);
  const [filteredActivos, setFilteredActivos] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [activeModelo, setActiveModelo] = useState(null);
  const [filtroModelo, setFiltroModelo] = useState('');
  const [methods] = useState(['Línea Recta', 'Saldos Decrecientes', 'Unidades de Producción']);

  useEffect(() => {
    axios.get(`${apiUrl}/activo-modelo`)
      .then(response => {
        setActivos(response.data.data);
        setFilteredActivos(response.data.data);
      })
      .catch(error => console.error('Error fetching activos:', error));

    axios.get(`${apiUrl}/partida`)
      .then(response => setPartidas(response.data.data))
      .catch(error => console.error('Error fetching partidas:', error));
  }, []);

  const handleFiltroModeloChange = (e) => {
    setFiltroModelo(e.target.value);
    setFilteredActivos(activos.filter(modelo => modelo.nombre.toLowerCase().includes(e.target.value.toLowerCase())));
  };

  const calculateDepreciationValue = (modelo, metodo) => {
    const partida = partidas.find(p => p.id === modelo.fkPartida);
    if (!partida) return 0;
    const { vidaUtil, porcentajeDepreciacion, costo } = partida;
    const age = new Date().getFullYear() - new Date(modelo.fechaIngreso).getFullYear();

    switch (metodo) {
      case 'Línea Recta':
        return (modelo.costo / vidaUtil) * age;
      case 'Saldos Decrecientes':
        return modelo.costo * Math.pow((1 - (porcentajeDepreciacion / 100)), age);
      case 'Unidades de Producción':
        return (modelo.costo / vidaUtil) * age; // Simplificado, necesita datos reales de producción
      default:
        return 0;
    }
  };

  const handleDepreciateAllAssets = async () => {
    const allDepreciations = activos.map(modelo => ({
      fkActivoUnidad: modelo.id,
      fecha: new Date(),
      valor: calculateDepreciationValue(modelo, 'Línea Recta'),
      metodo: 'Línea Recta',
      ajuste: 0,
      revaluacion: 0
    }));
    try {
      await Promise.all(allDepreciations.map(depreciacion => axios.post(`${apiUrl}/depreciacion`, depreciacion)));
      Swal.fire('Éxito', 'Todas las depreciaciones se han realizado con éxito.', 'success');
    } catch (error) {
      console.error('Error depreciating all assets:', error);
      Swal.fire('Error', 'No se pudo realizar la depreciación de todos los activos.', 'error');
    }
  };

  const handleDepreciateModel = async (modeloId) => {
    const modelo = activos.find(m => m.id === modeloId);
    if (!modelo) return;
    const depreciations = modelo.activoUnidades.map(unidad => ({
      fkActivoUnidad: unidad.id,
      fecha: new Date(),
      valor: calculateDepreciationValue(modelo, 'Línea Recta'),
      metodo: 'Línea Recta',
      ajuste: 0,
      revaluacion: 0
    }));
    try {
      await Promise.all(depreciations.map(depreciacion => axios.post(`${apiUrl}/depreciacion`, depreciacion)));
      Swal.fire('Éxito', `Depreciación de modelo ${modelo.nombre} realizada con éxito.`, 'success');
    } catch (error) {
      console.error('Error depreciating model:', error);
      Swal.fire('Error', `No se pudo realizar la depreciación del modelo ${modelo.nombre}.`, 'error');
    }
  };

  const handleDepreciateAsset = async (modeloId, unidadId) => {
    const modelo = activos.find(m => m.id === modeloId);
    const unidad = modelo?.activoUnidades.find(u => u.id === unidadId);
    if (!modelo || !unidad) return;
    const depreciation = {
      fkActivoUnidad: unidad.id,
      fecha: new Date(),
      valor: calculateDepreciationValue(modelo, 'Línea Recta'),
      metodo: 'Línea Recta',
      ajuste: 0,
      revaluacion: 0
    };
    try {
      await axios.post(`${apiUrl}/depreciacion`, depreciation);
      Swal.fire('Éxito', `Depreciación de activo ${unidad.codigo} realizada con éxito.`, 'success');
    } catch (error) {
      console.error('Error depreciating asset:', error);
      Swal.fire('Error', `No se pudo realizar la depreciación del activo ${unidad.codigo}.`, 'error');
    }
  };

  const toggleModeloUnidades = (modeloId) => {
    setActiveModelo(activeModelo === modeloId ? null : modeloId);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("Reporte de Depreciaciones", 20, 10);
    doc.autoTable({
      head: [['ID', 'Fecha', 'Valor', 'Método', 'Ajuste', 'Revaluación']],
      body: activos.flatMap(modelo => 
        modelo.activoUnidades.map(unidad => [
          unidad.id,
          new Date().toLocaleDateString(),
          calculateDepreciationValue(modelo, 'Línea Recta'),
          'Línea Recta',
          0,
          0
        ])
      )
    });
    doc.save('reporte_depreciaciones.pdf');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(activos.flatMap(modelo => 
      modelo.activoUnidades.map(unidad => ({
        ID: unidad.id,
        Fecha: new Date().toLocaleDateString(),
        Valor: calculateDepreciationValue(modelo, 'Línea Recta'),
        Método: 'Línea Recta',
        Ajuste: 0,
        Revaluación: 0
      }))
    ));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Depreciaciones');
    XLSX.writeFile(workbook, 'reporte_depreciaciones.xlsx');
  };

  const data = {
    labels: activos.map(modelo => modelo.nombre),
    datasets: [
      {
        label: 'Valor de Depreciación',
        data: activos.map(modelo => calculateDepreciationValue(modelo, 'Línea Recta')),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }
    ]
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="p-4 flex flex-col lg:flex-row justify-between">
      <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl lg:w-2/5">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_amarillo mb-8">
          Depreciar <span className="text-white">Activos</span>
        </h1>
        <button 
          type="button" 
          className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors mb-4"
          onClick={handleDepreciateAllAssets}
        >
          Depreciar Todos los Activos
        </button>
        <div className="relative mb-4">
          <RiSearchLine className="absolute top-1/2 -translate-y-1/2 left-2 text-primary" />
          <input 
            type="text" 
            className="py-3 pl-10 pr-4 bg-white w-full outline-none rounded-lg text-emi_azul"
            placeholder="Buscar modelo de activo..." 
            value={filtroModelo} 
            onChange={handleFiltroModeloChange} 
          />
        </div>
        <div className="mb-4">
          <h3 className="text-lg text-emi_amarillo font-bold mb-2">Seleccionar Activos</h3>
          <div className="max-h-60 overflow-auto bg-white p-4 rounded-lg">
            {filteredActivos.map(modelo => (
              <div key={modelo.id} className="mb-4 border-b pb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-emi_amarillo cursor-pointer" onClick={() => toggleModeloUnidades(modelo.id)}>{modelo.nombre}</h4>
                    <p className="text-emi_amarillo">Cantidad disponible: {modelo.cantidad}</p>
                  </div>
                  <RiCheckboxMultipleLine 
                    className="text-primary cursor-pointer" 
                    onClick={() => handleDepreciateModel(modelo.id)} 
                    title="Depreciar todos" 
                  />
                </div>
                {activeModelo === modelo.id && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    {modelo.activoUnidades.map(unidad => (
                      <div key={unidad.id} className="flex items-center bg-white p-2 rounded-lg shadow-sm">
                        <div className="flex items-center justify-center w-8 h-8 mr-2">
                          <RiCheckboxBlankLine className="text-primary cursor-pointer" onClick={() => handleDepreciateAsset(modelo.id, unidad.id)} />
                        </div>
                        <div className="text-emi_azul">{unidad.codigo}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <button 
          type="button" 
          className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors mb-4"
          onClick={exportToPDF}
        >
          Exportar PDF
        </button>
        <button 
          type="button" 
          className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors mb-4"
          onClick={exportToExcel}
        >
          Exportar Excel
        </button>
      </div>
      <div className="bg-white p-8 rounded-3xl shadow-2xl lg:w-3/5 mt-4 lg:mt-0">
        <h2 className="text-2xl text-center font-bold text-emi_amarillo mb-4">Depreciaciones Actuales</h2>
        <div className="w-full h-96">
          <Bar data={data} options={options} />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Depreciation;
