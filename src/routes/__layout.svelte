<script>
	import FullscreenNav from '../components/FullscreenNav.svelte';
	import BackgroundBlob from '../components/BackgroundBlob.svelte';
	import { onMount } from 'svelte';
	import Footer from '../components/Footer.svelte';

	let mainContainer;
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin /><link
		href="https://fonts.googleapis.com/css2?family=Nunito&display=swap"
		rel="stylesheet"
	/>
	<link
		rel="stylesheet"
		media="screen"
		href="https://fontlibrary.org//face/xolonium"
		type="text/css"
	/>
</svelte:head>

<FullscreenNav />
<main bind:this={mainContainer} />
<slot />
<Footer />
<!-- <BackgroundBlob /> -->
