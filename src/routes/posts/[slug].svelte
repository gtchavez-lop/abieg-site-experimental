<script context="module">
	export const load = async (e) => {
		let slug = e.page.params.slug;
		return { props: { slug } };
	};
</script>

<script>
	import { onMount } from 'svelte';

	import { fade, fly } from 'svelte/transition';
	import { global_posts } from '../../global';
	export let slug;
</script>

<svelte:head>
	{#each $global_posts as post}
		{#if post.id == slug}
			<title>ABIE G | {post.title}</title>
		{/if}
	{/each}
</svelte:head>

<main id="top" in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container white-text">
		<a class="btn-floating btn-large waves-effect waves-light  blue lighten-2" href="/posts"
			><i class="material-icons">arrow_back</i></a
		>
		{#each $global_posts as post}
			{#if post.id == slug}
				<h1>{post.title}</h1>
				<img src={post.header_img} alt="" />
			{/if}
		{/each}
	</div>
	<div class="container white-text content">
		{#each $global_posts as post}
			{#if post.id == slug}
				<p class="flow-text">{@html post.content}</p>
			{/if}
		{/each}
	</div>
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		font-family: 'Nunito';
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
