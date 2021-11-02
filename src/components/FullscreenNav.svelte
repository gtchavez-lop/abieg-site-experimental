<script>
	import { supabase } from '../global';

	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	let lastScroll = 0;
	let scrollY;
	let nav;
	let isActivated = false;
	let activeNav;

	const toggleNav = (e) => {
		if (isActivated) {
			isActivated = false;
			setTimeout(() => {
				nav.style.background = 'linear-gradient(180deg, rgba(0, 0, 0, 0.2), transparent)';
			}, 200);
		} else {
			isActivated = true;
			nav.style.background = 'linear-gradient(0deg, rgba(0, 0, 0, 0), transparent)';
		}
	};
	const toggleNavOff = (e) => {
		if (isActivated) {
			isActivated = false;
		}
	};
	const hideNav = (e) => {
		if (scrollY > 100) {
			nav.style.height = '60px';
			nav.style.opacity = 0.3;
		} else {
			nav.style.height = '100px';
			nav.style.opacity = 1;
		}
		// lastScroll = scrollY;
	};
</script>

<svelte:window bind:scrollY on:scroll={hideNav} />

<div bind:this={nav} class="navContainer d-flex justify-content-between align-items-center">
	<a href="/" class="homeButton ms-5" on:click={toggleNavOff}> ABIE G </a>
	<div
		class="menuToggler d-block d-lg-none {isActivated ? 'menuToggler__active' : ''}"
		on:click={toggleNav}
	>
		<i style="margin: 0;" class="bi bi-x-circle {isActivated ? '' : 'menuToggler__active-icon'}" />
		<i style="margin: -5px;" class="bi bi-list {isActivated ? 'menuToggler__active-icon' : ''}" />
	</div>

	<ul class="navLinks me-3 d-none d-lg-flex mt-3 text-white row row-cols-4">
		<li>
			<a
				href="/"
				style="color: {activeNav == 1 ? '#688BF7' : 'white'};"
				on:click={(e) => {
					activeNav = 1;
					toggleNavOff();
				}}
				class="nav-link text-center">Home</a
			>
		</li>
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
				Account
			</a>
		</li>
	</ul>
</div>

<div class="menu d-block d-lg-none {isActivated ? 'menu-activated' : ''}">
	<ul class="menu__navlinks">
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/account">
				<h1>ACCOUNT</h1>
				<span>
					<MarqueeTextWidget duration={20}>
						REGISTER TO GET THE BEST OUT OF THE CONTENT FROM ABIE G &nbsp;
					</MarqueeTextWidget>
				</span>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/posts">
				<h1>POSTS</h1>
				<span>
					<MarqueeTextWidget duration={20}>
						CHECK OUT WHAT IS NEW FROM ABIE G HERSELF &nbsp; CHECK OUT WHAT IS NEW FROM ABIE G
						HERSELF &nbsp;
					</MarqueeTextWidget>
				</span>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/about">
				<h1>ABOUT</h1>
				<span>
					<MarqueeTextWidget duration={20}>
						THIS IS A DESCRIPTION ABOUT THE TEAM CREATED THE SITE &nbsp; THIS IS A DESCRIPTION ABOUT
						THE TEAM CREATED THE SITE &nbsp;
					</MarqueeTextWidget>
				</span>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/contact">
				<h1>CONTACT</h1>
				<span>
					<MarqueeTextWidget duration={20}>
						CONNECT WITH THE DEVELOPERS AND CONTENT MODERATORS ABOUT YOUR CONCERNS AND SUGGESTIONS
						&nbsp;
					</MarqueeTextWidget>
				</span>
			</a>
		</li>
	</ul>
	<div class="menu__socials">
		<div class="marquee2">
			<MarqueeTextWidget duration={15}>
				SOCIALIZE WITH ABIE G ON THESE LINKS &nbsp; SOCIALIZE WITH ABIE G ON THESE LINKS &nbsp;
				SOCIALIZE WITH ABIE G ON THESE LINKS &nbsp;
			</MarqueeTextWidget>
		</div>
		<span>
			<a href="https://facebook.com">
				<i class="bi bi-facebook" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://twitter.com">
				<i class="bi bi-twitter" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://twitch.tv">
				<i class="bi bi-twitch" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://youtube.com">
				<i class="bi bi-youtube" style="font-size: 3em;" />
			</a>
		</span>
		<span>
			<a href="https://instagram.com">
				<i class="bi bi-instagram" style="font-size: 3em;" />
			</a>
		</span>
	</div>
</div>

<style lang="scss">
	.navContainer {
		position: fixed;
		top: 0;
		width: 100%;
		transition: 500ms ease all;
		z-index: 999;
		background: rgba(33, 37, 41, 0.7);
		backdrop-filter: blur(10px);

		.navLinks {
			width: 50%;
			list-style: none;
			padding: 0;
			font-size: 1.5em;
			font-family: 'Thunder Medium';
			li {
				position: relative;
				transition: 200ms ease all;
				text-align: center;
				&::after,
				&::before {
					content: '';
					position: absolute;
					width: 50%;
					height: 5px;
					left: 25%;
					bottom: 0;
					background: #f7749c;
					transition: 200ms ease all;
					// opacity: 0;
					z-index: -1;
				}
				&:hover {
					&::after {
						height: 100%;
					}
				}
			}
		}
		@keyframes slideLeft {
			0% {
				opacity: 0;
				height: 0;
				bottom: 0%;
			}
			50% {
				opacity: 1;
				height: 100%;
				bottom: 0%;
			}
			100% {
				opacity: 0;
				height: 0%;
				bottom: 100%;
			}
		}

		.menuToggler {
			width: 100px;
			height: 100px;
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
	}
	.homeButton {
		position: relative;
		text-align: right;
		font-family: 'Thunder Medium';
		cursor: pointer;
		user-select: none;
		font-size: 2em;
		margin-left: 1em;
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
		span {
			position: absolute;
			top: 40%;
			left: -10%;
			transform: translateY(-50%);
			width: max-content;
			font-size: 7em;
			user-select: none;
			font-family: 'Thunder Light';
			opacity: 0;
			transition: 200ms ease all;
			color: #819ef7;
			z-index: -1;
		}
		&:hover h1 {
			transform: translateX(-25px);
		}
		&:hover span {
			opacity: 0.25;
			left: -15%;
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
	.marquee2 {
		position: absolute;
		bottom: -150%;
		right: 0;
		opacity: 0.2;
		width: 200%;
		user-select: none;
		font-size: 3rem;
		z-index: 1;
		font-family: 'Thunder Bold';
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
		.marquee2 {
			width: 100%;
		}
		.menu {
			width: 100%;
		}
		.menu__navlinks {
			margin-left: 25px;
		}
	}
</style>
