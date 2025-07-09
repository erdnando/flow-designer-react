import React, { useState, useEffect } from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from 'reactflow';
import { useFlowStore } from '../stores/flowStore';
import './CustomEdge.css';

const CustomEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  selected
}) => {
  const { getEdgeErrors } = useFlowStore();
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Use getBezierPath for smoother curved edges
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    // These curvature values create a nice smooth curve
    curvature: 0.3
  });
  
  // Get validation errors for this edge
  const errors = getEdgeErrors(id);
  const hasErrors = errors.some(err => err.severity === 'error');
  const hasWarnings = errors.some(err => err.severity === 'warning');
  const errorMessages = errors.map(err => err.message).join(', ');
  
  // Edge flash effect handler
  useEffect(() => {
    // We can implement a method to flash edges by adding a DOM attribute or class
    const edgeElement = document.querySelector(`[data-testid="rf__edge-${id}"]`);
    if (edgeElement && isFlashing) {
      edgeElement.classList.add('edge-flash');
      
      const timer = setTimeout(() => {
        edgeElement.classList.remove('edge-flash');
        setIsFlashing(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [id, isFlashing]);
  
  // Determine edge styles based on validation and selection
  const edgeStyles = {
    ...style,
    stroke: hasErrors ? '#ff4d4f' : 
            hasWarnings ? '#faad14' : 
            selected ? '#2684FF' : 
            '#b1b1b7',
    strokeWidth: selected ? 3 : hasErrors || hasWarnings ? 2 : 1,
    cursor: 'pointer',
  };
  
  // Determine the classes based on the edge state
  const edgeClassName = `custom-edge-container ${hasErrors ? 'has-error' : hasWarnings ? 'has-warning' : selected ? 'selected' : ''}`;
  
  return (
    <g className={edgeClassName}>
      {/* Add a title element for tooltips */}
      <title>{errorMessages}</title>
      <BaseEdge 
        path={edgePath} 
        id={id}
        style={edgeStyles} 
        markerEnd={markerEnd}
      />
    </g>
  );
};

export default CustomEdge;
