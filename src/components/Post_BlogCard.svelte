<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	export let index;
	export let id;
	export let title;
	export let author;
	export let header_img;
	export let isExclusive;
</script>

<div class="blog_card" in:fly={{ y: -10, duration: 500, delay: 100 + 100 * index }}>
	<!-- {#if isExclusive}
		<div class="exclusiveBadge">
			<span>EXCLUSIVE</span>
		</div>
	{/if} -->

	<!-- <img src={header_img} height="200" alt="..." class="card-img-top" />
	<div class="card-body">
		<h5 class="card-title">
			{title}
		</h5>
		<p class="card-text">{author}</p>
		<a href="posts/{id}" class="btn btn-primary float-end">Read More</a>
	</div> -->

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
	>
		<a href="/posts/{id}" class="btn btn-lg btn-primary">Read More</a>
	</div>

	<div class="blog_card_content d-block d-lg-none">
		<p class="display-6" style="font-size: 1.4em;">{title}</p>
		<p class="text-muted">{author}</p>

		<a href="/posts/{id}" class="btn btn-primary " style="width: 100%;">Read More</a>
	</div>
	<div class="blog_card_content blog_card_content1 d-none d-lg-block">
		<p class="display-6" style="font-size: 1.4em;">{title}</p>
		<p class="text-muted">{author}</p>
	</div>
</div>

<style lang="scss">
	.blog_card {
		position: relative;
		width: 20em;
		height: 30em;
		border-radius: 20px;
		overflow: hidden;
		transition: 300ms ease all;
		border: none;
		box-shadow: rgba(0, 0, 0, 0.2) 0 0.5em 2em;
		user-select: none;

		&:hover {
			.blog_card_bg {
				transform: scale(1.05);
			}
			.blog_card_bg1 {
				opacity: 1;
			}
			.blog_card_content1 {
				opacity: 0;
				transform: translateY(1em);
			}
			.exclusiveBadge {
				width: 100%;
				border-bottom-left-radius: 0px;
			}
		}

		.blog_card_bg {
			position: absolute;
			width: 100%;
			height: 100%;
			transition: 300ms ease all;
			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
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
			background: #002a32;
			border-top-left-radius: 20px;
			border-top-right-radius: 20px;
		}

		.exclusiveBadge {
			position: absolute;
			z-index: 2;
			right: 0;
			width: 200px;
			border-bottom-left-radius: 20px;
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

	// .card {
	// 	transition: 200ms ease all;
	// 	overflow: hidden;
	// 	box-shadow: rgba(0, 0, 0, 0.5) 0 0 10px;
	// 	width: 100%;
	// 	background: #343a40;
	// 	user-select: none;
	// 	max-width: 300px;
	// 	min-height: 500px;
	// }
	// .card:hover {
	// 	transform: translateY(-3px);
	// 	box-shadow: rgba(0, 0, 0, 0.25) 0 10px 20px;
	// }
	// .exclusiveBadge {
	// 	position: absolute;
	// 	right: 0;
	// 	width: 200px;
	// 	border-bottom-left-radius: 20px;
	// 	height: 50px;
	// 	/* transform: rotate(-10deg); */
	// 	background: #d63384;
	// }
	// .exclusiveBadge span {
	// 	font-size: 1.3em;
	// 	position: absolute;
	// 	bottom: 0;
	// 	right: 10px;
	// }
</style>
