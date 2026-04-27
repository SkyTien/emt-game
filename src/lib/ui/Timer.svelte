<script lang="ts">
	import { _ } from 'svelte-i18n';

	let { startMs, nowMs, timeoutSec }: { startMs: number; nowMs: number; timeoutSec?: number } =
		$props();

	let elapsedSec = $derived(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
	let warning = $derived(typeof timeoutSec === 'number' && elapsedSec >= timeoutSec * 0.7);
</script>

<span class="timer" class:warning aria-label={$_('scenario.timer_label')}>
	{elapsedSec}s{#if typeof timeoutSec === 'number'}/{timeoutSec}s{/if}
</span>

<style>
	.timer {
		font-variant-numeric: tabular-nums;
		font-weight: 600;
		color: var(--c-text);
	}
	.timer.warning {
		color: var(--c-accent);
	}
</style>
