import React, { useCallback, useRef, useState, type DragEvent } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  type ReactFlowInstance,
  type Connection,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from 'reactflow';
import { Button } from 'antd';
import { useFlowStore } from '../stores/flowStore';
import CustomNode from './CustomNode';
import NodePropertiesPanel from './NodePropertiesPanel';
import 'reactflow/dist/style.css';
import './FlowCanvas.css';

const nodeTypes = {
  custom: CustomNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

const FlowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showingProjectProps, setShowingProjectProps] = useState(false);
  const [projectProperties] = useState({
    name: 'Mi Flujo',
    description: 'Descripción del flujo',
    status: 'Activo',
    owner: 'Usuario',
    createdAt: new Date().toLocaleDateString(),
    updatedAt: new Date().toLocaleDateString(),
  });
  
  const { nodes, edges, addNode, addEdge: addEdgeToStore, clearFlow } = useFlowStore();
  const [localNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Sincronizar con el store
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, id: getId() } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
      addEdgeToStore(params);
    },
    [setEdges, addEdgeToStore]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNode(node);
    setShowingProjectProps(false);
  }, []);

  const onCanvasClick = useCallback(() => {
    setSelectedNode(null);
    setShowingProjectProps(true);
  }, []);

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      if (reactFlowInstance && reactFlowWrapper.current) {
        const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = reactFlowInstance.project({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const newNode = {
          id: getId(),
          type: 'custom',
          position,
          data: { 
            label: type.charAt(0).toUpperCase() + type.slice(1),
            type: type,
            subtitle: ''
          },
        };

        setNodes((nds) => nds.concat(newNode));
        addNode({
          type: 'custom',
          label: type.charAt(0).toUpperCase() + type.slice(1),
          position,
          data: { type: type, subtitle: '' }
        });
      }
    },
    [reactFlowInstance, addNode, setNodes]
  );

  const handleClearFlow = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setShowingProjectProps(false);
    clearFlow();
  };

  const handleExportFlow = () => {
    const flow = {
      nodes: localNodes,
      edges: localEdges,
    };
    const dataStr = JSON.stringify(flow, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'flow.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="flow-canvas-wrapper" onClick={onCanvasClick}>
      <div className={`actions-bar ${!panelCollapsed ? 'actions-bar-shifted' : ''}`}>
        <Button onClick={handleClearFlow} type="text" className="action-btn" title="Limpiar flujo">
          🗑️
        </Button>
        <Button onClick={handleExportFlow} type="text" className="action-btn" title="Exportar flujo">
          📥
        </Button>
      </div>
      
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={localNodes}
          edges={localEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
        >
          <Controls />
          <MiniMap className={`minimap ${!panelCollapsed ? 'minimap-shifted' : ''}`} />
          <Background color="#333" gap={20} />
        </ReactFlow>
      </div>

      <NodePropertiesPanel
        selectedNode={selectedNode}
        collapsed={panelCollapsed}
        disabled={!selectedNode && !showingProjectProps}
        showProject={showingProjectProps}
        projectProps={projectProperties}
        onToggleCollapsed={setPanelCollapsed}
      />
    </div>
  );
};

const FlowCanvasWrapper: React.FC = () => (
  <ReactFlowProvider>
    <FlowCanvas />
  </ReactFlowProvider>
);

export default FlowCanvasWrapper;
