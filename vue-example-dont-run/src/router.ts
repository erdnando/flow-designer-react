import { createRouter, createWebHistory } from 'vue-router';
// import type only for RouteRecordRaw
import type { RouteRecordRaw } from 'vue-router';

const routes: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'Home',
		component: () => import('./views/HomeView.vue'),
	},
	{
		path: '/designer',
		name: 'FlowDesigner',
		component: () => import('./views/FlowDesignerView.vue'),
	},
];

const router = createRouter({
	history: createWebHistory(),
	routes,
});

export default router;
