import React, { useState } from 'react';
import { Input, Button } from 'antd';
import { useNodeTypesStore } from '../stores/nodeTypesStore';
import SvgIcon from './SvgIcon';
import './NodePanel.css';

const NodePanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const { customNodeTypes, systemNodeTypes } = useNodeTypesStore();

  const toggle = () => setCollapsed(!collapsed);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  // Categorías para organizar los nodos
  const categories = {
    'triggers': 'Entrada',
    'actions': 'Acciones',
    'logic': 'Lógica',
    'data': 'Datos',
    'ui': 'UI',
    'custom': 'Personalizados'
  };

  // Mapear nodos del sistema
  const predefinedNodes = systemNodeTypes.map(node => ({
    type: node.type,
    label: node.name,
    category: categories[node.category as keyof typeof categories] || 'Otros',
    icon: node.icon,
    description: node.description
  }));

  // Mapear nodos personalizados
  const customNodes = customNodeTypes.map(node => ({
    type: node.id,
    label: node.name,
    category: 'Personalizados',
    icon: node.icon,
    description: node.description
  }));

  // Combinar todos los nodos
  const allNodes = [...predefinedNodes, ...customNodes];

  const filteredNodes = allNodes.filter(node =>
    node.label.toLowerCase().includes(search.toLowerCase())
  );

  if (collapsed) {
    return (
      <div className="node-panel collapsed">
        <div className="collapsed-top">
          <Button type="text" onClick={toggle} className="collapse-btn">
            »
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="node-panel">
      <div className="panel-header" onClick={toggle}>
        <span>Nodos</span>
        <Button type="text" className="collapse-btn">
          «
        </Button>
      </div>
      <div className="panel-content">
        <Input
          placeholder="Buscar nodo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search"
        />
        <Button type="primary" className="add-node-type-btn">
          + Tipo de nodo
        </Button>
        
        <div className="node-categories">
          {Object.values(categories).map(category => {
            const nodesInCategory = filteredNodes.filter(node => node.category === category);
            if (nodesInCategory.length === 0) return null;
            
            return (
              <div key={category} className="node-category">
                <h3>{category}</h3>
                <div className="node-list">
                  {nodesInCategory.map(node => (
                    <div
                      key={node.type}
                      className="node-item"
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type)}
                    >
                      <span className="node-icon">
                        <SvgIcon svgContent={node.icon} className="svg-icon" />
                      </span>
                      <span className="node-label">{node.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {customNodes.length > 0 && (
            <div className="node-category">
              <h3>Personalizados</h3>
              <div className="node-list">
                {customNodes.map(node => (
                  <div
                    key={node.type}
                    className="node-item"
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                  >
                    <span className="node-icon">
                      <SvgIcon svgContent={node.icon} className="svg-icon" />
                    </span>
                    <span className="node-label">{node.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodePanel;
