<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	export let index;
	export let id;
	export let title;
	export let author;
</script>

<div
	class="container1 row blue-grey darken-4"
	in:fly={{ x: -10, duration: 500, delay: 100 + 100 * index }}
>
	<div class="col s12">
		<h5>{title}</h5>
		<blockquote>{author}</blockquote>
	</div>
	<div class="col s12 center-align">
		<a
			style="width: 100%;"
			class="waves-effect waves-dark btn white-text btn-large cyan lighten-1"
			href="#!"
		>
			<a href="./posts/{id}" class="valign-wrapper center-align white-text" style="width: 100%;">
				<i class="material-icons" style="margin-right: 1em;">book</i>Read More
			</a>
		</a>
	</div>
</div>

<style>
	.container1 {
		padding: 1em;
		border-radius: 10px;
	}
</style>
