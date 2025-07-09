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
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  validationErrors: [],
  showValidation: false,
  history: [],
  currentHistoryIndex: -1,
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
  },

  addNode: (opts) => {
    const currentNodes = get().nodes;
    const newId = (currentNodes.length + 1).toString();

    const data = {
      subtitle: '',
      ...(opts?.data || {}),
    };

    const newNode: Node = {
      id: newId,
      data: {
        label: opts?.label || `Nodo ${newId}`,
        ...data,
      },
      position: opts?.position || { x: 100 + currentNodes.length * 60, y: 100 },
      type: opts?.type || 'default',
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
    
    // Save to history after adding node
    get().saveToHistory();
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
    
    // Save to history after updating node
    get().saveToHistory();
  },

  removeNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    }));
    
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

    set((state) => ({
      edges: [...state.edges, newEdge],
    }));
    
    // Save to history after adding edge
    get().saveToHistory();
  },

  removeEdge: (id) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== id),
    }));
    
    // Save to history after removing edge
    get().saveToHistory();
  },

  clearFlow: () => {
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
}));
