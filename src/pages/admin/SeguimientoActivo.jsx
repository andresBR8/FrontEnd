import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import QRCode from 'qrcode.react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  RiAlertLine,
  RiLoader4Line,
} from 'react-icons/ri';
import ActivoWorkflow from './ActivoWorkflow';

const apiUrl = import.meta.env.VITE_API_URL;

const calculateDepreciation = (fechaIngreso, vidaUtil) => {
  const fechaIngresoDate = new Date(fechaIngreso);
  const currentDate = new Date();
  const yearsElapsed = currentDate.getFullYear() - fechaIngresoDate.getFullYear();
  return Math.min((yearsElapsed / vidaUtil) * 100, 100).toFixed(2);
};

export default function SeguimientoActivo({ unidadId, onClose }) {
  const [activoData, setActivoData] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/seguimiento/${unidadId}`);
      setActivoData(data);

      const eventosOrdenados = data.historialCambios
        .sort((a, b) => new Date(a.fechaCambio) - new Date(b.fechaCambio));

      setEventos(eventosOrdenados);
    } catch (error) {
      console.error('Error fetching activo data:', error);
      toast.error('Error al cargar los datos del activo');
    } finally {
      setIsLoading(false);
    }
  }, [unidadId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const modalStyles = {
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      width: '95%',
      maxWidth: '1400px',
      height: '90%',
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '20px',
      overflow: 'auto',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
    },
  };

  return (
    <Modal 
      isOpen={true}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Seguimiento del Activo"
    >
      <div className="p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-blue-800">Seguimiento del Activo</h2>
          {activoData && (
            <QRCode
              value={`Activo ID: ${activoData.activoUnidad.id}\nNombre: ${activoData.activoUnidad.activoModelo.nombre}\nDescripción: ${activoData.activoUnidad.activoModelo.descripcion}\nCódigo: ${activoData.activoUnidad.codigo}`}
              size={128}
            />
          )}
        </div>
        <div className="bg-white p-4 rounded shadow-lg mb-4 text-blue-800">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <RiLoader4Line className="animate-spin text-blue-500 text-4xl" />
            </div>
          ) : activoData ? (
            <>
              <div className={`mb-4 p-4 rounded ${activoData.activoUnidad.estadoCondicion === "BAJA" ? 'bg-red-100 border border-red-500' : 'bg-blue-100'}`}>
                <h3 className="text-xl font-semibold mb-2">Información del Activo</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>ID:</strong> {activoData.activoUnidad.id}</p>
                    <p><strong>Descripción:</strong> {activoData.activoUnidad.activoModelo.descripcion}</p>
                    <p><strong>Código:</strong> {activoData.activoUnidad.codigo}</p>
                    <p><strong>Estado Actual:</strong> {activoData.activoUnidad.estadoActual}</p>
                    <p><strong>Condición:</strong> {activoData.activoUnidad.estadoCondicion}</p>
                  </div>
                  <div>
                    <p><strong>Fecha de Ingreso:</strong> {new Date(activoData.activoUnidad.activoModelo.fechaIngreso).toLocaleString()}</p>
                    <p><strong>Costo Actual:</strong> {activoData.activoUnidad.costoActual} Bs</p>
                    <p><strong>Vida Útil:</strong> {activoData.activoUnidad.activoModelo.partida.vidaUtil} años</p>
                    <p><strong>Depreciación Anual:</strong> {activoData.activoUnidad.activoModelo.partida.porcentajeDepreciacion}%</p>
                    <p><strong>Depreciación Actual:</strong> {calculateDepreciation(activoData.activoUnidad.activoModelo.fechaIngreso, activoData.activoUnidad.activoModelo.partida.vidaUtil)}%</p>
                  </div>
                </div>
                {activoData.activoUnidad.estadoCondicion === "BAJA" && (
                  <p className="text-red-600 font-bold mt-2"><RiAlertLine className="inline-block mr-2" />Este activo está dado de baja.</p>
                )}
                {calculateDepreciation(activoData.activoUnidad.activoModelo.fechaIngreso, activoData.activoUnidad.activoModelo.partida.vidaUtil) > 80 && (
                  <p className="text-yellow-600 font-bold mt-2"><RiAlertLine className="inline-block mr-2" />Este activo está cerca de su vida útil.</p>
                )}
              </div>
              <div className="overflow-x-auto">
                <div className="inline-block min-w-full">
                  <h3 className="text-xl font-semibold mb-4">Historial de Eventos</h3>
                  <ActivoWorkflow eventos={eventos} />
                </div>
              </div>
            </>
          ) : (
            <p>No hay datos disponibles</p>
          )}
        </div>
        <button 
          onClick={onClose}
          className="mt-4 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
        >
          Cerrar
        </button>
      </div>
      <ToastContainer />
    </Modal>
  );
}