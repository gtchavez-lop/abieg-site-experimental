<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container white-text" style="margin-top: 10em; margin-bottom: 100px">
		<h2>Hi!</h2>
		<p>
			The website is a project by BSCS3A students from University of Caloocan City - Congress Campus
			to fulfill the requirement on Advanced Web Systems and is created solely for academic purposes
			only.
		</p>
	</div>
	<div class="container white-text" style="margin-top: 10em; margin-bottom: 100px">
		<h2>What made this site?</h2>
		<p><b>AbieG-vercel.app</b> is powered by SvelteKit</p>
		<p>Hosted in Vercel</p>
		<p>And supported by Supabase</p>
	</div>
	<div class="container white-text" style="margin-top: 100px;">
		<h2>About the Team</h2>
		<div class="row" style="margin-top:10em;">
			<div class="col s12 devCard devCard_gerald">
				<h5>Gerald Chavez</h5>
				<p>Lead Developer</p>
			</div>
			<div class="col s12 devCard devCard_gab">
				<h5>Gabrielle Napoto</h5>
				<p>Content Manager and Designer / Abie G</p>
			</div>
			<div class="col s12 devCard devCard_trizh">
				<h5>Trizhalyn Maglangit</h5>
				<p>Content Manager and Designer</p>
			</div>
			<div class="col s12 devCard devCard_miks">
				<h5>Mikkie Gregorio</h5>
				<p>Content Manager and Designer</p>
			</div>
			<div class="col s12 devCard devCard_carlo">
				<h5>Carlo Diaz</h5>
				<p>Quality Testing and Assurance</p>
			</div>
			<div class="col s12 devCard devCard_kevin">
				<h5>Kevin Corpin</h5>
				<p>Quality Testing and Assurance</p>
			</div>
			<div class="col s12 devCard devCard_edz">
				<h5>Edriane Barcita</h5>
				<p>Server Hosting and Maintenance</p>
			</div>
		</div>
	</div>
</main>
<div class="scroller" transition:fade={{ duration: 500 }}>
	<MarqueeTextWidget duration={10}>WHO MADE THIS SITE? &nbsp;</MarqueeTextWidget>
</div>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}

	.devCard {
		cursor: default;
		position: relative;
		margin-bottom: 10em;
		transition: 200ms ease all;
	}
	.devCard h5 {
		font-family: 'Thunder Light';
		font-size: 4em;
		margin: 0;
		text-align: center;
	}
	.devCard p {
		font-family: 'Thunder Bold';
		font-size: 1.5em;
		margin: 0;
		text-align: center;
	}
	.devCard::before {
		content: '';
		opacity: 0;
		background: black;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		/* border-radius: 100%; */
		width: 50vw;
		height: 350px;
		z-index: -1;
		transition: 200ms ease all;
		border-radius: 10px;
	}
	.devCard:hover::before {
		opacity: 0.5;
	}
	@media screen and (max-width: 1000px) {
		.devCard::before {
			width: 100vw;
		}
	}

	.devCard_gerald::before {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gerald.jpg');
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}
	.devCard_gab::before {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png');
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}
	.devCard_trizh::before {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg');
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}
	.devCard_miks::before {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg');
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}
	.devCard_carlo::before {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg');
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}
	.devCard_kevin::before {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg');
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}
	.devCard_edz::before {
		background: url('https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg');
		background-position: center;
		background-size: cover;
		background-repeat: no-repeat;
	}

	.scroller {
		position: fixed;
		bottom: -7%;
		left: -10%;
		color: white;
		opacity: 0.2;
		font-size: 10rem;
		font-family: 'Thunder Bold';
		user-select: none;
		z-index: 1;
	}
</style>
