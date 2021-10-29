<script>
	import { fly } from 'svelte/transition';
	import { toast } from '@zerodevx/svelte-toast';
	import { supabase } from '../../../../global';

	export let user;

	let blog_title;
	let blog_imageURI;
	let blog_content;
	let blog_visibility = false;

	let postBlog = async (e) => {
		if (blog_title && blog_content) {
			const { data, error } = await supabase.from('posts').insert([
				{
					title: blog_title,
					author: user.email.split('@')[0],
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
</script>

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
			<p class="italic">*If you leave this blank, the site will generate a placeholder image</p>
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
