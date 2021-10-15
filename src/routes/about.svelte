<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
	import { onMount } from 'svelte';

	let _componentReady = false;

	onMount((e) => {
		_componentReady = true;
	});
</script>

<svele:head>
	<title>About Us | Abie G</title>
</svele:head>

<main in:fly={{ y: -40, duration: 500 }} out:fly={{ y: 40, duration: 500 }}>
	<div class="container text-white mb-5">
		<div class="row row-cols-1 row-cols-lg-2">
			<div class="col d-flex flex-column justify-content-center">
				<h2 class="display-3">Hi!</h2>
				<p class="lead">
					The website is a project by BSCS3A students from University of Caloocan City - Congress
					Campus to fulfill the requirement on Advanced Web Systems and is created solely for
					academic purposes only.
				</p>
			</div>
			<div class="col">
				<img
					class="mb-5"
					style="max-width: 800px; width: 120%;"
					src="./static/illustrations/undraw_Co-working_re_w93t.svg"
					alt=""
				/>
			</div>
		</div>
	</div>
	<div class="container text-white mb-5">
		<div class="row row-lg-reverse row-cols-1 row-cols-lg-2">
			<div class="col d-none d-sm-block">
				<img
					class="mb-5"
					style="max-width: 800px; width: 150%; transform: translateX(-50%)"
					src="./static/illustrations/undraw_programming_2svr.svg"
					alt=""
				/>
			</div>
			<div class="col d-flex flex-column justify-content-center text-end">
				<h2 class="display-3">What made this site?</h2>
				<div class="row row-cols-3 justify-content-between mt-5">
					<div class="d-flex flex-column align-items-center text-center">
						<img width="100" style="border-radius: 10px;" src="./logo/svelte.png" alt="" />
						<p class="lead">Svelte Kit</p>
						<p class="lead">for interaction</p>
					</div>
					<div class="d-flex flex-column align-items-center text-center">
						<img width="100" style="border-radius: 10px;" src="./logo/vercel.png" alt="" />
						<p class="lead">Vercel</p>
						<p class="lead">for deployment</p>
					</div>
					<div class="d-flex flex-column align-items-center text-center">
						<img width="100" style="border-radius: 10px;" src="./logo/supabase.jpg" alt="" />
						<p class="lead">Supabase</p>
						<p class="lead">for content</p>
					</div>
				</div>
			</div>
			<div class="col d-block d-lg-none">
				<img
					class="mb-5"
					style="max-width: 800px; width: 150%; transform: translateX(-50%)"
					src="./static/illustrations/undraw_programming_2svr.svg"
					alt=""
				/>
			</div>
		</div>
	</div>
	<div class="container text-white mb-5">
		<h2 class="display-3 mb-5">Meet the creators</h2>
		<div
			id="aboutUsCarouselControls"
			class="carousel slide"
			data-bs-ride="carousel"
			data-bs-interval="3000"
		>
			<div class="carousel-inner">
				<div class="carousel-item active">
					<div class="row">
						<div class="col-sm-12 d-flex flex-column justify-content-center align-items-center">
							<img
								src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gerald.jpg"
								alt=""
								style="max-width: 350px; width: 100%;"
							/>
							<h3 class="mt-5 display-6">Gerald Chavez</h3>
							<p>Lead Developer, Lead Designer, & Project Manager</p>
						</div>
					</div>
				</div>
				<div class="carousel-item">
					<div class="row">
						<div class="col-sm-6 d-flex flex-column justify-content-center align-items-center">
							<img
								src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png"
								alt=""
								style="max-width: 350px; width: 100%;"
							/>
							<h3 class="mt-5 display-6">Gabrielle Napoto</h3>
							<p>Designer, Content Manager, & Abie G</p>
						</div>
						<div class="col-sm-6 d-flex flex-column justify-content-center align-items-center">
							<img
								src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg"
								alt=""
								style="max-width: 350px; width: 100%; height: 100%;"
							/>
							<h3 class="mt-5 display-6">Trizhalyn Maglangit</h3>
							<p>Designer & Content Manager</p>
						</div>
					</div>
				</div>
				<div class="carousel-item">
					<div class="row">
						<div class="col-sm-6 d-flex flex-column justify-content-center align-items-center">
							<img
								src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg"
								alt=""
								style="max-width: 350px; width: 100%;"
							/>
							<h3 class="mt-5 display-6">Mikkie Gregorio</h3>
							<p>Designer & Content Manager</p>
						</div>
						<div class="col-sm-6 d-flex flex-column justify-content-center align-items-center">
							<img
								src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg"
								alt=""
								width="350"
								height="350"
							/>
							<h3 class="mt-5 display-6">Kevin Corpin</h3>
							<p>Quality Assurance</p>
						</div>
					</div>
				</div>
				<div class="carousel-item">
					<div class="row">
						<div class="col-sm-6 d-flex flex-column justify-content-center align-items-center">
							<img
								src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg"
								alt=""
								width="350"
								height="350"
							/>
							<h3 class="mt-5 display-6">Carlo Diaz</h3>
							<p>Quality Assurance</p>
						</div>
						<div class="col-sm-6 d-flex flex-column justify-content-center align-items-center">
							<img
								src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg"
								alt=""
								width="350"
								height="350"
							/>
							<h3 class="mt-5 display-6">Edriane Barcita</h3>
							<p>Server Maintenance and Management</p>
						</div>
					</div>
				</div>
			</div>
			<button
				class="carousel-control-prev"
				type="button"
				data-bs-target="#aboutUsCarouselControls"
				data-bs-slide="prev"
			>
				<span class="carousel-control-prev-icon" aria-hidden="true" />
				<span class="visually-hidden">Previous</span>
			</button>
			<button
				class="carousel-control-next"
				type="button"
				data-bs-target="#aboutUsCarouselControls"
				data-bs-slide="next"
			>
				<span class="carousel-control-next-icon" aria-hidden="true" />
				<span class="visually-hidden">Next</span>
			</button>
		</div>
	</div>
	<div class="scroller">
		<MarqueeTextWidget duration={10}
			>WHO MADE THIS SITE? &nbsp; WHO MADE THIS SITE? &nbsp; WHO MADE THIS SITE? &nbsp;</MarqueeTextWidget
		>
	</div>
</main>

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
	img {
		object-fit: cover;
		border-radius: 20px;
	}

	.scroller {
		width: 100vw;
		position: absolute;
		top: 0%;
		left: 0%;
		color: white;
		opacity: 0.1;
		font-size: 5rem;
		font-family: 'Thunder Bold';
		user-select: none;
		z-index: -10;
	}
</style>
