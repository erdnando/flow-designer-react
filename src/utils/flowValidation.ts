import type { Node, Edge } from 'reactflow';

export interface ValidationError {
  id: string;
  type: 'node' | 'edge';
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Validates a single node
 */
export const validateNode = (node: Node): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Check if node has a label
  if (!node.data?.label || typeof node.data.label !== 'string' || node.data.label.trim() === '') {
    errors.push({
      id: node.id,
      type: 'node',
      message: 'El nodo debe tener un nombre válido',
      severity: 'error'
    });
  }
  
  // Validate max label length
  if (node.data?.label && typeof node.data.label === 'string' && node.data.label.length > 50) {
    errors.push({
      id: node.id,
      type: 'node',
      message: 'El nombre del nodo es demasiado largo (máximo 50 caracteres)',
      severity: 'warning'
    });
  } else if (node.data?.label && typeof node.data.label === 'string' && node.data.label.length < 3) {
    // Validate minimum label length
    errors.push({
      id: node.id,
      type: 'node',
      message: 'El nombre del nodo es demasiado corto (mínimo 3 caracteres)',
      severity: 'warning'
    });
  }

  // Check if node has proper type metadata
  if (!node.type || node.type === 'default') {
    errors.push({
      id: node.id,
      type: 'node',
      message: 'El nodo no tiene un tipo definido',
      severity: 'warning'
    });
  }

  // Validate position within reasonable bounds (prevent nodes from going too far off-screen)
  const maxCoord = 10000; // Arbitrary large number to detect possible errors
  if (node.position.x > maxCoord || node.position.y > maxCoord || 
      node.position.x < -maxCoord || node.position.y < -maxCoord) {
    errors.push({
      id: node.id,
      type: 'node',
      message: 'El nodo está fuera de los límites razonables del canvas',
      severity: 'warning'
    });
  }
  
  // Validate specific node types
  switch (node.type) {
    case 'webhook':
      // Add webhook-specific validations
      if (!node.data?.endpoint) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El webhook debe tener un endpoint',
          severity: 'error'
        });
      } else if (typeof node.data.endpoint === 'string') {
        // Validate webhook endpoint format (basic URL validation)
        if (!node.data.endpoint.startsWith('/') && !node.data.endpoint.startsWith('http')) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El endpoint debe comenzar con / o ser una URL válida',
            severity: 'warning'
          });
        }
        
        // Check for webhook method
        if (!node.data.method) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El webhook debe tener un método HTTP definido',
            severity: 'warning'
          });
        }
      }
      break;
      
    case 'http':
      // Add HTTP-specific validations
      if (!node.data?.url) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El nodo HTTP debe tener una URL',
          severity: 'error'
        });
      } else if (typeof node.data.url === 'string') {
        // Validate URL format
        try {
          new URL(node.data.url);
        } catch {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'La URL no tiene un formato válido',
            severity: 'error'
          });
        }
        
        // Check for HTTP method
        if (!node.data.method) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El nodo HTTP debe tener un método definido',
            severity: 'warning'
          });
        } else if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(node.data.method)) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El método HTTP no es válido',
            severity: 'warning'
          });
        }
      }
      break;
      
    case 'condition':
    case 'if':
      // Add condition-specific validations
      if (!node.data?.condition) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El nodo de condición debe tener una expresión',
          severity: 'error'
        });
      } else if (typeof node.data.condition === 'string') {
        // Basic condition syntax validation (very basic check)
        if (node.data.condition.length < 3) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'La condición es demasiado corta para ser válida',
            severity: 'warning'
          });
        }
        
        // Check for balanced parentheses
        const openParens = (node.data.condition.match(/\(/g) || []).length;
        const closeParens = (node.data.condition.match(/\)/g) || []).length;
        if (openParens !== closeParens) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'La condición tiene paréntesis no balanceados',
            severity: 'error'
          });
        }
      }
      break;
      
    case 'function':
      // Add function-specific validations
      if (!node.data?.code) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El nodo de función debe tener código',
          severity: 'error'
        });
      } else if (typeof node.data.code === 'string') {
        // Check for potential syntax errors (basic checks)
        const code = node.data.code;
        
        // Check for balanced braces
        const openBraces = (code.match(/\{/g) || []).length;
        const closeBraces = (code.match(/\}/g) || []).length;
        if (openBraces !== closeBraces) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El código tiene llaves no balanceadas',
            severity: 'error'
          });
        }
        
        // Function should define or return something
        if (!code.includes('return ') && !code.includes('=>')) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'La función debería devolver algún valor',
            severity: 'warning'
          });
        }
      }
      break;
      
    case 'delay':
      // Add delay-specific validations
      if (!node.data?.delay) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El nodo de delay debe especificar un tiempo',
          severity: 'error'
        });
      } else {
        // Validate delay value
        const delayValue = parseInt(node.data.delay);
        if (isNaN(delayValue) || delayValue <= 0) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El valor del delay debe ser un número positivo',
            severity: 'error'
          });
        } else if (delayValue > 3600000) { // More than 1 hour
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El delay es muy grande (>1 hora), puede afectar el rendimiento',
            severity: 'warning'
          });
        }
      }
      break;
      
    case 'set':
      // Add set-specific validations
      if (!node.data?.variables || !Array.isArray(node.data.variables) || node.data.variables.length === 0) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El nodo "set" debe tener al menos una variable definida',
          severity: 'error'
        });
      } else {
        // Check each variable has name and value
        const invalidVars = node.data.variables.filter((v: { name?: string, value?: unknown }) => !v.name || v.value === undefined);
        if (invalidVars.length > 0) {
          errors.push({
            id: node.id,
            type: 'node',
            message: `${invalidVars.length} variable(s) no tienen nombre o valor`,
            severity: 'error'
          });
        }
      }
      break;
      
    case 'gmail':
      // Add gmail-specific validations
      if (!node.data?.recipient) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El nodo de Gmail debe tener un destinatario',
          severity: 'error'
        });
      } else if (typeof node.data.recipient === 'string') {
        // Basic email validation
        const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!emailPattern.test(node.data.recipient)) {
          errors.push({
            id: node.id,
            type: 'node',
            message: 'El formato del correo electrónico no es válido',
            severity: 'error'
          });
        }
      }
      
      if (!node.data?.subject) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El correo debe tener un asunto',
          severity: 'warning'
        });
      }
      
      if (!node.data?.body) {
        errors.push({
          id: node.id,
          type: 'node',
          message: 'El correo debe tener un cuerpo de mensaje',
          severity: 'warning'
        });
      }
      break;
      
    case 'merge':
      // Add merge-specific validations
      // For merge nodes, check if they have enough incoming connections
      // This is handled at the flow level, but we can add node-specific checks here
      break;
  }
  
  return errors;
};

/**
 * Validates a single edge
 */
export const validateEdge = (edge: Edge, nodes: Node[], allEdges: Edge[] = []): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Check if source and target nodes exist
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  
  if (!sourceNode) {
    errors.push({
      id: edge.id,
      type: 'edge',
      message: `La conexión hace referencia a un nodo origen que no existe (${edge.source})`,
      severity: 'error'
    });
  }
  
  if (!targetNode) {
    errors.push({
      id: edge.id,
      type: 'edge',
      message: `La conexión hace referencia a un nodo destino que no existe (${edge.target})`,
      severity: 'error'
    });
  }
  
  // Skip further validation if nodes don't exist
  if (!sourceNode || !targetNode) {
    return errors;
  }
  
  // Prevent self-connections
  if (edge.source === edge.target) {
    errors.push({
      id: edge.id,
      type: 'edge',
      message: 'Un nodo no puede conectarse a sí mismo',
      severity: 'error'
    });
  }

  // Check for redundant connections between the same nodes
  const parallelEdges = allEdges.filter((e: Edge) => 
    e.id !== edge.id && 
    e.source === edge.source && 
    e.target === edge.target &&
    e.sourceHandle === edge.sourceHandle &&
    e.targetHandle === edge.targetHandle
  );
  
  if (parallelEdges.length > 0) {
    errors.push({
      id: edge.id,
      type: 'edge',
      message: 'Conexión redundante entre los mismos nodos',
      severity: 'warning'
    });
  }
  
  // Validate condition node connections
  if (sourceNode.type === 'condition' || sourceNode.type === 'if') {
    // Check if condition node has both true and false outputs connected
    const trueEdges = allEdges.filter(e => 
      e.source === sourceNode.id && e.sourceHandle === 'outputTrue'
    );
    
    const falseEdges = allEdges.filter(e => 
      e.source === sourceNode.id && e.sourceHandle === 'outputFalse'
    );
    
    if (trueEdges.length === 0) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: `El nodo de condición "${sourceNode.data?.label}" no tiene salida para TRUE`,
        severity: 'warning'
      });
    }
    
    if (falseEdges.length === 0) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: `El nodo de condición "${sourceNode.data?.label}" no tiene salida para FALSE`,
        severity: 'warning'
      });
    }
  }
  
  // Validate node type compatibility for connections
  // These are just examples and can be extended based on domain-specific rules
  if (sourceNode.type === 'webhook') {
    // Webhooks should only be source nodes
    const isTargetOfSomeEdge = allEdges.some(e => e.target === sourceNode.id);
    if (isTargetOfSomeEdge) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: 'Los nodos webhook solo deberían ser puntos de entrada',
        severity: 'warning'
      });
    }
  }
  
  if (targetNode.type === 'merge') {
    // Merge nodes should have at least 2 incoming connections
    const incomingCount = allEdges.filter(e => e.target === targetNode.id).length;
    if (incomingCount < 2) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: 'Los nodos merge deberían tener al menos 2 conexiones entrantes',
        severity: 'warning'
      });
    }
  }
  
  // Check for connection limits
  const sourceOutgoingCount = allEdges.filter(e => e.source === sourceNode.id).length;
  
  // Connection limit validation based on node types
  switch (sourceNode.type) {
    case 'webhook':
    case 'http':
    case 'function':
    case 'delay':
    case 'set':
    case 'gmail':
      // These nodes should typically have only one outgoing connection
      if (sourceOutgoingCount > 1) {
        errors.push({
          id: edge.id,
          type: 'edge',
          message: `El nodo "${sourceNode.data?.label}" tiene más de una conexión saliente`,
          severity: 'warning'
        });
      }
      break;
      
    case 'condition':
    case 'if':
      // Condition nodes should have exactly two outgoing connections (true and false)
      if (sourceOutgoingCount > 2) {
        errors.push({
          id: edge.id,
          type: 'edge',
          message: `El nodo de condición "${sourceNode.data?.label}" tiene más de dos salidas`,
          severity: 'error'
        });
      }
      break;
  }
  
  // Check for terminal nodes (nodes that should be endpoints)
  if (targetNode.type === 'gmail' && edge.target !== targetNode.id) {
    const targetOutgoingCount = allEdges.filter(e => e.source === targetNode.id).length;
    if (targetOutgoingCount > 0) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: 'Los nodos de Gmail deberían ser puntos finales en el flujo',
        severity: 'warning'
      });
    }
  }
  
  return errors;
};

/**
 * Validates the entire flow
 */
export const validateFlow = (nodes: Node[], edges: Edge[]): ValidationError[] => {
  let errors: ValidationError[] = [];
  
  // Validate individual nodes
  nodes.forEach(node => {
    errors = [...errors, ...validateNode(node)];
  });
  
  // Validate individual edges
  edges.forEach(edge => {
    errors = [...errors, ...validateEdge(edge, nodes, edges)];
  });
  
  // Validate flow-level issues
  
  // Check for orphaned nodes (no incoming or outgoing edges)
  nodes.forEach(node => {
    const hasConnections = edges.some(e => e.source === node.id || e.target === node.id);
    if (!hasConnections) {
      if (node.type !== 'webhook') { // Webhooks can be entry points
        errors.push({
          id: node.id,
          type: 'node',
          message: 'Nodo sin conexiones',
          severity: 'warning'
        });
      }
    }
  });
  
  // Check for cycles in the flow
  const hasCycle = detectCycles(nodes, edges);
  if (hasCycle) {
    errors.push({
      id: 'flow',
      type: 'node',
      message: 'El flujo contiene ciclos. Esto puede causar ejecuciones infinitas.',
      severity: 'warning'
    });
  }
  
  // Check for multiple entry points (more than one webhook or entry point)
  const entryPoints = nodes.filter(node => node.type === 'webhook');
  if (entryPoints.length > 1) {
    errors.push({
      id: 'flow',
      type: 'node',
      message: 'El flujo tiene múltiples puntos de entrada (webhooks)',
      severity: 'warning'
    });
  } else if (entryPoints.length === 0) {
    errors.push({
      id: 'flow',
      type: 'node',
      message: 'El flujo no tiene ningún punto de entrada definido',
      severity: 'warning'
    });
  }
  
  // Check for terminal nodes with no outgoing connections
  const terminalNodes = nodes.filter(node => {
    return !edges.some(edge => edge.source === node.id);
  });
  
  // Ensure there's at least one terminal node
  if (terminalNodes.length === 0 && nodes.length > 0) {
    errors.push({
      id: 'flow',
      type: 'node',
      message: 'El flujo no tiene nodos terminales (con salida)',
      severity: 'warning'
    });
  }
  
  // Check for unreachable nodes (no path from entry points)
  const entryNodeIds = entryPoints.map(node => node.id);
  const reachableNodeIds = new Set<string>(entryNodeIds);
  
  // Recursively find all reachable nodes from entry points
  const findReachableNodes = (nodeIds: string[]) => {
    const newReachableNodes: string[] = [];
    
    nodeIds.forEach(nodeId => {
      edges.forEach(edge => {
        if (edge.source === nodeId && !reachableNodeIds.has(edge.target)) {
          reachableNodeIds.add(edge.target);
          newReachableNodes.push(edge.target);
        }
      });
    });
    
    if (newReachableNodes.length > 0) {
      findReachableNodes(newReachableNodes);
    }
  };
  
  findReachableNodes(entryNodeIds);
  
  // Find unreachable nodes
  const unreachableNodes = nodes.filter(node => 
    !reachableNodeIds.has(node.id) && node.type !== 'webhook'
  );
  
  unreachableNodes.forEach(node => {
    errors.push({
      id: node.id,
      type: 'node',
      message: 'Nodo inalcanzable desde ningún punto de entrada',
      severity: 'error'
    });
  });
  
  // Check for potential bottlenecks (nodes with too many incoming connections)
  const BOTTLENECK_THRESHOLD = 5; // Arbitrary threshold
  nodes.forEach(node => {
    const incomingCount = edges.filter(e => e.target === node.id).length;
    if (incomingCount > BOTTLENECK_THRESHOLD && node.type !== 'merge') {
      errors.push({
        id: node.id,
        type: 'node',
        message: `Posible cuello de botella: ${incomingCount} conexiones entrantes`,
        severity: 'warning'
      });
    }
  });
  
  // Check for consistent naming conventions
  const nodeLabels = nodes.map(node => node.data?.label).filter(Boolean) as string[];
  if (nodeLabels.length >= 3) { // Only check if we have enough nodes to establish a pattern
    const camelCaseCount = nodeLabels.filter(label => /^[a-z][a-zA-Z0-9]*$/.test(label)).length;
    const snakeCaseCount = nodeLabels.filter(label => /^[a-z][a-z0-9_]*$/.test(label)).length;
    const pascalCaseCount = nodeLabels.filter(label => /^[A-Z][a-zA-Z0-9]*$/.test(label)).length;
    
    const totalNodes = nodeLabels.length;
    const dominantStyle = Math.max(camelCaseCount, snakeCaseCount, pascalCaseCount);
    
    if (dominantStyle < totalNodes * 0.7 && dominantStyle > 0) {
      // If less than 70% of nodes follow the dominant naming style
      errors.push({
        id: 'flow',
        type: 'node',
        message: 'Inconsistencia en el estilo de nombres de los nodos',
        severity: 'warning'
      });
    }
  }
  
  return errors;
};

/**
 * Checks if a flow is valid (has no errors)
 */
/**
 * Detects cycles in the flow graph using a modified DFS algorithm
 */
export const detectCycles = (nodes: Node[], edges: Edge[]): boolean => {
  // Create an adjacency list representation of the graph
  const graph: Record<string, string[]> = {};
  nodes.forEach(node => {
    graph[node.id] = [];
  });

  edges.forEach(edge => {
    if (graph[edge.source]) {
      graph[edge.source].push(edge.target);
    }
  });

  // DFS to detect cycles
  const visited: Record<string, boolean> = {};
  const inStack: Record<string, boolean> = {};

  const hasCycle = (nodeId: string): boolean => {
    // If node is already in the stack, we found a cycle
    if (inStack[nodeId]) {
      return true;
    }

    // If node is already visited and not in the stack, no cycle found through this path
    if (visited[nodeId]) {
      return false;
    }

    // Mark the node as visited and add to stack
    visited[nodeId] = true;
    inStack[nodeId] = true;

    // Visit all neighbors
    for (const neighbor of graph[nodeId] || []) {
      if (hasCycle(neighbor)) {
        return true;
      }
    }

    // Remove the node from stack after visiting all neighbors
    inStack[nodeId] = false;
    return false;
  };

  // Check for cycles starting from each node
  for (const nodeId in graph) {
    if (!visited[nodeId] && hasCycle(nodeId)) {
      return true;
    }
  }

  return false;
};

export const isFlowValid = (nodes: Node[], edges: Edge[]): boolean => {
  const errors = validateFlow(nodes, edges);
  return !errors.some(err => err.severity === 'error');
};
