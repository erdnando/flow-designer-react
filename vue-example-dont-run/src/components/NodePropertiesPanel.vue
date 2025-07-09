<template>
	<div
		class="node-properties-panel"
		:class="[{ collapsed }, { disabled: disabled && !showProject }]"
	>
		<div v-if="collapsed" class="collapsed-top">
			<button class="collapse-btn" @click.stop="toggleCollapse">
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
		<div v-else class="panel-header" @click="collapsed = false" :tabindex="-1">
			<span class="panel-title">{{
				showProject ? 'Propiedades del flujo' : 'Propiedades del nodo'
			}}</span>
			<button class="collapse-btn" @click.stop="toggleCollapse">
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
		<transition name="slide-panel">
			<div class="panel-body" v-show="!collapsed">
				<template v-if="showProject">
					<label>
						Nombre del flujo
						<input
							:value="projectProps.name"
							@input="(e) => updateProjectProp('name', (e.target as HTMLInputElement).value)"
							:disabled="disabled"
						/>
					</label>
					<label>
						Descripción
						<textarea
							:value="projectProps.description"
							@input="
								(e) => updateProjectProp('description', (e.target as HTMLTextAreaElement).value)
							"
							:disabled="disabled"
							rows="2"
						/>
					</label>
					<label>
						Estatus
						<select
							:value="projectProps.status"
							@change="(e) => updateProjectProp('status', (e.target as HTMLSelectElement).value)"
							:disabled="disabled"
						>
							<option value="Activo">Activo</option>
							<option value="Inactivo">Inactivo</option>
							<option value="Archivado">Archivado</option>
						</select>
					</label>
					<label>
						Propietario
						<input
							:value="projectProps.owner"
							@input="(e) => updateProjectProp('owner', (e.target as HTMLInputElement).value)"
							:disabled="disabled"
						/>
					</label>
					<div class="project-meta">
						<span>Creado: {{ projectProps?.createdAt || '' }}</span>
						<span>Actualizado: {{ projectProps?.updatedAt || '' }}</span>
					</div>
				</template>
				<template v-else-if="!disabled && node">
					<label>
						Nombre
						<input :value="nodeProperties.label" @input="onLabelChange($event)" />
					</label>
					<label>
						Tipo
						<select
							:value="nodeProperties.type === 'if' ? 'condition' : nodeProperties.type"
							@change="onTypeChange($event)"
						>
							<option
								v-for="typeKey in allNodeTypes.filter((t) => t !== 'if')"
								:key="typeKey"
								:value="typeKey === 'condition' ? 'condition' : typeKey"
							>
								{{ typeKey === 'condition' ? 'Condición (If)' : typeKey }}
							</option>
						</select>
					</label>
					<label>
						Subtítulo
						<input
							:value="nodeProperties.subtitle"
							@input="onSubtitleChange($event)"
							placeholder="Ingrese un subtítulo"
						/>
					</label>
				</template>
				<template v-else>
					<div class="empty-panel">
						Selecciona un nodo o haz click en el fondo para ver propiedades del flujo
					</div>
				</template>
			</div>
		</transition>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, toRefs, computed } from 'vue';
import { nodeTypeMeta } from '../utils/nodeTypeMeta';
import { useNodeTypesStore } from '../stores/nodeTypes';

const props = defineProps<{
	node: any;
	collapsed?: boolean;
	disabled?: boolean;
	showProject?: boolean;
	projectProps?: any;
}>();

const emit = defineEmits(['close', 'update', 'toggle-collapsed', 'update-project']);

const { collapsed: collapsedProp, disabled, showProject, projectProps } = toRefs(props);
const collapsed = ref(collapsedProp?.value ?? false);

// Objeto reactivo para manejar las propiedades del nodo
// Usar computed para las propiedades del nodo seleccionado para mejorar la reactividad
const nodeProperties = computed(() => {
	if (!props.node) {
		return {
			label: '',
			type: 'default',
			subtitle: '',
		};
	}

	return {
		label: props.node.label || '',
		type: props.node.type || 'default',
		subtitle: props.node.data?.subtitle || '',
	};
});

// Solo observar el estado de collapsed
watch(
	() => props.node,
	() => {
		collapsed.value = collapsedProp?.value ?? false;
	},
	{ immediate: true },
);

watch(collapsedProp, (val) => {
	if (typeof val === 'boolean') collapsed.value = val;
});

// Función para actualizar propiedades individuales del proyecto
function updateProjectProp(propName: string, value: any) {
	if (projectProps.value) {
		// Actualizar la propiedad individual en el objeto reactivo
		modifiedProjectProps.value[propName] = value;
	}
}

// Handlers para los eventos de input/change
function onLabelChange(event: Event) {
	const value = (event.target as HTMLInputElement).value;
	emit('update', { key: 'label', value });
}

function onTypeChange(event: Event) {
	let value = (event.target as HTMLSelectElement).value;
	if (value === 'if') value = 'condition'; // Forzar que 'if' se guarde como 'condition'
	if (value === 'condition') value = 'condition'; // Siempre guardar como 'condition'
	emit('update', { key: 'type', value });
}

function onSubtitleChange(event: Event) {
	const value = (event.target as HTMLInputElement).value;
	// Importante: asegurarse que el valor se pasa correctamente para subtitle
	console.log('Actualizando subtítulo:', value);
	emit('update', { key: 'subtitle', value });
}

function toggleCollapse() {
	collapsed.value = !collapsed.value;
	emit('toggle-collapsed', collapsed.value);
}

// Objeto para mantener un seguimiento de las propiedades modificadas
const modifiedProjectProps = ref<Record<string, any>>({});

// Watchers independientes para cada propiedad del proyecto
watch(
	() => projectProps.value?.name,
	(newVal) => {
		if (newVal !== undefined) modifiedProjectProps.value.name = newVal;
	},
);

watch(
	() => projectProps.value?.description,
	(newVal) => {
		if (newVal !== undefined) modifiedProjectProps.value.description = newVal;
	},
);

watch(
	() => projectProps.value?.status,
	(newVal) => {
		if (newVal !== undefined) modifiedProjectProps.value.status = newVal;
	},
);

watch(
	() => projectProps.value?.owner,
	(newVal) => {
		if (newVal !== undefined) modifiedProjectProps.value.owner = newVal;
	},
);

// Notificamos cambios debounced para evitar ciclos
let projectUpdateTimer: number | null = null;
watch(
	modifiedProjectProps,
	() => {
		if (projectUpdateTimer !== null) {
			clearTimeout(projectUpdateTimer);
		}

		projectUpdateTimer = window.setTimeout(() => {
			if (Object.keys(modifiedProjectProps.value).length > 0) {
				emit('update-project', { ...modifiedProjectProps.value });
				modifiedProjectProps.value = {}; // Reiniciar después de emitir
			}
		}, 300);
	},
	{ deep: true },
);

const nodeTypesStore = useNodeTypesStore();

const allNodeTypes = computed(() => {
	// Combina tipos estándar y personalizados
	const customTypes = nodeTypesStore.customNodeTypes.map((n) => n.id);
	return [...Object.keys(nodeTypeMeta), ...customTypes];
});
</script>

<style scoped>
.node-properties-panel {
	position: absolute;
	top: 0;
	right: 0;
	width: 320px;
	height: 100%;
	background: #23272e;
	color: #fff;
	box-shadow: -2px 0 12px 0 rgba(0, 0, 0, 0.18);
	z-index: 100;
	display: flex;
	flex-direction: column;
	transition: width 0.22s cubic-bezier(0.4, 1.3, 0.6, 1);
}
.node-properties-panel.collapsed {
	width: 48px;
	min-width: 48px;
	max-width: 48px;
	cursor: pointer;
}
.node-properties-panel.disabled {
	opacity: 0.6;
	pointer-events: none;
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
	padding: 0 12px 0 20px;
	min-height: 48px;
	height: 48px;
	border-bottom: 1px solid #363a40;
	background: transparent;
	box-sizing: border-box;
}
.panel-title {
	font-size: 1.08rem;
	font-weight: 600;
	color: #fff;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}
.collapse-btn {
	background: transparent;
	border: none;
	outline: none;
	width: 32px;
	height: 32px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 0;
	margin-left: 8px;
	color: #fff;
	cursor: pointer;
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
.panel-body {
	padding: 20px;
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 18px;
}
label {
	display: flex;
	flex-direction: column;
	font-size: 0.98rem;
	gap: 6px;
}
input,
select {
	background: #181c20;
	color: #fff;
	border: 1px solid #363a40;
	border-radius: 6px;
	padding: 7px 10px;
	font-size: 1rem;
}
.empty-panel {
	color: #b0b0b0;
	font-size: 1.08rem;
	text-align: center;
	margin-top: 40px;
	user-select: none;
}
.project-meta {
	margin-top: 12px;
	font-size: 0.92rem;
	color: #b0b0b0;
	display: flex;
	gap: 18px;
}
.slide-panel-enter-active,
.slide-panel-leave-active {
	transition:
		opacity 0.18s,
		transform 0.18s;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
	opacity: 0;
	transform: translateX(30px);
}
</style>
