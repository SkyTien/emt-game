<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { loadTechniques } from '$lib/data/content';
	import {
		catalogDifficulty,
		catalogEstimatedMinutes,
		catalogSection,
		catalogSort,
		catalogSummary,
		catalogTags,
		resolveCatalogImage
	} from '$lib/data/catalog';
	import { localize } from '$lib/i18n/localize';
	import { load as loadProgress, bestStarsForTechnique } from '$lib/progress/store';
	import TrainingCard from '$lib/ui/TrainingCard.svelte';
	import TrainingNav from '$lib/ui/TrainingNav.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import type { Technique } from '$lib/types/content';

	const techniques = loadTechniques().sort((a, b) => catalogSort(a) - catalogSort(b));
	let progress = $state(loadProgress());
	onMount(() => (progress = loadProgress()));

	const sections = $derived.by(() => {
		const grouped = new Map<string, Technique[]>();
		for (const technique of techniques) {
			const section = catalogSection(technique);
			const label = section
				? localize(section, $locale ?? 'zh-Hant')
				: $_('catalog.technique_default_section');
			grouped.set(label, [...(grouped.get(label) ?? []), technique]);
		}
		return [...grouped.entries()];
	});
</script>

<svelte:head><title>{$_('menu.techniques_title')}</title></svelte:head>

<main class="catalog-shell">
	<header class="catalog-header">
		<a href={`${base}/`} aria-label={$_('common.back')}><Icon name="ArrowLeft" size={22} /></a>
		<div>
			<p>{$_('catalog.technique_kicker')}</p>
			<h1>{$_('menu.techniques_title')}</h1>
		</div>
	</header>

	<section class="catalog-intro">
		<div class="intro-icon"><Icon name="Stethoscope" size={28} /></div>
		<div>
			<h2>{$_('catalog.technique_heading')}</h2>
			<p>{$_('catalog.technique_intro')}</p>
		</div>
	</section>

	{#if techniques.length === 0}
		<p class="empty">{$_('menu.empty')}</p>
	{:else}
		{#each sections as [section, items] (section)}
			<section class="catalog-section" aria-labelledby={`section-${section}`}>
				<div class="section-heading">
					<div>
						<p>{$_('catalog.skill_section')}</p>
						<h2 id={`section-${section}`}>{section}</h2>
					</div>
					<span>{$_('catalog.item_total', { values: { count: items.length } })}</span>
				</div>
				<div class="card-grid">
					{#each items as technique (technique.id)}
						<TrainingCard
							title={localize(technique.title, $locale ?? 'zh-Hant')}
							summary={localize(catalogSummary(technique), $locale ?? 'zh-Hant')}
							image={resolveCatalogImage(technique.illustration, base)}
							difficulty={catalogDifficulty(technique)}
							duration={catalogEstimatedMinutes(technique)}
							tags={catalogTags(technique).map((tag) => localize(tag, $locale ?? 'zh-Hant'))}
							stars={bestStarsForTechnique(progress, technique.id)}
							runs={progress.techniques[technique.id]?.runs ?? 0}
							featured={items.length === 1}
							href={`${base}/techniques/${technique.id}/play`}
							actionLabel={$_('catalog.practice')}
						/>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</main>

<TrainingNav active="techniques" />

<style>
	.catalog-shell {
		width: min(100%, 920px);
		margin: 0 auto;
		padding: 1rem 1rem 7rem;
		display: grid;
		gap: 1.8rem;
	}
	.catalog-header {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding-top: env(safe-area-inset-top);
	}
	.catalog-header > a {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 12px;
		color: var(--c-text);
		background: var(--c-panel);
		border: 1px solid var(--c-border);
	}
	.catalog-header p,
	.section-heading p {
		margin: 0;
		color: var(--c-text-muted);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.catalog-header h1 {
		margin: 0.1rem 0 0;
		font-size: 1.1rem;
	}
	.catalog-intro {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		border-radius: 18px;
		background: linear-gradient(135deg, rgba(20, 52, 73, 0.86), rgba(10, 28, 43, 0.92));
		border: 1px solid var(--c-border);
	}
	.intro-icon {
		width: 54px;
		height: 54px;
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		border-radius: 16px;
		color: var(--c-status);
		background: rgba(45, 212, 191, 0.1);
		border: 1px solid rgba(45, 212, 191, 0.2);
	}
	.catalog-intro h2 {
		margin: 0;
		font-size: clamp(1.35rem, 5vw, 1.8rem);
	}
	.catalog-intro p {
		margin: 0.35rem 0 0;
		color: var(--c-text-soft);
		font-size: 0.88rem;
	}
	.catalog-section {
		display: grid;
		gap: 0.8rem;
	}
	.section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
	}
	.section-heading h2 {
		margin: 0.15rem 0 0;
		font-size: 1.1rem;
	}
	.section-heading > span {
		color: var(--c-text-muted);
		font-size: 0.72rem;
	}
	.card-grid {
		display: grid;
		gap: 0.85rem;
	}
	.empty {
		padding: 2rem;
		text-align: center;
		color: var(--c-text-soft);
		background: var(--c-panel);
		border-radius: 18px;
		border: 1px dashed var(--c-border);
	}
	@media (min-width: 760px) {
		.card-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.card-grid :global(.featured) {
			grid-column: 1 / -1;
			grid-template-columns: 1fr 1.5fr;
		}
	}
</style>
