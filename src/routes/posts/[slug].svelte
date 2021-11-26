<script context="module">
	export const prerender = true;
	export const load = async (e) => {
		let slug = e.page.params.slug;
		return { props: { slug } };
	};
</script>

<script>
	import { onMount } from 'svelte';
	import { supabase } from '../../global';
	import SlugContent from './components/SlugContent.svelte';
	import { fly } from 'svelte/transition';

	export let slug;
	export let blogData;

	let title;
	let scrollY;
	let hasAccount = false;

	onMount(async (e) => {
		let user = await supabase.auth.user();
		if (user) {
			hasAccount = true;
		}

		let { data, error } = await supabase.from('posts').select('*').eq('slug', slug);
		if (!error || data.length > 0) {
			blogData = data[0];
			title = data[0].title;
		}
	});

	const goBack = () => {
		window.history.back();
	};
</script>

<svelte:window bind:scrollY />

<svelte:head>
	<title>ABIE G | {title}</title>
</svelte:head>

<main class="container">
	{#if blogData}
		{#if blogData.isExclusive && !hasAccount}
			<div class="d-flex flex-column" in:fly={{ y: -20, duration: 500 }}>
				<p class="lead text-white">Please Sign in to view this page</p>
				<button class="btn btn-outline-primary px-5" on:click={goBack}>Go Back</button>
			</div>
		{:else}
			<SlugContent {blogData} />
		{/if}
	{/if}
</main>

<style lang="scss">
	main {
		position: relative;
		min-height: 86vh;
		z-index: 3;
		animation: slide 500ms ease-out 200ms;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}
</style>
