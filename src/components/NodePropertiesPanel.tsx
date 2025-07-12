import React, { useState, useEffect, useMemo } from 'react';
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
  
  // Estado de edición local separado del estado global para permitir edición fluida
  const [editingValues, setEditingValues] = useState({
    label: '',
    type: 'default',
    subtitle: '',
  });
  
  const { selectedNodeId, nodes: storeNodes } = useFlowStore();
  const { customNodeTypes } = useNodeTypesStore();

  // Obtenemos el nodo seleccionado directamente del store como respaldo
  const effectiveNode = useMemo(() => {
    // Si se proporciona un nodo seleccionado via props, usarlo
    if (selectedNode) return selectedNode;
    
    // Si no hay selectedNode pero tenemos un selectedNodeId, buscarlo en el store
    if (selectedNodeId) {
      const foundNode = storeNodes.find(node => node.id === selectedNodeId);
      if (foundNode) {
        console.log("NodePropertiesPanel - Fallback to store node:", foundNode.id);
        return foundNode;
      }
    }
    
    return null;
  }, [selectedNode, selectedNodeId, storeNodes]);

  // Sincronizar estado de collapsed
  useEffect(() => {
    setCollapsed(externalCollapsed);
  }, [externalCollapsed]);

  // Effect to update node properties from the most reliable source with improved state handling
  useEffect(() => {
    console.log("NodePropertiesPanel - updating from effectiveNode or store");
    
    let newProperties = {
      label: '',
      type: 'default',
      subtitle: '',
    };
    
    // Flag para saber si estamos cambiando de nodo o actualizando el mismo
    let isNodeChange = false;
    let nodeId = null;
    
    if (effectiveNode && effectiveNode.data) {
      // Si tenemos un effectiveNode (de props o store), usarlo
      nodeId = effectiveNode.id;
      console.log("Setting properties from effectiveNode:", nodeId);
      
      // Comprobar si esto es un cambio de nodo o una actualización del mismo nodo
      isNodeChange = nodeId !== selectedNodeId;
      
      newProperties = {
        label: effectiveNode.data.label || '',
        type: effectiveNode.data.type || effectiveNode.type || 'default',
        subtitle: effectiveNode.data.subtitle || '',
      };
      
      console.log("effectiveNode properties:", JSON.stringify(newProperties));
    } else if (selectedNodeId) {
      // Si no hay effectiveNode pero tenemos selectedNodeId, intentar obtenerlo del store
      nodeId = selectedNodeId;
      const storeNode = storeNodes.find(n => n.id === selectedNodeId);
      
      if (storeNode && storeNode.data) {
        console.log("Setting properties from store node:", nodeId);
        
        newProperties = {
          label: storeNode.data.label || '',
          type: storeNode.data.type || storeNode.type || 'default',
          subtitle: storeNode.data.subtitle || '',
        };
        
        console.log("storeNode properties:", JSON.stringify(newProperties));
      }
    } else {
      console.log("No node selected, clearing properties");
      isNodeChange = true; // Considerar como cambio de nodo si se deselecciona
    }
    
    // Actualizar editingValues solo si es un cambio de nodo o los valores son undefined
    setEditingValues(prevValues => {
      // Solo actualizar todo si:
      // 1. Es un cambio de nodo (selección diferente)
      // 2. No hay valores previos significativos
      if (isNodeChange || !prevValues.label) {
        console.log("Replacing all editing values with:", JSON.stringify(newProperties));
        return newProperties;
      }
      
      // En caso contrario, mantener los valores de edición actuales para no interrumpir al usuario
      // pero sincronizar valores que no se estén editando activamente
      console.log("Keeping current editing values:", JSON.stringify(prevValues));
      return prevValues;
    });
  }, [effectiveNode, selectedNodeId, storeNodes]);

  const toggleCollapsed = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggleCollapsed?.(newCollapsed);
  };

  // Esta función ya no se usa porque ahora cada campo maneja su propia actualización inline

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
        ) : !disabled && (effectiveNode || selectedNodeId) ? (
          <div className="node-properties">
            <div className="form-group">
              <label>Nombre</label>
              <Input
                value={editingValues.label}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Label onChange:", newValue);
                  
                  // 1. Mantener una referencia al valor actual para usarlo en la actualización
                  const currentLabelValue = newValue;
                  
                  // 2. Actualizar el estado local primero para una respuesta inmediata del UI
                  setEditingValues(prev => {
                    console.log("Actualizando editingValues label de", prev.label, "a", currentLabelValue);
                    return {
                      ...prev,
                      label: currentLabelValue
                    };
                  });
                  
                  // 3. Usar setTimeout para asegurar que la actualización del store ocurra después
                  // de que el estado local se haya actualizado
                  setTimeout(() => {
                    const nodeId = effectiveNode?.id || selectedNodeId;
                    if (nodeId) {
                      console.log(`Iniciando actualización de store para nodo ${nodeId}, label: "${currentLabelValue}"`);
                      
                      // Obtener el nodo más reciente del store
                      const storeState = useFlowStore.getState();
                      const currentNode = storeState.nodes.find(n => n.id === nodeId);
                      
                      if (currentNode) {
                        // Crear un nuevo objeto para el nodo con el label actualizado
                        const updatedNode = {
                          ...currentNode,
                          data: {
                            ...(currentNode.data || {}),
                            label: currentLabelValue
                          }
                        };
                        
                        console.log(`Actualizando nodo ${nodeId} en store, nuevo label: "${currentLabelValue}"`);
                        storeState.updateNode(nodeId, updatedNode);
                        
                        // Verificación adicional después de la actualización
                        setTimeout(() => {
                          const verifyNode = useFlowStore.getState().nodes.find(n => n.id === nodeId);
                          if (verifyNode) {
                            console.log(`Verificación: nodo ${nodeId} label en store ahora es:`, 
                              verifyNode.data?.label);
                          }
                        }, 10);
                      }
                    }
                  }, 0);
                }}
                allowClear
                autoFocus={false}
                placeholder="Nombre del nodo"
              />
            </div>
            
            <div className="form-group">
              <label>Tipo</label>
              <Select
                value={editingValues.type === 'if' ? 'condition' : editingValues.type}
                onChange={(value) => {
                  // Handling 'condition' type specifically
                  const finalValue = value === 'condition' ? 'condition' : value;
                  console.log("Type onChange:", finalValue);
                  
                  // 1. Mantener una referencia al valor actual para usarlo en la actualización
                  const currentTypeValue = finalValue;
                  
                  // 2. Actualizar el estado local primero para una respuesta inmediata del UI
                  setEditingValues(prev => {
                    console.log("Actualizando editingValues type de", prev.type, "a", currentTypeValue);
                    return {
                      ...prev,
                      type: currentTypeValue
                    };
                  });
                  
                  // 3. Usar setTimeout para asegurar que la actualización del store ocurra después
                  // de que el estado local se haya actualizado
                  setTimeout(() => {
                    const nodeId = effectiveNode?.id || selectedNodeId;
                    if (nodeId) {
                      console.log(`Iniciando actualización de store para nodo ${nodeId}, tipo: "${currentTypeValue}"`);
                      
                      // Obtener el nodo más reciente del store
                      const storeState = useFlowStore.getState();
                      const currentNode = storeState.nodes.find(n => n.id === nodeId);
                      
                      if (currentNode) {
                        // Para type, actualizamos tanto el node.type como el node.data.type
                        const updatedNode = {
                          ...currentNode,
                          type: currentTypeValue, // Actualizar el type a nivel de nodo
                          data: {
                            ...(currentNode.data || {}),
                            type: currentTypeValue  // Actualizar el type en data
                          }
                        };
                        
                        console.log(`Actualizando nodo ${nodeId} en store, nuevo tipo: "${currentTypeValue}"`);
                        storeState.updateNode(nodeId, updatedNode);
                        
                        // Verificación adicional después de la actualización
                        setTimeout(() => {
                          const verifyNode = useFlowStore.getState().nodes.find(n => n.id === nodeId);
                          if (verifyNode) {
                            console.log(`Verificación: nodo ${nodeId} tipo en store ahora es:`, 
                              verifyNode.type, verifyNode.data?.type);
                          }
                        }, 10);
                      }
                    }
                  }, 0);
                }}
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
                value={editingValues.subtitle || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log("Subtitle onChange:", newValue);
                  
                  // 1. Mantener una referencia al valor actual para usarlo en la actualización
                  const currentSubtitleValue = newValue;
                  
                  // 2. Actualizar el estado local primero para una respuesta inmediata del UI
                  setEditingValues(prev => {
                    console.log("Actualizando editingValues de", prev.subtitle, "a", currentSubtitleValue);
                    return {
                      ...prev,
                      subtitle: currentSubtitleValue
                    };
                  });
                  
                  // 3. Usar setTimeout para asegurar que la actualización del store ocurra después
                  // de que el estado local se haya actualizado
                  setTimeout(() => {
                    const nodeId = effectiveNode?.id || selectedNodeId;
                    if (nodeId) {
                      console.log(`Iniciando actualización de store para nodo ${nodeId}, subtítulo: "${currentSubtitleValue}"`);
                      
                      // Obtener el nodo más reciente del store
                      const storeState = useFlowStore.getState();
                      const currentNode = storeState.nodes.find(n => n.id === nodeId);
                      
                      if (currentNode) {
                        // Crear un nuevo objeto para el nodo con el subtítulo actualizado
                        const updatedNode = {
                          ...currentNode,
                          data: {
                            ...(currentNode.data || {}),
                            subtitle: currentSubtitleValue
                          }
                        };
                        
                        console.log(`Actualizando nodo ${nodeId} en store, nuevo subtítulo: "${currentSubtitleValue}"`);
                        storeState.updateNode(nodeId, updatedNode);
                        
                        // Verificación adicional después de la actualización
                        setTimeout(() => {
                          const verifyNode = useFlowStore.getState().nodes.find(n => n.id === nodeId);
                          if (verifyNode) {
                            console.log(`Verificación: nodo ${nodeId} subtítulo en store ahora es:`, 
                              verifyNode.data?.subtitle);
                          }
                        }, 10);
                      }
                    }
                  }, 0);
                }}
                // Características adicionales para mejorar la experiencia de usuario
                allowClear
                autoFocus={!!selectedNodeId}
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
