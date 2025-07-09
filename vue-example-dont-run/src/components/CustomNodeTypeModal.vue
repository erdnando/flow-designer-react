<template>
	<div class="custom-node-crud-modal" v-if="visible">
		<div class="modal-bg" @click="close" />
		<div class="modal-content">
			<h3>{{ editId ? 'Editar tipo de nodo' : 'Nuevo tipo de nodo' }}</h3>
			<form @submit.prevent="save">
				<label
					>Nombre
					<input v-model="form.name" required maxlength="32" />
				</label>
				<label
					>Color
					<input v-model="form.color" type="color" />
				</label>
				<label
					>Icono (emoji o SVG)
					<input v-model="form.icon" placeholder="😀 o <svg .../>" />
				</label>
				<label
					>Descripción
					<input v-model="form.description" maxlength="64" />
				</label>
				<div class="actions">
					<button type="submit">{{ editId ? 'Actualizar' : 'Crear' }}</button>
					<button type="button" @click="close">Cancelar</button>
				</div>
			</form>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import type { CustomNodeType } from '../stores/nodeTypes';

const props = defineProps<{
	visible: boolean;
	editId?: string | null;
	nodeType?: Partial<CustomNodeType>;
}>();
const emit = defineEmits(['close', 'save']);

const form = ref({
	name: '',
	color: '#e14d43',
	icon: '',
	description: '',
});

watch(
	() => props.nodeType,
	(val) => {
		if (val) Object.assign(form.value, val);
		else form.value = { name: '', color: '#e14d43', icon: '', description: '' };
	},
	{ immediate: true },
);

function save() {
	emit('save', { ...form.value, id: props.editId });
}
function close() {
	emit('close');
}
</script>

<style scoped>
.custom-node-crud-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	z-index: 9999;
}
.modal-bg {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.35);
}
.modal-content {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	background: #23272e;
	color: #fff;
	border-radius: 12px;
	padding: 28px 24px 18px 24px;
	min-width: 320px;
	box-shadow: 0 4px 32px 0 #0008;
}
.modal-content h3 {
	margin: 0 0 18px 0;
	font-size: 1.2rem;
}
label {
	display: block;
	margin-bottom: 12px;
	font-size: 1rem;
}
input[type='text'],
input[type='color'],
input[type='email'],
input[type='number'],
input[type='password'] {
	width: 100%;
	margin-top: 4px;
	padding: 6px 8px;
	border-radius: 6px;
	border: 1.5px solid #fff2;
	background: #181c20;
	color: #fff;
	font-size: 1rem;
	outline: none;
	transition: border 0.2s;
}
input[type='color'] {
	width: 40px;
	height: 32px;
	padding: 0;
	border: none;
	background: none;
}
.actions {
	display: flex;
	gap: 10px;
	margin-top: 10px;
}
button {
	background: #ffb84d;
	color: #23272e;
	border: none;
	border-radius: 6px;
	padding: 7px 18px;
	font-weight: bold;
	cursor: pointer;
	font-size: 1rem;
	transition: background 0.18s;
}
button[type='button'] {
	background: #31343b;
	color: #fff;
}
button:hover {
	background: #ffcb7d;
}
</style>
