import type { LocalizedString, Technique, TechniqueStep } from '$lib/types/content';
import { getRegistry } from '$lib/data/content';

export type TechniqueState = {
	technique: Technique;
	stepIndex: number;
	wrongTriesPerStep: number[];
	totalWrong: number;
	finished: boolean;
};

export type TechniqueFeedback = {
	correct: boolean;
	tip?: LocalizedString;
	finished?: boolean;
};

export const TIP_REVEAL_THRESHOLD = 2;

export const TechniqueEngine = {
	init(technique: Technique): TechniqueState {
		return {
			technique,
			stepIndex: 0,
			wrongTriesPerStep: technique.steps.map(() => 0),
			totalWrong: 0,
			finished: false
		};
	},

	currentStep(state: TechniqueState): TechniqueStep | null {
		return state.technique.steps[state.stepIndex] ?? null;
	},

	performAction(
		state: TechniqueState,
		actionIdOrLabel: string
	): {
		state: TechniqueState;
		feedback: TechniqueFeedback;
	} {
		if (state.finished) {
			return { state, feedback: { correct: false } };
		}
		const step = TechniqueEngine.currentStep(state);
		if (!step) return { state, feedback: { correct: false } };

		// Get step ID
		const stepId = step.action_id;

		// Try ID match first, then resolve via registry if provided input is a label
		let isMatch = stepId === actionIdOrLabel;
		if (!isMatch) {
			try {
				const registry = getRegistry();
				const action = registry.byId(actionIdOrLabel);
				isMatch = stepId === action.id;
			} catch {
				// Unknown action; treat as incorrect
			}
		}

		const next: TechniqueState = {
			...state,
			wrongTriesPerStep: [...state.wrongTriesPerStep]
		};

		if (isMatch) {
			next.stepIndex += 1;
			next.finished = next.stepIndex >= state.technique.steps.length;
			return { state: next, feedback: { correct: true, finished: next.finished } };
		}
		next.wrongTriesPerStep[state.stepIndex] += 1;
		next.totalWrong += 1;
		const tip =
			next.wrongTriesPerStep[state.stepIndex] >= TIP_REVEAL_THRESHOLD ? step.tip : undefined;
		return { state: next, feedback: { correct: false, tip } };
	},

	getStars(state: TechniqueState): number | null {
		if (!state.finished) return null;
		const wrong = state.totalWrong;
		if (wrong === 0) return 3;
		if (wrong <= 2) return 2;
		return 1;
	}
};
