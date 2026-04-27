<script lang="ts">
	import { setupI18n, waitLocale } from '$lib/i18n';
	import { _ } from 'svelte-i18n';
	import '../app.css';

	const ready = setupI18n().then(() => waitLocale());

	let { children } = $props();
</script>

{#await ready}
	<div class="boot">{$_('common.loading')}</div>
{:then}
	{@render children?.()}
{/await}

<style>
	.boot {
		display: grid;
		place-items: center;
		min-height: 100dvh;
		font-size: 1.1rem;
		color: var(--c-text);
	}
</style>
