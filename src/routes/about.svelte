<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { expoIn, expoOut } from 'svelte/easing';
	import Marquee from 'svelte-marquee';
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container">
		<h1>About the team</h1>

		<div class="card">
			<h3>Hi!</h3>
			<p>We are from BS Computer Science 3A</p>
			<p>Please do note that this website is for academic purpose only</p>
			<p>To fulfill the requirement to the course, Advanced Web Systems</p>
		</div>
		<div class="card">
			<h3>The Team behind the scenes</h3>
			<h4>Lead Designer and Programmer</h4>
			<p>Gerald Chavez</p>
			<h4>Designers and Content Managers</h4>
			<p>Gabriele Napoto</p>
			<p>Trizhalyn Maglangit</p>
			<p>Mikkie Gregorio</p>
			<h4>Quality and Test Assurance</h4>
			<p>Carlo Diaz</p>
			<p>Kevin Corpin</p>
			<h4>Server Maintenance and Hosting</h4>
			<p>Edriane Barcita</p>
		</div>
		<div class="card">
			<h3>About the website</h3>
			<p>This website is powered by SvelteKit</p>
			<p>Hosted in Vercel</p>
			<p>And supported by Supabase</p>
		</div>
	</div>
</main>
<div class="scroller">
	<Marquee reverse="true" content="WHO MADE THIS SITE?" />
	<Marquee reverse="true" content="WHO MADE THIS SITE?" />
</div>

<style>
	main {
		min-height: 100vh;
		display: flex;
		justify-content: center;
		color: white;
		z-index: 3;
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
		z-index: 1;
	}

	main .card {
		margin-bottom: 5em;
		padding: 1em;
		background: #f88dad;
		border-radius: 10px;
	}
	main .card h3 {
		margin: 0;
		margin-bottom: 1em;
		font-size: 3rem;
	}
	main .card h4 {
		margin-top: 2em;
	}
</style>
