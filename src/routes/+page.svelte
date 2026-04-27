<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { base } from '$app/paths';
</script>

<main class="home">
	<h1>{$_('home.title')}</h1>
	<p class="subtitle">{$_('home.subtitle')}</p>

	<div class="modes">
		<a class="mode-btn" href="{base}/scenarios">{$_('home.mode_scenario')}</a>
		<a class="mode-btn" href="{base}/techniques">{$_('home.mode_technique')}</a>
	</div>

	<nav class="footer-nav">
		<a href="{base}/settings">{$_('home.settings_entry')}</a>
		<a href="{base}/about">{$_('home.about_entry')}</a>
	</nav>
</main>

<style>
	.home {
		display: grid;
		gap: 1.5rem;
		padding: 2rem 1rem;
		max-width: 480px;
		margin: 0 auto;
		min-height: 100dvh;
		grid-template-rows: auto auto 1fr auto;
	}
	h1 {
		text-align: center;
		font-size: 2rem;
		margin: 0;
	}
	.subtitle {
		text-align: center;
		color: var(--c-text-soft);
		margin: 0;
	}
	.modes {
		display: grid;
		gap: 1rem;
		align-content: start;
	}
	.mode-btn {
		display: block;
		padding: 1.25rem;
		text-align: center;
		background: var(--c-accent);
		color: var(--c-bg);
		border-radius: 12px;
		text-decoration: none;
		font-size: 1.1rem;
		font-weight: 600;
	}
	.footer-nav {
		display: flex;
		justify-content: center;
		gap: 1.5rem;
	}
	.footer-nav a {
		color: var(--c-text-soft);
		text-decoration: none;
	}
</style>
