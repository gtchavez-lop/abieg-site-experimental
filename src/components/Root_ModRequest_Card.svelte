<script>
	import { fly, slide, fade } from 'svelte/transition';
	import { supabase } from '../global';

	export let thisuser, index;

	const approveModRequest = async (e) => {
		let { data, error } = await supabase
			.from('users')
			.update({ isRequestingModAccount: 'false', isModerator: 'true' })
			.eq('id', thisuser.id);
		if (!error) {
			location.reload();
		}
	};
</script>

<div
	class="card rounded-3 shadow-sm card1 p-1 mb-2 bg-transparent"
	style="user-select: none;"
	in:fly={{ y: 20, duration: 500, delay: 100 + 50 * index }}
>
	<div class="card-body">
		<div class="d-flex align-items-center justify-content-between">
			<p class="m-0 d-flex align-items-center">{thisuser.email}</p>
			<button on:click={approveModRequest} class="btn btn-success">Approve</button>
		</div>
	</div>
</div>
