<script>
	import { fly, fade, scale, slide } from 'svelte/transition';
	import { supabase } from '../global';
	export let blog;

	let isActive = false;
	let isDeleting = true;

	let toggleActive = (e) => {
		if (isActive) {
			isActive = false;
		} else {
			isActive = true;
		}
	};
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

<div class="row  ">
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
						<!-- id -->
						<div class="col s3">
							<p>Blog UID</p>
						</div>
						<div class="col s9">
							<p>{blog.id.toUpperCase()}</p>
						</div>
						<!-- is exclusive -->
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
						<!-- publisher -->
						<div class="col s3">
							<p>Publisher</p>
						</div>
						<div class="col s9">
							<p>{blog.author}</p>
						</div>
						<!-- date created -->
						<div class="col s3">
							<p>Created at</p>
						</div>
						<div class="col s9">
							<p>{blog.created_at}</p>
						</div>
						<!-- image URI -->
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
			<img src={blog.header_img} alt="" class="headerimage" />
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
</div>

<style>
	.blogContainer {
		padding: 1em;
		margin-left: 1em;
		border-radius: 10px;
		margin-top: 2em;
		user-select: none;
	}
	.title {
		cursor: pointer;
	}
	.material-icons {
		transition: 500ms ease all;
	}
	.inverted {
		transform: rotate(-180deg);
	}
</style>
