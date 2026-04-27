<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = $bindable(false),
		title,
		children,
		actions
	}: { open: boolean; title: string; children: Snippet; actions?: Snippet } = $props();

	function close() {
		open = false;
	}
</script>

{#if open}
	<div
		class="backdrop"
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
		role="presentation"
	>
		<div
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-labelledby="dlg-title"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			tabindex="-1"
		>
			<h2 id="dlg-title">{title}</h2>
			<div class="body">{@render children()}</div>
			{#if actions}
				<div class="actions">{@render actions()}</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: grid;
		place-items: center;
		z-index: 100;
	}
	.dialog {
		background: var(--c-bg);
		border-radius: 12px;
		padding: 1.25rem;
		max-width: 90vw;
		width: 360px;
		display: grid;
		gap: 1rem;
	}
	h2 {
		margin: 0;
		font-size: 1.1rem;
	}
	.actions {
		display: flex;
		gap: 0.75rem;
		justify-content: flex-end;
	}
</style>
