import React from 'react';
import FlowCanvas from '../components/FlowCanvas';
import NodePanel from '../components/NodePanel';
import { useFlowStore } from '../stores/flowStore';
import { useAutoSave } from '../hooks/useAutoSave';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';
import './FlowDesignerView.css';

const FlowDesignerView: React.FC = () => {
  const { nodes, edges } = useFlowStore();
  
  // Configurar auto-guardado
  useAutoSave(nodes, edges);
  
  // Configurar atajos de teclado para deshacer/rehacer
  useKeyboardShortcuts();

  return (
    <div className="flow-designer">
      <NodePanel />
      <FlowCanvas />
    </div>
  );
};

export default FlowDesignerView;
