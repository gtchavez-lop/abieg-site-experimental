<script context="module">
	export const prerender = true;
</script>

<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import { onMount } from 'svelte';
	import { supabase } from '../../../global';
	import AdminPostCard from '../../../components/AdminPostCard.svelte';
	import toastify from 'toastify-js';
	import 'toastify-js/src/toastify.css';
	import { get, readable } from 'svelte/store';

	// component variables
	$: tabActive = 2;
	let user;

	let blog_title;
	let blog_imageURI;
	let blog_content;
	let blog_slug;
	let blog_visibility = false;
	let email = '';

	// methods
	onMount(async (e) => {
		user = await supabase.auth.user();
		if (user) {
			email = user.email.split('@')[0];
			if (user.role == 'authenticated') {
				let { data, error } = await supabase.from('users').select('*').eq('id', user.id);
				if (data[0].isModerator == false || data[0].isAdmin == false) {
					goto('/admin');
				}
			}
		} else {
			goto('/admin');
		}
	});

	let postBlog = async (e) => {
		if (blog_title && blog_content) {
			const { data, error } = await supabase.from('posts').insert([
				{
					title: blog_title,
					author: user.email.split('@')[0],
					slug: blog_slug,
					content: blog_content,
					header_img: blog_imageURI ? blog_imageURI : 'https://picsum.photos/500/500',
					isExclusive: blog_visibility
				}
			]);

			if (!error) {
				toastify({
					text: `${blog_title} is now posted ${!blog_visibility ? 'publicly' : 'exclusively'}`,
					duration: 2000,
					close: true,
					gravity: 'bottom',
					position: 'right',
					style: {
						background: '#06d6a0',
						color: '#212529'
					}
				}).showToast();
				blog_title = '';
				blog_content = '';
				blog_slug = '';
				blog_visibility = false;
				tabActive = 2;
			}
		} else {
			// toast.message('Please fill out all forms');
			toastify({
				text: 'Please fill the required fields',
				duration: 2000,
				close: true,
				gravity: 'bottom',
				position: 'right',
				style: {
					background: '#ef476f'
				}
			}).showToast();
		}
	};

	const _blogs = readable(null, (set) => {
		supabase
			.from('posts')
			.select('*')
			.order('title', { ascending: false })
			.then(({ data, error }) => {
				if (!error) {
					set(data);
				}
			});

		const subscription = supabase
			.from('posts')
			.on('*', (payload) => {
				console.log(payload);
				if (payload.eventType == 'INSERT') {
					set([payload.new, ...$_blogs]);
					console.log($_blogs);
				}
				if (payload.eventType === 'UPDATE') {
					let index = $_blogs.findIndex((thisblog) => thisblog.id === payload.new.id);
					let oldData = $_blogs;
					oldData[index] = payload.new;
					set(oldData);
					console.log($_blogs);
				}
				if (payload.eventType == 'DELETE') {
					let oldData = $_blogs;
					let newData = oldData.filter((thisItem) => thisItem.id != payload.old.id);
					set(newData);
					console.log($_blogs);
				}
			})
			.subscribe();

		return () => supabase.removeSubscription(subscription);
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

		blog_slug = str;
	};
</script>

<svele:head>
	<title>Dashboard | Abie G</title>
</svele:head>
<main
	style="margin-bottom: 10em;"
	in:fly={{ y: -40, duration: 500, delay: 500 }}
	out:fly={{ y: 40, duration: 500 }}
>
	<div class="container text-white">
		<p class="display-3">Moderator Dashboard</p>

		<div class="btn-group mt-3 w-100" role="group" aria-label="Basic radio toggle button group">
			<input
				type="radio"
				class="btn-check"
				name="btnradio"
				id="nav1"
				autocomplete="off"
				on:click={() => (tabActive = 1)}
				checked={tabActive == 1 ? true : false}
			/>
			<label class="btn btn-lg btn-outline-light" for="nav1">Add a Story</label>

			<input
				type="radio"
				class="btn-check"
				name="btnradio"
				id="nav2"
				autocomplete="off"
				on:click={() => (tabActive = 2)}
				checked={tabActive == 2 ? true : false}
			/>
			<label class="btn btn-lg btn-outline-light" for="nav2">Your Stories</label>
		</div>

		<!-- tabs -->
		<div class="mt-5">
			<!-- add story -->
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
									on:input={slugify(blog_title)}
								/>
								<label for="story_title">The Title of your story</label>
							</div>
						</div>
						<div class="col-12">
							<div class="form-floating input-group mb-3">
								<input
									type="text"
									class="form-control bg-transparent text-white"
									id="story_title"
									readonly
									bind:value={blog_slug}
								/>
								<label for="story_title"
									>Post Slug(this will identify a Post that will be seen in the address)
								</label>
							</div>
						</div>
						{#if blog_imageURI}
							<div class="col-12 mb-1">
								<img
									style="width: 100%; height: 250px; object-fit: cover;"
									src={blog_imageURI != ''
										? blog_imageURI
										: 'https://via.placeholder.com/1500?text=This+is+a+placeholder+image'}
									alt="..."
								/>
							</div>
						{/if}
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
							<button on:click={postBlog} class="btn btn-lg btn-success w-100"
								>Post your story</button
							>
						</div>
					</div>
				</div>
			{/if}
			<!-- view stories -->
			{#if tabActive == 2}
				<div in:fly={{ x: 20, duration: 500 }}>
					<p class="display-5">Your Stories</p>
					<div class="row text-white">
						<div class="col-12">
							<div class="mt-1 row row-cols-1 row-cols-md-2 g-3">
								{#if $_blogs}
									{#if $_blogs.length > 0}
										{#each $_blogs as blog, index}
											{#if blog.author == email.split('@')[0]}
												<AdminPostCard {blog} {index} />
											{/if}
										{/each}
									{:else}
										<p class="lead">Seems like its empty</p>
									{/if}
								{/if}
							</div>
						</div>
					</div>
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
