<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_account, global_posts } from '../../global';
</script>

<main class="white-text" in:fly={{ y: -20, duration: 500 }} out:fade={{ duration: 500 }}>
	<div class="container">
		<h1>Moderator Account</h1>
		<div class="container1 row blue-grey darken-4">
			<div class="col s12">
				<h5>Sign in your moderator account</h5>
			</div>
			<div class="col s12">
				<div class="row">
					<div class="col s12 l6 input-field">
						<input type="text" id="username" class="validate" />
						<label for="username">Moderator Username</label>
					</div>
					<div class="col s12 l6 input-field">
						<input type="text" id="password" class="validate" />
						<label for="password">Moderator Password</label>
					</div>
					<div class="col s12 center-align">
						<button class="btn grey black-text lighten-3 btn-large waves-effect waves-dark"
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
		font-family: 'Nunito';
		z-index: 3;
	}

	.container1 {
		padding-left: 1em;
		padding-right: 1em;
		border-radius: 10px;
	}
</style>
