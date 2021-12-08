<script context="module">
	export const prerender = true;
</script>

<script>
	import dayjs from 'dayjs';
	import AdminPostCard from '../../../components/AdminPostCard.svelte';
	import RootPostCard from '../../../components/Root_PostCard.svelte';
	import { onMount } from 'svelte';
	import { fly, slide } from 'svelte/transition';
	import { supabase, _blogs } from '../../../global';
	import { get, readable, writable } from 'svelte/store';
	import AdminPostCardNew from '../../../components/AdminPostCard_New.svelte';

	let loaded = false;
	let post_toggler = 1;
	let publicPost_Count = 0;
	let exclusivePost_Count = 0;
	let post_count = 0;

	$: publicBlogs = [];
	$: exclusiveBlogs = [];

	onMount(async (e) => {
		if (get(_blogs)) {
			post_count = await get(_blogs).length;
			exclusivePost_Count = await $_blogs.filter((x) => x.isExclusive).length;
			publicPost_Count = await $_blogs.filter((x) => !x.isExclusive).length;
		}
		loaded = true;
	});
</script>

<main in:fly={{ y: 20, duration: 500 }} class="text-white">
	<div class="container ">
		{#await $_blogs then c}
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
		{/await}
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
							{#await $_blogs}
								<p>loading</p>
							{:then c}
								{#if c}
									{#each c as { id }, index}
										<div class="mb-2">
											<AdminPostCardNew {id} {index} />
										</div>
									{/each}
								{/if}
							{/await}
						</div>
					</div>
				{/if}
				{#if post_toggler == 2}
					<div in:fly|local={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Public Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#await $_blogs}
								<p>loading</p>
							{:then c}
								{#each c as { id, isExclusive }, index}
									{#if !isExclusive}
										<div class="mb-2">
											<AdminPostCardNew {id} {index} />
										</div>
									{/if}
								{/each}
							{/await}
						</div>
					</div>
				{/if}
				{#if post_toggler == 3}
					<div in:fly|local={{ y: 20, duration: 500 }}>
						<p class="display-5 mt-5">Exclusive Posts Posts</p>
						<div class="row row-cols-1 row-cols-md-2">
							{#await $_blogs}
								<p>loading</p>
							{:then c}
								{#each c as { id, isExclusive }, index}
									{#if isExclusive}
										<div class="mb-2">
											<AdminPostCardNew {id} {index} />
										</div>
									{/if}
								{/each}
							{/await}
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
