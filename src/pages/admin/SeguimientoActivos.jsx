import React from 'react';
import ReactFlow, { Handle, Background, MiniMap, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

// Estilos adicionales para personalizar la interfaz
const customNodeStyle = {
  padding: '10px',
  border: '2px solid #0077FF',
  borderRadius: '10px',
  backgroundColor: 'white',
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  width: '180px',
  textAlign: 'center'
};

// Definir los nodos con un diseño personalizado más elaborado y en disposición horizontal
const nodes = [
  {
    id: '1',
    type: 'customNode',
    position: { x: 50, y: 100 },
    data: { label: 'Inicio', details: 'Recepción del activo' }
  },
  {
    id: '2',
    type: 'customNode',
    position: { x: 300, y: 100 },
    data: { label: 'Asignación', details: 'Activo asignado a empleado' }
  },
  {
    id: '3',
    type: 'customNode',
    position: { x: 550, y: 100 },
    data: { label: 'Reasignación', details: 'Cambio de departamento' }
  },
  {
    id: '4',
    type: 'customNode',
    position: { x: 800, y: 100 },
    data: { label: 'Baja', details: 'Activo dado de baja' }
  }
];

const edges = [
  { id: 'e1-2', source: '1', target: '2', animated: true, label: 'Siguiente Fase' },
  { id: 'e2-3', source: '2', target: '3', animated: true, label: 'Reasignar' },
  { id: 'e3-4', source: '3', target: '4', animated: true, label: 'Dar de baja' }
];

// Componente personalizado para los nodos
const CustomNode = ({ data }) => (
  <div style={customNodeStyle}>
    <h3>{data.label}</h3>
    <p>{data.details}</p>
    <Handle type="source" position="right" id="a" style={{ borderRadius: 6 }} />
    <Handle type="target" position="left" id="b" style={{ borderRadius: 6 }} />
  </div>
);

const nodeTypes = { customNode: CustomNode };

const SeguimientoActivos = () => {
  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '90%', height: '50vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#aaa" gap={16} />
          <MiniMap nodeColor={(n) => {
            if (n.type === 'input') return 'blue';
            if (n.type === 'output') return 'red';
            return '#FFCC00';
          }} />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
};

export default SeguimientoActivos;
