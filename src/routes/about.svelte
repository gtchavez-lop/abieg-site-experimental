<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { expoIn, expoOut } from 'svelte/easing';
	import Marquee from 'svelte-marquee';
</script>

<svg width="0" height="0">
	<defs>
		<clipPath id="squircle" clipPathUnits="objectBoundingBox">
			<path d="M .5,0 C .1,0 0,.1 0,.5 0,.9 .1,1 .5,1 .9,1 1,.9 1,.5 1,.1 .9,0 .5,0 Z" />
		</clipPath>
	</defs>
</svg>
<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container white-text">
		<h2>About the Team</h2>
		<h4>Hi!</h4>
		<p>
			The website is a project by BSCS3A students from University of Caloocan City - Congress Campus
			to fulfill the requirement on Advanced Web Systems and is created solely for academic purposes
			only.
		</p>
	</div>
	<div class="container white-text" style="margin-top: 100px;">
		<h4>The Team behind the scences</h4>
		<div class="row">
			<div class="col s12 valign-wrapper center-align white-text profile profile-gerald">
				<div class="container blue lighten-2">
					<h5>Gerald Chavez</h5>
					<p>Project Manager, Lead Developer, and Lead Designer</p>
				</div>
			</div>
			<div class="col s12 valign-wrapper center-align white-text profile profile-gab">
				<div class="container blue lighten-2">
					<h5>Gabrielle Napoto</h5>
					<p>Content Manager and Designer</p>
				</div>
			</div>
			<div class="col s12 valign-wrapper center-align white-text profile profile-trizh">
				<div class="container blue lighten-2">
					<h5>Trizhalyn Maglangit</h5>
					<p>Content Manager and Designer</p>
				</div>
			</div>
			<div class="col s12 valign-wrapper center-align white-text profile profile-miks">
				<div class="container blue lighten-2">
					<h5>Mikkie Gregorio</h5>
					<p>Content Manager and Designer</p>
				</div>
			</div>
			<div class="col s12 valign-wrapper center-align white-text profile profile-carlo">
				<div class="container blue lighten-2">
					<h5>Carlo Diaz</h5>
					<p>Quality Testing and Assurance</p>
				</div>
			</div>
			<div class="col s12 valign-wrapper center-align white-text profile profile-kevin">
				<div class="container blue lighten-2">
					<h5>Kevin Corpin</h5>
					<p>Quality Testing and Assurance</p>
				</div>
			</div>
			<div class="col s12 valign-wrapper center-align white-text profile profile-edz">
				<div class="container blue lighten-2">
					<h5>Edriane Barcita</h5>
					<p>Server Hosting and Maintenance</p>
				</div>
			</div>
		</div>
	</div>
	<div class="container white-text" style="margin-top: 100px; margin-bottom: 100px">
		<h4>What made this site?</h4>
		<p><b>AbieG-vercel.app</b> is powered by SvelteKit</p>
		<p>Hosted in Vercel</p>
		<p>And supported by Supabase</p>
	</div>
	<!-- 
		<div class="card">
			<h4>About the website</h4>
			<p><b>AbieG-vercel.app</b> is powered by SvelteKit</p>
			<p>Hosted in Vercel</p>
			<p>And supported by Supabase</p>
		</div>
	</div> -->
</main>
<div class="scroller">
	<Marquee autoplay="true" reverse="true" content="WHO MADE THIS SITE?" />
	<Marquee autoplay="true" reverse="true" content="WHO MADE THIS SITE?" />
</div>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		font-family: 'Nunito';
		z-index: 3;
	}
	.container {
		padding-left: 1em;
		padding-right: 1em;
	}
	.profile {
		border-radius: 10px;
		height: 6em;
		transition: 200ms ease all;
		margin-bottom: 2em;
	}
	.profile .container {
		border-radius: 10px;
		transition: 200ms ease all;
		opacity: 0;
	}
	.profile-gerald {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gerald.jpg');

		background-position: center;
		background-size: cover;
	}
	.profile-gab {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png');
		background-position: center;
		background-size: cover;
	}
	.profile-trizh {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg');
		background-position: center;
		background-size: cover;
	}
	.profile-miks {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg');
		background-position: center;
		background-size: cover;
	}
	.profile-carlo {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg');
		background-position: center;
		background-size: cover;
	}
	.profile-kevin {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg');
		background-position: center;
		background-size: cover;
	}
	.profile-edz {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg');
		background-position: center;
		background-size: cover;
	}
	.profile:hover {
		height: 30em;
	}
	.profile:hover .container {
		transform: translateY(11em);
		opacity: 1;
	}

	.scroller {
		width: 120%;
		position: fixed;
		bottom: -15%;
		left: -10%;
		color: white;
		opacity: 0.2;
		font-size: 10rem;
		font-family: 'XoloniumRegular';
		transform: rotate(-10deg);
		user-select: none;
		z-index: 1;
	}
</style>
