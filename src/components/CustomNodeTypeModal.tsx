import React, { useState, useEffect } from 'react';
import { Button, Input, Form, ColorPicker } from 'antd';
import type { Color } from 'antd/es/color-picker';
import './CustomNodeTypeModal.css';

interface CustomNodeType {
  id?: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

interface CustomNodeTypeModalProps {
  visible: boolean;
  editId?: string | null;
  nodeType?: Partial<CustomNodeType>;
  onClose: () => void;
  onSave: (nodeType: CustomNodeType) => void;
}

const CustomNodeTypeModal: React.FC<CustomNodeTypeModalProps> = ({
  visible,
  editId = null,
  nodeType,
  onClose,
  onSave,
}) => {
  const [form, setForm] = useState<CustomNodeType>({
    name: '',
    color: '#e14d43',
    icon: '',
    description: '',
  });

  // Reset form when nodeType changes
  useEffect(() => {
    if (nodeType) {
      setForm({
        name: nodeType.name || '',
        color: nodeType.color || '#e14d43',
        icon: nodeType.icon || '',
        description: nodeType.description || '',
      });
    } else {
      setForm({
        name: '',
        color: '#e14d43',
        icon: '',
        description: '',
      });
    }
  }, [nodeType]);

  const handleSave = () => {
    onSave({ ...form, id: editId || undefined });
  };

  const handleColorChange = (color: Color) => {
    setForm({ ...form, color: color.toHexString() });
  };

  if (!visible) return null;

  return (
    <div className="custom-node-crud-modal">
      <div className="modal-bg" onClick={onClose} />
      <div className="modal-content">
        <h3>{editId ? 'Editar tipo de nodo' : 'Nuevo tipo de nodo'}</h3>
        <Form layout="vertical" onFinish={handleSave}>
          <Form.Item label="Nombre" required>
            <Input 
              value={form.name} 
              onChange={e => setForm({ ...form, name: e.target.value })}
              required
              maxLength={32}
            />
          </Form.Item>
          
          <Form.Item label="Color">
            <ColorPicker 
              value={form.color}
              onChange={handleColorChange}
            />
          </Form.Item>
          
          <Form.Item label="Icono (emoji o SVG)">
            <Input 
              value={form.icon} 
              onChange={e => setForm({ ...form, icon: e.target.value })}
              placeholder="😀 o <svg .../>"
            />
          </Form.Item>
          
          <Form.Item label="Descripción">
            <Input 
              value={form.description} 
              onChange={e => setForm({ ...form, description: e.target.value })}
              maxLength={64}
            />
          </Form.Item>
          
          <div className="actions">
            <Button type="primary" htmlType="submit">
              {editId ? 'Actualizar' : 'Crear'}
            </Button>
            <Button onClick={onClose}>Cancelar</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default CustomNodeTypeModal;
