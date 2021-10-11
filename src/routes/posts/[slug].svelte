<script context="module">
	export const load = async (e) => {
		let slug = e.page.params.slug;
		return { props: { slug } };
	};
</script>

<script>
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';
	import { fade, fly, slide } from 'svelte/transition';
	import { global_posts, supabase } from '../../global';
	import { quintOut } from 'svelte/easing';

	export let slug;
	export let blogData;

	let title;
	let image;
	let scrollY;

	onMount(async (e) => {
		let { data, error } = await supabase.from('posts').select('*').eq('id', slug);

		if (!error || data.length > 0) {
			blogData = data[0];
			title = data[0].title;
			// console.log(blogData);
		}
		// window.onscroll = (e) => {
		// };
		// window.onload = (e) => {
		// 	if (window.scrollY > 100) {
		// 		image.style.opacity = 0;
		// 		image.style.transform = 'translateY(-10%)';
		// 	} else {
		// 		image.style.opacity = 1;
		// 		image.style.transform = 'translateY(0)';
		// 	}
		// };
	});
</script>

<svelte:window bind:scrollY />

<svelte:head>
	<title>ABIE G | {title}</title>
</svelte:head>

<div>
	<div
		class="imgContainer"
		bind:this={image}
		in:slide={{ duration: 1000, delay: 200, easing: quintOut }}
		out:fly={{ y: -20, duration: 500 }}
		style="opacity: {1 - scrollY / 500}; transform: translateY(-{Math.min(
			(scrollY / 500) * 100,
			500
		)}px);"
	>
		{#if blogData}
			<img src={blogData.header_img} alt="" />

			{#if blogData.isExclusive}
				<h6
					class="exlusiveContent text-white "
					in:fly={{ x: 20, y: 20, duration: 500, delay: 500 }}
				>
					<span in:fly={{ x: 10, y: 10, duration: 500, delay: 700 }}>EXCLUSIVE</span>
				</h6>
			{/if}
		{/if}
	</div>
	<main
		in:fly={{ y: 20, duration: 500, delay: 500 }}
		out:fly={{ y: -60, duration: 500 }}
		class="mb-5"
	>
		<div class="container text-white">
			<div class="row">
				<div class="col-sm-12 col-md-8" />
				<div class="col-sm-12 col-md-4 d-flex justify-content-end">
					<a href="/posts" class="btn btn-lg text-white bg-secondary ">
						<i class="bi bi-x me-3" style="font-size: 1.1em;" />
						<span>Close Article</span>
					</a>
				</div>
			</div>
			<div class="row mt-3">
				<div class="col-12">
					{#if blogData}
						<h3 class="display-1">{blogData.title}</h3>
						<h5>by: {blogData.author}</h5>
					{/if}
				</div>
				<div class="col-12 mt-5">
					{#if blogData}
						<p class="flow-text white-text">{@html blogData.content}</p>
					{/if}
				</div>
			</div>
		</div>
	</main>
</div>

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		margin-top: calc(50vh + 2em);
		z-index: 3;
		animation: slide 500ms ease-out 200ms;
	}
	.imgContainer {
		position: fixed;
		top: 0;
		width: 100%;
		height: 50vh;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1;
		perspective: 1px;
		opacity: 1;
		overflow: hidden;
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 20px;
		img {
			position: absolute;
			width: 100%;
			height: 100%;
			object-fit: cover;
			object-position: center;
		}
	}
	.exlusiveContent {
		position: absolute;
		background: #d63384;
		bottom: 0;
		right: 0;
		min-height: 50px;
		min-width: 200px;
		height: 20%;
		width: 40%;
		font-size: 1.7em;
		margin: 0;
		border-top-left-radius: 20px;
		box-shadow: rgba(0, 0, 0, 0.5) 0 0 20px;
		span {
			position: absolute;
			bottom: 10%;
			right: 10%;
			margin: 0;
		}
	}
	@media screen and (max-width: 800px) {
		.exlusiveContent {
			width: 50%;
		}
	}
</style>
