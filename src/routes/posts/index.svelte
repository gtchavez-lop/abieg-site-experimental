<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_account, global_posts } from '../../global';
	import Post_BlogCard from '../../components/Post_BlogCard.svelte';
	import { onMount } from 'svelte';
	import PostBlogCard from '../../components/Post_BlogCard.svelte';

	let hasAccount = false;
	let privateBlogs;
	let publicBlogs;
	let hasPrivateBlogs = null;
	let hasPublicBlogs = null;
	let blogs;
	let hasBlogs = null;

	onMount((e) => {
		if (localStorage.getItem('data') != '') {
			hasAccount = true;
		}
		(async (e) => {
			if (hasAccount) {
				let { data, error } = await supabase.from('posts').select('*');
				hasBlogs = null;
				if (!error || data) {
					hasBlogs = true;
					blogs = data;
				}
				if (data.length < 1) {
					hasBlogs = false;
				}
			} else {
				let { data, error } = await supabase.from('posts').select('*').eq('isExclusive', 'false');
				hasBlogs = null;
				if (!error || data) {
					hasBlogs = true;
					blogs = data;
				}
				if (data.length < 1) {
					hasBlogs = false;
				}
			}
		})();
	});
</script>

<svelte:head>
	<title>Abie G | Posts</title>
</svelte:head>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container text-white">
		<h3 class="display-3">See what's new</h3>

		<div class=" mt-5">
			{#if hasBlogs == null}
				<div class="spinner-border text-info" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<p>Fetching posts</p>
			{:else if hasBlogs}
				<div class="row gy-3 gx-3">
					{#each blogs as blogs, index}
						<div class="col-sm-12 col-md-6 ">
							<PostBlogCard {...blogs} {index} />
						</div>
					{/each}
				</div>
			{:else}
				<h5>Seems like its empty</h5>
			{/if}
		</div>
	</div>
</main>
<div class="scroller" transition:fade={{ duration: 500 }}>
	<MarqueeTextWidget duration={15}
		>SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp; SEE WHAT'S GOING ON &nbsp;</MarqueeTextWidget
	>
</div>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
	.scroller {
		position: fixed;
		bottom: -7%;
		left: -10%;
		color: white;
		opacity: 0.2;
		font-size: 10rem;
		font-family: 'Thunder Bold';
		user-select: none;
		z-index: 1;
	}
</style>
