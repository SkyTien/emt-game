<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { base } from '$app/paths';
	import Icon from './Icon.svelte';

	let { active }: { active: 'home' | 'scenarios' | 'techniques' | 'settings' } = $props();

	const items = $derived([
		{ id: 'home' as const, href: `${base}/`, icon: 'House', label: $_('nav.home') },
		{
			id: 'scenarios' as const,
			href: `${base}/scenarios`,
			icon: 'Siren',
			label: $_('nav.scenarios')
		},
		{
			id: 'techniques' as const,
			href: `${base}/techniques`,
			icon: 'Stethoscope',
			label: $_('nav.techniques')
		},
		{
			id: 'settings' as const,
			href: `${base}/settings`,
			icon: 'Settings',
			label: $_('nav.settings')
		}
	]);
</script>

<nav class="training-nav" aria-label={$_('nav.primary')}>
	{#each items as item (item.id)}
		<a
			href={item.href}
			class:active={active === item.id}
			aria-current={active === item.id ? 'page' : undefined}
		>
			<Icon name={item.icon} size={20} />
			<span>{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.training-nav {
		position: fixed;
		z-index: 50;
		left: 50%;
		bottom: 0;
		transform: translateX(-50%);
		width: min(100%, 760px);
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		background: rgba(8, 20, 32, 0.96);
		border: 1px solid var(--c-border);
		border-bottom: 0;
		box-shadow: 0 -12px 32px rgba(0, 0, 0, 0.26);
		backdrop-filter: blur(16px);
		padding: 0.4rem max(0.35rem, env(safe-area-inset-right))
			calc(0.35rem + env(safe-area-inset-bottom)) max(0.35rem, env(safe-area-inset-left));
		border-radius: 18px 18px 0 0;
	}
	a {
		min-height: 54px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.15rem;
		border-radius: 12px;
		color: var(--c-text-muted);
		text-decoration: none;
		font-size: 0.72rem;
		font-weight: 700;
		transition:
			color 0.18s ease,
			background 0.18s ease;
	}
	a.active {
		color: var(--c-dispatch);
		background: rgba(250, 204, 21, 0.1);
	}
	@media (min-width: 800px) {
		.training-nav {
			bottom: 1rem;
			border-bottom: 1px solid var(--c-border);
			border-radius: 18px;
			padding-bottom: 0.4rem;
		}
	}
</style>
