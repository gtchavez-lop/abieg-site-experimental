<script>
	import { fly, fade, slide } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
	import { Datepicker } from 'svelte-calendar';
	import dayjs from 'dayjs';
	import { supabase, global_account, HASH_KEY } from '../global';
	import cryptojs from 'crypto-js';
	import { onMount } from 'svelte';

	let isRegister = false;
	let birthdate;
	let confirmLogout = false;
	let logInStatus;
	let login_email;
	let login_password;
	let reg_email;
	let reg_password;
	let reg_givenName;
	let reg_familyName;
	let reg_gender;
	let reg_address;

	const theme = {
		calendar: {
			width: '700px',
			maxWidth: '100vw',
			legend: {
				height: '35px'
			},
			shadow: 'none',
			colors: {
				text: {
					primary: '#eee',
					highlight: '#fff'
				},
				background: {
					primary: '#1B1B1B',
					highlight: '#EB6F95',
					hover: '#263238'
				},
				border: '#222'
			},
			font: {
				regular: '1.5em',
				large: '5em'
			},
			grid: {
				disabledOpacity: '.5',
				outsiderOpacity: '.2'
			}
		}
	};

	const toggleCards = (e) => {
		isRegister ? (isRegister = false) : (isRegister = true);
	};

	const login_emailPass = async (e) => {
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('email', login_email)
			.eq('password', login_password);
		if (!error) {
			delete data[0].password;
			global_account.set(data[0]);
			localStorage.setItem('data', JSON.stringify(data[0]));
			M.toast({ html: `Hello, ${$global_account.given_name} ${$global_account.family_name}` });
		} else {
			M.toast({ html: `Email or Password incorrect.` });
		}
	};

	const registerUser = async (e) => {
		if (reg_email != '') {
			const { data, error } = await supabase.from('users').insert([
				{
					given_name: reg_givenName,
					family_name: reg_familyName,
					email: reg_email,
					password: reg_password,
					birthdate: dayjs($birthdate.selected).format('YYYY-MM-DD'),
					gender: reg_gender,
					shipping_address: reg_address
				}
			]);

			if (error) {
				M.toast({ html: 'Something went wrong. Try again' });
			} else {
				login_email = reg_email;
				isRegister = false;
				reg_gender = null;
				reg_givenName = null;
				reg_familyName = null;
				reg_password = null;
				reg_email = null;
				$birthdate.set(null);
				M.toast({ html: 'Registration Successful, please login ' });
			}
		} else {
			M.toast({ html: 'Please enter all required fields' });
		}
	};

	const logout = (e) => {
		login_email = '';
		login_password = '';
		global_account.set(null);
		localStorage.setItem('data', '');
		confirmLogout = false;
	};
	const logoutConfirm = (e) => {
		if (confirmLogout) {
			confirmLogout = false;
		} else {
			confirmLogout = true;
		}
	};

	onMount((e) => {
		let data = localStorage.getItem('data');
		data ? global_account.set(JSON.parse(data)) : global_account.set(null);
	});
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<!-- {#if !isRegister} -->

	<div
		class="container white-text"
		style="border-radius:10px"
		transition:slide|local={{ duration: 500 }}
	>
		<h2>Your Account</h2>

		{#if !$global_account}
			<div class="row container1 center-align " in:fly|local={{ y: -40, duration: 500 }}>
				<div class="col s12 m5 ">
					<div class="imageContainer">
						<img src="./illustrations/undraw_profile_image_re_ic2f.svg" width="250" alt="" />
					</div>
				</div>
				<div class="col s12 m7 container1 blue-grey darken-4 z-depth-1">
					<div class="">
						<h4>Sign in to your account</h4>
					</div>
					<div class="input-field col s12 white-text">
						<i class="material-icons prefix">email</i>
						<input id="email" bind:value={login_email} type="email" class="validate  white-text" />
						<label for="email">Email Address</label>
					</div>
					<div class="input-field col s12 white-text">
						<i class="material-icons prefix">password</i>
						<input
							id="password"
							bind:value={login_password}
							type="password"
							class="validate  white-text"
						/>
						<label for="password">Password</label>
					</div>

					<div class="col s12 center-align">
						<button
							on:click={login_emailPass}
							class="waves-effect waves-light btn-large pink darken-4 "
							>Sign In<i class="material-icons right">east</i></button
						>
					</div>
				</div>
			</div>
			<div class="row center-align" in:fly|local={{ y: -40, duration: 500, delay: 200 }}>
				{#if !isRegister}
					<div class="col s12 blue-grey darken-3 z-depth-1" style="border-radius: 10px;">
						<p on:click={toggleCards} style="cursor:pointer;">Don't have an account? Click Me</p>
					</div>
				{/if}
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
							<input
								bind:value={reg_email}
								id="reg_email"
								type="email"
								class="white-text validate"
							/>
							<label for="reg_email">Your Email Adress</label>
						</div>
						<div class="input-field col s12 m6 white-text">
							<input
								bind:value={reg_password}
								id="reg_password"
								type="password"
								class="white-text"
							/>
							<label for="reg_password">Your Password</label>
						</div>
					</div>
					<div class="row">
						<div class="col s12">
							<h6>Basic Information</h6>
						</div>
						<div class="input-field col s12 m6 white-text">
							<input bind:value={reg_givenName} id="given_name" type="text" class="white-text" />
							<label for="given_name">Your Given Name</label>
						</div>
						<div class="input-field col s12 m6 white-text">
							<input bind:value={reg_familyName} id="family_name" type="text" class="white-text" />
							<label for="family_name">Your Family Name</label>
						</div>

						<!-- birthdate -->
						<!-- <div class="input-field col s3 m4 white-text">
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
						</div> -->
						<div class="col s12 white-text valign-wrapper">
							<label style="font-size: 1em; margin-right: 1em;" for="">Birth Date</label>
							<Datepicker bind:store={birthdate} {theme} let:key let:send let:receive>
								<button
									class="waves-effect waves-light btn blue-grey darken-3"
									in:receive|local={{ key }}
									out:send|local={{ key }}
								>
									{#if $birthdate?.hasChosen}
										{dayjs($birthdate.selected).format('YYYY-MM-DD')}
									{:else}
										When is your birthday?
									{/if}
								</button>
							</Datepicker>
							<!-- <p>{$birthdate?.selected}</p> -->
						</div>

						<div class="input-field col s12 white-text">
							<input id="phoneNumber" type="number" min="1900" max="2009" class="white-text" />
							<label for="phoneNumber">Phone Number</label>
						</div>
						<!-- identity -->
						<div class="input-field col s12 m5 white-text">
							<p>
								<label class="center-align">
									<input
										class="with-gap"
										bind:group={reg_gender}
										value="male"
										name="group1"
										type="radio"
									/>
									<span>Male</span>
								</label>
							</p>
							<p>
								<label class="center-align">
									<input
										class="with-gap"
										bind:group={reg_gender}
										value="female"
										name="group1"
										type="radio"
									/>
									<span>Female</span>
								</label>
							</p>
							<p>
								<label class="center-align">
									<input
										class="with-gap"
										bind:group={reg_gender}
										value="nonBinary"
										name="group1"
										type="radio"
									/>
									<span>Non-binary</span>
								</label>
							</p>
							<!-- <p>
								<label class="center-align">
									<input class="with-gap" name="group1" type="radio" />
									<span>Attack Helicopter</span>
								</label>
							</p> -->
						</div>

						<div class="input-field col s12 white-text">
							<input id="shipAddress" bind:value={reg_address} type="text" class="white-text" />
							<label for="shipAddress">Shipping Address</label>
						</div>
					</div>
					<div class="row center-align">
						<div class="col s12">
							<button
								on:click={registerUser}
								class="waves-effect waves-light btn-large deep-orange darken-4 "
								>Register<i class="material-icons right">person_add</i></button
							>
						</div>
					</div>
					<div class="row" />
				</div>
			{/if}
		{/if}

		{#if $global_account}
			<div class="row pink darken-4 container1" style="margin-top: 5em;">
				<div class="col s12">
					<div class="row valign-wrapper">
						<!-- account ID -->
						<div class="col s12 m3">
							<h6>Account ID:</h6>
						</div>
						<div class="col s12 m9">
							<h6>{$global_account.id.toUpperCase()}</h6>
						</div>
					</div>
					<div class="row valign-wrapper">
						<!-- account holder -->
						<div class="col s12 m3">
							<h6>Account Holder:</h6>
						</div>
						<div class="col s12 m9">
							<h6>{$global_account.given_name} {$global_account.family_name}</h6>
						</div>
					</div>
					<div class="row valign-wrapper">
						<!-- account email -->
						<div class="col s12 m3">
							<h6>Account Email:</h6>
						</div>
						<div class="col s12 m9">
							<h6>{$global_account.email}</h6>
						</div>
					</div>
					<div class="row valign-wrapper" style="margin-top: 4em;">
						<!-- birthdate -->
						<div class="col s12 m3">
							<h6>Birthdate:</h6>
						</div>
						<div class="col s12 m9">
							<h6>{$global_account.birthdate}</h6>
						</div>
					</div>
					<div class="row valign-wrapper">
						<!-- gender -->
						<div class="col s12 m3">
							<h6>Gender:</h6>
						</div>
						<div class="col s12 m9">
							<h6>{$global_account.gender.toUpperCase()}</h6>
						</div>
					</div>
					<div class="row valign-wrapper">
						<!-- shipping Address -->
						<div class="col s12 m3">
							<h6>Shipping Address:</h6>
						</div>
						<div class="col s12 m9">
							<h6>{$global_account.shipping_address}</h6>
						</div>
					</div>
				</div>
			</div>
			<div class="row" style="margin-top: 5em;" in:fly|local={{ y: -40, duration: 500 }}>
				{#if !confirmLogout}
					<div class="row center-align">
						<div
							in:fly|local={{ y: -20, duration: 500 }}
							on:click={logoutConfirm}
							class="btn btn-large waves-effect waves-light red lighten-1 right"
						>
							Log Out
						</div>
					</div>
				{:else}
					<div class="row right-align">
						<div class="col s2 offset-s8">
							<button
								on:click={logout}
								in:fly|local={{ x: 20, duration: 500, delay: 400 }}
								class="btn btn-large waves-effect waves-light red lighten-1"
							>
								Yes
							</button>
						</div>
						<div class="col s2 ">
							<button
								on:click={logoutConfirm}
								in:fly|local={{ x: 20, duration: 500, delay: 200 }}
								class="btn btn-large waves-effect waves-light blue lighten-1"
							>
								No
							</button>
						</div>
						<div class="col s12">
							<h4 in:fly|local={{ x: 20, duration: 500 }}>Do you really want to logout?</h4>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<div class="row">
			<div class="col" />
		</div>
	</div>
</main>
<div class="scroller" transition:fade={{ duration: 500 }}>
	<MarqueeTextWidget duration={15}
		>BE ACTIVE WITH ABIE G &nbsp;BE ACTIVE WITH ABIE G &nbsp;BE ACTIVE WITH ABIE G &nbsp;</MarqueeTextWidget
	>
</div>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
	.container1 {
		padding: 1em;
		padding-top: 2em;
		padding-bottom: 2em;
		border-radius: 10px;
	}
	.scroller {
		width: 120%;
		position: fixed;
		bottom: -7%;
		left: -10%;
		color: white;
		opacity: 0.2;
		font-size: 10rem;
		font-family: 'Thunder Bold';
		user-select: none;
		z-index: 1;
	}
	.imageContainer {
		display: flex;
		justify-content: center;
		align-items: center;
	}
</style>
