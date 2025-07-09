import { useEffect, useCallback } from 'react';
import { useFlowStore } from '../stores/flowStore';

export const useKeyboardShortcuts = () => {
  const { undo, redo, canUndo, canRedo } = useFlowStore();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check for Ctrl+Z (Undo)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) {
          undo();
        }
      }
      
      // Check for Ctrl+Shift+Z or Ctrl+Y (Redo)
      if (
        ((event.ctrlKey || event.metaKey) && event.key === 'z' && event.shiftKey) ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo()) {
          redo();
        }
      }
    },
    [undo, redo, canUndo, canRedo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
