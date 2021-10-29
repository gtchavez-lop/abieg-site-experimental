<script>
	import { onMount } from 'svelte';

	import { fly } from 'svelte/transition';
	import { supabase } from '../../../global';
	import RootModRequestCard from '../../../components/Root_ModRequest_Card.svelte';

	let _users = [];

	onMount(async (e) => {
		let { data: users, error } = await supabase
			.from('users')
			.select('*')
			.eq('isRequestingModAccount', 'true');

		if (!error) {
			_users = users;
		}
	});
</script>

<main in:fly={{ y: 20, duration: 500 }} class="text-white">
	<div class="container">
		<div class="card border-3 rounded-3 shadow-sm">
			<div class="card-body">
				<h5>Moderator Request</h5>
				<h1 class="mt-4">{_users.length}</h1>
				<i class="bi bi-arrow-up-right-circle" />
			</div>
		</div>
	</div>
	<div class="container mt-5">
		<h5>All Requests</h5>
		{#each _users as thisuser, index}
			<RootModRequestCard {thisuser} {index} />
		{/each}
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
