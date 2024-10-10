import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from 'react-modal';
import QRCode from 'qrcode.react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RiAlertLine, RiCloseLine, RiInformationLine, RiHistoryLine } from 'react-icons/ri';
import ActivoWorkflow from './ActivoWorkflow';
import { motion } from 'framer-motion';

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
  const [activeTab, setActiveTab] = useState('info');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axios.get(`${apiUrl}/seguimiento/${unidadId}`);
      setActivoData(data);
      setEventos(data.historialCambios);
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
      maxWidth: '1200px',
      height: '90%',
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '0',
      overflow: 'hidden',
      border: 'none',
    },
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1000,
    },
  };

  const TabButton = ({ id, icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center px-4 py-2 rounded-t-lg transition-colors duration-200 ${
        activeTab === id
          ? 'bg-white text-emi_azul border-t-2 border-emi_azul'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {icon}
      <span className="ml-2">{label}</span>
    </button>
  );

  return (
    <Modal 
      isOpen={true}
      onRequestClose={onClose}
      style={modalStyles}
      contentLabel="Seguimiento del Activo"
    >
      <div className="flex flex-col h-full bg-gray-50">
        <div className="flex justify-between items-center p-4 bg-emi_azul text-white">
          <h2 className="text-2xl font-bold">
            {activoData ? `Flujo de trabajo del Activo: ${activoData.activoUnidad.id}` : 'Cargando...'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-emi_amarillo transition-colors duration-200">
            <RiCloseLine size={24} />
          </button>
        </div>
        {isLoading ? (
          <div className="flex-grow flex justify-center items-center">
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
              className="w-16 h-16 border-t-4 border-emi_azul rounded-full"
            />
          </div>
        ) : activoData ? (
          <>
            <div className="flex border-b border-gray-200">
              <TabButton id="info" icon={<RiInformationLine />} label="Información" />
              <TabButton id="history" icon={<RiHistoryLine />} label="Workflow" />
            </div>
            <div className="flex-grow overflow-auto p-6">
              {activeTab === 'info' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-emi_azul mb-2">{activoData.activoUnidad.activoModelo.nombre}</h3>
                      <p className="text-gray-600">{activoData.activoUnidad.activoModelo.descripcion}</p>
                    </div>
                    <QRCode
                      value={`Activo ID: ${activoData.activoUnidad.id}\nNombre: ${activoData.activoUnidad.activoModelo.nombre}\nDescripción: ${activoData.activoUnidad.activoModelo.descripcion}\nCódigo: ${activoData.activoUnidad.codigo}`}
                      size={96}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <InfoItem label="ID" value={activoData.activoUnidad.id} />
                      <InfoItem label="Código" value={activoData.activoUnidad.codigo} />
                      <InfoItem label="Estado Actual" value={activoData.activoUnidad.estadoActual} />
                      <InfoItem label="Condición" value={activoData.activoUnidad.estadoCondicion} />
                    </div>
                    <div className="space-y-3">
                      <InfoItem label="Fecha de Ingreso" value={new Date(activoData.activoUnidad.activoModelo.fechaIngreso).toLocaleDateString()} />
                      <InfoItem label="Costo Actual" value={`${activoData.activoUnidad.costoActual} Bs`} />
                      <InfoItem label="Vida Útil" value={`${activoData.activoUnidad.activoModelo.partida.vidaUtil} años`} />
                      <InfoItem label="Depreciación Anual" value={`${activoData.activoUnidad.activoModelo.partida.porcentajeDepreciacion}%`} />
                      <InfoItem 
                        label="Depreciación Actual" 
                        value={`${calculateDepreciation(activoData.activoUnidad.activoModelo.fechaIngreso, activoData.activoUnidad.activoModelo.partida.vidaUtil)}%`}
                      />
                    </div>
                  </div>
                  {activoData.activoUnidad.estadoCondicion === "BAJA" && (
                    <AlertBanner type="error" message="Este activo está dado de baja." />
                  )}
                  {calculateDepreciation(activoData.activoUnidad.activoModelo.fechaIngreso, activoData.activoUnidad.activoModelo.partida.vidaUtil) > 80 && (
                    <AlertBanner type="warning" message="Este activo está cerca de su vida útil." />
                  )}
                </div>
              )}
              {activeTab === 'history' && (
                <ActivoWorkflow eventos={eventos} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-grow flex justify-center items-center">
            <p className="text-gray-600">No hay datos disponibles</p>
          </div>
        )}
      </div>
      <ToastContainer />
    </Modal>
  );
}

const InfoItem = ({ label, value }) => (
  <div className="flex justify-between items-center border-b border-gray-200 py-2">
    <span className="font-medium text-gray-600">{label}:</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

const AlertBanner = ({ type, message }) => (
  <div className={`mt-4 p-3 rounded-md ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
    <div className="flex items-center">
      <RiAlertLine className="mr-2" size={20} />
      <p className="font-medium">{message}</p>
    </div>
  </div>
);