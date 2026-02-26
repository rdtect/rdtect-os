<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';

	const buildings = [
		{ pos: [-3, 1.5, -2] as const, size: [1.2, 3, 1.2] as const, rotY: 0.3 },
		{ pos: [2, 2, -3] as const, size: [1.5, 4, 1] as const, rotY: -0.2 },
		{ pos: [0, 1, 0] as const, size: [2, 2, 2] as const, rotY: 0.8 },
		{ pos: [-1.5, 2.5, 3] as const, size: [1, 5, 0.8] as const, rotY: -0.5 },
		{ pos: [3.5, 1.2, 2] as const, size: [1.8, 2.4, 1.4] as const, rotY: 0.1 }
	];

	const platformGeometry = new THREE.RingGeometry(3.5, 4, 64);
	const platformMaterial = new THREE.MeshBasicMaterial({
		color: '#6366f1',
		transparent: true,
		opacity: 0.15,
		side: THREE.DoubleSide
	});

	const portalGeometry = new THREE.TorusGeometry(2.5, 0.03, 16, 100);
	const portalMaterial = new THREE.MeshBasicMaterial({
		color: '#818cf8',
		transparent: true,
		opacity: 0.5
	});

	let portalRotation = $state(0);

	useTask((delta) => {
		portalRotation += delta * 0.3;
	});

	function createEdgesFromBox(w: number, h: number, d: number): THREE.EdgesGeometry {
		return new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d));
	}
</script>

{#each buildings as b}
	{@const edgesGeo = createEdgesFromBox(b.size[0], b.size[1], b.size[2])}
	<T.LineSegments
		position.x={b.pos[0]}
		position.y={b.pos[1]}
		position.z={b.pos[2]}
		rotation.y={b.rotY}
	>
		<T is={edgesGeo} />
		<T.LineBasicMaterial color="#6366f1" transparent opacity={0.6} />
	</T.LineSegments>
{/each}

<!-- Floating platform ring -->
<T.Mesh
	geometry={platformGeometry}
	material={platformMaterial}
	rotation.x={-Math.PI / 2}
	position.y={-0.5}
/>

<!-- Portal rings -->
<T.Mesh
	geometry={portalGeometry}
	material={portalMaterial}
	position={[0, 3, -5]}
	rotation.y={portalRotation}
/>
<T.Mesh
	geometry={portalGeometry}
	material={portalMaterial}
	position={[0, 3, -5]}
	rotation.x={Math.PI / 2}
	rotation.y={portalRotation * 0.7}
	scale={0.8}
/>
