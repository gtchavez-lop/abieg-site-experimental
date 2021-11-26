<script>
	import { supabase } from '../global';
	import dayjs from 'dayjs';
	import { onMount } from 'svelte';

	export let header_img, title, slug, author, created_at, isExclusive;

	onMount(async (e) => {
		await fetch(header_img).then((res) => {
			if (!res.ok) {
				header_img = 'https://picsum.photos/500/500';
			}
		});
	});
</script>

<main class="w-100 d-flex">
	{#if isExclusive && !supabase.auth.user()}
		<div class="exclusiveFilter d-flex justify-content-center align-items-center">
			<p>Please sign in to see this exclusive content</p>
		</div>
	{/if}
	{#if isExclusive}
		<img class="exclusiveBadge" src="./Star_glow_plus_more.png" alt="" />
		<div class="exclusiveGlow" />
	{/if}
	<div class="imgContainer">
		<img src={header_img} alt={slug} />
	</div>
	<a class="content" href="/posts/{slug}">
		<h4 class="lead title">{title}</h4>
		<p class="lead author">
			{author} <span aria-hidden="true">•</span>
			{dayjs(created_at).format('MMMM DD YYYY')}
		</p>
	</a>
</main>

<style lang="scss">
	main {
		position: relative;
		min-height: 125px;
		transition: 200ms ease all;
		margin-bottom: 2em;
		&:hover {
			transform: translateX(1em);
			.exclusiveBadge {
				transform: translate(-30px);
			}
			.exclusiveGlow {
				opacity: 1;
				left: -30px;
			}
		}
	}
	.exclusiveFilter {
		position: absolute;
		z-index: 9;
		background: #212529f3;
		user-select: none;
		width: 110%;
		left: -5%;
		height: 100%;
	}
	.exclusiveBadge {
		position: absolute;
		width: 50px;
		height: 50px;
		top: 0;
		left: 0;
		z-index: 2;
		transition: 200ms ease all;
	}
	.exclusiveGlow {
		position: absolute;
		width: 40px;
		height: 100%;
		top: 0;
		left: 10px;
		z-index: -1;
		opacity: 0;
		background: linear-gradient(-90deg, #f7749c, transparent);
		transition: 200ms ease all;
	}
	.imgContainer {
		position: relative;
		height: 100%;
		min-width: 125px;
		max-width: 125px;
		border-radius: 10px;
		overflow: hidden;

		img {
			position: absolute;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.content {
		cursor: pointer;
		padding: 1em;
		width: 100%;
		color: white;
		text-decoration: none;
		.author {
			font-size: 0.8em;
			color: #999;
		}
		.title {
			font-size: 1.5em;
		}
	}
</style>
