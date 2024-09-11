import React, { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  RiArrowUpCircleLine,
  RiArrowDownCircleLine,
  RiUserAddLine,
  RiExchangeLine,
  RiAlertLine,
  RiInformationLine,
  RiFileList3Line,
  RiCloseLine,
} from "react-icons/ri";

const nodeTypes = {
  customNode: CustomNode,
  currentNode: CurrentNode,
};

function CustomNode({ data }) {
  const getIcon = () => {
    switch (data.tipoCambio) {
      case "CREACION":
        return <RiArrowUpCircleLine className="text-green-500 text-2xl" />;
      case "ASIGNACION":
        return <RiUserAddLine className="text-blue-500 text-2xl" />;
      case "REASIGNACION":
        return <RiExchangeLine className="text-orange-500 text-2xl" />;
      case "CAMBIO_ESTADO":
        return <RiArrowDownCircleLine className="text-purple-500 text-2xl" />;
      case "SOLICITUD_BAJA":
        return <RiFileList3Line className="text-yellow-500 text-2xl" />;
      case "BAJA_RECHAZADA":
        return <RiCloseLine className="text-red-500 text-2xl" />;
      case "BAJA":
        return <RiAlertLine className="text-red-500 text-2xl" />;
      default:
        return <RiInformationLine className="text-gray-500 text-2xl" />;
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-lg shadow-md p-4 w-64 max-w-full">
      <div className="flex items-center justify-between mb-2">
        {getIcon()}
        <span className="font-bold text-sm">{data.tipoCambio}</span>
      </div>
      <p className="text-xs">{data.detalle}</p>
      <p className="text-xs mt-2 text-gray-600">
        {new Date(data.fechaCambio).toLocaleString()}
      </p>
      {data.asignacion && (
        <p className="text-xs mt-1 text-gray-600">
          Asignado a: {data.asignacion.personal.nombre}
        </p>
      )}
      {data.reasignacion && (
        <p className="text-xs mt-1 text-gray-600">
          Reasignado a: {data.reasignacion.personalNuevo.nombre}
        </p>
      )}
      {data.estadoActivo && (
        <p className="text-xs mt-1 text-gray-600">
          Estado: {data.estadoActivo.estadoAnterior} →{" "}
          {data.estadoActivo.estadoNuevo}
        </p>
      )}
    </div>
  );
}

function CurrentNode({ data }) {
  return (
    <div className="bg-blue-100 border-2 border-blue-500 rounded-lg shadow-md p-4 w-64 max-w-full">
      <div className="flex items-center justify-between mb-2">
        <RiInformationLine className="text-blue-500 text-2xl" />
        <span className="font-bold text-sm text-blue-700">Estado Actual</span>
      </div>
      <p className="text-xs font-semibold text-blue-700">{data.tipoCambio}</p>
      <p className="text-xs">{data.detalle}</p>
      <p className="text-xs mt-2 text-gray-600">
        {new Date(data.fechaCambio).toLocaleString()}
      </p>
    </div>
  );
}

export default function ActivoWorkflow({ eventos }) {
  const nodeWidth = 250;
  const nodeHeight = 150;
  const nodeMargin = 50;

  const initialNodes = eventos.map((evento, index) => ({
    id: `${index}`,
    type: index === eventos.length - 1 ? "currentNode" : "customNode",
    position: {
      x: index * (nodeWidth + nodeMargin),
      y: (index % 2) * (nodeHeight + nodeMargin),
    },
    data: { ...evento },
  }));

  const initialEdges = eventos.slice(1).map((_, index) => ({
    id: `e${index}-${index + 1}`,
    source: `${index}`,
    target: `${index + 1}`,
    type: "smoothstep",
    animated: true,
    style: { stroke: "#2563eb", strokeWidth: 2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  }));

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="w-full h-[600px] md:h-[800px] lg:h-[1000px]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
}
