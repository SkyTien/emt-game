import { error } from '@sveltejs/kit';
import { getScenarioById, getRegistry, loadPhases } from '$lib/data/content';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const scenario = getScenarioById(params.id);
	if (!scenario) {
		error(404, `Scenario "${params.id}" not found`);
	}
	const registry = getRegistry();
	const phases = loadPhases();
	return { scenario, registry, phases };
};
