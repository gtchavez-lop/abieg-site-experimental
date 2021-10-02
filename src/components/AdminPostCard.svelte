<script>
	import { fly, fade, scale, slide } from 'svelte/transition';
	import { supabase } from '../global';
	export let blog;
	export let index;

	let isDeleting = false;

	let confirmDelete = (e) => {
		if (isDeleting) {
			isDeleting = false;
		} else {
			isDeleting = true;
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
</script>

<div class="accordion-item bg-transparent">
	<h2 class="accordion-header">
		<button
			class="accordion-button"
			type="button"
			data-bs-toggle="collapse"
			data-bs-target="#acc_{index}"
			aria-expanded="true"
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
						{#if !isDeleting}
							<button style="min-width: 200px;" on:click={confirmDelete} class="btn btn-danger"
								>Delete Post</button
							>
						{/if}
						{#if isDeleting}
							<button style="min-width: 200px;" on:click={confirmDelete} class="btn btn-primary"
								>No</button
							>
							<button style="min-width: 200px;" on:click={deletePost} class="btn btn-danger"
								>Confirm Delete</button
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
									<td><h5>Blog UID</h5></td>
									<td><h6>{blog.id.toUpperCase()}</h6></td>
								</tr>
								<tr>
									<td><h5>Blog Visibility</h5></td>
									<td>
										{#if blog.isExclusive}
											<h6>Exclusive</h6>
										{:else}
											<h6>Public</h6>
										{/if}</td
									>
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
										<h6>{blog.header_img}</h6>
									</td>
								</tr>
								<tr>
									<td><h5>Header Image Preview</h5></td>
									<td>
										<img src={blog.header_img} width="200" alt="" />
									</td>
								</tr>
							</tbody>
						</table>
					</div>
					<div class="col-12 mt-5" />
				</div>

				<h3 class="mt-4">Blog Content</h3>
				<div class="col-12">
					<p>
						{@html blog.content}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- <div class="row  ">
	<div
		class="col blogContainer s12 valign-wrapper title blue-grey darken-3"
		on:click={toggleActive}
	>
		<i class={isActive ? 'material-icons inverted' : 'material-icons'} style="margin-right: 1em;">
			expand_more
		</i>
		<h6>{blog.title}</h6>
	</div>
	{#if isActive}
		<div class="col s12 " style="padding: 1em" transition:slide|local={{ duration: 500 }}>
			<h5>Blog Information</h5>

			<div class="row">
				<div class="col s12">
					<div class="row">
						
						<div class="col s3">
							<p>Blog UID</p>
						</div>
						<div class="col s9">
							<p>{blog.id.toUpperCase()}</p>
						</div>
						
						<div class="col s3">
							<p>Blog Visibility</p>
						</div>
						<div class="col s9">
							{#if blog.isExclusive}
								<p>Exclusive</p>
							{:else}
								<p>Public</p>
							{/if}
						</div>
						
						<div class="col s3">
							<p>Publisher</p>
						</div>
						<div class="col s9">
							<p>{blog.author}</p>
						</div>
						
						<div class="col s3">
							<p>Created at</p>
						</div>
						<div class="col s9">
							<p>{blog.created_at}</p>
						</div>
						
						<div class="col s3">
							<p>Header Image URI</p>
						</div>
						<div class="col s9">
							<p>{blog.header_img}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div
			class="col s12 "
			style="padding: 1em; margin-bottom: 1em;"
			transition:slide|local={{ duration: 500 }}
		>
			<h5>Blog Header Image Preview</h5>
			<img src={blog.header_img} width="500" height="500" alt="" class="headerimage" />
		</div>

		<div
			class="col s12 "
			style="padding: 1em; margin-bottom: 1em;"
			transition:slide|local={{ duration: 500 }}
		>
			<h5>Blog Content</h5>
			<p>{@html blog.content}</p>
		</div>

		<div class="col s12 " transition:slide|local={{ duration: 500 }}>
			{#if !isDeleting}
				<button on:click={deletePost} class="btn right red darken-3 waves-effect waves-light">
					<div class="valign-wrapper">
						<i class="material-icons" style="margin-right: 1em;">delete</i>
						<span>Confirm Delete</span>
					</div>
				</button>
				<button
					class="btn right blue darken-3 waves-effect waves-light"
					style="margin-right: 1em;"
					on:click={confirmDelete}
				>
					<div class="valign-wrapper">
						<i class="material-icons" style="margin-right: 1em;">cancel</i>
						<span>I changed my mind</span>
					</div>
				</button>
			{:else}
				<button class="btn right red darken-3 waves-effect waves-light" on:click={confirmDelete}>
					<div class="valign-wrapper">
						<i class="material-icons" style="margin-right: 1em;">delete</i>
						<span>Delete Post</span>
					</div>
				</button>
			{/if}
			<button
				class="btn right  blue-grey darken-4 waves-effect waves-light"
				style="margin-right: 1em;"
			>
				<div class="valign-wrapper">
					<i class="material-icons" style="margin-right: 1em;">edit</i>
					<span>Edit Post (unavailable)</span>
				</div>
			</button>
		</div>
	{/if}
</div> -->
<style>
</style>
