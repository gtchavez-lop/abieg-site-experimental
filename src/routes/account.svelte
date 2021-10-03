<script>
	import { fly, fade, slide } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
	// import dayjs from 'dayjs';
	import { supabase, global_account, global_hasAccount } from '../global';
	import { onMount } from 'svelte';
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';

	let isRegister = false;
	let birthdate;
	let confirmLogout = false;
	let login_email;
	let login_password;
	let reg_email;
	let reg_password;
	let reg_givenName;
	let reg_familyName;
	let reg_gender;
	let reg_address;

	const flatpickrOptions = {
		enableTime: true,
		onChange: (selectedDates, dateStr, instance) => {}
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
		if (data.length > 0) {
			delete data[0].password;
			global_account.set(data[0]);
			localStorage.setItem('data', JSON.stringify(data[0]));
			toast.push(`Hello, ${$global_account.given_name} ${$global_account.family_name}`);
			// M.toast({ html: `Hello, ${$global_account.given_name} ${$global_account.family_name}` });
		} else {
			toast.push('Email or Password incorrect');
			// M.toast({ html: `Email or Password incorrect.` });
		}
		if (error) {
			toast.push('Email or Password incorrect');
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
					// birthdate: dayjs($birthdate.selected).format('YYYY-MM-DD'),
					gender: reg_gender,
					shipping_address: reg_address
				}
			]);

			if (error) {
				// M.toast({ html: 'Something went wrong. Try again' });
			} else {
				login_email = reg_email;
				isRegister = false;
				reg_gender = null;
				reg_givenName = null;
				reg_familyName = null;
				reg_password = null;
				reg_email = null;
				// $birthdate.set(null);
				// M.toast({ html: 'Registration Successful, please login ' });
			}
		} else {
			// M.toast({ html: 'Please enter all required fields' });
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
		if (data) {
			global_account.set(JSON.parse(data));
			global_hasAccount.set(true);
		} else {
			global_account.set(null);
			global_hasAccount.set(false);
		}
	});
</script>

<svele:head>
	<title>Accounts | Abie G</title>
</svele:head>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<SvelteToast options={{ duration: 1000 }} />
	<div
		class="container text-white"
		style="border-radius:10px"
		transition:slide|local={{ duration: 500 }}
	>
		<p class="display-3">Your Account</p>
		{#if !$global_account}
			<div class="row" style="min-height: 50vh;" in:fly|local={{ y: -40, duration: 500 }}>
				<div class="col-md-6 d-flex justify-content-center align-items-center mt-md-5">
					<img
						class="mx-auto"
						src="./illustrations/undraw_profile_image_re_ic2f.svg"
						width="250"
						alt=""
					/>
				</div>
				<div class="col-md-6 d-flex flex-column justify-content-center mt-md-5">
					<h4>Sign in to your account</h4>

					<div class="form-floating my-3 ">
						<input
							type="email"
							class="form-control bg-transparent text-white"
							id="login_email"
							placeholder="Your Registered Email Address"
							bind:value={login_email}
						/>
						<label for="login_email">Your Registered Email Address</label>
					</div>
					<div class="form-floating mb-4 ">
						<input
							type="password"
							class="form-control bg-transparent text-white"
							id="login_password"
							placeholder="Your Password"
							bind:value={login_password}
						/>
						<label for="login_password">Your Password</label>
					</div>
					<button class="btn btn-primary" on:click={login_emailPass}> Sign In </button>
					<button on:click={toggleCards} class="btn btn-link mt-3 text-info"
						>Don't have an account? Click Me</button
					>
				</div>
			</div>

			{#if isRegister}
				<div class="row my-5" transition:slide|local={{ duration: 500 }}>
					<div class="col col-12">
						<h4>Join with us</h4>
					</div>
					<div class="col col-12 mt-4">
						<h5>User Account</h5>
						<div class="row">
							<div class="col-sm-12 col-md-6">
								<div class="form-floating mb-3 ">
									<input
										type="email"
										class="form-control bg-transparent text-white"
										id="reg_email"
										placeholder="username@domain.com"
										bind:value={reg_email}
									/>
									<label for="reg_email">Your Email address</label>
								</div>
							</div>
							<div class="col col-md-6">
								<div class="form-floating mb-3 ">
									<input
										type="password"
										class="form-control bg-transparent text-white"
										id="reg_password"
										placeholder="Your Secure Password"
										bind:value={reg_password}
									/>
									<label for="reg_password">Your Password</label>
								</div>
							</div>
						</div>
					</div>
					<div class="col col-sm-12 mt-4">
						<h5>Basic Information</h5>
						<div class="row">
							<div class="col-sm-12 col-md-6">
								<div class="form-floating mb-3 ">
									<input
										type="text"
										class="form-control bg-transparent text-white"
										id="reg_givenName"
										placeholder="Your Given Name"
										bind:value={reg_givenName}
									/>
									<label for="reg_givenName">Your Given Name</label>
								</div>
							</div>
							<div class="col-sm-12 col-md-6">
								<div class="form-floating mb-3 ">
									<input
										type="text"
										class="form-control bg-transparent text-white"
										id="reg_familyName"
										placeholder="Your Surname"
										bind:value={reg_familyName}
									/>
									<label for="reg_familyName">Your Surname</label>
								</div>
							</div>
							<div class="col-sm-12">
								<div class="form-floating mb-3 ">
									<input
										type="text"
										class="form-control bg-transparent text-white"
										id="reg_address"
										placeholder="Your Shipping Addresse"
										bind:value={reg_address}
									/>
									<label for="reg_address">Your Shipping Address</label>
								</div>
							</div>
							<div class="col-sm-12 col-md-6 mb-4">
								<div class="form-floating mb-3 ">
									<input
										type="text"
										class="form-control bg-transparent text-white"
										id="reg_birthdate"
										placeholder="Birthdate"
										bind:value={birthdate}
									/>
									<label for="reg_birthdate">Birthdate</label>
								</div>
								<p>*format follows MM/DD/YYYY</p>
							</div>
							<div class="col-sm-12 col-md-6 ">
								<div><h5>Gender</h5></div>
								<div class="form-check">
									<input
										bind:group={reg_gender}
										class="form-check-input"
										type="radio"
										name="reg_gender"
										id="reg_gender1"
									/>
									<label class="form-check-label" for="reg_gender1"> Male </label>
								</div>
								<div class="form-check">
									<input
										bind:group={reg_gender}
										class="form-check-input"
										type="radio"
										name="reg_gender"
										id="reg_gender2"
									/>
									<label class="form-check-label" for="reg_gender2"> Female </label>
								</div>
								<div class="form-check">
									<input
										bind:group={reg_gender}
										class="form-check-input"
										type="radio"
										name="reg_gender"
										id="reg_gender3"
									/>
									<label class="form-check-label" for="reg_gender3"> Non-binary </label>
								</div>
							</div>
						</div>
					</div>
					<button on:click={registerUser} class="btn btn-outline-primary mt-5">
						Register Now
					</button>
				</div>
			{/if}
		{/if}
		{#if $global_account}
			<div class="row mt-5" in:fly|local={{ y: -20, duration: 500 }}>
				<table class="table text-white">
					<tbody>
						<tr>
							<td><h6>Account ID</h6></td>
							<td>{$global_account.id.toUpperCase()}</td>
						</tr>
						<tr>
							<td><h6>Account Holder</h6></td>
							<td>{$global_account.given_name} {$global_account.family_name}</td>
						</tr>
						<tr>
							<td><h6>Account Email Address</h6></td>
							<td>{$global_account.email}</td>
						</tr>
						<tr>
							<td><h6>Birthdate</h6></td>
							<td>{$global_account.birthdate}</td>
						</tr>
						<tr>
							<td><h6>Gender</h6></td>
							<td>{$global_account.gender.toUpperCase()}</td>
						</tr>
						<tr>
							<td><h6>Shipping Address</h6></td>
							<td>{$global_account.shipping_address}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="row mt-5" in:fly|local={{ y: -20, duration: 500, delay: 200 }}>
				{#if !confirmLogout}
					<button
						in:fly|local={{ x: 20, duration: 500 }}
						class="btn btn-danger"
						on:click={logoutConfirm}
					>
						Log out
					</button>
				{:else}
					<h4 in:fly|local={{ x: -20, duration: 500 }}>Do you really want to log out</h4>
					<div
						class="d-flex justtify-content-center"
						in:fly|local={{ x: -20, duration: 500, delay: 100 }}
					>
						<button on:click={logout} class="btn btn-danger me-4" style="min-width: 150px;">
							Yes
						</button>
						<button on:click={logoutConfirm} class="btn btn-primary" style="min-width: 150px;">
							No
						</button>
					</div>
					<!-- <div class="col s2 offset-s8">
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
						</div> -->
				{/if}
			</div>
		{/if}
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
	/* .container1 {
		padding: 1em;
		padding-top: 2em;
		padding-bottom: 2em;
		border-radius: 10px;
	} */
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
</style>
