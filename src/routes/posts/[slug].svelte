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

		let { data, error } = await supabase.from('posts').select('*').eq('id', slug);
		if (!error || data.length > 0) {
			blogData = data[0];
			title = data[0].title;
		}
	});
</script>

<svelte:window bind:scrollY />

<svelte:head>
	<title>ABIE G | {title}</title>
</svelte:head>

{#if blogData}
	{#if blogData.isExclusive && hasAccount == false}
		<main>
			<p class="lead text-white">Please Sign in to view this page</p>
		</main>
	{/if}
	{#if (blogData.isExclusive && hasAccount) || (!blogData.isExclusive && !hasAccount) || (!blogData.isExclusive && hasAccount)}
		<SlugContent {blogData} />
	{/if}
{/if}

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
