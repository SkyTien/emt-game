<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { base } from '$app/paths';
	import Modal from '$lib/ui/Modal.svelte';
	import { clear } from '$lib/progress/store';

	let confirmOpen = $state(false);
	let cleared = $state(false);

	function doClear() {
		clear();
		cleared = true;
		confirmOpen = false;
	}
</script>

<main class="page">
	<header>
		<a class="back" href={base + '/'}>← {$_('common.back')}</a>
		<h1>{$_('settings.title')}</h1>
	</header>

	<button type="button" class="danger" onclick={() => (confirmOpen = true)}>
		{$_('settings.clear_progress')}
	</button>
	{#if cleared}
		<p class="ok-msg">{$_('settings.clear_progress_done')}</p>
	{/if}

	<nav class="links">
		<a href={`${base}/about`}>{$_('settings.about')}</a>
		<a href={`${base}/about#credits`}>{$_('settings.credits')}</a>
		<a href={`${base}/about#license`}>{$_('settings.license')}</a>
	</nav>

	<Modal bind:open={confirmOpen} title={$_('settings.clear_progress_confirm_title')}>
		<p>{$_('settings.clear_progress_confirm_body')}</p>
		{#snippet actions()}
			<button type="button" onclick={() => (confirmOpen = false)}>{$_('common.cancel')}</button>
			<button type="button" class="danger" onclick={doClear}>{$_('settings.clear_progress')}</button
			>
		{/snippet}
	</Modal>
</main>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: 1rem;
		display: grid;
		gap: 1rem;
	}
	.back {
		color: var(--c-text-soft);
		text-decoration: none;
	}
	h1 {
		margin: 0;
	}
	.danger {
		padding: 0.75rem 1rem;
		background: var(--c-accent);
		color: var(--c-bg);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
	}
	.ok-msg {
		color: var(--c-good);
		margin: 0;
	}
	.links {
		display: grid;
		gap: 0.5rem;
	}
	.links a {
		color: var(--c-text);
		text-decoration: none;
		padding: 0.75rem;
		background: var(--c-bg-soft);
		border-radius: 8px;
	}
</style>
