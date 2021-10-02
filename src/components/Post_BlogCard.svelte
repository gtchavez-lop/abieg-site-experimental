<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	export let index;
	export let id;
	export let title;
	export let author;
	export let header_img;
	export let isExclusive;
</script>

<div
	class="card"
	style="width: 100%; background: #343A40;"
	in:fly={{ y: -10, duration: 500, delay: 100 + 100 * index }}
>
	<img src={header_img} height="200" alt="..." class="card-img-top" />
	<div class="card-body">
		<h5 class="card-title">
			{#if isExclusive}
				✨
			{/if}
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
</style>
