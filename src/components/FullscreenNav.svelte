<script>
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
</script>

<a href="/" class="homeButton">
	<img
		src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/Logo1@1x.png"
		alt=""
	/>
</a>

<div class={isActivated ? 'button button-activated' : 'button'} on:click={toggleNav}>
	<span class="material-icons-round"> arrow_circle_left </span>
</div>

<div class={isActivated ? 'menu menu-activated' : 'menu'}>
	<ul class="menu__navlinks">
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<a href="/account">
				<h1>JOIN US</h1>
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
				<img src="./facebook.svg" alt="" />
			</a>
		</span>
		<span>
			<a href="https://twitter.com">
				<img src="./twitter.svg" alt="" />
			</a>
		</span>
		<span>
			<a href="https://snapchat.com">
				<img src="./snapchat.svg" alt="" />
			</a>
		</span>
		<span>
			<a href="https://tiktok.com">
				<img src="./tiktok.svg" alt="" />
			</a>
		</span>
		<span>
			<a href="https://instagram.com">
				<img src="./instagram.svg" alt="" />
			</a>
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
		opacity: 0;
		width: 200%;
		top: 5%;
		right: 100%;
		font-family: 'Thunder Bold';
		font-size: 2.5em;
		transition: 200ms ease all;
	}
	.homeButton:hover::after {
		right: 110%;
		opacity: 1;
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
		flex-direction: column;
		font-family: 'XoloniumRegular';
		opacity: 0;
	}
	.menu-activated {
		opacity: 1;
		transition: 500ms cubic-bezier(0.05, 0.75, 0.23, 0.95) all 200ms;
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
		margin-top: -25px;
	}
	.menu__navlinks__navlink h1 {
		transition: 200ms ease all;
	}
	.menu__navlinks__navlink span {
		position: absolute;
		top: 50%;
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
