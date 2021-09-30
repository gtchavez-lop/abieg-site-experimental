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
	import { Parallax, ParallaxLayer } from 'svelte-parallax';

	export let slug;
	export let blogData;

	let image;

	onMount(async (e) => {
		let { data, error } = await supabase.from('posts').select('*').eq('id', slug);

		if (!error || data.length > 0) {
			blogData = data[0];

			// console.log(blogData);
		}

		window.onscroll = (e) => {
			if (window.scrollY > 100) {
				image.style.opacity = 0;
				image.style.transform = 'translateY(-10%)';
			} else {
				image.style.opacity = 1;
				image.style.transform = 'translateY(0)';
			}
		};
		window.onload = (e) => {
			if (window.scrollY > 100) {
				image.style.opacity = 0;
				image.style.transform = 'translateY(-10%)';
			} else {
				image.style.opacity = 1;
				image.style.transform = 'translateY(0)';
			}
		};
	});
</script>

<svelte:head>
	{#if blogData}
		<title>ABIE G | {blogData.title}</title>
	{/if}
</svelte:head>

<main id="top" in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="imgContainer" bind:this={image}>
		{#if blogData}
			<img src={blogData.header_img} alt="" />
		{/if}
	</div>
	<div class="flex ">
		<div class="container blue darken-4 white-text" style="padding: 1em; border-radius: 10px;">
			{#if blogData}
				<h3>{blogData.title}</h3>
				<p>by: {blogData.author}</p>
			{/if}
		</div>
	</div>
	<div class="container backbutton">
		<a class="btn-floating btn-large waves-effect waves-light  blue lighten-2" href="/posts"
			><i class="material-icons">arrow_back</i></a
		>
	</div>
	<div class="container content">
		{#if blogData}
			<p class="flow-text white-text">{@html blogData.content}</p>
		{/if}
	</div>
	<!-- <div class="container backbutton" style="margin-top: 2em">
		<a class="btn-floating btn-large waves-effect waves-light  blue lighten-2" href="/posts"
			><i class="material-icons">arrow_back</i></a
		>
	</div>
	<div class="container white-text">
		{#if blogData}
			<h1>{blogData.title}</h1>
		{/if}
	</div>
	<div class="container white-text content">
		{#if blogData}
			<p class="flow-text">{@html blogData.content}</p>
		{/if}
	</div> -->
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		z-index: 3;
	}
	.imgContainer {
		position: fixed;
		top: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1;
		perspective: 1px;
		opacity: 1;
		transition: 500ms ease all;
	}
	.flex {
		position: relative;
		height: 100vh;
		display: flex;
		justify-content: center;
		align-items: center;
		text-align: center;
		z-index: 2;
		margin-bottom: 5em;
	}
	.backbutton {
		margin-bottom: 5em;
	}
	.content {
		position: relative;
		z-index: 2;
		margin-bottom: 5em;
	}
	img {
		position: absolute;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}
</style>
