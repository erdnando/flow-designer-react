import React, { useCallback, useRef, useState, useMemo, type DragEvent } from 'react';
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  type ReactFlowInstance,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from 'reactflow';

// Definición de la interfaz Connection (ya que no se exporta directamente en las versiones más recientes de reactflow)
interface Connection {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}
import { Button, Tooltip } from 'antd';
import { 
  DeleteOutlined, 
  ExportOutlined, 
  ImportOutlined, 
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  UndoOutlined,
  RedoOutlined
} from '@ant-design/icons';
import { useFlowStore } from '../stores/flowStore';
import CustomNode from './CustomNode';
import ConditionNode from './ConditionNode';
import MinimalNode from './MinimalNode';
import NodePropertiesPanel from './NodePropertiesPanel';
import ContextMenu from './ContextMenu';
import 'reactflow/dist/style.css';
import './FlowCanvas.css';
import './SelectionHighlight.css';

// Importar CustomEdge directamente
const CustomEdge = React.lazy(() => import('./CustomEdge'));

// Define los tipos de nodos y edges fuera del componente para evitar recreaciones
// Esto soluciona el warning de ReactFlow
const nodeTypes = {
  custom: CustomNode,
  webhook: CustomNode,
  http: CustomNode,
  gmail: CustomNode,
  condition: ConditionNode,
  if: ConditionNode,
  merge: CustomNode,
  delay: CustomNode,
  set: CustomNode,
  function: CustomNode,
  minimal: MinimalNode,
  default: CustomNode,
};

// Define los tipos de edges fuera del componente
const edgeTypes = {
  default: CustomEdge,
};

// Define el tipo de nodo principal
// Creamos un solo tipo de nodo y lo usamos para todos los tipos específicos en la aplicación

let id = 0;
const getId = () => `dndnode_${id++}`;

const FlowCanvas: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [showingProjectProps, setShowingProjectProps] = useState(true); // Mostrar propiedades del flujo por defecto
  
  // Handler para cuando se inicializa ReactFlow - configuración optimizada
  const onInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    
    // Aplicar un zoom out inicial simple
    setTimeout(() => {
      
      // Primero centramos los nodos con fitView
      instance.fitView({ padding: 0.4 });
      // Luego aplicamos un zoom específico para ajustar el tamaño de los nodos
      setTimeout(() => {
        const { x, y } = instance.getViewport();
        // Usar 0.9 para mantener los nodos a un tamaño legible similar a la imagen
        instance.setViewport({ x, y, zoom: 0.6 });
      }, 100);
    }, 100);

     
  };
  const [contextMenu, setContextMenu] = useState<{ visible: boolean; x: number; y: number; node: Node | null }>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });
  const [projectProperties] = useState({
    name: 'Mi Flujo',
    description: 'Descripción del flujo',
    status: 'Activo',
    owner: 'Usuario',
    createdAt: new Date().toLocaleDateString(),
    updatedAt: new Date().toLocaleDateString(),
  });
  
  // Los tipos de nodos y edges están definidos fuera del componente
  
  const { 
    nodes, 
    edges, 
    addNode, 
    addEdge: addEdgeToStore, 
    clearFlow, 
    removeNode,
    selectedNodeId,
    setSelectedNodeId,
    undo,
    redo,
    canUndo,
    canRedo
  } = useFlowStore();
  
  // Obtener el nodo seleccionado basado en selectedNodeId
  const selectedNode = useMemo(() => {
    return selectedNodeId ? nodes.find(node => node.id === selectedNodeId) || null : null;
  }, [nodes, selectedNodeId]);
  const [localNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Sincronizar con el store
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);

  React.useEffect(() => {
    setEdges(edges);
  }, [edges, setEdges]);

  // Validation disabled
  /* React.useEffect(() => {
    validateFlow();
  }, [nodes, edges, validateFlow]); */

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = { ...params, id: getId() } as Edge;
      setEdges((eds) => addEdge(newEdge, eds));
      addEdgeToStore(params);
    },
    [setEdges, addEdgeToStore]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setSelectedNodeId(node.id);
    setShowingProjectProps(false);
    // Cerrar menú contextual al hacer clic en un nodo
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  }, [setSelectedNodeId]);
  
  const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    // Prevenir menú contextual por defecto
    event.preventDefault();
    
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      node: node,
    });
  }, []);

  const onCanvasClick = useCallback(() => {
    setSelectedNodeId(null);
    setShowingProjectProps(true);
    // Cerrar menú contextual al hacer clic en el canvas
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  }, [setSelectedNodeId]);

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

        // Determinar el tipo de nodo de React Flow basado en el tipo de nodo
        let nodeType = 'custom';
        if (type === 'condition' || type === 'if') {
          nodeType = 'if';
        } else if (type === 'minimal') {
          nodeType = 'minimal';
        }

        const newNode = {
          id: getId(),
          type: nodeType,
          position,
          data: { 
            label: type.charAt(0).toUpperCase() + type.slice(1),
            type: type,
            subtitle: ''
          },
        };

        setNodes((nds) => nds.concat(newNode));
        addNode({
          type: nodeType,
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
    setSelectedNodeId(null);
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
  
  const handleImportFlow = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;
      
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const flowData = JSON.parse(result);
          
          if (flowData.nodes && flowData.edges) {
            clearFlow();
            // Usar setTimeout para asegurar que se limpia el flujo antes de cargar el nuevo
            setTimeout(() => {
              flowData.nodes.forEach((node: Node) => {
                addNode({
                  type: node.type,
                  label: node.data.label,
                  position: node.position,
                  data: node.data,
                });
              });
              
              flowData.edges.forEach((edge: Edge) => {
                addEdgeToStore({
                  source: edge.source,
                  target: edge.target,
                  sourceHandle: edge.sourceHandle || null,
                  targetHandle: edge.targetHandle || null,
                });
              });
            }, 100);
          }
        } catch (error) {
          console.error('Error al importar el flujo:', error);
          alert('Error al importar el flujo. Verifica que el archivo sea válido.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  // Usamos addNode como addNodeToStore para mejor semántica
  const addNodeToStore = addNode;

  // Opciones del menú contextual para nodos
  const getNodeContextMenuItems = useCallback((node: Node | null) => {
    if (!node) return [];
    
    return [
      {
        label: 'Eliminar Nodo',
        action: () => {
          if (node) {
            removeNode(node.id);
            setSelectedNodeId(null);
          }
        },
      },
      {
        label: 'Duplicar Nodo',
        action: () => {
          if (node) {
            const position = { 
              x: node.position.x + 50, 
              y: node.position.y + 50 
            };
            
            addNodeToStore({
              type: node.type,
              label: `${node.data.label} (copia)`,
              position,
              data: { ...node.data, label: `${node.data.label} (copia)` }
            });
          }
        },
      },
    ];
  }, [removeNode, addNodeToStore, setSelectedNodeId]);

  return (
    <div className="flow-canvas-wrapper" onClick={onCanvasClick}>
      <div className={`actions-bar ${panelCollapsed ? 'actions-bar-shifted' : ''}`}>
        <Tooltip title="Deshacer (Ctrl+Z)">
          <Button 
            onClick={() => undo()} 
            type="text" 
            className="action-btn undo-btn" 
            icon={<UndoOutlined />}
            disabled={!canUndo()} 
          />
        </Tooltip>
        <Tooltip title="Rehacer (Ctrl+Y)">
          <Button 
            onClick={() => redo()} 
            type="text" 
            className="action-btn redo-btn" 
            icon={<RedoOutlined />}
            disabled={!canRedo()} 
          />
        </Tooltip>
        <div className="action-separator"></div>
        <Tooltip title="Exportar flujo">
          <Button onClick={handleExportFlow} type="text" className="action-btn" icon={<ExportOutlined />} />
        </Tooltip>
        <Tooltip title="Importar flujo">
          <Button onClick={handleImportFlow} type="text" className="action-btn" icon={<ImportOutlined />} />
        </Tooltip>
        <Tooltip title="Acercar">
          <Button 
            onClick={() => reactFlowInstance?.zoomIn()} 
            type="text" 
            className="action-btn" 
            icon={<ZoomInOutlined />} 
          />
        </Tooltip>
        <Tooltip title="Alejar">
          <Button 
            onClick={() => reactFlowInstance?.zoomOut()} 
            type="text" 
            className="action-btn" 
            icon={<ZoomOutOutlined />} 
          />
        </Tooltip>
        <Tooltip title="Ajustar a la vista">
          <Button 
            onClick={() => reactFlowInstance?.fitView()} 
            type="text" 
            className="action-btn" 
            icon={<FullscreenOutlined />} 
          />
        </Tooltip>
        <div className="action-separator clear-separator"></div>
        <Tooltip title="Limpiar flujo">
          <Button onClick={handleClearFlow} type="text" className="action-btn clear-btn" icon={<DeleteOutlined />} />
        </Tooltip>
      </div>
      
      <div className={`reactflow-wrapper ${panelCollapsed ? 'panel-collapsed' : ''}`} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={localNodes}
          edges={localEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={onInit}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.3} // Límite mínimo de zoom
          maxZoom={2} // Límite máximo de zoom
          defaultEdgeOptions={{ type: 'default', animated: true }}
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.9 }} // Viewport por defecto con zoom optimizado
          className="flow-designer-canvas" // Clase para estilos adicionales
        >
          {/* Ocultamos los controles predeterminados de ReactFlow ya que ahora los tenemos en la barra de acciones */}
          {/* <Controls /> */}
          <Background 
            color="#444" 
            gap={20} 
            size={1}
            className="react-flow-background"
          />
          <MiniMap 
            nodeStrokeWidth={3}
            nodeStrokeColor="#333333"
            nodeBorderRadius={2}
            maskColor="rgba(0, 0, 0, 0.2)"
            style={{ 
              background: 'rgba(35, 39, 46, 0.92)', 
              border: '1px solid #555', 
              borderRadius: '10px',
              width: 155,
              height: 110,
              padding: '2px',
              position: 'absolute',
              bottom: '24px',
              right: panelCollapsed ? '60px' : '0px',
              zIndex: 5,
              boxShadow: '0 2px 8px 0 rgba(0, 0, 0, 0.25)'
            }}
            nodeColor={() => '#ffffff'} // Forzar que todos los nodos sean blancos
          />
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
      
      {/* Menú contextual */}
      <ContextMenu
        visible={contextMenu.visible}
        x={contextMenu.x}
        y={contextMenu.y}
        items={getNodeContextMenuItems(contextMenu.node)}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0, node: null })}
      />
      
      {/* Panel y alertas de validación desactivados */}
    </div>
  );
};

const FlowCanvasWrapper: React.FC = () => (
  <ReactFlowProvider>
    <FlowCanvas />
  </ReactFlowProvider>
);

export default FlowCanvasWrapper;
