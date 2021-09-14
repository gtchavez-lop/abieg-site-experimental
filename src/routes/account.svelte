<script>
	import { fly, fade, slide } from 'svelte/transition';
	import Footer from '../components/Footer.svelte';

	let isRegister = false;

	const toggleCards = (e) => {
		isRegister ? (isRegister = false) : (isRegister = true);
	};
</script>

<main transition:fade={{ duration: 200 }}>
	<div class="container" in:fly|local={{ y: -20, duration: 500, delay: 200 }}>
		{#if !isRegister}
			<div class="card" transition:slide|local={{ duration: 500 }}>
				<h1>Sign In to your account</h1>
				<input type="email" placeholder="Your Email here" />
				<input type="password" placeholder="Your Password here" />
				<button><span class="material-icons-round"> person </span>Log In</button>
				<p class="toggler" on:click={toggleCards}>Don't have an account? <b>Click Me</b></p>
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
	</div>
</main>

<Footer />

<style>
	main {
		min-height: 100vh;
		background: #1b1b1b;
		font-family: 'Lato';
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
		color: #1b1b1b;
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
		font-family: 'Lato';
		font-size: 1rem;
		margin-bottom: 10px;
		color: white;
		border-radius: 10px;
		padding-left: 3em;
		transition: 200ms ease all;
	}
	button {
		border: none;
		background: #4f56b6;
		outline: none;
		padding: 1em;
		font-family: 'Lato';
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
		color: #1b1b1b;
		font-weight: 700;
		cursor: pointer;
		text-align: center;
	}
	.card {
		width: 700px;
		padding: 1em;
		background: #f88dad;
		border-radius: 10px;
		display: flex;
		flex-direction: column;
	}
	@media screen and (max-width: 800px) {
		.card {
			width: 100%;
		}
	}
</style>
