import React, { useState, useEffect } from "react";
import Swal from 'sweetalert2';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// URL o base64 del logo de la institución
const logoUrl = "data:image/png;base64,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";


const apiUrl = import.meta.env.VITE_API_URL;

const Depreciation = () => {
  // Métodos de depreciación disponibles
  const methods = ['Línea Recta', 'Saldos Decrecientes'];

  // Inicialización de estados
  const [modelos, setModelos] = useState([]);
  const [filteredModelos, setFilteredModelos] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(methods[0]); // Método seleccionado por defecto
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [lastMonthDepreciations, setLastMonthDepreciations] = useState([]);
  const [contador, setContador] = useState({});

  // Calcular el tiempo restante hasta la depreciación automática anual
  const calculateTimeLeft = () => {
    const now = new Date();
    const nextDepreciation = new Date(now.getFullYear() + 1, 0, 1);
    const difference = nextDepreciation - now;
    return difference > 0 ? {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    } : {};
  };

  // useEffect para cargar los datos y configurar el contador
  useEffect(() => {
    fetchData();
    setContador(calculateTimeLeft());
    const timer = setInterval(() => setContador(calculateTimeLeft()), 1000);
    return () => clearInterval(timer); // Limpia el temporizador cuando el componente se desmonta
  }, []);

  // Función para obtener los datos desde el backend
  const fetchData = async () => {
    try {
      const modelosResponse = await axios.get(`${apiUrl}/activo-modelo`);
      setModelos(modelosResponse.data.data);
      setFilteredModelos(modelosResponse.data.data);

      const depreciationsResponse = await axios.get(`${apiUrl}/depreciacion/ultimo-mes`);
      setLastMonthDepreciations(depreciationsResponse.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'No se pudieron cargar los datos desde el servidor.', 'error');
    }
  };

  // Función para manejar el cambio en el filtro de modelos
  const handleFiltroModeloChange = (e) => {
    setFilteredModelos(modelos.filter(modelo => modelo.nombre.toLowerCase().includes(e.target.value.toLowerCase())));
  };

  // Función para calcular el valor de depreciación
  const calculateDepreciationValue = (unidad, metodo) => {
    const { vidaUtil, porcentajeDepreciacion } = unidad.activoModelo.partida;
    const age = new Date().getFullYear() - new Date(unidad.activoModelo.fechaIngreso).getFullYear();

    switch (metodo) {
      case 'Línea Recta':
        return (unidad.activoModelo.costo / vidaUtil) * age;
      case 'Saldos Decrecientes':
        return unidad.activoModelo.costo * Math.pow((1 - (porcentajeDepreciacion / 100)), age);
      default:
        return 0;
    }
  };

  // Función para manejar la depreciación de una unidad específica
  const handleDepreciateUnidad = async () => {
    if (!selectedUnidad) {
      Swal.fire('Advertencia', 'Por favor, seleccione una unidad para depreciar.', 'warning');
      return;
    }

    const depreciation = {
      fkActivoUnidad: selectedUnidad.id,
      fecha: new Date(),
      valor: calculateDepreciationValue(selectedUnidad, selectedMethod),
      metodo: selectedMethod,
      causaEspecial: 'Depreciación manual específica',
    };

    try {
      await axios.post(`${apiUrl}/depreciacion`, depreciation);
      Swal.fire('Éxito', `Depreciación de unidad ${selectedUnidad.codigo} realizada con éxito.`, 'success');
      fetchData(); // Actualizar las depreciaciones
    } catch (error) {
      console.error('Error depreciating unidad:', error);
      Swal.fire('Error', `No se pudo realizar la depreciación de la unidad ${selectedUnidad.codigo}.`, 'error');
    }
  };

  // Función para depreciar todos los activos del mes
  const handleDepreciateAllMonthly = async () => {
    try {
      await axios.post(`${apiUrl}/depreciacion/depreciar-todos-mensual`);
      Swal.fire('Éxito', 'Depreciación mensual de todos los activos realizada con éxito.', 'success');
      fetchData(); // Actualizar las depreciaciones
    } catch (error) {
      console.error('Error depreciating all assets monthly:', error);
      Swal.fire('Error', 'No se pudo realizar la depreciación mensual de todos los activos.', 'error');
    }
  };

  // Función para exportar las depreciaciones del último mes a PDF
  const exportToPDF = () => {
    const doc = new jsPDF('landscape'); // Orientación horizontal
    const fechaActual = new Date().toLocaleDateString();
    
    // Añadir el logo en la esquina superior izquierda
    doc.addImage(logoUrl, 'PNG', 10, 10, 50, 20); // (imagen, formato, x, y, width, height)
    
    // Añadir título
    doc.setFontSize(18);
    doc.text("Reporte de Depreciaciones del Último Mes", 70, 15); // Ajustamos la posición para no solapar el logo
    
    // Añadir fecha
    doc.setFontSize(12);
    doc.text(`Fecha: ${fechaActual}`, 70, 25); // También ajustamos la posición
    
    // Añadir tabla de datos
    doc.autoTable({
      startY: 40, // Aseguramos que la tabla empiece más abajo para no solapar el logo
      head: [['ID', 'Fecha', 'Unidad', 'Modelo', 'Descripción', 'Valor', 'Método']],
      body: lastMonthDepreciations.map(dep => [
        dep.id,
        new Date(dep.fecha).toLocaleDateString(),
        dep.activoUnidad.codigo,
        dep.activoUnidad.activoModelo.nombre,
        dep.activoUnidad.activoModelo.descripcion,
        dep.valor,
        dep.metodo
      ]),
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] }, // Color de fondo de las cabeceras
      bodyStyles: { textColor: [44, 62, 80] }, // Color de texto de las celdas
      margin: { top: 40 }
    });

    // Guardar el PDF
    doc.save('reporte_depreciaciones_ultimo_mes.pdf');
    Swal.fire('Éxito', 'El reporte en PDF ha sido generado y descargado.', 'success');
  };

  // Función para exportar las depreciaciones del último mes a Excel
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(lastMonthDepreciations.map(dep => ({
      ID: dep.id,
      Fecha: new Date(dep.fecha).toLocaleDateString(),
      Unidad: dep.activoUnidad.codigo,
      Modelo: dep.activoUnidad.activoModelo.nombre,
      Descripción: dep.activoUnidad.activoModelo.descripcion,
      Valor: dep.valor,
      Método: dep.metodo,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Depreciaciones Último Mes');
    XLSX.writeFile(workbook, 'reporte_depreciaciones_ultimo_mes.xlsx');
    Swal.fire('Éxito', 'El reporte en Excel ha sido generado y descargado.', 'success');
  };

  // Configuración de datos para el gráfico
  const data = {
    labels: lastMonthDepreciations.map(dep => new Date(dep.fecha).toLocaleDateString()), // Muestra fechas de depreciaciones en el gráfico
    datasets: [
      {
        label: 'Valor de Depreciación',
        data: lastMonthDepreciations.map(dep => dep.valor),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      }
    ]
  };

  // Opciones para el gráfico
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
      {/* Sección de depreciación manual */}
      <div className="bg-secondary-100 p-8 rounded-3xl shadow-2xl lg:w-2/5">
        <h1 className="text-3xl text-center uppercase font-bold tracking-[5px] text-emi_amarillo mb-8">
          Depreciar <span className="text-white">Unidad de Activo</span>
        </h1>
        <div className="text-center mb-4">
          <h3 className="text-lg text-emi_amarillo font-bold">Tiempo restante para la depreciación anual automática:</h3>
          <div className="text-white font-mono text-xl">
            {contador.days}d {contador.hours}h {contador.minutes}m {contador.seconds}s
          </div>
        </div>
        <select 
          className="mb-4 p-2 w-full rounded-lg bg-white text-emi_azul" 
          value={selectedMethod} 
          onChange={e => setSelectedMethod(e.target.value)}
        >
          {methods.map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
        <input 
          type="text" 
          className="mb-4 p-2 w-full rounded-lg bg-white text-emi_azul"
          placeholder="Buscar modelo por nombre..." 
          onChange={handleFiltroModeloChange} 
        />
        <div className="max-h-60 overflow-auto bg-white p-4 rounded-lg">
          {filteredModelos.map(modelo => (
            <div key={modelo.id} className="mb-4">
              <h4 className="text-emi_amarillo font-bold">{modelo.nombre}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                {modelo.activoUnidades.map(unidad => (
                  <div 
                    key={unidad.id} 
                    className={`p-2 rounded-lg cursor-pointer ${selectedUnidad === unidad ? 'bg-emi_azul text-white' : 'bg-white text-emi_azul'}`} 
                    onClick={() => setSelectedUnidad(unidad)}
                  >
                    {unidad.codigo}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button 
          type="button" 
          className="mt-4 bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
          onClick={handleDepreciateUnidad}
        >
          Depreciar Unidad Seleccionada
        </button>
        <button 
          type="button" 
          className="mt-4 bg-emi_amarillo text-emi_azul uppercase font-bold text-sm w-full py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
          onClick={handleDepreciateAllMonthly}
        >
          Depreciar Todos los Activos Mensualmente
        </button>
      </div>

      {/* Sección de reporte, tabla y gráficos */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl lg:w-3/5 mt-4 lg:mt-0">
        <h2 className="text-2xl text-center font-bold text-emi_amarillo mb-4">Depreciaciones del Último Mes</h2>
        <div className="overflow-auto max-h-60 mb-4">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-emi_amarillo p-2 text-emi_azul">ID</th>
                <th className="border-b-2 border-emi_amarillo p-2 text-emi_azul">Fecha</th>
                <th className="border-b-2 border-emi_amarillo p-2 text-emi_azul">Unidad</th>
                <th className="border-b-2 border-emi_amarillo p-2 text-emi_azul">Modelo</th>
                <th className="border-b-2 border-emi_amarillo p-2 text-emi_azul">Descripción</th>
                <th className="border-b-2 border-emi_amarillo p-2 text-emi_azul">Valor</th>
                <th className="border-b-2 border-emi_amarillo p-2 text-emi_azul">Método</th>
              </tr>
            </thead>
            <tbody>
              {lastMonthDepreciations.map(dep => (
                <tr key={dep.id}>
                  <td className="border-b border-emi_amarillo text-emi_azul p-2">{dep.id}</td>
                  <td className="border-b border-emi_amarillo text-emi_azul p-2">{new Date(dep.fecha).toLocaleDateString()}</td>
                  <td className="border-b border-emi_amarillo text-emi_azul p-2">{dep.activoUnidad.codigo}</td>
                  <td className="border-b border-emi_amarillo text-emi_azul p-2">{dep.activoUnidad.activoModelo.nombre}</td>
                  <td className="border-b border-emi_amarillo text-emi_azul p-2">{dep.activoUnidad.activoModelo.descripcion}</td>
                  <td className="border-b border-emi_amarillo text-emi_azul p-2">{dep.valor}</td>
                  <td className="border-b border-emi_amarillo text-emi_azul p-2">{dep.metodo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="w-full h-96">
          <Bar data={data} options={options} />
        </div>
        <div className="flex justify-around mt-8">
          <button 
            type="button" 
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
            onClick={exportToPDF}
          >
            Exportar PDF
          </button>
          <button 
            type="button" 
            className="bg-emi_amarillo text-emi_azul uppercase font-bold text-sm py-3 px-4 rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors"
            onClick={exportToExcel}
          >
            Exportar Excel
          </button>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Depreciation;
