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
import LayoutStabilizer from './LayoutStabilizer';
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
  
  // Handler para cuando se inicializa ReactFlow - configuración optimizada para estabilidad
  const onInit = (instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    
    // Obtener el viewport guardado
    const storedViewport = useFlowStore.getState().getStoredViewport();
    
    // Función para estabilizar las posiciones de los nodos
    const stabilizeNodePositions = () => {
      const currentNodes = instance.getNodes();
      if (currentNodes.length === 0) return;
      
      // Asegurar que todos los nodos mantienen sus posiciones exactas
      const updatedNodes = currentNodes.map(node => ({
        ...node,
        // Asegurar que positionAbsolute está presente y coincide con position
        positionAbsolute: node.positionAbsolute || { ...node.position },
        // La posición debe ser exactamente igual a positionAbsolute para evitar saltos
        position: node.positionAbsolute || { ...node.position },
        // Desactivar el estado de arrastre para evitar que ReactFlow recalcule posiciones
        dragging: false,
        // No seleccionar nodos al inicializar para evitar cambios de estado no deseados
        selected: false
      }));
      
      // Actualizar los nodos con las posiciones absolutas
      instance.setNodes(updatedNodes);
    };
    
    // Ejecutar estabilización inmediatamente
    stabilizeNodePositions();
    
    // Secuencia de estabilización robusta con múltiples comprobaciones
    const timers = [
      // Primer paso: estabilizar posiciones
      setTimeout(stabilizeNodePositions, 50),
      
      // Segundo paso: ajustar vista y aplicar zoom específico
      setTimeout(() => {
        stabilizeNodePositions();
        
        // Si tenemos un viewport guardado, usarlo en lugar de calcular uno nuevo
        if (storedViewport && instance.getNodes().length > 0) {
          instance.setViewport({
            x: storedViewport.x,
            y: storedViewport.y,
            zoom: storedViewport.zoom
          });
        } 
        // Si no hay viewport guardado pero hay nodos, ajustar la vista
        else if (instance.getNodes().length > 0) {
          instance.fitView({ 
            padding: 0.5, 
            includeHiddenNodes: false,
            duration: 200 // Animación suave
          });
          
          // Aplicar un zoom específico después del fitView
          setTimeout(() => {
            const { x, y } = instance.getViewport();
            const finalViewport = { x, y, zoom: 0.6 };
            instance.setViewport(finalViewport);
            
            // Guardar el viewport final
            useFlowStore.getState().saveViewport(finalViewport);
          }, 250);
        }
        
        // Desactivar animaciones temporalmente
        const edges = instance.getEdges();
        if (edges.length > 0) {
          instance.setEdges(edges.map(edge => ({ ...edge, animated: false })));
          
          // Reactivar animaciones después de la estabilización
          setTimeout(() => {
            instance.setEdges(edges);
          }, 300);
        }
      }, 150)
    ];
    
    // Limpiar temporizadores si el componente se desmonta
    return () => {
      timers.forEach(clearTimeout);
    };
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
  
  // Get the selected node from store similar to Vue's updateSelectedNodeFromList
  const updateSelectedNodeFromList = useCallback(() => {
    if (!selectedNodeId) return null;
    
    // Find the node in the current node list from store
    const storeNodes = useFlowStore.getState().nodes;
    const foundNode = storeNodes.find(node => node.id === selectedNodeId);
    
    // If node doesn't exist anymore, return null
    if (!foundNode) return null;
    
    // Ensure node has all required data
    return {
      ...foundNode,
      data: {
        ...foundNode.data,
        // Ensure type and label are always defined
        type: foundNode.data?.type || foundNode.type || 'default',
        label: foundNode.data?.label || `Nodo ${foundNode.id}`
      }
    };
  }, [selectedNodeId]);
  
  // Get the selected node directly from store each time
  const selectedNode = useMemo(() => {
    return updateSelectedNodeFromList();
  }, [updateSelectedNodeFromList]);
  const [localNodes, setNodes, onNodesChange] = useNodesState(nodes);
  const [localEdges, setEdges, onEdgesChange] = useEdgesState(edges);

  // Sincronizar con el store
  React.useEffect(() => {
    setNodes(nodes);
  }, [nodes, setNodes]);
  
  // Effect to update UI when selected node changes - inspired by Vue's watch pattern
  React.useEffect(() => {
    if (selectedNodeId) {
      // Verify the node actually exists in current nodes
      const nodeExists = nodes.some(node => node.id === selectedNodeId);
      
      if (nodeExists) {
        // Update visual selection in ReactFlow - only modify selection state
        setNodes(nds => nds.map(n => ({
          ...n,
          selected: n.id === selectedNodeId
        })));
        
        // Always show node properties panel when a node is selected
        setShowingProjectProps(false);
        
        // Expand panel if collapsed
        if (panelCollapsed) {
          setPanelCollapsed(false);
        }
      } else {
        // If node no longer exists, deselect
        setSelectedNodeId(null);
        setShowingProjectProps(true);
      }
    }
  }, [selectedNodeId, nodes, setNodes, setShowingProjectProps, panelCollapsed, setPanelCollapsed, setSelectedNodeId]);

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

  const onNodeClick: NodeMouseHandler = useCallback((_event: React.MouseEvent, node: Node) => {
    console.log("Node clicked:", node.id, node.data?.label);
    
    // Avoid update if it's already the same node
    if (selectedNodeId === node.id) {
      return;
    }
    
    // Ensure node has all required data
    const updatedNode = {
      ...node,
      data: {
        ...node.data,
        type: node.data?.type || node.type || 'default',
        label: node.data?.label || `Nodo ${node.id}`
      }
    };
    
    // Update node in store to ensure consistency
    useFlowStore.getState().updateNode(node.id, updatedNode);
    
    // Update selection state in specific order to minimize renders
    setShowingProjectProps(false);
    setSelectedNodeId(node.id);
    
    // Update the UI - only change selection state, not other data
    setNodes(nds => {
      return nds.map(n => ({
        ...n,
        selected: n.id === node.id
      }));
    });
    
    // Show the panel if it was collapsed
    if (panelCollapsed) {
      setPanelCollapsed(false);
    }
    
    // Close context menu
    setContextMenu({ visible: false, x: 0, y: 0, node: null });
  }, [setSelectedNodeId, setNodes, setShowingProjectProps, setPanelCollapsed, panelCollapsed, setContextMenu, selectedNodeId]);
  // Handler for clicks on the canvas background (deselect nodes)
  const onPaneClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // If click was on the background (not on a node or the properties panel)
    // This is similar to Vue's onCanvasClick but adapted for React/ReactFlow
    if (!target.closest('.react-flow__node') && !target.closest('.node-properties-panel')) {
      // Deselect any node in the store
      setSelectedNodeId(null);
      
      // Show project properties
      setShowingProjectProps(true);
      
      // Visually deselect all nodes - only affect the selected property
      setNodes(nds => nds.map(n => ({
        ...n,
        selected: false
      })));
      
      // Close context menu
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
      
      // Expand panel if collapsed
      if (panelCollapsed) {
        setPanelCollapsed(false);
      }
    }
  }, [setSelectedNodeId, setNodes, setShowingProjectProps, setContextMenu, panelCollapsed, setPanelCollapsed]);
  
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

  // Simplified version of onCanvasClick matching Vue's implementation
  const onCanvasClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Similar to Vue implementation's check for clicks on background
    if (!target.closest('.react-flow__node') && !target.closest('.node-properties-panel')) {
      // Clear node selection
      setSelectedNodeId(null);
      
      // Show project properties
      setShowingProjectProps(true);
      
      // Expand panel if collapsed
      if (panelCollapsed) {
        setPanelCollapsed(false);
      }
      
      // Close context menu
      setContextMenu({ visible: false, x: 0, y: 0, node: null });
    }
  }, [setSelectedNodeId, setShowingProjectProps, panelCollapsed, setPanelCollapsed, setContextMenu]);

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
        // Guardar los nodos existentes y sus posiciones exactas antes de hacer cambios
        const existingNodes = reactFlowInstance.getNodes().map(node => ({
          id: node.id,
          position: { ...node.position },
          positionAbsolute: node.positionAbsolute ? { ...node.positionAbsolute } : { ...node.position }
        }));
        
        // Calcular la posición exacta donde el usuario soltó el nodo
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

        // Crear un ID único para el nuevo nodo
        const newNodeId = getId();
        
        // Crear el nuevo nodo con posición absoluta para estabilidad
        const newNode = {
          id: newNodeId,
          type: nodeType,
          position: { ...position }, // Usar un nuevo objeto para evitar referencias compartidas
          positionAbsolute: { ...position }, // Añadir posición absoluta para estabilidad
          data: { 
            label: type.charAt(0).toUpperCase() + type.slice(1),
            type: type,
            subtitle: ''
          },
          // Evitar que el nuevo nodo afecte el diseño existente
          selected: false,
          dragging: false,
        };

        // Usar una función para actualizar nodos que preserve las posiciones actuales
        const updateNodesWithPreservedPositions = (currentNodes: Node[]) => {
          // Primero restauramos las posiciones exactas de los nodos existentes
          const restoredNodes = currentNodes.map(node => {
            const existingNode = existingNodes.find(n => n.id === node.id);
            if (existingNode) {
              return {
                ...node,
                position: { ...existingNode.position },
                positionAbsolute: { ...existingNode.positionAbsolute }
              };
            }
            return node;
          });
          
          // Luego agregamos el nuevo nodo
          return [...restoredNodes, newNode];
        };

        // Actualizar los nodos locales primero, preservando las posiciones
        setNodes(updateNodesWithPreservedPositions);
        
        // Luego actualizar el store con la misma información exacta
        addNode({
          type: nodeType,
          label: type.charAt(0).toUpperCase() + type.slice(1),
          position: { ...position }, // Usar un nuevo objeto para evitar referencias
          data: { type: type, subtitle: '' }
        });
        
        // Secuencia de estabilización para mantener posiciones y luego fitear la vista
        setTimeout(() => {
          // Asegurar que los nodos existentes mantengan sus posiciones
          const allCurrentNodes = reactFlowInstance.getNodes();
          const updatedNodes = allCurrentNodes.map(node => {
            // Para nodos existentes, mantener su posición original
            const existingNode = existingNodes.find(n => n.id === node.id);
            if (existingNode) {
              return {
                ...node,
                position: { ...existingNode.position },
                positionAbsolute: { ...existingNode.positionAbsolute },
                dragging: false,
                selected: false
              };
            }
            // Para el nuevo nodo, mantener la posición de drop
            if (node.id === newNodeId) {
              return {
                ...node,
                position: { ...position },
                positionAbsolute: { ...position },
                dragging: false,
                selected: true // Seleccionar solo el nuevo nodo
              };
            }
            return node;
          });
          
          reactFlowInstance.setNodes(updatedNodes);
          
          // Guardar el viewport actual antes de cualquier cambio
          const currentViewport = reactFlowInstance.getViewport();
          
          // Mantener el mismo zoom y posición en lugar de fitear la vista
          setTimeout(() => {
            // Restaurar el viewport exactamente como estaba antes
            reactFlowInstance.setViewport({
              x: currentViewport.x,
              y: currentViewport.y,
              zoom: currentViewport.zoom
            });
            
            // Guardar el viewport en localStorage
            useFlowStore.getState().saveViewport(currentViewport);
          }, 100);
        }, 50);
      }
    },
    [reactFlowInstance, addNode, setNodes]
  );

  const handleClearFlow = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setShowingProjectProps(true);  // Mostrar propiedades del proyecto cuando se limpia todo
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
            // Si eliminamos el último nodo, mostrar propiedades del proyecto
            if (nodes.length <= 1) {
              setShowingProjectProps(true);
            }
          }
        },
      },
      {
        label: 'Duplicar Nodo',
        action: () => {
          if (node) {
            // Crea una copia con un desplazamiento inteligente que mantenga la estructura visual
            const position = { 
              x: node.position.x + 150, // Desplazamiento mayor en X para mantener el diseño
              y: node.position.y + 30   // Desplazamiento menor en Y para mantener el flujo
            };
            
            // Obtener el estado actual de los nodos antes de duplicar
          const currentNodes = reactFlowInstance?.getNodes() || [];
          const currentLength = currentNodes.length;
            
            // Agregar el nodo con todos los datos necesarios
            addNodeToStore({
              type: node.type,
              label: `${node.data.label} (copia)`,
              position,
              data: { 
                ...node.data, 
                label: `${node.data.label} (copia)`,
                // Preservar el tipo original para mantener la coherencia visual
                type: node.data.type || node.type
              }
            });            // Esperar a que el store se actualice y luego seleccionar el nuevo nodo
          setTimeout(() => {
            // Buscar el nodo más reciente añadido (será el último en el array)
            const updatedNodes = reactFlowInstance?.getNodes() || [];
            if (updatedNodes.length > currentLength) {
              const newNode = updatedNodes[updatedNodes.length - 1];
              
              console.log("Selecting duplicated node:", newNode.id, newNode.data?.label);
              
              // Seleccionar el nodo recién creado
              setSelectedNodeId(newNode.id);
              setShowingProjectProps(false);
              
              // Asegurarnos de que el panel esté visible
              if (panelCollapsed) {
                setPanelCollapsed(false);
              }
              
              // Actualizar la selección visual en ReactFlow
              // Solo seleccionar el nodo duplicado, deseleccionar los demás
              setNodes(nds => 
                nds.map(n => {
                  // Solo modificar la propiedad selected, sin tocar otros datos
                  return {
                    ...n,
                    selected: n.id === newNode.id
                  };
                })
              );
            }
          }, 100);
            
            // Mantener el viewport actual después de duplicar
            setTimeout(() => {
              if (reactFlowInstance) {
                // Guardar el viewport actual
                const currentViewport = reactFlowInstance.getViewport();
                
                // Asegurarse de mantenerlo
                reactFlowInstance.setViewport(currentViewport);
                
                // Guardar en localStorage
                useFlowStore.getState().saveViewport(currentViewport);
              }
            }, 100);
          }
        },
      },
    ];
  }, [removeNode, addNodeToStore, setSelectedNodeId, reactFlowInstance, nodes.length, setShowingProjectProps, panelCollapsed, setPanelCollapsed, setNodes]);

  // Estado para forzar la recarga del panel de propiedades
  const [panelKey, setPanelKey] = useState<number>(0);
  
  // Efecto para actualizar la clave del panel cuando cambia el nodo seleccionado
  React.useEffect(() => {
    // Incrementar la clave cada vez que cambia el nodo seleccionado
    // Esto fuerza la recreación completa del componente
    setPanelKey(prev => prev + 1);
  }, [selectedNodeId]);

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
            onClick={() => {
              if (reactFlowInstance) {
                // No necesitamos guardar el viewport actual porque lo vamos a reemplazar completamente
                
                // Ajustar la vista con una animación suave
                reactFlowInstance.fitView({ 
                  padding: 0.2, 
                  duration: 300, 
                  includeHiddenNodes: false 
                });
                
                // Después de ajustar, guardar el nuevo viewport
                setTimeout(() => {
                  const newViewport = reactFlowInstance.getViewport();
                  useFlowStore.getState().saveViewport(newViewport);
                }, 350); // Un poco más que la duración de la animación
              }
            }} 
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
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          minZoom={0.3} // Límite mínimo de zoom
          maxZoom={2} // Límite máximo de zoom
          defaultEdgeOptions={{ type: 'default', animated: false }}
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          defaultViewport={{ x: 0, y: 0, zoom: 0.9 }} // Viewport por defecto con zoom optimizado
          className="flow-designer-canvas" // Clase para estilos adicionales
          snapToGrid={true} // Habilitar snap to grid para mejor organización
          snapGrid={[15, 15]} // Tamaño de la cuadrícula para snap
          nodesDraggable={true} // Permitir arrastrar nodos
          preventScrolling={false} // Permitir scroll en el lienzo
          elementsSelectable={true} // Permitir selección de elementos
          selectNodesOnDrag={false} // No seleccionar nodos al arrastrar (para mejor experiencia)
          onMoveEnd={(_e, viewport) => {
            // Guardar viewport cuando el usuario termina de mover el canvas
            useFlowStore.getState().saveViewport(viewport);
          }}
          onNodeDragStop={(_e, node) => {
            // Cuando el usuario termina de arrastrar un nodo, actualizamos su posición en el store
            // Esto asegura que las posiciones se guarden también en localStorage
            if (node.positionAbsolute) {
              useFlowStore.getState().updateNode(node.id, {
                position: { ...node.positionAbsolute },
                positionAbsolute: { ...node.positionAbsolute }
              });
            }
          }}
        >
          {/* Componente para estabilizar el layout y evitar que los nodos se muevan */}
          <LayoutStabilizer />
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

      {/* Agregar key={selectedNode?.id || 'project'} para forzar la recreación del componente cuando cambia el nodo */}
      <NodePropertiesPanel
        // Usamos el panelKey para forzar la recreación completa del componente
        key={`${selectedNodeId || 'project'}-${panelKey}`} 
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
