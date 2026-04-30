import type {
	BagId,
	LocalizedString,
	Outcome,
	Phase,
	PatientVitals,
	Scenario
} from '$lib/types/content';
import { evaluateCondition } from './condition';
import { getRegistry } from '$lib/data/content';

export type Location = 'on_scene' | 'on_partner' | 'in_vehicle' | 'unknown';

export type ActionLogEntry =
	| {
			kind: 'action';
			tMs: number;
			actionId: string;
			actionLabel: string;
			by: ActorRole;
			correct: boolean;
			note?: LocalizedString;
	  }
	| { kind: 'phase_advance'; tMs: number; toPhaseId: string }
	| { kind: 'on_skip'; tMs: number; phaseId: string; worsen: number; note: LocalizedString }
	| { kind: 'outcome'; tMs: number; outcomeId: string };

export type ActorRole = 'lead' | 'assist';

export type DirectiveEvent = { tMs: number; actionId: string };

export type Feedback = {
	correct: boolean;
	message?: string;
	tip?: LocalizedString;
};

export type ScenarioState = {
	scenario: Scenario;
	playerRole: ActorRole;
	startTimeMs: number;
	phaseIndex: number;
	phaseStartTimeMs: number;
	completedRequiredIds: Set<string>;
	correctActions: number;
	wrongActions: number;
	worsenLevel: number;
	flags: Set<string>;
	patient: PatientVitals;
	bagLocations: Record<BagId, Location>;
	log: ActionLogEntry[];
	consecutiveMistakes: number;
	revealedVitals: string[];
	finalOutcomeId: string | null;
};

export const ScenarioEngine = {
	init(scenario: Scenario, playerRole: ActorRole, nowMs = 0): ScenarioState {
		const bagLocations: Record<BagId, Location> = {
			hand: 'on_scene',
			o2kit: 'unknown',
			jumpkit: 'unknown',
			aed: 'unknown',
			vehicle: 'in_vehicle'
		};
		for (const bag of scenario.crew.lead.carries) {
			bagLocations[bag] = playerRole === 'lead' ? 'on_scene' : 'on_partner';
		}
		for (const bag of scenario.crew.assist.carries) {
			bagLocations[bag] = playerRole === 'assist' ? 'on_scene' : 'on_partner';
		}
		bagLocations.hand = 'on_scene';

		return {
			scenario,
			playerRole,
			startTimeMs: nowMs,
			phaseIndex: 0,
			phaseStartTimeMs: nowMs,
			completedRequiredIds: new Set(),
			correctActions: 0,
			wrongActions: 0,
			worsenLevel: 0,
			flags: new Set(),
			patient: clonePatient(scenario.patient_initial),
			bagLocations,
			log: [],
			consecutiveMistakes: 0,
			revealedVitals: [],
			finalOutcomeId: null
		};
	},

	currentPhase(state: ScenarioState): Phase | null {
		return state.scenario.phases[state.phaseIndex] ?? null;
	},

	performAction(
		state: ScenarioState,
		actionIdOrLabel: string,
		by: ActorRole,
		nowMs = state.phaseStartTimeMs
	): { state: ScenarioState; feedback: Feedback } {
		if (state.finalOutcomeId) {
			return { state, feedback: { correct: false, message: 'scenario_finished' } };
		}
		const phase = ScenarioEngine.currentPhase(state);
		if (!phase) return { state, feedback: { correct: false, message: 'no_phase' } };

		// Verify action exists
		const registry = getRegistry();
		const actionId = actionIdOrLabel;
		try {
			registry.byId(actionId);
		} catch {
			// Unknown action; treat as incorrect and count as wrong
			const next: ScenarioState = {
				...state,
				wrongActions: state.wrongActions + 1,
				consecutiveMistakes: state.consecutiveMistakes + 1,
				completedRequiredIds: new Set(state.completedRequiredIds),
				flags: new Set(state.flags),
				log: [
					...state.log,
					{
						kind: 'action' as const,
						tMs: nowMs,
						actionId: actionIdOrLabel,
						actionLabel: actionIdOrLabel,
						by,
						correct: false
					}
				]
			};
			return { state: next, feedback: { correct: false, message: 'unknown_action' } };
		}

		// Find matching required entry by ID
		const required = phase.required.find((r) => r.action_id === actionId);
		const isCorrect = Boolean(required) && roleMatches(required?.by, by, state.playerRole);

		const next: ScenarioState = {
			...state,
			completedRequiredIds: new Set(state.completedRequiredIds),
			flags: new Set(state.flags),
			log: [...state.log]
		};

		if (isCorrect) {
			next.completedRequiredIds.add(actionId);
			next.correctActions += 1;
			next.consecutiveMistakes = 0;
			if (required?.set_flag) next.flags.add(required.set_flag);

			// Reveal Vitals Logic - use action label for text-based matching
			const action = registry.byId(actionId);
			const label = action.label['zh-Hant'];
			if (label.includes('評估意識') || label.includes('AVPU'))
				next.revealedVitals = [...new Set([...next.revealedVitals, 'consciousness'])];
			if (label.includes('呼吸'))
				next.revealedVitals = [...new Set([...next.revealedVitals, 'breath'])];
			if (label.includes('脈搏'))
				next.revealedVitals = [...new Set([...next.revealedVitals, 'pulse'])];
			if (label.includes('皮膚'))
				next.revealedVitals = [...new Set([...next.revealedVitals, 'skin'])];
			if (label.includes('血糖'))
				next.revealedVitals = [...new Set([...next.revealedVitals, 'glucose'])];
			if (label.includes('血氧'))
				next.revealedVitals = [...new Set([...next.revealedVitals, 'spO2'])];
			if (label.includes('血壓'))
				next.revealedVitals = [...new Set([...next.revealedVitals, 'bp'])];
		} else {
			next.wrongActions += 1;
			next.consecutiveMistakes += 1;
		}
		next.log.push({
			kind: 'action',
			tMs: nowMs,
			actionId: actionId,
			actionLabel: registry.byId(actionId).label['zh-Hant'],
			by,
			correct: isCorrect
		});

		const nextAfterAdvance = maybeAdvancePhase(next, nowMs);
		const finalState = maybeFinalize(nextAfterAdvance, nowMs);

		return {
			state: finalState,
			feedback: { correct: isCorrect, message: isCorrect ? 'ok' : 'wrong_action' }
		};
	},

	tick(state: ScenarioState, nowMs: number): ScenarioState {
		if (state.finalOutcomeId) return state;
		const phase = ScenarioEngine.currentPhase(state);
		if (!phase) return state;
		if (typeof phase.timeout !== 'number') return state;

		const elapsed = (nowMs - state.phaseStartTimeMs) / 1000;
		if (elapsed < phase.timeout) return state;

		const next: ScenarioState = {
			...state,
			completedRequiredIds: new Set(state.completedRequiredIds),
			flags: new Set(state.flags),
			log: [...state.log]
		};

		if (phase.on_skip) {
			const worsen = phase.on_skip.worsen ?? 1;
			next.worsenLevel += worsen;
			if (phase.on_skip.flags) for (const f of phase.on_skip.flags) next.flags.add(f);
			next.log.push({
				kind: 'on_skip',
				tMs: nowMs,
				phaseId: phase.id,
				worsen,
				note: phase.on_skip.note
			});
			degradePatient(next.patient, worsen);
		}

		next.phaseIndex += 1;
		next.phaseStartTimeMs = nowMs;
		const nextPhase = next.scenario.phases[next.phaseIndex];
		if (nextPhase) {
			next.log.push({ kind: 'phase_advance', tMs: nowMs, toPhaseId: nextPhase.id });
		}
		return maybeFinalize(next, nowMs);
	},

	directivePartner(
		state: ScenarioState,
		actionLabel: string,
		nowMs = state.phaseStartTimeMs
	): { state: ScenarioState; feedback: Feedback; event: DirectiveEvent } {
		const result = ScenarioEngine.performAction(state, actionLabel, 'assist', nowMs);
		return { ...result, event: { tMs: nowMs, actionId: actionLabel } };
	},

	getOutcome(state: ScenarioState): Outcome | null {
		if (state.finalOutcomeId) {
			return state.scenario.outcomes.find((o) => o.id === state.finalOutcomeId) ?? null;
		}
		if (state.phaseIndex < state.scenario.phases.length) return null;
		return resolveOutcome(state);
	},

	totalRequired(state: ScenarioState): number {
		return state.scenario.phases.reduce((sum, p) => sum + p.required.length, 0);
	},

	correctRate(state: ScenarioState): number {
		const total = state.correctActions + state.wrongActions;
		return total === 0 ? 1 : state.correctActions / total;
	}
};

function roleMatches(
	required: 'player' | 'partner' | 'either' | undefined,
	actual: ActorRole,
	playerRole: ActorRole
): boolean {
	if (!required || required === 'either') return true;
	const partnerRole: ActorRole = playerRole === 'lead' ? 'assist' : 'lead';
	if (required === 'player') return actual === playerRole;
	if (required === 'partner') return actual === partnerRole;
	return false;
}

function clonePatient(p: PatientVitals): PatientVitals {
	return {
		consciousness: { ...p.consciousness },
		breath: { ...p.breath },
		pulse: { ...p.pulse }
	};
}

function degradePatient(p: PatientVitals, worsen: number): void {
	if (worsen <= 0) return;
	const tag = ` (惡化+${worsen})`;
	p.consciousness['zh-Hant'] = (p.consciousness['zh-Hant'] ?? '') + tag;
}

function isPhaseComplete(phase: Phase, completedIds: Set<string>): boolean {
	return phase.required.every((r) => completedIds.has(r.action_id));
}

function maybeAdvancePhase(state: ScenarioState, nowMs: number): ScenarioState {
	const phase = ScenarioEngine.currentPhase(state);
	if (!phase) return state;
	if (!isPhaseComplete(phase, state.completedRequiredIds)) return state;

	const next: ScenarioState = {
		...state,
		phaseIndex: state.phaseIndex + 1,
		phaseStartTimeMs: nowMs,
		completedRequiredIds: new Set(),
		consecutiveMistakes: 0,
		log: [...state.log]
	};
	const nextPhase = next.scenario.phases[next.phaseIndex];
	if (nextPhase) {
		next.log.push({ kind: 'phase_advance', tMs: nowMs, toPhaseId: nextPhase.id });
	}
	return next;
}

function maybeFinalize(state: ScenarioState, nowMs: number): ScenarioState {
	if (state.finalOutcomeId) return state;
	if (state.phaseIndex < state.scenario.phases.length) return state;
	const outcome = resolveOutcome(state);
	if (!outcome) return state;
	const next: ScenarioState = { ...state, log: [...state.log], finalOutcomeId: outcome.id };
	next.log.push({ kind: 'outcome', tMs: nowMs, outcomeId: outcome.id });
	return next;
}

function resolveOutcome(state: ScenarioState): Outcome | null {
	const ctx = {
		correctRate: ScenarioEngine.correctRate(state),
		worsenLevel: state.worsenLevel,
		flags: state.flags
	};
	for (const outcome of state.scenario.outcomes) {
		if (evaluateCondition(outcome.when, ctx)) return outcome;
	}
	return state.scenario.outcomes[state.scenario.outcomes.length - 1] ?? null;
}
