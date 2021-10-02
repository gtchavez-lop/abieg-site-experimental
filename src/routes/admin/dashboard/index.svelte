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
	let tabActive = 1;

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
				// M.toast({ html: 'Blog Posted' });
				blog_title = '';
				blog_content = '';
				blog_visibility = false;
				location.reload();
			}
		} else {
			// M.toast({ html: 'Please fill out all the input fields' });
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

<main
	style="margin-bottom: 10em;"
	in:fly={{ y: -20, duration: 500 }}
	out:fly={{ y: 20, duration: 500 }}
>
	<div class="container white-text">
		<h1>Moderator Dashboard</h1>
		<!-- tabs -->
		<div class="row" style="margin-top: 5em;">
			<div class="col s3 center-align">
				<button
					on:click={() => (tabActive = 1)}
					data-tooltip-content="Add a Story"
					class={tabActive == 1
						? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'
						: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}
				>
					<i class="material-icons"> post_add </i>
				</button>
			</div>
			<div class="col s3 center-align">
				<button
					on:click={() => (tabActive = 2)}
					data-tooltip-content="Your Stories"
					class={tabActive == 2
						? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'
						: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}
				>
					<i class="material-icons"> menu_book </i>
				</button>
			</div>
			<div class="col s3 center-align">
				<button
					on:click={() => (tabActive = 3)}
					data-tooltip-content="Your Account"
					class={tabActive == 3
						? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'
						: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}
				>
					<i class="material-icons"> manage_accounts </i>
				</button>
			</div>
			<div class="col s3 center-align">
				<button
					on:click={() => (tabActive = 4)}
					data-tooltip-content="Edit Content"
					class={tabActive == 4
						? 'btn-floating btn-large waves-effect waves-light cyan darken-2 topbutton'
						: 'btn-floating btn-large waves-effect waves-light pink darken-2 topbutton'}
				>
					<i class="material-icons"> edit </i>
				</button>
			</div>
			<!-- 
			 -->
		</div>

		<!-- post a story -->
		{#if tabActive == 1}
			{#if $global_mod_account}
				<div class="row" style="margin-bottom: 10em;" in:fly={{ x: 20, duration: 500 }}>
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
							<span class="helper-text white-text"
								>If you leave this blank, the site will generate a placeholder image</span
							>
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
							<button
								on:click={toggleVisibiltiy}
								class="btn waves-effect waves-light blue darken-4 "
							>
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
		{/if}

		<!-- Your stories -->
		{#if tabActive == 2}
			{#if $global_mod_account}
				<div class="row" style="margin-bottom: 10em;" in:fly={{ x: 20, duration: 500 }}>
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
		{/if}

		<!-- account detail -->
		{#if tabActive == 3}
			{#if $global_mod_account}
				<div class="row" in:fly={{ x: 20, duration: 500 }}>
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
	.topbutton {
		overflow: visible;
	}
	.topbutton::after {
		content: attr(data-tooltip-content);
		position: absolute;
		top: -100%;
		background: #323232;
		box-shadow: rgba(34, 34, 34, 0.5) 0 0 10px;
		/* min-width: 100px; */
		left: 50%;
		width: 175px;
		padding: 0em;
		margin: 0em;
		transform: translateX(-50%);
		opacity: 0;
		transition: 200ms ease all;
	}
	.topbutton:hover::after {
		top: -110%;
		opacity: 1;
	}
</style>
