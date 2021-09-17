<script>
	import Marquee from 'svelte-marquee';
	let isActivated = false;
	const toggleNav = (e) => {
		if (isActivated) {
			isActivated = false;
		} else {
			isActivated = true;
		}
	};
</script>

<a href="/" class="homeButton">
	<img src="./logo/Logo1.svg" alt="" />
</a>

<div class={isActivated ? 'button button-activated' : 'button'} on:click={toggleNav}>
	<span class="material-icons-round"> arrow_circle_left </span>
</div>

<div class={isActivated ? 'menu menu-activated' : 'menu'}>
	<div class="marquee" />
	<ul class="menu__navlinks">
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/account">
				<h1>JOIN US</h1>
				<span>
					<Marquee reverse content="REGISTER TO GET THE BEST OUT OF THE CONTENT FROM ABIE G - " />
				</span>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/posts">
				<h1>POSTS</h1>
				<span>
					<Marquee reverse content="CHECK OUT WHAT IS NEW FROM ABIE G HERSELF - " />
				</span>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/about">
				<h1>ABOUT</h1>
				<span>
					<Marquee reverse content="THIS IS A DESCRIPTION ABOUT THE TEAM CREATED THE SITE -  " />
				</span>
			</a>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/contact">
				<h1>CONTACT</h1>
				<span>
					<Marquee
						reverse
						content="CONNECT WITH THE DEVELOPERS AND CONTENT MODERATORS ABOUT YOUR CONCERNS AND SUGGESTIONS - "
					/>
				</span>
			</a>
		</li>
	</ul>
	<div class="menu__socials">
		<div class="marquee2">
			<Marquee content="SOCIALIZE WITH ABIE G ON THESE LINKS -  " />
		</div>
		<span>
			<img src="./facebook.svg" alt="" />
		</span>
		<span>
			<img src="./twitter.svg" alt="" />
		</span>
		<span>
			<img src="./snapchat.svg" alt="" />
		</span>
		<span>
			<img src="./tiktok.svg" alt="" />
		</span>
		<span>
			<img src="./instagram.svg" alt="" />
		</span>
	</div>
</div>

<style>
	.homeButton {
		position: fixed;
		z-index: 8;
		width: 50px;
		height: 50px;
		right: 130px;
		top: 40px;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
		user-select: none;
	}
	.homeButton::after {
		position: absolute;
		content: 'ABIE G';
		color: white;
		opacity: 0.2;
		width: 200%;
		right: 100%;
		font-family: 'Audiowide', cursive;
		font-size: 1.2rem;
		transition: 200ms ease all;
	}
	.homeButton:hover::after {
		right: 110%;
		opacity: 0.5;
	}
	.homeButton img {
		width: 50px;
	}
	.button {
		position: fixed;
		right: 25px;
		top: 25px;
		width: 75px;
		height: 75px;
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
		transform: rotate(-45deg);
	}
	.button-activated {
		transform: rotate(135deg);
	}
	.button .material-icons-round {
		font-size: 4rem;
	}

	.menu {
		position: fixed;
		width: 100%;
		height: 100%;
		background: #231942;
		top: 0;
		left: 0;
		z-index: 98;
		clip-path: circle(2rem at calc(100% - 0px) 0px);
		transition: 500ms cubic-bezier(0.89, 0.07, 0.93, 0.21) all;
		color: white;
		display: flex;
		flex-direction: column;
		font-family: 'Audiowide', cursive;
	}
	.menu-activated {
		transition: 500ms cubic-bezier(0.05, 0.75, 0.23, 0.95) all;
		clip-path: circle(100vh at calc(100% - 50px) 50px);
	}
	.menu-activated::after {
		content: '';
		position: absolute;
		right: 0;
		top: 0;
		width: 100px;
		height: 100px;
		border: solid white 10px;
		animation: glow 0.75s cubic-bezier(0.05, 0.75, 0.23, 0.95) 100ms;
		border-radius: 100px;
		opacity: 0;
		z-index: -1;
	}
	@keyframes glow {
		from {
			opacity: 1;
			transform: scale(0);
		}
		to {
			opacity: 0;
			transform: scale(10);
		}
	}
	@media screen and (max-width: 800px) {
		.menu {
			transition: 5 00ms cubic-bezier(0.05, 0.75, 0.23, 0.95) all;
		}
		.menu-activated {
			clip-path: circle(100vh at calc(100% - 50px) 50px);
		}
	}
	a {
		text-decoration: none;
		color: #f88dad;
		text-align: right;
	}
	.menu h1 {
		font-size: 3rem;
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
		color: #f88dad;
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
	}
	.menu__navlinks__navlink h1 {
		transition: 200ms ease all;
		opacity: 1;
	}
	.menu__navlinks__navlink span {
		position: absolute;
		top: 50%;
		left: -10%;
		transform: translateY(-50%);
		width: max-content;
		font-size: 3rem;
		user-select: none;
		font-weight: 700;
		opacity: 0;
		transition: 200ms ease all;
		color: #7bdff2;
	}
	.menu__navlinks__navlink:hover h1 {
		opacity: 0;
		transform: translateX(-20px);
	}
	.menu__navlinks__navlink:hover span {
		opacity: 1;
		left: -15%;
	}

	.menu__socials {
		position: absolute;
		margin-top: 100px;
		display: flex;
		right: 0;
		width: 40%;
		bottom: 10%;
		justify-content: space-evenly;
	}
	.marquee2 {
		position: absolute;
		bottom: -50%;
		right: 0;
		opacity: 0.2;
		width: 200%;
		user-select: none;
		font-size: 3rem;
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
	.menu__socials span img {
		filter: invert(1);
	}

	@media screen and (max-width: 800px) {
		.menu__socials {
			width: 100%;
		}
		.menu__socials span {
			width: 30px;
			height: 30px;
		}
		.marquee2 {
			width: 100%;
		}
	}
</style>
