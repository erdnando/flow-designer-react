import { useEffect, useRef } from 'react';
import type { Node, Edge } from 'reactflow';
import { useFlowStore } from '../stores/flowStore';

const AUTOSAVE_KEY = 'n8n_standalone_flow_data';
const AUTOSAVE_DELAY_MS = 1000; // 1 segundo

interface FlowData {
  nodes: Node[];
  edges: Edge[];
  projectProperties?: {
    name: string;
    description: string;
    status: string;
    owner: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

export const useAutoSave = (
  nodes: Node[], 
  edges: Edge[], 
  projectProperties?: FlowData['projectProperties']
) => {
  const autoSaveTimer = useRef<number | null>(null);
  const { loadData } = useFlowStore();

  // Función para sanitizar nodos antes de guardar
  const sanitizeNodesForSave = (nodesToSave: Node[]) => {
    return nodesToSave.map(node => ({
      ...node,
      // Remover propiedades específicas de ReactFlow que no deben persistirse
      measured: undefined,
      computed: undefined,
    }));
  };

  // Función para guardar en localStorage
  const saveToLocalStorage = () => {
    try {
      const dataToSave: FlowData = {
        nodes: sanitizeNodesForSave(nodes),
        edges: edges,
        ...(projectProperties && { projectProperties }),
      };
      
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(dataToSave));
      console.log('Flow auto-saved to localStorage');
    } catch (err) {
      console.error('Error al guardar el estado en localStorage:', err);
    }
  };

  // Función para cargar desde localStorage
  const loadFromLocalStorage = () => {
    try {
      const savedData = localStorage.getItem(AUTOSAVE_KEY);
      if (savedData) {
        const data: FlowData = JSON.parse(savedData);
        loadData({
          nodes: data.nodes || [],
          edges: data.edges || [],
        });
        console.log('Flow loaded from localStorage');
        return data.projectProperties;
      }
    } catch (err) {
      console.error('Error al cargar el estado desde localStorage:', err);
    }
    return null;
  };

  // Función para limpiar localStorage
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY);
      console.log('Flow data cleared from localStorage');
    } catch (err) {
      console.error('Error al limpiar localStorage:', err);
    }
  };

  // Función para activar auto-guardado con debounce
  const triggerAutoSave = () => {
    if (autoSaveTimer.current !== null) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(saveToLocalStorage, AUTOSAVE_DELAY_MS);
  };

  // Effect para auto-guardar cuando cambien los nodos o edges
  useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      triggerAutoSave();
    }
    
    // Cleanup del timer al desmontar
    return () => {
      if (autoSaveTimer.current !== null) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, [nodes, edges, projectProperties]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect para cargar datos al montar el componente (solo una vez)
  useEffect(() => {
    loadFromLocalStorage();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage,
    triggerAutoSave,
  };
};
