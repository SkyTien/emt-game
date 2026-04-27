<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { base } from '$app/paths';
</script>

<main class="page">
	<header>
		<a class="back" href={base + '/'}>← {$_('common.back')}</a>
		<h1>{$_('about.title')}</h1>
	</header>

	<p>{$_('about.description')}</p>

	<section id="credits">
		<h2>{$_('settings.credits')}</h2>
		<p>—</p>
	</section>

	<section id="license">
		<h2>{$_('settings.license')}</h2>
		<p>MIT</p>
	</section>
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
	h1,
	h2 {
		margin: 0;
	}
</style>
