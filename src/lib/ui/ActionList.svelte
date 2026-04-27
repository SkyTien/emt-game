<script lang="ts">
	import { locale, _ } from 'svelte-i18n';
	import { localize } from '$lib/i18n/localize';
	import { fade } from 'svelte/transition';
	import type { ActionRegistry } from '$lib/data/registry';
	import type { BodyRegion, Action } from '$lib/types/content';
	import Icon from './Icon.svelte';

	let {
		registry,
		actions,
		mode = 'interactive', // NEW: explicit mode control instead of guessing from `actions` prop
		completedIds = new Set<string>(),
		onAction,
		onpick
	}: {
		registry?: ActionRegistry;
		actions?: Action[];
		mode?: 'interactive' | 'list';
		completedIds?: Set<string>;
		onAction?: (id: string) => void;
		onpick?: (a: Action) => void;
	} = $props();

	type ZoneId = BodyRegion;

	type ZoneMeta = {
		label: string;
		color: string;
		icon: string;
	};

	const ZONES = $derived<Record<ZoneId, ZoneMeta>>({
		head: { label: $_('scenario.zone_head'), color: '#63b3ed', icon: 'Brain' },
		neck: { label: $_('scenario.zone_neck'), color: '#76e4f7', icon: 'Shield' },
		chest: { label: $_('scenario.zone_chest'), color: '#fc8181', icon: 'HeartPulse' },
		abdomen: { label: $_('scenario.zone_abdomen'), color: '#f6ad55', icon: 'Activity' },
		arm: { label: $_('scenario.zone_arm'), color: '#68d391', icon: 'Activity' },
		wrist: { label: $_('scenario.zone_wrist'), color: '#b794f4', icon: 'Gauge' },
		leg: { label: $_('scenario.zone_leg'), color: '#90cdf4', icon: 'Footprints' },
		general: { label: $_('scenario.zone_general'), color: '#fbd38d', icon: 'ClipboardCheck' }
	});

	let selectedZone = $state<ZoneId | null>(null);

	const allActions = $derived(actions ?? registry?.all() ?? []);

	function actionsForZone(zone: ZoneId) {
		return allActions.filter((a) => a.body_region === zone);
	}

	const currentActions = $derived(
		mode === 'list' ? allActions : selectedZone ? actionsForZone(selectedZone) : []
	);

	function handleAction(action: Action) {
		if (onAction) onAction(action.id);
		if (onpick) onpick(action);
	}

	function hasDone(zone: ZoneId): boolean {
		return actionsForZone(zone).some((a) => completedIds.has(a.label['zh-Hant']));
	}

	function allDone(zone: ZoneId): boolean {
		const zoneActions = actionsForZone(zone);
		return zoneActions.length > 0 && zoneActions.every((a) => completedIds.has(a.label['zh-Hant']));
	}

	function toggle(zone: ZoneId) {
		selectedZone = selectedZone === zone ? null : zone;
	}
</script>

<div class="body-console" class:simple={mode === 'list'}>
	<!-- 左/上：部位選擇器 -->
	{#if mode === 'interactive'}
		<div class="body-wrap">
			<div class="scanner-container">
				<svg viewBox="0 0 100 240" class="body-svg">
					<defs>
						<filter id="zone-glow">
							<feGaussianBlur stdDeviation="2" result="coloredBlur" />
							<feMerge>
								<feMergeNode in="coloredBlur" />
								<feMergeNode in="SourceGraphic" />
							</feMerge>
						</filter>
					</defs>

					<!-- 頭部 Head -->
					<circle cx="50" cy="25" r="15" 
						class="zone" 
						class:active={selectedZone === 'head'} 
						class:done={allDone('head')} 
						class:partial={hasDone('head') && !allDone('head')} 
						style="--c: {ZONES.head.color}" 
						onclick={() => toggle('head')} 
					/>
					<!-- 頸部 Neck -->
					<rect x="42" y="42" width="16" height="8" rx="2" 
						class="zone" 
						class:active={selectedZone === 'neck'} 
						class:done={allDone('neck')} 
						class:partial={hasDone('neck') && !allDone('neck')} 
						style="--c: {ZONES.neck.color}" 
						onclick={() => toggle('neck')} 
					/>
					<!-- 胸部 Chest -->
					<rect x="28" y="52" width="44" height="35" rx="5" 
						class="zone" 
						class:active={selectedZone === 'chest'} 
						class:done={allDone('chest')} 
						class:partial={hasDone('chest') && !allDone('chest')} 
						style="--c: {ZONES.chest.color}" 
						onclick={() => toggle('chest')} 
					/>
					<!-- 腹部 Abdomen -->
					<rect x="30" y="89" width="40" height="35" rx="5" 
						class="zone" 
						class:active={selectedZone === 'abdomen'} 
						class:done={allDone('abdomen')} 
						class:partial={hasDone('abdomen') && !allDone('abdomen')} 
						style="--c: {ZONES.abdomen.color}" 
						onclick={() => toggle('abdomen')} 
					/>
					<!-- 手臂 Arms (Left and Right) -->
					<rect x="14" y="52" width="12" height="60" rx="4" 
						class="zone" 
						class:active={selectedZone === 'arm'} 
						class:done={allDone('arm')} 
						class:partial={hasDone('arm') && !allDone('arm')} 
						style="--c: {ZONES.arm.color}" 
						onclick={() => toggle('arm')} 
					/>
					<rect x="74" y="52" width="12" height="60" rx="4" 
						class="zone" 
						class:active={selectedZone === 'arm'} 
						class:done={allDone('arm')} 
						class:partial={hasDone('arm') && !allDone('arm')} 
						style="--c: {ZONES.arm.color}" 
						onclick={() => toggle('arm')} 
					/>
					<!-- 手腕 Wrists (Left and Right) -->
					<circle cx="20" cy="118" r="6" 
						class="zone" 
						class:active={selectedZone === 'wrist'} 
						class:done={allDone('wrist')} 
						class:partial={hasDone('wrist') && !allDone('wrist')} 
						style="--c: {ZONES.wrist.color}" 
						onclick={() => toggle('wrist')} 
					/>
					<circle cx="80" cy="118" r="6" 
						class="zone" 
						class:active={selectedZone === 'wrist'} 
						class:done={allDone('wrist')} 
						class:partial={hasDone('wrist') && !allDone('wrist')} 
						style="--c: {ZONES.wrist.color}" 
						onclick={() => toggle('wrist')} 
					/>
					<!-- 腿部 Legs (Left and Right) -->
					<rect x="30" y="126" width="18" height="90" rx="5" 
						class="zone" 
						class:active={selectedZone === 'leg'} 
						class:done={allDone('leg')} 
						class:partial={hasDone('leg') && !allDone('leg')} 
						style="--c: {ZONES.leg.color}" 
						onclick={() => toggle('leg')} 
					/>
					<rect x="52" y="126" width="18" height="90" rx="5" 
						class="zone" 
						class:active={selectedZone === 'leg'} 
						class:done={allDone('leg')} 
						class:partial={hasDone('leg') && !allDone('leg')} 
						style="--c: {ZONES.leg.color}" 
						onclick={() => toggle('leg')} 
					/>
				</svg>
				<div class="scanline"></div>
			</div>
			<button class="general-btn" class:active={selectedZone === 'general'} onclick={() => toggle('general')}>
				<Icon name="ClipboardCheck" size={16} /> {$_('scenario.general_assessment')}
			</button>
		</div>
	{/if}

	<!-- 右：動作清單 -->
	<div class="action-panel">
		{#if selectedZone || actions}
			{@const meta = selectedZone ? ZONES[selectedZone] : ZONES.general}
			<div class="zone-header" style="border-color: {meta.color}">
				<span class="zone-title" style="color: {meta.color}">
					{actions ? $_('scenario.action_list_title') : meta.label}
				</span>
				<span class="zone-count">{$_('scenario.item_count', { values: { count: currentActions.length } })}</span>
			</div>

			<div class="actions-list" in:fade={{ duration: 150 }}>
				{#if currentActions.length === 0}
					<p class="no-actions">{$_('scenario.no_actions')}</p>
				{:else}
					{#each currentActions as action}
						<button
							class="action-item"
							class:done={completedIds.has(action.label['zh-Hant'])}
							onclick={() => handleAction(action)}
						>
							<span class="item-icon">
								<Icon name={action.icon ?? 'Circle'} size={17} />
							</span>
							<span class="item-label">
								{localize(action.label, $locale ?? 'zh-Hant')}
							</span>
							{#if completedIds.has(action.label['zh-Hant'])}
								<span class="check">✓</span>
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		{:else}
			<div class="empty-hint">
				<div class="hint-icon">👆</div>
				<p>{@html $_('scenario.action_pick_region')}</p>
			</div>
		{/if}
	</div>
</div>

<style>
	.body-console {
		display: flex;
		gap: 0.75rem;
		height: 100%;
		overflow: hidden;
	}

	@media (max-width: 600px) {
		.body-console {
			flex-direction: row; /* Ensure it stays side by side on mobile for usability */
			gap: 0.5rem;
		}
	}

	/* === 人體圖 === */
	.body-wrap {
		width: 140px;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	@media (max-width: 600px) {
		.body-wrap {
			width: 120px;
		}
	}

	.scanner-container {
		flex: 1;
		background: rgba(0, 0, 0, 0.2);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
	}

	.body-svg {
		width: 100%;
		height: 100%;
		max-height: 100%;
		overflow: visible;
	}

	.zone {
		fill: rgba(255, 255, 255, 0.1);
		stroke: var(--c);
		stroke-width: 2;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.zone:hover {
		fill: rgba(255, 255, 255, 0.2);
	}

	.zone.active {
		fill: var(--c);
		filter: url(#zone-glow);
	}

	.zone.done {
		fill: rgba(255, 255, 255, 0.05);
		stroke: rgba(255, 255, 255, 0.3);
	}

	.zone.partial {
		stroke-dasharray: 4 4;
	}

	.general-btn {
		width: 100%;
		padding: 0.5rem;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 6px;
		color: rgba(255, 255, 255, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s;
	}

	.general-btn.active {
		background: rgba(59, 130, 246, 0.2);
		border-color: #3b82f6;
		color: #60a5fa;
	}	/* === 動作面板 === */
	.action-panel {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: 0;
	}

	.zone-header {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		margin-bottom: 0.5rem;
		flex-shrink: 0;
	}
	.zone-title {
		font-size: 0.85rem;
		font-weight: 600;
		color: #fbd38d;
	}
	.zone-count {
		font-size: 0.7rem;
		color: rgba(255, 255, 255, 0.4);
	}

	.actions-list {
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.action-item {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 0.65rem 0.85rem;
		color: #f8fafc;
		display: flex;
		align-items: center;
		gap: 0.6rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.9rem;
		letter-spacing: 1px;
	}
	.action-item:hover {
		background: rgba(255, 255, 255, 0.15);
		border-color: rgba(255, 255, 255, 0.5);
		box-shadow: 0 2px 10px rgba(255, 255, 255, 0.1);
	}
	.action-item.done {
		border-color: rgba(72, 187, 120, 0.6);
		background: rgba(72, 187, 120, 0.15);
		color: #9ae6b4;
	}
	.item-icon {
		opacity: 0.7;
		flex-shrink: 0;
	}
	.item-label {
		flex: 1;
		line-height: 1.3;
	}
	.check {
		font-weight: bold;
		color: #48bb78;
		flex-shrink: 0;
	}

	.no-actions {
		color: rgba(255, 255, 255, 0.35);
		font-size: 0.8rem;
		text-align: center;
		padding: 1rem 0;
	}

	.empty-hint {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.75rem;
		color: rgba(255, 255, 255, 0.3);
		text-align: center;
	}
	.hint-icon {
		font-size: 2rem;
		animation: pulse 2s ease-in-out infinite;
	}
	.empty-hint p {
		font-size: 0.8rem;
		line-height: 1.6;
		margin: 0;
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.1);
		}
	}
</style>
