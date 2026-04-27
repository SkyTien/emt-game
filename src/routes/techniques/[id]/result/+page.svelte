<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { getTechniqueById } from '$lib/data/content';
	import { localize } from '$lib/i18n/localize';
	import StarBar from '$lib/ui/StarBar.svelte';

	const technique = getTechniqueById(page.params.id ?? '');
	type LastResult = { stars: number; totalWrong: number };
	let result: LastResult | null = $state(null);

	onMount(() => {
		const raw = sessionStorage.getItem(`emt1game:lastTechniqueResult:${page.params.id}`);
		if (raw) result = JSON.parse(raw) as LastResult;
	});
</script>

<main class="page">
	<header>
		<a class="back" href={`${base}/techniques`}>← {$_('common.back')}</a>
		<h1>{$_('result.technique_title')}</h1>
	</header>

	{#if !technique || !result}
		<p>{$_('common.loading')}</p>
	{:else}
		<h2>{localize(technique.title, $locale ?? 'zh-Hant')}</h2>
		<dl class="metrics">
			<div>
				<dt>{$_('result.errors')}</dt>
				<dd>{result.totalWrong}</dd>
			</div>
		</dl>
		<div class="stars-line"><StarBar stars={result.stars} /></div>
		<div class="actions">
			<a class="btn" href={`${base}/techniques/${technique.id}/play`}>{$_('common.replay')}</a>
			<a class="btn ghost" href={`${base}/techniques`}>{$_('result.return_menu')}</a>
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
	h1,
	h2 {
		margin: 0;
	}
	.metrics {
		display: grid;
		grid-template-columns: 1fr;
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
