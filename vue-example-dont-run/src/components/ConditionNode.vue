<template>
	<div class="condition-node">
		<!-- Handler de entrada en el vértice izquierdo -->
		<Handle type="target" :position="Position.Left" id="input" class="handle handle-left" />
		<!-- Handler de salida true en el vértice derecho -->
		<Handle type="source" :position="Position.Right" id="outputTrue" class="handle handle-right" />
		<!-- Handler de salida false en el vértice inferior -->
		<Handle
			type="source"
			:position="Position.Bottom"
			id="outputFalse"
			class="handle handle-bottom"
		/>
		<!-- Indicador de selección visible -->
		<div v-if="isSelected" class="selection-indicator">
			<div :class="['selection-border', { error: hasError }]" />
		</div>
		<div class="diamond">
			<span class="label">{{ data.label || 'Condición\n(If)' }}</span>
		</div>
		<div class="label-true">true</div>
		<div class="label-false">false</div>
	</div>
</template>

<script setup lang="ts">
import { Handle, Position, useNode } from '@vue-flow/core';
import { computed } from 'vue';

const props = defineProps<{ data: { label?: string } }>();
const data = props.data || {};
const nodeInstance = useNode ? useNode() : undefined;

// Verificar si el nodo está seleccionado
const isSelected = computed(() => nodeInstance?.node?.selected || false);
const hasError = computed(() => typeof data.label !== 'string' || !data.label.trim());
</script>

<style scoped>
.condition-node {
	position: relative;
	width: 120px;
	height: 120px;
	display: flex;
	align-items: center;
	justify-content: center;
}
/* Borde ULTRA resaltado y efecto especial para el nodo seleccionado */
:deep(.vue-flow__node.selected) .diamond {
	border-color: #fff !important;
	border-width: 4px !important;
	box-shadow:
		0 0 0 6px #1faaff99,
		0 0 0 12px #fff,
		0 0 30px 10px #1faaffaa,
		0 2px 16px 0 #1faaff88,
		0 4px 32px 0 #1faaff44;
	outline: 5px solid #1faaff !important;
	outline-offset: 2px !important;
	background: linear-gradient(135deg, #2a2f36 50%, #1faaff44 100%) !important;
	animation: diamond-glow 2s infinite alternate;
	transform: rotate(45deg) scale(1.1);
	transition:
		border-color 0.15s,
		box-shadow 0.15s,
		outline 0.15s,
		background 0.15s,
		transform 0.15s;
	z-index: 20;
}
@keyframes diamond-glow {
	0% {
		box-shadow:
			0 0 0 6px #1faaff99,
			0 0 0 12px #fff,
			0 0 20px 5px #1faaffaa,
			0 2px 16px 0 #1faaff88,
			0 4px 32px 0 #1faaff44;
	}
	100% {
		box-shadow:
			0 0 0 10px #1faaffcc,
			0 0 0 18px #fff,
			0 0 40px 15px #1faaffcc,
			0 2px 32px 0 #1faaffcc,
			0 8px 48px 0 #1faaff66;
	}
}
.diamond {
	width: 90px;
	height: 90px;
	background: #111;
	border: 2.5px solid transparent; /* Cambiado de #fff a transparente */
	transform: rotate(45deg);
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.22);
	z-index: 2;
	border-radius: 10px; /* Esquinas redondeadas para el diamante */
}
.label {
	color: #fff;
	font-weight: 600;
	font-size: 1.1rem;
	transform: rotate(-45deg);
	user-select: none;
	text-shadow: 0 1px 2px #000;
	white-space: pre-line;
}
.label-true {
	position: absolute;
	right: -60px; /* antes -38px, ahora más a la derecha */
	top: 50%;
	transform: translateY(-50%);
	font-size: 0.95rem;
	font-weight: 600;
	color: #fff;
	background: rgba(30, 30, 30, 0.85);
	padding: 2px 8px;
	border-radius: 6px;
	pointer-events: none;
	z-index: 3;
	text-shadow: 0 1px 2px #000;
}
.label-false {
	position: absolute;
	left: 50%;
	bottom: -40px; /* antes -28px, ahora más abajo */
	transform: translateX(-50%);
	font-size: 0.95rem;
	font-weight: 600;
	color: #fff;
	background: rgba(30, 30, 30, 0.85);
	padding: 2px 8px;
	border-radius: 6px;
	pointer-events: none;
	z-index: 3;
	text-shadow: 0 1px 2px #000;
}
.handle {
	width: 18px !important;
	height: 18px !important;
	border: 2.5px solid #fff !important;
	background: #222 !important;
	z-index: 10 !important;
	border-radius: 50%;
}
.handle-left {
	position: absolute !important;
	left: 0%;
	top: 50%;
	transform: translate(-50%, -50%);
}
.handle-right {
	position: absolute !important;
	right: 0%;
	top: 50%;
	transform: translate(50%, -50%);
}
.handle-bottom {
	position: absolute !important;
	left: 50%;
	bottom: 0%;
	transform: translate(-50%, 50%);
}
/* Indicador explícito de selección */
.selection-indicator {
	position: absolute;
	width: 120px;
	height: 120px;
	pointer-events: none;
	z-index: 1000;
}

.selection-border {
	position: absolute;
	top: -3px;
	left: -3px;
	width: 125.3px;
	height: 125.3px;
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
@keyframes selection-flash {
	0% {
		border-color: #97fdff;
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 6.75px 1.11px #97fdff34,
			0 0 10.1px 3.5px #97fdff0f;
	}
	100% {
		border-color: #97fdff;
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 15.77px 3.5px #97fdff8a,
			0 0 26.9px 7px #97fdff40;
	}
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
</style>
