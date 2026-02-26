<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { HTML } from '@threlte/extras';
	import * as THREE from 'three';

	const projects = [
		{ name: 'Desktop OS', color: '#6366f1' },
		{ name: 'AI Agents', color: '#818cf8' },
		{ name: 'Generative Art', color: '#a78bfa' },
		{ name: 'Data Viz', color: '#c4b5fd' },
		{ name: 'Open Source', color: '#6366f1' },
		{ name: 'Research', color: '#818cf8' }
	];

	const ORBIT_RADIUS = 6;
	const ORBIT_Y = 2;

	const sphereGeometry = new THREE.SphereGeometry(0.25, 16, 16);

	let elapsed = $state(0);

	useTask((delta) => {
		elapsed += delta;
	});

	function getNodePosition(index: number, total: number): [number, number, number] {
		const angle = (index / total) * Math.PI * 2 + elapsed * 0.15;
		const yOffset = Math.sin(elapsed * 0.5 + index) * 0.3;
		return [
			Math.cos(angle) * ORBIT_RADIUS,
			ORBIT_Y + yOffset,
			Math.sin(angle) * ORBIT_RADIUS
		];
	}
</script>

{#each projects as project, i}
	{@const pos = getNodePosition(i, projects.length)}
	<T.Mesh position={pos} geometry={sphereGeometry}>
		<T.MeshStandardMaterial
			color={project.color}
			emissive={project.color}
			emissiveIntensity={0.5}
			roughness={0.3}
			metalness={0.7}
		/>
	</T.Mesh>

	<HTML position={[pos[0], pos[1] + 0.5, pos[2]]} center>
		<div class="node-label">
			{project.name}
		</div>
	</HTML>

	<!-- Connection line to center -->
	{@const lineGeo = new THREE.BufferGeometry().setFromPoints([
		new THREE.Vector3(0, 1, 0),
		new THREE.Vector3(pos[0], pos[1], pos[2])
	])}
	<T.Line geometry={lineGeo}>
		<T.LineBasicMaterial color="#6366f1" transparent opacity={0.15} />
	</T.Line>
{/each}

<style>
	.node-label {
		font-family: var(--desktop-font-mono), 'JetBrains Mono', monospace;
		font-size: 10px;
		color: rgba(199, 210, 254, 0.9);
		background: rgba(10, 10, 26, 0.7);
		padding: 2px 8px;
		border-radius: 4px;
		border: 1px solid rgba(99, 102, 241, 0.3);
		white-space: nowrap;
		pointer-events: none;
		user-select: none;
	}
</style>
