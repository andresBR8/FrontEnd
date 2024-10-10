import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';

const nodeTypes = {
  customNode: CustomNode,
};

export default function ActivoWorkflow({ eventos }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Identifica el nodo actual como el último en la secuencia de eventos
  const currentNodeIndex = eventos.length - 1;

  // Uso de useCallback para optimizar la generación de nodos
  const generateNodes = useCallback(() => {
    return eventos.map((evento, index) => ({
      id: `node-${index}`,
      type: 'customNode',
      position: { x: index * 400, y: 0 }, // Alinear horizontalmente y aumentar el espaciado
      data: { ...evento },
      isCurrent: index === currentNodeIndex,  // Marca el último nodo como actual
    }));
  }, [eventos, currentNodeIndex]);

  // Uso de useCallback para optimizar la generación de edges
  const generateEdges = useCallback(() => {
    return eventos.slice(1).map((_, index) => {
      const edgeId = `e${index + 1}-${index}`;
      return {
        id: edgeId,
        source: `node-${index}`,  // Nodo de origen
        sourceHandle: null,       // Usar handle predeterminado (lado derecho)
        target: `node-${index + 1}`,  // Nodo destino
        targetHandle: null,       // Usar handle predeterminado (lado izquierdo)
        type: 'simplebezier', // Cambiar a 'simplebezier' para curvas suaves
        animated: true,
        style: { stroke: '#2563eb', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#2563eb',
        },
        label: 'Proceso Siguiente',
        labelStyle: { fill: '#2563eb', fontWeight: 700 },
        labelBgPadding: [8, 4],
        labelBgBorderRadius: 4,
        labelBgStyle: { fill: '#ffffff', color: '#2563eb', fillOpacity: 0.7 },
      };
    });
  }, [eventos]);

  useEffect(() => {
    setNodes(generateNodes());
    setEdges(generateEdges());
  }, [eventos, generateNodes, generateEdges]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(params) => setEdges((eds) => addEdge(params, eds))}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.isCurrent) return '#F59E0B';  // Resalta el nodo actual en amarillo
            switch (node.data.tipoCambio) {
              case 'CREACION':
              case 'REGISTRADO': return '#10B981';
              case 'ASIGNACION': return '#3B82F6';
              case 'REASIGNACION': return '#F97316';
              case 'CAMBIO_ESTADO': return '#8B5CF6';
              case 'BAJA': return '#EF4444';
              case 'DEVOLUCION': return '#FBBF24';
              default: return '#6B7280';
            }
          }}
          maskColor="rgba(0,0,0,0.2)"
        />
      </ReactFlow>
    </div>
  );
}
