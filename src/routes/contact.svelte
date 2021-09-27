<script>
	import { fly, fade } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';
</script>

<main in:fly={{ y: -40, duration: 500, delay: 750 }} out:fade={{ duration: 250 }}>
	<div class="container white-text">
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
	</div>
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

	.container1 {
		padding: 1em;
		border-radius: 10px;
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
