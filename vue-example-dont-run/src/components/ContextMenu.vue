<template>
	<div
		v-if="visible"
		class="context-menu"
		:style="{ top: `${y}px`, left: `${x}px` }"
		@mousedown.stop
		@contextmenu.prevent
	>
		<ul>
			<li v-for="item in items" :key="item.label" @click="onItemClick(item)">
				{{ item.label }}
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount } from 'vue';

// Desestructurar props para evitar warning de variable no usada
const { visible, x, y, items } = defineProps<{
	visible: boolean;
	x: number;
	y: number;
	items: { label: string; action: () => void }[];
}>();
const emit = defineEmits(['close']);

function onItemClick(item: { label: string; action: () => void }) {
	item.action();
	emit('close');
}

function onGlobalClick() {
	emit('close');
}

onMounted(() => {
	window.addEventListener('mousedown', onGlobalClick);
});
onBeforeUnmount(() => {
	window.removeEventListener('mousedown', onGlobalClick);
});
</script>

<style scoped>
.context-menu {
	position: fixed;
	z-index: 1000;
	background: #23272e;
	color: #fff;
	border-radius: 8px;
	box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
	min-width: 160px;
	padding: 6px 0;
	border: 1.5px solid #363a40;
	user-select: none;
}
.context-menu ul {
	list-style: none;
	margin: 0;
	padding: 0;
}
.context-menu li {
	padding: 10px 18px;
	cursor: pointer;
	font-size: 1rem;
	transition: background 0.15s;
}
.context-menu li:hover {
	background: #363a40;
}
</style>
