import React, { useState, useEffect, type ReactNode } from 'react';
import './SelectionHighlight.css';

interface SelectionHighlightProps {
  isSelected: boolean;
  isFlashing?: boolean;
  hasError?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * A wrapper component that applies highlight and flash animations to selected nodes.
 * 
 * @param isSelected - Whether the node is currently selected
 * @param isFlashing - Whether to flash the node (temporary highlight effect)
 * @param hasError - Whether the node has a validation error
 * @param className - Additional CSS classes
 * @param children - Child components to wrap
 */
const SelectionHighlight: React.FC<SelectionHighlightProps> = ({
  isSelected,
  isFlashing = false,
  hasError = false,
  className = '',
  children
}) => {
  const [flash, setFlash] = useState(isFlashing);
  
  // Handle flashing effect - activate for 2.5s then stop
  useEffect(() => {
    if (isFlashing) {
      setFlash(true);
      const timer = setTimeout(() => {
        setFlash(false);
      }, 2500); // Duration of the flash effect
      
      return () => clearTimeout(timer);
    }
  }, [isFlashing]);
  
  // Build class names based on props
  const highlightClasses = [
    'selection-highlight-wrapper',
    isSelected ? 'node-selected-highlight' : '',
    flash ? 'node-flash-highlight' : '',
    hasError ? 'node-error-highlight' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={highlightClasses}>
      {children}
    </div>
  );
};

export default SelectionHighlight;
