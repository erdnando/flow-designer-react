# Análisis del Proyecto: Flow Designer React

## 📋 Información General

- **Nombre**: flow-designer-react
- **Versión**: 0.0.0
- **Tipo**: Aplicación React con Vite
- **Propósito**: Diseñador de flujos visuales basado en ReactFlow

## 🏗️ Arquitectura y Stack Tecnológico

### Frontend Framework
- **React**: v19.1.0 (última versión)
- **React DOM**: v19.1.0
- **TypeScript**: ~5.8.3

### Herramientas de Construcción
- **Vite**: v7.0.3 (bundler moderno y rápido)
- **ESLint**: v9.30.1 (linting)
- **Plugin React Vite**: v4.6.0

### Librerías Principales

#### UI y Componentes
- **Ant Design (antd)**: v5.26.4 - Sistema de diseño completo
- **Ant Design Icons**: v6.0.0 - Iconos complementarios

#### Manejo de Flujos
- **ReactFlow**: v11.11.4 - Librería principal para crear diagramas de flujo interactivos

#### Estado y Navegación
- **Zustand**: v5.0.6 - Manejo de estado global ligero
- **React Router DOM**: v7.6.3 - Navegación SPA

#### Utilidades
- **Axios**: v1.10.0 - Cliente HTTP
- **Lodash**: v4.17.21 - Utilidades JS

## 📁 Estructura del Proyecto

```
flow-designer-react/
├── src/
│   ├── components/
│   │   ├── CustomNode.tsx        # Implementación del nodo principal
│   │   ├── CustomNode.css        # Estilos para el nodo principal
│   │   ├── ConditionNode.tsx     # Nodo específico para condiciones
│   │   ├── MinimalNode.tsx       # Nodo minimalista 
│   │   ├── CustomEdge.tsx        # Conexiones entre nodos
│   │   ├── CustomEdge.css        # Estilos para edges
│   │   ├── FlowCanvas.tsx        # Componente principal del canvas
│   │   ├── FlowCanvas.css        # Estilos para el canvas
│   │   ├── LayoutStabilizer.tsx  # Estabiliza posiciones de nodos
│   │   ├── NodePanel.tsx         # Panel lateral de nodos disponibles
│   │   ├── NodePropertiesPanel.tsx # Panel de propiedades
│   │   └── ...                   # Otros componentes
│   ├── stores/
│   │   ├── flowStore.ts          # Estado global y persistencia con Zustand
│   │   └── nodeTypesStore.ts     # Configuración de tipos de nodos
│   ├── hooks/
│   │   ├── useAutoSave.ts        # Hook para guardado automático
│   │   ├── useKeyboardShortcuts.ts # Atajos de teclado
│   │   └── useStableLayout.ts    # Estabilidad de layout
│   ├── utils/
│   │   ├── flowValidation.ts     # Validaciones del flujo
│   │   └── nodeTypeMeta.ts       # Metadatos de tipos de nodos
│   ├── views/
│   │   └── FlowDesignerView.tsx  # Vista principal
│   ├── App.tsx                   # Componente principal
│   └── main.tsx                  # Punto de entrada
├── public/                       # Assets estáticos
├── package.json
├── tsconfig.json                 # Configuración TypeScript
├── vite.config.ts                # Configuración Vite
└── eslint.config.js              # Configuración ESLint
```

## 🎨 Análisis de Componentes Identificados

### CustomEdge.css
Basado en el archivo CSS analizado, el proyecto implementa:

1. **Edges Animados**: 
   - Animaciones fluidas con `stroke-dasharray`
   - Diferentes velocidades de animación (6s, 8s, 10s, 15s)

2. **Estados de Edge**:
   - **Normal**: Líneas punteadas con animación suave
   - **Error** (`.has-error`): Color rojo (#ff4d4f)
   - **Warning** (`.has-warning`): Color amarillo (#faad14)
   - **Selected**: Azul (#2684ff) con sombra
   - **Hover**: Efectos visuales mejorados

3. **Efectos Especiales**:
   - `edge-flash`: Animación de destello para notificaciones
   - Drop shadows para mejorar visibilidad
   - Transiciones suaves entre estados

## 🎨 Implementación de Nodos y Persistencia

### Sistema de Nodos

#### 1. Tipos de Nodos
El proyecto implementa varios tipos de nodos con distintas funcionalidades y apariencia:

- **CustomNode**: Nodo estándar para la mayoría de las operaciones
- **ConditionNode**: Nodo específico para condiciones/decisiones con múltiples salidas
- **MinimalNode**: Versión simplificada para operaciones básicas

La definición de tipos se registra en `FlowCanvas.tsx`:

```tsx
const nodeTypes = {
  custom: CustomNode,
  webhook: CustomNode,
  http: CustomNode,
  gmail: CustomNode,
  condition: ConditionNode,
  if: ConditionNode,
  merge: CustomNode,
  delay: CustomNode,
  set: CustomNode,
  function: CustomNode,
  minimal: MinimalNode,
  default: CustomNode,
};
```

#### 2. Estructura de Nodos
Cada nodo contiene:

- **ID**: Identificador único
- **Type**: Tipo de nodo que define su comportamiento y apariencia
- **Position**: Coordenadas {x, y} en el canvas
- **PositionAbsolute**: Posición absoluta para estabilidad
- **Data**: Objeto con propiedades específicas:
  - **label**: Nombre/título del nodo
  - **subtitle**: Descripción opcional
  - **type**: Tipo específico del nodo
  - **originalPosition**: Posición original (para referencias)
  - **Otros campos**: Metadatos específicos del tipo

#### 3. Creación de Nodos
Los nodos se crean principalmente de dos formas:

1. **Drag & Drop**: Implementado en `onDrop` en FlowCanvas.tsx
   ```tsx
   const onDrop = useCallback((event: DragEvent) => {
     // Calcular posición exacta donde el usuario soltó el nodo
     const position = reactFlowInstance.project({
       x: event.clientX - reactFlowBounds.left,
       y: event.clientY - reactFlowBounds.top,
     });
     
     // Crear y añadir el nuevo nodo
     // ...
   });
   ```

2. **Programáticamente**: A través de la función `addNode` en flowStore.ts
   ```tsx
   addNode: (opts) => {
     // Calcular posición inteligente o usar la proporcionada
     // Crear el nuevo nodo con todos los metadatos necesarios
     // ...
   }
   ```

#### 4. Algoritmo de Posicionamiento
Para colocar nodos automáticamente se usa un algoritmo sofisticado que:

1. Calcula posiciones basadas en nodos existentes
2. Evita superposiciones con un sistema de distancia mínima
3. Preserva posiciones originales para estabilidad
4. Utiliza funciones trigonométricas para distribución natural:

```tsx
// Cálculo de posición para nuevos nodos
const newPosition = opts?.position || { 
  x: currentNodes.length === 0 ? 250 : (
    currentNodes.length < 3 ? 
    250 + (currentNodes.length * 200) : 
    (currentNodes.reduce((sum, node) => sum + node.position.x, 0) / currentNodes.length) + 
    200 * Math.cos(currentNodes.length * 0.7)
  ),
  y: currentNodes.length === 0 ? 250 : (
    currentNodes.length < 3 ? 
    250 + (currentNodes.length * 100) : 
    (currentNodes.reduce((sum, node) => sum + node.position.y, 0) / currentNodes.length) + 
    150 * Math.sin(currentNodes.length * 0.7)
  )
};

// Algoritmo de prevención de colisiones
let adjustedPosition = { ...newPosition };
const MIN_DISTANCE = 150; // Distancia mínima entre nodos
do {
  needsAdjustment = false;
  for (const node of currentNodes) {
    const dx = adjustedPosition.x - node.position.x;
    const dy = adjustedPosition.y - node.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < MIN_DISTANCE) {
      // Alejar el nodo en dirección contraria
      const angle = Math.atan2(dy, dx);
      adjustedPosition = {
        x: adjustedPosition.x + (MIN_DISTANCE - distance) * Math.cos(angle),
        y: adjustedPosition.y + (MIN_DISTANCE - distance) * Math.sin(angle)
      };
      needsAdjustment = true;
    }
  }
} while (needsAdjustment);
```

### Sistema de Persistencia

#### 1. Almacenamiento Local con LocalStorage

La persistencia se implementa utilizando localStorage a través de funciones auxiliares en `flowStore.ts`:

```tsx
// Constantes para las claves
const FLOW_STORAGE_KEY = 'flow-designer-state';
const FLOW_VIEWPORT_KEY = 'flow-designer-viewport';

// Guardar el estado del flujo
const saveToLocalStorage = (nodes: Node[], edges: Edge[]) => {
  try {
    localStorage.setItem(FLOW_STORAGE_KEY, JSON.stringify({ nodes, edges }));
  } catch (error) {
    console.error('Error saving flow to localStorage:', error);
  }
};

// Cargar el estado del flujo
const loadFromLocalStorage = (): { nodes: Node[], edges: Edge[] } | null => {
  try {
    const savedFlow = localStorage.getItem(FLOW_STORAGE_KEY);
    if (savedFlow) {
      return JSON.parse(savedFlow);
    }
  } catch (error) {
    console.error('Error loading flow from localStorage:', error);
  }
  return null;
};

// Guardar viewport (posición y zoom)
const saveViewportToLocalStorage = (viewport: { x: number, y: number, zoom: number }) => {
  try {
    localStorage.setItem(FLOW_VIEWPORT_KEY, JSON.stringify(viewport));
  } catch (error) {
    console.error('Error saving viewport to localStorage:', error);
  }
};

// Cargar viewport
const loadViewportFromLocalStorage = (): { x: number, y: number, zoom: number } | null => {
  try {
    const savedViewport = localStorage.getItem(FLOW_VIEWPORT_KEY);
    if (savedViewport) {
      return JSON.parse(savedViewport);
    }
  } catch (error) {
    console.error('Error loading viewport from localStorage:', error);
  }
  return null;
};
```

#### 2. Integración con Zustand

El estado global mediante Zustand se inicializa con los datos guardados:

```tsx
export const useFlowStore = create<FlowState>((set, get) => {
  // Cargar datos guardados al inicializar el store
  const savedFlow = loadFromLocalStorage();
  
  return {
    // Inicializar con datos guardados o valores por defecto
    nodes: savedFlow?.nodes || [],
    edges: savedFlow?.edges || [],
    // ... resto del estado
    
    // Historial precargar datos guardados
    history: savedFlow ? [{ nodes: savedFlow.nodes, edges: savedFlow.edges }] : [],
    currentHistoryIndex: savedFlow ? 0 : -1,
    
    // ... resto de métodos
  };
});
```

#### 3. Eventos de Guardado

La persistencia se activa en múltiples puntos:

- **Después de cada acción**: Cada operación CRUD llama a `saveToLocalStorage`
- **Cambios de viewport**: El zoom y posición del canvas se guardan con eventos
- **Operaciones de arrastrar y soltar**: Se persiste después de movimientos
- **Operaciones de undo/redo**: Se actualizan los datos guardados

Ejemplo en función `addNode`:
```tsx
addNode: (opts) => {
  // ... código para crear el nodo ...
  
  set((state) => {
    const updatedNodes = [...state.nodes, newNode];
    
    // Guardar en localStorage después de actualizar el estado
    saveToLocalStorage(updatedNodes, state.edges);
    
    return {
      nodes: updatedNodes,
    };
  });
  
  // También guardar al historial
  get().saveToHistory();
}
```

### Estabilidad de Posiciones

#### 1. LayoutStabilizer

El componente `LayoutStabilizer.tsx` es crucial para mantener las posiciones de los nodos estables:

```tsx
const LayoutStabilizer: React.FC = () => {
  const { getNodes, setNodes, getViewport, setViewport } = useReactFlow();
  const storeNodes = useFlowStore(state => state.nodes);
  const saveViewport = useFlowStore(state => state.saveViewport);
  const getStoredViewport = useFlowStore(state => state.getStoredViewport);
  
  // Función para estabilizar el layout
  const stabilizeLayout = useCallback(() => {
    // ... código de estabilización ...
    
    // Asegurarse que todos los nodos tienen posición absoluta
    const updatedNodes = currentNodes.map((node) => {
      return {
        ...node,
        positionAbsolute: { ...node.position },
        dragging: false,
        position: node.positionAbsolute || node.position
      };
    });
    
    setNodes(updatedNodes);
    
    // También guardar viewport
    const viewport = getViewport();
    setViewport(viewport);
    saveViewport(viewport);
  }, [getNodes, setNodes, getViewport, setViewport, saveViewport]);

  // Múltiples efectos para estabilizar en diferentes momentos
  useEffect(() => {
    // Restaurar viewport al inicio
  }, []);
  
  useEffect(() => {
    // Estabilizar cuando cambian los nodos
  }, [stabilizeLayout, storeNodes.length]);
  
  useEffect(() => {
    // Estabilizar en carga y eventos de usuario
  }, [stabilizeLayout, getViewport, setViewport, saveViewport, getStoredViewport]);

  return null; // Componente invisible
};
```

Este componente se encarga de:
1. Asegurar que `position` y `positionAbsolute` estén sincronizados
2. Restaurar viewport guardado cuando la página carga
3. Reaccionar a eventos del usuario (scroll, zoom, resize)
4. Aplicar múltiples estabilizaciones con diferentes intervalos
5. Guardar el estado después de cada cambio

#### 2. Estabilidad en ReactFlow

La inicialización del componente ReactFlow incluye configuraciones para estabilidad:

```tsx
<ReactFlow
  nodes={localNodes}
  edges={localEdges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  onInit={onInit}
  onDrop={onDrop}
  onDragOver={onDragOver}
  fitView
  minZoom={0.3}
  maxZoom={2}
  defaultEdgeOptions={{ type: 'default', animated: false }}
  fitViewOptions={{ padding: 0.2 }}
  proOptions={{ hideAttribution: true }}
  defaultViewport={{ x: 0, y: 0, zoom: 0.9 }}
  snapToGrid={true}
  snapGrid={[15, 15]}
  onMoveEnd={(_e, viewport) => {
    // Guardar viewport cuando el usuario termina de mover el canvas
    useFlowStore.getState().saveViewport(viewport);
  }}
  onNodeDragStop={(_e, node) => {
    // Guardar posición del nodo después de arrastrar
    if (node.positionAbsolute) {
      useFlowStore.getState().updateNode(node.id, {
        position: { ...node.positionAbsolute },
        positionAbsolute: { ...node.positionAbsolute }
      });
    }
  }}
/>
```

## 🔍 Principales Soluciones Técnicas

### 1. Posicionamiento de Nodos

- **Problema**: Los nodos cambiaban de posición al agregar nuevos o refrescar la página
- **Solución**: Sistema multicapa de estabilización:
  1. Persistencia en localStorage de posiciones exactas
  2. Sincronización entre `position` y `positionAbsolute`
  3. Componente `LayoutStabilizer` que aplica ajustes periódicos
  4. Preservación de viewport (zoom y posición)
  5. Algoritmo de posicionamiento inteligente con prevención de colisiones

### 2. Persistencia de Estado

- **Problema**: Pérdida de trabajo al refrescar la página
- **Solución**: Sistema de persistencia automático:
  1. Guardado en localStorage después de cada operación
  2. Restauración al inicializar el store de Zustand
  3. Persistencia separada para nodos/edges y viewport
  4. Manejo de errores para evitar problemas con localStorage

### 3. Mantenimiento de Zoom

- **Problema**: El zoom se reseteaba al agregar nodos o hacer operaciones
- **Solución**: Sistema de preservación de viewport:
  1. Almacenamiento específico para el viewport
  2. Eventos que guardan estado después de operaciones de zoom/pan
  3. Restauración explícita del mismo zoom después de operaciones
  4. Event listeners para wheel y otros eventos que cambian el zoom
  5. Sobrescritura de comportamiento por defecto de fitView

## 🔧 Guía de Implementación de Nuevos Nodos

Para crear un nuevo tipo de nodo:

1. **Crear el componente**:
```tsx
// src/components/NuevoNodo.tsx
import React from 'react';
import { Handle, Position } from 'reactflow';
import './NuevoNodo.css';

const NuevoNodo = ({ data, isConnectable }) => {
  return (
    <div className="nuevo-nodo">
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
      />
      <div className="nuevo-nodo-contenido">
        <div className="nuevo-nodo-header">{data.label}</div>
        <div className="nuevo-nodo-body">{data.subtitle}</div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={isConnectable}
      />
    </div>
  );
};

export default NuevoNodo;
```

2. **Registrarlo en FlowCanvas.tsx**:
```tsx
const nodeTypes = {
  // ... nodos existentes
  nuevoTipo: NuevoNodo,
  // ...
};
```

3. **Añadir al panel de nodos** en NodePanel.tsx:
```tsx
const nodeTypes = [
  // ... tipos existentes
  {
    type: 'nuevoTipo',
    label: 'Nuevo Tipo',
    description: 'Descripción del nuevo tipo de nodo',
    icon: <IconoPersonalizado />
  },
  // ...
];
```

4. **Agregar metadatos** en nodeTypeMeta.ts si es necesario:
```tsx
export const nodeTypeMeta = {
  // ... tipos existentes
  nuevoTipo: {
    color: '#f5a623',
    icon: 'IconoPersonalizado',
    handles: {
      source: ['bottom'],
      target: ['top']
    },
    defaultData: {
      // propiedades por defecto
    }
  },
  // ...
};
```

## 🧪 Debugging y Resolución de Problemas

### Problemas Comunes y Soluciones

1. **Nodos que se mueven inesperadamente**:
   - Verificar que `positionAbsolute` está sincronizado con `position`
   - Comprobar que se está usando `LayoutStabilizer`
   - Revisar código de `onDrop` o `addNode` para asegurar estabilidad

2. **Pérdida de datos al refrescar**:
   - Verificar que `saveToLocalStorage` se está llamando correctamente
   - Comprobar que no hay errores al parsear JSON
   - Revisar tamaño de datos (localStorage tiene límite de ~5MB)

3. **Zoom inconsistente**:
   - Usar el patrón de guardar viewport antes de operaciones y restaurarlo después
   - Evitar llamadas innecesarias a `fitView()`
   - Asegurar que `saveViewport` se llama después de cambios de zoom

## 🚀 Plan de Desarrollo y Seguimiento de Requerimientos

> **IMPORTANTE**: Este documento es la fuente de verdad del proyecto. Cualquier cambio en la estrategia o arquitectura debe ser documentado aquí para mantener la coherencia entre sesiones de desarrollo.

### 📋 Historial de Implementaciones Completadas

- [x] **Persistencia de nodos y posiciones** - *Completado: 11/07/2025*
  - Implementación de localStorage para guardar nodos y edges
  - Restauración del estado al cargar la página

- [x] **Estabilización de posiciones de nodos** - *Completado: 11/07/2025*
  - Componente LayoutStabilizer
  - Sincronización entre position y positionAbsolute

- [x] **Persistencia de viewport (zoom y posición)** - *Completado: 11/07/2025*
  - Guardado y restauración del estado de zoom
  - Prevención de reset al añadir nodos

### 📝 Requerimientos Pendientes

- [ ] **Sincronización en la nube** - *Prioridad: Alta*
  - [ ] Implementar sincronización con backend REST API
  - [ ] Sistema de versionado de flujos
  - [ ] Resolución de conflictos en edición

- [ ] **Optimización de rendimiento** - *Prioridad: Media*
  - [ ] Virtualización para grandes cantidades de nodos (>100)
  - [ ] Memoización de cálculos de layout
  - [ ] Reducción de re-renderizados innecesarios

- [ ] **Mejora de UX** - *Prioridad: Media*
  - [ ] Animaciones más fluidas en transiciones
  - [ ] Vista previa al arrastrar nodos al canvas
  - [ ] Atajos de teclado avanzados

- [ ] **Exportación avanzada** - *Prioridad: Baja*
  - [ ] Exportación a PNG con alta resolución
  - [ ] Exportación a SVG para gráficos vectoriales
  - [ ] Exportación a PDF con detalles configurables
  - [ ] Integración con herramientas externas

- [ ] **Colaboración** - *Prioridad: Baja*
  - [ ] Edición en tiempo real (WebSockets/Firebase)
  - [ ] Sistema de comentarios y anotaciones
  - [ ] Historial de cambios por usuario

### 🔄 Deuda Técnica y Problemas Conocidos

- [ ] **Optimización de guardado en localStorage** - *Prioridad: Media*
  - Problema: Guardado ineficiente que puede ralentizar la aplicación con muchos nodos
  - Solución propuesta: Throttling y compresión de datos

- [ ] **Mejora del algoritmo de posicionamiento** - *Prioridad: Baja*
  - Problema: Ocasionalmente los nodos se posicionan demasiado cerca
  - Solución propuesta: Implementar algoritmo de fuerza dirigida

### ➕ Nuevas Propuestas
> Aquí se agregarán nuevas ideas y requerimientos que surjan durante el desarrollo

- [ ] **Mejora #1** - *Prioridad: A definir*
  - Descripción: Pendiente de especificar
  - Justificación: Pendiente de especificar

---

> **Instrucciones para mantener este documento**:
> 1. Marcar tareas completadas cambiando `[ ]` a `[x]`
> 2. Agregar fecha de completación junto al título de la tarea
> 3. Mover las tareas completadas a la sección "Historial de Implementaciones"
> 4. Agregar nuevas tareas en "Nuevas Propuestas" y moverlas a "Requerimientos Pendientes" una vez aprobadas

## 📚 Recursos y Referencias

- [Documentación de ReactFlow](https://reactflow.dev/docs)
- [Zustand State Management](https://github.com/pmndrs/zustand)
- [LocalStorage API](https://developer.mozilla.org/es/docs/Web/API/Window/localStorage)
- [Posicionamiento en gráficos](https://www.d3indepth.com/layouts/)
