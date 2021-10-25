<script>
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';
	import dayjs from 'dayjs';

	import { fly, fade, scale, slide } from 'svelte/transition';
	import { supabase } from '../global';
	export let blog;

	let isDeleting = false;
	let isEditing = false;
	let new_title = blog.title;
	let new_isExclusive = blog.isExclusive;
	let new_imageURI = blog.header_img;
	let new_blogContent = blog.content;
	let isContentRevealed = false;

	let confirmDelete = (e) => {
		if (isDeleting) {
			isDeleting = false;
		} else {
			isDeleting = true;
		}
	};
	let confirmEdit = (e) => {
		if (isEditing) {
			isEditing = false;
			new_isExclusive = blog.isExclusive;
			new_imageURI = blog.header_img;
			new_blogContent = blog.content;
			new_title = blog.title;
		} else {
			isEditing = true;
		}
	};
	let deletePost = async (e) => {
		if (blog) {
			let { data, error } = await supabase.from('posts').delete().match({ id: blog.id });

			if (!error) {
				location.reload();
			}
		}
	};
	let updatePost = async (e) => {
		let { data, error } = await supabase
			.from('posts')
			.update({
				title: new_title,
				isExclusive: new_isExclusive,
				header_img: new_imageURI == '' ? 'https://picsum.photos/500/500' : new_imageURI,
				content: new_blogContent
			})
			.eq('id', blog.id);

		toast.push('Post Updated', {
			onpop: (e) => {
				location.reload();
			}
		});
	};
</script>

<SvelteToast options={{ reversed: true, intro: { y: -20 }, duration: 500 }} />

<div class="col bg-transparent">
	<div class="card overflow-hidden" style="width: 100%; background: #343A40;">
		<img
			src={new_imageURI}
			alt={blog.title}
			class="card-img-top"
			height="250"
			style="object-fit: cover;"
		/>
		{#if new_isExclusive}
			<div class="exclusiveBadge" transition:fly|local={{ x: 20, y: -20, duration: 200 }}>
				<span>EXCLUSIVE</span>
			</div>
		{/if}
		<div class="card-body mt-3">
			<span class="text-muted">{blog.author}</span>
			<p class="card-title h5">{new_title}</p>

			<div class="form-check form-switch mb-5">
				<input
					class="form-check-input"
					bind:checked={isContentRevealed}
					type="checkbox"
					id="toggleContentView"
					aria-label={blog.id}
				/>
				<label class="form-check-label" for="toggleContentView">Toggle Content</label>
			</div>

			{#if isContentRevealed}
				<div class="container " transition:slide|local>
					{@html new_blogContent}
				</div>
			{/if}

			<div class="row row-cols-1 row-cols-lg-2 g-3">
				{#if !isEditing && !isDeleting}
					<div class="col" transition:slide|local>
						<button on:click={confirmEdit} style="width: 100%;" class="btn btn-outline-primary"
							>Edit Post</button
						>
					</div>
					<div class="col" transition:slide|local>
						<button on:click={confirmDelete} style="width: 100%;" class="btn btn-outline-danger"
							>Delete Post</button
						>
					</div>
				{/if}
				{#if isDeleting}
					<div class="col" transition:slide|local>
						<button on:click={confirmDelete} style="width: 100%;" class="btn btn-outline-primary"
							>No</button
						>
					</div>
					<div class="col" transition:slide|local>
						<button on:click={deletePost} style="width: 100%;" class="btn btn-outline-danger"
							>Yes</button
						>
					</div>
					<div class="col-12" transition:slide|local>
						<div class="h6 mt-3">You cannot retrieve this back.</div>
						<div class="h6">Are you sure you want to remove this story?</div>
					</div>
				{/if}

				{#if isEditing}
					<div class="col" transition:slide|local>
						<button on:click={confirmEdit} style="width: 100%;" class="btn btn-outline-primary"
							>Revert Changes</button
						>
					</div>
					<div class="col" transition:slide|local>
						<button on:click={updatePost} style="width: 100%;" class="btn btn-outline-success"
							>Update and Save</button
						>
					</div>
				{/if}
				{#if isEditing}
					<div class="col-12" transition:slide|local>
						<div class="row row-cols-1 mb-2">
							<div class="col">
								<div class="form-check form-switch my-4">
									<input
										class="form-check-input"
										bind:checked={new_isExclusive}
										type="checkbox"
										id={blog.id}
										aria-label={blog.id}
									/>
									<label class="form-check-label" for={blog.id}>Exlusive</label>
								</div>
							</div>
							<div class="col">
								<div class="form-floating mb-3">
									<input
										type="text"
										class="form-control bg-transparent text-white"
										bind:value={new_title}
										id="new_title"
									/>
									<label for="new_title">Story Title</label>
								</div>
							</div>
							<div class="col">
								<div class="form-floating mb-3">
									<input
										type="text"
										class="form-control bg-transparent text-white"
										bind:value={new_imageURI}
										id="new_imageURI"
									/>
									<label for="new_imageURI">Story Header Image</label>
								</div>
							</div>
							<div class="col">
								<div class="form-floating">
									<textarea
										class="form-control bg-transparent text-white"
										bind:value={new_blogContent}
										style="height: 400px;"
										placeholder="Your content here"
										id="new_content"
									/>
									<label for="new_content">Story Content</label>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	:root {
		--toastContainerTop: auto;
		--toastContainerRight: auto;
		--toastContainerBottom: 8rem;
		--toastContainerLeft: calc(50vw - 8rem);
	}

	.exclusiveBadge {
		position: absolute;
		right: 0;
		width: 200px;
		border-bottom-left-radius: 20px;
		height: 50px;
		/* transform: rotate(-10deg); */
		background: #d63384;
	}
	.exclusiveBadge span {
		font-size: 1.3em;
		position: absolute;
		bottom: 0;
		right: 10px;
	}
</style>
