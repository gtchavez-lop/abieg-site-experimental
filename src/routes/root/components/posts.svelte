<script context="module">
	export const prerender = true;
</script>

<script>
	import dayjs from 'dayjs';
	import AdminPostCard from '../../../components/AdminPostCard.svelte';
	import RootPostCard from '../../../components/Root_PostCard.svelte';
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { supabase } from '../../../global';
	import { get, readable, writable } from 'svelte/store';

	let loaded = false;
	let post_toggler = 1;
	let publicPost_Count = 0;
	let exclusivePost_Count = 0;
	let post_count = 0;

	$: publicBlogs = [];
	$: exclusiveBlogs = [];

	const _blogs = readable(null, (set) => {
		supabase
			.from('posts')
			.select('*')
			.order('created_at', { ascending: false })
			.then(({ data, error }) => {
				if (!error) {
					set(data);
					loaded = true;
					post_count = data.length;
					exclusivePost_Count = data.filter((x) => x.isExclusive).length;
					publicPost_Count = data.filter((x) => !x.isExclusive).length;
				}
			});

		const subscription = supabase
			.from('posts')
			.on('INSERT', (payload) => {
				set([payload.new, ...get(_blogs)]);
			})
			.on('UPDATE', (payload) => {
				let index = $_blogs.findIndex((thisblog) => thisblog.id === payload.new.id);
				let oldData = $_blogs;
				oldData[index] = payload.new;
				set(oldData);
			})
			.on('DELETE', (payload) => {
				let oldData = $_blogs;
				set(oldData.filter((thisItem) => thisItem.id != payload.old.id));
			})
			.on('*', () => {
				if ($_blogs) {
					post_count = $_blogs.length;
					exclusivePost_Count = $_blogs.filter((x) => x.isExclusive).length;
					publicPost_Count = $_blogs.filter((x) => !x.isExclusive).length;
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
			<div class="btn-group w-100" role="group" aria-label="Post Category">
				<input
					on:click={() => {
						post_toggler = 1;
					}}
					type="radio"
					class="btn-check"
					name="btnradio"
					id="btnradio1"
					checked={post_toggler == 1 ? true : false}
				/>
				<label class="btn btn-outline-light" for="btnradio1">All Posts</label>

				<input
					on:click={() => {
						post_toggler = 2;
					}}
					type="radio"
					class="btn-check"
					name="btnradio"
					id="btnradio2"
					checked={post_toggler == 2 ? true : false}
				/>
				<label class="btn btn-outline-light" for="btnradio2">Public Posts</label>

				<input
					on:click={() => {
						post_toggler = 3;
					}}
					type="radio"
					class="btn-check"
					name="btnradio"
					id="btnradio3"
					checked={post_toggler == 3 ? true : false}
				/>
				<label class="btn btn-outline-light" for="btnradio3">Exlusive Posts</label>
			</div>

			<div class="mt-3 ">
				{#if post_toggler == 1}
					<div in:fly|local={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">All Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#each $_blogs as blogData}
								<RootPostCard {blogData} />
								<!-- <AdminPostCard blog={thispost} /> -->
							{/each}
						</div>
					</div>
				{/if}
				{#if post_toggler == 2}
					<div in:fly|local={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Public Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#each $_blogs as thispost}
								{#if !thispost.isExclusive}
									<AdminPostCard blog={thispost} />
								{/if}
							{/each}
						</div>
					</div>
				{/if}
				{#if post_toggler == 3}
					<div in:fly|local={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Exclusive Posts Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#each $_blogs as thispost}
								{#if thispost.isExclusive}
									<AdminPostCard blog={thispost} />
								{/if}
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
