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

			<!-- horizontal -->
			<div
				class="d-none d-lg-flex btn-group w-100"
				role="group"
				aria-label="Basic radio toggle button group"
			>
				<input
					type="radio"
					class="btn-check"
					name="btnradio"
					id="tab1"
					autocomplete="off"
					on:click={() => {
						activeTab = 1;
					}}
					checked={activeTab === 1 ? true : false}
				/>
				<label class="btn btn-outline-light" for="tab1">Overview</label>

				<input
					type="radio"
					class="btn-check"
					name="btnradio"
					id="tab2"
					autocomplete="off"
					on:click={() => {
						activeTab = 2;
					}}
					checked={activeTab === 2 ? true : false}
				/>
				<label class="btn btn-outline-light" for="tab2">Registered Members</label>

				<input
					type="radio"
					class="btn-check"
					name="btnradio"
					id="tab3"
					autocomplete="off"
					on:click={() => {
						activeTab = 3;
					}}
					checked={activeTab === 3 ? true : false}
				/>
				<label class="btn btn-outline-light" for="tab3">Moderators</label>

				<input
					type="radio"
					class="btn-check"
					name="btnradio"
					id="tab4"
					autocomplete="off"
					on:click={() => {
						activeTab = 4;
					}}
					checked={activeTab === 4 ? true : false}
				/>
				<label class="btn btn-outline-light" for="tab4">Moderator Request</label>

				<input
					type="radio"
					class="btn-check"
					name="btnradio"
					id="tab5"
					autocomplete="off"
					on:click={() => {
						activeTab = 5;
					}}
					checked={activeTab === 5 ? true : false}
				/>
				<label class="btn btn-outline-light" for="tab5">Posts</label>
			</div>

			<!-- vertical -->
			<div class="dropdown d-block d-lg-none">
				<button
					class="btn btn-secondary dropdown-toggle w-100"
					type="button"
					id="dashboardMenu"
					data-bs-toggle="dropdown"
					aria-expanded="false"
				>
					{activeTab === 1 ? 'Overview' : ''}
					{activeTab === 2 ? 'Registered Members' : ''}
					{activeTab === 3 ? 'Moderators' : ''}
					{activeTab === 4 ? 'Moderator Request' : ''}
					{activeTab === 5 ? 'Posts' : ''}
				</button>
				<ul class="dropdown-menu dropdown-menu-dark w-100" aria-labelledby="dashboardMenu">
					<li>
						<button
							on:click={() => {
								activeTab = 1;
							}}
							class="btn btn-outline-light w-100">Overview</button
						>
					</li>
					<li>
						<button
							on:click={() => {
								activeTab = 2;
							}}
							class="btn btn-outline-light w-100">Registered Users</button
						>
					</li>
					<li>
						<button
							on:click={() => {
								activeTab = 3;
							}}
							class="btn btn-outline-light w-100">Moderators</button
						>
					</li>
					<li>
						<button
							on:click={() => {
								activeTab = 4;
							}}
							class="btn btn-outline-light w-100">Moderator Requests</button
						>
					</li>
					<li>
						<button
							on:click={() => {
								activeTab = 5;
							}}
							class="btn btn-outline-light w-100">Posts</button
						>
					</li>
				</ul>
			</div>
		</div>

		<!-- overview -->
		{#if activeTab == 1}
			<svelte:component this={Overview} />
		{/if}
		{#if activeTab == 2}
			<svelte:component this={RegisteredUsers} />
		{/if}
		{#if activeTab == 3}
			<svelte:component this={Moderators} />
		{/if}
		{#if activeTab == 4}
			<svelte:component this={ModeratorRequest} />
		{/if}
		{#if activeTab == 5}
			<svelte:component this={Posts} />
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
