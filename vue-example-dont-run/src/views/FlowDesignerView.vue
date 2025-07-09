<template>
	<div class="flow-designer-view">
		<div class="node-panel-wrapper">
			<NodePanel />
		</div>
		<div class="designer-bg">
			<FlowCanvas />
		</div>
	</div>
</template>

<script setup lang="ts">
import FlowCanvas from '../components/FlowCanvas.vue';
import NodePanel from '../components/NodePanel.vue';
</script>

<style scoped>
.flow-designer-view {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	min-width: 0;
	min-height: 0;
	display: flex;
	flex-direction: row;
	background: #23272e;
	overflow: hidden;
	box-sizing: border-box;
}
.node-panel-wrapper {
	flex: 0 0 240px;
	width: 240px;
	min-width: 36px;
	max-width: 240px;
	height: 100%;
	box-sizing: border-box;
	display: flex;
	margin: 0;
	padding: 0;
}
.node-panel-wrapper:has(.collapsed) {
	flex: 0 0 36px;
	width: 36px;
	min-width: 36px;
	max-width: 36px;
}
.designer-bg {
	flex: 1 1 0%;
	min-width: 0;
	min-height: 0;
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	background-color: #23272e;
	background-image: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 23px,
			#363a40 23px,
			#363a40 24px
		),
		repeating-linear-gradient(90deg, transparent, transparent 23px, #363a40 23px, #363a40 24px),
		radial-gradient(circle, #444 1.2px, transparent 1.2px);
	background-size:
		24px 24px,
		24px 24px,
		24px 24px;
	background-position:
		0 0,
		0 0,
		0 0;
	overflow: hidden;
	box-sizing: border-box;
}
</style>
