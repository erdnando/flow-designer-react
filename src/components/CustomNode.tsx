import React, { useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { nodeTypeMeta } from '../utils/nodeTypeMeta';
import { useFlowStore } from '../stores/flowStore';
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import SelectionHighlight from './SelectionHighlight';
import './CustomNode.css';

interface CustomNodeProps {
  data: {
    label: string;
    type?: string;
    subtitle?: string;
    isFlashing?: boolean;
  };
  selected?: boolean;
  id: string;
}

const CustomNode: React.FC<CustomNodeProps> = ({ data, selected, id }) => {
  const nodeType = data.type || 'default';
  const meta = nodeTypeMeta[nodeType] || nodeTypeMeta.default;
  const { getNodeErrors, showValidation, selectedNodeId, nodes } = useFlowStore();
  const [isFlashing, setIsFlashing] = useState(false);
  const [subtitle, setSubtitle] = useState<string>(data.subtitle || '');
  const [nodeLabel, setNodeLabel] = useState<string>(data.label || '');
  
  // Efecto mejorado para mantener el subtítulo y el nombre sincronizados desde múltiples fuentes
  useEffect(() => {
    // Comprobar el store para obtener los valores más recientes
    const storeNode = nodes.find(n => n.id === id);
    
    // Sincronizar subtítulo
    const propSubtitle = data.subtitle;
    const storeSubtitle = storeNode?.data?.subtitle;
    
    // Decidir qué valor usar para subtítulo, priorizando el store sobre props
    let finalSubtitle = '';
    
    if (storeSubtitle !== undefined) {
      finalSubtitle = storeSubtitle;
      console.log(`CustomNode ${id}: Usando subtítulo del store: "${finalSubtitle}"`);
    } else if (propSubtitle !== undefined) {
      finalSubtitle = propSubtitle;
      console.log(`CustomNode ${id}: Usando subtítulo de props: "${finalSubtitle}"`);
    }
    
    // Solo actualizar el estado si es diferente para evitar renders innecesarios
    if (finalSubtitle !== subtitle) {
      console.log(`CustomNode ${id}: Actualizando subtítulo de "${subtitle}" a "${finalSubtitle}"`);
      setSubtitle(finalSubtitle);
    }
    
    // Sincronizar nombre/label
    const propLabel = data.label;
    const storeLabel = storeNode?.data?.label;
    
    // Decidir qué valor usar para nombre/label, priorizando el store sobre props
    let finalLabel = '';
    
    if (storeLabel !== undefined) {
      finalLabel = storeLabel;
      console.log(`CustomNode ${id}: Usando label del store: "${finalLabel}"`);
    } else if (propLabel !== undefined) {
      finalLabel = propLabel;
      console.log(`CustomNode ${id}: Usando label de props: "${finalLabel}"`);
    }
    
    // Solo actualizar el estado si es diferente para evitar renders innecesarios
    if (finalLabel !== nodeLabel) {
      console.log(`CustomNode ${id}: Actualizando label de "${nodeLabel}" a "${finalLabel}"`);
      setNodeLabel(finalLabel);
    }
  }, [id, nodes, data, data.subtitle, subtitle, data.label, nodeLabel]);
  
  // Get validation errors for this node
  const errors = getNodeErrors(id);
  const hasErrors = errors.some(err => err.severity === 'error');
  const hasWarnings = errors.some(err => err.severity === 'warning');
  const errorMessages = errors.map(err => err.message).join(', ');
  
  // Flash effect when node becomes selected via external means (like validation panel)
  useEffect(() => {
    if (selectedNodeId === id && !selected) {
      setIsFlashing(true);
      
      const timer = setTimeout(() => {
        setIsFlashing(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [selectedNodeId, id, selected]);

  const nodeClassNames = `custom-node ${hasErrors ? 'has-error' : ''} ${hasWarnings ? 'has-warning' : ''}`;
  
  return (
    <SelectionHighlight 
      isSelected={!!selected} 
      isFlashing={isFlashing}
      hasError={hasErrors}
      className={nodeClassNames}
    >
      <div className="node-wrapper" title={errorMessages}>
        <Handle type="target" position={Position.Left} id="input" />          <div className="node-content">
          <div className="node-icon" dangerouslySetInnerHTML={{ __html: meta.icon }} />
          <div className="node-labels">
            <div 
              className="node-title"
              title={nodeLabel || data.label || ''}
              data-node-id={id}
            >
              {nodeLabel || data.label || ''}
            </div>
            <div className="node-type-badge">{nodeType}</div>
            <div 
              className="node-subtitle" 
              title={subtitle || data.subtitle || ''} 
              data-node-id={id}
            >
              {subtitle || data.subtitle || ''}
            </div>
          </div>
          
          {showValidation && hasErrors && (
            <div className="validation-icon error">
              <ExclamationCircleOutlined />
            </div>
          )}
          {showValidation && !hasErrors && hasWarnings && (
            <div className="validation-icon warning">
              <WarningOutlined />
            </div>
          )}
        </div>
        
        <Handle type="source" position={Position.Right} id="output" />
      </div>
    </SelectionHighlight>
  );
};

export default CustomNode;
