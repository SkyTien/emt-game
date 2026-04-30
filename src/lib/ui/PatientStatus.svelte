<script lang="ts">
	import { _, locale } from 'svelte-i18n';
	import { localize } from '$lib/i18n/localize';
	import type { PatientVitals } from '$lib/types/content';

	let {
		patient,
		flash,
		revealed = []
	}: {
		patient: PatientVitals;
		flash?: boolean;
		revealed?: string[];
	} = $props();

	function getVal(key: keyof PatientVitals) {
		if (revealed.includes(key)) {
			return localize(patient[key], $locale ?? 'zh-Hant');
		}
		return $_('scenario.status_not_assessed');
	}
</script>

<div class="status" class:flash aria-live="polite">
	<div class="cell">
		<span class="label">{$_('scenario.patient_consciousness')}</span>
		<span class="value" class:unrated={!revealed.includes('consciousness')}>
			{getVal('consciousness')}
		</span>
	</div>
	<div class="cell">
		<span class="label">{$_('scenario.patient_breath')}</span>
		<span class="value" class:unrated={!revealed.includes('breath')}>
			{getVal('breath')}
		</span>
	</div>
	<div class="cell">
		<span class="label">{$_('scenario.patient_pulse')}</span>
		<span class="value" class:unrated={!revealed.includes('pulse')}>
			{getVal('pulse')}
		</span>
	</div>
	{#if patient.skin && revealed.includes('skin')}
		<div class="cell bg-reveal">
			<span class="label">{$_('scenario.status_skin')}</span>
			<span class="value">{localize(patient.skin, $locale ?? 'zh-Hant')}</span>
		</div>
	{/if}
	{#if patient.glucose && revealed.includes('glucose')}
		<div class="cell bg-reveal">
			<span class="label">{$_('scenario.status_glucose')}</span>
			<span class="value">{localize(patient.glucose, $locale ?? 'zh-Hant')}</span>
		</div>
	{/if}
	{#if patient.spO2 && revealed.includes('spO2')}
		<div class="cell bg-reveal">
			<span class="label">{$_('scenario.status_spo2')}</span>
			<span class="value">{localize(patient.spO2, $locale ?? 'zh-Hant')}</span>
		</div>
	{/if}
	{#if patient.bp && revealed.includes('bp')}
		<div class="cell bg-reveal">
			<span class="label">{$_('scenario.status_bp')}</span>
			<span class="value">{localize(patient.bp, $locale ?? 'zh-Hant')}</span>
		</div>
	{/if}
</div>

<style>
	.status {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		padding: 1rem;
		background: rgba(0, 0, 0, 0.2);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		font-family: inherit;
	}
	.status:has(.bg-reveal) {
		grid-template-columns: repeat(2, 1fr);
	}

	.status.flash {
		animation: warn-flash 1s ease;
	}
	@keyframes warn-flash {
		0%,
		100% {
			background: rgba(0, 0, 0, 0.2);
		}
		20%,
		60% {
			background: rgba(229, 62, 62, 0.4);
		}
	}
	.cell {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0.5rem;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		text-align: center;
	}
	.bg-reveal {
		background: rgba(251, 211, 141, 0.1);
		border-color: rgba(251, 211, 141, 0.2);
	}
	.label {
		font-size: 0.65rem;
		color: rgba(255, 255, 255, 0.4);
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.value {
		font-weight: 600;
		font-size: 1rem;
		color: #ffffff;
	}
	.value.unrated {
		font-weight: 400;
		color: rgba(255, 255, 255, 0.2);
		font-size: 0.75rem;
		font-style: italic;
	}
	.bg-reveal .value {
		color: #fbd38d;
	}
</style>
