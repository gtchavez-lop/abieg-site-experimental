<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_account, global_account_data } from '../../global';
	import Post_BlogCard from '../../components/Post_BlogCard.svelte';
	import { onMount } from 'svelte';
	import PostBlogCard from '../../components/Post_BlogCard.svelte';

	let hasAccount = false;
	let blogs;
	let hasBlogs = null;

	onMount(async (e) => {
		if (await supabase.auth.user()) {
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

<svele:head>
	<title>Posts | Abie G</title>
</svele:head>

<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>
	<div class="container text-white">
		<h3 class="display-3">See what's new</h3>

		<div class=" mt-5">
			{#if hasBlogs == null}
				<div class="spinner-border text-info" role="status">
					<span class="visually-hidden">Loading...</span>
				</div>
				<p>Fetching posts</p>
			{:else if hasBlogs}
				{#if !hasAccount}
					<h4 class="my-5">Sign in to view exclusive content</h4>
				{/if}
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
