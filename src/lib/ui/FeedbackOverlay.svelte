<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { _ } from 'svelte-i18n';

	let {
		correct,
		message,
		onClose
	}: {
		correct: boolean;
		message?: string;
		onClose: () => void;
	} = $props();

	onMount(() => {
		const timer = setTimeout(onClose, 1200);
		return () => clearTimeout(timer);
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="overlay" onclick={onClose} transition:fade={{ duration: 200 }}>
	<div
		class="content"
		class:correct
		class:wrong={!correct}
		transition:scale={{ start: 0.8, duration: 200 }}
	>
		<div class="icon">
			{#if correct}
				<svg viewBox="0 0 24 24" width="48" height="48"
					><path
						fill="currentColor"
						d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"
					/></svg
				>
			{:else}
				<svg viewBox="0 0 24 24" width="48" height="48"
					><path
						fill="currentColor"
						d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"
					/></svg
				>
			{/if}
		</div>
		<div class="message">
			{message ?? (correct ? $_('timeline.correct') : $_('timeline.flow_error'))}
		</div>
	</div>
</div>

<style>
	.overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: grid;
		place-items: center;
		background: rgba(0, 0, 0, 0.2);
		pointer-events: none;
	}
	.content {
		padding: 2rem 4rem;
		border-radius: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
		color: #fff;
	}
	.correct {
		background: linear-gradient(135deg, #48bb78 0%, #2f855a 100%);
	}
	.wrong {
		background: linear-gradient(135deg, #f56565 0%, #c53030 100%);
	}
	.icon {
		filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
	}
	.message {
		max-width: min(80vw, 420px);
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.45;
		text-align: center;
	}
</style>
