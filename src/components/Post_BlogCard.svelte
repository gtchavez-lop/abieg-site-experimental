<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	export let index;
	export let id;
	export let title;
	export let author;
	export let header_img;
	export let isExclusive;
</script>

<div class="card" in:fly={{ y: -10, duration: 500, delay: 100 + 100 * index }}>
	{#if isExclusive}
		<!-- <div
			class="position-absolute top-0 start-0 mt-2 ms-1 translate-start px-3 py-1 rounded-pill bg-danger"
		>
			ABIE G EXCLUSIVE
		</div> -->
		<div class="exclusiveBadge">
			<span>EXCLUSIVE</span>
		</div>
	{/if}

	<img src={header_img} height="200" alt="..." class="card-img-top" />
	<div class="card-body">
		<h5 class="card-title">
			{title}
		</h5>
		<p class="card-text">{author}</p>
		<a href="posts/{id}" class="btn btn-primary float-end">Read More</a>
	</div>
</div>

<style>
	img {
		object-fit: cover;
	}
	.card {
		transition: 200ms ease all;
		overflow: hidden;
		box-shadow: rgba(0, 0, 0, 0.5) 0 0 10px;
		width: 100%;
		background: #343a40;
		user-select: none;
	}
	.card:hover {
		transform: translateY(-3px);
		box-shadow: rgba(0, 0, 0, 0.25) 0 10px 20px;
	}
	.exclusiveBadge {
		position: absolute;
		right: 0;
		width: 200px;
		border-bottom-left-radius: 20px;
		height: 50px;
		/* transform: rotate(-10deg); */
		background: #d63384;
	}
	.exclusiveBadge span {
		font-size: 1.3em;
		position: absolute;
		bottom: 0;
		right: 10px;
	}
</style>
