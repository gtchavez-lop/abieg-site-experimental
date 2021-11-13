<script>
	import dayjs from 'dayjs';

	import { fly, slide, scale, blur } from 'svelte/transition';
	export let title;
	export let author;
	export let header_img;
	export let isExclusive;
	export let created_at;
	export let slug;

	import IntersectionObserver from 'svelte-intersection-observer';

	let card;
	let cardVisible = true;
</script>

<IntersectionObserver threshold={0.2} once element={card} bind:intersecting={cardVisible}>
	<div
		bind:this={card}
		transition:slide|local
		class="blog_card {cardVisible ? 'blog_card_visible' : ''}"
	>
		{#if isExclusive}
			<div class="exclusiveBadge">
				<span>EXCLUSIVE</span>
			</div>
		{/if}

		<div class="blog_card_bg">
			<img src={header_img} alt="" />
		</div>
		<div
			class="blog_card_bg blog_card_bg1 d-none d-lg-flex justify-content-center align-items-center"
			style="z-index: 2;"
		>
			<a href="/posts/{slug}" class="btn btn-lg btn-primary">Read More</a>
		</div>

		<div class="blog_card_content d-block d-lg-none" style="min-width: 100%;">
			<p class="display-6" style="font-size: 1.4em; text-overflow:ellipsis;">{title}</p>
			<p style="color: #e2eff1;">{author}</p>

			<a href="/posts/{slug}" class="btn btn-primary " style="width: 100%;">Read More</a>
		</div>
		<div class="blog_card_content blog_card_content1 d-none d-lg-block" style="min-width: 100%;">
			<p class="display-6" style="font-size: 1.4em;">{title}</p>
			<p style="color: #e2eff1;">
				{author} |
				<span style="color: #C1C1C1;">{dayjs(created_at).format('DD MMM, YYYY')}</span>
			</p>
		</div>
	</div>
</IntersectionObserver>

<style lang="scss">
	.blog_card {
		position: relative;
		width: 100%;
		height: 25em;
		opacity: 0;
		transition: 300ms ease all;
		border: none;
		box-shadow: rgba(0, 0, 0, 0) 0 0.5em 2em;
		user-select: none;
		transform-style: preserve-3d;
		transform: translateY(50px);
		// clip-path: polygon(0 5%, 100% 0, 100% 95%, 0% 100%);
		&:hover {
			box-shadow: rgba(0, 0, 0, 0.2) 0 0.5em 2em;
			.blog_card_bg {
				img {
					transform: scale(1.05) translateZ(100px);
				}
			}
			.blog_card_bg1 {
				opacity: 1;
			}
			.blog_card_content1 {
				opacity: 0;
			}
			.exclusiveBadge {
				width: 100%;
			}
		}

		.blog_card_bg {
			position: absolute;
			width: 100%;
			height: 100%;
			transition: 300ms ease all;
			overflow: hidden;
			z-index: -1;
			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				object-position: center;
				transition: 300ms ease all;
			}
		}
		.blog_card_bg1 {
			opacity: 0;
			background: rgba(40, 38, 44, 0.9);
		}

		.blog_card_content {
			position: absolute;
			padding: 1em;
			bottom: 0;
			transition: 300ms ease all;
			background: #3d5467;
			text-overflow: ellipsis;
		}

		.exclusiveBadge {
			position: absolute;
			z-index: 2;
			right: 0;
			width: 200px;
			height: 50px;
			transition: 300ms ease all;
			background: #d63384;

			span {
				font-size: 1.3em;
				position: absolute;
				bottom: 0;
				right: 10px;
			}
		}
	}
	.blog_card_visible {
		opacity: 1;
		transform: translateY(0%);
	}
</style>
