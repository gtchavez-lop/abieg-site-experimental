<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_mod_account, global_posts } from '../../global';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';

	let in_username;
	let in_password;

	let signInMod = async (e) => {
		let { data: moderators, error } = await supabase
			.from('moderators')
			.select('*')
			.eq('username', in_username)
			.eq('password', in_password);

		// console.log(moderators[0]);
		// console.log(error);
		if (!moderators[0]) {
			toast.push(`That user does not exist in the database`);
		} else {
			if (!error) {
				delete moderators[0].password;
				global_mod_account.set(moderators[0]);
				localStorage.setItem('data_mod', JSON.stringify(moderators[0]));

				toast.push(`You will be redirected to the dashboard`);
				toast.push(`Welcome ${$global_mod_account.username}`);
				setTimeout(() => {
					location.href = './admin/dashboard';
				}, 1000);
			} else {
				toast.push(`Something went wrong. Try again later`);
			}
		}
	};

	onMount((e) => {
		if (!$global_mod_account) {
			if (localStorage.getItem('data_mod') !== null) {
				global_mod_account.set(JSON.parse(localStorage.getItem('data_mod')));
				location.href = './admin/dashboard';
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

		<div class="row mt-5">
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
		</div>
		<p>*Moderator accounts are only generated from verified community members</p>
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
