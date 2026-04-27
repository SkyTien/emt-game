<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadScenarios } from '$lib/data/content';
	import { localize } from '$lib/i18n/localize';
	import { load as loadProgress, bestStarsForScenario } from '$lib/progress/store';
	import StarBar from '$lib/ui/StarBar.svelte';

	const scenarios = loadScenarios();
	let progress = $state(loadProgress());
	onMount(() => (progress = loadProgress()));

	function bestForScenario(id: string) {
		const lead = bestStarsForScenario(progress, id, 'lead');
		const assist = bestStarsForScenario(progress, id, 'assist');
		return Math.max(lead, assist);
	}
</script>

<main class="page">
	<header>
		<a class="back" href={base + '/'}>← {$_('common.back')}</a>
		<h1>{$_('menu.scenarios_title')}</h1>
	</header>

	{#if scenarios.length === 0}
		<p class="empty">{$_('menu.empty')}</p>
	{:else}
		<ul class="list">
			{#each scenarios as s (s.id)}
				{@const stars = bestForScenario(s.id)}
				<li>
					<a class="row" href={`${base}/scenarios/${s.id}/role`}>
						<span class="title">{localize(s.title, $locale ?? 'zh-Hant')}</span>
						<span class="stars">
							{#if stars > 0}
								<StarBar {stars} />
							{:else}
								<span class="untouched">{$_('common.untouched')}</span>
							{/if}
						</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: 1rem;
	}
	header {
		display: grid;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}
	.back {
		color: var(--c-text-soft);
		text-decoration: none;
	}
	h1 {
		margin: 0;
		font-size: 1.5rem;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.5rem;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--c-bg-soft);
		border-radius: 8px;
		text-decoration: none;
		color: inherit;
		min-height: 44px;
	}
	.title {
		font-weight: 600;
	}
	.untouched {
		color: var(--c-text-soft);
		font-size: 0.9rem;
	}
	.empty {
		text-align: center;
		color: var(--c-text-soft);
		padding: 2rem;
	}
</style>
