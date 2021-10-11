<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_mod_account, global_account_data } from '../../global';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';

	let user = supabase.auth.user();
	// let in_username;
	// let in_password;

	// let signInMod = async (e) => {
	// 	let { data: moderators, error } = await supabase
	// 		.from('moderators')
	// 		.select('*')
	// 		.eq('username', in_username)
	// 		.eq('password', in_password);

	// 	// console.log(moderators[0]);
	// 	// console.log(error);
	// 	if (!moderators[0]) {
	// 		toast.push(`That user does not exist in the database`);
	// 	} else {
	// 		if (!error) {
	// 			delete moderators[0].password;
	// 			global_mod_account.set(moderators[0]);
	// 			localStorage.setItem('data_mod', JSON.stringify(moderators[0]));

	// 			toast.push(`You will be redirected to the dashboard`);
	// 			toast.push(`Welcome ${$global_mod_account.username}`);
	// 			setTimeout(() => {
	// 				location.href = './admin/dashboard';
	// 			}, 1000);
	// 		} else {
	// 			toast.push(`Something went wrong. Try again later`);
	// 		}
	// 	}
	// };

	onMount(async (e) => {
		if (supabase.auth.user().role == 'authenticated') {
			let user = supabase.auth.user();
			let { data, error } = await supabase.from('users').select('*').eq('id', user.id);
			if (data[0].isModerator == true) {
				goto('/admin/dashboard');
			}
		}
	});
</script>

<svele:head>
	<title>Moderator Sign In | Abie G</title>
</svele:head>
<SvelteToast option={{ duration: 1000 }} />

<main
	class="text-white"
	in:fly={{ y: -40, duration: 500, delay: 500 }}
	out:fly={{ y: 40, duration: 500 }}
>
	<div class="container">
		<p class="display-3">Moderator Account</p>

		{#if user}
			<div class="mt-5">
				<h3 class="mt-5">Sorry, you do not have any privilege to sign in a Moderator Account</h3>
				<p>Be active to be promoted</p>
				<p class="mt-5">
					If you are already a moderator, you will be redirected to the dashboard automatically
				</p>
			</div>
		{:else}
			<h3 class="mt-5">Sign in to access your moderator account</h3>
		{/if}

		<!-- <div class="row mt-5">
			<div class="col-sm-12 col-md-6">
				<div class="form-floating mb-3">
					<input
						bind:value={in_username}
						type="text"
						class="form-control bg-transparent text-white"
						id="mod_username"
					/>
					<label for="mod_username">Moderator Username</label>
				</div>
			</div>
			<div class="col-sm-12 col-md-6">
				<div class="form-floating mb-3">
					<input
						bind:value={in_password}
						type="password"
						class="form-control bg-transparent text-white"
						id="mod_password"
					/>
					<label for="mod_password">Moderator Password</label>
				</div>
			</div>
			<button on:click={signInMod} class="btn btn-primary mt-5"> Sign in as moderator </button>
		</div> -->
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
