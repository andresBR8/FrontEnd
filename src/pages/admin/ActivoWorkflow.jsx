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
import { motion, useAnimation } from 'framer-motion';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';

const nodeTypes = {
  customNode: CustomNode,
};

const MotionReactFlow = motion(ReactFlow);

export default function ActivoWorkflow({ eventos }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const controls = useAnimation();

  const currentNodeIndex = eventos.length - 1;

  const generateNodes = useCallback(() => {
    return eventos.map((evento, index) => ({
      id: `node-${index}`,
      type: 'customNode',
      position: { x: index * 400, y: 0 },
      data: { ...evento },
      isCurrent: index === currentNodeIndex,
      animationDelay: index * 0.5, // Stagger the animation of nodes
    }));
  }, [eventos, currentNodeIndex]);

  const generateEdges = useCallback(() => {
    return eventos.slice(1).map((_, index) => {
      const edgeId = `e${index + 1}-${index}`;
      return {
        id: edgeId,
        source: `node-${index}`,
        sourceHandle: null,
        target: `node-${index + 1}`,
        targetHandle: null,
        type: 'simplebezier',
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
    const newNodes = generateNodes();
    const newEdges = generateEdges();
    setNodes(newNodes);
    setEdges([]);

    // Animate nodes and edges sequentially
    const animateNodesAndEdges = async () => {
      await controls.start({ opacity: 1, transition: { duration: 0.5 } });
      
      for (let i = 0; i < newNodes.length; i++) {
        await controls.start(`node-${i}`);
        if (i < newEdges.length) {
          setEdges(prev => [...prev, newEdges[i]]);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait for edge animation
        }
      }
      
      setAnimationComplete(true);
    };

    animateNodesAndEdges();
  }, [eventos, generateNodes, generateEdges, controls]);

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <MotionReactFlow
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
        animate={controls}
        initial={{ opacity: 0 }}
      >
        <Background variant="dots" gap={12} size={1} />
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            if (node.isCurrent) return '#F59E0B';
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
      </MotionReactFlow>
    </div>
  );
}