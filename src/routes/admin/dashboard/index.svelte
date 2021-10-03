<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';
	import { global_mod_account, supabase } from '../../../global';
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';
	import AdminPostCard from '../../../components/AdminPostCard.svelte';

	// component variables
	let isLoggingOut = false;
	let hasBlog = null;
	let blogs;
	let username;
	let tabActive = 2;

	// blog content
	let blog_title;
	let blog_content;
	let blog_imageURI;
	let blog_visibility = false;

	// methods
	let toggleLogOut = (e) => {
		if (isLoggingOut) {
			isLoggingOut = false;
		} else {
			isLoggingOut = true;
		}
	};
	let logout = async (e) => {
		localStorage.setItem('data_mod', '');
		global_mod_account.set('');
		goto('/admin');
	};

	let postBlog = async (e) => {
		if (blog_title && blog_content) {
			const { data, error } = await supabase.from('posts').insert([
				{
					title: blog_title,
					author: $global_mod_account.username,
					content: blog_content,
					header_img: blog_imageURI ? blog_imageURI : 'https://picsum.photos/500/500',
					isExclusive: blog_visibility
				}
			]);

			if (!error) {
				toast.push('Blog posted');
				blog_title = '';
				blog_content = '';
				blog_visibility = false;
				location.reload();
			}
		} else {
			toast.push('Please fill out all forms');
		}
	};

	onMount((e) => {
		if (localStorage.getItem('data_mod') === null) {
			goto('/admin');
		} else {
			global_mod_account.set(JSON.parse(localStorage.getItem('data_mod')));

			(async (e) => {
				if ($global_mod_account) {
					const { data, error } = await supabase
						.from('posts')
						.select('*')
						.eq('author', $global_mod_account.username);

					hasBlog = null;
					if (error || data.length < 1) {
						hasBlog = false;
					}
					if (!error) {
						blogs = data;
						hasBlog = true;
					}
				}
			})();
		}
	});
</script>

<svele:head>
	<title>Dashboard | Abie G</title>
</svele:head>
<SvelteToast options={{ duration: 1000 }} />
<main
	style="margin-bottom: 10em;"
	in:fly={{ y: -20, duration: 500 }}
	out:fly={{ y: 20, duration: 500 }}
>
	<div class="container text-white">
		<p class="display-3">Moderator Dashboard</p>

		<div class="btn-group mt-3" role="group" aria-label="Basic example">
			<button
				on:click={(e) => {
					tabActive = 1;
				}}
				type="button"
				class="btn btn-outline-primary">Add a Story</button
			>
			<button
				on:click={(e) => {
					tabActive = 2;
				}}
				type="button"
				class="btn btn-outline-primary">Your Stories</button
			>
			<button
				on:click={(e) => {
					tabActive = 3;
				}}
				type="button"
				class="btn btn-outline-primary">Your Account</button
			>
		</div>

		<!-- tabs -->
		<div class="mt-5">
			{#if tabActive == 1}
				<div in:fly={{ x: 20, duration: 500 }}>
					<p class="display-5">Add a story</p>
					<div class="row mt-3">
						<div class="col-12">
							<div class="form-floating mb-3">
								<input
									type="text"
									class="form-control bg-transparent text-white"
									id="story_title"
									bind:value={blog_title}
								/>
								<label for="story_title">The Title of your story</label>
							</div>
						</div>
						<!-- <div class="col-12">
							<div class="form-floating mb-3">
								<input
									type="text"
									class="form-control bg-transparent text-white"
									id="story_author"
									bind:value={$global_mod_account.username}
									disabled
								/>
								<label for="story_author">The Author</label>
							</div>
						</div> -->
						<div class="col-12">
							<div class="form-floating mb-3">
								<input
									type="text"
									class="form-control bg-transparent text-white"
									id="story_imageUri"
									bind:value={blog_imageURI}
								/>
								<label for="story_imageUri">Story Header Image URL</label>
							</div>
							<p class="italic">
								*If you leave this blank, the site will generate a placeholder image
							</p>
						</div>
						<div class="col-12">
							<div class="form-floating mb-3">
								<textarea
									type="text"
									style="min-height: 10em;"
									class="form-control bg-transparent text-white"
									id="story_content"
									bind:value={blog_content}
								/>
								<label for="story_content">Story content</label>
							</div>
							<p class="italic">*We prefer you to write the story content in HTML</p>
						</div>
						<div class="col-12 mt-3">
							<div class="form-check form-switch">
								<input
									class="form-check-input"
									bind:checked={blog_visibility}
									type="checkbox"
									id="toggleVisibility"
								/>
								<label class="form-check-label" for="toggleVisibility">
									{#if blog_visibility}
										Exclusive Content
									{:else}
										Public Content
									{/if}
								</label>
							</div>
						</div>
						<div class="col-12 mt-5">
							<button on:click={postBlog} class="btn btn-primary">Post your story</button>
						</div>
					</div>
				</div>
			{/if}
			{#if tabActive == 2}
				<div in:fly={{ x: 20, duration: 500 }}>
					<p class="display-5">Your Stories</p>
					{#if $global_mod_account}
						<div class="row text-white">
							{#if hasBlog == null}
								<div class="spinner-border text-info" role="status">
									<span class="visually-hidden">Loading...</span>
								</div>
							{/if}
							{#if !hasBlog || blogs.length < 1}
								<div class="col-12">
									<h5>Seems like its empty</h5>
									<p>Make one of your own</p>
								</div>
							{:else}
								<div class="col-12">
									<h5>Available Stories</h5>
									<div class="accordion bg-transparent">
										{#each blogs as blog, index}
											<AdminPostCard {blog} {index} />
											<!-- <p>{blog.title}</p> -->
										{/each}
									</div>
								</div>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
			{#if tabActive == 3}
				<div in:fly={{ x: 20, duration: 500 }}>
					<p class="display-5">Your Moderator Account</p>
					{#if $global_mod_account}
						<table class="table text-white">
							<tbody>
								<tr>
									<td><h6>Account ID</h6></td>
									<td>{$global_mod_account.id}</td>
								</tr>
								<tr>
									<td><h6>Account Holder</h6></td>
									<td>{$global_mod_account.username}</td>
								</tr>
							</tbody>
						</table>

						<div class="mt-5">
							{#if !isLoggingOut}
								<button on:click={toggleLogOut} style="min-width: 200px;" class="btn btn-danger"
									>Log out</button
								>
							{:else}
								<button on:click={toggleLogOut} style="min-width: 200px;" class="btn btn-primary"
									>No</button
								>
								<button on:click={logout} style="min-width: 200px;" class="btn btn-danger"
									>Confirm Log out</button
								>
							{/if}
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		margin-top: 120px;
		z-index: 3;
	}
</style>
