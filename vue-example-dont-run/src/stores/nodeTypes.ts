import { defineStore } from 'pinia';

export interface CustomNodeType {
	id: string;
	name: string;
	color: string;
	icon: string; // Puede ser un emoji o nombre de icono
	description?: string;
}

export const useNodeTypesStore = defineStore('nodeTypes', {
	state: () => ({
		customNodeTypes: [] as CustomNodeType[],
	}),
	actions: {
		addNodeType(nodeType: Omit<CustomNodeType, 'id'>) {
			// Si el nombre es 'Servicio', el id será 'servicio'. Si no, genera un id legible basado en el nombre.
			let id = 'servicio';
			if (nodeType.name && nodeType.name.trim().length > 0) {
				id = nodeType.name
					.trim()
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9\-_]/g, '');
			}
			// Si ya existe un tipo con ese id, agrega un sufijo numérico
			let finalId = id;
			let count = 2;
			while (this.customNodeTypes.some((n) => n.id === finalId)) {
				finalId = `${id}-${count++}`;
			}
			this.customNodeTypes.push({ ...nodeType, id: finalId });
		},
		updateNodeType(id: string, updates: Partial<CustomNodeType>) {
			const idx = this.customNodeTypes.findIndex((n) => n.id === id);
			if (idx !== -1) {
				this.customNodeTypes[idx] = { ...this.customNodeTypes[idx], ...updates };
			}
		},
		removeNodeType(id: string) {
			this.customNodeTypes = this.customNodeTypes.filter((n) => n.id !== id);
		},
	},
});
