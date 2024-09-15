import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  RiArrowUpCircleLine, 
  RiArrowDownCircleLine, 
  RiUserAddLine, 
  RiExchangeLine, 
  RiAlertLine,
  RiInformationLine,
  RiArrowLeftRightLine,
} from 'react-icons/ri';

function CustomNode({ data }) {
  const getIcon = () => {
    switch (data.tipoCambio) {
      case 'CREACION':
      case 'EN ALMACEN': return <RiArrowUpCircleLine className="text-green-500 text-2xl" />;
      case 'ASIGNACION': return <RiUserAddLine className="text-blue-500 text-2xl" />;
      case 'REASIGNACION': return <RiExchangeLine className="text-orange-500 text-2xl" />;
      case 'CAMBIO_ESTADO': return <RiArrowDownCircleLine className="text-purple-500 text-2xl" />;
      case 'BAJA': return <RiAlertLine className="text-red-500 text-2xl" />;
      case 'DEVOLUCION': return <RiArrowLeftRightLine className="text-yellow-500 text-2xl" />;
      default: return <RiInformationLine className="text-gray-500 text-2xl" />;
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${data.tipoCambio === 'BAJA' ? 'bg-red-100' : 'bg-white'} w-64`}>
      <div className="flex items-center justify-between mb-2">
        {getIcon()}
        <span className="font-bold text-sm">{data.tipoCambio}</span>
      </div>
      <p className="text-xs">{data.detalle}</p>
      <p className="text-xs mt-2 text-gray-600">{new Date(data.fechaCambio).toLocaleString()}</p>
      {data.asignacion && (
        <p className="text-xs mt-1 text-gray-600">
          Asignado a: {data.asignacion.personal.nombre}
        </p>
      )}
      {data.reasignacion && (
        <p className="text-xs mt-1 text-gray-600">
          De: {data.reasignacion.personalAnterior.nombre}<br />
          A: {data.reasignacion.personalNuevo.nombre}
        </p>
      )}
      {data.estadoActivo && (
        <p className="text-xs mt-1 text-gray-600">
          Estado: {data.estadoActivo.estadoAnterior} → {data.estadoActivo.estadoNuevo}
        </p>
      )}
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
};

export default function ActivoWorkflow({ eventos }) {
  const { nodes, edges } = useMemo(() => {
    const nodes = eventos.map((evento, index) => ({
      id: `${index}`,
      type: 'customNode',
      position: { x: 0, y: index * 150 },
      data: { ...evento },
    }));

    const edges = eventos.slice(1).map((_, index) => ({
      id: `e${index}-${index + 1}`,
      source: `${index}`,
      target: `${index + 1}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#2563eb', strokeWidth: 2 },
    }));

    return { nodes, edges };
  }, [eventos]);

  return (
    <div style={{ width: '100%', height: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data.tipoCambio) {
              case 'CREACION':
              case 'EN ALMACEN': return '#10B981';
              case 'ASIGNACION': return '#3B82F6';
              case 'REASIGNACION': return '#F97316';
              case 'CAMBIO_ESTADO': return '#8B5CF6';
              case 'BAJA': return '#EF4444';
              case 'DEVOLUCION': return '#FBBF24';
              default: return '#6B7280';
            }
          }}
        />
      </ReactFlow>
    </div>
  );
}
