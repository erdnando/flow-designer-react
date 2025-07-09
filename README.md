# Flow Designer React

Esta es la versión React del Flow Designer, migrada desde Vue.js. Es un editor de flujos drag & drop similar a n8n, que permite diseñar flujos de trabajo visuales mediante nodos conectables.

## 🚀 Características Implementadas

### ✅ **Funcionalidades Base**
- ✅ Canvas de flujos con drag & drop
- ✅ Panel lateral de nodos categorizado
- ✅ Nodos personalizables (CustomNode, ConditionNode, MinimalNode)
- ✅ Panel de propiedades del nodo y del flujo
- ✅ Menú contextual con opciones de eliminar/duplicar
- ✅ Persistencia en localStorage
- ✅ Exportación/Importación JSON
- ✅ Historial de acciones (Undo/Redo)
- ✅ Atajos de teclado (Ctrl+Z, Ctrl+Y/Ctrl+Shift+Z)
- ✅ Controles personalizados en la barra de herramientas

### ✅ **Validación Avanzada**
- ✅ Panel de validación con errores/advertencias detallados
- ✅ Validación de nodos y conexiones en tiempo real
- ✅ Reglas específicas por tipo de nodo
- ✅ Navegación directa a nodos/edges con errores
- ✅ Resumen de validación con alertas expandibles
- ✅ Validación de ciclos, nodos inalcanzables y cuellos de botella
- ✅ Filtros de validación (errores/advertencias)

### ✅ **Visualización y UX Mejorada**
- ✅ Selección de nodos con efectos visuales y highlighting
- ✅ Efectos de flash y resaltado para navegación desde el panel de validación
- ✅ Edges personalizados con estilos según estado (seleccionado, error, advertencia)
- ✅ Animaciones de selección y transición suaves
- ✅ Indicadores visuales de validación en nodos y conexiones
- ✅ Botón dedicado para mostrar propiedades del flujo
- ✅ Layout responsivo con paneles colapsables

## 🧩 Componentes Principales

### FlowCanvas
El componente principal que contiene el canvas de ReactFlow donde se visualiza y edita el flujo. Gestiona los nodos, conexiones y la interacción del usuario.

### Tipos de Nodos
- **CustomNode**: Nodo estándar con icono, título y subtítulo
- **ConditionNode**: Nodo de condición con salidas true/false
- **MinimalNode**: Nodo minimalista para representaciones simples

### Paneles
- **NodePanel**: Panel lateral para arrastrar nuevos nodos al canvas
- **NodePropertiesPanel**: Panel para editar propiedades del nodo seleccionado
- **ValidationPanel**: Panel que muestra errores y advertencias del flujo

### Stores (Zustand)
- **flowStore**: Gestiona el estado de nodos, conexiones, validación e historial
- **nodeTypesStore**: Contiene los metadatos y configuración de tipos de nodos

### Componentes de Mejora UX
- **SelectionHighlight**: Proporciona efectos visuales de selección y flash
- **CustomEdge**: Conexiones personalizadas con estilos según estado
- **ValidationAlert**: Notificación flotante que muestra resumen de errores

## 🛠️ Tecnologías Utilizadas

- **React** con TypeScript
- **ReactFlow** para el canvas de flujos
- **Zustand** para la gestión de estado
- **Ant Design** para componentes UI
- **CSS Modules** para estilos

## 📝 Mejoras Recientes

### Mejora de Visualización de Selección
Hemos implementado componentes de selección mejorados que:
- Proporcionan feedback visual inmediato cuando un nodo es seleccionado
- Aplican efectos de "flash" cuando se navega a un nodo desde el panel de validación
- Destacan visualmente los nodos con errores o advertencias
- Mejoran la experiencia del usuario al interactuar con el canvas

### Validación Avanzada
- Validación específica por tipo de nodo (webhook, http, function, etc.)
- Detección de ciclos en el flujo
- Validación de conexiones redundantes
- Navegación directa a elementos con problemas

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
