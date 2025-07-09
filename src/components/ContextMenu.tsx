import React, { useEffect } from 'react';
import './ContextMenu.css';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  items: { label: string; action: () => void }[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, x, y, items, onClose }) => {
  useEffect(() => {
    const handleGlobalClick = () => {
      onClose();
    };

    if (visible) {
      window.addEventListener('mousedown', handleGlobalClick);
    }

    return () => {
      window.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [visible, onClose]);

  const handleItemClick = (item: { label: string; action: () => void }) => {
    item.action();
    onClose();
  };

  if (!visible) return null;

  return (
    <div 
      className="context-menu"
      style={{ top: `${y}px`, left: `${x}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <ul>
        {items.map((item) => (
          <li key={item.label} onClick={() => handleItemClick(item)}>
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ContextMenu;
