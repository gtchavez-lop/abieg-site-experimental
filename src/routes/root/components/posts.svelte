<script>
	import dayjs from 'dayjs';
	import AdminPostCard from '../../../components/AdminPostCard.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { supabase } from '../../../global';

	let _posts = [];
	let _public_posts = [];
	let _exclusive_posts = [];
	let loaded = false;
	let post_toggler = 1;

	onMount(async (e) => {
		let { data: posts, error } = await supabase.from('posts').select('*');
		if (!error) {
			_posts = posts;
			posts.forEach((thispost) => {
				if (thispost.isExclusive == false) {
					_public_posts = [..._public_posts, thispost];
				} else {
					_exclusive_posts = [..._exclusive_posts, thispost];
				}
			});
			setTimeout(() => {
				loaded = true;
			}, 200);
		}
	});
</script>

<main in:fly={{ y: 20, duration: 500 }} class="text-white">
	<div class="container ">
		<div class="row row-cols-md-3">
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>All Posts</h5>
					<h1 class="mt-4">{_posts.length}</h1>
					<i class="bi bi-eye" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>Public Posts</h5>
					<h1 class="mt-4">{_public_posts.length}</h1>
					<i class="bi bi-globe2" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>Exclusive Posts</h5>
					<h1 class="mt-4">{_exclusive_posts.length}</h1>
					<i class="bi bi-file-lock" />
				</div>
			</div>
		</div>
	</div>
	{#if loaded}
		<div class="container mt-5" in:fly={{ y: 20, duration: 500 }}>
			<div class="btn-group d-flex" role="group" aria-label="Basic example">
				<button
					type="button"
					on:click={() => {
						post_toggler = 1;
					}}
					class="btn btn-outline-primary">List of All Posts</button
				>
				<button
					type="button"
					on:click={() => {
						post_toggler = 2;
					}}
					class="btn btn-outline-primary">List of Public Posts</button
				>
				<button
					type="button"
					on:click={() => {
						post_toggler = 3;
					}}
					class="btn btn-outline-primary">List of Exclusive Posts</button
				>
			</div>

			<div class="mt-3 ">
				{#if post_toggler == 1}
					<div in:fly={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">All Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#each _posts as thispost}
								<AdminPostCard blog={thispost} />
							{/each}
						</div>
					</div>
				{/if}
				{#if post_toggler == 2}
					<div in:fly={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Public Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#each _public_posts as thispost}
								<AdminPostCard blog={thispost} />
							{/each}
						</div>
					</div>
				{/if}
				{#if post_toggler == 3}
					<div in:fly={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Exclusive Posts Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#each _exclusive_posts as thispost}
								<AdminPostCard blog={thispost} />
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</main>

<style lang="scss">
	main {
		position: relative;
		margin-top: 50px;
		z-index: 3;
	}

	.card {
		overflow: hidden;
		background: #282c31;
		.card-body {
			position: relative;
			i {
				position: absolute;
				top: 50%;
				opacity: 0.2;
				transform: translateY(-50%);
				right: -2%;
				font-size: 10em;
			}
		}
	}
</style>
