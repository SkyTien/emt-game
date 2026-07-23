<script lang="ts">
	import type { ActionLogEntry } from '$lib/engine/scenario-engine';
	import { format } from 'date-fns';
	import { _ } from 'svelte-i18n';

	let { log }: { log: ActionLogEntry[] } = $props();

	function getTime(tMs: number) {
		return format(new Date(tMs), 'HH:mm:ss');
	}
</script>

<div class="log-list">
	{#if log.length === 0}
		<p class="empty">{$_('scenario.log_empty')}</p>
	{/if}

	{#each log as entry}
		<div
			class="entry"
			class:correct={entry.kind === 'action' && entry.correct}
			class:wrong={entry.kind === 'action' && !entry.correct}
		>
			<span class="time">{getTime(entry.tMs)}</span>

			<div class="main">
				{#if entry.kind === 'action'}
					<span class="action-name">{entry.actionLabel}</span>
					<span class="role-tag">{entry.by}</span>
				{:else if entry.kind === 'task_queued'}
					<span class="system-msg">
						{$_('scenario.log_task_queued', { values: { action: entry.actionId } })}
					</span>
					<span class="role-tag">{entry.by}</span>
				{:else if entry.kind === 'task_started'}
					<span class="system-msg">
						{$_('scenario.log_task_started', { values: { action: entry.actionId } })}
					</span>
					<span class="role-tag">{entry.by}</span>
				{:else if entry.kind === 'task_interrupted'}
					<span class="system-msg interrupted">
						{$_('scenario.log_task_interrupted', { values: { action: entry.actionId } })}
					</span>
					<span class="role-tag">{entry.by}</span>
				{:else}
					<span class="system-msg">
						{#if entry.kind === 'phase_advance'}
							{$_('scenario.log_phase_advance')}
						{:else if entry.kind === 'outcome'}
							{$_('scenario.log_outcome')}
						{/if}
					</span>
				{/if}
			</div>
		</div>
	{/each}
</div>

<style>
	.log-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		overflow-y: auto;
		flex: 1;
	}
	.empty {
		text-align: center;
		color: #666;
		padding: 2rem;
	}
	.entry {
		display: flex;
		gap: 0.75rem;
		padding: 0.65rem 0.75rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-left: 4px solid rgba(255, 255, 255, 0.2);
	}
	.entry.correct {
		border-left-color: #48bb78;
	}
	.entry.wrong {
		border-left-color: #f56565;
	}
	.time {
		font-size: 0.8rem;
		color: #888;
		font-family: monospace;
	}
	.main {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.action-name {
		font-weight: 500;
	}
	.role-tag {
		font-size: 0.7rem;
		padding: 2px 6px;
		background: #444;
		border-radius: 4px;
		text-transform: uppercase;
		color: #aaa;
	}
	.system-msg {
		color: #4299e1;
		font-weight: bold;
		font-size: 0.9rem;
	}
	.system-msg.interrupted {
		color: #f59e0b;
	}
</style>
