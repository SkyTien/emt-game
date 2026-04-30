<script lang="ts">
	let { stars, max = 3 }: { stars: number; max?: number } = $props();
</script>

<span class="stars" aria-label={`${stars}/${max}`}>
	{#each Array.from({ length: max }) as _, i (i)}
		<span class="star" class:filled={i < stars}>★</span>
	{/each}
</span>

<style>
	.stars {
		display: inline-flex;
		gap: 2px;
	}
	.star {
		color: var(--c-border);
		font-size: 1.2em;
	}
	.star.filled {
		color: #f59e0b;
	}
</style>
