<script>
	import { fly, fade, slide } from 'svelte/transition';
	export let thisuser, index;
	let id = thisuser ? thisuser.id.toUpperCase() : '';
	let username = thisuser.email.split('@')[0];

	let isDemote = false;
	const demoteAccount = async (e) => {
		const { data, error } = await supabase
			.from('users')
			.update({ isModerator: 'false' })
			.eq('id', thisuser.id);

		if (!error) {
			console.log('Account Updated');
			window.location.reload();
		}
	};
</script>

<div
	class="card rounded-3 shadow-sm card1 mb-2 bg-transparent"
	in:fly={{ y: 20, duration: 500, delay: 100 + 50 * index }}
>
	<div class="card-body">
		<div class="row row-cols-1" style="font-size: 0.8em;">
			<p class="text-muted col-12 text-center">{id}</p>
			<p class="m-0 text-center text-primary fs-6">{thisuser.given_name} {thisuser.family_name}</p>
			<p class="display-6 text-center m-0 mb-4">{username}</p>

			{#if isDemote == true}
				<div in:fade={{ duration: 200 }} out:slide={{ duration: 200 }} class="d-flex flex-column">
					<p>Do you want to demote this account to a Standard Account?</p>
					<div class="btn-group" role="group" aria-label="">
						<button on:click={demoteAccount} type="button" class="btn btn-outline-primary"
							>Yes</button
						>
						<button
							on:click={() => {
								isDemote = !isDemote;
							}}
							type="button"
							class="btn btn-outline-danger">No</button
						>
					</div>
				</div>
			{:else}
				<div in:fade={{ duration: 200 }} out:slide={{ duration: 200 }} class="d-flex flex-column">
					<button
						on:click={() => {
							isDemote = !isDemote;
						}}
						class="btn btn-outline-warning"
					>
						<i class="bi bi-arrow-down me-2" />
						Demote to Standard
					</button>
				</div>
			{/if}
		</div>
	</div>
</div>
