<script>
	import { slide, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import dayjs from 'dayjs';
	import { get, readable, writable } from 'svelte/store';
	import { supabase } from '../../../global';
	import { onMount } from 'svelte';
	import Toastify from 'toastify-js';
	import 'toastify-js/src/toastify.css';

	export let blogData;

	let user;
	let scrollY;
	let userComment = '';

	onMount(async (e) => {
		user = await supabase.auth.user();
	});

	const _comments = readable(null, (set) => {
		supabase
			.from('comments')
			.select('*')
			.then(({ data, error }) => {
				if (error) {
					console.log(error);
					return;
				}
				let commentsForThisPost = [];
				data.forEach((comment) => {
					if (comment.post == blogData.id) {
						commentsForThisPost.push(comment);
					}
				});

				userComment = '';
				set(commentsForThisPost);
			});

		const subscribe = supabase
			.from('comments')
			.on('*', (payload) => {
				if (payload.eventType === 'INSERT') {
					set([...get(_comments), payload.new]);
				}
				if (payload.eventType === 'DELETE') {
					let oldData = $_comments;
					let newData = oldData.filter((comment) => comment.id != payload.old.id);
					set(newData);
				}
			})
			.subscribe();

		return () => supabase.removeSubscription(subscribe);
	});

	const submitComment = async (e) => {
		let { data, error } = await supabase.from('comments').insert({
			commentor: user.email,
			content: userComment,
			post: blogData.id
		});
		if (error) {
			Toastify({
				text: `Something went wrong. ${error.message}`,
				duration: 1500,
				gravity: 'bottom',
				position: 'right',
				style: {
					background: '#F0583C',
					color: '#fff'
				}
			}).showToast();
			userComment = '';
			return;
		}
		if (data) {
			Toastify({
				text: `Comment Posted.`,
				duration: 1500,
				gravity: 'bottom',
				position: 'right',
				style: {
					background: '#7CC88D',
					color: '#111'
				}
			}).showToast();
			userComment = '';
		}
	};
</script>

<svelte:window bind:scrollY />

<main>
	<div>
		<div
			in:fly={{ y: 60, duration: 500, delay: 500 }}
			out:fly={{ y: -60, duration: 500 }}
			class="mb-5"
		>
			<div class="container text-white">
				<div class="row">
					<div
						class="col-sm-12 col-md-4 d-flex justify-content-start"
						in:fly|local={{ x: 20, duration: 500, delay: 1200 }}
					>
						<a href="/posts" class="btn btn-lg text-white">
							<i class="bi bi-arrow-left me-3" style="font-size: 1.1em;" />
							<span>Back to Posts</span>
						</a>
					</div>
					<div class="col-sm-12 col-md-8" />
				</div>
				<div class="row mt-3">
					<div class="col-12">
						{#if blogData}
							<h3 class="display-1">{blogData.title}</h3>
							<h5>by: {blogData.author} | {dayjs(blogData.createdAt).format('DD MMM, YYYY')}</h5>
						{/if}
					</div>
					<div class="imgContainer">
						<img src={blogData.header_img} alt={blogData.title} />
						{#if blogData.isExclusive}
							<h6
								class="exlusiveContent text-white "
								in:fly|local={{ y: -100, duration: 500, delay: 500, easing: quintOut }}
							>
								<span in:fly|local={{ y: -20, duration: 500, delay: 800, easing: quintOut }}
									>EXCLUSIVE</span
								>
							</h6>
						{/if}
					</div>
					<div class="col-12 mt-5">
						{#if blogData}
							<p class="flow-text white-text">{@html blogData.content}</p>
						{/if}
					</div>
				</div>
				<div class="d-flex flex-column mt-5 ">
					<h1>Comments</h1>

					{#if $_comments}
						{#if $_comments.length < 1}
							<p>No comments for this post</p>
						{/if}
						{#each $_comments as comment}
							<div
								class="card ms-5 mb-2 p-3 bg-transparent"
								in:fly|local={{ y: -20, duration: 500 }}
								style="border: solid white 2px;"
							>
								<div class="card-title">
									<span>{comment.commentor.split('@')[0]}</span>
									-
									<span>{dayjs(comment.created_at).format('MMMM DD YYYY @H:mm:ss A')}</span>
								</div>
								<div class="card-text">
									<p class="m-0">{comment.content}</p>
								</div>
							</div>
						{/each}
					{:else}
						<p>Loading</p>
					{/if}

					{#if !user}
						<h5 class="mt-5">Please sign in to comment to this post</h5>
					{:else}
						<h1 class="mt-5 mb-4">Comment to this post</h1>
						<form on:submit|preventDefault={submitComment}>
							<label for="commentContent" class="form-label"
								>Comment as <span class="text-success">{user.email.split('@')[0]}</span></label
							>
							<textarea
								rows="5"
								type="text"
								id="commentContent"
								class="form-control bg-transparent text-white"
								bind:value={userComment}
							/>
							<button class="btn btn-success mt-4 px-5">Comment</button>
						</form>
					{/if}
				</div>
			</div>
		</div>
	</div>
</main>

<style lang="scss">
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 15vh;
		margin-bottom: 15vh;
		z-index: 3;
		animation: slide 500ms ease-out 200ms;
	}
	.imgContainer {
		position: relative;
		top: 0;
		width: 100%;
		height: 60vh;
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 1;
		perspective: 1px;
		opacity: 1;
		overflow: hidden;
		transition: all 200ms ease;
		margin-bottom: 5vh;
		border-radius: 20px;
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
		top: 0;
		right: 0;
		min-height: 50px;
		min-width: 200px;
		height: 20%;
		width: 40%;
		font-size: 2em;
		margin: 0;
		border-bottom-left-radius: 20px;
		border-bottom-right-radius: 0px;
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
		main {
			margin-top: 10vh;
		}
		.exlusiveContent {
			width: 100%;
			height: 15%;
			border-top-left-radius: 20px;
			border-top-right-radius: 20px;
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
