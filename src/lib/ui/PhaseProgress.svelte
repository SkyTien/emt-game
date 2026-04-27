<script lang="ts">
	import { _ } from 'svelte-i18n';

	let { done, total }: { done: number; total: number } = $props();
</script>

<div class="phase-progress" aria-label={`${done}/${total}`}>
	<span class="label">{$_('scenario.phase_progress')}</span>
	<span class="dots">
		{#each Array(total) as _, i (i)}
			<span class="dot" class:filled={i < done}>{i < done ? '▪' : '□'}</span>
		{/each}
	</span>
	<span class="count">({done}/{total})</span>
</div>

<style>
	.phase-progress {
		display: inline-flex;
		gap: 0.5rem;
		align-items: center;
		font-size: 0.9rem;
		color: var(--c-text-soft);
	}
	.dots {
		display: inline-flex;
		gap: 2px;
		font-family: monospace;
	}
	.dot.filled {
		color: var(--c-accent);
	}
</style>
