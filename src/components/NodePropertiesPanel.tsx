import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from 'antd';
import type { Node } from 'reactflow';
import { useFlowStore } from '../stores/flowStore';
import { useNodeTypesStore } from '../stores/nodeTypesStore';
import './NodePropertiesPanel.css';

const { TextArea } = Input;
const { Option } = Select;

interface ProjectProperties {
  name: string;
  description: string;
  status: string;
  owner: string;
  createdAt?: string;
  updatedAt?: string;
}

interface NodePropertiesPanelProps {
  selectedNode?: Node | null;
  collapsed?: boolean;
  disabled?: boolean;
  showProject?: boolean;
  projectProps?: ProjectProperties;
  onToggleCollapsed?: (collapsed: boolean) => void;
  onUpdateProject?: (props: Partial<ProjectProperties>) => void;
}

const NodePropertiesPanel: React.FC<NodePropertiesPanelProps> = ({
  selectedNode,
  collapsed: externalCollapsed = false,
  disabled = false,
  showProject = false,
  projectProps,
  onToggleCollapsed,
  onUpdateProject,
}) => {
  const [collapsed, setCollapsed] = useState(externalCollapsed);
  const [nodeProperties, setNodeProperties] = useState({
    label: '',
    type: 'default',
    subtitle: '',
  });
  
  const { updateNode } = useFlowStore();
  const { customNodeTypes } = useNodeTypesStore();

  // Sincronizar estado de collapsed
  useEffect(() => {
    setCollapsed(externalCollapsed);
  }, [externalCollapsed]);

  // Actualizar propiedades del nodo cuando cambie el nodo seleccionado
  useEffect(() => {
    if (selectedNode) {
      setNodeProperties({
        label: selectedNode.data?.label || '',
        type: selectedNode.data?.type || selectedNode.type || 'default',
        subtitle: selectedNode.data?.subtitle || '',
      });
    } else {
      setNodeProperties({
        label: '',
        type: 'default',
        subtitle: '',
      });
    }
  }, [selectedNode]);

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggleCollapsed?.(newCollapsed);
  };

  const handleNodePropertyChange = (key: string, value: string) => {
    if (!selectedNode) return;

    setNodeProperties(prev => ({ ...prev, [key]: value }));
    
    // Actualizar el nodo en el store
    updateNode(selectedNode.id, {
      ...selectedNode,
      [key === 'label' ? 'data' : key]: key === 'label' 
        ? { ...selectedNode.data, label: value }
        : value,
      data: {
        ...selectedNode.data,
        [key]: value,
      }
    });
  };

  const handleProjectPropertyChange = (key: string, value: string) => {
    if (onUpdateProject) {
      onUpdateProject({ [key]: value });
    }
  };

  // Tipos de nodos disponibles
  const allNodeTypes = [
    'default', 'webhook', 'http', 'gmail', 'function', 'set', 
    'delay', 'merge', 'condition', ...customNodeTypes.map(t => t.id)
  ];

  if (collapsed) {
    return (
      <div className="node-properties-panel collapsed">
        <div className="collapsed-top">
          <Button type="text" onClick={toggleCollapsed} className="collapse-btn">
            «
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`node-properties-panel ${disabled && !showProject ? 'disabled' : ''}`}>
      <div className="panel-header" onClick={() => setCollapsed(false)}>
        <span className="panel-title">
          {showProject ? 'Propiedades del flujo' : 'Propiedades del nodo'}
        </span>
        <Button type="text" onClick={toggleCollapsed} className="collapse-btn">
          »
        </Button>
      </div>
      
      <div className="panel-body">
        {showProject ? (
          <div className="project-properties">
            <div className="form-group">
              <label>Nombre del flujo</label>
              <Input
                value={projectProps?.name || ''}
                onChange={(e) => handleProjectPropertyChange('name', e.target.value)}
                disabled={disabled}
                placeholder="Nombre del flujo"
              />
            </div>
            
            <div className="form-group">
              <label>Descripción</label>
              <TextArea
                value={projectProps?.description || ''}
                onChange={(e) => handleProjectPropertyChange('description', e.target.value)}
                disabled={disabled}
                placeholder="Descripción del flujo"
                rows={2}
              />
            </div>
            
            <div className="form-group">
              <label>Estatus</label>
              <Select
                value={projectProps?.status || 'Activo'}
                onChange={(value) => handleProjectPropertyChange('status', value)}
                disabled={disabled}
                style={{ width: '100%' }}
              >
                <Option value="Activo">Activo</Option>
                <Option value="Inactivo">Inactivo</Option>
                <Option value="Archivado">Archivado</Option>
              </Select>
            </div>
            
            <div className="form-group">
              <label>Propietario</label>
              <Input
                value={projectProps?.owner || ''}
                onChange={(e) => handleProjectPropertyChange('owner', e.target.value)}
                disabled={disabled}
                placeholder="Propietario"
              />
            </div>
            
            <div className="project-meta">
              <span>Creado: {projectProps?.createdAt || ''}</span>
              <span>Actualizado: {projectProps?.updatedAt || ''}</span>
            </div>
          </div>
        ) : !disabled && selectedNode ? (
          <div className="node-properties">
            <div className="form-group">
              <label>Nombre</label>
              <Input
                value={nodeProperties.label}
                onChange={(e) => handleNodePropertyChange('label', e.target.value)}
                placeholder="Nombre del nodo"
              />
            </div>
            
            <div className="form-group">
              <label>Tipo</label>
              <Select
                value={nodeProperties.type === 'if' ? 'condition' : nodeProperties.type}
                onChange={(value) => handleNodePropertyChange('type', value === 'condition' ? 'condition' : value)}
                style={{ width: '100%' }}
              >
                {allNodeTypes.filter(t => t !== 'if').map(type => (
                  <Option key={type} value={type === 'condition' ? 'condition' : type}>
                    {type === 'condition' ? 'Condición (If)' : type}
                  </Option>
                ))}
              </Select>
            </div>
            
            <div className="form-group">
              <label>Subtítulo</label>
              <Input
                value={nodeProperties.subtitle}
                onChange={(e) => handleNodePropertyChange('subtitle', e.target.value)}
                placeholder="Ingrese un subtítulo"
              />
            </div>
          </div>
        ) : (
          <div className="empty-panel">
            Selecciona un nodo o haz click en el fondo para ver propiedades del flujo
          </div>
        )}
      </div>
    </div>
  );
};

export default NodePropertiesPanel;
