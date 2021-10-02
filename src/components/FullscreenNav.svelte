<script>
	import { onMount } from 'svelte';

	import { global_hasAccount } from '../global';
	import Marquee from 'svelte-marquee';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	let isActivated = false;

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
</script>

<div class="menucontainer">
	<a href="/" class="homeButton" on:click={toggleNavOff}> ABIE G </a>

	<div class={isActivated ? 'button button-activated' : 'button'} on:click={toggleNav}>
		<i class={!isActivated ? 'bi bi-list icon_activated' : 'bi bi-list'} style="font-size: 3em;" />
		<i class={isActivated ? 'bi bi-x icon_activated' : 'bi bi-list'} style="font-size: 3em;" />
	</div>
</div>

<div class={isActivated ? 'menu menu-activated' : 'menu'}>
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

<style>
	.menucontainer {
		position: fixed;
		top: 0;
		width: 100%;
		height: 100px;
		/* background: black; */
		display: flex;
		align-items: center;
		justify-content: space-between;
		transform-style: preserve-3d;

		z-index: 999;
	}
	.homeButton {
		position: relative;
		text-align: right;
		width: 75px;
		height: 75px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		user-select: none;
		font-size: 1.5em;
		margin-left: 2em;
	}
	.homeButton::after {
		position: absolute;
		content: 'ABIE G';
		color: white;
		opacity: 0;
		width: 150%;
		top: 50%;
		transform: translateY(-50%);
		left: -5%;
		font-size: 1.5em;
		transition: 200ms ease all;
		z-index: -1;
	}
	.homeButton:hover::after {
		left: 0%;
		opacity: 0.2;
	}
	.button {
		position: relative;
		width: 80px;
		height: 80px;
		margin-right: 20px;
		margin-left: 10px;
		/* background: #00212b; */
		border-radius: 100px;
		cursor: pointer;
		z-index: 99;
		transition: 200ms ease all;
		display: flex;
		justify-content: center;
		align-items: center;
		filter: invert(1);
		user-select: none;
		transform: rotateX(0deg);
	}
	.button-activated {
		transform: rotateX(-180deg);
	}
	.button .bi {
		position: absolute;
		opacity: 0;
		margin: 0;
		padding: 0;
	}
	.button .icon_activated {
		opacity: 1;
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
	}
	.menu-activated {
		opacity: 1;
		transform: translateX(0%);
		transition: 500ms cubic-bezier(0, 0.98, 0, 0.98) all;
		/* clip-path: circle(100vh at calc(100% - 50px) 50px); */
	}
	.menu-activated::before {
		content: '';
		position: absolute;
		right: 0;
		top: 0;
		width: 100%;
		height: 100%;
		border: solid white 5em;
		border-bottom: solid transparent 0;
		border-right: solid transparent 0;
		border-top: solid transparent 0;
		animation: glow 1s cubic-bezier(0.23, 0.93, 0, 1);
		opacity: 0;
		/* z-index: -1; */
	}
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
	@media screen and (max-width: 800px) {
		.menu {
			width: 100%;
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

	@media screen and (max-width: 800px) {
		.menu__navlinks {
			margin-left: 25px;
		}
	}
	.menu__navlinks__navlink {
		position: relative;
		transition: 200ms ease all;
		cursor: pointer;
		margin-top: 1.5em;
	}
	.menu__navlinks__navlink h1 {
		transition: 200ms ease all;
	}
	.menu__navlinks__navlink span {
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
	.menu__navlinks__navlink:hover h1 {
		transform: translateX(-25px);
	}
	.menu__navlinks__navlink:hover span {
		opacity: 0.25;
		left: -15%;
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
	}
	.menu__socials span:hover {
		transform: scale(1.2);
	}
	.menu__socials span:active {
		transition: none;
		transform: scale(0.8);
	}

	@media screen and (max-width: 800px) {
		/* .menu__socials {
			width: 100%;
		}
		.menu__socials span {
			width: 30px;
			height: 30px;
		} */
		.marquee2 {
			width: 100%;
		}
	}
</style>
