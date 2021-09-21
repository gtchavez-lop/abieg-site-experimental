<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_account, global_posts } from '../../global';
	import Post_BlogCard from '../../components/Post_BlogCard.svelte';

	const fetchdata = (async (e) => {
		let { data: Posts, error } = await supabase.from('abieg_posts-public').select('*');
		if (!error) {
			global_posts.set(Posts);
		}
	})();
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container white-text">
		<h2>See what's new</h2>
		<div class="container1">
			<div class="row">
				<div class="col s12">
					<h4>Public Posts</h4>
					<div class="container1">
						{#await fetchdata}
							<div class="progress">
								<div class="indeterminate" />
							</div>
						{:then data}
							{#each $global_posts as post, index}
								<Post_BlogCard {...post} {index} />
							{/each}
						{/await}
					</div>
				</div>
			</div>
		</div>
	</div>
</main>
<div class="scroller" transition:fade={{ duration: 500 }}>
	<MarqueeTextWidget duration={15}>SEE WHAT'S GOING ON &nbsp;</MarqueeTextWidget>
</div>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		font-family: 'Nunito';
		z-index: 3;
	}
	.scroller {
		position: fixed;
		bottom: -7%;
		left: -10%;
		color: white;
		opacity: 0.2;
		font-size: 10rem;
		font-family: 'XoloniumRegular';
		user-select: none;
		z-index: 1;
	}
</style>
