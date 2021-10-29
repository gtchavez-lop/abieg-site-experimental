<script>
	import dayjs from 'dayjs';
	import { fly, slide, fade } from 'svelte/transition';
	import { supabase } from '../global';

	export let thisuser;
	export let index;
	let id = thisuser ? thisuser.id.toUpperCase() : '';

	let cardExpanded = false;
	let isPromote = false;
	let isDemote = false;
	let canBeDeleted = false;

	const promoteAccount = async (e) => {
		const { data, error } = await supabase
			.from('users')
			.update({ isModerator: 'true' })
			.eq('id', thisuser.id);

		if (!error) {
			console.log('Account Updated');
			window.location.reload();
		}
	};
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
	class="card rounded-3 shadow-sm card1 p-1 mb-2 bg-transparent"
	style="user-select: none;"
	in:fly={{ y: 20, duration: 500, delay: 100 + 50 * index }}
>
	<div class="card-body">
		<div class="d-flex text-center flex-column justify-content-center align-items-stretch">
			<p class="text-muted" style="font-size: 0.8em;">
				{id}
			</p>
			<p class="m-0">{thisuser.email}</p>
			<button
				class="btn link-secondary"
				on:click={() => {
					cardExpanded = !cardExpanded;
				}}
			>
				{#if cardExpanded}
					<i class="bi bi-arrow-up" />
					Hide Details
				{:else}
					<i class="bi bi-arrow-down" />
					Show Details
				{/if}
			</button>

			{#if cardExpanded}
				<div transition:slide={{ duration: 200 }}>
					<p class="display-6 m-0 mt-5">{thisuser.given_name} {thisuser.family_name}</p>
					<p class="m-0">
						{dayjs(thisuser.birthdate).format('MMMM DD, YYYY')} -
						<span class="text-success">{dayjs().diff(thisuser.birthdate, 'year')} year old </span>
						<span>{thisuser.gender}</span>
					</p>
					<p class="m-0 mt-4 ">{thisuser.shipping_address}</p>

					{#if thisuser.isModerator}
						<p class=" mt-4">Moderator Account</p>
						{#if isDemote == true}
							<div
								in:fade={{ duration: 200 }}
								out:slide={{ duration: 200 }}
								class="d-flex flex-column"
							>
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
							<div
								in:fade={{ duration: 200 }}
								out:slide={{ duration: 200 }}
								class="d-flex flex-column"
							>
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
					{:else}
						<p class=" mt-4">Standard Account</p>
						{#if isPromote == true}
							<div
								in:fade={{ duration: 200 }}
								out:slide={{ duration: 200 }}
								class="d-flex flex-column"
							>
								<p>Do you want to promote this account to a Moderator?</p>
								<div class="btn-group" role="group" aria-label="">
									<button on:click={promoteAccount} type="button" class="btn btn-outline-primary"
										>Yes</button
									>
									<button
										on:click={() => {
											isPromote = !isPromote;
										}}
										type="button"
										class="btn btn-outline-danger">No</button
									>
								</div>
							</div>
						{:else}
							<div
								in:fade={{ duration: 200 }}
								out:slide={{ duration: 200 }}
								class="d-flex flex-column"
							>
								<button
									on:click={() => {
										isPromote = !isPromote;
									}}
									class="btn btn-outline-success"
								>
									<i class="bi bi-arrow-up me-2" />
									Promote to Moderator
								</button>
							</div>
						{/if}
					{/if}

					<div class="d-flex flex-column mt-3">
						<button class="btn btn-danger" disabled={!canBeDeleted ? true : false}
							>Remove Account</button
						>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
