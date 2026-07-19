<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadQuickPlayScenarios, loadScenarios } from '$lib/data/content';
	import {
		catalogDifficulty,
		catalogEstimatedMinutes,
		catalogSort,
		catalogSummary,
		catalogTags,
		groupQuickPlayScenarios,
		representativeForGroup,
		resolveCatalogImage,
		scenarioRunCount
	} from '$lib/data/catalog';
	import { localize } from '$lib/i18n/localize';
	import { load as loadProgress, bestStarsForScenario, type Progress } from '$lib/progress/store';
	import TrainingCard from '$lib/ui/TrainingCard.svelte';
	import TrainingNav from '$lib/ui/TrainingNav.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import type { Scenario } from '$lib/types/content';

	const scenarios = loadScenarios().sort((a, b) => catalogSort(a) - catalogSort(b));
	const quickGroups = [...groupQuickPlayScenarios(loadQuickPlayScenarios()).entries()];
	let progress = $state(loadProgress());
	onMount(() => (progress = loadProgress()));

	function bestForScenario(progressState: Progress, id: string) {
		return Math.max(
			bestStarsForScenario(progressState, id, 'lead'),
			bestStarsForScenario(progressState, id, 'assist')
		);
	}

	function bestForGroup(group: Scenario[]) {
		return Math.max(0, ...group.map((scenario) => bestForScenario(progress, scenario.id)));
	}

	function runsForGroup(group: Scenario[]) {
		return group.reduce(
			(total, scenario) => total + scenarioRunCount(progress.scenarios[scenario.id]),
			0
		);
	}

	function playRandom(group: Scenario[]) {
		const scenario = group[Math.floor(Math.random() * group.length)];
		goto(
			scenario.player_role === 'either'
				? `${base}/scenarios/${scenario.id}/role`
				: `${base}/scenarios/${scenario.id}/play`
		);
	}
</script>

<svelte:head><title>{$_('menu.scenarios_title')}</title></svelte:head>

<main class="catalog-shell">
	<header class="catalog-header">
		<a href={`${base}/`} aria-label={$_('common.back')}><Icon name="ArrowLeft" size={22} /></a>
		<div>
			<p>{$_('catalog.scenario_kicker')}</p>
			<h1>{$_('menu.scenarios_title')}</h1>
		</div>
	</header>

	<section class="catalog-intro">
		<h2>{$_('catalog.scenario_heading')}</h2>
		<p>{$_('catalog.scenario_intro')}</p>
	</section>

	{#if quickGroups.length > 0}
		<section class="catalog-section" aria-labelledby="quick-title">
			<div class="section-heading">
				<div>
					<p>{$_('catalog.quick_kicker')}</p>
					<h2 id="quick-title">{$_('catalog.quick_title')}</h2>
				</div>
				<span>{$_('catalog.randomized')}</span>
			</div>
			<div class="card-grid">
				{#each quickGroups as [groupId, group] (groupId)}
					{@const scenario = representativeForGroup(group)}
					{#if scenario}
						<TrainingCard
							title={localize(scenario.title, $locale ?? 'zh-Hant')}
							summary={localize(catalogSummary(scenario), $locale ?? 'zh-Hant')}
							image={resolveCatalogImage(scenario.illustration, base)}
							difficulty={catalogDifficulty(scenario)}
							duration={catalogEstimatedMinutes(scenario)}
							tags={catalogTags(scenario).map((tag) => localize(tag, $locale ?? 'zh-Hant'))}
							stars={bestForGroup(group)}
							runs={runsForGroup(group)}
							badge={$_('catalog.quick_badge')}
							onactivate={() => playRandom(group)}
							actionLabel={$_('catalog.dispatch')}
						/>
					{/if}
				{/each}
			</div>
		</section>
	{/if}

	<section class="catalog-section" aria-labelledby="all-title">
		<div class="section-heading">
			<div>
				<p>{$_('catalog.all_kicker')}</p>
				<h2 id="all-title">{$_('catalog.all_scenarios')}</h2>
			</div>
			<span>{$_('catalog.item_total', { values: { count: scenarios.length } })}</span>
		</div>
		{#if scenarios.length === 0}
			<p class="empty">{$_('menu.empty')}</p>
		{:else}
			<div class="card-grid">
				{#each scenarios as scenario (scenario.id)}
					<TrainingCard
						title={localize(scenario.title, $locale ?? 'zh-Hant')}
						summary={localize(catalogSummary(scenario), $locale ?? 'zh-Hant')}
						image={resolveCatalogImage(scenario.illustration, base)}
						difficulty={catalogDifficulty(scenario)}
						duration={catalogEstimatedMinutes(scenario)}
						tags={catalogTags(scenario).map((tag) => localize(tag, $locale ?? 'zh-Hant'))}
						stars={bestForScenario(progress, scenario.id)}
						runs={scenarioRunCount(progress.scenarios[scenario.id])}
						href={scenario.player_role === 'either'
							? `${base}/scenarios/${scenario.id}/role`
							: `${base}/scenarios/${scenario.id}/play`}
						actionLabel={$_('catalog.open_briefing')}
					/>
				{/each}
			</div>
		{/if}
	</section>
</main>

<TrainingNav active="scenarios" />

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
	.catalog-intro h2 {
		margin: 0;
		font-size: clamp(1.65rem, 6vw, 2.35rem);
	}
	.catalog-intro p {
		margin: 0.5rem 0 0;
		color: var(--c-text-soft);
		max-width: 58ch;
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
		.catalog-section:first-of-type .card-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
