<script lang="ts">
	import { T } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import Architecture from './Architecture.svelte';
	import Particles from './Particles.svelte';
	import ProjectNodes from './ProjectNodes.svelte';
</script>

<T.PerspectiveCamera makeDefault position={[0, 5, 14]} fov={60}>
	<OrbitControls
		autoRotate
		autoRotateSpeed={0.4}
		enableDamping
		dampingFactor={0.05}
		minDistance={6}
		maxDistance={30}
		maxPolarAngle={Math.PI * 0.85}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.15} />
<T.PointLight position={[5, 10, 5]} intensity={80} color="#6366f1" />
<T.PointLight position={[-8, 6, -4]} intensity={40} color="#818cf8" />
<T.PointLight position={[0, -5, 8]} intensity={20} color="#4f46e5" />

<T.FogExp2 args={['#0a0a1a', 0.025]} attach="fog" />

<Architecture />
<Particles />
<ProjectNodes />
