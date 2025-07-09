<template>
	<div class="node-panel" :class="{ collapsed }">
		<div v-if="collapsed" class="collapsed-top">
			<button class="collapse-btn" @click.stop="toggle">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
					<g>
						<path
							d="M10.5 7L14.5 12L10.5 17"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M7 7L11 12L7 17"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</g>
				</svg>
			</button>
		</div>
		<div v-else class="panel-header" @click="toggle">
			<span>Nodos</span>
			<button class="collapse-btn">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none">
					<g>
						<path
							d="M13.5 7L9.5 12L13.5 17"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
						<path
							d="M17 7L13 12L17 17"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</g>
				</svg>
			</button>
		</div>
		<div v-if="!collapsed" class="panel-content">
			<input v-model="search" class="search" placeholder="Buscar nodo..." />
			<button class="add-node-type-btn" @click="openCreateModal">+ Tipo de nodo</button>
			<div class="category-list">
				<div v-for="cat in filteredCategories" :key="cat.name" class="category-block">
					<div class="category-title">{{ cat.name }}</div>
					<ul class="node-list">
						<li
							v-for="node in cat.nodes"
							:key="node.type"
							class="node-item"
							draggable="true"
							@dragstart="onDragStart(node, $event)"
						>
							<!-- Type guard para nodos personalizados -->
							<span
								class="node-icon"
								v-if="'icon' in node && 'color' in node"
								:style="{ color: node.color }"
								>{{ node.icon }}</span
							>
							<span
								class="node-icon"
								v-else
								v-html="nodeTypeMeta[node.type]?.icon || nodeTypeMeta.default.icon"
							></span>
							<span>{{ node.label }}</span>
							<template v-if="'icon' in node && 'color' in node">
								<button class="edit-btn" @click.stop="openEditModal(node.type)">✏️</button>
								<button class="delete-btn" @click.stop="removeNodeType(node.type)">🗑️</button>
							</template>
						</li>
					</ul>
				</div>
			</div>
		</div>
		<CustomNodeTypeModal
			:visible="showModal"
			:editId="editNodeType"
			:nodeType="
				editNodeType ? nodeTypesStore.customNodeTypes.find((n) => n.id === editNodeType) : undefined
			"
			@close="closeModal"
			@save="saveNodeType"
		/>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { nodeTypeMeta } from '../utils/nodeTypeMeta';
import { useNodeTypesStore } from '../stores/nodeTypes';
import CustomNodeTypeModal from './CustomNodeTypeModal.vue';

const collapsed = ref(false);
const search = ref('');

// CRUD node types store
const nodeTypesStore = useNodeTypesStore();
const showModal = ref(false);
const editNodeType = ref(null as null | string);

function openCreateModal() {
	editNodeType.value = null;
	showModal.value = true;
}
function openEditModal(id: string) {
	editNodeType.value = id;
	showModal.value = true;
}
function closeModal() {
	showModal.value = false;
}
function saveNodeType(node: any) {
	if (node.id) nodeTypesStore.updateNodeType(node.id, node);
	else nodeTypesStore.addNodeType(node);
	showModal.value = false;
}
function removeNodeType(id: string) {
	if (confirm('¿Eliminar este tipo de nodo?')) nodeTypesStore.removeNodeType(id);
}

// Estructura de categorías (estática + custom)
const nodeCategories = computed(() => [
	{
		name: 'Entrada',
		nodes: [
			{ type: 'webhook', label: 'Webhook' },
			{ type: 'http', label: 'HTTP Request' },
		],
	},
	{
		name: 'Mensajería',
		nodes: [{ type: 'gmail', label: 'Gmail' }],
	},
	{
		name: 'Lógica',
		nodes: [
			{ type: 'condition', label: 'Condición (If)' }, // Diamond node
			{ type: 'merge', label: 'Merge' },
			{ type: 'delay', label: 'Delay' },
		],
	},
	{
		name: 'Utilidad',
		nodes: [
			{ type: 'set', label: 'Set' },
			{ type: 'function', label: 'Function' },
		],
	},
	{
		name: 'Personalizados',
		nodes: nodeTypesStore.customNodeTypes.map((n) => ({
			type: n.id,
			label: n.name,
			icon: n.icon,
			color: n.color,
			description: n.description,
			_custom: true,
		})),
	},
]);

const filteredCategories = computed(() => {
	if (!search.value) return nodeCategories.value;
	return nodeCategories.value
		.map((cat) => ({
			...cat,
			nodes: cat.nodes.filter((n) => n.label.toLowerCase().includes(search.value.toLowerCase())),
		}))
		.filter((cat) => cat.nodes.length > 0);
});

function toggle() {
	collapsed.value = !collapsed.value;
}

function onDragStart(
	node: {
		type: string;
		label: string;
		_custom?: boolean;
		icon?: string;
		color?: string;
		description?: string;
	},
	e: DragEvent,
) {
	e.dataTransfer?.setData('application/node-type', node.type);
	e.dataTransfer?.setData('text/plain', node.label);
	if (node._custom) {
		// Buscar el tipo personalizado completo
		const customType = nodeTypesStore.customNodeTypes.find((n) => n.id === node.type);
		if (customType) {
			e.dataTransfer?.setData('application/custom-node-type', JSON.stringify(customType));
		}
	}
}
</script>

<style scoped>
.node-panel {
	width: 100%;
	height: 100vh;
	background: #23272e;
	color: #fff;
	border-right: 1.5px solid #23272e;
	box-shadow: 2px 0 12px 0 rgba(0, 0, 0, 0.08);
	display: flex;
	flex-direction: column;
	transition: width 0.2s;
	z-index: 20;
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}
.node-panel.collapsed {
	width: 36px;
	min-width: 36px;
}
.collapsed-top {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding-top: 12px;
	height: 100%;
}
.panel-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 10px 12px;
	font-weight: bold;
	background: #23272e;
	cursor: pointer;
	border-bottom: 1px solid #23272e;
}
.collapse-btn {
	background: none;
	border: none;
	color: #fff;
	font-size: 1.2rem;
	cursor: pointer;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	margin-left: 8px;
	transition: background 0.15s;
}
.collapse-btn:hover {
	background: rgba(255, 255, 255, 0.06);
}
.collapse-btn svg {
	width: 18px;
	height: 18px;
	display: block;
}
.panel-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	padding: 10px 8px 0 8px;
}
.search {
	width: 100%;
	box-sizing: border-box;
	padding: 6px 10px;
	border-radius: 6px;
	border: 1.5px solid #fff2;
	background: #23272e;
	color: #fff;
	margin-bottom: 10px;
	font-size: 1rem;
	outline: none;
	transition: border 0.2s;
}
.search:focus {
	border: 1.5px solid #ffb84d;
}
.category-list {
	margin: 0;
	padding: 0;
	flex: 1;
	overflow-y: auto;
}
.category-title {
	font-weight: 700;
	font-size: 1.05rem;
	color: #ffb84d;
	margin: 12px 0 4px 0;
	letter-spacing: 0.01em;
}
.category-block {
	margin-bottom: 8px;
}
.node-list {
	list-style: none;
	padding: 0;
	margin: 0;
	flex: 1;
	overflow-y: auto;
}
.node-item {
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 6px;
	border-radius: 6px;
	cursor: grab;
	transition: background 0.15s;
}
.node-item:hover {
	background: #31343b;
}
.node-icon {
	display: inline-block;
	vertical-align: middle;
	margin-right: 8px;
	width: 28px;
	height: 28px;
	font-size: 1.2rem;
}
.add-node-type-btn {
	width: 100%;
	margin-bottom: 10px;
	background: #ffb84d;
	color: #23272e;
	border: none;
	border-radius: 6px;
	padding: 7px 0;
	font-weight: bold;
	cursor: pointer;
	font-size: 1rem;
	transition: background 0.18s;
}
.add-node-type-btn:hover {
	background: #ffcb7d;
}
.edit-btn,
.delete-btn {
	background: none;
	border: none;
	color: #ffb84d;
	font-size: 1.1em;
	margin-left: 6px;
	cursor: pointer;
}
.delete-btn {
	color: #e14d43;
}
</style>
