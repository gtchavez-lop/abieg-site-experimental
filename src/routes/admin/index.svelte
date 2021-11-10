<script context="module">
	export const prerender = true;
</script>

<script>
	import { fly, fade, scale, blur } from 'svelte/transition';
	import MarqueeTextWidget from 'svelte-marquee-text-widget';

	import { supabase, global_mod_account, global_account_data } from '../../global';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast, SvelteToast } from '@zerodevx/svelte-toast';

	let hasAccess = null;

	onMount(async (e) => {
		let user = await supabase.auth.user();
		if (user) {
			let { data, error } = await supabase.from('users').select('*').eq('id', user.id);
			if (data[0].isModerator == true) {
				setTimeout(() => {
					hasAccess = true;
					goto('/admin/dashboard');
				}, 1000);
			} else {
				hasAccess = false;
				setTimeout(() => {
					goto('/admin/dashboard');
				}, 1000);
			}
		} else {
			hasAccess = false;
			setTimeout(() => {
				goto('/');
			}, 1500);
		}
	});
</script>

<svele:head>
	<title>Moderator Sign In | Abie G</title>
</svele:head>
<SvelteToast option={{ duration: 1000 }} />

<main
	class="text-white d-flex flex-column align-items-center justify-content-center"
	in:fly={{ y: -40, duration: 500, delay: 500 }}
	out:fly={{ y: 40, duration: 500 }}
>
	{#if hasAccess == false}
		<div class="mt-5 text-center">
			<i class="bi bi-exclamation-diamond" style="font-size: 10rem;" />
			<p class="mt-5 lead">Sorry, you do not have any privilege to sign in a Moderator Account</p>
		</div>
	{:else if hasAccess == null}
		<div class="spinner-border" role="status">
			<span class="visually-hidden">Loading...</span>
		</div>
	{/if}
</main>

<style>
	main {
		position: relative;
		min-height: 100vh;
		z-index: 3;
	}
</style>
