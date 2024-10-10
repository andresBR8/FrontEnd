import React from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { 
  RiArrowUpCircleLine, 
  RiArrowDownCircleLine, 
  RiUserAddLine, 
  RiExchangeLine, 
  RiAlertLine,
  RiInformationLine,
  RiArrowLeftRightLine,
  RiFlagLine,
} from 'react-icons/ri';

const getIcon = (tipoCambio) => {
  switch (tipoCambio) {
    case 'CREACION':
    case 'REGISTRADO': return <RiArrowUpCircleLine className="text-green-500 text-3xl" />;
    case 'ASIGNACION': return <RiUserAddLine className="text-blue-500 text-3xl" />;
    case 'REASIGNACION': return <RiExchangeLine className="text-orange-500 text-3xl" />;
    case 'CAMBIO_ESTADO': return <RiArrowDownCircleLine className="text-purple-500 text-3xl" />;
    case 'BAJA': return <RiAlertLine className="text-red-500 text-3xl" />;
    case 'DEVOLUCION': return <RiArrowLeftRightLine className="text-yellow-500 text-3xl" />;
    default: return <RiInformationLine className="text-gray-500 text-3xl" />;
  }
};

// Función para obtener estilos adicionales para el nodo inicial, final y el nodo actual
const getNodeStyle = (isInitial, isFinal, isCurrent) => {
  if (isInitial) {
    return 'bg-green-100 border-green-500 shadow-xl rounded-full';  // Nodo inicial circular
  }
  if (isFinal) {
    return 'bg-red-100 border-red-500 shadow-xl rounded-full';  // Nodo final circular
  }
  if (isCurrent) {
    return 'bg-yellow-100 border-yellow-500 shadow-xl ring-4 ring-yellow-500';  // Nodo actual resaltado
  }
  return 'bg-white border-blue-500 shadow-lg';  // Nodos intermedios
};

function CustomNode({ data, isCurrent }) {
  const isInitial = data.tipoCambio === 'CREACION';  // Determina si es el nodo inicial
  const isFinal = data.tipoCambio === 'BAJA';  // Determina si es el nodo final

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-lg w-60 border-2 transition-transform transform hover:scale-105 ${getNodeStyle(isInitial, isFinal, isCurrent)}`}  // Se añaden bordes circulares y el nodo actual resaltado
    >
      {/* Conexión en el lado izquierdo */}
      {!isInitial && <Handle type="target" position={Position.Left} className="w-2 h-2" />}

      <div className="flex items-center justify-between mb-2">
        {isFinal ? <RiFlagLine className="text-red-500 text-3xl" /> : getIcon(data.tipoCambio)}
        <span className={`font-bold text-xs px-2 py-1 rounded ${isFinal ? 'bg-red-200' : 'bg-gray-100'}`}>{data.tipoCambio}</span>
      </div>

      <p className="text-sm font-medium mb-2 line-clamp-2">{data.detalle}</p>
      <p className="text-xs text-gray-600 mb-2">
        <span className="font-semibold">Fecha:</span> {new Date(data.fechaCambio).toLocaleString()}
      </p>

      {data.asignacion && (
        <p className="text-xs text-gray-600 mb-1">
          <span className="font-semibold">Asignado a:</span> {data.asignacion.personal.nombre}
        </p>
      )}

      {/* Conexión en el lado derecho */}
      {!isFinal && <Handle type="source" position={Position.Right} className="w-2 h-2" />}
    </motion.div>
  );
}

export default CustomNode;
