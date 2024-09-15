import React, { useState, useEffect } from "react";
import axios from "axios";
import { RiCloseLine, RiArrowRightLine, RiUserLine, RiFileTextLine, RiUploadCloud2Line, RiCheckLine } from "react-icons/ri";
import { PDFViewer } from '@react-pdf/renderer';
import ReasignacionDocument from './PDFReasignacion';
import DevolucionDocument from './DevolucionDocument';
import { Spin, message, Upload, Button, Input, Steps } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Step } = Steps;
const { TextArea } = Input;

const apiUrl = import.meta.env.VITE_API_URL;

const ReasignarActivos = ({ onClose, onSave, activoUnidadId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [personal, setPersonal] = useState([]);
  const [selectedPersonal, setSelectedPersonal] = useState(null);
  const [detalle, setDetalle] = useState("");
  const [ultimaAsignacion, setUltimaAsignacion] = useState(null);
  const [showReasignacionPDF, setShowReasignacionPDF] = useState(false);
  const [pdfDataReasignacion, setPdfDataReasignacion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actaDevolucionFile, setActaDevolucionFile] = useState(null);
  const [avalFile, setAvalFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detalleDevolucion, setDetalleDevolucion] = useState("");
  const [activoADevolver, setActivoADevolver] = useState(null);

  useEffect(() => {
    if (activoUnidadId) {
      fetchPersonal();
      fetchUltimaAsignacion();
    }
  }, [activoUnidadId]);

  const fetchPersonal = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/personal/all`);
      setPersonal(response.data.data);
    } catch (error) {
      console.error("Error fetching personal:", error);
      message.error("No se pudo cargar la lista de personal.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUltimaAsignacion = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${apiUrl}/reasignacion/ultima-asignacion/${activoUnidadId}`);
      if (response.data && response.data.data) {
        setUltimaAsignacion(response.data.data);
        setActivoADevolver(response.data.data.activoUnidad);
      } else {
        throw new Error("No se encontró la última asignación");
      }
    } catch (error) {
      console.error("Error fetching ultima asignacion:", error);
      message.error("No se pudo obtener la última asignación del activo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeleccionPersonal = (persona) => {
    setSelectedPersonal(persona);
    generateReasignacionPDFData(persona);
    setCurrentStep(1);
  };

  const generateReasignacionPDFData = (persona) => {
    if (!persona || !ultimaAsignacion) return;
    const pdfData = {
      nombre: persona.nombre,
      cargo: persona.cargo.nombre,
      unidad: persona.unidad.nombre,
      activos: [{
        codigo: ultimaAsignacion.activoUnidad?.codigo,
        nombre: ultimaAsignacion.activoUnidad?.descripcion,
        estado: ultimaAsignacion.activoUnidad?.estadoActual,
        fechaIngreso: ultimaAsignacion.activoUnidad.fecha,
        usuarioAnterior: ultimaAsignacion.usuario.name,
        usuarioNuevo: persona.nombre,
      }]
    };

    setPdfDataReasignacion(pdfData);
    setShowReasignacionPDF(true);
  };

  const handleUploadActaDevolucion = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setActaDevolucionFile(response.data.url);
      message.success('Acta de devolución subida correctamente');
    } catch (error) {
      console.error('Error al subir el acta de devolución:', error);
      message.error('No se pudo subir el acta de devolución');
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const handleUploadAval = async (file) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${apiUrl}/upload`, formData);
      setAvalFile(response.data.url);
      message.success('Aval subido correctamente');
    } catch (error) {
      console.error('Error al subir el aval:', error);
      message.error('No se pudo subir el aval');
    } finally {
      setIsLoading(false);
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!selectedPersonal || !actaDevolucionFile || !avalFile) {
      message.error("Por favor complete todos los pasos antes de reasignar.");
      return;
    }

    setIsSubmitting(true);

    try {
      const devolucionData = {
        fkPersonal: ultimaAsignacion.personal.id,
        fkUsuario: localStorage.getItem("id"),
        fecha: new Date().toISOString(),
        detalle: detalleDevolucion || null,
        actaDevolucion: actaDevolucionFile,
        activosUnidades: [{ fkActivoUnidad: activoUnidadId }],
      };

      await axios.post(`${apiUrl}/devolucion`, devolucionData);

      const reasignacionData = {
        fkActivoUnidad: activoUnidadId,
        fkUsuarioAnterior: ultimaAsignacion.usuario.id,
        fkUsuarioNuevo: localStorage.getItem("id"),
        fkPersonalAnterior: ultimaAsignacion.personal.id,
        fkPersonalNuevo: selectedPersonal.id,
        detalle: detalle || null,
        fechaReasignacion: new Date().toISOString(),
        avalReasignacion: avalFile,
      };

      await axios.post(`${apiUrl}/reasignacion`, reasignacionData);

      message.success("Devolución y reasignación completadas exitosamente.");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error al procesar la devolución y reasignación:", error);
      message.error("Error al procesar la devolución y reasignación.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const steps = [
    {
      title: 'Seleccionar Personal',
      content: (
        <div className="space-y-4">
          <Input
            prefix={<RiUserLine className="text-emi_azul" />}
            placeholder="Buscar personal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-60 overflow-y-auto">
            {personal.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => (
              <div
                key={p.id}
                className="p-2 hover:bg-gray-100 cursor-pointer rounded-lg flex items-center"
                onClick={() => handleSeleccionPersonal(p)}
              >
                <RiUserLine className="mr-2 text-emi_azul" />
                <div>
                  <p className="font-medium text-emi_azul">{p.nombre}</p>
                  <p className="text-sm text-gray-600">{p.cargo.nombre} - {p.unidad.nombre}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Revisar Reasignación',
      content: (
        <div className="space-y-4">
          <div className="flex items-center mt-4">
            <div className="bg-white p-4 rounded-lg shadow-md flex-1">
              <h4 className="text-lg text-emi_azul font-bold mb-2">Asignación Anterior</h4>
              <p className="text-emi_azul">Fecha: {ultimaAsignacion && new Date(ultimaAsignacion.fecha).toLocaleDateString()}</p>
              <p className="text-emi_azul">Detalle: {ultimaAsignacion?.detalle}</p>
              <p className="text-emi_azul">Usuario: {ultimaAsignacion?.usuario.name}</p>
              <p className="text-emi_azul">Personal: {ultimaAsignacion?.personal.nombre}</p>
            </div>
            <RiArrowRightLine className="text-emi_azul mx-4 text-2xl" />
            <div className="bg-white p-4 rounded-lg shadow-md flex-1">
              <h4 className="text-lg font-medium text-emi_azul">Nueva Asignación</h4>
              <p className="text-sm text-gray-600">Nombre: {selectedPersonal?.nombre}</p>
              <p className="text-sm text-gray-600">Cargo: {selectedPersonal?.cargo.nombre}</p>
              <p className="text-sm text-gray-600">Unidad: {selectedPersonal?.unidad.nombre}</p>
            </div>
          </div>
          {showReasignacionPDF && pdfDataReasignacion && (
            <div className="w-full mt-4" style={{ height: "400px", overflow: "auto" }}>
              <PDFViewer style={{ width: "100%", height: "100%" }}>
                <ReasignacionDocument data={pdfDataReasignacion} />
              </PDFViewer>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Documentos y Detalles',
      content: (
        <div className="space-y-4">
          <Upload
            beforeUpload={handleUploadActaDevolucion}
          >
            <Button icon={<UploadOutlined />}>Subir Acta de Devolución</Button>
          </Upload>
          <Upload
            beforeUpload={handleUploadAval}
          >
            <Button icon={<UploadOutlined />}>Subir Aval de Reasignación</Button>
          </Upload>
          <TextArea
            placeholder="Detalle de Devolución (opcional)"
            value={detalleDevolucion}
            onChange={(e) => setDetalleDevolucion(e.target.value)}
            rows={4}
          />
          <TextArea
            placeholder="Detalle de Reasignación (opcional)"
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            rows={4}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-emi_azul">
          Devolución y Reasignación de Activo
        </h2>
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
          <RiCloseLine size="24" />
        </button>
      </div>

      <Steps current={currentStep}>
        {steps.map(item => (
          <Step key={item.title} title={item.title} />
        ))}
      </Steps>

      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Spin size="large" />
          </div>
        ) : (
          steps[currentStep].content
        )}
      </div>

      <div className="mt-8 flex justify-between">
        {currentStep > 0 && (
          <Button onClick={() => setCurrentStep(currentStep - 1)}>
            Anterior
          </Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
            Siguiente
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button type="primary" onClick={handleSubmit} loading={isSubmitting}>
            Devolver y Reasignar
          </Button>
        )}
      </div>
    </div>
  );
};

export default ReasignarActivos;