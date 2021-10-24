<script>
	import { fly } from 'svelte/transition';
</script>

<main in:fly={{ y: 20, duration: 500 }}>
	<div class="container text-white">
		<div class="row row-cols-1 row-cols-md-2">
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>Registered Members</h5>
					<h1 class="mt-4">8</h1>
					<i class="bi bi-person-circle" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>Registered Moderators</h5>
					<h1 class="mt-4">8</h1>
					<i class="bi bi-pencil-square" />
				</div>
			</div>
		</div>
		<div class="row row-cols-1 row-cols-md-3 mt-5">
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>Published Posts</h5>
					<h1 class="mt-4">8</h1>
					<i class="bi bi-sticky" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>Public Posts</h5>
					<h1 class="mt-4">8</h1>
					<i class="bi bi-globe2" />
				</div>
			</div>
			<div class="card border-3 rounded-3 shadow-sm">
				<div class="card-body">
					<h5>Exclusive Posts</h5>
					<h1 class="mt-4">8</h1>
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
