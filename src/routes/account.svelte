<script>
	import { fly, fade, slide } from 'svelte/transition';
	import { expoIn, expoOut, expoInOut } from 'svelte/easing';

	import Footer from '../components/Footer.svelte';
	import Marquee from 'svelte-marquee';
	import { onMount, tick } from 'svelte';

	// const clippingPathIn = (node, params) => {
	// 	return {
	// 		delay: 1000,
	// 		duration: 500,
	// 		css: (t) => `clip-path: circle(${expoOut(t) * 120}% at 100% 0%);`
	// 	};
	// };

	let isRegister = false;
	let birhtdate;

	const toggleCards = (e) => {
		isRegister ? (isRegister = false) : (isRegister = true);
	};
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<!-- {#if !isRegister} -->
	<div
		class="container white-text"
		style="border-radius:10px"
		transition:slide|local={{ duration: 500 }}
	>
		<h2>Your Account</h2>
		<div class="container1 blue-grey darken-4">
			<div class="row">
				<div class="col">
					<h4>Sign in to your account</h4>
				</div>
			</div>
			<div class="row">
				<div class="input-field col s12 m6 white-text">
					<i class="material-icons prefix">email</i>
					<input id="email" type="text" class="validate  white-text" />
					<label for="email">Email Address</label>
				</div>
				<div class="input-field col s12 m6 white-text">
					<i class="material-icons prefix">password</i>
					<input id="password" type="text" class="validate  white-text" />
					<label for="password">Password</label>
				</div>
			</div>
			<div class="row center-align">
				<div class="col s12">
					<button class="waves-effect waves-light btn-large pink darken-4 "
						>Sign In<i class="material-icons right">send</i></button
					>
				</div>
				{#if !isRegister}
					<div class="col s12">
						<p on:click={toggleCards} style="cursor:pointer;">Don't have an account? Click Me</p>
					</div>
				{/if}
			</div>
			<div class="row" />
		</div>
		<!-- {/if} -->
		{#if isRegister}
			<div
				class="container1 white-text blue-grey darken-4 z-depth-1"
				style="border-radius:10px"
				transition:slide|local={{ duration: 500 }}
			>
				<div class="row">
					<div class="col">
						<div class="container" />
						<h4>Join with us</h4>
					</div>
				</div>
				<div class="row">
					<div class="col s12">
						<h6>User Account</h6>
					</div>
					<div class="input-field col s12 m6 white-text">
						<input id="email" type="email" class="white-text validate" />
						<label for="email">Your Email Adress</label>
					</div>
					<div class="input-field col s12 m6 white-text">
						<input id="password" type="password" class="white-text" />
						<label for="password">Your Password</label>
					</div>
				</div>
				<div class="row">
					<div class="col s12">
						<h6>Basic Information</h6>
					</div>
					<div class="input-field col s12 m6 white-text">
						<input id="given_name" type="text" class="white-text" />
						<label for="given_name">Your Given Name</label>
					</div>
					<div class="input-field col s12 m6 white-text">
						<input id="family_name" type="text" class="white-text" />
						<label for="family_name">Your Family Name</label>
					</div>

					<!-- birthdate -->
					<div class="input-field col s3 m4 white-text">
						<input id="birthdate" type="number" min="1" max="31" class="white-text" />
						<label for="birthdate">Birth Day</label>
					</div>
					<div class="input-field col s5 m4 white-text">
						<input id="birthdate" type="text" class="white-text" />
						<label for="birthdate">Birth Month Name</label>
					</div>
					<div class="input-field col s4 m4 white-text">
						<input id="birthdate" type="number" min="1900" max="2009" class="white-text" />
						<label for="birthdate">Birth Year</label>
					</div>

					<div class="input-field col s12 white-text">
						<input id="shipAddress" type="number" min="1900" max="2009" class="white-text" />
						<label for="shipAddress">Phone Number</label>
					</div>
					<!-- identity -->
					<div class="input-field col s12 m5 white-text">
						<p>
							<label class="center-align">
								<input class="with-gap" name="group1" type="radio" />
								<span>Male</span>
							</label>
						</p>
						<p>
							<label class="center-align">
								<input class="with-gap" name="group1" type="radio" />
								<span>Female</span>
							</label>
						</p>
						<p>
							<label class="center-align">
								<input class="with-gap" name="group1" type="radio" />
								<span>Non-binary</span>
							</label>
						</p>
						<p>
							<label class="center-align">
								<input class="with-gap" name="group1" type="radio" />
								<span>Attack Helicopter</span>
							</label>
						</p>
					</div>

					<div class="input-field col s12 white-text">
						<input id="shipAddress" type="number" min="1900" max="2009" class="white-text" />
						<label for="shipAddress">Shipping Address</label>
					</div>
				</div>
				<div class="row center-align">
					<div class="col s12">
						<button class="waves-effect waves-light btn-large deep-orange darken-4 "
							>Register<i class="material-icons right">person_add</i></button
						>
					</div>
				</div>
				<div class="row" />
			</div>
		{/if}
		<div class="row">
			<div class="col" />
		</div>
	</div>
</main>
<div class="scroller">
	<Marquee autoplay="true" reverse="true" content="MAKE THE MOST OUT OF IT" />
	<Marquee autoplay="true" reverse="true" content="MAKE THE MOST OUT OF IT" />
</div>

<Footer />

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
	/* main {
		min-height: 100vh;
		background: #1b1b1b;
		font-family: 'Nunito';
		color: #1b1b1b;
		display: flex;
		justify-content: center;
	} */
	/* .formContainer {
		min-width: 80vw;
		display: flex;
		margin-top: 150px;
		flex-direction: column;
		align-items: center;
		margin-bottom: 100px;
		background: transparent;
	} */
	/* .formContainer h1 {
		margin: 0;
		margin-bottom: 1em;
		margin-top: 0.5em;
	}
	@media screen and (max-width: 800px) {
		.formContainer {
			min-width: 90vw;
		}
	} */
	/* input {
		border: none;
		background: #1b1b1b;
		outline: none;
		padding: 1em;
		font-size: 1rem;
		margin-bottom: 10px;
		color: white;
		border: #4f56b6 solid 0.2rem;
		border-radius: 10px;
		padding-left: 2em;
		margin-right: 10px;
		margin-left: 10px;
		width: 100%;
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
	button b {
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
	.card span {
		display: flex;
		justify-content: space-between;
	}
	@media screen and (max-width: 800px) {
		.card {
			width: 90%;
		}
		.card span {
			flex-direction: column;
			align-items: center;
			width: 90%;
			margin: 0 auto;
		}
	}
 */
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
		z-index: 1;
	}
</style>
