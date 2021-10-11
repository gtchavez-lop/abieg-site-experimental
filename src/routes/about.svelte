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

<section>
	{#if _componentReady}
		<main in:fly={{ y: -40, duration: 500 }} out:fly={{ y: 40, duration: 500 }}>
			<div class="container text-white mb-5">
				<h2 class="display-3">Hi!</h2>
				<p>
					The website is a project by BSCS3A students from University of Caloocan City - Congress
					Campus to fulfill the requirement on Advanced Web Systems and is created solely for
					academic purposes only.
				</p>
			</div>
			<div class="container text-white mb-5">
				<h2 class="display-3">What made this site?</h2>
				<p><b>AbieG-vercel.app</b> is powered by SvelteKit</p>
				<p>Hosted in Vercel</p>
				<p>And supported by Supabase</p>
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
										width="200"
										height="200"
										style="border-radius: 100%;"
									/>
									<h3 class="mt-5 display-6">Gerald Chavez</h3>
									<p>Lead Developer, Lead Designer, & Project Manager</p>
								</div>
							</div>
						</div>
						<div class="carousel-item">
							<div class="row">
								<div class="col-sm-12 d-flex flex-column justify-content-center align-items-center">
									<img
										src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/gab.png"
										alt=""
										width="200"
										height="200"
										style="border-radius: 100%;"
									/>
									<h3 class="mt-5 display-6">Gabrielle Napoto</h3>
									<p>Designer, Content Manager, & Abie G</p>
								</div>
							</div>
						</div>
						<div class="carousel-item">
							<div class="row">
								<div class="col-sm-12 d-flex flex-column justify-content-center align-items-center">
									<img
										src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/trizh.jpg"
										alt=""
										width="200"
										height="200"
										style="border-radius: 100%;"
									/>
									<h3 class="mt-5 display-6">Trizhalyn Maglangit</h3>
									<p>Designer & Content Manager</p>
								</div>
							</div>
						</div>
						<div class="carousel-item">
							<div class="row">
								<div class="col-sm-12 d-flex flex-column justify-content-center align-items-center">
									<img
										src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/miks.jpg"
										alt=""
										width="200"
										height="200"
										style="border-radius: 100%;"
									/>
									<h3 class="mt-5 display-6">Mikkie Gregorio</h3>
									<p>Designer & Content Manager</p>
								</div>
							</div>
						</div>
						<div class="carousel-item">
							<div class="row">
								<div class="col-sm-12 d-flex flex-column justify-content-center align-items-center">
									<img
										src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/kevin.jpg"
										alt=""
										width="200"
										height="200"
										style="border-radius: 100%;"
									/>
									<h3 class="mt-5 display-6">Kevin Corpin</h3>
									<p>Quality Assurance</p>
								</div>
							</div>
						</div>
						<div class="carousel-item">
							<div class="row">
								<div class="col-sm-12 d-flex flex-column justify-content-center align-items-center">
									<img
										src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/carlo.jpg"
										alt=""
										width="200"
										height="200"
										style="border-radius: 100%;"
									/>
									<h3 class="mt-5 display-6">Carlo Diaz</h3>
									<p>Quality Assurance</p>
								</div>
							</div>
						</div>
						<div class="carousel-item">
							<div class="row">
								<div class="col-sm-12 d-flex flex-column justify-content-center align-items-center">
									<img
										src="https://sgocnrgwrtdruxnxpxyl.supabase.in/storage/v1/object/public/developer-avatars/edz.jpg"
										alt=""
										width="200"
										height="200"
										style="border-radius: 100%;"
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
	{/if}
</section>

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
	img {
		object-fit: cover;
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
