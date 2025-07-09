// Mapa de tipos de nodo a icono SVG y subtítulo
export const nodeTypeMeta: Record<string, { icon: string; subtitle: string }> = {
	gmail: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><path d="M8 12 L19 21 L30 12" stroke="#4285F4" stroke-width="2.5" fill="none" /><path d="M8 12 V26 Q8 28 10 28 H28 Q30 28 30 26 V12" stroke="#34A853" stroke-width="2.5" fill="none" /><path d="M8 12 L19 21 L30 12" stroke="#FBBC05" stroke-width="2.5" fill="none" /><path d="M8 12 L19 21 L30 12" stroke="#EA4335" stroke-width="2.5" fill="none" /></g></svg>`,
		subtitle: 'send: message',
	},
	webhook: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><circle cx="19" cy="19" r="8" stroke="#34A853" stroke-width="2.5" fill="none" /><path d="M19 11 v8 l6 6" stroke="#4285F4" stroke-width="2.5" fill="none" /></g></svg>`,
		subtitle: 'webhook: trigger',
	},
	http: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><rect x="10" y="14" width="18" height="10" rx="3" stroke="#4285F4" stroke-width="2.5" fill="none" /><rect x="14" y="18" width="10" height="2" rx="1" fill="#34A853" /></g></svg>`,
		subtitle: 'http: request',
	},
	function: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><path d="M12 26 Q19 12 26 26" stroke="#4285F4" stroke-width="2.5" fill="none" /><circle cx="19" cy="19" r="2.5" fill="#34A853" /></g></svg>`,
		subtitle: 'function: code',
	},
	set: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><rect x="12" y="12" width="14" height="14" rx="3" stroke="#FBBC05" stroke-width="2.5" fill="none" /></g></svg>`,
		subtitle: 'set: values',
	},
	delay: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><circle cx="19" cy="19" r="8" stroke="#FBBC05" stroke-width="2.5" fill="none" /><path d="M19 19 v-5" stroke="#4285F4" stroke-width="2.5" /><path d="M19 19 l4 4" stroke="#34A853" stroke-width="2.5" /></g></svg>`,
		subtitle: 'delay: time',
	},
	merge: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><path d="M12 12 Q19 19 26 12" stroke="#4285F4" stroke-width="2.5" fill="none" /><path d="M12 26 Q19 19 26 26" stroke="#34A853" stroke-width="2.5" fill="none" /></g></svg>`,
		subtitle: 'merge: data',
	},
	if: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><path d="M12 19 h14" stroke="#4285F4" stroke-width="2.5" /><path d="M19 12 v14" stroke="#34A853" stroke-width="2.5" /></g></svg>`,
		subtitle: 'if: condition',
	},
	condition: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><path d="M12 19 h14" stroke="#4285F4" stroke-width="2.5" /><path d="M19 12 v14" stroke="#34A853" stroke-width="2.5" /></g></svg>`,
		subtitle: 'if: condition',
	},
	default: {
		icon: `<svg width="28" height="28" viewBox="0 0 38 38"><rect x="2" y="2" width="34" height="34" rx="10" fill="#23272e" stroke="#e14d43" stroke-width="2.5"/><g><circle cx="19" cy="19" r="8" stroke="#4285F4" stroke-width="2.5" fill="none" /></g></svg>`,
		subtitle: 'default',
	},
};
