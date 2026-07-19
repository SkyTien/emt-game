<script lang="ts">
	import { _ } from 'svelte-i18n';
	import Icon from './Icon.svelte';
	import StarBar from './StarBar.svelte';
	import type { CatalogDifficulty } from '$lib/types/content';

	let {
		title,
		summary,
		image,
		difficulty,
		duration,
		tags = [],
		stars = 0,
		runs = 0,
		featured = false,
		badge,
		href,
		onactivate,
		actionLabel
	}: {
		title: string;
		summary: string;
		image?: string;
		difficulty: CatalogDifficulty;
		duration: number;
		tags?: string[];
		stars?: number;
		runs?: number;
		featured?: boolean;
		badge?: string;
		href?: string;
		onactivate?: () => void;
		actionLabel?: string;
	} = $props();
</script>

{#snippet cardContent()}
	<div class="visual" class:placeholder={!image}>
		{#if image}
			<img src={image} alt="" />
		{:else}
			<Icon name="Ambulance" size={48} />
		{/if}
		<div class="shade"></div>
		<div class="badges">
			{#if badge}<span class="dispatch-badge">{badge}</span>{/if}
			<span class={`difficulty ${difficulty}`}>{$_(`catalog.difficulty.${difficulty}`)}</span>
		</div>
	</div>
	<div class="body">
		<div class="heading">
			<h3>{title}</h3>
			<Icon name="ChevronRight" size={21} />
		</div>
		<p>{summary}</p>
		<div class="meta">
			<span
				><Icon name="Clock3" size={15} />{$_('catalog.minutes', {
					values: { count: duration }
				})}</span
			>
			<span><Icon name="Bot" size={15} />{$_('catalog.ai_partner')}</span>
			{#if runs > 0}<span
					><Icon name="History" size={15} />{$_('catalog.runs', { values: { count: runs } })}</span
				>{/if}
		</div>
		{#if tags.length > 0}
			<div class="tags">
				{#each tags.slice(0, 3) as tag}<span>{tag}</span>{/each}
			</div>
		{/if}
		<div class="footer">
			<div class="score">
				{#if stars > 0}<StarBar {stars} />{:else}<span>{$_('common.untouched')}</span>{/if}
			</div>
			<span class="action">{actionLabel ?? $_('catalog.start')}</span>
		</div>
	</div>
{/snippet}

{#if href}
	<a class="card" class:featured {href}>{@render cardContent()}</a>
{:else}
	<button class="card" class:featured type="button" onclick={onactivate}
		>{@render cardContent()}</button
	>
{/if}

<style>
	.card {
		appearance: none;
		display: grid;
		grid-template-columns: 128px minmax(0, 1fr);
		width: 100%;
		padding: 0;
		overflow: hidden;
		text-align: left;
		background: var(--c-panel);
		color: var(--c-text);
		border: 1px solid var(--c-border);
		border-radius: 18px;
		text-decoration: none;
		box-shadow: var(--shadow-card);
		cursor: pointer;
		transition:
			transform 0.18s ease,
			border-color 0.18s ease,
			box-shadow 0.18s ease;
	}
	.card:hover,
	.card:focus-visible {
		transform: translateY(-2px);
		border-color: var(--c-border-strong);
		box-shadow: 0 18px 42px rgba(0, 0, 0, 0.32);
		outline: none;
	}
	.card.featured {
		grid-template-columns: 1fr;
		border-color: rgba(250, 204, 21, 0.38);
	}
	.visual {
		position: relative;
		min-height: 100%;
		background: linear-gradient(145deg, #18334d, #0c1d2e);
		display: grid;
		place-items: center;
		color: var(--c-status);
		overflow: hidden;
	}
	.featured .visual {
		min-height: 190px;
	}
	.visual img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.shade {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(4, 12, 20, 0.05), rgba(4, 12, 20, 0.84));
	}
	.badges {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		right: 0.75rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
	}
	.badges span,
	.tags span {
		display: inline-flex;
		align-items: center;
		padding: 0.24rem 0.55rem;
		border-radius: 999px;
		font-size: 0.7rem;
		font-weight: 800;
	}
	.dispatch-badge {
		background: var(--c-dispatch);
		color: #14202b;
	}
	.difficulty {
		margin-left: auto;
		color: white;
		background: rgba(8, 20, 32, 0.78);
		backdrop-filter: blur(8px);
	}
	.difficulty.beginner {
		color: #86efac;
	}
	.difficulty.intermediate {
		color: #fde68a;
	}
	.difficulty.advanced {
		color: #fca5a5;
	}
	.body {
		min-width: 0;
		display: grid;
		align-content: start;
		gap: 0.55rem;
		padding: 1rem;
	}
	.heading {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}
	h3 {
		margin: 0;
		font-size: 1.05rem;
		line-height: 1.3;
	}
	p {
		margin: 0;
		color: var(--c-text-soft);
		font-size: 0.86rem;
		display: -webkit-box;
		line-clamp: 2;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.meta,
	.tags,
	.footer {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.45rem 0.75rem;
	}
	.meta {
		color: var(--c-text-muted);
		font-size: 0.72rem;
	}
	.meta span {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}
	.tags span {
		padding: 0.2rem 0.5rem;
		background: rgba(74, 222, 128, 0.08);
		border: 1px solid rgba(74, 222, 128, 0.16);
		color: #9ae6b4;
	}
	.footer {
		justify-content: space-between;
		padding-top: 0.2rem;
	}
	.score {
		color: var(--c-text-muted);
		font-size: 0.75rem;
	}
	.action {
		color: var(--c-dispatch);
		font-size: 0.78rem;
		font-weight: 800;
	}
	@media (max-width: 430px) {
		.card:not(.featured) {
			grid-template-columns: 104px minmax(0, 1fr);
		}
		.body {
			padding: 0.85rem;
		}
		.meta span:nth-child(2) {
			display: none;
		}
	}
</style>
