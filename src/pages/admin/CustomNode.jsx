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

const getNodeStyle = (isInitial, isFinal, isCurrent) => {
  if (isInitial) {
    return 'bg-green-100 border-green-500 shadow-xl rounded-full';
  }
  if (isFinal) {
    return 'bg-red-100 border-red-500 shadow-xl rounded-full';
  }
  if (isCurrent) {
    return 'bg-yellow-100 border-yellow-500 shadow-xl ring-4 ring-yellow-500';
  }
  return 'bg-white border-blue-500 shadow-lg';
};

function CustomNode({ data, isCurrent, animationDelay }) {
  const isInitial = data.tipoCambio === 'CREACION';
  const isFinal = data.tipoCambio === 'BAJA';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
      className={`p-4 rounded-lg w-60 border-2 transition-transform transform hover:scale-105 ${getNodeStyle(isInitial, isFinal, isCurrent)}`}
    >
      {!isInitial && <Handle type="target" position={Position.Left} className="w-2 h-2" />}

      <motion.div 
        className="flex items-center justify-between mb-2"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: animationDelay + 0.2 }}
      >
        {isFinal ? <RiFlagLine className="text-red-500 text-3xl" /> : getIcon(data.tipoCambio)}
        <span className={`font-bold text-xs px-2 py-1 rounded ${isFinal ? 'bg-red-200' : 'bg-gray-100'}`}>{data.tipoCambio}</span>
      </motion.div>

      <motion.p 
        className="text-sm font-medium mb-2 line-clamp-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: animationDelay + 0.4 }}
      >
        {data.detalle}
      </motion.p>
      
      <motion.p 
        className="text-xs text-gray-600 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: animationDelay + 0.6 }}
      >
        <span className="font-semibold">Fecha:</span> {new Date(data.fechaCambio).toLocaleString()}
      </motion.p>

      {data.asignacion && (
        <motion.p 
          className="text-xs text-gray-600 mb-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: animationDelay + 0.8 }}
        >
          <span className="font-semibold">Asignado a:</span> {data.asignacion.personal.nombre}
        </motion.p>
      )}

      {!isFinal && <Handle type="source" position={Position.Right} className="w-2 h-2" />}
    </motion.div>
  );
}

export default CustomNode;