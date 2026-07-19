<script lang="ts">
	import { _ } from 'svelte-i18n';

	let {
		text = '',
		speed = 30,
		onfinish
	}: { text?: string; speed?: number; onfinish?: () => void } = $props();

	let displayedText = $state('');
	let currentIndex = $state(0);
	let interval: ReturnType<typeof setInterval>;
	let isTyping = $state(true);
	let finished = $state(false);

	function complete() {
		if (finished) return;
		if (interval) clearInterval(interval);
		displayedText = text;
		currentIndex = text.length;
		isTyping = false;
		finished = true;
		onfinish?.();
	}

	$effect(() => {
		displayedText = '';
		currentIndex = 0;
		isTyping = true;
		finished = false;
		if (interval) clearInterval(interval);

		interval = setInterval(() => {
			if (currentIndex < text.length) {
				displayedText += text[currentIndex];
				currentIndex++;
			} else {
				complete();
			}
		}, speed);

		return () => clearInterval(interval);
	});
</script>

<div class="typewriter-text" aria-live="polite">
	<p>
		{displayedText}{#if isTyping}<span class="cursor" aria-hidden="true">|</span>{/if}
	</p>
	{#if isTyping}
		<button type="button" class="skip" onclick={complete}>{$_('scenario.skip_narrative')}</button>
	{/if}
</div>

<style>
	.typewriter-text {
		display: grid;
		gap: 0.65rem;
		position: relative;
	}
	p {
		margin: 0;
	}
	.cursor {
		animation: blink 1s step-end infinite;
		opacity: 0.7;
		font-weight: bold;
	}
	.skip {
		justify-self: end;
		min-height: 36px;
		padding: 0.35rem 0.7rem;
		border-radius: 999px;
		border: 1px solid rgba(255, 255, 255, 0.18);
		background: rgba(7, 19, 31, 0.5);
		color: rgba(255, 255, 255, 0.78);
		font-size: 0.75rem;
		font-weight: 700;
		cursor: pointer;
	}
	@keyframes blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}
</style>
