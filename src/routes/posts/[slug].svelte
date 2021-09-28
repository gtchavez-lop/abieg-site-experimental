<script context="module">
	export const load = async (e) => {
		let slug = e.page.params.slug;
		return { props: { slug } };
	};
</script>

<script>
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { global_posts, supabase } from '../../global';

	export let slug;
	export let blogData;

	onMount(async (e) => {
		let { data, error } = await supabase.from('posts').select('*').eq('id', slug);

		if (!error || data.length > 0) {
			blogData = data[0];
			// console.log(blogData);
		}
	});
</script>

<svelte:head>
	{#if blogData}
		<title>ABIE G | {blogData.title}</title>
	{/if}
</svelte:head>

<main id="top" in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container white-text">
		<a class="btn-floating btn-large waves-effect waves-light  blue lighten-2" href="/posts"
			><i class="material-icons">arrow_back</i></a
		>
		{#if blogData}
			<h1>{blogData.title}</h1>
			<img src={blogData.header_img} alt="" />
		{/if}
	</div>
	<div class="container white-text content">
		{#if blogData}
			<p class="flow-text">{@html blogData.content}</p>
		{/if}
	</div>
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
	img {
		position: relative;
		width: 100%;
		height: 20em;
		object-fit: cover;
		object-position: center;
		border-radius: 10px;
	}
	.content {
		margin-bottom: 10em;
	}
</style>
