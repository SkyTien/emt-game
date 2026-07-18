<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fade } from 'svelte/transition';
	import { CircleCheck, CircleX, ChevronLeft, Lightbulb, TriangleAlert } from 'lucide-svelte';
	import { getTechniqueById, getRegistry } from '$lib/data/content';
	import { localize } from '$lib/i18n/localize';
	import { TechniqueEngine, type TechniqueState } from '$lib/engine/technique-engine';
	import { saveTechniqueRun } from '$lib/progress/store';
	import type { Action } from '$lib/types/content';
	import IllustrationSlot from '$lib/ui/IllustrationSlot.svelte';
	import PatientFigure from '$lib/ui/PatientFigure.svelte';
	import Toolbox from '$lib/ui/Toolbox.svelte';
	import ActionList from '$lib/ui/ActionList.svelte';
	import type { LocalizedString } from '$lib/types/content';
	import type { BagId, BodyRegion } from '$lib/types/content';
	import type { Location } from '$lib/engine/scenario-engine';

	const technique = getTechniqueById(page.params.id ?? '');
	const registry = getRegistry();

	let gameState = $state<TechniqueState | null>(technique ? TechniqueEngine.init(technique) : null);
	let pickedRegion = $state<BodyRegion | undefined>(undefined);
	let lastTip = $state<LocalizedString | undefined>(undefined);
	let lastFeedback = $state<{ correct: boolean; message: string; tMs: number } | null>(null);
	let feedbackTimeout: ReturnType<typeof setTimeout> | null = null;
	let saved = false;

	const stepIdx = $derived(gameState?.stepIndex ?? 0);
	const totalSteps = $derived(technique?.steps.length ?? 0);
	const wrongOnCurrent = $derived(
		gameState ? (gameState.wrongTriesPerStep[gameState.stepIndex] ?? 0) : 0
	);
	const totalWrong = $derived(gameState?.totalWrong ?? 0);

	const allBagsOnScene: Record<BagId, Location> = {
		hand: 'on_scene',
		o2kit: 'on_scene',
		jumpkit: 'on_scene',
		aed: 'on_scene',
		vehicle: 'on_scene'
	};

	const regionActions = $derived<Action[]>(pickedRegion ? registry.byBodyRegion(pickedRegion) : []);

	function onPick(action: Action) {
		if (!gameState || !technique) return;
		const r = TechniqueEngine.performAction(gameState, action.id);
		gameState = r.state;
		lastTip = r.feedback.tip;

		// Show Feedback Overlay
		lastFeedback = {
			correct: r.feedback.correct,
			message: action.label['zh-Hant'],
			tMs: Date.now()
		};
		if (feedbackTimeout) clearTimeout(feedbackTimeout);
		feedbackTimeout = setTimeout(() => (lastFeedback = null), 1500);

		if (gameState.finished && !saved) {
			saved = true;
			const stars = TechniqueEngine.getStars(gameState) ?? 1;
			saveTechniqueRun(technique.id, stars);
			sessionStorage.setItem(
				`emt1game:lastTechniqueResult:${technique.id}`,
				JSON.stringify({ stars, totalWrong: gameState.totalWrong })
			);
			goto(`${base}/techniques/${technique.id}/result`);
		}
	}
</script>

{#if !technique || !gameState}
	<main class="empty">
		<p>{$_('error.runtime.technique_load_failed', { values: { reason: 'not found' } })}</p>
	</main>
{:else}
	<div class="layout-container">
		<header class="topbar">
			<a class="back" href={`${base}/techniques`} aria-label="Back">
				<ChevronLeft />
			</a>
			<div class="title-info">
				<span class="title">{localize(technique.title, $locale ?? 'zh-Hant')}</span>
				<span class="step-badge"
					>{$_('technique.step_format', {
						values: { current: stepIdx + 1, total: totalSteps }
					})}</span
				>
			</div>
			<div class="wrong-counter">
				<TriangleAlert size={16} />
				<span>{totalWrong}</span>
			</div>
		</header>

		<main class="play-content">
			<!-- Section 1: Technique Info (Sticky) -->
			<section class="info-panel">
				<IllustrationSlot
					src={technique.illustration}
					alt={localize(technique.title, $locale ?? 'zh-Hant')}
				/>

				<div class="desc-box">
					<p class="desc-text">{localize(technique.description, $locale ?? 'zh-Hant')}</p>
				</div>

				{#if lastFeedback}
					<div
						class="feedback-overlay"
						class:correct={lastFeedback.correct}
						class:wrong={!lastFeedback.correct}
					>
						<div class="feedback-icon">
							{#if lastFeedback.correct}
								<CircleCheck size={24} />
							{:else}
								<CircleX size={24} />
							{/if}
						</div>
						<div class="feedback-text">
							<span class="fb-label"
								>{lastFeedback.correct ? $_('timeline.correct') : $_('timeline.incorrect')}</span
							>
							<span class="fb-action">{lastFeedback.message}</span>
						</div>
					</div>
				{/if}

				{#if wrongOnCurrent >= 2 && lastTip}
					<div class="hint-box" transition:fade>
						<div class="hint-header">
							<Lightbulb size={16} />
							<span>{$_('technique.tip_label')}</span>
						</div>
						<p>{localize(lastTip, $locale ?? 'zh-Hant')}</p>
					</div>
				{/if}
			</section>

			<!-- Section 2: Interactive Controls -->
			<div class="interaction-panels">
				{#if technique.body_region}
					<section class="interactive-figure">
						<h2 class="sec-title">{$_('scenario.action_pick_region')}</h2>
						<div class="figure-wrapper">
							<PatientFigure onpick={(r) => (pickedRegion = r)} highlight={pickedRegion} />
						</div>
					</section>
				{/if}

				<section class="action-panel">
					{#if pickedRegion && regionActions.length > 0}
						<div class="region-actions">
							<h3 class="sec-title">
								{$_('technique.region_picked', {
									values: { region: $_(`scenario.zone_${pickedRegion}`) }
								})}
							</h3>
							<ActionList actions={regionActions} onpick={onPick} />
						</div>
					{/if}

					<div class="toolbox-wrapper">
						<h3 class="sec-title">{$_('technique.use_tool')}</h3>
						<Toolbox
							{registry}
							bagLocations={allBagsOnScene}
							partnerActions={[]}
							showHand
							showDirective={false}
							onpick={onPick}
						/>
					</div>
				</section>
			</div>
		</main>
	</div>
{/if}

<style>
	:global(body) {
		overflow-x: hidden;
		background: var(--c-bg-soft);
	}
	.layout-container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
	}
	.topbar {
		display: flex;
		align-items: center;
		padding: 0.5rem 1rem;
		background: var(--c-bg);
		border-bottom: 1px solid var(--c-border);
		gap: 1rem;
		flex-shrink: 0;
	}
	.title-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		line-height: 1.2;
	}
	.title {
		font-weight: 700;
		font-size: 0.95rem;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 200px;
	}
	.step-badge {
		font-size: 0.75rem;
		color: var(--c-text-soft);
	}
	.wrong-counter {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		color: var(--c-accent);
		font-weight: 700;
	}
	.back {
		display: flex;
		align-items: center;
		color: var(--c-text);
		text-decoration: none;
	}

	.play-content {
		flex: 1;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		padding: 0.5rem;
		gap: 0.75rem;
	}

	.info-panel {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--c-bg);
		border-radius: 12px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
		overflow: hidden;
		flex-shrink: 0;
	}

	.desc-box {
		padding: 0.75rem;
		border-top: 1px solid var(--c-border);
	}
	.desc-text {
		margin: 0;
		font-size: 0.95rem;
		color: var(--c-text-soft);
		line-height: 1.4;
	}

	.hint-box {
		margin: 0.5rem 0.75rem 0.75rem;
		padding: 0.75rem;
		background: #fffbeb;
		border-left: 4px solid #f59e0b;
		border-radius: 4px;
		font-size: 0.85rem;
		color: #92400e;
	}
	.hint-header {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-weight: 700;
		margin-bottom: 0.25rem;
		text-transform: uppercase;
		font-size: 0.7rem;
	}

	.interaction-panels {
		display: grid;
		gap: 0.75rem;
	}

	.interactive-figure {
		background: var(--c-bg);
		padding: 0.75rem;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.figure-wrapper {
		width: 100%;
		max-width: 250px;
		margin: 0 auto;
	}

	.action-panel {
		display: grid;
		gap: 0.75rem;
	}
	.region-actions,
	.toolbox-wrapper {
		background: var(--c-bg);
		padding: 0.75rem;
		border-radius: 12px;
	}

	.sec-title {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--c-text-soft);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.feedback-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		animation: slide-in 0.3s ease-out;
		z-index: 20;
		backdrop-filter: blur(4px);
	}
	.feedback-overlay.correct {
		border-left: 8px solid var(--c-good);
		color: var(--c-good);
	}
	.feedback-overlay.wrong {
		border-left: 8px solid var(--c-accent);
		color: var(--c-accent);
	}

	.feedback-text {
		display: flex;
		flex-direction: column;
	}
	.fb-label {
		font-weight: 800;
		font-size: 1.2rem;
	}
	.fb-action {
		font-size: 0.9rem;
		opacity: 0.9;
	}

	@keyframes slide-in {
		from {
			transform: translateY(-100%);
		}
		to {
			transform: translateY(0);
		}
	}

	@media (min-width: 768px) {
		.play-content {
			display: grid;
			grid-template-columns: 1fr 1fr;
			max-width: 1000px;
			margin: 0 auto;
			padding: 1.5rem;
			gap: 1.5rem;
			overflow-y: visible;
		}
		.info-panel {
			position: sticky;
			top: 1.5rem;
			height: fit-content;
		}
		.interaction-panels {
			overflow-y: auto;
		}
	}
</style>
