<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { onMount } from 'svelte';
	import anime from 'animejs';

	let rec1;
	let rec2;
	let letterG;
	let isMounted = false;
	let windowScrollY;
	let mainContainer;
	let floatingImage;

	onMount((e) => {
		isMounted = true;
		window.onscroll = (e) => {
			windowScrollY = window.scrollY;
			if (windowScrollY > 100) {
				rec1.style.opacity = 0;
				rec1.style.height = 0;
				rec2.style.opacity = 0;
				rec2.style.width = 0;
				floatingImage.style.clipPath = 'circle(80% at 100% 0%)';
			} else {
				rec1.style.opacity = 1;
				rec1.style.height = '100%';
				rec2.style.opacity = 1;
				rec2.style.width = '100%';
				floatingImage.style.clipPath = 'circle(80% at 100% 40%)';
			}
		};
		setTimeout(() => {
			anime({
				targets: rec1,
				height: [0, '100%'],
				easing: 'easeOutExpo',
				duration: 500
			});
			anime({
				targets: rec2,
				width: [0, '100%'],
				easing: 'easeOutExpo',
				duration: 500,
				delay: 200
			});
			anime({
				targets: letterG,
				opacity: [0, 1],
				scale: [0.9, 1],
				easing: 'easeOutExpo',
				duration: 500,
				delay: 1000
			});
		}, 750);
	});
</script>

<!-- <div class="background" /> -->
<main
	bind:this={mainContainer}
	class={isMounted ? 'transitioner transitioner-mounted' : 'transitioner'}
>
	<div class="floatingImage">
		<img bind:this={floatingImage} src="./hero.jpg" alt="" />
	</div>
	<img
		class="logo"
		src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/Logo1@1x.png"
		alt=""
		transition:fade|local={{ delay: 200, duration: 200 }}
	/>
	<div class="brand">
		<div class="brand__letterContainer">
			<span class="brand__lc_letter">A</span>
			<span class="brand__lc_letter ">B</span>
		</div>
		<div class="brand__letterContainer">
			<span class="brand__lc_letter ">I</span>
			<span class="brand__lc_letter ">E</span>
		</div>
		<div class="brand__letterContainer">
			<span bind:this={letterG} class="brand__lc_letter letter-g">G</span>
		</div>
	</div>

	<div class="content">
		<p>Register and get the best out of it</p>
		<h4 class="textEffectContainer">Join us with Abie G to VIRTUALIZE the world</h4>
		<a href="/account">
			<button class="joinbutton"> Register Now </button>
		</a>
		<p class="scrollDown" />
	</div>
	<div bind:this={rec1} class="brand__candy_rec1" />
	<div bind:this={rec2} class="brand__candy_rec2" />
</main>

<main class="celebration white-text  valign-wrapper live">
	<div class="container center-align">
		<img src="./illustrations/undraw_Online_party_re_7t6g.svg" width="350" alt="" />
		<div class="row ">
			<div class="col s12 center-align ">
				<h2 style="margin-bottom: 2em;">ABIE G WEBSITE IS NOW LIVE!!!</h2>
			</div>
			<div class="col s12 ">
				<p class="flow-text">
					In celebration for hitting the two-million [!!!] follower mark on each of her social media
					accounts, AbieG formally welcomes you (yes, you!) to her namesake website’s ribbon-cutting
					ceremony. Fancy.
					<!-- <br /><br />
					<b>ABIEG.VERCEL.APP</b> is created to bring BabieGs together in an exclusive,
					AbieG-centric community where the most freshest and exclusive news, updates, and giveaway
					announcements are delivered by AbieG herself.
					<br /><br />
					The website focuses on providing each of the community members a safe space to communicate
					with each other and gush over all things AbieG. -->
				</p>
			</div>
		</div>
	</div>
</main>
<main class="celebration white-text  valign-wrapper ">
	<div class="container center-align">
		<img src="./illustrations/undraw_community_8nwl.svg" width="350" alt="" />
		<div class="row ">
			<div class="col s12 center-align ">
				<h2 style="margin-bottom: 2em;">Abie G Community Moderators</h2>
			</div>
			<div class="col s12 ">
				<p class="flow-text">
					To ensure a safe space for the community members, this site is regularly kept in check by
					the moderators. Inappropriate conducts are strictly discouraged and violation to community
					rules may result to account suspension and/or removal.
				</p>
			</div>
		</div>
	</div>
</main>
<main class="celebration valign-wrapper white-text ">
	<div class="container center-align">
		<img class="center-align" src="./illustrations/undraw_begin_chat_c6pj.svg" alt="" width="350" />
		<div class="row ">
			<div class="col s12 center-align">
				<h2 style="margin-bottom: 2em;">Connect with Abie G with exclusive content</h2>
			</div>
			<div class="col s12 ">
				<p class="flow-text">
					This site takes BabieGs to a much more intimate interaction with AbieG herself as she
					shares with them glimpses of her everyday life, ambitions, and aspirations as well as
					site-exclusive giveaways and surprises.
				</p>
			</div>
		</div>
	</div>
</main>

<!-- for maintenance -->
<!-- <main style="display: flex; align-items:center;">
	<div class="container white-text">
		<h1>Sorry, we are fixing or updating something</h1>
		<p>Please come back in some time</p>
	</div>
</main> -->

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
</svelte:head>

<style>
	.floatingImage {
		position: fixed;
		width: 50vw;
		height: 100vh;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.floatingImage img {
		width: 100%;
		height: 100%;

		opacity: 0.5;
		object-fit: cover;
		clip-path: circle(80% at 100% 40%);
		transition: 500ms ease all;
	}
	.joinbutton {
		padding: 1em;
		width: 300px;
		margin-top: 50px;
		font-size: 1rem;
		background: none;
		border-radius: 100px;
		color: white;
		border: #f88dad solid 0.2rem;
		cursor: pointer;
		font-weight: 700;
		transition: 200ms ease all;
	}
	.joinbutton:hover {
		color: white;
		background: #f88dad;
		border: #f88dad solid 0.2rem;
		transform: scale(1.1);
	}
	.logo {
		position: fixed;
		opacity: 0.1;
		width: 1000px;
		top: calc(7 0% - 500px);
		right: calc(5% - 300px);
		z-index: -1;
	}
	.transitioner {
		transition: 750ms cubic-bezier(0.1, 0.69, 0.3, 0.91) all 500ms;
		clip-path: circle(0vw at 0% 100%);
	}
	.transitioner-mounted {
		clip-path: circle(175vw at 0% 100%);
	}

	main {
		/* margin: 0; */
		min-height: 100vh;
		overflow: hidden;
		z-index: 3;
	}
	main * {
		/* margin: 0; */
		user-select: none;
	}
	.brand {
		position: absolute;
		bottom: 50px;
		left: 50px;
		z-index: 2;
	}
	.brand__letterContainer {
		width: 100%;
		height: 150px;
		display: flex;
		justify-content: flex-start;
		align-items: center;
	}

	.brand__letterContainer .brand__lc_letter {
		font-weight: 600;
		font-family: 'XoloniumRegular';
		font-size: 8rem;
		width: 150px;
		height: 150px;
		color: transparent;
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
	}
	.letter-g {
		opacity: 0;
	}
	.brand__candy_rec1 {
		position: fixed;
		left: 0px;
		bottom: 0;
		width: 125px;
		height: 0;
		background: #f7749c;
		z-index: 1;
		transition: 200ms ease all;
	}
	.brand__candy_rec2 {
		position: fixed;
		left: 0;
		bottom: 0px;
		width: 0%;
		height: 125px;
		background: #819ef7;
		z-index: 1;
		transition: 200ms ease all 100ms;
	}
	.content {
		position: absolute;
		right: 5%;
		bottom: 20%;
		color: white;
		text-align: right;
	}
	.scrollDown {
		width: 15px;
		height: 15px;
		border: white 5px solid;
		border-top: none;
		border-right: none;
		transform: rotate(-45deg);
		animation: scrolldown 1s ease infinite;
	}
	@keyframes scrolldown {
		0% {
			opacity: 0;
			transform: rotate(-45deg) translate(5px, -5px);
		}
		50% {
			opacity: 1;
			/* transform: rotate(-45deg) translate(10px, -10px); */
		}
		100% {
			opacity: 0;
			transform: rotate(-45deg) translate(-5px, 5px);
		}
	}
	@media screen and (max-width: 800px) {
		.floatingImage {
			width: 100vw;
		}
		.transitioner {
			clip-path: circle(120vh at 0% 100%);
		}
		.brand {
			bottom: 15px;
			left: 15px;
		}
		.brand__letterContainer {
			height: 100px;
		}
		.brand__letterContainer .brand__lc_letter {
			font-size: 5rem;
			width: 100px;
			height: 100px;
		}

		.brand__candy_rec1 {
			left: 0;
			width: 65px;
		}
		.brand__candy_rec2 {
			bottom: 0;
			height: 65px;
		}
		.content {
			right: 5%;
			bottom: 40%;
			max-width: 65%;
		}
		.content .textEffectContainer {
			display: flex;
			align-items: center;
		}
		.joinbutton {
			width: 100%;
		}
	}
	.celebration {
		position: relative;
		/* display: flex;
		align-items: center;
		z-index: 5;
		color: white; */
		z-index: 5;
		padding-top: 5em;
		padding-bottom: 5em;
	}
	/* .celebration .container {
		margin-left: 5%;
		width: 80%;
		display: flex;
		flex-direction: column;
		justify-content: center;
		font-size: 1.1rem;
	}
	.celebration .container h1 {
		margin-bottom: 2em;
	}
	.celebration .container p {
		margin-bottom: 1em;
	} */
</style>
