<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { expoIn, expoOut } from 'svelte/easing';
	import Marquee from 'svelte-marquee';
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container">
		<h1>See what's new</h1>
	</div>
	<div class="scroller">
		<Marquee reverse="true" content="SEE WHAT IS GOING ON" />
		<Marquee reverse="true" content="SEE WHAT IS GOING ON" />
	</div>
</main>

<style>
	main {
		min-height: 100vh;
		display: flex;
		justify-content: center;
		color: white;
	}
	main .container {
		margin-top: 100px;
		width: 80vw;
	}
	.scroller {
		position: fixed;
		bottom: 10%;
		left: -10%;
		color: white;
		opacity: 0.2;
		font-size: 10rem;
		font-family: 'Audiowide', cursive;
		transform: rotate(-10deg);
		user-select: none;
	}
	.scroller:first-child {
		margin-left: -50px;
	}
</style>
