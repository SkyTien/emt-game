<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { loadQuickPlayScenarios, loadScenarios, loadTechniques } from '$lib/data/content';
	import {
		catalogDifficulty,
		catalogEstimatedMinutes,
		catalogSort,
		catalogSummary,
		catalogTags,
		groupQuickPlayScenarios,
		representativeForGroup,
		resolveCatalogImage
	} from '$lib/data/catalog';
	import { localize } from '$lib/i18n/localize';
	import { load as loadProgress } from '$lib/progress/store';
	import TrainingCard from '$lib/ui/TrainingCard.svelte';
	import TrainingNav from '$lib/ui/TrainingNav.svelte';
	import Icon from '$lib/ui/Icon.svelte';

	const scenarios = loadScenarios().sort((a, b) => catalogSort(a) - catalogSort(b));
	const techniques = loadTechniques().sort((a, b) => catalogSort(a) - catalogSort(b));
	const quickGroups = [...groupQuickPlayScenarios(loadQuickPlayScenarios()).values()];
	const featuredGroup =
		quickGroups.find((group) => representativeForGroup(group)?.catalog?.featured) ?? quickGroups[0];
	const featured = featuredGroup ? representativeForGroup(featuredGroup) : (scenarios[0] ?? null);

	let progress = $state(loadProgress());
	onMount(() => (progress = loadProgress()));

	const scenarioRuns = $derived(
		Object.values(progress.scenarios).reduce(
			(total, scenario) =>
				total +
				Object.values(scenario.playedAs).reduce((runs, role) => runs + (role?.runs ?? 0), 0),
			0
		)
	);
	const techniqueRuns = $derived(
		Object.values(progress.techniques).reduce((total, technique) => total + technique.runs, 0)
	);
	const trainedModules = $derived(
		Object.keys(progress.scenarios).length + Object.keys(progress.techniques).length
	);

	function startFeatured() {
		if (!featured) return;
		const pool = featuredGroup?.length ? featuredGroup : [featured];
		const selected = pool[Math.floor(Math.random() * pool.length)];
		goto(
			selected.player_role === 'either'
				? `${base}/scenarios/${selected.id}/role`
				: `${base}/scenarios/${selected.id}/play`
		);
	}
</script>

<svelte:head><title>{$_('home.title')}</title></svelte:head>

<main class="hub-shell">
	<header class="hub-header">
		<div class="brand-mark"><Icon name="StarOfLife" size={24} /></div>
		<div>
			<p>{$_('home.kicker')}</p>
			<h1>{$_('home.title')}</h1>
		</div>
		<a class="about-link" href={`${base}/about`} aria-label={$_('home.about_entry')}>
			<Icon name="CircleHelp" size={22} />
		</a>
	</header>

	<section class="intro">
		<p class="eyebrow"><span></span>{$_('home.dispatch_status')}</p>
		<h2>{$_('home.dispatch_heading')}</h2>
		<p>{$_('home.subtitle')}</p>
	</section>

	{#if featured}
		<section class="featured-section" aria-labelledby="featured-title">
			<div class="section-heading">
				<div>
					<p class="section-kicker">{$_('home.featured_kicker')}</p>
					<h2 id="featured-title">{$_('home.featured_title')}</h2>
				</div>
				<span class="ready"><i></i>{$_('home.partner_ready')}</span>
			</div>
			<TrainingCard
				title={localize(featured.title, $locale ?? 'zh-Hant')}
				summary={localize(catalogSummary(featured), $locale ?? 'zh-Hant')}
				image={resolveCatalogImage(featured.illustration, base)}
				difficulty={catalogDifficulty(featured)}
				duration={catalogEstimatedMinutes(featured)}
				tags={catalogTags(featured).map((tag) => localize(tag, $locale ?? 'zh-Hant'))}
				featured
				badge={$_('home.featured_badge')}
				onactivate={startFeatured}
				actionLabel={$_('home.dispatch_action')}
			/>
		</section>
	{/if}

	<section class="mode-section" aria-labelledby="mode-title">
		<div class="section-heading">
			<div>
				<p class="section-kicker">{$_('home.training_kicker')}</p>
				<h2 id="mode-title">{$_('home.training_title')}</h2>
			</div>
		</div>
		<div class="mode-grid">
			<a class="mode-card scenario" href={`${base}/scenarios`}>
				<div class="mode-icon"><Icon name="Siren" size={25} /></div>
				<div>
					<h3>{$_('home.mode_scenario')}</h3>
					<p>{$_('home.mode_scenario_desc')}</p>
				</div>
				<span>{scenarios.length + quickGroups.length}</span>
			</a>
			<a class="mode-card technique" href={`${base}/techniques`}>
				<div class="mode-icon"><Icon name="Stethoscope" size={25} /></div>
				<div>
					<h3>{$_('home.mode_technique')}</h3>
					<p>{$_('home.mode_technique_desc')}</p>
				</div>
				<span>{techniques.length}</span>
			</a>
		</div>
	</section>

	<section class="progress-panel" aria-labelledby="progress-title">
		<div class="progress-heading">
			<div class="progress-icon"><Icon name="ChartNoAxesColumnIncreasing" size={22} /></div>
			<div>
				<p>{$_('home.progress_kicker')}</p>
				<h2 id="progress-title">{$_('home.progress_title')}</h2>
			</div>
		</div>
		<div class="progress-grid">
			<div><strong>{scenarioRuns}</strong><span>{$_('home.scenario_runs')}</span></div>
			<div><strong>{techniqueRuns}</strong><span>{$_('home.technique_runs')}</span></div>
			<div><strong>{trainedModules}</strong><span>{$_('home.trained_modules')}</span></div>
		</div>
		{#if scenarioRuns + techniqueRuns === 0}
			<p class="zero-state">{$_('home.progress_zero')}</p>
		{/if}
	</section>
</main>

<TrainingNav active="home" />

<style>
	.hub-shell {
		width: min(100%, 760px);
		margin: 0 auto;
		padding: 1rem 1rem 7rem;
		display: grid;
		gap: 1.65rem;
	}
	.hub-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: env(safe-area-inset-top);
	}
	.brand-mark,
	.mode-icon,
	.progress-icon {
		display: grid;
		place-items: center;
		border-radius: 13px;
		background: rgba(250, 204, 21, 0.12);
		color: var(--c-dispatch);
		border: 1px solid rgba(250, 204, 21, 0.2);
	}
	.brand-mark {
		width: 46px;
		height: 46px;
	}
	.hub-header p,
	.section-kicker,
	.progress-heading p {
		margin: 0;
		color: var(--c-text-muted);
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.hub-header h1 {
		margin: 0;
		font-size: 1.05rem;
		letter-spacing: 0.02em;
	}
	.about-link {
		margin-left: auto;
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 12px;
		color: var(--c-text-soft);
		background: var(--c-panel);
		border: 1px solid var(--c-border);
	}
	.intro {
		padding: 0.5rem 0 0;
	}
	.eyebrow {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		margin: 0 0 0.45rem;
		color: var(--c-status);
		font-size: 0.75rem;
		font-weight: 800;
	}
	.eyebrow span {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--c-status);
		box-shadow: 0 0 0 5px rgba(45, 212, 191, 0.1);
	}
	.intro h2 {
		margin: 0;
		font-size: clamp(1.8rem, 7vw, 2.8rem);
		line-height: 1.12;
	}
	.intro > p:last-child {
		margin: 0.65rem 0 0;
		color: var(--c-text-soft);
	}
	.featured-section,
	.mode-section {
		display: grid;
		gap: 0.8rem;
	}
	.section-heading {
		display: flex;
		align-items: end;
		justify-content: space-between;
		gap: 1rem;
	}
	.section-heading h2,
	.progress-heading h2 {
		margin: 0.15rem 0 0;
		font-size: 1.15rem;
	}
	.ready {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--c-status);
		font-size: 0.72rem;
		font-weight: 800;
	}
	.ready i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
	}
	.mode-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}
	.mode-card {
		min-height: 154px;
		display: grid;
		grid-template-rows: auto 1fr;
		gap: 0.8rem;
		position: relative;
		padding: 1rem;
		border-radius: 18px;
		background: var(--c-panel);
		border: 1px solid var(--c-border);
		color: var(--c-text);
		text-decoration: none;
		box-shadow: var(--shadow-card);
	}
	.mode-card.technique .mode-icon {
		color: var(--c-status);
		background: rgba(45, 212, 191, 0.1);
		border-color: rgba(45, 212, 191, 0.2);
	}
	.mode-icon {
		width: 43px;
		height: 43px;
	}
	.mode-card h3 {
		margin: 0;
		font-size: 1rem;
	}
	.mode-card p {
		margin: 0.3rem 0 0;
		color: var(--c-text-soft);
		font-size: 0.78rem;
	}
	.mode-card > span {
		position: absolute;
		top: 1rem;
		right: 1rem;
		min-width: 28px;
		height: 28px;
		display: grid;
		place-items: center;
		border-radius: 99px;
		background: var(--c-panel-soft);
		color: var(--c-text-soft);
		font-size: 0.75rem;
		font-weight: 800;
	}
	.progress-panel {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border-radius: 18px;
		background: linear-gradient(135deg, rgba(30, 64, 92, 0.76), rgba(12, 29, 46, 0.9));
		border: 1px solid var(--c-border);
	}
	.progress-heading {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	.progress-icon {
		width: 42px;
		height: 42px;
		color: var(--c-status);
		background: rgba(45, 212, 191, 0.1);
		border-color: rgba(45, 212, 191, 0.2);
	}
	.progress-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
	}
	.progress-grid div {
		display: grid;
		gap: 0.1rem;
		text-align: center;
		border-right: 1px solid var(--c-border);
	}
	.progress-grid div:last-child {
		border-right: 0;
	}
	.progress-grid strong {
		color: var(--c-dispatch);
		font-size: 1.45rem;
	}
	.progress-grid span {
		color: var(--c-text-muted);
		font-size: 0.68rem;
	}
	.zero-state {
		margin: 0;
		color: var(--c-text-soft);
		font-size: 0.78rem;
		text-align: center;
	}
	@media (min-width: 700px) {
		.hub-shell {
			padding-top: 1.5rem;
		}
		.featured-section :global(.featured) {
			grid-template-columns: 1.1fr 1fr;
		}
	}
</style>
