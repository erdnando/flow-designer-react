<template>
	<div
		class="custom-node"
		tabindex="0"
		style="pointer-events: auto"
		@contextmenu="onNodeContextMenu"
	>
		<!-- Indicador de selección visible -->
		<div v-if="isNodeSelected" class="selection-indicator">
			<div :class="['selection-border', { error: hasError }]" />
		</div>
		<Handle type="target" :position="Position.Left" id="input" />
		<div class="node-content">
			<div class="node-icon">
				<!-- Icono dinámico según el tipo -->
				<span v-html="nodeIcon"></span>
				<div v-if="hasError" class="node-warning">
					<svg width="20" height="20" viewBox="0 0 20 20">
						<circle cx="10" cy="10" r="9" fill="#e14d43" stroke="#ffffff" stroke-width="1" />
						<text
							x="10"
							y="14.5"
							text-anchor="middle"
							font-size="14"
							font-weight="bold"
							fill="#fff"
						>
							!
						</text>
					</svg>
				</div>
			</div>
			<div class="node-labels">
				<div class="node-title">{{ nodeLabel }}</div>
				<div class="node-type-badge">{{ nodeType }}</div>
				<div class="node-subtitle">{{ nodeSubtitle }}</div>
			</div>
		</div>
		<Handle type="source" :position="Position.Right" id="output" />
	</div>
</template>

<script setup lang="ts">
import { Handle, Position, useNode } from '@vue-flow/core';
import { nodeTypeMeta } from '../utils/nodeTypeMeta';
import { computed, ref, watch } from 'vue';

const props = defineProps<{ data: { label?: string; type?: string; subtitle?: string } }>();
const nodeInstance = useNode ? useNode() : undefined;

// Separar las fuentes de datos para evitar ciclos reactivos
const rawData = computed(() => {
	// Combinar todas las fuentes de datos, priorizando en este orden:
	// 1. Propiedades directas del nodo (si existe nodeInstance)
	// 2. Propiedades en el objeto data del nodo (desde props.data)
	const nodeData = nodeInstance?.node?.data || {};

	return {
		// Propiedades directas del nodo (si existe)
		nodeLabel: nodeInstance?.node?.label,
		nodeType: nodeInstance?.node?.type,
		// Propiedades de data (de props)
		dataLabel: props.data?.label,
		dataType: props.data?.type,
		dataSubtitle: props.data?.subtitle,
		// Propiedades de data (del nodo, si existe)
		nodeDataLabel: nodeData.label,
		nodeDataType: nodeData.type,
		nodeDataSubtitle: nodeData.subtitle,
	};
});

// Computed properties que resuelven en cascada según prioridad
const nodeLabel = computed(
	() => rawData.value.nodeLabel || rawData.value.dataLabel || rawData.value.nodeDataLabel || 'Nodo',
);

// Para el tipo, implementamos una solución robusta que siempre refleja el tipo actual
const nodeType = computed(() => {
	// Usar el trigger para forzar reevaluación cuando cambia el tipo externamente
	const _ = forceUpdateTrigger.value;

	// LOGGING: Información completa para diagnóstico
	console.log('Recalculando tipo de nodo. Node:', nodeInstance?.node, 'Trigger:', _);

	// Prioridad 1: Tipo directo del nodo (la fuente más confiable)
	const directNodeType = nodeInstance?.node?.type;
	console.log('Tipo directo del nodo:', directNodeType);

	// Prioridad 2: Tipo almacenado en data del nodo (para nodos personalizados)
	const dataTypeFromNode = nodeInstance?.node?.data?.type;
	console.log('Tipo desde node.data:', dataTypeFromNode);

	// Prioridad 3: Tipo de las props directas (para compatibilidad)
	const dataTypeFromProps = props.data?.type;
	console.log('Tipo desde props.data:', dataTypeFromProps);

	// Elegimos el primer tipo válido siguiendo la prioridad establecida
	// Esta lógica es crucial para reflejar correctamente los cambios de tipo
	const finalType = directNodeType || dataTypeFromNode || dataTypeFromProps || 'default';
	console.log('Tipo final determinado:', finalType);

	return finalType;
});

// El icono se actualiza automáticamente cuando cambia nodeType
const nodeIcon = computed(() => {
	// FORZAR ACTUALIZACIÓN: Siempre recalcular el icono basado en el tipo actual
	// Intentar obtener el tipo más actualizado posible
	const currentType = nodeType.value;
	console.log('Actualizando ícono para tipo:', currentType);

	// Si el tipo existe en nodeTypeMeta, usar su icono
	if (nodeTypeMeta[currentType]) {
		return nodeTypeMeta[currentType].icon;
	}

	// Si no, usar el icono por defecto
	return nodeTypeMeta.default.icon;
});

const nodeSubtitle = computed(() => {
	// Para asegurar que siempre se muestre el subtítulo actualizado, damos prioridad a los datos más frescos
	// Primero verificamos si hay un subtítulo explícito en props.data (desde el panel de propiedades)
	if (props.data?.subtitle !== undefined && props.data.subtitle !== null) {
		console.log('Usando subtitle desde props.data:', props.data.subtitle);
		return props.data.subtitle;
	}

	// Si no, intentamos obtenerlo del nodo
	if (
		nodeInstance?.node?.data?.subtitle !== undefined &&
		nodeInstance.node.data.subtitle !== null
	) {
		console.log('Usando subtitle desde node.data:', nodeInstance.node.data.subtitle);
		return nodeInstance.node.data.subtitle;
	}

	// Si no hay un subtítulo explícito, usamos el predeterminado del tipo de nodo
	const defaultSubtitle = nodeTypeMeta[nodeType.value]?.subtitle || nodeTypeMeta.default.subtitle;
	console.log('Usando subtitle por defecto:', defaultSubtitle);
	return defaultSubtitle;
});

function isEmpty(val: unknown) {
	if (val === null || val === undefined) return true;
	if (typeof val === 'string') return val.trim() === '';
	return false;
}

// Agregar un indicador para forzar la actualización del componente
const forceUpdateTrigger = ref(0);

// Observar cambios en el nodo para forzar actualización
if (nodeInstance?.node) {
	// Observamos varios aspectos del nodo que podrían cambiar
	watch(
		() => [
			nodeInstance.node.type, // El tipo principal del nodo
			nodeInstance.node.data?.type, // El tipo en data (para nodos personalizados)
			nodeInstance.node.id, // El ID del nodo (para detectar nodos recreados)
			nodeInstance.node.selected, // El estado de selección (puede cambiar después de recreación)
		],
		(newVal, oldVal) => {
			console.log(
				'Detectado cambio en nodo:',
				'Tipo anterior:',
				oldVal?.[0],
				'Nuevo tipo:',
				newVal?.[0],
				'Tipo en data anterior:',
				oldVal?.[1],
				'Nuevo tipo en data:',
				newVal?.[1],
			);

			// Incrementamos el contador para forzar la reactividad
			forceUpdateTrigger.value++;
			console.log('Trigger de actualización incrementado a:', forceUpdateTrigger.value);
		},
		{ immediate: true }, // Ejecutar inmediatamente al montar el componente
	);

	// Observar explícitamente cambios en el objeto data para capturar cambios más profundos
	watch(
		() => nodeInstance.node.data,
		() => {
			console.log('Detectado cambio en data del nodo');
			forceUpdateTrigger.value++;
		},
		{ deep: true }, // Observar cambios profundos en el objeto
	);
}

// Mejora en la reactividad de la validación
const hasError = computed(() => {
	// Obtenemos los valores directamente de las fuentes más actualizadas
	const label = nodeLabel.value;
	const type = nodeType.value;

	// Verificamos el subtitle directamente desde las fuentes de datos para mayor precisión
	// Importante: NO usamos valores predeterminados de nodeTypeMeta aquí para que los nodos recién creados muestren el error
	const subtitle =
		props.data?.subtitle !== undefined
			? props.data.subtitle
			: nodeInstance?.node?.data?.subtitle !== undefined
				? nodeInstance.node.data.subtitle
				: '';

	// Log para depuración - más detallado
	console.log('Validando nodo:', {
		label,
		type,
		subtitle,
		'props.data.subtitle': props.data?.subtitle,
		'node.data.subtitle': nodeInstance?.node?.data?.subtitle,
	});

	// Comprobamos cada campo individualmente de forma estricta
	const labelEmpty = isEmpty(label);
	const typeEmpty = isEmpty(type);
	const subtitleEmpty = isEmpty(subtitle);

	console.log('¿Campos vacíos?', { labelEmpty, typeEmpty, subtitleEmpty });

	// Si alguno está vacío, mostrar error
	return labelEmpty || typeEmpty || subtitleEmpty;
});

// Propiedad computada para detectar si el nodo está seleccionado
const isNodeSelected = computed(() => nodeInstance?.node?.selected || false);

// Watcher para forzar actualización cuando cambia el estado de selección
watch(
	() => nodeInstance?.node?.selected,
	(newValue) => {
		console.log('Cambio en selección de nodo:', newValue);
		// Esto nos permitirá ver en consola cuando cambia el estado de selección
	},
);

// Función para manejar el menú contextual en el nodo
function onNodeContextMenu(event: MouseEvent) {
	// Evitar el menú contextual del navegador pero mantener el bubbling
	event.preventDefault();
}
</script>

<style scoped>
.custom-node {
	background: #23272e !important;
	color: #fff;
	border-radius: 14px;
	padding: 16px 32px 16px 20px;
	min-width: 200px;
	min-height: 64px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	position: relative;
	font-size: 1rem;
	z-index: 1;
	box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.22) inset;
	border: 2.5px solid transparent; /* Cambiado de #23272e a transparente */
	transition:
		box-shadow 0.2s,
		border 0.2s;
	background-clip: padding-box;
	background-image: none !important;
	width: auto;
	height: auto;
}
.node-content {
	display: flex;
	align-items: center;
	gap: 16px;
	width: 100%;
}
.node-icon {
	width: 38px;
	height: 38px;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #23272e;
	border-radius: 10px;
	margin-right: 10px;
	position: relative;
}
.node-warning {
	position: absolute;
	right: -10px;
	bottom: -10px;
	background: transparent;
	border-radius: 50%;
	box-shadow: 0 1px 4px rgba(225, 77, 67, 0.18);
}
.node-labels {
	display: flex;
	flex-direction: column;
	justify-content: center;
}
.node-title {
	font-weight: 700;
	font-size: 1.18rem;
	color: #fff;
	letter-spacing: 0.01em;
	line-height: 1.2;
	margin-bottom: 2px;
}
.node-subtitle {
	font-size: 0.92rem;
	color: #b0b0b0;
	font-weight: 500;
	letter-spacing: 0.01em;
	line-height: 1.1;
}
.node-type-badge {
	display: inline-block;
	background: #363a40;
	color: #ffb84d;
	font-size: 0.85rem;
	font-weight: 600;
	border-radius: 6px;
	padding: 2px 8px;
	margin: 2px 0 4px 0;
	letter-spacing: 0.02em;
	box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
	max-width: fit-content;
	transition: all 0.3s ease;
	animation: type-badge-flash 1.5s 1;
}

/* Indicador explícito de selección */
.selection-indicator {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	pointer-events: none;
	z-index: 1000;
}

.selection-border {
	position: absolute;
	top: -3px;
	left: -3px;
	width: calc(100% + 6px);
	height: calc(100% + 6px);
	border: 1.77px solid #97fdff;
	border-radius: 10.45px;
	box-shadow:
		0 0 0 1.11px #fff,
		0 0 9.98px 2.22px #97fdff45,
		0 0 11.1px 3.5px #97fdff13;
	animation: selection-flash 1.2s infinite alternate;
	z-index: 1000;
}
.selection-border.error {
	border: 1.77px solid #ff4d4f;
	box-shadow:
		0 0 0 1.11px #fff,
		0 0 9.98px 2.22px #ff4d4f45,
		0 0 11.1px 3.5px #ff4d4f13;
	animation: selection-flash-error 1.2s infinite alternate;
}
@keyframes selection-flash-error {
	0% {
		border-color: #ff4d4f;
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 6.75px 1.11px #ff4d4f34,
			0 0 10.1px 3.5px #ff4d4f0f;
	}
	100% {
		border-color: #ff4d4f;
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 15.77px 3.5px #ff4d4f8a,
			0 0 26.9px 7px #ff4d4f40;
	}
}

/* Handlers grandes y visibles como en el nodo IF */
:deep(.vue-flow__handle) {
	width: 18px !important;
	height: 18px !important;
	border: 2.5px solid #fff !important;
	background: #222 !important;
	z-index: 10 !important;
	border-radius: 50%;
}

/* Borde resaltado para el nodo seleccionado - EFECTO EXTREMO */
:deep(.vue-flow__node.selected) .custom-node {
	border-color: #1faaff !important;
	border-width: 3px !important;
	outline: 4px solid #1faaff !important;
	outline-offset: 2px !important;
	box-shadow:
		0 0 0 8px #1faaff66,
		0 0 25px 5px #1faaff77,
		0 2px 12px 0 rgba(0, 0, 0, 0.5);
	background-color: #2b3038 !important;
	transform: scale(1.03);
	animation: node-pulse 2s infinite alternate;
	transition:
		border-color 0.15s,
		box-shadow 0.15s,
		outline 0.15s,
		background-color 0.15s,
		transform 0.15s;
}

@keyframes node-pulse {
	0% {
		box-shadow:
			0 0 0 4px #1faaff77,
			0 0 15px 2px #1faaff77,
			0 2px 12px 0 rgba(0, 0, 0, 0.5);
	}
	100% {
		box-shadow:
			0 0 0 8px #1faaff55,
			0 0 25px 5px #1faaff88,
			0 2px 12px 0 rgba(0, 0, 0, 0.5);
	}
}

.node-warning {
	position: absolute;
	top: -6px;
	right: -6px;
	z-index: 100;
	filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.5));
	animation: pulse 1.5s infinite;
	pointer-events: none;
}

@keyframes pulse {
	0% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.1);
	}
	100% {
		transform: scale(1);
	}
}

@keyframes flash {
	0% {
		background-color: #363a40;
	}
	25% {
		background-color: #e14d43;
		color: white;
	}
	75% {
		background-color: #e14d43;
		color: white;
	}
	100% {
		background-color: #363a40;
	}
}

@keyframes type-badge-flash {
	0% {
		background-color: #363a40;
		transform: scale(1);
	}
	20% {
		background-color: #e9a946;
		color: #23272e;
		transform: scale(1.1);
	}
	40% {
		background-color: #ffb84d;
		color: #23272e;
		transform: scale(1.1);
	}
	80% {
		background-color: #e9a946;
		color: #23272e;
		transform: scale(1.05);
	}
	100% {
		background-color: #363a40;
		transform: scale(1);
	}
}
</style>
