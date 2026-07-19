<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Icon from './Icon.svelte';

	let {
		startMs,
		nowMs,
		timeoutSec,
		active = true
	}: { startMs: number; nowMs: number; timeoutSec?: number; active?: boolean } = $props();

	let elapsedSec = $derived(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
	let remainingSec = $derived(
		typeof timeoutSec === 'number' ? Math.max(0, Math.ceil(timeoutSec - elapsedSec)) : undefined
	);
	let warning = $derived(active && remainingSec !== undefined && remainingSec <= 10);
</script>

<span class="timer" class:warning class:briefing={!active} aria-label={$_('scenario.timer_label')}>
	<Icon name={active ? 'Timer' : 'Radio'} size={16} />
	{#if !active}
		{$_('scenario.timer_briefing')}
	{:else if remainingSec !== undefined}
		{$_('scenario.timer_remaining', { values: { seconds: remainingSec } })}
	{:else}
		{elapsedSec}s
	{/if}
</span>

<style>
	.timer {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-variant-numeric: tabular-nums;
		font-size: 0.72rem;
		font-weight: 800;
		color: #9ae6b4;
	}
	.timer.briefing {
		color: rgba(255, 255, 255, 0.62);
	}
	.timer.warning {
		color: #fecaca;
		animation: timer-pulse 1s ease-in-out infinite;
	}
	@keyframes timer-pulse {
		50% {
			opacity: 0.58;
		}
	}
</style>
