<script>
	import { slide } from 'svelte/transition';
	export let blogData;

	let contentDisplayed = false;
</script>

<main class="card bg-transparent mb-3">
	<img src={blogData.header_img} class="card-img-top" alt="" />
	<div class="card-body">
		<h5 class="card-title">{blogData.title}</h5>
		<p style="color: #6F7172; text-transform: uppercase;">{blogData.id}</p>
		<div class="btn-group w-100 mb-5" role="group">
			<button
				class="btn btn-outline-light"
				on:click={(e) => {
					contentDisplayed = !contentDisplayed;
				}}>Toggle Display</button
			>
			<button class="btn btn-outline-light">Edit</button>
			<button class="btn btn-outline-danger">Remove</button>
		</div>
		{#if contentDisplayed}
			<div transition:slide|local>
				<p class="m-0">{blogData.content}</p>
			</div>
		{/if}
	</div>
</main>

<style>
	img {
		height: 200px;
		object-fit: cover;
	}
</style>
