<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { Action, BagId } from '$lib/types/content';
	import { BAG_IDS } from '$lib/types/content';
	import type { Location } from '$lib/engine/scenario-engine';
	import ActionList from './ActionList.svelte';
	import Icon from './Icon.svelte';

	let {
		registry,
		bagLocations,
		partnerActions,
		completedIds,
		onpick,
		ondirective
	}: {
		registry: { byBag: (b: BagId) => Action[] };
		bagLocations: Record<BagId, Location>;
		partnerActions: Action[];
		completedIds?: Set<string>;
		onpick?: (a: Action) => void;
		ondirective?: (a: Action) => void;
	} = $props();

	// Toolbox is specifically for physical equipment, so we exclude the 'hand' (徒手) actions
	// because they are now covered in the Assessment mode.
	const TOOLBOX_BAGS = BAG_IDS.filter((b) => b !== 'hand');

	const BAG_ICONS: Record<BagId | 'directive', string> = {
		hand: 'Hand',
		o2kit: 'Wind',
		jumpkit: 'BriefcaseMedical',
		aed: 'Zap',
		vehicle: 'Ambulance',
		directive: 'UserPlus'
	};

	let activeBag = $state<BagId | 'directive'>(TOOLBOX_BAGS[0]);
	let activeActions = $derived(activeBag === 'directive' ? [] : registry.byBag(activeBag as BagId));
	let activeBagOnScene = $derived(
		activeBag === 'directive' ? true : bagLocations[activeBag as BagId] === 'on_scene'
	);
</script>

<div class="toolbox">
	<div class="tabs" role="tablist">
		{#each TOOLBOX_BAGS as bag (bag)}
			<button
				type="button"
				role="tab"
				aria-selected={activeBag === bag}
				class="tab"
				class:active={activeBag === bag}
				onclick={() => (activeBag = bag)}
			>
				<Icon name={BAG_ICONS[bag]} size={16} />
				<span>{$_(`equipment.${bag}`)}</span>
			</button>
		{/each}
		<button
			type="button"
			role="tab"
			aria-selected={activeBag === 'directive'}
			class="tab"
			class:active={activeBag === 'directive'}
			onclick={() => (activeBag = 'directive')}
		>
			<Icon name={BAG_ICONS.directive} size={16} />
			<span>{$_('scenario.toolbox_directive_partner')}</span>
		</button>
	</div>

	<div class="panel">
		{#if activeBag === 'directive'}
			<ActionList mode="list" actions={partnerActions} {completedIds} onpick={ondirective} />
		{:else if !activeBagOnScene}
			<p class="not-on-scene">{$_('scenario.toolbox_bag_not_on_scene')}</p>
		{:else}
			<ActionList mode="list" actions={activeActions} {completedIds} {onpick} />
		{/if}
	</div>
</div>

<style>
	.toolbox {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		height: 100%;
	}
	.tabs {
		display: flex;
		gap: 0.4rem;
		padding: 0.75rem;
		flex-wrap: wrap;
		flex-shrink: 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}
	.tab {
		flex: 1 0 auto;
		min-width: 60px;
		min-height: 40px;
		padding: 0.4rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 2px;
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.6);
		transition: all 0.2s;
	}
	.tab:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(255, 255, 255, 0.2);
	}
	.tab.active {
		background: rgba(251, 211, 141, 0.2);
		border-color: #fbd38d;
		color: #fbd38d;
	}
	.panel {
		flex: 1;
		min-height: 0;
		overflow: hidden;
		padding: 0 0.75rem 0.75rem 0.75rem;
	}
	.not-on-scene {
		text-align: center;
		color: rgba(255, 255, 255, 0.4);
		padding: 2rem 1.5rem;
		background: rgba(255, 255, 255, 0.03);
		border-radius: 8px;
		border: 1px dashed rgba(255, 255, 255, 0.1);
		font-size: 0.9rem;
	}
</style>
