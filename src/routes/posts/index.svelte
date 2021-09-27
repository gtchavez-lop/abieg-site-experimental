<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_account, global_posts } from '../../global';
	import Post_BlogCard from '../../components/Post_BlogCard.svelte';
	import { onMount } from 'svelte';

	let privateBlogs;
	let publicBlogs;
	let hasPrivateBlogs = null;
	let hasPublicBlogs = null;

	onMount((e) => {
		(async (e) => {
			let { data, error } = await supabase
				.from('abieg_posts-public')
				.select('*')
				.eq('isExclusive', 'false');
			hasPublicBlogs = null;
			if (!error || data.length > 0) {
				hasPublicBlogs = true;
				publicBlogs = data;
			}
		})();
		(async (e) => {
			if ($global_account.email) {
				let { data, error } = await supabase
					.from('abieg_posts-public')
					.select('*')
					.eq('isExclusive', 'true');
				hasPrivateBlogs = null;
				if (!error || data.length > 0) {
					hasPrivateBlogs = true;
					privateBlogs = data;
				}
			}
		})();
	});
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container white-text">
		<h2>See what's new</h2>
		<div class="container1">
			<div class="row">
				<div class="col s12 disabled" style="margin-bottom: 10em;">
					<h4>Exclusive Posts</h4>
					{#if $global_account}
						<div class="container1">
							{#if hasPrivateBlogs == null}
								<div class="col s12">
									<div class="progress transparent">
										<div class="indeterminate blue darken-4" />
									</div>
									<p>Searching for public posts</p>
								</div>
							{:else if hasPrivateBlogs}
								{#each privateBlogs as blog, index}
									<Post_BlogCard {...blog} {index} />
								{/each}
							{:else}
								<h5>Seems like its empty</h5>
							{/if}
						</div>
					{:else}
						<p>Log in to enjoy exclusive content</p>
						<a href="/account" class="btn waves-effect waves-light blue darken-4">Go to Accounts</a>
					{/if}
				</div>
				<div class="col s12" style="margin-bottom: 10em;">
					<h4>Public Posts</h4>
					<div class="container1">
						{#if hasPublicBlogs == null}
							<div class="col s12">
								<div class="progress transparent">
									<div class="indeterminate blue darken-4" />
								</div>
								<p>Searching for public posts</p>
							</div>
						{:else if hasPublicBlogs}
							{#each publicBlogs as blog, index}
								<Post_BlogCard {...blog} {index} />
							{/each}
						{:else}
							<h5>Seems like its empty</h5>
						{/if}
					</div>
				</div>
			</div>
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
