import { useEffect } from 'react';
import { useReactFlow, type Node } from 'reactflow';

/**
 * Hook personalizado para estabilizar el layout de ReactFlow
 * Evita que los nodos se recoloquen después de actualizaciones
 */
const useStableLayout = () => {
  const { getNodes, setNodes } = useReactFlow();
  
  useEffect(() => {
    // Función para estabilizar la posición de los nodos
    const stabilizeNodes = () => {
      const nodes = getNodes();
      if (nodes.length === 0) return;
      
      // Asegurarse de que todos los nodos tengan positionAbsolute
      const updatedNodes = nodes.map((node: Node) => {
        // Si el nodo ya tiene positionAbsolute, lo mantenemos
        if (node.positionAbsolute) {
          return node;
        }
        
        // Si no, copiamos position a positionAbsolute
        return {
          ...node,
          positionAbsolute: { ...node.position },
        };
      });
      
      // Actualizar los nodos con sus posiciones estabilizadas
      setNodes(updatedNodes);
    };
    
    // Ejecutar la estabilización
    stabilizeNodes();
    
    // También estabilizar después de algún tiempo para asegurar que 
    // cualquier cambio asíncrono se maneje correctamente
    const timer = setTimeout(stabilizeNodes, 200);
    
    return () => clearTimeout(timer);
  }, [getNodes, setNodes]);
};

export default useStableLayout;
