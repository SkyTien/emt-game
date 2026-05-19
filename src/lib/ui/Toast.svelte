<script lang="ts">
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';

	let {
		message,
		onClose
	}: {
		message: string;
		onClose: () => void;
	} = $props();

	onMount(() => {
		const timer = setTimeout(onClose, 2000);
		return () => clearTimeout(timer);
	});
</script>

<div class="toast" transition:fly={{ y: 20, duration: 250 }}>
	{message}
</div>

<style>
	.toast {
		position: fixed;
		bottom: 5rem;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(0, 0, 0, 0.75);
		color: #fff;
		padding: 0.5rem 1.2rem;
		border-radius: 999px;
		font-size: 0.9rem;
		white-space: nowrap;
		z-index: 900;
		pointer-events: none;
	}
</style>
