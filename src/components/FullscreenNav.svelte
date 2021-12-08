<script context="module">
	export const prerender = true;
</script>

<script>
	import { global_account, global_account_data, _user, _userData } from '../global';
	import { onMount } from 'svelte';

	let scrollY;
	let nav;
	let isActivated = false;
	let activeNav;

	const toggleNav = (e) => {
		if (isActivated) {
			isActivated = false;
		} else {
			isActivated = true;
		}
	};
	const toggleNavOff = (e) => {
		if (isActivated) {
			isActivated = false;
		}
	};
	onMount(() => {
		// console.log($_user);
	});
</script>

<svelte:window bind:scrollY />

<div class="navbar fixed-top text-white">
	<div class="container d-flex align-items-center">
		<a href="/" class="homeButton" on:click={toggleNavOff}> ABIE G </a>

		<div
			class="menuToggler d-block d-lg-none {isActivated ? 'menuToggler__active' : ''}"
			on:click={toggleNav}
		>
			<i
				style="margin: 0;"
				class="bi bi-x-circle {isActivated ? '' : 'menuToggler__active-icon'}"
			/>
			<i style="margin: -5px;" class="bi bi-list {isActivated ? 'menuToggler__active-icon' : ''}" />
		</div>
		<ul
			class="navlist d-none d-lg-flex align-items-center"
			style="padding: 0; list-style: none; margin: 0;"
		>
			<li>
				<a
					href="/posts"
					style="color: {activeNav == 2 ? '#688BF7' : 'white'};"
					on:click={(e) => {
						activeNav = 2;
						toggleNavOff();
					}}
					class="nav-link text-center">Posts</a
				>
			</li>
			<li>
				<a
					href="/about"
					style="color: {activeNav == 3 ? '#688BF7' : 'white'};"
					on:click={(e) => {
						activeNav = 3;
						toggleNavOff();
					}}
					class="nav-link text-center ">About us</a
				>
			</li>
			{#if $_user && $_userData}
				{#if $_userData.isModerator}
					<li>
						<a
							href="/admin"
							style="color: {activeNav == 5 ? '#688BF7' : 'white'};"
							on:click={(e) => {
								activeNav = 5;
								toggleNavOff();
							}}
							class="nav-link text-center"
						>
							Dashboard
						</a>
					</li>
				{/if}
			{/if}
			<li>
				<a
					href="/account"
					style="color: {activeNav == 4 ? '#688BF7' : 'white'};"
					on:click={(e) => {
						activeNav = 4;
						toggleNavOff();
					}}
					class="nav-link text-center"
				>
					{$_user ? $_user.email.split('@', 1)[0] : 'Login'}
				</a>
			</li>
		</ul>
	</div>
</div>

<div class="menu d-block d-lg-none {isActivated ? 'menu-activated' : ''}">
	<ul class="menu__navlinks">
		{#if $global_account_data}
			{#if $global_account_data.isModerator}
				<li class="menu__navlinks__navlink" on:click={toggleNav}>
					<a href="/admin">
						<h1>DASHBOARD</h1>
					</a>
				</li>
			{/if}
		{/if}
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/account">
				<h1>ACCOUNT</h1>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/posts">
				<h1>POSTS</h1>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/about">
				<h1>ABOUT</h1>
			</a>
		</li>
	</ul>
	<div class="menu__socials">
		<span>
			<a href="https://www.facebook.com/">
				<i class="bi bi-facebook" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://twitter.com/">
				<i class="bi bi-twitter" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://www.twitch.tv/">
				<i class="bi bi-twitch" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://www.youtube.com/">
				<i class="bi bi-youtube" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://www.instagram.com/">
				<i class="bi bi-instagram" style="font-size: 3em;" />
			</a>
		</span>
	</div>
</div>

<style lang="scss">
	.navbar {
		backdrop-filter: blur(5px);
	}

	.navlist {
		li {
			margin-left: 1em;
			font-size: 1.25em;
		}
	}
	.menuToggler {
		width: 60px;
		height: 60px;
		transition: 500ms ease all;
		transform-style: preserve-3d;
		cursor: pointer;
		.menuToggler__active-icon {
			opacity: 0;
		}
		.bi {
			position: absolute;
			left: 50%;
			top: 50%;
			color: white;
			transition: 500ms ease all;
			font-size: 2.5em;
		}
		.bi-list {
			transform: translateX(-50%) translateY(-50%) translateZ(30px);
		}
		.bi-x-circle {
			transform: translateX(-50%) translateY(-50%) translateZ(-30px);
		}
	}
	.menuToggler__active {
		transform: rotateY(-0.5turn) rotateX(0.5turn);
	}

	.homeButton {
		position: relative;
		text-align: right;
		font-family: 'Thunder Medium';
		cursor: pointer;
		user-select: none;
		font-size: 2em;
		margin: 0;
		&::after {
			position: absolute;
			content: 'ABIE G';
			color: white;
			opacity: 0;
			width: 200%;
			top: 50%;
			transform: translateY(-50%);
			left: -50%;
			font-size: 1.5em;
			transition: 200ms ease all;
			z-index: -1;
		}
		&:hover::after {
			left: -25%;
			opacity: 0.2;
		}
	}

	.menu {
		position: fixed;
		width: 100%;
		height: 100%;
		background: #231942;
		top: 0;
		right: 0;
		z-index: 998;
		/* clip-path: circle(2rem at calc(100% - 0px) 0px); */
		transition: 200ms cubic-bezier(0.69, 0.15, 0.86, 0.29) all;
		color: white;
		flex-direction: column;
		transform: translateX(100%);
		font-family: 'XoloniumRegular';
		opacity: 1;
		overflow: hidden;
		box-shadow: #323232 0 0 10px;
		border-radius: 20px;
		border-top-right-radius: 0px;
		border-bottom-right-radius: 0px;
	}
	.menu-activated {
		opacity: 1;
		transform: translateX(0%);
		transition: 500ms cubic-bezier(0, 0.98, 0, 0.98) all;
		&::before {
			content: '';
			position: absolute;
			right: 0;
			top: 0;
			width: 100%;
			height: 100%;
			border: solid white 1em;
			border-bottom: solid transparent 0;
			border-right: solid transparent 0;
			border-top: solid transparent 0;
			animation: glow 1s cubic-bezier(0.23, 0.93, 0, 1);
			opacity: 0;

			@keyframes glow {
				0% {
					opacity: 1;
				}
				10% {
					opacity: 0.5;
				}
				100% {
					opacity: 0;
				}
			}
		}
	}
	a {
		text-decoration: none;
		color: #f7749c;
		text-align: right;
	}
	.menu h1 {
		font-size: 5em;
		text-align: right;
	}

	.menu__navlinks {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0;
		margin-right: 50px;
		margin-top: 100px;
		list-style: none;
		color: #f7749c;
		font-family: 'Thunder Medium';
	}

	.menu__navlinks__navlink {
		position: relative;
		transition: 200ms ease all;
		cursor: pointer;
		margin-top: 2vh;
		h1 {
			transition: 200ms ease all;
		}
		&:hover h1 {
			transform: translateX(-25px);
		}
	}

	.menu__socials {
		position: absolute;
		margin-top: 100px;
		display: flex;
		right: 0;
		width: 100%;
		bottom: 10%;
		justify-content: space-evenly;
		z-index: 3;
	}
	.menu__socials span {
		width: 50px;
		height: 50px;
		cursor: pointer;
		transition: 200ms ease all;
		/* color: #212529; */
	}
	.menu__socials span:hover {
		transform: scale(1.2);
	}
	.menu__socials span:active {
		transition: none;
		transform: scale(0.8);
	}
	.bi {
		color: #96c9dc;
	}

	@media screen and (max-width: 800px) {
		.menu {
			width: 100%;
		}
		.menu__navlinks {
			margin-left: 25px;
		}
	}
</style>
