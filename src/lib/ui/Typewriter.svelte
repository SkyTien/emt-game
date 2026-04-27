<script lang="ts">
	let { text = '', speed = 30, onfinish } = $props();

	let displayedText = $state('');
	let currentIndex = $state(0);
	let interval: ReturnType<typeof setInterval>;
	let isTyping = $state(true);
	let finished = $state(false);

	function handleClick() {
		if (finished) return;

		if (isTyping) {
			// Skip typing
			if (interval) clearInterval(interval);
			displayedText = text;
			currentIndex = text.length;
			isTyping = false;
		} else {
			// Typing is done, wait for click to finish
			finished = true;
			if (onfinish) onfinish();
		}
	}

	$effect(() => {
		// Whenever text changes, reset
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
				clearInterval(interval);
				isTyping = false;
				if (!finished) {
					finished = true;
					if (onfinish) onfinish();
				}
			}
		}, speed);

		return () => clearInterval(interval);
	});
</script>

<div
	onclick={handleClick}
	onkeydown={(e) => e.key === 'Enter' && handleClick()}
	role="button"
	tabindex="0"
	class="typewriter-text"
>
	{displayedText}
	{#if isTyping}
		<span class="cursor">|</span>
	{:else if !finished}
		<span class="continue-prompt">▼</span>
	{/if}
</div>

<style>
	.typewriter-text {
		cursor: pointer;
		display: block;
		outline: none;
		position: relative;
	}
	.cursor {
		animation: blink 1s step-end infinite;
		opacity: 0.7;
		font-weight: bold;
	}
	.continue-prompt {
		display: inline-block;
		margin-left: 8px;
		color: #63b3ed;
		animation: bounce 1s infinite;
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
	@keyframes bounce {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(3px);
		}
	}
</style>
