<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { ActorLane, ActorRole, ActorTask } from '$lib/engine/scenario-engine';

	let {
		lanes,
		actionLabels,
		nowMs,
		playerRole,
		oncancel
	}: {
		lanes: Record<ActorRole, ActorLane>;
		actionLabels: Record<string, string>;
		nowMs: number;
		playerRole: ActorRole;
		oncancel: (actor: ActorRole) => void;
	} = $props();

	const actors: ActorRole[] = ['lead', 'assist'];

	function remainingSeconds(task: ActorTask): number {
		const dueAt = task.status === 'queued' ? task.readyAtMs : task.completesAtMs;
		if (dueAt === null) return 0;
		return Math.max(0, Math.ceil((dueAt - nowMs) / 1000));
	}
</script>

<div class="crew-lanes" aria-label={$_('scenario.task_lanes_label')}>
	{#each actors as actor}
		{@const lane = lanes[actor]}
		<div class:player={actor === playerRole} class:active={lane.status !== 'idle'} class="lane">
			<div class="lane-heading">
				<span class="role">{$_(`scenario.role_${actor}`)}</span>
				{#if actor === playerRole}<span class="you">{$_('scenario.task_lane_you')}</span>{/if}
			</div>
			{#if lane.task}
				<div class="task">
					<span class="task-name">{actionLabels[lane.task.actionId] ?? lane.task.actionId}</span>
					<span class="task-state">
						{#if lane.task.status === 'queued'}
							{$_('scenario.task_queued', {
								values: { seconds: remainingSeconds(lane.task) }
							})}
						{:else}
							{$_('scenario.task_busy', {
								values: { seconds: remainingSeconds(lane.task) }
							})}
						{/if}
					</span>
				</div>
				{#if actor === playerRole && lane.task.status === 'busy' && lane.task.interruptible}
					<button type="button" onclick={() => oncancel(actor)}>
						{$_('scenario.task_cancel')}
					</button>
				{/if}
			{:else}
				<span class="idle">{$_('scenario.task_idle')}</span>
			{/if}
		</div>
	{/each}
</div>

<style>
	.crew-lanes {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.5rem;
		margin-top: 0.65rem;
	}

	.lane {
		min-width: 0;
		padding: 0.55rem 0.65rem;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 8px;
		background: rgba(0, 0, 0, 0.24);
	}

	.lane.active {
		border-color: rgba(250, 204, 21, 0.55);
		background: rgba(250, 204, 21, 0.08);
	}

	.lane.player {
		box-shadow: inset 3px 0 0 #22d3ee;
	}

	.lane-heading,
	.task {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.45rem;
	}

	.role,
	.task-name {
		overflow: hidden;
		font-weight: 700;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.role {
		font-size: 0.72rem;
		color: #cbd5e1;
	}

	.you,
	.task-state,
	.idle {
		font-size: 0.68rem;
		color: #94a3b8;
	}

	.task {
		margin-top: 0.25rem;
	}

	.task-name {
		font-size: 0.76rem;
		color: #f8fafc;
	}

	.task-state {
		flex: 0 0 auto;
		color: #fde68a;
	}

	button {
		min-height: 30px;
		margin-top: 0.4rem;
		padding: 0.25rem 0.55rem;
		border: 1px solid rgba(248, 113, 113, 0.6);
		border-radius: 6px;
		background: rgba(127, 29, 29, 0.35);
		color: #fecaca;
		font: inherit;
		font-size: 0.7rem;
		cursor: pointer;
	}
</style>
