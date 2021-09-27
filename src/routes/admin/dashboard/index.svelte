<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';
	import { global_mod_account, supabase } from '../../../global';

	import AdminPostCard from '../../../components/AdminPostCard.svelte';

	// component variables
	let isLoggingOut = false;
	let hasBlog = null;
	let blogs;
	let username;

	// blog content
	let blog_title;
	let blog_content;
	let blog_imageURI;
	let blog_visibility = false;

	// methods
	let toggleVisibiltiy = (e) => {
		if (blog_visibility) {
			blog_visibility = false;
		} else {
			blog_visibility = true;
		}
	};
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
		const { data, error } = await supabase.from('abieg_posts-public').insert([
			{
				title: blog_title,
				author: $global_mod_account.username,
				content: blog_content,
				isExclusive: blog_visibility
			}
		]);

		if (!error) {
			M.toast({ html: 'Blog Posted' });
			M.toast({ html: 'Please refresh the page to update' });
			blog_title = '';
			blog_content = '';
			blog_visibility = false;
		}
	};

	onMount((e) => {
		if (localStorage.getItem('data_mod') != '') {
			global_mod_account.set(JSON.parse(localStorage.getItem('data_mod')));
			// console.log($global_mod_account);
		} else {
			goto('/admin');
		}
		(async (e) => {
			if ($global_mod_account) {
				const { data, error } = await supabase
					.from('abieg_posts-public')
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
	});
</script>

<main
	style="margin-bottom: 10em;"
	in:fly={{ y: -20, duration: 500 }}
	out:fly={{ y: 20, duration: 500 }}
>
	<div class="container white-text">
		<h1>Moderator Dashboard</h1>
		<!-- post a story -->
		{#if $global_mod_account}
			<div class="row" style="margin-bottom: 10em;">
				<div class="col s12">
					<h3>Post a Story</h3>
				</div>
				<div class="col s12">
					<div class="input-field">
						<i class="material-icons prefix">book</i>
						<input
							bind:value={blog_title}
							id="story_title"
							type="text"
							class="validate white-text"
						/>
						<label for="story_title">Story Title</label>
					</div>
				</div>
				<div class="col s12">
					<div class="input-field">
						<i class="material-icons prefix">person</i>
						<input
							id="story_author"
							bind:value={$global_mod_account.username}
							type="text"
							disabled
							class="validate white-text"
						/>
						<span class="helper-text white-text">Story Author</span>
					</div>
				</div>
				<div class="col s12">
					<div class="input-field">
						<i class="material-icons prefix">image</i>
						<input
							bind:value={blog_imageURI}
							id="story_headerImg_src"
							type="text"
							class="validate white-text"
						/>
						<label for="story_headerImg_src">Story Header Image URL</label>
					</div>
				</div>
				<div class="col s12">
					<div class="input-field">
						<i class="material-icons prefix">library_books</i>
						<input
							bind:value={blog_content}
							id="story_content"
							type="text"
							class="validate white-text"
						/>
						<label for="story_content">Story Content</label>
						<span class="helper-text white-text"
							>This can be written as is or HTML (We recommened to write the story in HTML)</span
						>
					</div>
				</div>
				<div class="col s12">
					<div style="padding: 1em;">
						<p>
							{#if blog_visibility}
								This Post will be exclusive to members
							{:else}
								This Post will be public to all visitors
							{/if}
						</p>
						<button on:click={toggleVisibiltiy} class="btn waves-effect waves-light blue darken-4 ">
							<div class="valign-wrapper">
								{#if blog_visibility}
									<i class="material-icons" style="margin-right: 1em;"> lock </i>
									<span>Exclusive</span>
								{:else}
									<i class="material-icons" style="margin-right: 1em;"> public </i>
									<span>Public</span>
								{/if}
							</div>
						</button>
					</div>
				</div>
				<div class="col s12 " style="margin-top: 2em;">
					<button
						on:click={postBlog}
						class="btn right btn-large waves-effect waves-light blue darken-3"
					>
						<i class="material-icons left">post_add</i>Post</button
					>
				</div>
			</div>
		{/if}
		<!-- Your stories -->
		{#if $global_mod_account}
			<div class="row" style="margin-bottom: 10em;">
				<div class="col s12">
					<h3>Your Stories</h3>
				</div>
				{#if hasBlog == null}
					<div class="col s12">
						<div class="progress transparent">
							<div class="indeterminate blue darken-4" />
						</div>
						<p>Searching for your posts</p>
					</div>
				{/if}
				{#if !hasBlog || blogs.length < 1}
					<div class="col s12">
						<h5>Seems like its empty</h5>
						<p>Make one of your own</p>
					</div>
				{:else}
					<div class="col s12">
						<h5>Available Stories</h5>
						<!-- stories -->
						{#each blogs as blog}
							<AdminPostCard {blog} />
						{/each}
					</div>
				{/if}
			</div>
		{/if}
		<!-- account detail -->
		{#if $global_mod_account}
			<div class="row" transition:fly|local={{ y: 10, duration: 500 }}>
				<div class="col s12">
					<h3>Moderator Account Information</h3>

					<div class="row">
						<div class="col s4">Account Holder</div>
						<div class="col s8">{$global_mod_account.username}</div>
					</div>
					<div class="row">
						<div class="col s4">Account ID</div>
						<div class="col s8">{$global_mod_account.id}</div>
					</div>
					<div class="row" style="margin-top: 5em;">
						{#if isLoggingOut}
							<div class="col s4 offset-s8 " in:fly|local={{ y: -25, duration: 500 }}>
								<button
									on:click={toggleLogOut}
									class="btn right btn-large waves-effect waves-light blue lighten-1"
								>
									No</button
								>
								<button
									on:click={logout}
									style="margin-right: 2em;"
									class="btn right btn-large waves-effect waves-light red lighten-1"
								>
									Yes</button
								>
							</div>
						{/if}
						<div class="col s6 offset-s6 ">
							{#if !isLoggingOut}
								<button
									in:fly|local={{ x: 20, duration: 500 }}
									on:click={toggleLogOut}
									class="btn right btn-large waves-effect waves-light red lighten-1"
									><i class="material-icons left">logout</i>
									Log Out</button
								>
							{:else}
								<h5 in:fly|local={{ y: -20, duration: 500 }} class="right-align">
									Do you really want to log out?
								</h5>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
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
