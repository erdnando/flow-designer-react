import React, { useCallback, useMemo, useState } from 'react';
import { Button, List, Tag, Tooltip } from 'antd';
import { 
  WarningOutlined, 
  ExclamationCircleOutlined, 
  CloseOutlined, 
  BugOutlined,
  ZoomInOutlined
} from '@ant-design/icons';
import { useReactFlow } from 'reactflow';
import { useFlowStore } from '../stores/flowStore';
import type { ValidationError } from '../utils/flowValidation';
import './ValidationPanel.css';

type TabType = 'all' | 'errors' | 'warnings';

const ValidationPanel: React.FC = () => {
  const { validationErrors, showValidation, toggleValidation } = useFlowStore();
  const reactFlowInstance = useReactFlow();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  
  const errorCount = validationErrors.filter(err => err.severity === 'error').length;
  const warningCount = validationErrors.filter(err => err.severity === 'warning').length;
  
  // Filter validation errors based on active tab
  const filteredErrors = useMemo(() => {
    switch (activeTab) {
      case 'errors':
        return validationErrors.filter(err => err.severity === 'error');
      case 'warnings':
        return validationErrors.filter(err => err.severity === 'warning');
      default:
        return validationErrors;
    }
  }, [validationErrors, activeTab]);
  
  const { setSelectedNodeId } = useFlowStore();
  
  const handleItemClick = useCallback((error: ValidationError) => {
    // Find the node or edge with the specified ID
    if (error.id === 'flow') {
      // For flow-level errors, just zoom to fit
      reactFlowInstance.fitView({ padding: 0.1 });
      setSelectedNodeId(null); // Clear selection
      return;
    }
    
    const node = reactFlowInstance.getNode(error.id);
    if (node) {
      // Center on the node
      reactFlowInstance.setCenter(
        node.position.x + (node.width || 0) / 2, 
        node.position.y + (node.height || 0) / 2, 
        { zoom: 1.5, duration: 800 }
      );
      
      // Select the node to trigger the flash effect via our updated node components
      setSelectedNodeId(node.id);
      
    } else if (error.type === 'edge') {
      // Find edge and highlight it
      const edge = reactFlowInstance.getEdge(error.id);
      if (edge) {
        // Find source and target nodes to center on the edge
        const sourceNode = reactFlowInstance.getNode(edge.source);
        const targetNode = reactFlowInstance.getNode(edge.target);
        
        if (sourceNode && targetNode) {
          const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
          const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
          
          reactFlowInstance.setCenter(centerX, centerY, { zoom: 1.2, duration: 800 });
          
          // Add a flash effect to the edge
          // First select the source node to show context
          setSelectedNodeId(edge.source);
          
          // Apply a CSS class to highlight the edge (we need to update FlowCanvas to handle this)
          const edgeElement = document.querySelector(`[data-testid="rf__edge-${edge.id}"]`);
          if (edgeElement) {
            edgeElement.classList.add('edge-flash');
            setTimeout(() => {
              edgeElement.classList.remove('edge-flash');
            }, 2500); // Match the duration of the node flash
          }
        }
      }
    }
  }, [reactFlowInstance, setSelectedNodeId]);

  if (!showValidation) {
    return (
      <div className="validation-toggle-btn">
        <Tooltip title="Mostrar validación del flujo">
          <Button 
            type="primary" 
            shape="circle" 
            icon={<BugOutlined />}
            onClick={toggleValidation}
            danger={errorCount > 0}
          />
        </Tooltip>
        {(errorCount > 0 || warningCount > 0) && (
          <div className="validation-badge">
            {errorCount > 0 ? errorCount : warningCount}
          </div>
        )}
      </div>
    );
  }
  
  // Filter options
  const handleFilterChange = (e: React.MouseEvent<HTMLElement>) => {
    const value = (e.target as HTMLButtonElement).value as TabType;
    setActiveTab(value);
  };
  
  return (
    <div className="validation-panel">
      <div className="validation-header">
        <div>
          <h3>Validación del Flujo</h3>
          <div className="validation-stats">
            {errorCount > 0 && (
              <Tag color="error">
                <ExclamationCircleOutlined /> {errorCount} {errorCount === 1 ? 'error' : 'errores'}
              </Tag>
            )}
            {warningCount > 0 && (
              <Tag color="warning">
                <WarningOutlined /> {warningCount} {warningCount === 1 ? 'advertencia' : 'advertencias'}
              </Tag>
            )}
            {errorCount === 0 && warningCount === 0 && (
              <Tag color="success">
                El flujo es válido
              </Tag>
            )}
          </div>
        </div>
        <Button 
          type="text" 
          icon={<CloseOutlined />} 
          onClick={toggleValidation}
          className="close-btn"
        />
      </div>
      
      <div className="validation-filter">
        <Button.Group>
          <Button 
            value="all" 
            type={activeTab === 'all' ? 'primary' : 'default'}
            onClick={handleFilterChange}
          >
            Todos
          </Button>
          <Button 
            value="errors" 
            type={activeTab === 'errors' ? 'primary' : 'default'}
            danger={activeTab === 'errors'}
            onClick={handleFilterChange}
          >
            Errores
          </Button>
          <Button 
            value="warnings" 
            type={activeTab === 'warnings' ? 'primary' : 'default'}
            onClick={handleFilterChange}
          >
            Advertencias
          </Button>
        </Button.Group>
      </div>
      
      <List
        className="validation-list"
        itemLayout="horizontal"
        dataSource={filteredErrors}
        renderItem={error => (
          <List.Item 
            onClick={() => handleItemClick(error)}
            className={`validation-item ${error.severity === 'error' ? 'error-item' : 'warning-item'}`}
          >
            <List.Item.Meta
              avatar={
                error.severity === 'error' 
                  ? <ExclamationCircleOutlined className="error-icon" /> 
                  : <WarningOutlined className="warning-icon" />
              }
              title={
                <span className={error.severity === 'error' ? 'error-text' : 'warning-text'}>
                  {error.message}
                </span>
              }
              description={
                <div>
                  <div>{`ID: ${error.id} (${error.type})`}</div>
                  <Tooltip title="Localizar en el flujo">
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<ZoomInOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(error);
                      }}
                    >
                      Localizar
                    </Button>
                  </Tooltip>
                </div>
              }
            />
          </List.Item>
        )}
      />
      
      <div className="validation-footer">
        <Button type="primary" onClick={toggleValidation}>
          Ocultar validación
        </Button>
        <Button 
          onClick={() => reactFlowInstance.fitView({ padding: 0.1 })}
        >
          Ajustar vista
        </Button>
      </div>
    </div>
  );
};

export default ValidationPanel;
