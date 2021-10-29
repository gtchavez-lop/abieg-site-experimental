<script>
	import { onMount } from 'svelte';

	import { fly } from 'svelte/transition';
	import { supabase } from '../../../global';

	let registeredMembers = 0;
	let registeredMods = 0;
	let modRequest = 0;
	let allPosts = 0;
	let publicPosts = 0;
	let exclusivePosts = 0;

	const getRegisteredMembers = async (e) => {
		let { data: users, error, count } = await supabase
			.from('users')
			.select('*', { count: 'exact' });
		if (!error) {
			registeredMembers = count;
		}
	};
	const getRegisteredMods = async (e) => {
		let { data: users, error, count } = await supabase
			.from('users')
			.select('*', { count: 'exact' })
			.eq('isModerator', 'true');
		if (!error) {
			registeredMods = count;
		}
	};
	const getModRequest = async (e) => {
		let { data: users, error, count } = await supabase
			.from('users')
			.select('*', { count: 'exact' })
			.eq('isRequestingModAccount', 'true');
		if (!error) {
			modRequest = count;
		}
	};
	const getAllPosts = async (e) => {
		let { data: users, error, count } = await supabase
			.from('posts')
			.select('*', { count: 'exact' });
		if (!error) {
			allPosts = count;
		}
	};
	const getPublicPosts = async (e) => {
		let { data: users, error, count } = await supabase
			.from('posts')
			.select('*', { count: 'exact' })
			.eq('isExclusive', 'false');
		if (!error) {
			publicPosts = count;
		}
	};
	const getExclusivePosts = async (e) => {
		let { data: users, error, count } = await supabase
			.from('posts')
			.select('*', { count: 'exact' })
			.eq('isExclusive', 'true');
		if (!error) {
			exclusivePosts = count;
		}
	};

	onMount(async (e) => {
		getRegisteredMembers();
		getRegisteredMods();
		getAllPosts();
		getPublicPosts();
		getExclusivePosts();
		getModRequest();
	});
</script>

<main in:fly={{ y: 20, duration: 500 }}>
	<div class="container text-white">
		<div class="row row-cols-1 row-cols-md-2">
			<div class="card border-3 rounded-3 shadow-sm col-12">
				<div class="card-body">
					<h5>Registered Members</h5>
					<h1 class="mt-4">{registeredMembers ? registeredMembers : 'Loading...'}</h1>
					<i class="bi bi-person-circle" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm col-12 col-md-6">
				<div class="card-body">
					<h5>Registered Moderators</h5>
					<h1 class="mt-4">{registeredMods ? registeredMods : 'Loading...'}</h1>
					<i class="bi bi-pencil-square" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm col-12 col-md-6">
				<div class="card-body">
					<h5>Moderator Request</h5>
					<h1 class="mt-4">{modRequest}</h1>
					<i class="bi bi-arrow-up-right-circle" />
				</div>
			</div>
		</div>
		<div class="row row-cols-1 row-cols-md-3 mt-5">
			<div class="card border-3 rounded-3 shadow-sm col-12">
				<div class="card-body">
					<h5>Published Posts</h5>
					<h1 class="mt-4">{allPosts ? allPosts : 'Loading...'}</h1>
					<i class="bi bi-sticky" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm col-12 col-md-6">
				<div class="card-body">
					<h5>Public Posts</h5>
					<h1 class="mt-4">{publicPosts ? publicPosts : 'Loading...'}</h1>
					<i class="bi bi-globe2" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm col-12 col-md-6">
				<div class="card-body">
					<h5>Exclusive Posts</h5>
					<h1 class="mt-4">{exclusivePosts ? exclusivePosts : 'Loading...'}</h1>
					<i class="bi bi-file-lock" />
				</div>
			</div>
		</div>
	</div>
</main>

<style lang="scss">
	main {
		position: relative;
		margin-top: 50px;
		z-index: 3;
	}

	.card {
		overflow: hidden;
		background: #282c31;
		.card-body {
			position: relative;
			i {
				position: absolute;
				top: 50%;
				opacity: 0.2;
				transform: translateY(-50%);
				right: -2%;
				font-size: 10em;
			}
		}
	}
</style>
