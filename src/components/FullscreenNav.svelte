<script>
	let isActivated = false;
	const toggleNav = (e) => {
		if (isActivated) {
			isActivated = false;
		} else {
			isActivated = true;
		}
	};
</script>

<svelte:head />

<div class={isActivated ? 'button button-activated' : 'button'} on:click={toggleNav}>
	<ion-icon name="arrow-back-outline" size="large" />
</div>

<div class={isActivated ? 'menu menu-activated' : 'menu'}>
	<ul class="menu__navlinks">
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<h1>JOIN US</h1>
			<span
				>REGISTER TO GET THE BEST OUT OF THE CONTENT FROM ABIE G - REGISTER TO GET THE BEST OUT OF
				THE CONTENT FROM ABIE G</span
			>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<h1>POSTS</h1>
			<span>
				CHECK OUT WHAT IS NEW FROM ABIE G HERSELF - CHECK OUT WHAT IS NEW FROM ABIE G HERSELF
			</span>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<h1>ABOUT</h1>
			<span
				>THIS IS A DESCRIPTION ABOUT THE TEAM CREATED THE SITE - THIS IS A DESCRIPTION ABOUT THE
				TEAM CREATED THE SITE
			</span>
		</li>
		<li class="menu__navlinks__navlink" on:click={toggleNav}>
			<h1>CONTACT</h1>
			<span
				>CONNECT WITH THE DEVELOPERS AND CONTENT MODERATORS ABOUT YOUR CONCERNS AND SUGGESTIONS
			</span>
		</li>
	</ul>
	<div class="menu__socials">
		<ion-icon name="logo-facebook" size="large" />
		<ion-icon name="logo-twitter" size="large" />
		<ion-icon name="logo-instagram" size="large" />
		<ion-icon name="logo-tiktok" size="large" />
	</div>
</div>

<style>
	.button {
		position: fixed;
		right: 25px;
		top: 25px;
		width: 50px;
		height: 50px;
		/* background: #00212b; */
		border-radius: 100px;
		cursor: pointer;
		z-index: 99;
		transition: 200ms ease all;
		display: flex;
		justify-content: center;
		align-items: center;
		filter: invert(1);
	}
	.button-activated {
		transform: rotate(-180deg);
	}

	.menu {
		position: fixed;
		width: 100%;
		height: 100%;
		background: #4f56b6;
		top: 0;
		left: 0;
		z-index: 98;
		clip-path: circle(40px at calc(100% - 50px) 50px);
		transition: 300ms ease all;
		color: white;
		display: flex;
		flex-direction: column;
		justify-content: center;
		font-family: 'Audiowide', cursive;
	}
	.menu-activated {
		transition: 300ms ease all;
		clip-path: circle(180vw at calc(100% - 50px) 50px);
	}
	@media screen and (max-width: 800px) {
		.menu-activated {
			clip-path: circle(200vw at calc(100% - 50px) 50px);
		}
	}

	.menu h1 {
		font-size: 3rem;
	}

	.menu__navlinks {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 0;
		margin-left: 50px;
		list-style: none;
		color: #f88dad;
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
		left: -25%;
		transform: translateY(-50%);
		width: max-content;
		font-size: 3rem;
		user-select: none;
		font-weight: 700;
		opacity: 0;
		transition: 200ms ease all;
	}
	.menu__navlinks__navlink:hover h1 {
		opacity: 0;
		transform: translateX(20px);
	}
	.menu__navlinks__navlink:hover span {
		opacity: 1;
		left: -20%;
	}

	.menu__socials {
		margin-top: 100px;
		display: flex;
		width: 100%;
		justify-content: space-evenly;
		color: white;
	}

	.menu__socials ion-icon {
		color: #231942;
		transition: 200ms ease all;
	}
	.menu__socials ion-icon:hover {
		transform: scale(1.2);
	}
</style>
