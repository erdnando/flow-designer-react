import { useEffect, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { useFlowStore } from '../stores/flowStore';

/**
 * Componente que estabiliza el layout cuando se agregan nuevos nodos o se recarga la página
 * y maneja la persistencia de posiciones y viewport
 */
const LayoutStabilizer: React.FC = () => {
  const { getNodes, setNodes, getViewport, setViewport } = useReactFlow();
  const storeNodes = useFlowStore(state => state.nodes);
  const saveViewport = useFlowStore(state => state.saveViewport);
  const getStoredViewport = useFlowStore(state => state.getStoredViewport);
  
  // Función mejorada para estabilizar el layout
  const stabilizeLayout = useCallback(() => {
    const currentNodes = getNodes();
    if (currentNodes.length === 0) return;

    // Asegurarse de que todos los nodos tienen posición absoluta y coincide con position
    const updatedNodes = currentNodes.map((node) => {
      return {
        ...node,
        // Siempre actualizar positionAbsolute para mantener la estabilidad
        positionAbsolute: { ...node.position },
        // Agregamos esta propiedad para evitar la reorganización automática
        dragging: false,
        // Asegurar que la posición está correctamente establecida
        position: node.positionAbsolute || node.position
      };
    });

    setNodes(updatedNodes);
    
    // Conservar el estado del viewport actual para evitar saltos y guardarlo en localStorage
    const viewport = getViewport();
    setViewport({ x: viewport.x, y: viewport.y, zoom: viewport.zoom });
    
    // Guardar viewport en localStorage
    saveViewport(viewport);
  }, [getNodes, setNodes, getViewport, setViewport, saveViewport]);

  // Restaurar viewport desde localStorage al iniciar
  useEffect(() => {
    const storedViewport = getStoredViewport();
    if (storedViewport) {
      // Usar un timeout para asegurarse de que ReactFlow ya está inicializado
      setTimeout(() => {
        setViewport(storedViewport);
      }, 100);
    }
  }, [getStoredViewport, setViewport]);

  // Estabilizar cuando cambia el número de nodos en el store
  useEffect(() => {
    stabilizeLayout();
    
    // Aplicamos la estabilización varias veces con retrasos crecientes
    // para asegurar que capturamos todos los cambios asíncronos
    const timers = [
      setTimeout(stabilizeLayout, 50),
      setTimeout(stabilizeLayout, 200),
      setTimeout(stabilizeLayout, 500)
    ];
    
    return () => timers.forEach(clearTimeout);
  }, [stabilizeLayout, storeNodes.length]);
  
  // También estabilizar al cargar o refrescar la página
  useEffect(() => {
    // Estabilizar inmediatamente después de montar
    stabilizeLayout();
    
    // Agregar un event listener para el evento load para estabilizar después de cargar completamente
    const handleLoad = () => {
      // Primero estabilizamos las posiciones de los nodos
      stabilizeLayout();
      
      // Luego restauramos el viewport guardado con un poco de delay
      setTimeout(() => {
        const storedViewport = getStoredViewport();
        if (storedViewport) {
          setViewport(storedViewport);
        }
      }, 100);
      
      // Y volvemos a estabilizar después para asegurar que todo quedó bien
      setTimeout(stabilizeLayout, 300);
    };
    
    // También guardar viewport cuando cambia
    const handleViewportChange = () => {
      const viewport = getViewport();
      saveViewport(viewport);
    };
    
    // Escuchar eventos específicos de zoom y pan en ReactFlow
    const handleZoom = () => {
      // Usando un pequeño delay para asegurar que capturamos el viewport final después del zoom
      setTimeout(() => {
        const viewport = getViewport();
        saveViewport(viewport);
      }, 50);
    };
    
    // Agregar event listeners
    window.addEventListener('load', handleLoad);
    window.addEventListener('resize', handleViewportChange);
    
    // Agregar event listeners para zoom y scroll
    document.addEventListener('wheel', handleZoom, { passive: true });
    
    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', handleViewportChange);
      document.removeEventListener('wheel', handleZoom);
    };
  }, [stabilizeLayout, getViewport, setViewport, saveViewport, getStoredViewport]);

  // Este componente no renderiza nada visible
  return null;
};

export default LayoutStabilizer;
