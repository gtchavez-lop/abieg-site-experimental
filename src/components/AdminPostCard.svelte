<script>
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';

	import { fly, fade, scale, slide } from 'svelte/transition';
	import { supabase } from '../global';
	export let blog;
	export let index;

	let isDeleting = false;
	let isEditing = false;
	let new_isExclusive = blog.isExclusive;
	let new_imageURI = blog.header_img;
	let new_blogContent = blog.content;

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
<div class="accordion-item bg-transparent">
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
										<h6>{blog.created_at}</h6>
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
								style="height: 100px"
								bind:value={new_blogContent}
							/>
							<label for="blog_content">New Blog Content</label>
						</div>
					{/if}
				</div>
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
</style>
