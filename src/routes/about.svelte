<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { expoIn, expoOut } from 'svelte/easing';
	import Marquee from 'svelte-marquee';
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container">
		<h1>About the team</h1>

		<div class="card">
			<h4>Hi!</h4>
			<p>
				The website is a project by BSCS3A students from University of Caloocan City - Congress
				Campus to fulfill the requirement on Advanced Web Systems and is created solely for academic
				purposes only.
			</p>
			<p>Any action you take upon the information on this website, you do so at your own risk.</p>
		</div>
		<div class="card">
			<h4>The Team behind the scenes</h4>
			<h5>Lead Designer and Programmer</h5>
			<div class="profileContainer">
				<div class="profile">
					<p>Gerald Chavez</p>
					<img src="./profile/gerald.jpg" alt="" />
				</div>
			</div>
			<h5>Designers and Content Managers</h5>
			<div class="profileContainer">
				<div class="profile">
					<p>Gabrielle Napoto</p>
					<img src="./profile/gab.png" alt="" />
				</div>
				<div class="profile">
					<p>Trizhalyn Maglangit</p>
					<img src="./profile/trizh.jpg" alt="" />
				</div>
				<div class="profile">
					<p>Mikkie Gregorio</p>

					<img src="./profile/miks.jpg" alt="" />
				</div>
			</div>
			<h5>Quality and Test Assurance</h5>
			<div class="profileContainer">
				<div class="profile">
					<p>Carlo Diaz</p>

					<img src="./profile/carlo.jpg" alt="" />
				</div>
				<div class="profile">
					<p>Kevin Corpin</p>
					<img src="./profile/kevin.jpg" alt="" />
				</div>
			</div>
			<h5>Server Maintenance and Hosting</h5>
			<div class="profileContainer">
				<div class="profile">
					<p>Edriane Barcita</p>

					<img src="./profile/edz.jpg" alt="" />
				</div>
			</div>
		</div>
		<div class="card">
			<h4>About the website</h4>
			<p><b>AbieG-vercel.app</b> is powered by SvelteKit</p>
			<p>Hosted in Vercel</p>
			<p>And supported by Supabase</p>
		</div>
	</div>
</main>
<div class="scroller">
	<Marquee autoplay="true" reverse="true" content="WHO MADE THIS SITE?" />
	<Marquee autoplay="true" reverse="true" content="WHO MADE THIS SITE?" />
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
		font-family: 'XoloniumRegular';
		transform: rotate(-10deg);
		user-select: none;
		z-index: 1;
	}

	main .card {
		margin-bottom: 5em;
		padding: 1em;

		border: #f88dad solid 0.2rem;
		border-radius: 10px;
	}
	main .card h4 {
		margin: 0;
		margin-bottom: 1em;
		font-size: 3rem;
	}
	main .card h5 {
		margin-bottom: 1em;
		font-size: 1.5rem;
		text-align: center;
	}
	.profileContainer {
		display: flex;
		justify-content: space-around;
	}
	.profile {
		position: relative;
		margin-bottom: 3em;
		display: flex;
		justify-content: center;
	}
	.profile p {
		position: absolute;
		bottom: -25%;
		font-size: 2rem;
		background: #819ef7;
		padding: 0.2em;
		padding-left: 0.5em;
		padding-right: 0.5em;
		border-radius: 10px;
		z-index: 2;
		min-width: 250px;
		text-align: center;
		width: max-content;
	}
	.profile img {
		border-radius: 100px;
		width: 200px;
		height: 200px;
		border-bottom-right-radius: 0;
		border-bottom-left-radius: 0;
		position: relative;
		object-fit: cover;
	}
	@media screen and (max-width: 1100px) {
		.profileContainer {
			flex-direction: column;
		}
	}
</style>
