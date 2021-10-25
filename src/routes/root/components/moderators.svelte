<script>
	import dayjs from 'dayjs';

	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { supabase } from '../../../global';
	import RootModeratorsCard from '../../../components/Root_Moderators_Card.svelte';

	let _users = [];
	let loaded = false;

	onMount(async (e) => {
		let { data: users, error } = await supabase
			.from('users')
			.select('*')
			.filter('isModerator', 'eq', 'true');
		if (!error) {
			_users = users;
			setTimeout(() => {
				// console.log(users);
				loaded = true;
			}, 200);
		}
	});
</script>

<main in:fly={{ y: 20, duration: 500 }} class="text-white">
	<div class="container">
		<div class="card border-3 rounded-3 shadow-sm">
			<div class="card-body">
				<h5>Verified Moderators</h5>
				<h1 class="mt-4">{_users.length}</h1>
				<i class="bi bi-pencil-square" />
			</div>
		</div>
	</div>

	<div class="container mt-5">
		<p class="display-6">List of moderators</p>
		<div class="row row-cols-md-2">
			{#if loaded}
				{#each _users as thisuser, index}
					<RootModeratorsCard {thisuser} {index} />
				{/each}
			{:else}
				<div class="d-flex align-items-center">
					<strong>Loading...</strong>
					<div class="spinner-border ms-auto" role="status" aria-hidden="true" />
				</div>
			{/if}
		</div>
	</div>
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
				right: 0%;
				font-size: 10em;
			}
		}
	}
</style>
