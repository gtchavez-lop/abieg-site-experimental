<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_mod_account, global_posts } from '../../global';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

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
			M.toast({ html: `That user does not exist` });
		} else {
			if (!error) {
				delete moderators[0].password;
				global_mod_account.set(moderators[0]);
				localStorage.setItem('data_mod', JSON.stringify(moderators[0]));
				M.toast({ html: `Welcome ${$global_mod_account.username}` });
				M.toast({ html: `You will be redirected to the dashboard` });
				setTimeout(() => {
					goto('admin/dashboard', { replaceState: true });
				}, 500);
			} else {
				M.toast({ html: `Something went wrong. Try again later` });
			}
		}
	};

	onMount((e) => {
		if (!$global_mod_account) {
			if (localStorage.getItem('data_mod') != '') {
				global_mod_account.set(JSON.parse(localStorage.getItem('data_mod')));
				goto('admin/dashboard');
			}
		}
	});
</script>

<main class="white-text" in:fly={{ y: -20, duration: 500 }} out:fly={{ y: 20, duration: 500 }}>
	<div class="container">
		<h1>Moderator Account</h1>
		<div class="container1 row blue-grey darken-4">
			<div class="col s12">
				<h5>Sign in your moderator account</h5>
			</div>
			<div class="col s12">
				<div class="row white-text">
					<div class="col s12 l6 input-field">
						<input bind:value={in_username} type="text" id="username" class="validate white-text" />
						<label for="username">Moderator Username</label>
					</div>
					<div class="col s12 l6 input-field">
						<input
							bind:value={in_password}
							type="password"
							id="password"
							class="validate white-text"
						/>
						<label for="password">Moderator Password</label>
					</div>
					<div class="col s12 center-align">
						<button
							on:click={signInMod}
							class="btn grey black-text lighten-3 btn-large waves-effect waves-dark"
							>Sign In</button
						>
					</div>
				</div>
			</div>
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

	.container1 {
		padding-left: 1em;
		padding-right: 1em;
		border-radius: 10px;
	}
</style>
