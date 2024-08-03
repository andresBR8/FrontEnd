import { useState, useEffect } from 'react';
import axios from 'axios';

export const useActivoData = (unidadId) => {
  const [activoData, setActivoData] = useState(null);
  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`http://localhost:3000/reportes/seguimiento-activo/${unidadId}`);
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

  return { activoData, eventos };
};
