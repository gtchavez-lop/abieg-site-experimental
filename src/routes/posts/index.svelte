<script context="module">
	export const prerender = true;
</script>

<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, _blogs } from '../../global';
	import { onMount } from 'svelte';
	import PostBlogCardCompact from '../../components/Post_BlogCardCompact.svelte';
	import { get, readable } from 'svelte/store';

	let publicBlogs = [];
</script>

<svele:head>
	<title>Posts | Abie G</title>
</svele:head>

<main
	class="mb-5"
	in:fly={{ y: -40, duration: 500, delay: 500 }}
	out:fly={{ y: 40, duration: 500 }}
>
	<div class="container text-white">
		<h3 class="display-3">See what's new</h3>

		{#await $_blogs}
			<h3 class="display-3">Please wait</h3>
		{:then c}
			{#if c}
				<div class="row mt-5">
					{#each c as { title, header_img, created_at, isExclusive, author, slug }}
						<div class="col-12 col-lg-6">
							<PostBlogCardCompact
								{title}
								{header_img}
								{slug}
								{author}
								{created_at}
								{isExclusive}
							/>
						</div>
					{/each}
				</div>
			{/if}
		{/await}
	</div>
	<div class="scroller" transition:fade={{ duration: 500 }}>
		<MarqueeTextWidget duration={15}
			>SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp;</MarqueeTextWidget
		>
	</div>
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
	.scroller {
		width: 100vw;
		position: absolute;
		top: 0%;
		left: 0%;
		color: white;
		opacity: 0.1;
		font-size: 5rem;
		font-family: 'Thunder Bold';
		user-select: none;
		z-index: -10;
	}
</style>
