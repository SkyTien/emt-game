<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getScenarioById } from '$lib/data/content';
	import {
		catalogDifficulty,
		catalogEstimatedMinutes,
		catalogSummary,
		catalogTags,
		resolveCatalogImage
	} from '$lib/data/catalog';
	import { localize } from '$lib/i18n/localize';
	import Icon from '$lib/ui/Icon.svelte';

	let scenario = $derived(getScenarioById(page.params.id ?? ''));
	let sceneImage = $derived(resolveCatalogImage(scenario?.illustration, base));

	function pick(role: 'lead' | 'assist') {
		if (!scenario) return;
		sessionStorage.setItem(`emt1game:role:${scenario.id}`, role);
		goto(`${base}/scenarios/${scenario.id}/play`);
	}
</script>

<main class="briefing-shell">
	{#if !scenario}
		<div class="not-found">
			<p>{$_('error.runtime.scenario_load_failed', { values: { reason: 'not found' } })}</p>
			<a href={`${base}/scenarios`}>← {$_('common.back')}</a>
		</div>
	{:else}
		<header class="briefing-header">
			<a href={`${base}/scenarios`} aria-label={$_('common.back')}
				><Icon name="ArrowLeft" size={22} /></a
			>
			<div>
				<p>{$_('scenario.briefing_kicker')}</p>
				<h1>{$_('scenario.briefing_title')}</h1>
			</div>
		</header>

		<section class="mission-card">
			<div class="mission-visual">
				{#if sceneImage}<img src={sceneImage} alt="" />{/if}
				<div class="visual-shade"></div>
				<span>{$_(`catalog.difficulty.${catalogDifficulty(scenario)}`)}</span>
			</div>
			<div class="mission-copy">
				<p class="eyebrow">{$_('scenario.dispatch_received')}</p>
				<h2>{localize(scenario.title, $locale ?? 'zh-Hant')}</h2>
				<p>{localize(catalogSummary(scenario), $locale ?? 'zh-Hant')}</p>
				<div class="mission-meta">
					<span
						><Icon name="Clock3" size={16} />{$_('catalog.minutes', {
							values: { count: catalogEstimatedMinutes(scenario) }
						})}</span
					>
					<span><Icon name="UsersRound" size={16} />{$_('scenario.crew_size')}</span>
				</div>
				<div class="tags">
					{#each catalogTags(scenario) as tag}<span>{localize(tag, $locale ?? 'zh-Hant')}</span
						>{/each}
				</div>
			</div>
		</section>

		<section class="crew-section" aria-labelledby="crew-title">
			<div class="section-heading">
				<div>
					<p>{$_('scenario.crew_kicker')}</p>
					<h2 id="crew-title">{$_('scenario.role_select_title')}</h2>
				</div>
				<span><i></i>{$_('home.partner_ready')}</span>
			</div>
			<p class="crew-note">{$_('scenario.role_ai_note')}</p>

			<div class="role-cards">
				{#each [['lead', scenario.crew.lead], ['assist', scenario.crew.assist]] as const as entry (entry[0])}
					{@const role = entry[0]}
					{@const member = entry[1]}
					<button
						type="button"
						class="role-card"
						class:recommended={role === 'lead'}
						onclick={() => pick(role)}
					>
						<div class="role-top">
							<div class="role-icon">
								<Icon name={role === 'lead' ? 'UserRound' : 'Bot'} size={24} />
							</div>
							<div>
								{#if role === 'lead'}<span class="recommended-label"
										>{$_('scenario.role_recommended')}</span
									>{/if}
								<h3>{$_(`scenario.role_${role}`)}</h3>
							</div>
							<Icon name="ChevronRight" size={22} />
						</div>
						{#if member.duty}
							<p class="duty">{localize(member.duty, $locale ?? 'zh-Hant')}</p>
						{/if}
						<div class="carry">
							<Icon name="BriefcaseMedical" size={16} />
							<span
								>{$_('scenario.role_carry_label')}：{member.carries
									.map((bag) => $_(`equipment.${bag}`))
									.join(' / ')}</span
							>
						</div>
						<span class="start-label">{$_('scenario.role_start')}</span>
					</button>
				{/each}
			</div>
		</section>
	{/if}
</main>

<style>
	.briefing-shell {
		width: min(100%, 820px);
		margin: 0 auto;
		padding: 1rem 1rem 3rem;
		display: grid;
		gap: 1.5rem;
	}
	.briefing-header {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding-top: env(safe-area-inset-top);
	}
	.briefing-header > a {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 12px;
		color: var(--c-text);
		background: var(--c-panel);
		border: 1px solid var(--c-border);
	}
	.briefing-header p,
	.section-heading p,
	.eyebrow {
		margin: 0;
		color: var(--c-text-muted);
		font-size: 0.68rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}
	.briefing-header h1 {
		margin: 0.1rem 0 0;
		font-size: 1.1rem;
	}
	.mission-card {
		display: grid;
		overflow: hidden;
		border-radius: 20px;
		background: var(--c-panel);
		border: 1px solid var(--c-border);
		box-shadow: var(--shadow-card);
	}
	.mission-visual {
		position: relative;
		min-height: 210px;
		background: var(--c-bg-soft);
		overflow: hidden;
	}
	.mission-visual img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.visual-shade {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, transparent, rgba(7, 19, 31, 0.62));
	}
	.mission-visual > span {
		position: absolute;
		top: 0.85rem;
		right: 0.85rem;
		padding: 0.28rem 0.65rem;
		border-radius: 999px;
		background: rgba(7, 19, 31, 0.78);
		color: #fde68a;
		font-size: 0.72rem;
		font-weight: 800;
	}
	.mission-copy {
		display: grid;
		gap: 0.65rem;
		padding: 1.1rem;
	}
	.mission-copy h2 {
		margin: 0;
		font-size: 1.45rem;
	}
	.mission-copy > p:not(.eyebrow) {
		margin: 0;
		color: var(--c-text-soft);
	}
	.mission-meta,
	.tags {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5rem 0.8rem;
	}
	.mission-meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		color: var(--c-text-muted);
		font-size: 0.76rem;
	}
	.tags span {
		padding: 0.22rem 0.55rem;
		border-radius: 999px;
		color: #9ae6b4;
		background: rgba(74, 222, 128, 0.08);
		border: 1px solid rgba(74, 222, 128, 0.16);
		font-size: 0.72rem;
		font-weight: 800;
	}
	.crew-section {
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
		font-size: 1.15rem;
	}
	.section-heading > span {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		color: var(--c-status);
		font-size: 0.72rem;
		font-weight: 800;
	}
	.section-heading i {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: currentColor;
	}
	.crew-note {
		margin: 0;
		color: var(--c-text-soft);
		font-size: 0.86rem;
	}
	.role-cards {
		display: grid;
		gap: 0.8rem;
	}
	.role-card {
		position: relative;
		display: grid;
		gap: 0.75rem;
		padding: 1rem;
		text-align: left;
		background: var(--c-panel);
		border: 1px solid var(--c-border);
		border-radius: 18px;
		cursor: pointer;
		box-shadow: var(--shadow-card);
	}
	.role-card.recommended {
		border-color: rgba(250, 204, 21, 0.38);
	}
	.role-top {
		display: grid;
		grid-template-columns: auto 1fr auto;
		align-items: center;
		gap: 0.75rem;
	}
	.role-icon {
		width: 44px;
		height: 44px;
		display: grid;
		place-items: center;
		border-radius: 13px;
		color: var(--c-status);
		background: rgba(45, 212, 191, 0.1);
		border: 1px solid rgba(45, 212, 191, 0.2);
	}
	.recommended .role-icon {
		color: var(--c-dispatch);
		background: rgba(250, 204, 21, 0.1);
		border-color: rgba(250, 204, 21, 0.2);
	}
	.role-top h3 {
		margin: 0;
		font-size: 1.08rem;
	}
	.recommended-label {
		display: block;
		margin-bottom: 0.12rem;
		color: var(--c-dispatch);
		font-size: 0.66rem;
		font-weight: 800;
	}
	.duty {
		margin: 0;
		color: var(--c-text-soft);
		font-size: 0.86rem;
	}
	.carry {
		display: flex;
		align-items: flex-start;
		gap: 0.45rem;
		color: var(--c-text-muted);
		font-size: 0.75rem;
	}
	.carry :global(svg) {
		flex: 0 0 auto;
		margin-top: 0.08rem;
	}
	.start-label {
		justify-self: end;
		color: var(--c-dispatch);
		font-size: 0.78rem;
		font-weight: 800;
	}
	.not-found {
		padding: 2rem;
		text-align: center;
	}
	@media (min-width: 700px) {
		.mission-card {
			grid-template-columns: 1.2fr 1fr;
		}
		.role-cards {
			grid-template-columns: 1fr 1fr;
		}
	}
</style>
