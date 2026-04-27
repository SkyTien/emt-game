<script lang="ts">
	import { _ } from 'svelte-i18n';
	import type { BodyRegion } from '$lib/types/content';

	let {
		onpick,
		highlight
	}: {
		onpick?: (region: BodyRegion) => void;
		highlight?: BodyRegion;
	} = $props();

	function pick(region: BodyRegion) {
		return () => onpick?.(region);
	}
</script>

<svg
	viewBox="0 0 200 320"
	role="img"
	aria-label={$_('scenario.patient_figure')}
	xmlns="http://www.w3.org/2000/svg"
	class="figure"
>
	<g
		id="head"
		class="region"
		class:highlight={highlight === 'head'}
		role="button"
		tabindex="0"
		aria-label={$_('scenario.head')}
		onclick={pick('head')}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && pick('head')()}
	>
		<rect x="65" y="15" width="70" height="60" fill="transparent" />
		<circle cx="100" cy="45" r="22" stroke="var(--c-line)" stroke-width="3" fill="white" />
	</g>

	<g
		id="neck"
		class="region"
		class:highlight={highlight === 'neck'}
		role="button"
		tabindex="0"
		aria-label={$_('scenario.neck')}
		onclick={pick('neck')}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && pick('neck')()}
	>
		<rect x="65" y="65" width="70" height="30" fill="transparent" />
		<line x1="100" y1="67" x2="100" y2="90" stroke="var(--c-line)" stroke-width="3" />
	</g>

	<g
		id="chest"
		class="region"
		class:highlight={highlight === 'chest'}
		role="button"
		tabindex="0"
		aria-label={$_('scenario.chest')}
		onclick={pick('chest')}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && pick('chest')()}
	>
		<rect x="60" y="90" width="80" height="60" fill="transparent" />
		<line x1="100" y1="90" x2="100" y2="170" stroke="var(--c-line)" stroke-width="3" />
		<line x1="100" y1="100" x2="60" y2="125" stroke="var(--c-line)" stroke-width="3" />
		<line x1="100" y1="100" x2="140" y2="125" stroke="var(--c-line)" stroke-width="3" />
	</g>

	<g
		id="wrist"
		class="region"
		class:highlight={highlight === 'wrist'}
		role="button"
		tabindex="0"
		aria-label={$_('scenario.wrist')}
		onclick={pick('wrist')}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && pick('wrist')()}
	>
		<rect x="35" y="115" width="35" height="40" fill="transparent" />
		<rect x="135" y="115" width="35" height="40" fill="transparent" />
		<line x1="60" y1="125" x2="40" y2="155" stroke="var(--c-line)" stroke-width="3" />
		<line x1="140" y1="125" x2="160" y2="155" stroke="var(--c-line)" stroke-width="3" />
	</g>

	<g
		id="abdomen"
		class="region"
		class:highlight={highlight === 'abdomen'}
		role="button"
		tabindex="0"
		aria-label={$_('scenario.abdomen')}
		onclick={pick('abdomen')}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && pick('abdomen')()}
	>
		<rect x="65" y="150" width="70" height="40" fill="transparent" />
	</g>

	<g
		id="leg"
		class="region"
		class:highlight={highlight === 'leg'}
		role="button"
		tabindex="0"
		aria-label={$_('scenario.leg')}
		onclick={pick('leg')}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && pick('leg')()}
	>
		<rect x="55" y="190" width="90" height="120" fill="transparent" />
		<line x1="100" y1="170" x2="75" y2="290" stroke="var(--c-line)" stroke-width="3" />
		<line x1="100" y1="170" x2="125" y2="290" stroke="var(--c-line)" stroke-width="3" />
	</g>
</svg>

<style>
	.figure {
		width: 100%;
		max-width: 240px;
		height: auto;
		display: block;
		margin: 0 auto;
	}
	.region {
		cursor: pointer;
		outline: none;
	}
	.region:hover rect,
	.region:focus-visible rect,
	.region.highlight rect {
		fill: rgba(220, 38, 38, 0.15);
		stroke: var(--c-accent);
		stroke-width: 1;
		stroke-dasharray: 3 2;
	}
</style>
