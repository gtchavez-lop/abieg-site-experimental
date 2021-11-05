<script>
	import { slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import dayjs from 'dayjs';

	export let blogData;

	let scrollY;
</script>

<svelte:window bind:scrollY />

<main>
	<div>
		<div
			class="imgContainer"
			in:slide={{ duration: 800, easing: quintOut }}
			out:fly={{ y: -20, duration: 500, easing: quintOut }}
			style="opacity: {1 - scrollY / 500}; transform: translateY(-{Math.min(
				(scrollY / 500) * 100,
				500
			)}px);"
		>
			<img src={blogData.header_img} alt="" />

			{#if blogData.isExclusive}
				<h6
					class="exlusiveContent text-white "
					in:fly={{ y: 50, duration: 500, delay: 500, easing: quintOut }}
				>
					<span in:fly={{ y: 10, duration: 500, delay: 800, easing: quintOut }}>EXCLUSIVE</span>
				</h6>
			{/if}
		</div>
		<div
			in:fly={{ y: 60, duration: 500, delay: 500 }}
			out:fly={{ y: -60, duration: 500 }}
			class="mb-5"
		>
			<div class="container text-white">
				<div class="row">
					<div class="col-sm-12 col-md-8" />
					<div
						class="col-sm-12 col-md-4 d-flex justify-content-end"
						in:fly={{ x: 20, duration: 500, delay: 1200 }}
					>
						<a href="/posts" class="btn btn-lg text-white bg-secondary ">
							<i class="bi bi-x me-3" style="font-size: 1.1em;" />
							<span>Close Article</span>
						</a>
					</div>
				</div>
				<div class="row mt-3">
					<div class="col-12">
						{#if blogData}
							<h3 class="display-1">{blogData.title}</h3>
							<h5>by: {blogData.author} | {dayjs(blogData.createdAt).format('DD MMM, YYYY')}</h5>
						{/if}
					</div>
					<div class="col-12 mt-5">
						{#if blogData}
							<p class="flow-text white-text">{@html blogData.content}</p>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
</main>

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		z-index: 3;
		animation: slide 500ms ease-out 200ms;
	}
	.imgContainer {
		position: relative;
		top: 0;
		width: 100%;
		height: 50vh;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1;
		perspective: 1px;
		opacity: 1;
		overflow: hidden;
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 20px;
		transition: all 200ms ease;
		margin-bottom: 5vh;
		&:hover {
			height: 60vh;
			.exlusiveContent {
				opacity: 0.4;
			}
		}
		img {
			position: absolute;
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}
	.exlusiveContent {
		position: absolute;
		background: #d63384;
		bottom: 0;
		right: 0;
		min-height: 50px;
		min-width: 200px;
		height: 20%;
		width: 40%;
		font-size: 2em;
		margin: 0;
		border-top-left-radius: 20px;
		box-shadow: rgba(0, 0, 0, 0.5) 0 0 20px;
		z-index: 2;
		transition: all 200ms ease;
		span {
			position: absolute;
			bottom: 10%;
			right: 10%;
			margin: 0;
		}
	}
	@media screen and (max-width: 800px) {
		.exlusiveContent {
			width: 100%;
			height: 15%;
			border-radius: 20px;
			font-size: 1.5em;
		}

		.imgContainer {
			border-top-left-radius: 0;
			border-top-right-radius: 0;
			img {
				width: 200%;
			}
		}
	}
</style>
