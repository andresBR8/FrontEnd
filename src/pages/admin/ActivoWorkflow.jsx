import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
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
      case 'EN ALMACEN': return <RiArrowUpCircleLine className="text-green-500 text-3xl" />;
      case 'ASIGNACION': return <RiUserAddLine className="text-blue-500 text-3xl" />;
      case 'REASIGNACION': return <RiExchangeLine className="text-orange-500 text-3xl" />;
      case 'CAMBIO_ESTADO': return <RiArrowDownCircleLine className="text-purple-500 text-3xl" />;
      case 'BAJA': return <RiAlertLine className="text-red-500 text-3xl" />;
      case 'DEVOLUCION': return <RiArrowLeftRightLine className="text-yellow-500 text-3xl" />;
      default: return <RiInformationLine className="text-gray-500 text-3xl" />;
    }
  };

  const getBgColor = () => {
    switch (data.tipoCambio) {
      case 'CREACION':
      case 'EN ALMACEN': return 'bg-green-50';
      case 'ASIGNACION': return 'bg-blue-50';
      case 'REASIGNACION': return 'bg-orange-50';
      case 'CAMBIO_ESTADO': return 'bg-purple-50';
      case 'BAJA': return 'bg-red-50';
      case 'DEVOLUCION': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${getBgColor()} w-80 transition-all duration-300 hover:shadow-lg`}>
      <div className="flex items-center justify-between mb-2">
        {getIcon()}
        <span className="font-bold text-sm uppercase">{data.tipoCambio}</span>
      </div>
      <p className="text-sm mb-2">{data.detalle}</p>
      <p className="text-xs text-gray-600 mb-2">{new Date(data.fechaCambio).toLocaleString()}</p>
      {data.asignacion && (
        <p className="text-xs text-gray-600">
          Asignado a: <span className="font-semibold">{data.asignacion.personal.nombre}</span>
        </p>
      )}
      {data.reasignacion && (
        <div className="text-xs text-gray-600">
          <p>De: <span className="font-semibold">{data.reasignacion.personalAnterior.nombre}</span></p>
          <p>A: <span className="font-semibold">{data.reasignacion.personalNuevo.nombre}</span></p>
        </div>
      )}
      {data.estadoActivo && (
        <p className="text-xs text-gray-600">
          Estado: <span className="font-semibold">{data.estadoActivo.estadoAnterior}</span> → <span className="font-semibold">{data.estadoActivo.estadoNuevo}</span>
        </p>
      )}
    </div>
  );
}

const nodeTypes = {
  customNode: CustomNode,
};

export default function ActivoWorkflow({ eventos, activoUnidad }) {
  const { nodes, edges } = useMemo(() => {
    if (!eventos || eventos.length === 0) {
      return { nodes: [], edges: [] };
    }

    const nodes = eventos.map((evento, index) => ({
      id: `${index}`,
      type: 'customNode',
      position: { x: 0, y: index * 250 },
      data: { ...evento },
    }));

    if (activoUnidad && activoUnidad.activoModelo) {
      nodes.unshift({
        id: 'initial',
        type: 'customNode',
        position: { x: 0, y: -250 },
        data: {
          tipoCambio: 'INICIAL',
          detalle: `Activo: ${activoUnidad.activoModelo.nombre}`,
          fechaCambio: activoUnidad.activoModelo.fechaIngreso,
        },
      });
    }

    const edges = nodes.slice(1).map((_, index) => ({
      id: `e${index}-${index + 1}`,
      source: `${index}`,
      target: `${index + 1}`,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#2563eb', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: '#2563eb',
      },
    }));

    return { nodes, edges };
  }, [eventos, activoUnidad]);

  if (!eventos || eventos.length === 0) {
    return <div className="text-center py-8">No hay eventos para mostrar.</div>;
  }

  return (
    <div style={{ width: '100%', height: '800px' }}>
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
          maskColor="rgba(0,0,0,0.1)"
        />
      </ReactFlow>
    </div>
  );
}