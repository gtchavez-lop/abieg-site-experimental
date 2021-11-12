<script>
	import dayjs from 'dayjs';
	import AdminPostCard from '../../../components/AdminPostCard.svelte';
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { supabase } from '../../../global';
	import { get, readable } from 'svelte/store';

	let loaded = false;
	let post_toggler = 1;
	let publicPost_Count = 0;
	let exclusivePost_Count = 0;
	let post_count = 0;

	const _blogs = readable(null, (set) => {
		supabase
			.from('posts')
			.select('*')
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				set(data);
				loaded = true;

				_posts = data;
				post_count = data.length;
				data.forEach((post) => {
					if (post.isExclusive) {
						exclusivePost_Count++;
					}
					if (!post.isExclusive) {
						publicPost_Count++;
					}
				});
			});

		const subscription = supabase
			.from('posts')
			.on('*', (payload) => {
				post_count = 0;
				publicPost_Count = 0;
				exclusivePost_Count = 0;

				if (payload.eventType === 'INSERT') {
					set([payload.new, ...get(_blogs)]);

					post_count = $_blogs.length;
					$_blogs.forEach((post) => {
						if (post.isExclusive) {
							exclusivePost_Count++;
						}
						if (!post.isExclusive) {
							publicPost_Count++;
						}
					});
				}
				if (payload.eventType === 'UPDATE') {
					let index = $_blogs.findIndex((thisblog) => thisblog.id === payload.new.id);
					let oldData = $_blogs;
					oldData[index] = payload.new;
					set(oldData);

					post_count = $_blogs.length;
					$_blogs.forEach((post) => {
						if (post.isExclusive) {
							exclusivePost_Count++;
						}
						if (!post.isExclusive) {
							publicPost_Count++;
						}
					});
				}
				if (payload.eventType === 'DELETE') {
					let oldData = $_blogs;
					console.log(oldData.filter((thisItem) => thisItem.id != payload.old.id));
					set(oldData.filter((thisItem) => thisItem.id != payload.old.id));

					$_blogs.forEach((post) => {
						if (post.isExclusive) {
							exclusivePost_Count++;
						}
						if (!post.isExclusive) {
							publicPost_Count++;
						}
					});
					post_count = $_blogs.length;
					$_blogs.forEach((post) => {
						if (post.isExclusive) {
							exclusivePost_Count++;
						}
						if (!post.isExclusive) {
							publicPost_Count++;
						}
					});
				}
			})
			.subscribe();
		return () => supabase.removeSubscription(subscription);
	});
</script>

<main in:fly={{ y: 20, duration: 500 }} class="text-white">
	<div class="container ">
		{#if $_blogs}
			<div class="row row-cols-md-3" in:fly={{ y: 20, duration: 500 }}>
				<div class="card border-3 rounded-3 shadow-sm">
					<div class="card-body">
						<h5>All Posts</h5>
						<h1 class="mt-4">{post_count}</h1>
						<i class="bi bi-eye" />
					</div>
				</div>
				<div class="card border-3 rounded-3 shadow-sm">
					<div class="card-body">
						<h5>Public Posts</h5>
						<h1 class="mt-4">{publicPost_Count}</h1>
						<i class="bi bi-globe2" />
					</div>
				</div>
				<div class="card border-3 rounded-3 shadow-sm">
					<div class="card-body">
						<h5>Exclusive Posts</h5>
						<h1 class="mt-4">{exclusivePost_Count}</h1>
						<i class="bi bi-file-lock" />
					</div>
				</div>
			</div>
		{/if}
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
							{#if $_blogs}
								{#each $_blogs as thispost}
									<AdminPostCard blog={thispost} />
								{/each}
							{/if}
						</div>
					</div>
				{/if}
				{#if post_toggler == 2}
					<div in:fly={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Public Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#if $_blogs}
								{#each $_blogs as thispost}
									{#if !thispost.isExclusive}
										<AdminPostCard blog={thispost} />
									{/if}
								{/each}
							{/if}
						</div>
					</div>
				{/if}
				{#if post_toggler == 3}
					<div in:fly={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Exclusive Posts Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#if $_blogs}
								{#each $_blogs as thispost}
									{#if thispost.isExclusive}
										<AdminPostCard blog={thispost} />
									{/if}
								{/each}
							{/if}
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
