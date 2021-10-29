<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';
	import { supabase } from '../../../global';
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';
	import AdminPostCard from '../../../components/AdminPostCard.svelte';
	import AddStory from './components/AddStory.svelte';

	// component variables
	let hasBlog = null;
	let blogs;
	let tabActive = 2;
	let hasAccount;
	let user = supabase.auth.user();

	// methods
	onMount(async (e) => {
		if (supabase.auth.user()) {
			if (supabase.auth.user().role == 'authenticated') {
				let user = supabase.auth.user();
				let { data, error } = await supabase.from('users').select('*').eq('id', user.id);
				if (data[0].isModerator == true || data[0].isAdmin == true) {
					hasAccount = true;
				} else {
					goto('/admin');
				}
			}

			if (hasAccount) {
				const { data, error } = await supabase
					.from('posts')
					.select('*')
					.eq('author', user.email.split('@')[0]);

				hasBlog = null;
				if (error || data.length < 1) {
					hasBlog = false;
				}
				if (!error || data.length > 0) {
					blogs = data;
					hasBlog = true;
				}
			}
		} else {
			goto('/admin');
		}
	});
</script>

<svele:head>
	<title>Dashboard | Abie G</title>
</svele:head>
<SvelteToast options={{ duration: 1000 }} />
<main
	style="margin-bottom: 10em;"
	in:fly={{ y: -40, duration: 500, delay: 500 }}
	out:fly={{ y: 40, duration: 500 }}
>
	<div class="container text-white">
		<p class="display-3">Moderator Dashboard</p>

		<div class="btn-group mt-3 w-100">
			<button
				on:click={(e) => {
					tabActive = 1;
				}}
				type="button"
				class="btn btn-lg btn-outline-primary">Add a Story</button
			>
			<button
				on:click={(e) => {
					tabActive = 2;
				}}
				type="button"
				class="btn btn-lg btn-outline-primary">Your Stories</button
			>
		</div>

		<!-- tabs -->
		<div class="mt-5">
			<!-- add story -->
			{#if tabActive == 1}
				<AddStory {user} />
			{/if}
			<!-- view stories -->
			{#if tabActive == 2}
				<div in:fly={{ x: 20, duration: 500 }}>
					<p class="display-5">Your Stories</p>
					<div class="row text-white">
						{#if hasBlog == null}
							<div class="spinner-border text-info" role="status">
								<span class="visually-hidden">Loading...</span>
							</div>
						{/if}
						{#if !hasBlog || blogs.length < 1}
							<div class="col-12">
								<h5>Seems like its empty</h5>
								<p>Make one of your own</p>
							</div>
						{:else}
							<div class="col-12">
								<div class="mt-1 row row-cols-1 row-cols-md-2 g-3">
									{#each blogs as blog, index}
										<AdminPostCard {blog} {index} />
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
</style>
