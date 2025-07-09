import React, { useState, useEffect } from 'react';
import { useFlowStore } from '../stores/flowStore';
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import SelectionHighlight from './SelectionHighlight';
import './MinimalNode.css';

interface MinimalNodeProps {
  data: {
    label?: string;
  };
  selected: boolean;
  id: string;
}

const MinimalNode: React.FC<MinimalNodeProps> = ({ data, selected, id }) => {
  const nodeLabel = data.label || 'Nodo';
  const { getNodeErrors, showValidation, selectedNodeId } = useFlowStore();
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Basic validation
  const hasBasicError = typeof nodeLabel === 'string' ? !nodeLabel.trim() : true;
  
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
  
  const nodeClassNames = `minimal-node ${(hasErrors || hasBasicError) ? 'error' : ''} ${hasWarnings ? 'warning' : ''}`;

  return (
    <SelectionHighlight 
      isSelected={selected} 
      isFlashing={isFlashing}
      hasError={hasErrors || hasBasicError}
      className={nodeClassNames}
    >
      <div 
        className="node-wrapper"
        onContextMenu={(e) => e.preventDefault()}
        title={errorMessages}
      >
        {nodeLabel}
        
        {/* Validation indicator */}
        {showValidation && (hasErrors || hasBasicError) && (
          <div className="validation-icon error">
            <ExclamationCircleOutlined />
          </div>
        )}
        {showValidation && !hasErrors && !hasBasicError && hasWarnings && (
          <div className="validation-icon warning">
            <WarningOutlined />
          </div>
        )}
      </div>
    </SelectionHighlight>
  );
};

export default MinimalNode;
