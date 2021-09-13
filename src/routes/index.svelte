<img class="logo" src="./logo/Logo1.svg" alt="" />
<div class="background" />
<main>
	<h1>ABIEG</h1>
</main>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
</svelte:head>

<style>
	.logo {
		position: fixed;
		opacity: 0.1;
		width: 600px;
		top: calc(50% - 300px);
		left: calc(20% - 300px);
	}
	.background {
		position: fixed;
		width: 100%;
		height: 100%;
		background: url('https://images.unsplash.com/photo-1586765677067-f8030bd8e303?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80');
		background-size: cover;
		animation: clipping 20s ease infinite;
		clip-path: polygon(56% 0, 100% 0, 100% 100%, 33% 100%);
	}
	@keyframes clipping {
		50% {
			clip-path: polygon(70% 0, 100% 0, 100% 100%, 40% 100%);
		}
	}
	main {
		margin: 0;
		background: #1b1b1b;
		min-height: 100vh;
		overflow-x: hidden;
	}
	main * {
		margin: 0;
		user-select: none;
	}

	h1 {
		font-weight: 700;
		font-family: 'Audiowide', cursive;
		font-size: 10rem;
		position: absolute;
		top: 50%;
		left: 50%;
		width: 100%;
		text-align: center;
		transform: translate(-60%, -50%);
		color: rgb(238, 238, 238);
	}
</style>
