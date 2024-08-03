import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import QRCode from 'qrcode.react';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import {
  RiArrowDownSLine,
  RiArrowUpSLine,
  RiUser3Line,
  RiExchangeLine,
  RiEdit2Line,
  RiDeleteBin6Line,
} from 'react-icons/ri';
import Swal from 'sweetalert2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'tailwindcss/tailwind.css';

const estilosPersonalizados = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    marginRight: '-50%',
    transform: 'translate(-50%, -50%)',
    width: '90%',
    maxWidth: '1000px',
    height: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: '50px',
    padding: '2px',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
};
const apiUrl = import.meta.env.VITE_API_URL;

const calculateDepreciation = (fechaIngreso, vidaUtil) => {
  const fechaIngresoDate = new Date(fechaIngreso);
  const currentDate = new Date();
  const yearsElapsed = currentDate.getFullYear() - fechaIngresoDate.getFullYear();
  const depreciation = Math.min((yearsElapsed / vidaUtil) * 100, 100).toFixed(2);
  return depreciation;
};

const SeguimientoActivo = ({ unidadId, onClose }) => {
  const [activoData, setActivoData] = useState(null);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${apiUrl}/reportes/seguimiento-activo/${unidadId}`);
        const data = response.data.data;
        setActivoData(data);

        const eventos = [
          {
            fecha: data.activoUnidad.activoModelo.fechaIngreso,
            tipo: 'Registro del Activo',
            descripcion: `Activo registrado con el detalle: ${data.activoUnidad.activoModelo.descripcion}`,
            icon: <RiArrowUpSLine />,
            backgroundColor: '#4caf50',
          },
          ...data.activoUnidad.asignacionActivos.map(asignacion => ({
            fecha: asignacion.asignacion.fechaAsignacion,
            tipo: 'Asignación de Activo',
            descripcion: `Asignado a: ${asignacion.asignacion.personal.nombre}, Cargo: ${asignacion.asignacion.personal.fkCargo}, Unidad: ${asignacion.asignacion.personal.fkUnidad}`,
            icon: <RiUser3Line />,
            backgroundColor: '#3f51b5',
          })),
          ...data.activoUnidad.depreciaciones.map(depreciacion => ({
            fecha: depreciacion.fecha,
            tipo: 'Depreciación del Activo',
            descripcion: `Valor estimado actual: ${depreciacion.valor} Bs`,
            icon: <RiArrowDownSLine />,
            backgroundColor: '#f44336',
          })),
          ...data.activoUnidad.reasignaciones.map(reasignacion => ({
            fecha: reasignacion.fechaReasignacion,
            tipo: 'Reasignación de Activo',
            descripcion: `Reasignado de: ${reasignacion.personalAnterior.nombre} a: ${reasignacion.personalNuevo.nombre}`,
            icon: <RiExchangeLine />,
            backgroundColor: '#ff9800',
          })),
        ];

        setEventos(eventos);
      } catch (error) {
        console.error('Error fetching activo data:', error);
      }
    };
    fetchData();
  }, [unidadId]);

  const handleEdit = (evento) => {
    Swal.fire('Editar Evento', 'Funcionalidad de edición aquí', 'info');
  };

  const handleDelete = (evento) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminarlo!',
    }).then((result) => {
      if (result.isConfirmed) {
        toast.success('Evento eliminado con éxito.');
      }
    });
  };

  return (
    <Modal isOpen={Boolean(unidadId)} onRequestClose={onClose} style={estilosPersonalizados}>
      <div className="p-4 bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-emi_azul">Seguimiento del Activo</h2>
          {activoData && (
            <QRCode
              value={`Activo ID: ${activoData.activoUnidad.id}\nNombre: ${activoData.activoUnidad.activoModelo.nombre}\nDescripción: ${activoData.activoUnidad.activoModelo.descripcion}\nCódigo: ${activoData.activoUnidad.codigo}`}
              size={128}
            />
          )}
        </div>
        <div className="bg-white p-4 rounded shadow-lg mb-4 text-emi_azul">
          {activoData ? (
            <>
              <div className="mb-4">
                <p><strong>ID:</strong> {activoData.activoUnidad.id}</p>
                <p><strong>Descripción:</strong> {activoData.activoUnidad.activoModelo.descripcion}</p>
                <p><strong>Código:</strong> {activoData.activoUnidad.codigo}</p>
                <p><strong>Estado:</strong> {activoData.activoUnidad.activoModelo.estado}</p>
                <p><strong>Fecha de Ingreso:</strong> {new Date(activoData.activoUnidad.activoModelo.fechaIngreso).toLocaleDateString()}</p>
                <p><strong>Costo:</strong> {activoData.activoUnidad.activoModelo.costo} Bs</p>
                <p><strong>Vida Útil:</strong> {activoData.activoUnidad.activoModelo.partida.vidaUtil} años</p>
                <p><strong>Depreciación Anual:</strong> {activoData.activoUnidad.activoModelo.partida.porcentajeDepreciacion}%</p>
                <div className={`p-4 mt-2 ${calculateDepreciation(activoData.activoUnidad.activoModelo.fechaIngreso, activoData.activoUnidad.activoModelo.partida.vidaUtil) > 80 ? 'bg-red-200' : 'bg-yellow-200'}`}>
                  <p><strong>Depreciación Actual:</strong> {calculateDepreciation(activoData.activoUnidad.activoModelo.fechaIngreso, activoData.activoUnidad.activoModelo.partida.vidaUtil)}%</p>
                  {calculateDepreciation(activoData.activoUnidad.activoModelo.fechaIngreso, activoData.activoUnidad.activoModelo.partida.vidaUtil) > 80 && (
                    <p className="text-red-600"><strong>Alerta:</strong> Este activo está cerca de su vida útil.</p>
                  )}
                </div>
              </div>
              <div className="h-100 overflow-y-auto bg-white p-4 rounded shadow-lg">
                <VerticalTimeline>
                  {eventos.map((evento, index) => (
                    <VerticalTimelineElement
                      key={index}
                      date={new Date(evento.fecha).toLocaleDateString()}
                      iconStyle={{ background: evento.backgroundColor, color: '#fff' }}
                      icon={evento.icon}
                    >
                      <h3 className="vertical-timeline-element-title">{evento.tipo}</h3>
                      <p>{evento.descripcion}</p>
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => handleEdit(evento)}
                          className="text-emi_azul hover:text-blue-700"
                        >
                          <RiEdit2Line size="1.2em" />
                        </button>
                        <button
                          onClick={() => handleDelete(evento)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <RiDeleteBin6Line size="1.2em" />
                        </button>
                      </div>
                    </VerticalTimelineElement>
                  ))}
                </VerticalTimeline>
              </div>
            </>
          ) : (
            <p>Cargando...</p>
          )}
        </div>
        <button onClick={onClose} className="mt-4 bg-emi_azul text-emi_amarillo py-2 px-4 rounded hover:bg-black transition-colors">
          Cerrar
        </button>
        <ToastContainer />
      </div>
    </Modal>
  );
};

export default SeguimientoActivo;
