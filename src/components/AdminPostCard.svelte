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

	let toggle_edit_photo = (e) => {
		if (isDeleting) {
			isDeleting = false;
		} else {
			isDeleting = true;
		}
	};
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
			console.log(data);
			console.log(error);

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
			<p class="card-title h5">{new_title}</p>

			<div class="form-check form-switch mb-5">
				<input
					class="form-check-input"
					bind:checked={isContentRevealed}
					type="checkbox"
					id="toggleContentView"
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
										id="new_visibility"
									/>
									<label class="form-check-label" for="new_visibility">Exlusive</label>
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

<!-- <div class="accordion-item bg-transparent">
	<h2 class="accordion-header">
		<button
			class="accordion-button"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#acc_{index}"
			aria-expanded="false"
			aria-controls="acc_{index}"
		>
			{blog.title}
		</button>
	</h2>
	<div id="acc_{index}" class="accordion-collapse collapse" aria-labelledby="headingOne">
		<div class="accordion-body">
			<div class="accordion-body">
				<h3>Commands</h3>
				<div class="row mb-5">
					<div class="col-12">
						{#if !isDeleting && !isEditing}
							<button style="min-width: 200px;" on:click={confirmDelete} class="btn btn-danger"
								><i class="bi bi-trash me-3" />Delete Post</button
							>
							<button style="min-width: 200px;" on:click={confirmEdit} class="btn btn-primary"
								><i class="bi bi-pen me-3" />Edit Post</button
							>
						{/if}
						{#if isDeleting}
							<button style="min-width: 200px;" on:click={confirmDelete} class="btn btn-primary"
								><i class="bi bi-x-circle me-3" />Do not Delete</button
							>
							<button style="min-width: 200px;" on:click={deletePost} class="btn btn-danger"
								><i class="bi bi-trash me-3" />Confirm Delete</button
							>
						{/if}
						{#if isEditing}
							<button style="min-width: 200px;" on:click={confirmEdit} class="btn btn-primary"
								><i class="bi bi-arrow-counterclockwise me-3" />Discard Changes</button
							>
							<button style="min-width: 200px;" on:click={updatePost} class="btn btn-success"
								><i class="bi bi-save me-3" />Save Changes</button
							>
						{/if}
					</div>
				</div>
				<h3>Blog Information</h3>
				<div class="row">
					<div class="col-12">
						<table class="table text-white">
							<tbody>
								<tr>
									<td width="300"><h5>Blog UID</h5></td>
									<td><h6>{blog.id}</h6></td>
								</tr>
								<tr>
									<td><h5>Blog Visibility</h5></td>
									<td>
										{#if !isEditing}
											{#if blog.isExclusive}
												<h6>Exclusive</h6>
											{:else}
												<h6>Public</h6>
											{/if}
										{:else}
											<div class="form-check form-switch">
												<input
													class="form-check-input"
													bind:checked={new_isExclusive}
													type="checkbox"
													id="toggleVisibility"
												/>
												<label class="form-check-label" for="toggleVisibility">
													{#if new_isExclusive}
														Exclusive Post
													{:else}
														Public Post
													{/if}
												</label>
											</div>
										{/if}
									</td>
								</tr>
								<tr>
									<td><h5>Publisher</h5></td>
									<td>
										<h6>{blog.author}</h6>
									</td>
								</tr>
								<tr>
									<td><h5>Created at</h5></td>
									<td>
										<h6>{dayjs(blog.created_at).format('MM-DD-YYYY @HH:MM')}</h6>
									</td>
								</tr>
								<tr>
									<td><h5>Updated at</h5></td>
									<td>
										<h6>{dayjs(blog.updated_at).format('MM-DD-YYYY @HH:MM')}</h6>
									</td>
								</tr>
								<tr>
									<td><h5>Header Image URI</h5></td>
									<td>
										{#if !isEditing}
											<h6>{blog.header_img}</h6>
										{:else}
											<div class="form-floating">
												<input
													type="text"
													bind:value={new_imageURI}
													class="form-control bg-transparent text-white"
													id="image_uri"
													placeholder="New Image URI"
												/>
												<label for="image_uri">New Image URI</label>
											</div>
										{/if}
									</td>
								</tr>
								<tr>
									<td><h5>Header Image Preview</h5></td>
									<td>
										<img src={new_imageURI} width="200" alt="" />
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="col-12 mt-5" />
				</div>

				<h3 class="mt-4">Blog Content</h3>
				<div class="col-12">
					{#if !isEditing}
						{@html blog.content}
					{:else}
						<div class="form-floating">
							<textarea
								class="form-control bg-transparent text-white"
								id="blog_content"
								style="height: 300px"
								bind:value={new_blogContent}
							/>
							<label for="blog_content">New Blog Content</label>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div> -->
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
