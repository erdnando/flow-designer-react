import React, { useState, useEffect } from 'react';
import { Position, Handle } from 'reactflow';
import { useFlowStore } from '../stores/flowStore';
import { WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import SelectionHighlight from './SelectionHighlight';
import './ConditionNode.css';

interface ConditionNodeProps {
  data: {
    label?: string;
    condition?: string;
  };
  selected: boolean;
  id: string;
}

const ConditionNode: React.FC<ConditionNodeProps> = ({ data, selected, id }) => {
  const { getNodeErrors, showValidation, selectedNodeId } = useFlowStore();
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Basic validation
  const hasBasicError = typeof data.label !== 'string' || !data.label.trim();
  
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
  
  const nodeClassNames = `condition-node ${hasErrors || hasBasicError ? 'has-error' : ''} ${hasWarnings ? 'has-warning' : ''}`;

  return (
    <SelectionHighlight 
      isSelected={selected} 
      isFlashing={isFlashing}
      hasError={hasErrors || hasBasicError}
      className={nodeClassNames}
    >
      <div className="node-wrapper" title={errorMessages}>
        {/* Handler de entrada en el vértice izquierdo */}
        <Handle type="target" position={Position.Left} id="input" className="handle handle-left" />
        
        {/* Handler de salida true en el vértice derecho */}
        <Handle type="source" position={Position.Right} id="outputTrue" className="handle handle-right" />
        
        {/* Handler de salida false en el vértice inferior */}
        <Handle type="source" position={Position.Bottom} id="outputFalse" className="handle handle-bottom" />
        
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
        
        <div className="diamond">
          <span className="label">{data.label || 'Condición\n(If)'}</span>
        </div>
        
        <div className="label-true">true</div>
        <div className="label-false">false</div>
      </div>
    </SelectionHighlight>
  );
};

export default ConditionNode;
