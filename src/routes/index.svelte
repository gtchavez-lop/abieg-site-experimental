<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { expoIn, expoOut } from 'svelte/easing';
	import Footer from '../components/Footer.svelte';
	import BackgroundBlob from '../components/BackgroundBlob.svelte';

	const clippingPathIn = (node, params) => {
		return {
			delay: 500,
			duration: params.duration || 750,
			css: (t) => `clip-path: circle(${expoOut(t) * 140}% at 0% 100%);`
		};
	};
	const clippingPathOut = (node, params) => {
		return {
			delay: 500,
			duration: params.duration || 500,
			css: (t) => `clip-path: circle(${expoIn(t) * 140}% at 100% 0%);`
		};
	};
</script>

<!-- <div class="background" /> -->
<main in:clippingPathIn out:clippingPathOut>
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
			<span class="brand__lc_letter letter-g">G</span>
		</div>
	</div>
	<div class="brand__candy_rec1" />
	<div class="brand__candy_rec2" />
</main>
<Footer />

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
</svelte:head>

<style>
	.logo {
		position: fixed;
		opacity: 0.1;
		width: 1000px;
		top: calc(7 0% - 500px);
		right: calc(5% - 300px);
	}
	.background {
		position: fixed;
		width: 100%;
		height: 100%;
		background: url('https://images.unsplash.com/photo-1586765677067-f8030bd8e303?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
		background-size: cover;
		background-position: center;
		/* animation: clipping 20s ease infinite; */
		clip-path: polygon(56% 0, 100% 0, 100% 100%, 33% 100%);
	}
	@media screen and (max-width: 800px) {
		.background {
			clip-path: polygon(0 30%, 100% 45%, 100% 100%, 0% 100%);
		}
	}

	@keyframes clipping {
		50% {
			clip-path: polygon(70% 0, 100% 0, 100% 100%, 40% 100%);
		}
	}
	main {
		margin: 0;
		min-height: 100vh;
		overflow: hidden;
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

	.letter-g {
		background: #1b1b1b;
	}
	.brand__candy_rec1 {
		position: absolute;
		left: 100px;
		top: 0;
		width: 50px;
		height: 100%;
		background: #f88dad;
	}
	.brand__candy_rec2 {
		position: absolute;
		left: 0;
		bottom: 100px;
		width: 100%;
		height: 50px;
		background: #4f56b6;
	}
	@media screen and (max-width: 800px) {
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
	}
</style>
