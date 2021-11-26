<script>
	import { fly, fade, slide } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import { onMount } from 'svelte';
	import { supabase } from '../global';
	import toastify from 'toastify-js';

	export let id;

	let _blog;
	let isExclusive = false;
	let isEditing = false;
	let oldData;
	let isDeleting = false;
	let isUpdating = false;

	onMount(async (e) => {
		let { data, error } = await supabase.from('posts').select('*').eq('id', id);
		if (!error) {
			_blog = data[0];
			oldData = { ..._blog };
		}
	});

	const slugify = (str) => {
		str = str.replace(/^\s+|\s+$/g, '');
		str = str.toLowerCase();
		var from =
			'ÁÄÂÀÃÅČÇĆĎÉĚËÈÊẼĔȆÍÌÎÏŇÑÓÖÒÔÕØŘŔŠŤÚŮÜÙÛÝŸŽáäâàãåčçćďéěëèêẽĕȇíìîïňñóöòôõøðřŕšťúůüùûýÿžþÞĐđßÆa·/_,:;';
		var to =
			'AAAAAACCCDEEEEEEEEIIIINNOOOOOORRSTUUUUUYYZaaaaaacccdeeeeeeeeiiiinnooooooorrstuuuuuyyzbBDdBAa------';
		for (var i = 0, l = from.length; i < l; i++) {
			str = str.replace(new RegExp(from.charAt(i), 'g'), to.charAt(i));
		}
		str = str
			.replace(/[^a-z0-9 -]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-');

		oldData.slug = str;
	};

	const clearData = (e) => {
		oldData = _blog;
		isEditing = false;
	};

	let deletePost = async (e) => {
		let { data, error } = await supabase.from('posts').delete().eq('id', _blog.id);

		if (!error) {
			isDeleting = false;
			isEditing = false;
			toastify({
				text: `Post Updated`,
				duration: 2000,
				close: true,
				gravity: 'bottom',
				position: 'right',
				style: {
					background: '#F77E44',
					color: '#fff'
				}
			}).showToast();
		} else {
			toastify({
				text: error.message,
				duration: 2000,
				close: true,
				gravity: 'bottom',
				position: 'right',
				style: {
					background: '#F77E44',
					color: '#fff'
				}
			}).showToast();
		}
	};

	let updatePost = async (e) => {
		let { data, error } = await supabase
			.from('posts')
			.update({
				title: oldData.title,
				isExclusive: oldData.isExclusive,
				header_img:
					oldData.new_imageURI == '' ? 'https://picsum.photos/500/500' : oldData.new_imageURI,
				content: oldData.content
			})
			.eq('id', id);

		if (!error) {
			toastify({
				text: `Post Updated`,
				duration: 2000,
				close: true,
				gravity: 'bottom',
				position: 'right',
				style: {
					background: '#C3E186',
					color: '#fff'
				}
			}).showToast();
			isEditing = false;
		}
	};
</script>

{#if _blog}
	<div
		class="card w-100 bg-transparent text-white border-4"
		in:slide={{
			duration: 500,
			easing: expoOut
		}}
	>
		<div class="card-body">
			{#if _blog.isExclusive}
				<p class="strong" style="color: #F7749C;">EXCLUSIVE</p>
			{/if}
			<p class="lead">
				{_blog.title}
			</p>
			<p class="small m-0">
				./posts/{_blog.slug}
			</p>

			<button
				class="btn btn-success float-end mt-5"
				style="width: 50%; min-width: 200px;"
				on:click={(e) => {
					isEditing = true;
				}}
			>
				<i class="bi bi-pen me-2" />
				Edit Post
			</button>
		</div>
	</div>
{/if}

{#if isEditing}
	<div class="editPostOverlay pt-5 text-white" out:slide={{ duration: 500 }}>
		<div class="container mt-5">
			<div
				class="card bg-dark text-white"
				in:slide={{ duration: 500 }}
				out:fly={{ y: -100, duration: 500 }}
			>
				<div class="card-body">
					<!-- blog title -->
					<div class="input-group mb-3">
						<span class="input-group-text" id="blog_title">Blog Title</span>
						<input
							type="text"
							class="form-control text-white bg-transparent"
							style="text-align: right;"
							placeholder="Blog Title"
							aria-describedby="blog_title"
							bind:value={oldData.title}
							on:input={(e) => {
								slugify(oldData.title);
							}}
						/>
					</div>

					<!-- blog slug -->
					<div class="input-group mb-3">
						<span class="input-group-text" id="blog_slug">Blog Slug (Read Only)</span>
						<input
							type="text"
							class="form-control text-white bg-transparent"
							style="text-align: right;"
							placeholder="Blog Slug"
							aria-describedby="blog_slug"
							readonly
							bind:value={oldData.slug}
						/>
					</div>
					<!-- visibility -->
					<div class="d-grid gap-2 container mb-4">
						<button
							type="button"
							class="btn btn-outline-info btn-block"
							on:click={() => (oldData.isExclusive = !oldData.isExclusive)}
						>
							{#if oldData.isExclusive}
								Exclusive (Visible to registered users only)
							{:else}
								Public (Visible to all users)
							{/if}
						</button>
					</div>

					<!-- blog header image -->
					<div
						class=""
						style="background: url('{oldData.header_img}'); height: 200px; background-position: center center; background-size: cover;"
					/>
					<div class="input-group mb-3">
						<span class="input-group-text" id="blog_headerImage">Header Image</span>
						<input
							type="text"
							class="form-control text-white bg-transparent"
							style="text-align: right;"
							placeholder="Header Image"
							aria-describedby="blog_headerImage"
							bind:value={oldData.header_img}
						/>
					</div>

					<!-- actions -->
					{#if !isDeleting && !isUpdating}
						<div class="btn-group w-100 mt-5" role="group">
							<button type="button" class="btn btn-danger" on:click={(e) => (isDeleting = true)}
								>Delete Post</button
							>
							<button type="button" class="btn btn-success" on:click={(e) => (isUpdating = true)}
								>Update Post</button
							>
						</div>
					{/if}

					{#if isUpdating}
						<div class="btn-group w-100 mt-5" role="group">
							<button type="button" class="btn btn-primary" on:click={(e) => (isUpdating = false)}
								>Cancel Update</button
							>
							<button type="button" class="btn btn-success" on:click={updatePost}
								>Confirm Update</button
							>
						</div>
					{/if}
					{#if isDeleting}
						<div class="btn-group w-100 mt-5" role="group">
							<button type="button" class="btn btn-primary" on:click={(e) => (isDeleting = false)}
								>Cancel Delete</button
							>
							<button type="button" class="btn btn-danger" on:click={deletePost}
								>Confirm Delete</button
							>
						</div>
					{/if}
					<button type="button" class="btn btn-outline-primary  mt-3 w-100" on:click={clearData}
						>Cancel</button
					>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	.editPostOverlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 9;
	}
</style>
