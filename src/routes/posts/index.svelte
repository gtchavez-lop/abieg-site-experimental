<script context="module">
	export const prerender = true;
</script>

<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase } from '../../global';
	import { onMount } from 'svelte';
	import PostBlogCard from '../../components/Post_BlogCard.svelte';
	import { get, readable } from 'svelte/store';

	let hasAccount = false;

	onMount(async (e) => {
		if (await supabase.auth.user()) {
			hasAccount = true;
		}
	});

	const _blogs = readable(null, (set) => {
		supabase
			.from('posts')
			.select('*')
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				set(data);
			});

		const subscription = supabase
			.from('posts')
			.on('*', (payload) => {
				if (payload.eventType === 'INSERT') {
					set([payload.new, ...get(_blogs)]);
				}
				if (payload.eventType === 'UPDATE') {
					let index = $_blogs.findIndex((thisblog) => thisblog.id === payload.new.id);
					let oldData = $_blogs;
					oldData[index] = payload.new;
					set(oldData);
				}
				if (payload.eventType === 'DELETE') {
					let oldData = $_blogs;
					set(oldData.filter((thisItem) => thisItem.id != payload.old.id));
				}
			})
			.subscribe();
		return () => supabase.removeSubscription(subscription);
	});
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
			{#if !$_blogs}
				<div class="lds-roller">
					<div />
					<div />
					<div />
					<div />
					<div />
					<div />
					<div />
					<div />
				</div>
			{:else if $_blogs}
				{#if !hasAccount}
					<h4 class="my-5">Sign in to view exclusive content</h4>
				{/if}
				<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 gx-3 gy-3 ">
					{#each $_blogs as blogs}
						{#if !blogs.isExclusive}
							<div class="col d-flex justify-content-center thiscard">
								<PostBlogCard {...blogs} />
							</div>
						{:else}
							<div class="col d-flex justify-content-center thiscard">
								<PostBlogCard {...blogs} />
							</div>
						{/if}
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

	/* custom loader */
	.lds-roller {
		display: inline-block;
		position: absolute;
		width: 80px;
		height: 80px;
		left: calc(50% - 40px);
		top: calc(50% - 40px);
	}
	.lds-roller div {
		animation: lds-roller 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
		transform-origin: 40px 40px;
	}
	.lds-roller div:after {
		content: ' ';
		display: block;
		position: absolute;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #fff;
		margin: -4px 0 0 -4px;
	}
	.lds-roller div:nth-child(1) {
		animation-delay: -0.036s;
	}
	.lds-roller div:nth-child(1):after {
		top: 63px;
		left: 63px;
	}
	.lds-roller div:nth-child(2) {
		animation-delay: -0.072s;
	}
	.lds-roller div:nth-child(2):after {
		top: 68px;
		left: 56px;
	}
	.lds-roller div:nth-child(3) {
		animation-delay: -0.108s;
	}
	.lds-roller div:nth-child(3):after {
		top: 71px;
		left: 48px;
	}
	.lds-roller div:nth-child(4) {
		animation-delay: -0.144s;
	}
	.lds-roller div:nth-child(4):after {
		top: 72px;
		left: 40px;
	}
	.lds-roller div:nth-child(5) {
		animation-delay: -0.18s;
	}
	.lds-roller div:nth-child(5):after {
		top: 71px;
		left: 32px;
	}
	.lds-roller div:nth-child(6) {
		animation-delay: -0.216s;
	}
	.lds-roller div:nth-child(6):after {
		top: 68px;
		left: 24px;
	}
	.lds-roller div:nth-child(7) {
		animation-delay: -0.252s;
	}
	.lds-roller div:nth-child(7):after {
		top: 63px;
		left: 17px;
	}
	.lds-roller div:nth-child(8) {
		animation-delay: -0.288s;
	}
	.lds-roller div:nth-child(8):after {
		top: 56px;
		left: 12px;
	}
	@keyframes lds-roller {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
</style>
