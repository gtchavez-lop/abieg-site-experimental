<script>
	import { fly } from 'svelte/transition';
	import Moderators from './components/moderators.svelte';
	import Overview from './components/overview.svelte';
	import Posts from './components/posts.svelte';
	import RegisteredUsers from './components/registeredUsers.svelte';
	import ModeratorRequest from './components/moderatorRequest.svelte';
	import { onMount } from 'svelte';
	import { supabase } from '../../global';
	import { goto } from '$app/navigation';

	let activeTab = 1;

	let isAccessible = null;

	onMount(async (e) => {
		let user = await supabase.auth.user();

		if (user) {
			let { data, error } = await supabase.from('users').select('isAdmin').eq('id', user.id);
			// alert(JSON.stringify(data[0]));
			if (data[0].isAdmin) {
				isAccessible = true;
			} else {
				isAccessible = false;
				setTimeout(() => {
					goto('/');
				}, 2000);
			}
		} else {
			isAccessible = false;
			setTimeout(() => {
				goto('/');
			}, 2000);
		}
	});
</script>

{#if isAccessible}
	<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>
		<div class="container text-white">
			<p class="display-3">Root Dashboard</p>
			<div class="mt-2">
				<div
					class="btn-group d-none d-md-flex justify-content-center"
					role="group"
					aria-label="Basic outlined example"
				>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 1;
						}}>Overview</button
					>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 5;
						}}>Posts</button
					>
				</div>
				<div
					class="btn-group d-none d-md-flex justify-content-center"
					role="group"
					aria-label="Basic outlined example"
				>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 3;
						}}>Moderators</button
					>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 4;
						}}>Moderator Request</button
					>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 2;
						}}>Registered Members</button
					>
				</div>
				<div
					class="btn-group d-flex d-md-none justify-content-center"
					role="group"
					aria-label="Basic outlined example"
				>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 1;
						}}>Overview</button
					>
				</div>
				<div
					class="btn-group d-flex d-md-none justify-content-center"
					role="group"
					aria-label="Basic outlined example"
				>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 3;
						}}>Moderators</button
					>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 2;
						}}>Registered Members</button
					>
				</div>
				<div
					class="btn-group d-flex d-md-none justify-content-center"
					role="group"
					aria-label="Basic outlined example"
				>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 4;
						}}>Moderator Request</button
					>
					<button
						type="button"
						class="btn btn-outline-light"
						on:click={() => {
							activeTab = 5;
						}}>Posts</button
					>
				</div>
			</div>
		</div>

		<!-- overview -->
		{#if activeTab == 1}
			<Overview />
		{/if}
		{#if activeTab == 2}
			<RegisteredUsers />
		{/if}
		{#if activeTab == 3}
			<Moderators />
		{/if}
		{#if activeTab == 4}
			<ModeratorRequest />
		{/if}
		{#if activeTab == 5}
			<Posts />
		{/if}
	</main>
{:else if isAccessible == null}
	<main
		class="text-white d-flex flex-column align-items-center justify-content-center"
		style="margin-top: 0;"
		in:fly={{ y: -40, duration: 500, delay: 500 }}
		out:fly={{ y: 40, duration: 500 }}
	>
		<div class="spinner-border" role="status">
			<span class="visually-hidden">Loading...</span>
		</div>
	</main>
{:else if isAccessible == false}
	<main
		class="text-white d-flex flex-column align-items-center justify-content-center"
		style="margin-top: 0;"
		in:fly={{ y: -40, duration: 500, delay: 500 }}
		out:fly={{ y: 40, duration: 500 }}
	>
		<i class="bi bi-exclamation-diamond" style="font-size: 10rem;" />
		<p class="lead">You are not a root user to access this page</p>
	</main>
{/if}

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
</style>
