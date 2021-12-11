<script>
	import { supabase } from '../global';
	import dayjs from 'dayjs';
	import { onMount } from 'svelte';

	export let header_img, title, slug, author, created_at, isExclusive;

	let newHeaderImg = 'https://via.placeholder.com/150';

	const changeImage = async (e) => {
		header_img = 'https://via.placeholder.com/150';
	};
</script>

<main class="d-flex">
	{#if isExclusive && !supabase.auth.user()}
		<div class="exclusiveFilter d-flex justify-content-center align-items-center">
			<p>Please sign in to see this exclusive content</p>
		</div>
	{/if}
	<div class="imgContainer {isExclusive ? 'exzclusiveCard' : ''}">
		<img src={header_img} on:error={changeImage} alt={slug} />
	</div>
	<a class="content" href="/posts/{slug}">
		{#if isExclusive}
			<p class="lead exclusiveBadge">EXLUSIVE</p>
		{/if}
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
			transform: translateY(-0.2em);
			.exclusiveCard {
				box-shadow: #f83edfb3 0px 0 20px 0;
			}
		}
	}
	.exclusiveCard {
		transition: 200ms ease all;
		box-shadow: #f83edfb3 0px 0 10px 0;
	}
	.exclusiveFilter {
		position: absolute;
		z-index: 9;
		background: #212529f3;
		user-select: none;
		width: 100%;
		left: -5%;
		height: 110%;
	}
	.exclusiveBadge {
		font-size: 0.8em;
		color: #f83edf;
		letter-spacing: 0.5em;
		margin: 0;
		font-weight: 700;
	}
	.imgContainer {
		position: relative;
		height: 100%;
		width: 100%;
		max-width: 125px;
		border-radius: 10px;
		overflow: hidden;

		img {
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
