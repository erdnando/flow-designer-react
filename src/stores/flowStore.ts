import { create } from 'zustand';
import type { 
  Node, 
  Edge, 
  XYPosition,
  // La interfaz Connection ya no se exporta directamente en las versiones más recientes
  // Definimos nuestra propia interfaz basada en lo que necesitamos
} from 'reactflow';
import { validateFlow, type ValidationError } from '../utils/flowValidation';

// Definición de la interfaz Connection
interface Connection {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

// Definimos un tipo para el historial
interface FlowSnapshot {
  nodes: Node[];
  edges: Edge[];
}

// Constante para la clave de localStorage
const FLOW_STORAGE_KEY = 'flow-designer-state';
const FLOW_VIEWPORT_KEY = 'flow-designer-viewport';

// Función para guardar el estado en localStorage
const saveToLocalStorage = (nodes: Node[], edges: Edge[]) => {
  try {
    localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch (error) {
    console.error('Error saving flow to localStorage:', error);
  }
};

// Función para cargar el estado desde localStorage
const loadFromLocalStorage = (): { nodes: Node[], edges: Edge[] } | null => {
  try {
    const savedFlow = localStorage.getItem(FLOW_STORAGE_KEY);
    if (savedFlow) {
      return JSON.parse(savedFlow);
    }
  } catch (error) {
    console.error('Error loading flow from localStorage:', error);
  }
  return null;
};

// Función para guardar el viewport en localStorage
const saveViewportToLocalStorage = (viewport: { x: number, y: number, zoom: number }) => {
  try {
    localStorage.setItem(FLOW_VIEWPORT_KEY, JSON.stringify(viewport));
  } catch (error) {
    console.error('Error saving viewport to localStorage:', error);
  }
};

// Función para cargar el viewport desde localStorage
const loadViewportFromLocalStorage = (): { x: number, y: number, zoom: number } | null => {
  try {
    const savedViewport = localStorage.getItem(FLOW_VIEWPORT_KEY);
    if (savedViewport) {
      return JSON.parse(savedViewport);
    }
  } catch (error) {
    console.error('Error loading viewport from localStorage:', error);
  }
  return null;
};

interface FlowState {
  nodes: Node[];
  edges: Edge[];
  
  // Selección de nodo
  selectedNodeId: string | null;
  
  // Validación
  validationErrors: ValidationError[];
  showValidation: boolean;
  
  // Historial para undo/redo
  history: FlowSnapshot[];
  currentHistoryIndex: number;
  maxHistoryLength: number;
  
  // Métodos para manejar nodos
  addNode: (opts?: { type?: string; label?: string; position?: XYPosition; data?: Record<string, unknown> }) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  removeNode: (id: string) => void;
  setSelectedNodeId: (id: string | null) => void;
  
  // Métodos para manejar edges
  addEdge: (connection: Connection) => void;
  removeEdge: (id: string) => void;
  
  // Método para limpiar todo
  clearFlow: () => void;
  
  // Método para cargar datos
  loadData: (data: { nodes: Node[]; edges: Edge[] }) => void;
  
  // Métodos para el historial
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  saveToHistory: () => void;
  
  // Métodos para validación
  validateFlow: () => void;
  getNodeErrors: (nodeId: string) => ValidationError[];
  getEdgeErrors: (edgeId: string) => ValidationError[];
  toggleValidation: () => void;
  
  // Nuevos métodos para manejar viewport
  saveViewport: (viewport: { x: number, y: number, zoom: number }) => void;
  getStoredViewport: () => { x: number, y: number, zoom: number } | null;
}

export const useFlowStore = create<FlowState>((set, get) => {
  // Cargar el estado guardado desde localStorage al iniciar
  const savedFlow = loadFromLocalStorage();
  
  return {
    // Inicializar con datos guardados o vacíos
    nodes: savedFlow?.nodes || [],
    edges: savedFlow?.edges || [],
    selectedNodeId: null,
    validationErrors: [],
    showValidation: false,
    history: savedFlow ? [{ nodes: savedFlow.nodes, edges: savedFlow.edges }] : [],
    currentHistoryIndex: savedFlow ? 0 : -1,
    maxHistoryLength: 50,

    saveToHistory: () => {
      const { nodes, edges, history, currentHistoryIndex, maxHistoryLength } = get();
      
      // Create a deep copy of the current state
      const currentState: FlowSnapshot = {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges))
      };
      
      // If we're not at the end of the history, remove future states
      const newHistory = currentHistoryIndex < history.length - 1
        ? history.slice(0, currentHistoryIndex + 1)
        : [...history];
      
      // Add current state to history
      newHistory.push(currentState);
      
      // Limit history length
      if (newHistory.length > maxHistoryLength) {
        newHistory.shift();
      }
      
      set({
        history: newHistory,
        currentHistoryIndex: newHistory.length - 1
      });
      
      // Guardar estado en localStorage después de cada cambio
      saveToLocalStorage(nodes, edges);
    },

    addNode: (opts) => {
      const currentNodes = get().nodes;
      const newId = (currentNodes.length + 1).toString();

      const data = {
        subtitle: '',
        ...(opts?.data || {}),
      };

      // Si se proporciona una posición específica, la usamos exactamente como está
      // De lo contrario, calculamos una posición inteligente que preserve el layout
      const newPosition = opts?.position ? { ...opts.position } : { 
        // Si no hay nodos, coloca el nuevo en el centro
        x: currentNodes.length === 0 ? 250 : (
          // Si hay pocos nodos (menos de 3), usa una cuadrícula simple
          currentNodes.length < 3 ? 
          250 + (currentNodes.length * 200) : 
          // Encuentra la posición promedio de todos los nodos y desplázala un poco
          // para no sobreponerse a nodos existentes
          (currentNodes.reduce((sum, node) => sum + node.position.x, 0) / currentNodes.length) + 
          200 * Math.cos(currentNodes.length * 0.7)
        ),
        y: currentNodes.length === 0 ? 250 : (
          // Similar al cálculo de X pero con variación para evitar patrones predecibles
          currentNodes.length < 3 ? 
          250 + (currentNodes.length * 100) : 
          (currentNodes.reduce((sum, node) => sum + node.position.y, 0) / currentNodes.length) + 
          150 * Math.sin(currentNodes.length * 0.7)
        )
      };

      // Solo aplicamos el algoritmo de ajuste de posición si la posición no fue explícitamente proporcionada
      // Si el usuario especificó una posición, la respetamos exactamente
      let finalPosition = { ...newPosition };
      
      if (!opts?.position) {
        // Asegurarse de que la posición no se superpone con nodos existentes
        const MIN_DISTANCE = 150; // Distancia mínima entre nodos
        
        let needsAdjustment = false;
        do {
          needsAdjustment = false;
          for (const node of currentNodes) {
            const dx = finalPosition.x - node.position.x;
            const dy = finalPosition.y - node.position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < MIN_DISTANCE) {
              needsAdjustment = true;
              // Alejar el nodo en dirección opuesta
              const angle = Math.atan2(dy, dx);
              finalPosition = {
                x: finalPosition.x + (MIN_DISTANCE - distance) * Math.cos(angle),
                y: finalPosition.y + (MIN_DISTANCE - distance) * Math.sin(angle)
              };
            }
          }
        } while (needsAdjustment);
      }

      // Crear el nuevo nodo con posiciones consistentes y metadatos adicionales para estabilidad
      const newNode: Node = {
        id: newId,
        data: {
          label: opts?.label || `Nodo ${newId}`,
          ...data,
          // Almacenar la posición original como parte de los datos para referencia
          originalPosition: { ...finalPosition }
        },
        // Asegurar que ambas propiedades de posición sean idénticas para estabilidad
        position: { ...finalPosition },
        positionAbsolute: { ...finalPosition },
        // Usar el tipo proporcionado o el predeterminado
        type: opts?.type || 'default',
        // Establecer propiedades para prevenir cambios automáticos de posición
        dragging: false,
        selected: false
      };

      // Mantener las posiciones existentes y solo agregar el nuevo nodo
      set((state) => {
        // Crear una copia profunda de los nodos existentes para prevenir mutaciones
        const updatedNodes = state.nodes.map(node => ({
          ...node,
          // Asegurar que las propiedades de posición están sincronizadas
          positionAbsolute: node.positionAbsolute || { ...node.position },
          position: node.positionAbsolute || { ...node.position }
        }));
        
        const newNodes = [...updatedNodes, newNode];
        
        // Guardar en localStorage después de agregar nodo
        saveToLocalStorage(newNodes, state.edges);
        
        return {
          nodes: newNodes,
        };
      });
      
      // Save to history after adding node
      get().saveToHistory();
    },

    updateNode: (id, updates) => {
      // Implementación simplificada con mejor manejo de subtítulo
      set((state) => {
        // Crear una copia limpia de los nodos actualizados
        const updatedNodes = state.nodes.map((node) => {
          // Solo actualizar el nodo específico
          if (node.id === id) {
            // Crear una nueva instancia completa del nodo para evitar referencias compartidas
            const newNode = { ...node };
            
            // Si hay actualizaciones de datos, manejarlas con cuidado especial
            if (updates.data) {
              // Crear una nueva estructura de datos fusionada
              newNode.data = {
                ...(node.data || {}), // Datos originales
                ...updates.data        // Nuevos datos
              };
              
              // Verificación especial para el subtítulo
              if ('subtitle' in updates.data) {
                console.log(`FlowStore: Actualizando subtítulo de nodo ${id} a "${updates.data.subtitle}"`);
              }
              
              // Aplicar otras actualizaciones excluyendo data que ya se manejó
              const otherUpdates = { ...updates };
              delete otherUpdates.data;
              Object.assign(newNode, otherUpdates);
            } else {
              // Si no hay actualizaciones específicas de data, simplemente fusionar todas las propiedades
              Object.assign(newNode, updates);
            }
            
            return newNode;
          }
          return node;
        });
        
        // Guardar en localStorage después de actualizar nodo
        saveToLocalStorage(updatedNodes, state.edges);
        
        return {
          nodes: updatedNodes,
        };
      });
      
      // Forzar una actualización adicional para garantizar que los cambios sean visibles
      setTimeout(() => {
        const nodes = get().nodes;
        set({ nodes: [...nodes] }); // Crear nueva referencia para forzar actualización de UI
      }, 0);
      
      // Guardar al historial después de actualizar el nodo
      get().saveToHistory();
    },

    removeNode: (id) => {
      set((state) => {
        const updatedNodes = state.nodes.filter((node) => node.id !== id);
        const updatedEdges = state.edges.filter((edge) => edge.source !== id && edge.target !== id);
        
        // Guardar en localStorage después de eliminar nodo
        saveToLocalStorage(updatedNodes, updatedEdges);
        
        return {
          nodes: updatedNodes,
          edges: updatedEdges,
        };
      });
      
      // Save to history after removing node
      get().saveToHistory();
    },

    addEdge: (connection) => {
      const newEdge: Edge = {
        id: `e${connection.source}-${connection.target}`,
        source: connection.source!,
        target: connection.target!,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'default',
      };

      set((state) => {
        const updatedEdges = [...state.edges, newEdge];
        
        // Guardar en localStorage después de agregar edge
        saveToLocalStorage(state.nodes, updatedEdges);
        
        return {
          edges: updatedEdges,
        };
      });
      
      // Save to history after adding edge
      get().saveToHistory();
    },

    removeEdge: (id) => {
      set((state) => {
        const updatedEdges = state.edges.filter((edge) => edge.id !== id);
        
        // Guardar en localStorage después de eliminar edge
        saveToLocalStorage(state.nodes, updatedEdges);
        
        return {
          edges: updatedEdges,
        };
      });
      
      // Save to history after removing edge
      get().saveToHistory();
    },

    clearFlow: () => {
      // Limpiar localStorage al limpiar flujo
      localStorage.removeItem(FLOW_STORAGE_KEY);
      
      set({
        nodes: [],
        edges: [],
        // Reset history when clearing the flow
        history: [],
        currentHistoryIndex: -1,
      });
    },

    loadData: (data) => {
      set({
        nodes: data.nodes,
        edges: data.edges,
      });
      
      // Guardar en localStorage después de cargar datos
      saveToLocalStorage(data.nodes, data.edges);
      
      // Save loaded data to history
      get().saveToHistory();
    },
    
    canUndo: () => {
      return get().currentHistoryIndex > 0;
    },
    
    canRedo: () => {
      return get().currentHistoryIndex < get().history.length - 1;
    },
    
    undo: () => {
      const { history, currentHistoryIndex } = get();
      
      if (currentHistoryIndex > 0) {
        const prevState = history[currentHistoryIndex - 1];
        
        // Guardar en localStorage después de deshacer
        saveToLocalStorage(
          JSON.parse(JSON.stringify(prevState.nodes)),
          JSON.parse(JSON.stringify(prevState.edges))
        );
        
        set({
          nodes: JSON.parse(JSON.stringify(prevState.nodes)),
          edges: JSON.parse(JSON.stringify(prevState.edges)),
          currentHistoryIndex: currentHistoryIndex - 1,
        });
      }
    },
    
    redo: () => {
      const { history, currentHistoryIndex } = get();
      
      if (currentHistoryIndex < history.length - 1) {
        const nextState = history[currentHistoryIndex + 1];
        
        // Guardar en localStorage después de rehacer
        saveToLocalStorage(
          JSON.parse(JSON.stringify(nextState.nodes)),
          JSON.parse(JSON.stringify(nextState.edges))
        );
        
        set({
          nodes: JSON.parse(JSON.stringify(nextState.nodes)),
          edges: JSON.parse(JSON.stringify(nextState.edges)),
          currentHistoryIndex: currentHistoryIndex + 1,
        });
      }
    },
    
    validateFlow: () => {
      const { nodes, edges } = get();
      const validationErrors = validateFlow(nodes, edges);
      set({ validationErrors });
    },
    
    getNodeErrors: (nodeId: string) => {
      const { validationErrors } = get();
      return validationErrors.filter(
        err => err.type === 'node' && err.id === nodeId
      );
    },
    
    getEdgeErrors: (edgeId: string) => {
      const { validationErrors } = get();
      return validationErrors.filter(
        err => err.type === 'edge' && err.id === edgeId
      );
    },
    
    toggleValidation: () => {
      const { showValidation } = get();
      set({ showValidation: !showValidation });
      // Re-run validation when toggling
      get().validateFlow();
    },
    
    setSelectedNodeId: (id: string | null) => {
      set({ selectedNodeId: id });
    },
    
    // Nuevos métodos para manejar viewport
    saveViewport: (viewport) => {
      saveViewportToLocalStorage(viewport);
    },
    
    getStoredViewport: () => {
      return loadViewportFromLocalStorage();
    }
  };
});
