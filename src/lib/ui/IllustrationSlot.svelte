<script lang="ts">
	import { base } from '$app/paths';

	let { src, alt = '' }: { src?: string; alt?: string } = $props();

	function resolveSrc(s: string | undefined): string | null {
		if (!s) return null;
		if (s.startsWith('http')) return s;
		if (s.startsWith('/')) return `${base}${s}`;
		return `${base}/${s}`;
	}
	let resolved = $derived(resolveSrc(src));
</script>

<div class="slot">
	{#if resolved}
		<img src={resolved} {alt} loading="lazy" />
	{:else}
		<div class="placeholder" aria-hidden="true"></div>
	{/if}
</div>

<style>
	.slot {
		width: 100%;
		aspect-ratio: 16 / 9;
		display: grid;
		place-items: center;
		background: var(--c-bg-soft);
		border-radius: 12px;
		overflow: hidden;
		animation: fade-in 250ms ease;
	}
	img {
		max-width: 100%;
		max-height: 100%;
		filter: grayscale(0.1);
	}
	.placeholder {
		width: 60%;
		height: 60%;
		background: repeating-linear-gradient(
			45deg,
			var(--c-bg-soft),
			var(--c-bg-soft) 8px,
			var(--c-border) 8px,
			var(--c-border) 9px
		);
		border-radius: 8px;
	}
	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
</style>
