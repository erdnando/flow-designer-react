import { create } from 'zustand';
import { nodeTypeMeta } from '../utils/nodeTypeMeta';

export interface CustomNodeType {
  id: string;
  name: string;
  color: string;
  icon: string; // Puede ser un emoji o nombre de icono
  description?: string;
}

export interface SystemNodeType {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  type: string;
  category: string;
  component?: string;
}

interface NodeTypesState {
  customNodeTypes: CustomNodeType[];
  systemNodeTypes: SystemNodeType[];
  
  addNodeType: (nodeType: Omit<CustomNodeType, 'id'>) => void;
  updateNodeType: (id: string, updates: Partial<CustomNodeType>) => void;
  removeNodeType: (id: string) => void;
}

export const useNodeTypesStore = create<NodeTypesState>((set, get) => ({
  customNodeTypes: [],
  systemNodeTypes: [
    {
      id: 'webhook',
      name: 'Webhook',
      color: '#4285F4',
      icon: nodeTypeMeta.webhook.icon,
      description: 'Trigger a flow with a webhook call',
      type: 'webhook',
      category: 'triggers',
      component: 'CustomNode'
    },
    {
      id: 'http',
      name: 'HTTP Request',
      color: '#34A853',
      icon: nodeTypeMeta.http.icon,
      description: 'Make HTTP requests to external services',
      type: 'http',
      category: 'actions',
      component: 'CustomNode'
    },
    {
      id: 'gmail',
      name: 'Gmail',
      color: '#EA4335',
      icon: nodeTypeMeta.gmail.icon,
      description: 'Send emails using Gmail',
      type: 'gmail',
      category: 'actions',
      component: 'CustomNode'
    },
    {
      id: 'function',
      name: 'Function',
      color: '#4285F4',
      icon: nodeTypeMeta.function.icon,
      description: 'Execute custom JavaScript code',
      type: 'function',
      category: 'logic',
      component: 'CustomNode'
    },
    {
      id: 'condition',
      name: 'Condition',
      color: '#FBBC05',
      icon: nodeTypeMeta.condition.icon,
      description: 'Branch flow based on conditions',
      type: 'condition',
      category: 'logic',
      component: 'ConditionNode'
    },
    {
      id: 'delay',
      name: 'Delay',
      color: '#FBBC05',
      icon: nodeTypeMeta.delay.icon,
      description: 'Wait for a specific time',
      type: 'delay',
      category: 'logic',
      component: 'CustomNode'
    },
    {
      id: 'merge',
      name: 'Merge',
      color: '#34A853',
      icon: nodeTypeMeta.merge.icon,
      description: 'Merge data from multiple branches',
      type: 'merge',
      category: 'logic',
      component: 'CustomNode'
    },
    {
      id: 'set',
      name: 'Set Variables',
      color: '#FBBC05',
      icon: nodeTypeMeta.set.icon,
      description: 'Set flow variables',
      type: 'set',
      category: 'data',
      component: 'CustomNode'
    },
    {
      id: 'minimal',
      name: 'Minimal',
      color: '#4285F4',
      icon: '<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#4285F4" stroke-width="2.5"/></svg>',
      description: 'Simple node with minimal styling',
      type: 'minimal',
      category: 'ui',
      component: 'MinimalNode'
    }
  ],

  addNodeType: (nodeType) => {
    const currentTypes = get().customNodeTypes;
    
    // Si el nombre es 'Servicio', el id será 'servicio'. Si no, genera un id legible basado en el nombre.
    let id = 'servicio';
    if (nodeType.name && nodeType.name.trim().length > 0) {
      id = nodeType.name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\-_]/g, '');
    }
    
    // Si ya existe un tipo con ese id, agrega un sufijo numérico
    let finalId = id;
    let count = 2;
    while (currentTypes.some((n) => n.id === finalId)) {
      finalId = `${id}-${count++}`;
    }
    
    set((state) => ({
      customNodeTypes: [...state.customNodeTypes, { ...nodeType, id: finalId }],
    }));
  },

  updateNodeType: (id, updates) => {
    set((state) => ({
      customNodeTypes: state.customNodeTypes.map((nodeType) =>
        nodeType.id === id ? { ...nodeType, ...updates } : nodeType
      ),
    }));
  },

  removeNodeType: (id) => {
    set((state) => ({
      customNodeTypes: state.customNodeTypes.filter((nodeType) => nodeType.id !== id),
    }));
  },
}));
