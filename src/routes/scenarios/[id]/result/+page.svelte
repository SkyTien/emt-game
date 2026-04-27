<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getScenarioById } from '$lib/data/content';
	import { localize } from '$lib/i18n/localize';
	import StarBar from '$lib/ui/StarBar.svelte';
	import IllustrationSlot from '$lib/ui/IllustrationSlot.svelte';

	type LastResult = {
		outcomeId: string;
		correctActions: number;
		wrongActions: number;
		worsenLevel: number;
		stars: number;
		role: 'lead' | 'assist';
		log: {
			kind: string;
			tMs: number;
			actionId?: string;
			by?: string;
			correct?: boolean;
			toPhaseId?: string;
			phaseId?: string;
			outcomeId?: string;
		}[];
	};

	const scenario = getScenarioById(page.params.id ?? '');
	let result: LastResult | null = $state(null);
	let showTimeline = $state(false);

	onMount(() => {
		const raw = sessionStorage.getItem(`emt1game:lastResult:${page.params.id}`);
		if (raw) result = JSON.parse(raw) as LastResult;
	});

	const outcome = $derived(
		result && scenario ? (scenario.outcomes.find((o) => o.id === result!.outcomeId) ?? null) : null
	);
	const correctRate = $derived(() => {
		if (!result) return 0;
		const total = result.correctActions + result.wrongActions;
		return total === 0 ? 0 : result.correctActions / total;
	});
</script>

<main class="page">
	<header>
		<a class="back" href={`${base}/scenarios`}>← {$_('common.back')}</a>
		<h1>{$_('result.scenario_title')}</h1>
	</header>

	{#if !scenario || !result}
		<p>{$_('common.loading')}</p>
	{:else}
		<IllustrationSlot src={outcome?.illustration} alt={outcome?.title['zh-Hant'] ?? ''} />
		{#if outcome}
			<h2>{localize(outcome.title, $locale ?? 'zh-Hant')}</h2>
			<p class="text">{localize(outcome.text, $locale ?? 'zh-Hant')}</p>
		{/if}

		<dl class="metrics">
			<div>
				<dt>{$_('result.correct_rate')}</dt>
				<dd>{Math.round(correctRate() * 100)}%</dd>
			</div>
			<div>
				<dt>{$_('result.errors')}</dt>
				<dd>{result.wrongActions}</dd>
			</div>
			<div>
				<dt>{$_('result.worsen_level')}</dt>
				<dd>{result.worsenLevel}</dd>
			</div>
		</dl>

		<div class="stars-line">
			<StarBar stars={result.stars} />
		</div>

		<button type="button" class="link" onclick={() => (showTimeline = !showTimeline)}>
			{$_('result.timeline_entry')}
			{showTimeline ? '▴' : '▾'}
		</button>

		{#if showTimeline}
			<ol class="timeline">
				{#each result.log as entry, i (i)}
					<li class={`tl-${entry.kind}`}>
						<span class="t">{(entry.tMs / 1000).toFixed(1)}s</span>
						{#if entry.kind === 'action'}
							<span class={entry.correct ? 'ok' : 'bad'}
								>{$_(entry.correct ? 'timeline.correct' : 'timeline.incorrect')}</span
							>
							<span>{$_(`timeline.by_${entry.by === 'assist' ? 'partner' : 'player'}`)}</span>
							<span class="action">「{entry.actionId}」</span>
						{:else if entry.kind === 'on_skip'}
							<span class="bad">{$_('timeline.event_skip')}</span>
							<span>{entry.phaseId}</span>
						{:else if entry.kind === 'phase_advance'}
							<span>{$_('timeline.event_phase_advance')}</span>
							<span>→ {entry.toPhaseId}</span>
						{:else if entry.kind === 'outcome'}
							<span class="ok">{$_('timeline.event_outcome')}</span>
							<span>{entry.outcomeId}</span>
						{/if}
					</li>
				{/each}
			</ol>
		{/if}

		<div class="actions">
			<a class="btn" href={`${base}/scenarios/${scenario.id}/role`}>{$_('common.replay')}</a>
			<a class="btn ghost" href={`${base}/scenarios`}>{$_('result.return_menu')}</a>
		</div>
	{/if}
</main>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: 1rem;
		display: grid;
		gap: 0.75rem;
	}
	.back {
		color: var(--c-text-soft);
		text-decoration: none;
	}
	h1 {
		margin: 0;
	}
	h2 {
		margin: 0;
	}
	.text {
		color: var(--c-text);
		margin: 0;
	}
	.metrics {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		padding: 0;
		margin: 0;
	}
	.metrics > div {
		background: var(--c-bg-soft);
		border-radius: 8px;
		padding: 0.5rem;
		text-align: center;
	}
	.metrics dt {
		font-size: 0.75rem;
		color: var(--c-text-soft);
	}
	.metrics dd {
		margin: 0;
		font-weight: 600;
		font-size: 1.2rem;
	}
	.stars-line {
		text-align: center;
		font-size: 1.4rem;
	}
	.link {
		background: none;
		border: none;
		color: var(--c-accent);
		cursor: pointer;
		padding: 0.5rem;
	}
	.timeline {
		list-style: decimal inside;
		padding: 0.5rem;
		background: var(--c-bg-soft);
		border-radius: 8px;
		max-height: 320px;
		overflow: auto;
		display: grid;
		gap: 4px;
		font-size: 0.9rem;
	}
	.timeline li {
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.tl-on_skip {
		color: var(--c-accent);
	}
	.tl-phase_advance {
		color: var(--c-text-soft);
	}
	.t {
		font-variant-numeric: tabular-nums;
		min-width: 3em;
		color: var(--c-text-soft);
	}
	.ok {
		color: var(--c-good);
	}
	.bad {
		color: var(--c-accent);
	}
	.actions {
		display: grid;
		gap: 0.5rem;
		grid-template-columns: 1fr 1fr;
	}
	.btn {
		text-align: center;
		padding: 0.75rem;
		background: var(--c-accent);
		color: var(--c-bg);
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
	}
	.btn.ghost {
		background: var(--c-bg-soft);
		color: var(--c-text);
	}
</style>
