<script lang="ts">
	let { text, speedMs = 30 }: { text: string; speedMs?: number } = $props();

	let displayed = $state('');
	let timer: ReturnType<typeof setInterval> | null = null;

	$effect(() => {
		if (timer) clearInterval(timer);
		displayed = '';
		const chars = [...text];
		let i = 0;
		timer = setInterval(() => {
			if (i >= chars.length) {
				if (timer) clearInterval(timer);
				timer = null;
				return;
			}
			displayed += chars[i];
			i += 1;
		}, speedMs);
		return () => {
			if (timer) clearInterval(timer);
		};
	});
</script>

<p class="narrator">{displayed}<span class="caret" aria-hidden="true"></span></p>

<style>
	.narrator {
		background: var(--c-bg-soft);
		padding: 0.75rem 1rem;
		border-radius: 10px;
		min-height: 3em;
		margin: 0;
	}
	.caret {
		display: inline-block;
		width: 8px;
		height: 1em;
		background: var(--c-text-soft);
		vertical-align: text-bottom;
		margin-left: 2px;
		animation: blink 1s step-start infinite;
	}
	@keyframes blink {
		50% {
			opacity: 0;
		}
	}
</style>
