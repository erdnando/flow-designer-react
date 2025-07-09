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
  const { getNodeErrors, showValidation, selectedNodeId } = useFlowStore();
  const [isFlashing, setIsFlashing] = useState(false);
  
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
        <Handle type="target" position={Position.Left} id="input" />
        
        <div className="node-content">
          <div className="node-icon" dangerouslySetInnerHTML={{ __html: meta.icon }} />
          <div className="node-labels">
            <div className="node-title">{data.label}</div>
            <div className="node-type-badge">{nodeType}</div>
            <div className="node-subtitle">{data.subtitle || meta.subtitle}</div>
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
