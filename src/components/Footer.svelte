<script>
	let scrollY;
	const scrollToTop = (e) => {
		scrollY = 0;
	};
</script>

<svelte:window bind:scrollY />

<footer class="footer text-white py-5 px-2 bg-grey-900">
	<div class="container">
		<div class="row">
			<div
				class="col-12 col-lg-4 mb-4 mb-lg-0 d-flex align-items-center justify-content-center"
				style="cursor: pointer;"
				on:click={scrollToTop}
			>
				<p style="font-size: 1.2em; margin: 0;">© 2021 | ABIE G</p>
			</div>
			<div class="col-12 col-lg-8 d-flex align-items-center justify-content-around">
				<a class="link-light me-2" href="facebook.com"
					><i class="bi bi-facebook" style="font-size: 1.2em; " /></a
				>
				<a class="link-light me-2" href="twitch.tv"
					><i class="bi bi-twitch" style="font-size: 1.2em;" /></a
				>
				<a class="link-light me-2" href="twitter.com"
					><i class="bi bi-twitter" style="font-size: 1.2em;" /></a
				>
				<a class="link-light me-2" href="instagram.com"
					><i class="bi bi-instagram" style="font-size: 1.2em;" /></a
				>
			</div>
		</div>
	</div>
</footer>

<style lang="scss">
	.footer {
		bottom: 0;
		z-index: 999;
	}
	/* main {
		position: absolute;
		height: 50px;
		width: 100%;
		background: #231942;
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		border-top-left-radius: 10px;
		border-top-right-radius: 10px;
	}
	main .container {
		width: 80vw;
		display: flex;
		justify-content: flex-start;
		align-items: center;
	}
	main .container img {
		width: 40px;
		margin-right: 20px;
	} */
</style>
