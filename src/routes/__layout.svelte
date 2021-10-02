<script>
	import FullscreenNav from '../components/FullscreenNav.svelte';
	import BackgroundBlob from '../components/BackgroundBlob.svelte';
	import { onMount } from 'svelte';
	import Footer from '../components/Footer.svelte';

	let mainContainer;
</script>

<FullscreenNav />
<main bind:this={mainContainer} />
<slot />
<Footer />
<!-- <BackgroundBlob /> -->
