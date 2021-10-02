<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	export let index;
	export let id;
	export let title;
	export let author;
	export let header_img;
	export let isExclusive;
</script>

<!-- <div
	class="container1 row blue-grey darken-4"
	in:fly={{ x: -10, duration: 500, delay: 100 + 100 * index }}
>
	<div class="col s12">
		{#if isExclusive}
			<p>✨Exclusive Content✨</p>
		{/if}
		<h5>{title}</h5>
		<blockquote>{author}</blockquote>
	</div>
	<div class="col s12 center-align">
		<a
			style="width: 100%;"
			class="waves-effect waves-dark btn white-text btn-large blue darken-2"
			href="#!"
		>
			<a href="./posts/{id}" class="valign-wrapper center-align white-text" style="width: 100%;">
				<i class="material-icons" style="margin-right: 1em;">book</i>Read More
			</a>
		</a>
	</div>
</div> -->

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
