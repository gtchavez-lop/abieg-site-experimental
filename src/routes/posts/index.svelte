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

	onMount(async (e) => {
		if (await supabase.auth.user()) {
			hasAccount = true;
		}
	});

	// const _blogs = readable(null, (set) => {
	// 	supabase
	// 		.from('posts')
	// 		.select('*')
	// 		.order('created_at', { ascending: false })
	// 		.then(({ data, error }) => {
	// 			set(data);
	// 		});

	// 	const subscription = supabase
	// 		.from('posts')
	// 		.on('*', (payload) => {
	// 			if (payload.eventType === 'INSERT') {
	// 				set([payload.new, ...get(_blogs)]);
	// 			}
	// 			if (payload.eventType === 'UPDATE') {
	// 				let index = $_blogs.findIndex((thisblog) => thisblog.id === payload.new.id);
	// 				let oldData = $_blogs;
	// 				oldData[index] = payload.new;
	// 				set(oldData);
	// 			}
	// 			if (payload.eventType === 'DELETE') {
	// 				let oldData = $_blogs;
	// 				set(oldData.filter((thisItem) => thisItem.id != payload.old.id));
	// 			}

	// 			publicBlogs = [];
	// 			let oldData = get(_blogs);
	// 			oldData.forEach((blog) => {
	// 				if (!blog.isExclusive) {
	// 					publicBlogs = [...publicBlogs, blog];
	// 				}
	// 			});
	// 		})
	// 		.subscribe();
	// 	return () => supabase.removeSubscription(subscription);
	// });
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

		<div class=" mt-5">
			{#await $_blogs}
				<p>loading</p>
			{:then c}
				{#if c}
					{#each c as { title, header_img, created_at, isExclusive, author, slug }}
						<div class="col d-flex justify-content-center">
							<!-- <PostBlogCard {title} {author} {header_img} {isExclusive} {created_at} {slug} /> -->
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
				{/if}
			{/await}
			<!-- {#if !$_blogs}
				<p class="display-6">Loading</p>
			{:else if $_blogs}
				<div
					class="row row-cols-1 row-cols-lg-2 gx-2 gy-2 "
					in:fly|local={{ y: 20, duration: 500, delay: 500 }}
				>
					{#each $_blogs as { title, header_img, created_at, isExclusive, author, slug }}
						<div class="col d-flex justify-content-center">
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
			{/if} -->
		</div>
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
