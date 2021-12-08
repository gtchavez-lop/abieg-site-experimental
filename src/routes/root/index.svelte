<script>
	import { goto } from '$app/navigation';

	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { supabase, global_account_data, global_account } from '../../global';

	let user,
		_status = 'Please standby as we check for an existing account',
		_isValidated = false;

	onMount(async (e) => {
		user = await supabase.auth.user();
		if (user) {
			setTimeout(async () => {
				_status = 'Account detected';
				let { data: users, error } = await supabase.from('users').select('*').eq('id', user.id);
				setTimeout(() => {
					// console.log(users);
					if (users[0].isAdmin) {
						_status = 'Redirecting to dashboard';
						setTimeout(() => {
							goto('/root/dashboard');
						}, 2000);
					} else {
						_status = 'Account is not authorized to proceed further. Redirecting to home page';
						setTimeout(() => {
							goto('/');
						}, 2000);
					}
				}, 1000);
			}, 1000);
		} else {
			_status = 'Account cannot be verified';
			setTimeout(() => {
				goto('/');
			}, 1000);
		}
	});
</script>

<SvelteToast options={{ duration: 4000 }} />
<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>
	<div class="container text-white">
		<h1 class="display-3">Root User Access</h1>
		<div
			style="margin-top: 25vh;"
			class="d-flex flex-column align-items-center justify-content-center"
		>
			<p>{_status}</p>
			<div class="spinner-border" role="status">
				<span class="visually-hidden">Loading...</span>
			</div>
		</div>
	</div>
</main>

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
</style>
