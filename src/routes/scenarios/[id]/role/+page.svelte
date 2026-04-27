<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getScenarioById } from '$lib/data/content';
	import { localize } from '$lib/i18n/localize';

	let scenario = $derived(getScenarioById(page.params.id ?? ''));

	function pick(role: 'lead' | 'assist') {
		if (!scenario) return;
		sessionStorage.setItem(`emt1game:role:${scenario.id}`, role);
		goto(`${base}/scenarios/${scenario.id}/play`);
	}
</script>

<main class="page">
	{#if !scenario}
		<p>{$_('error.runtime.scenario_load_failed', { values: { reason: 'not found' } })}</p>
		<a href={base + '/scenarios'}>← {$_('common.back')}</a>
	{:else}
		<header>
			<a class="back" href={`${base}/scenarios`}>← {$_('common.back')}</a>
			<h1>{localize(scenario.title, $locale ?? 'zh-Hant')}</h1>
			<p class="subtitle">{$_('scenario.role_select_title')}</p>
		</header>

		<div class="cards">
			{#each [['lead', scenario.crew.lead], ['assist', scenario.crew.assist]] as const as entry (entry[0])}
				{@const role = entry[0]}
				{@const member = entry[1]}
				<button type="button" class="card" onclick={() => pick(role)}>
					<h2>{$_(`scenario.role_${role}`)}</h2>
					<p class="meta">
						{$_('scenario.role_carry_label')}: {member.carries
							.map((c) => $_(`equipment.${c}`))
							.join(' / ')}
					</p>
					{#if member.duty}
						<p class="duty">
							{$_('scenario.role_duty_label')}: {localize(member.duty, $locale ?? 'zh-Hant')}
						</p>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</main>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: 1rem;
	}
	.back {
		color: var(--c-text-soft);
		text-decoration: none;
	}
	header {
		display: grid;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}
	h1 {
		margin: 0;
	}
	.subtitle {
		color: var(--c-text-soft);
		margin: 0;
	}
	.cards {
		display: grid;
		gap: 1rem;
	}
	.card {
		text-align: left;
		padding: 1rem;
		background: var(--c-bg-soft);
		border: 1px solid var(--c-border);
		border-radius: 12px;
		cursor: pointer;
	}
	.card h2 {
		margin: 0 0 0.5rem;
		font-size: 1.2rem;
	}
	.meta,
	.duty {
		margin: 0.25rem 0;
		color: var(--c-text-soft);
		font-size: 0.95rem;
	}
</style>
