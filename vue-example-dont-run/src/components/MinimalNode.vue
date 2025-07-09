<template>
	<div :class="['minimal-node', { error: hasError, selected: isSelected }]" @contextmenu.prevent>
		{{ nodeLabel }}
	</div>
</template>

<script setup lang="ts">
import { useNode } from '@vue-flow/core';
import { computed } from 'vue';
const props = defineProps<{ data: { label?: string } }>();
const { data } = props;
const node = useNode ? useNode() : undefined;
const nodeLabel = data.label ?? node?.node?.label ?? 'Nodo';
const isSelected = computed(() => node?.node?.selected ?? false);
const hasError = computed(() => (typeof nodeLabel === 'string' ? !nodeLabel.trim() : true));
</script>

<style scoped>
.minimal-node {
	background: #23272e;
	color: #fff;
	border-radius: 14px;
	padding: 16px 32px 16px 20px;
	min-width: 200px;
	min-height: 64px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.1rem;
	border: 2.5px solid #23272e;
	box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.22) inset;
	transition:
		border-color 0.15s,
		box-shadow 0.15s,
		outline 0.15s,
		background-color 0.15s,
		transform 0.15s;
}
.minimal-node.selected {
	border: 1.77px solid #97fdff !important;
	outline: 2.77px solid #97fdff !important;
	outline-offset: 2px !important;
	box-shadow:
		0 0 0 1.11px #fff,
		0 0 9.98px 2.22px #97fdff45,
		0 0 11.1px 3.5px #97fdff13;
	background-color: #2b3038 !important;
	transform: scale(1.03);
	animation: minimal-node-pulse 1.2s infinite alternate;
}
.minimal-node.selected.error {
	border: 1.77px solid #ff4d4f !important;
	outline: 2.77px solid #ff4d4f !important;
	box-shadow:
		0 0 0 1.11px #fff,
		0 0 9.98px 2.22px #ff4d4f45,
		0 0 11.1px 3.5px #ff4d4f13;
	animation: minimal-node-pulse-error 1.2s infinite alternate;
}
@keyframes minimal-node-pulse {
	0% {
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 6.75px 1.11px #97fdff34,
			0 0 10.1px 3.5px #97fdff0f;
	}
	100% {
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 15.77px 3.5px #97fdff8a,
			0 0 26.9px 7px #97fdff40;
	}
}
@keyframes minimal-node-pulse-error {
	0% {
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 6.75px 1.11px #ff4d4f34,
			0 0 10.1px 3.5px #ff4d4f0f;
	}
	100% {
		box-shadow:
			0 0 0 1.11px #fff,
			0 0 15.77px 3.5px #ff4d4f8a,
			0 0 26.9px 7px #ff4d4f40;
	}
}
</style>
