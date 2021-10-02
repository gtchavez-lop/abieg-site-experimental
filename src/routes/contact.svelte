<script>
	import { fly, fade } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
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
	<!-- <div class="container white-text">
		<h2>Keep in touch</h2>
		<div class="container1 blue-grey darken-4">
			<div class="row">
				<div class="col">
					<h5>Write your thoughts</h5>
				</div>
			</div>
			<div class="row">
				<div class="input-field col s12 m6 white-text">
					<i class="material-icons prefix">email</i>
					<input id="email" type="text" class="validate  white-text" />
					<label for="email">Email Address</label>
				</div>
				<div class="input-field col s12 white-text">
					<textarea id="textarea1" class="materialize-textarea white-text" />
					<label for="textarea1">Your thoughts here</label>
				</div>
			</div>
			<div class="row center-align">
				<div class="col s12">
					<button class="waves-effect waves-light btn-large pink darken-4 "
						>Send some thoughts<i class="material-icons right">send</i></button
					>
				</div>
			</div>
		</div>
	</div> -->
</main>
<div class="scroller" transition:fade={{ duration: 500 }}>
	<MarqueeTextWidget duration={15}
		>KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;KEEP IN TOUCH &nbsp;</MarqueeTextWidget
	>
</div>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
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
