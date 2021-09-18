<script>
	import { fly, fade, slide } from 'svelte/transition';
	import { expoIn, expoOut, expoInOut } from 'svelte/easing';
	import Footer from '../components/Footer.svelte';
	import Marquee from 'svelte-marquee';

	const clippingPathIn = (node, params) => {
		return {
			delay: 1000,
			duration: 500,
			css: (t) => `clip-path: circle(${expoOut(t) * 120}% at 100% 0%);`
		};
	};

	let isRegister = false;
	let isModerator = false;

	const toggleCards = (e) => {
		isRegister ? (isRegister = false) : (isRegister = true);
	};
	const toggleModerator = (e) => {
		isModerator ? (isModerator = false) : (isModerator = true);
	};
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container" in:clippingPathIn>
		{#if !isRegister && !isModerator}
			<div class="card" transition:slide|local={{ duration: 500 }}>
				<h1>Sign In to your account</h1>
				<input type="email" placeholder="Your Email here" />
				<input type="password" placeholder="Your Password here" />
				<button><span class="material-icons-round"> person </span>Log In</button>
				<p class="toggler" on:click={toggleCards}>Don't have an account? <b>Click Me</b></p>
				<p class="toggler" on:click={toggleModerator}>Moderator Sign in</p>
			</div>
		{/if}
		{#if isRegister}
			<div class="card" transition:slide|local={{ duration: 500 }}>
				<h1>Register an account</h1>
				<input type="email" placeholder="Your Email here" />
				<input type="password" placeholder="Your Password here" />
				<button><span class="material-icons-round"> person_add_alt </span>Register Now</button>

				<p class="toggler" on:click={toggleCards}>Are you an existing User? <b>Click Me</b></p>
			</div>
		{/if}
		{#if isModerator}
			<div class="card" transition:slide|local={{ duration: 500 }}>
				<h1>Sign in as a moderator</h1>
				<input type="email" placeholder="Your Email here" />
				<input type="password" placeholder="Your Password here" />
				<button><span class="material-icons-round"> person_add_alt </span>Moderator Sign In</button>

				<p class="toggler" on:click={toggleModerator}>Are you follower? <b>Click Me</b></p>
			</div>
		{/if}
	</div>
	<div class="scroller">
		<Marquee reverse="true" content="MAKE THE MOST OUT OF IT" />
		<Marquee reverse="true" content="MAKE THE MOST OUT OF IT" />
	</div>
</main>

<Footer />

<style>
	main {
		min-height: 100vh;
		background: #1b1b1b;
		font-family: 'Nunito';
		color: #f2f2f2;
		display: flex;
		justify-content: center;
	}
	.container {
		min-width: 80vw;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
	}
	.container h1 {
		margin: 0;
		margin-bottom: 1em;
		margin-top: 0.5em;
	}
	@media screen and (max-width: 800px) {
		.container {
			min-width: 90vw;
		}
	}
	input {
		border: none;
		background: #1b1b1b;
		outline: none;
		padding: 1em;
		font-size: 1rem;
		margin-bottom: 10px;
		color: white;
		border: #4f56b6 solid 0.2rem;
		border-radius: 10px;
		padding-left: 3em;
		transition: 200ms ease all;
	}
	button {
		border: none;
		background: #4f56b6;
		outline: none;
		padding: 1em;
		font-family: 'Nunito';
		font-size: 1rem;
		margin-top: 50px;
		font-weight: 700;
		color: white;
		border-radius: 10px;
		transition: 200ms ease all;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}
	button span {
		margin-right: 10px;
	}
	button:hover {
		margin-top: 40px;
		margin-bottom: 10px;
	}
	button:active {
		transition: 0ms ease all;
		transform: scale(0.95);
	}
	input::placeholder {
		position: absolute;
		color: white;
		opacity: 0.8;
		transition: 200ms ease all;
	}
	input:focus {
		padding-top: 2.5em;
	}
	input:focus::placeholder {
		margin-top: -25px;
	}
	.toggler {
		margin: 0;
		margin-top: 25px;
		margin-bottom: 10px;
		font-weight: 700;
		cursor: pointer;
		text-align: center;
	}
	.card {
		width: 700px;
		padding: 1em;
		border: #f88dad solid 0.2rem;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
		z-index: 3;
		color: white;
		backdrop-filter: blur(5px);
	}
	@media screen and (max-width: 800px) {
		.card {
			width: 90%;
		}
	}

	.scroller {
		width: 120%;

		position: fixed;
		bottom: -15%;
		left: -10%;
		color: white;
		opacity: 0.2;
		font-size: 10rem;
		font-family: 'XoloniumRegular';
		transform: rotate(-10deg);
		user-select: none;
	}
</style>
