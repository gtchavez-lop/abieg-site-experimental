<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { onMount } from 'svelte';
	import anime from 'animejs';

	let windowScrollY, loading, mainContainer, floatingImage;

	console.log(windowScrollY);

	onMount((e) => {
		window.onscroll = (e) => {
			console.log(windowScrollY);
		};
	});
</script>

<svelte:window bind:scrollY={windowScrollY} />
<!-- <svelte:body bind:offsetHeight={documentHeight} /> -->

<div class="loading" bind:this={loading}>
	<div class="loadingBar" />
</div>
<p class="scrollDown" />

<!-- <div class="background" /> -->
<main bind:this={mainContainer}>
	<div
		class="floatingImage"
		style="
			transform: translateX({Math.min((windowScrollY / 500) * 30, 60)}%);
			opacity: {windowScrollY > 200 ? 0 : 1};
		"
	>
		<img bind:this={floatingImage} src="./hero.jpg" alt="" />
	</div>
	<img
		class="logo"
		src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/Logo1@1x.png"
		alt=""
		transition:fade|local={{ delay: 200, duration: 200 }}
	/>
	<div class="brand" style="transform: translateY(-{Math.min((windowScrollY / 20) * 5, 300)}%);">
		<div class="brand__letterContainer">
			<span class="brand__lc_letter">A</span>
			<span class="brand__lc_letter">B</span>
			<span class="brand__lc_letter">I</span>
			<span class="brand__lc_letter">E</span>
			<span class="brand__lc_letter letter-g">G</span>
		</div>
	</div>
	<div
		class="brand brand2"
		style="transform: translateY(-{Math.min((windowScrollY / 20) * 7, 300)}%);"
	>
		<div class="brand__letterContainer">
			<span class="brand__lc_letter">A</span>
			<span class="brand__lc_letter">B</span>
			<span class="brand__lc_letter">I</span>
			<span class="brand__lc_letter">E</span>
			<span class="brand__lc_letter letter-g">G</span>
		</div>
	</div>
	<div
		class="brand brand3"
		style="transform: translateY(-{Math.min((windowScrollY / 20) * 9, 300)}%);"
	>
		<div class="brand__letterContainer">
			<span class="brand__lc_letter">A</span>
			<span class="brand__lc_letter">B</span>
			<span class="brand__lc_letter">I</span>
			<span class="brand__lc_letter">E</span>
			<span class="brand__lc_letter letter-g">G</span>
		</div>
	</div>
	<div
		class="brand brand4"
		style="transform: translateY(-{Math.min((windowScrollY / 20) * 11, 300)}%);"
	>
		<div class="brand__letterContainer">
			<span class="brand__lc_letter">A</span>
			<span class="brand__lc_letter">B</span>
			<span class="brand__lc_letter">I</span>
			<span class="brand__lc_letter">E</span>
			<span class="brand__lc_letter letter-g">G</span>
		</div>
	</div>

	<div class="content">
		<p>Register and get the best out of it</p>
		<!-- <p>{height}</p> -->
		<h4 class="textEffectContainer">Join us with Abie G to VIRTUALIZE the world</h4>
		<a href="/account">
			<button class="joinbutton"> Register Now </button>
		</a>
	</div>
	<!-- <div bind:this={rec1} class="brand__candy_rec1" />
	<div bind:this={rec2} class="brand__candy_rec2" /> -->
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
	.loading {
		position: fixed;
	}
	.floatingImage {
		position: fixed;
		width: 50vw;
		height: 100vh;
		right: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		transition: 200ms ease opacity;
	}
	.floatingImage img {
		width: 100%;
		height: 100%;

		opacity: 0.5;
		object-fit: cover;
		clip-path: polygon(5% 0%, 100% 0%, 100% 100%, 5% 100%);
		transition: 500ms ease all;
	}
	.joinbutton {
		padding: 1em;
		width: 60%;
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
		bottom: 25%;
		left: 25px;
		opacity: 0.4;
	}
	.brand2 {
		opacity: 0.3;
	}
	.brand3 {
		opacity: 0.2;
	}
	.brand4 {
		opacity: 0.1;
	}
	.brand__letterContainer {
		width: 100%;
		height: 150px;
		display: flex;
		/* justify-content: flex-start; */
		/* align-items: center; */
	}

	.brand__letterContainer .brand__lc_letter {
		font-weight: 600;
		font-family: 'Montserrat', sans-serif;
		font-size: 8rem;
		width: 125px;
		height: 125px;
		opacity: 0.5;
		color: transparent;
		display: flex;
		justify-content: center;
		align-items: center;
		color: transparent;
		-webkit-text-stroke-width: 1px;
		-webkit-text-stroke-color: white;
		transition: opacity 200ms ease;
	}
	.letter-g {
		margin-left: 25px;
	}
	.content {
		position: absolute;
		right: 5%;
		bottom: 10%;
		color: white;
		text-align: right;
	}
	.scrollDown {
		position: fixed;
		top: 50%;
		right: 5%;
		width: 5px;
		height: 5px;
		border: white 10px solid;
		border-radius: 100px;
		animation: scrolldown 1s ease infinite;
		z-index: 3;
	}
	@keyframes scrolldown {
		0% {
			opacity: 0;
			transform: translateY(20px);
		}
		20% {
			opacity: 1;
			/* transform: rotate(-45deg) translate(10px, -10px); */
		}
		60% {
			opacity: 1;
			/* transform: rotate(-45deg) translate(10px, -10px); */
		}
		100% {
			opacity: 0;
			transform: translateY(-20px);
		}
	}
	@media screen and (max-width: 800px) {
		.floatingImage {
			width: 100vw;
		}
		.content {
			right: 5%;
			max-width: 75%;
		}
		.content .textEffectContainer {
			display: flex;
			align-items: center;
		}
		.joinbutton {
			width: 100%;
		}
	}
</style>
