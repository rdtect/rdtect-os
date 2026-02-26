<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';

	const COUNT = 600;
	const SPREAD = 20;

	const dummy = new THREE.Object3D();
	const particleGeometry = new THREE.SphereGeometry(0.02, 4, 4);
	const particleMaterial = new THREE.MeshBasicMaterial({
		color: '#6366f1',
		transparent: true,
		opacity: 0.6
	});

	interface ParticleData {
		x: number;
		y: number;
		z: number;
		speed: number;
		offset: number;
	}

	const particles: ParticleData[] = Array.from({ length: COUNT }, () => ({
		x: (Math.random() - 0.5) * SPREAD,
		y: (Math.random() - 0.5) * SPREAD,
		z: (Math.random() - 0.5) * SPREAD,
		speed: 0.2 + Math.random() * 0.5,
		offset: Math.random() * Math.PI * 2
	}));

	let meshRef: THREE.InstancedMesh | undefined = $state();
	let elapsed = $state(0);

	useTask((delta) => {
		elapsed += delta;
		if (!meshRef) return;

		for (let i = 0; i < COUNT; i++) {
			const p = particles[i];
			const floatY = Math.sin(elapsed * p.speed + p.offset) * 0.5;
			const floatX = Math.cos(elapsed * p.speed * 0.7 + p.offset) * 0.2;

			dummy.position.set(p.x + floatX, p.y + floatY, p.z);
			dummy.updateMatrix();
			meshRef.setMatrixAt(i, dummy.matrix);
		}

		meshRef.instanceMatrix.needsUpdate = true;
	});
</script>

<T.InstancedMesh
	bind:ref={meshRef}
	args={[particleGeometry, particleMaterial, COUNT]}
	frustumCulled={false}
/>
