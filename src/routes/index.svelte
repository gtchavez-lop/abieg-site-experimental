<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { onMount } from 'svelte';
	import IntersectionObserver from 'svelte-intersection-observer';
	import { LottiePlayer } from '@lottiefiles/svelte-lottie-player';

	let windowScrollY, loading, mainContainer, floatingImage;

	let hero1;
	let hero2;
	let hero3;
	let isHero1Intersecting;
	let isHero2Intersecting;
	let isHero3Intersecting;
</script>

<svele:head>
	<title>Abie G</title>
</svele:head>
<svelte:window bind:scrollY={windowScrollY} />
<!-- <svelte:body bind:offsetHeight={documentHeight} /> -->

<div class="loading" bind:this={loading}>
	<div class="loadingBar" />
</div>

<!-- <div class="background" /> -->
<main bind:this={mainContainer} transition:fade class="hero" style="overflow-x: hidden;">
	<div
		class="floatingImage"
		style="
			transform: translateX({Math.min((windowScrollY / 500) * 30, 60)}%);
			opacity: {windowScrollY > 200 ? 0 : 1};
		"
	>
		<img bind:this={floatingImage} src="./hero.jpg" alt="" />
	</div>
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
		<div class="mouse" />
		<p>Register and get the best out of it</p>
		<!-- <p>{height}</p> -->
		<h4 class="textEffectContainer display-6">Join us with Abie G to VIRTUALIZE the world</h4>
		<a href="/account">
			<button class="joinbutton"> Register Now </button>
		</a>
	</div>
	<!-- <div bind:this={rec1} class="brand__candy_rec1" />
	<div bind:this={rec2} class="brand__candy_rec2" /> -->
</main>
<IntersectionObserver threshold={0.2} element={hero1} bind:intersecting={isHero1Intersecting}>
	<main
		bind:this={hero1}
		style={isHero1Intersecting
			? 'transform: translateX(0); opacity: 1'
			: 'transform: translateX(-10%); opacity: 0;'}
		class="d-flex align-items-center text-white my-5"
	>
		<div class="container">
			<div class="row row-cols-1 row-cols-lg-2">
				<div class="col justify-content-center mt-5 d-flex d-lg-none">
					<img
						class="mb-5 img-fluid"
						style="max-height: 350px;"
						src="./illustrations/watermelon/watermelon-pack-illustration-19.svg"
						alt=""
					/>
				</div>
				<div class="col d-flex flex-column justify-content-center text-center text-lg-end">
					<h1 class="display-3">ABIE G WEBSITE IS NOW LIVE!!!</h1>
					<p>
						In celebration for hitting the two-million [!!!] follower mark on each of her social
						media accounts, AbieG formally welcomes you (yes, you!) to her namesake website’s
						ribbon-cutting ceremony. Fancy.
					</p>
					<a href="/account" class="mt-5 btn btn-outline-primary ">Register Now</a>
				</div>
				<div class="col justify-content-center mt-5 d-none d-lg-flex">
					<img
						class="mb-5"
						src="./illustrations/watermelon/watermelon-pack-illustration-19.svg"
						style="max-height: 350px;"
						alt=""
					/>
				</div>
			</div>
		</div>
	</main>
</IntersectionObserver>
<IntersectionObserver threshold={0.2} element={hero2} bind:intersecting={isHero2Intersecting}>
	<main
		bind:this={hero2}
		style={isHero2Intersecting
			? 'transform: translateX(0); opacity: 1'
			: 'transform: translateX(10%); opacity: 0;'}
		class="d-flex align-items-center text-white my-5"
	>
		<div class="container">
			<div class="row row-cols-1 row-cols-lg-2">
				<div class="col justify-content-center mt-5 d-none d-lg-flex">
					<img
						class="mb-5"
						src="./illustrations/watermelon/watermelon-pack-illustration-05.svg"
						style="max-height: 350px;"
						alt=""
					/>
				</div>
				<div class="col justify-content-center mt-5 d-flex d-lg-none">
					<img
						class="mb-5"
						src="./illustrations/watermelon/watermelon-pack-illustration-05.svg"
						style="max-height: 350px;"
						alt=""
					/>
				</div>
				<div class="col d-flex flex-column justify-content-center text-center text-lg-start">
					<h1 class="display-3">Abie G Community Moderators</h1>
					<p>
						To ensure a safe space for the community members, this site is regularly kept in check
						by the moderators. Inappropriate conducts are strictly discouraged and violation to
						community rules may result to account suspension and/or removal.
					</p>
					<p>Just be active and you might be our next moderator</p>
				</div>
			</div>
		</div>
	</main>
</IntersectionObserver>
<IntersectionObserver threshold={0.2} element={hero3} bind:intersecting={isHero3Intersecting}>
	<main
		bind:this={hero3}
		style={isHero3Intersecting
			? 'transform: translateX(0); opacity: 1'
			: 'transform: translateX(-10%); opacity: 0;'}
		class="d-flex align-items-center text-white my-5"
	>
		<div class="container">
			<div class="row row-cols-1 row-cols-lg-2">
				<div class="col justify-content-center mt-5 d-flex d-lg-none">
					<img
						class="mb-5"
						src="./illustrations/watermelon/watermelon-pack-illustration-20.svg"
						style="max-height: 350px;"
						alt=""
					/>
				</div>
				<div class="col d-flex flex-column justify-content-center text-center text-lg-end">
					<h1 class="display-3">Connect with Abie G with exclusive content</h1>
					<p>
						This site takes BabieGs to a much more intimate interaction with AbieG herself as she
						shares with them glimpses of her everyday life, ambitions, and aspirations as well as
						site-exclusive giveaways and surprises.
					</p>
				</div>
				<div class="col justify-content-center mt-5 d-none d-lg-flex">
					<img
						class="mb-5"
						src="./illustrations/watermelon/watermelon-pack-illustration-20.svg"
						style="max-height: 350px;"
						alt=""
					/>
				</div>
			</div>
		</div>
	</main>
</IntersectionObserver>

<!-- for maintenance -->
<!-- <main style="display: flex; align-items:center;">
	<div class="container white-text">
		<h1>Sorry, we are fixing or updating something</h1>
		<p>Please come back in some time</p>
	</div>
</main> -->

<!-- <svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
</svelte:head> -->
<style lang="scss">
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

	.hero {
		/* margin: 0; */
		min-height: 100vh;
		overflow: hidden;
		z-index: 3;
	}
	main {
		transition: 500ms ease all;
		min-height: 70vh;
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
		width: 100%;
		overflow: hidden;
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

	.mouse {
		position: absolute;
		right: 0;
		top: -100px;
		width: 40px;
		height: 65px;
		border-radius: 100px;
		border: solid white 3px;
		&::before {
			content: '';
			position: absolute;
			width: 5px;
			height: 5px;
			top: 0;
			left: 50%;
			background: white;
			border-radius: 100px;
			transform: translateX(-50%);
			animation: scrolldown 2s infinite;
			@keyframes scrolldown {
				0% {
					transform: translateX(-50%) translateY(10px);
					opacity: 0;
				}
				50% {
					opacity: 1;
				}
				100% {
					transform: translateX(-50%) translateY(30px);
					opacity: 0;
				}
			}
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
