<script>
	import { fly, fade } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
</script>

<svele:head>
	<title>Connect With Us | Abie G</title>
</svele:head>

<main in:fly={{ y: -40, duration: 500, delay: 500 }} out:fly={{ y: 40, duration: 500 }}>
	<div class="container text-white">
		<p class="display-3">Connect with us</p>
		<div class="row mt-5">
			<div class="col-12">
				<h3>Write your thoughts</h3>
			</div>
			<div class="col-12 mt-3	">
				<form class="form-floating mb-3">
					<input
						type="email"
						class="form-control bg-transparent"
						id="email"
						placeholder="name@example.com"
					/>
					<label for="email">Your Email Address</label>
				</form>
				<div class="form-floating ">
					<textarea
						class="form-control bg-transparent"
						placeholder="Leave a comment here"
						id="comment"
					/>
					<label for="comment">Your can write your thoughts here</label>
				</div>
				<button class="btn btn-primary mt-5"
					><i class="bi bi-cloud-arrow-up me-2" style="font-size: 1.5em;" />Send your thoughts</button
				>
			</div>
		</div>
	</div>
	<div class="scroller" in:fade={{ duration: 500, delay: 500 }}>
		<MarqueeTextWidget duration={15}
			>KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;</MarqueeTextWidget
		>
	</div>
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
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
