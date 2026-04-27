<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { fade, slide, fly } from 'svelte/transition';
	import { ScenarioEngine } from '$lib/engine/scenario-engine';
	import ActionList from '$lib/ui/ActionList.svelte';
	import Toolbox from '$lib/ui/Toolbox.svelte';
	import PatientStatus from '$lib/ui/PatientStatus.svelte';
	import PhaseProgress from '$lib/ui/PhaseProgress.svelte';
	import FeedbackOverlay from '$lib/ui/FeedbackOverlay.svelte';
	import LogView from '$lib/ui/LogView.svelte';
	import Icon from '$lib/ui/Icon.svelte';
	import Typewriter from '$lib/ui/Typewriter.svelte';
	import type { ActorRole, ScenarioState, Location, Feedback } from '$lib/engine/scenario-engine';
	import type { BagId } from '$lib/types/content';

	let { data } = $props();
	const scenario = $derived(data.scenario);
	const registry = $derived(data.registry);

	let gameState: ScenarioState = $state() as any;

	$effect.pre(() => {
		if (scenario) {
			gameState = ScenarioEngine.init(scenario, 'lead', Date.now());
		}
	});

	let lastFeedback = $state<Feedback | null>(null);
	let showLog = $state(false);
	let flash = $state(false);
	let narrativeFinished = $state(false);

	// Mode State
	let activeMode = $state<'scene' | 'assessment' | 'toolbox' | null>(null);

	function toggleMode(mode: 'scene' | 'assessment' | 'toolbox') {
		if (activeMode === mode) {
			activeMode = null;
		} else {
			activeMode = mode;
		}
	}

	const currentPhase = $derived(gameState ? ScenarioEngine.currentPhase(gameState) : null);
	const doneRequired = $derived(gameState?.completedRequiredIds.size ?? 0);
	const totalRequired = $derived(currentPhase?.required.length ?? 0);
	const hpPercentage = $derived(Math.max(0, 100 - (gameState?.consecutiveMistakes ?? 0) * 20));

	let currentNarrative = $state('');
	let narrativeId = $state(0);
	let lastPhaseIndex = $state(-1);

	$effect(() => {
		// Detect phase changes to show the new phase narrative
		if (gameState && gameState.phaseIndex !== lastPhaseIndex) {
			lastPhaseIndex = gameState.phaseIndex;
			currentNarrative = currentPhase?.narrative['zh-Hant'] ?? $_('scenario.narrative_initial');
			narrativeId++;
		}
	});

	$effect(() => {
		// Reset narrative finished state and active mode when the narrative block changes
		const _ = narrativeId;
		narrativeFinished = false;
		activeMode = null;
	});

	const allActions = $derived(registry.all());
	const sceneActions = $derived(
		allActions.filter((a) => a.bag === 'hand' && a.body_region === 'general')
	);
	const assessmentActions = $derived(
		allActions.filter((a) => a.bag === 'hand' && a.body_region !== 'general')
	);

	// Mock bag locations (everyone brings everything to scene for now)
	const bagLocations = $derived({
		hand: 'on_scene',
		o2kit: 'on_scene',
		jumpkit: 'on_scene',
		aed: 'on_scene',
		vehicle: 'on_scene'
	} as Record<BagId, Location>);

	function handleAction(actionId: string, by: ActorRole) {
		const action = registry.tryById(actionId);
		if (!action) return;

		const result = ScenarioEngine.performAction(gameState, action.label['zh-Hant'], by, Date.now());
		gameState = result.state;
		lastFeedback = result.feedback;

		// We intentionally DO NOT update currentNarrative to 'ok' / 'wrong_action' here.
		// The FeedbackOverlay handles the correct/incorrect display.
		// This also prevents `narrativeId` from incrementing, keeping `activeMode` open
		// until the scenario phase actually advances.

		if (!result.feedback.correct) {
			flash = true;
			setTimeout(() => (flash = false), 500);
		}
	}
</script>

<svelte:head>
	<title>{scenario.title['zh-Hant']} - EMT Training</title>
</svelte:head>

<main class="game-container">
	<!-- 頂部 HUD -->
	<div class="hud-top">
		<div class="hud-row">
			<a href="/scenarios" class="btn-icon" aria-label={$_('scenario.back_to_list')}>
				<Icon name="ArrowLeft" size={24} />
			</a>
			<div class="scenario-info">
				<h1>{scenario.title['zh-Hant']}</h1>
				<PhaseProgress done={doneRequired} total={totalRequired} />
				<div class="hp-bar-container">
					<div
						class="hp-bar-fill"
						style="width: {hpPercentage}%"
						class:critical={hpPercentage <= 40}
					></div>
				</div>
			</div>
			<button
				class="btn-icon"
				onclick={() => (showLog = !showLog)}
				aria-label={$_('scenario.show_log')}
			>
				<Icon name="ClipboardList" size={24} />
			</button>
		</div>

		{#if gameState.consecutiveMistakes >= 2 && currentPhase?.hint}
			<div class="hint-box" transition:fly={{ y: -20 }}>
				<span class="hint-icon">💡</span>
				{currentPhase.hint['zh-Hant']}
			</div>
		{/if}
	</div>
	<!-- 中間主要內容區 -->
	<div class="game-viewport">
		<!-- 背景圖層 -->
		<div class="scene-layer">
			{#if currentPhase?.illustration || scenario.illustration}
				<div class="scene-img-wrapper">
					<img
						src={currentPhase?.illustration || scenario.illustration}
						alt="Scene"
						class="scene-img"
						transition:fade
					/>
				</div>
			{/if}
			<div class="scene-overlay"></div>
		</div>

		<div class="mode-container">
			{#if activeMode === null}
				<!-- Background image is fully visible, just show the narrative box at the bottom -->
				<div class="mode-panel scene-panel" in:fade={{ duration: 150 }}>
					<div class="scene-spacer"></div>
					<div class="narrative-box glass-panel">
						{#key narrativeId}
							<Typewriter
								text={currentNarrative}
								speed={40}
								onfinish={() => (narrativeFinished = true)}
							/>
						{/key}
					</div>
				</div>
			{:else if activeMode === 'scene'}
				<!-- Scene Tab Opened: structurally identical to Assessment and Toolbox -->
				<div class="mode-panel glass-panel fill" in:fade={{ duration: 150 }}>
					<div class="patient-status-wrapper scene-narrative-top">
						<Icon name="MessageSquareText" size={20} />
						<span>{currentNarrative}</span>
					</div>
					<div class="panel-content">
						{#if narrativeFinished}
							<ActionList
								mode="list"
								actions={sceneActions}
								completedIds={gameState.completedRequiredIds}
								onAction={(id) => handleAction(id, gameState.playerRole)}
							/>
						{/if}
					</div>
				</div>
			{:else if activeMode === 'assessment'}
				<div class="mode-panel glass-panel fill" in:fade={{ duration: 150 }}>
					<PatientStatus patient={gameState.patient} revealed={gameState.revealedVitals} />
					<div class="panel-content">
						<ActionList
							actions={assessmentActions}
							completedIds={gameState.completedRequiredIds}
							onAction={(id) => handleAction(id, gameState.playerRole)}
						/>
					</div>
				</div>
			{:else if activeMode === 'toolbox'}
				<div class="mode-panel glass-panel fill" in:fade={{ duration: 150 }}>
					<div class="panel-content toolbox-pad">
						<Toolbox
							{registry}
							{bagLocations}
							completedIds={gameState.completedRequiredIds}
							partnerActions={[]}
							onpick={(a) => handleAction(a.id, gameState.playerRole)}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- 底部導覽列 -->
	<nav class="bottom-nav" class:disabled={!narrativeFinished}>
		<button
			class="nav-item"
			class:active={activeMode === 'scene'}
			onclick={() => narrativeFinished && toggleMode('scene')}
		>
			<Icon name="Search" size={24} />
			<span>{$_('scenario.tab_scene')}</span>
		</button>
		<button
			class="nav-item"
			class:active={activeMode === 'assessment'}
			onclick={() => narrativeFinished && toggleMode('assessment')}
		>
			<Icon name="ScanFace" size={24} />
			<span>{$_('scenario.tab_assessment')}</span>
		</button>
		<button
			class="nav-item"
			class:active={activeMode === 'toolbox'}
			onclick={() => narrativeFinished && toggleMode('toolbox')}
		>
			<Icon name="BriefcaseMedical" size={24} />
			<span>{$_('scenario.tab_toolbox')}</span>
		</button>
	</nav>

	<!-- 反饋層 -->
	{#if lastFeedback}
		<FeedbackOverlay
			correct={lastFeedback.correct}
			message={lastFeedback.message}
			onClose={() => (lastFeedback = null)}
		/>
	{/if}

	<!-- 日誌疊層 -->
	{#if showLog}
		<div
			class="log-overlay"
			onclick={() => (showLog = false)}
			onkeydown={(e) => e.key === 'Escape' && (showLog = false)}
			role="button"
			tabindex="0"
			aria-label={$_('scenario.close_log')}
			transition:fade
		>
			<div
				class="log-content"
				onclick={(e) => e.stopPropagation()}
				onkeydown={(e) => e.stopPropagation()}
				role="none"
				transition:fly={{ x: 300 }}
			>
				<header>
					<h2>{$_('scenario.log_title')}</h2>
					<button class="btn-icon" onclick={() => (showLog = false)}>
						<Icon name="X" size={24} />
					</button>
				</header>
				<LogView log={gameState.log} />
			</div>
		</div>
	{/if}
</main>

<style>
	.game-container {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background: #000;
		color: #fff;
		font-family: 'Inter', sans-serif;
	}

	/* 背景圖層 */
	.scene-layer {
		position: absolute;
		inset: 0;
		z-index: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		background: #000;
	}
	.scene-img-wrapper {
		width: 100%;
		height: 100%;
		max-width: 1000px; /* 限制圖片最大寬度 */
		position: relative;
	}
	.scene-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 25%; /* 確保頭部顯示 */
	}
	.scene-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0.1) 0%,
			transparent 30%,
			rgba(0, 0, 0, 0.6) 100%
		);
		pointer-events: none;
	}

	/* HUD 頂部 */
	.hud-top {
		flex: 0 0 auto;
		position: relative;
		z-index: 20;
		padding: 1rem;
		background: rgba(26, 26, 26, 0.85);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.hud-row {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	.scenario-info {
		flex: 1;
	}
	.scenario-info h1 {
		font-size: 1.1rem;
		margin-bottom: 0.25rem;
		font-weight: 600;
	}

	/* HP Bar */
	.hp-bar-container {
		height: 6px;
		background: rgba(255, 255, 255, 0.2);
		border-radius: 3px;
		margin-top: 0.5rem;
		overflow: hidden;
		width: 100%;
	}
	.hp-bar-fill {
		height: 100%;
		background: #48bb78;
		transition:
			width 0.3s ease,
			background-color 0.3s ease;
	}
	.hp-bar-fill.critical {
		background: #e53e3e;
	}

	/* 提示框 */
	.hint-box {
		margin-top: 0.75rem;
		background: rgba(245, 158, 11, 0.95);
		padding: 0.75rem;
		border-radius: 8px;
		font-size: 0.9rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
		display: flex;
		gap: 0.5rem;
	}

	/* 中間內容區 */
	.game-viewport {
		flex: 1;
		position: relative;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}
	.mode-container {
		position: relative;
		z-index: 10;
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1rem;
		overflow: hidden;
	}

	.mode-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.panel-content {
		flex: 1;
		overflow: hidden;
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
	}
	.toolbox-pad {
		padding: 0; /* Toolbox 內部已有 padding */
	}

	/* 玻璃面板共用樣式 */
	.glass-panel {
		background: rgba(15, 18, 25, 0.7);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
	}
	.glass-panel.fill {
		height: 100%;
	}

	/* === 現場勘查模式 === */
	.scene-panel {
		justify-content: flex-end;
		gap: 0.75rem;
	}
	.scene-spacer {
		flex: 1;
	}
	.scene-narrative-top {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.05);
		font-weight: 500;
		font-size: 1.05rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		color: #fbd38d;
	}
	.narrative-box {
		pointer-events: auto;
		padding: 1.2rem;
		min-height: 100px;
		font-size: 1.1rem;
		line-height: 1.6;
		color: #f8fafc;
	}
	.action-item.done {
		border-color: rgba(72, 187, 120, 0.5);
		background: rgba(72, 187, 120, 0.1);
		color: #9ae6b4;
	}

	/* 狀態區塊 */
	:global(.patient-status-wrapper) {
		padding: 1rem;
		background: rgba(0, 0, 0, 0.3);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		flex: 0 0 auto;
	}

	/* === 底部導覽列 === */
	.bottom-nav {
		flex: 0 0 auto;
		display: flex;
		background: rgba(26, 26, 26, 0.9);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border-top: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: env(safe-area-inset-bottom, 0); /* 支援 iPhone 瀏海條 */
		position: relative;
		z-index: 20;
		transition: opacity 0.3s;
	}
	.bottom-nav.disabled {
		opacity: 0.4;
		pointer-events: none;
	}
	.nav-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		padding: 0.75rem 0;
		background: transparent;
		border: none;
		color: rgba(255, 255, 255, 0.4);
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	.nav-item.active {
		color: #63b3ed; /* 使用更亮眼的藍色 */
	}
	.nav-item:hover:not(.active) {
		color: rgba(255, 255, 255, 0.8);
		background: rgba(255, 255, 255, 0.05);
	}

	/* 按鈕 */
	.btn-icon {
		background: rgba(255, 255, 255, 0.1);
		border: none;
		color: #fff;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: background 0.2s;
	}
	.btn-icon:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	/* 日誌疊層 */
	.log-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 100;
		display: flex;
		justify-content: flex-end;
	}
	.log-content {
		width: 100%;
		max-width: 400px;
		background: #1a1a1a;
		height: 100%;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		box-shadow: -4px 0 24px rgba(0, 0, 0, 0.5);
	}
	.log-content header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
</style>
