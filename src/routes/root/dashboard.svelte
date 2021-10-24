<script>
	import { fly } from 'svelte/transition';
	import Moderators from './components/moderators.svelte';
	import Overview from './components/overview.svelte';
	import Posts from './components/posts.svelte';
	import RegisteredUsers from './components/registeredUsers.svelte';

	let activeTab = 1;
</script>

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
						activeTab = 2;
					}}>Registered Members</button
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
					}}>Posts</button
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
						activeTab = 3;
					}}>Moderators</button
				>
				<button
					type="button"
					class="btn btn-outline-light"
					on:click={() => {
						activeTab = 4;
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
		<Posts />
	{/if}
</main>

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
</style>
