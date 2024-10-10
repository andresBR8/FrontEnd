import React, { useState, useEffect, useMemo } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { RiFileDownloadLine, RiFilterOffLine, RiAddLine, RiUserLine, RiSearchLine, RiCheckboxCircleLine, RiFileTextLine, RiUploadCloud2Line } from "react-icons/ri";
import { DatePicker, Select, Input, Button, Table, Space, Modal } from 'antd';
import moment from 'moment';
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PDFViewer } from '@react-pdf/renderer';
import DevolucionDocument from './DevolucionDocument';
import ReactECharts from 'echarts-for-react';

const { RangePicker } = DatePicker;
const { Option } = Select;

const apiUrl = import.meta.env.VITE_API_URL;

function DevolucionActivos() {
  const [devoluciones, setDevoluciones] = useState([]);
  const [filteredDevoluciones, setFilteredDevoluciones] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [selectedUnidad, setSelectedUnidad] = useState("TODAS");
  const [selectedEstado, setSelectedEstado] = useState("TODOS");
  const [selectedPersonal, setSelectedPersonal] = useState("TODOS");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [unidades, setUnidades] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Modal states
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [selectedPersonalForReturn, setSelectedPersonalForReturn] = useState(null);
  const [activos, setActivos] = useState([]);
  const [selectedActivos, setSelectedActivos] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPDF, setShowPDF] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [actaFile, setActaFile] = useState(null);
  const [actaFileUrl, setActaFileUrl] = useState(null);
  const [detalle, setDetalle] = useState("");

  useEffect(() => {
    fetchDevoluciones();
    fetchPersonal();
  }, []);

  const fetchDevoluciones = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/devolucion`);
      const data = response.data.data;
      setDevoluciones(data);
      setFilteredDevoluciones(data);
      
      const uniqueUnidades = [...new Set(data.map(d => d.personal.unidad.nombre))];
      setUnidades(uniqueUnidades);
    } catch (error) {
      console.error("Error fetching devoluciones:", error);
      toast.error("No se pudo cargar la lista de devoluciones.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPersonal = async () => {
    try {
      const response = await axios.get(`${apiUrl}/personal/activos`);
      setPersonal(response.data.data);
    } catch (error) {
      console.error("Error fetching personal:", error);
      toast.error("No se pudo cargar la lista de personal.");
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    applyFilters(dates, selectedUnidad, selectedEstado, selectedPersonal, searchTerm);
  };

  const handleUnidadChange = (value) => {
    setSelectedUnidad(value);
    applyFilters(dateRange, value, selectedEstado, selectedPersonal, searchTerm);
  };

  const handleEstadoChange = (value) => {
    setSelectedEstado(value);
    applyFilters(dateRange, selectedUnidad, value, selectedPersonal, searchTerm);
  };

  const handlePersonalChange = (value) => {
    setSelectedPersonal(value);
    applyFilters(dateRange, selectedUnidad, selectedEstado, value, searchTerm);
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    applyFilters(dateRange, selectedUnidad, selectedEstado, selectedPersonal, value);
  };

  const clearFilters = () => {
    setDateRange(null);
    setSelectedUnidad("TODAS");
    setSelectedEstado("TODOS");
    setSelectedPersonal("TODOS");
    setSearchTerm("");
    setFilteredDevoluciones(devoluciones);
  };

  const applyFilters = (dates, unidad, estado, personalNombre, search) => {
    let filtered = [...devoluciones];

    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].startOf('day');
      const endDate = dates[1].endOf('day');
      filtered = filtered.filter(devolucion => 
        moment(devolucion.fecha).isBetween(startDate, endDate, null, '[]')
      );
    }

    if (unidad !== "TODAS") {
      filtered = filtered.filter(devolucion => devolucion.personal.unidad.nombre === unidad);
    }

    if (estado !== "TODOS") {
      filtered = filtered.filter(devolucion => devolucion.activoUnidad.estadoCondicion === estado);
    }

    if (personalNombre !== "TODOS") {
      filtered = filtered.filter(devolucion => devolucion.personal.nombre === personalNombre);
    }

    if (search) {
      filtered = filtered.filter(devolucion => 
        devolucion.activoUnidad.codigo.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredDevoluciones(filtered);
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add logo
    const logoUrl = 'https://i.ibb.co/QdCDD3j/ead9f229-bf68-46a1-bc0d-c585ef2995e4-logoo-emi.jpg';
    doc.addImage(logoUrl, 'PNG', 10, 10, 30, 30);

    // Set font styles
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(5, 68, 115); // emi_azul color

    // Add title
    doc.text("REPORTE DE DEVOLUCIONES DE ACTIVOS", doc.internal.pageSize.width / 2, 50, { align: "center" });

    // Reset font for normal text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Add current date and time
    const currentDate = moment().format('DD [de] MMMM [de] YYYY');
    const currentTime = moment().format('HH:mm:ss');
    doc.text(`Fecha: ${currentDate}`, 20, 60);
    doc.text(`Hora: ${currentTime}`, 20, 65);

    // Create table for assets
    const tableColumn = ["Código", "Nombre", "Estado", "Costo Actual"];
    const tableRows = filteredDevoluciones.map(devolucion => [
      devolucion.activoUnidad.codigo,
      devolucion.activoUnidad.nombre,
      devolucion.activoUnidad.estadoCondicion,
      `$${devolucion.activoUnidad.costoActual.toFixed(2)}`
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 80,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [5, 68, 115], textColor: [249, 185, 4] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
    });


    // Add footer
    doc.setFontSize(10);
    doc.text("Este documento es un REPORTE de la devoluciónes  de activos. Por favor, consérvelo para futuros registros.", 20, doc.internal.pageSize.height - 20);

    // Save the PDF
    doc.save("acta_devolucion_activos.pdf");
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      className: 'text-emi_azul',
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      className: 'text-emi_azul',
      render: (text) => moment(text).format('DD/M/YYYY'),
    },
    {
      title: 'Personal',
      dataIndex: ['personal', 'nombre'],
      key: 'personal',
      className: 'text-emi_azul',
    },
    {
      title: 'Unidad',
      dataIndex: ['personal', 'unidad', 'nombre'],
      key: 'unidad',
      className: 'text-emi_azul',
    },
    {
      title: 'Código Activo',
      dataIndex: ['activoUnidad', 'codigo'],
      key: 'codigoActivo',
      className: 'text-emi_azul',
    },
    {
      title: 'Estado Condición',
      dataIndex: ['activoUnidad', 'estadoCondicion'],
      key: 'estadoCondicion',
      className: 'text-emi_azul',
    },
    {
      title: 'Detalle',
      dataIndex: 'detalle',
      key: 'detalle',
      className: 'text-emi_azul',
    },
    {
      title: 'Acta de Devolución',
      key: 'actaDevolucion',
      className: 'text-emi_azul',
      render: (text, record) => (
        <a 
          href={record.actaDevolucion} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-emi_amarillo hover:text-white"
        >
          Descargar
        </a>
      ),
    },
  ];

  // Modal functions
  const showModal = () => {
    setIsModalVisible(true);
    setCurrentStep(1);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    resetModalState();
  };

  const resetModalState = () => {
    setModalSearchTerm("");
    setSelectedPersonalForReturn(null);
    setActivos([]);
    setSelectedActivos([]);
    setCurrentStep(1);
    setShowPDF(false);
    setPdfData(null);
    setActaFile(null);
    setActaFileUrl(null);
    setDetalle("");
  };

  const filteredModalPersonal = useMemo(() => {
    return personal.filter(p => 
      p.nombre.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
      p.ci.includes(modalSearchTerm)
    );
  }, [personal, modalSearchTerm]);

  const handleSelectPersonal = async (persona) => {
    setSelectedPersonalForReturn(persona);
    try {
      const response = await axios.get(`${apiUrl}/devolucion/activos/${persona.id}`);
      setActivos(response.data.data);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error al obtener activos:", error);
      toast.error("Hubo un problema al obtener los activos.");
    }
  };

  const handleActivoSelection = (activoId) => {
    setSelectedActivos(prev =>
      prev.includes(activoId)
        ? prev.filter(id => id !== activoId)
        : [...prev, activoId]
    );
  };

  const generatePDFData = () => {
    if (!selectedPersonalForReturn || selectedActivos.length === 0) return;

    const pdfData = {
      nombre: selectedPersonalForReturn.nombre,
      cargo: selectedPersonalForReturn.cargo.nombre,
      unidad: selectedPersonalForReturn.unidad.nombre,
      activos: activos.filter(activo => selectedActivos.includes(activo.id))
    };

    setPdfData(pdfData);
    setShowPDF(true);
  };

  const handleActaFileChange = (event) => {
    const file = event.target.files[0];
    setActaFile(file);
  };

  const handleUploadActa = async () => {
    if (!actaFile) {
      toast.error('Por favor seleccione un archivo para el acta de devolución');
      return;
    }

    const formData = new FormData();
    formData.append('file', actaFile);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setActaFileUrl(response.data.url);
      toast.success('Acta de devolución subida correctamente');
      setCurrentStep(4);
    } catch (error) {
      console.error('Error al subir el acta:', error);
      toast.error('No se pudo subir el acta de devolución');
    }
  };

  const handleDevolucion = async () => {
    if (selectedActivos.length === 0 || !actaFileUrl) {
      toast.warn("Por favor, seleccione al menos un activo y suba el acta de devolución.");
      return;
    }

    setIsSubmitting(true);

    const devolucionData = {
      fkPersonal: selectedPersonalForReturn.id,
      fkUsuario: localStorage.getItem("id"),
      fecha: new Date().toISOString(),
      detalle: detalle || "Devolución de activos",
      actaDevolucion: actaFileUrl,
      activosUnidades: selectedActivos.map(id => ({ fkActivoUnidad: id })),
    };

    try {
      const response = await axios.post(`${apiUrl}/devolucion`, devolucionData);
      if (response.status === 201) {
        toast.success("Los activos han sido devueltos correctamente.");
        handleCancel();
        fetchDevoluciones();
      } else {
        throw new Error("La respuesta del servidor no fue exitosa");
      }
    } catch (error) {
      console.error("Error al realizar la devolución:", error);
      toast.error("Hubo un problema al realizar la devolución.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 1: Seleccionar Personal</h3>
            <div className="relative">
              <RiUserLine className="absolute top-1/2 transform -translate-y-1/2 left-3 text-emi_azul" />
              <input
                className="shadow appearance-none border rounded w-full py-2 pl-10 pr-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-emi_azul"
                type="text"
                placeholder="Buscar por nombre o CI"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
              />
            </div>
            <div className="mt-4 max-h-60 overflow-y-auto">
              {filteredModalPersonal.map((persona) => (
                <div
                  key={persona.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg flex items-center"
                  onClick={() => handleSelectPersonal(persona)}
                >
                  <RiUserLine className="mr-2 text-emi_azul" />
                  <div>
                    <p className="font-medium text-emi_azul">{persona.nombre}</p>
                    <p className="text-sm text-gray-600">{persona.ci} - {persona.cargo.nombre} - {persona.unidad.nombre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 2: Seleccionar Activos a Devolver</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white">
                <thead className="bg-emi_azul text-white">
                  <tr>
                    <th className="w-1/12 text-left py-3 px-4 uppercase font-semibold text-sm">Seleccionar</th>
                    <th className="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Código</th>
                    <th className="w-3/12 text-left py-3 px-4 uppercase font-semibold text-sm">Nombre</th>
                    <th className="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Estado</th>
                    <th className="w-2/12 text-left py-3 px-4 uppercase font-semibold text-sm">Costo Actual</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {activos.map((activo) => (
                    <tr key={activo.id} className="border-b hover:bg-gray-100">
                      <td className="w-1/12 text-left py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedActivos.includes(activo.id)}
                          onChange={() => handleActivoSelection(activo.id)}
                          className="form-checkbox h-5 w-5 text-emi_azul"
                        />
                      </td>
                      <td className="w-2/12 text-left py-3 px-4">{activo.codigo}</td>
                      <td className="w-3/12 text-left py-3 px-4">{activo.nombre}</td>
                      <td className="w-2/12 text-left py-3 px-4">{activo.estadoActual}</td>
                      <td className="w-2/12 text-left py-3 px-4">{activo.costoActual}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={() => {
                generatePDFData();
                setCurrentStep(3);
              }}
              disabled={selectedActivos.length === 0}
            >
              <RiFileTextLine className="mr-2" /> Continuar
            </button>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 3: Revisar y Subir Acta de Devolución</h3>
            {showPDF && pdfData && (
              <div className="w-full mt-4" style={{ height: "400px", overflow: "auto" }}>
                <PDFViewer style={{ width: "100%", height: "100%" }}>
                  <DevolucionDocument data={pdfData} />
                </PDFViewer>
              </div>
            )}
            <div className="mt-4">
              <label className="block text-sm font-medium text-emi_azul mb-2">
                Subir Acta de Devolución (PDF o Imagen)
              </label>
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleActaFileChange}
                className="w-full p-2 border border-emi_amarillo rounded-md"
              />
            </div>
            <button 
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
              onClick={handleUploadActa}
            >
              <RiUploadCloud2Line className="mr-2" /> Subir Acta
            </button>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-emi_azul">Paso 4: Confirmar Devolución</h3>
            <div>
              <label className="block mb-2 text-sm font-medium text-emi_amarillo">Detalle</label>
              <textarea
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder="Devolución de activos"
                className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emi_azul"
              />
            </div>
            <button
              type="button"
              onClick={handleDevolucion}
              disabled={isSubmitting}
              className={`w-full py-2 px-4 ${isSubmitting ? 'bg-gray-400' : 'bg-emi_amarillo'} text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center`}
            >
              {isSubmitting ? 'Procesando...' : 'Confirmar Devolución'}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  // ECharts options for Devoluciones por Unidad
  const devolucionesPorUnidadOptions = {
    title: {
      text: 'Devoluciones por Unidad',
      left: 'center'
    },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
    },
    series: [
      {
        name: 'Devoluciones',
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '20',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: unidades.map(unidad => ({
          name: unidad,
          value: filteredDevoluciones.filter(d => d.personal.unidad.nombre === unidad).length
        }))
      }
    ]
  };

  // ECharts options for Devoluciones por Estado
  const devolucionesPorEstadoOptions = {
    title: {
      text: 'Devoluciones por Estado',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: ['DISPONIBLE', 'BAJA', 'REASIGNADO']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Cantidad',
        type: 'bar',
        data: ['DISPONIBLE', 'BAJA', 'REASIGNADO'].map(estado => 
          filteredDevoluciones.filter(d => d.activoUnidad.estadoCondicion === estado).length
        ),
        itemStyle: {
          color: function(params) {
            const colors = ['#5470c6', '#91cc75', '#fac858'];
            return colors[params.dataIndex];
          }
        }
      }
    ]
  };

  // ECharts options for Devoluciones por Mes
  const devolucionesPorMesOptions = {
    title: {
      text: 'Devoluciones por Mes',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Devoluciones',
        type: 'line',
        data: Array(12).fill(0).map((_, index) => 
          filteredDevoluciones.filter(d => moment(d.fecha).month() === index).length
        ),
        smooth: true
      }
    ]
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4 text-emi_azul">Registro de Devoluciones</h1>

      <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
        <div className="flex flex-wrap justify-between items-center mb-4">
          <div className="flex flex-wrap items-center space-x-4 mb-4">
            <RangePicker 
              onChange={handleDateRangeChange}
              value={dateRange}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            />
            <Select
              value={selectedUnidad}
              style={{ width: 200 }}
              onChange={handleUnidadChange}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            >
              <Option value="TODAS">Todas las unidades</Option>
              {unidades.map(unidad => (
                <Option key={unidad} value={unidad}>{unidad}</Option>
              ))}
            </Select>
            <Select
              value={selectedEstado}
              style={{ width: 150 }}
              onChange={handleEstadoChange}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            >
              <Option value="TODOS">Todos los estados</Option>
              <Option value="DISPONIBLE">Disponible</Option>
              <Option value="BAJA">Baja</Option>
              <Option value="REASIGNADO">Reasignado</Option>
            </Select>
            <Select
              value={selectedPersonal}
              style={{ width: 200 }}
              onChange={handlePersonalChange}
              className="w-full sm:w-auto mb-2 sm:mb-0"
            >
              <Option value="TODOS">Todo el personal</Option>
              {personal.map(p => (
                <Option key={p.id} value={p.nombre}>{p.nombre}</Option>
              ))}
            </Select>
            <Input.Search
              placeholder="Buscar por código de activo"
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
              className="bg-emi_amarillo text-emi_azul hover:bg-emi_amarillo-dark"
            >
              Exportar a PDF
            </Button>
            <Button
              icon={<RiAddLine />}
              onClick={showModal}
              className="w-full py-2 px-4 bg-emi_amarillo text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-emi_azul hover:text-emi_amarillo transition-colors flex items-center justify-center"
            >
              Agregar Devolución
            </Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={filteredDevoluciones}
          loading={isLoading}
          rowKey="id"
          scroll={{ x: true }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ReactECharts option={devolucionesPorUnidadOptions} style={{ height: '300px' }} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ReactECharts option={devolucionesPorEstadoOptions} style={{ height: '300px' }} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <ReactECharts option={devolucionesPorMesOptions} style={{ height: '300px' }} />
        </div>
      </div>

      <Modal
        title="Agregar Devolución"
        visible={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={800}
      >
        <div className="flex justify-center mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mr-2 ${currentStep >= step ? 'bg-emi_amarillo text-emi_azul font-bold' : 'bg-gray-300 text-gray-600'}`}>
              {step}
            </div>
          ))}
        </div>

        {renderStepContent()}

        {currentStep > 1 && (
          <button
            className="mt-4 py-2 px-4 bg-gray-200 text-emi_azul text-sm font-bold uppercase rounded-lg hover:bg-gray-300 transition-colors"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            Anterior
          </button>
        )}
      </Modal>

      <ToastContainer />
    </div>
  );
}

export default DevolucionActivos;