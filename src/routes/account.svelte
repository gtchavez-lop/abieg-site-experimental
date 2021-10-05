<script>
	import { fly, fade, slide } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
	import dayjs from 'dayjs';
	import { supabase, global_account, global_hasAccount, global_account_data } from '../global';
	import { onMount } from 'svelte';
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';

	let isRegister = false;
	let isBirthdateMatched = true;
	let confirmLogout = false;
	let login_email;
	let login_password;
	let reg_email = '';
	let reg_password = '';
	let reg_givenName = '';
	let reg_birthdate = '';
	let reg_familyName = '';
	let reg_gender = 'Male';
	let reg_address = '';
	let verificationCode = '';

	let birthdateMask = /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/;

	const changeBirthdate = (e) => {
		birthdateMask.test(reg_birthdate) ? (isBirthdateMatched = true) : (isBirthdateMatched = false);
	};

	const toggleCards = (e) => {
		isRegister ? (isRegister = false) : (isRegister = true);
	};

	const login_emailPass = async (e) => {
		const { user, error } = await supabase.auth.signIn({
			email: login_email,
			password: login_password
		});
		if (!error) {
			let { data: users, thiserror } = await supabase.from('users').select('*').eq('id', user.id);
			if (!thiserror) {
				toast.push(`Hello ${user.email}`);
				global_account.set(user);
				global_account_data.set(users[0]);
			}
		} else {
			toast.push(error.message);
		}
	};

	const registerUser = async (e) => {
		if (
			reg_email != '' &&
			reg_password != '' &&
			reg_givenName != '' &&
			reg_familyName != '' &&
			reg_gender != '' &&
			isBirthdateMatched
		) {
			let { user, error } = await supabase.auth.signUp({
				email: reg_email,
				password: reg_password
			});
			let { data: users, thiserror } = await supabase.from('users').insert([
				{
					id: user.id,
					given_name: reg_givenName,
					family_name: reg_familyName,
					birthdate: reg_birthdate,
					gender: reg_gender,
					shipping_address: reg_address
				}
			]);
			isRegister = false;
			if (!error) {
				console.log(user);
				if (!thiserror) {
					login_email = reg_email;
					isRegister = false;
					reg_gender = null;
					reg_givenName = null;
					reg_familyName = null;
					reg_birthdate = null;
					reg_address = null;
					toast.push('You are now registered');
					toast.push('Please check your mail to complete your verification process verify');
				} else {
					console.log(thiserror);
				}
			} else {
				console.log(error);
			}
		}
	};

	const logout = async (e) => {
		const { error } = await supabase.auth.signOut();
		if (!error) {
			global_account.set(null);
			global_account_data.set(null);
			toast.push('You have been logged out');
		}
	};
	const logoutConfirm = (e) => {
		if (confirmLogout) {
			confirmLogout = false;
		} else {
			confirmLogout = true;
		}
	};

	onMount(async (e) => {
		let thisUser = await supabase.auth.user();
		if (thisUser) {
			let { data: users, error } = await supabase.from('users').select('*').eq('id', thisUser.id);
			if (!error) {
				global_account.set(thisUser);
				global_account_data.set(users[0]);
			}
		}
	});
</script>

<svele:head>
	<title>Accounts | Abie G</title>
</svele:head>

<SvelteToast options={{ duration: 4000 }} />
<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
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
										class={isBirthdateMatched
											? 'form-control bg-transparent text-white'
											: 'form-control bg-transparent text-white border-danger'}
										id="reg_birthdate"
										placeholder="Birthdate"
										bind:value={reg_birthdate}
										on:input={changeBirthdate}
									/>
									<label for="reg_birthdate">Birthdate</label>
								</div>
								<p>*format follows MM/DD/YYYY</p>
							</div>
							<div class="col-sm-12 col-md-6 ">
								<div><h5>Gender</h5></div>
								<div class="form-check">
									<input
										value="Male"
										class="form-check-input"
										type="radio"
										name="reg_gender"
										id="reg_gender1"
										bind:group={reg_gender}
									/>
									<label class="form-check-label" for="reg_gender1"> Male </label>
								</div>
								<div class="form-check">
									<input
										value="Female"
										class="form-check-input"
										type="radio"
										name="reg_gender"
										id="reg_gender2"
										bind:group={reg_gender}
									/>
									<label class="form-check-label" for="reg_gender2"> Female </label>
								</div>
								<div class="form-check">
									<input
										value="Non-Binary"
										class="form-check-input"
										type="radio"
										name="reg_gender"
										id="reg_gender3"
										bind:group={reg_gender}
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
		{#if $global_account_data && $global_account.aud === 'authenticated'}
			<div class="row mt-5" in:fly|local={{ y: -20, duration: 500 }}>
				<table class="table text-white">
					<tbody>
						<tr>
							<td><h6>Account ID</h6></td>
							<td>{$global_account.id.toUpperCase()}</td>
						</tr>
						<tr>
							<td><h6>Account Holder</h6></td>
							<td>{$global_account_data.given_name} {$global_account_data.family_name}</td>
						</tr>
						<tr>
							<td><h6>Account Email Address</h6></td>
							<td>{$global_account.email}</td>
						</tr>
						<tr>
							<td><h6>Birthdate</h6></td>
							<td>{$global_account_data.birthdate}</td>
						</tr>
						<tr>
							<td><h6>Gender</h6></td>
							<td>{$global_account_data.gender}</td>
						</tr>
						<tr>
							<td><h6>Shipping Address</h6></td>
							<td>{$global_account_data.shipping_address}</td>
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
