<script>
	import FullscreenNav from '../components/FullscreenNav.svelte';
	import Footer from '../components/Footer.svelte';
	let scrollY;
</script>

<svelte:window bind:scrollY />

<FullscreenNav />
<slot />
<Footer />

<div
	on:click={() => {
		setTimeout(() => {
			scrollY = 0;
		}, 100);
	}}
	class="scrolltotop"
	style="right: {scrollY < 400 ? '-50px' : '10px'};"
>
	<i class="bi bi-arrow-up" />
</div>

<style>
	.scrolltotop {
		position: fixed;
		width: 50px;
		height: 50px;
		color: #fff;
		top: calc(90% - 25px);
		border-radius: 100px;
		background: #002b36;
		right: 10px;
		z-index: 99;
		transition: 200ms ease all;
		display: flex;
		justify-content: center;
		align-items: center;
		cursor: pointer;
	}
</style>
