<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { expoIn, expoOut } from 'svelte/easing';
	import Footer from '../components/Footer.svelte';
	import BackgroundBlob from '../components/BackgroundBlob.svelte';
	import { onMount } from 'svelte';
	import anime from 'animejs';
	import { text } from 'svelte/internal';

	let rec1;
	let rec2;
	let letterG;
	let isMounted = false;

	let texteffect;
	onMount((e) => {
		isMounted = true;
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
			let text = new Blotter.Text('visualize', {
				family: 'serif',
				fill: '#171717',
				size: '70'
			});
		}, 750);
	});
</script>

<!-- <div class="background" /> -->
<main class={isMounted ? 'transitioner transitioner-mounted' : 'transitioner'}>
	<div class="videoContainer">
		<video autoplay loop muted>
			<source src="./video-tiktok.mp4" type="video/mp4" />
		</video>
	</div>
	<img
		class="logo"
		src="./logo/Logo1.svg"
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
		<h1 class="textEffectContainer">Join us with Abie G to VIRTUALIZE the world</h1>
		<a href="/account">
			<button class="joinbutton"> Register Now </button>
		</a>
	</div>
	<div bind:this={rec1} class="brand__candy_rec1" />
	<div bind:this={rec2} class="brand__candy_rec2" />
</main>
<main>
	<p>asd</p>
</main>
<Footer />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
</svelte:head>

<style>
	.videoContainer {
		position: fixed;
		width: 100%;
		height: 100%;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.videoContainer video {
		height: 100%;
		opacity: 0.05;
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
	}
	.transitioner {
		transition: 750ms cubic-bezier(0.1, 0.69, 0.3, 0.91) all 500ms;
		clip-path: circle(0vw at 0% 100%);
	}
	.transitioner-mounted {
		clip-path: circle(200vh at 0% 100%);
	}

	main {
		margin: 0;
		min-height: 100vh;
		overflow: hidden;
		z-index: 2;
	}
	main * {
		margin: 0;
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
		font-family: 'Audiowide', cursive;
		font-size: 8rem;
		width: 150px;
		height: 150px;
		color: transparent;
		display: flex;
		justify-content: center;
		align-items: center;
		-webkit-text-stroke-width: 0.2px;
		-webkit-text-stroke-color: rgba(255, 255, 255);
	}
	.brand__candy_rec1 {
		position: fixed;
		left: 100px;
		bottom: 0;
		width: 50px;
		height: 0;
		background: #f88dad;
		z-index: 1;
	}
	.brand__candy_rec2 {
		position: fixed;
		left: 0;
		bottom: 100px;
		width: 0%;
		height: 50px;
		background: #4f56b6;
		z-index: 1;
	}
	.content {
		position: absolute;
		right: 5%;
		bottom: 20%;
		color: white;
		text-align: right;
	}
	@media screen and (max-width: 800px) {
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
			left: calc(50px - 7.5px);
		}
		.brand__candy_rec2 {
			bottom: calc(50px - 7.5px);
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
</style>
