import type {
	Action,
	BagId,
	LocalizedString,
	Outcome,
	Phase,
	PatientVitals,
	Scenario
} from '$lib/types/content';
import { getRegistry } from '$lib/data/content';
import { evaluateCondition } from './condition';

export type Location = 'on_scene' | 'on_partner' | 'in_vehicle' | 'unknown';
export type ActorRole = 'lead' | 'assist';
export type TaskSource = 'player' | 'partner_auto' | 'partner_directive';
export type ActorLaneStatus = 'idle' | 'queued' | 'busy';
export type TaskInterruptionReason =
	| 'actor_cancelled'
	| 'replaced_by_directive'
	| 'phase_timeout'
	| 'phase_changed'
	| 'scenario_finished';

export type ActorTask = {
	taskId: string;
	phaseId: string;
	actionId: string;
	actor: ActorRole;
	source: TaskSource;
	status: 'queued' | 'busy';
	queuedAtMs: number;
	readyAtMs: number;
	startedAtMs: number | null;
	completesAtMs: number | null;
	durationMs: number;
	interruptible: boolean;
};

export type ActorLane = {
	actor: ActorRole;
	status: ActorLaneStatus;
	task: ActorTask | null;
};

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
	| {
			kind: 'task_queued' | 'task_started';
			tMs: number;
			taskId: string;
			actionId: string;
			by: ActorRole;
	  }
	| {
			kind: 'task_interrupted';
			tMs: number;
			taskId: string;
			actionId: string;
			by: ActorRole;
			reason: TaskInterruptionReason;
	  }
	| { kind: 'phase_advance'; tMs: number; toPhaseId: string }
	| { kind: 'on_skip'; tMs: number; phaseId: string; worsen: number; note: LocalizedString }
	| { kind: 'outcome'; tMs: number; outcomeId: string };

export type DirectiveEvent = { tMs: number; actionId: string };

export type Feedback = {
	correct: boolean;
	message?: string;
	tip?: LocalizedString;
};

export type ScenarioEngineOptions = {
	partnerReactionMs?: number;
};

export type ScenarioState = {
	scenario: Scenario;
	playerRole: ActorRole;
	startTimeMs: number;
	phaseIndex: number;
	phaseStartTimeMs: number;
	phaseStarted: boolean;
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
	actorLanes: Record<ActorRole, ActorLane>;
	nextTaskSequence: number;
	partnerReactionMs: number;
};

type RequiredEntry = Phase['required'][number];
type TransitionResult = { state: ScenarioState; feedback: Feedback };
type DueEvent =
	| { kind: 'complete'; tMs: number; actor: ActorRole; taskId: string }
	| { kind: 'deadline'; tMs: number }
	| { kind: 'start'; tMs: number; actor: ActorRole; taskId: string };

const DEFAULT_PARTNER_REACTION_MS = 2_000;
const ACTOR_ORDER: ActorRole[] = ['lead', 'assist'];

export const ScenarioEngine = {
	init(
		scenario: Scenario,
		playerRole: ActorRole,
		nowMs = 0,
		options: ScenarioEngineOptions = {}
	): ScenarioState {
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
			phaseStarted: false,
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
			finalOutcomeId: null,
			actorLanes: {
				lead: idleLane('lead'),
				assist: idleLane('assist')
			},
			nextTaskSequence: 1,
			partnerReactionMs: options.partnerReactionMs ?? DEFAULT_PARTNER_REACTION_MS
		};
	},

	currentPhase(state: ScenarioState): Phase | null {
		return currentPhase(state);
	},

	startPhase(state: ScenarioState, nowMs: number): ScenarioState {
		if (state.finalOutcomeId || state.phaseStarted || !currentPhase(state)) return state;
		return planPartnerAction(
			{
				...state,
				phaseStarted: true,
				phaseStartTimeMs: nowMs
			},
			nowMs
		);
	},

	requestAction(
		state: ScenarioState,
		actionId: string,
		by: ActorRole,
		nowMs = state.phaseStartTimeMs
	): TransitionResult {
		return requestAction(state, actionId, by, nowMs, 'player');
	},

	performAction(
		state: ScenarioState,
		actionId: string,
		by: ActorRole,
		nowMs = state.phaseStartTimeMs
	): TransitionResult {
		return requestAction(state, actionId, by, nowMs, 'player');
	},

	interruptTask(
		state: ScenarioState,
		actor: ActorRole,
		reason: TaskInterruptionReason,
		nowMs = state.phaseStartTimeMs
	): TransitionResult {
		return interruptTask(state, actor, reason, nowMs);
	},

	planPartnerAction(state: ScenarioState, nowMs = state.phaseStartTimeMs): ScenarioState {
		return planPartnerAction(state, nowMs);
	},

	tick(state: ScenarioState, nowMs: number): ScenarioState {
		return tick(state, nowMs);
	},

	getStars(scenario: Scenario, outcomeId: string): number {
		const index = scenario.outcomes.findIndex((outcome) => outcome.id === outcomeId);
		if (index < 0) return 0;
		if (scenario.outcomes.length === 1 || index === 0) return 3;
		if (index === scenario.outcomes.length - 1) return 1;
		return 2;
	},

	directivePartner(
		state: ScenarioState,
		actionId: string,
		nowMs = state.phaseStartTimeMs
	): TransitionResult & { event: DirectiveEvent } {
		const partner = oppositeRole(state.playerRole);
		const lane = state.actorLanes[partner];
		let result: TransitionResult;

		if (lane.task?.status === 'busy') {
			result = {
				state,
				feedback: {
					correct: false,
					message: lane.task.actionId === actionId ? 'action_in_progress' : 'actor_busy'
				}
			};
		} else if (lane.task?.status === 'queued' && lane.task.actionId === actionId) {
			result = startQueuedTask(state, partner, lane.task.taskId, nowMs, 'partner_directive');
		} else {
			const withoutQueue =
				lane.task?.status === 'queued'
					? interruptTask(state, partner, 'replaced_by_directive', nowMs).state
					: state;
			result = requestAction(withoutQueue, actionId, partner, nowMs, 'partner_directive');
		}

		return { ...result, event: { tMs: nowMs, actionId } };
	},

	getOutcome(state: ScenarioState): Outcome | null {
		if (state.finalOutcomeId) {
			return state.scenario.outcomes.find((outcome) => outcome.id === state.finalOutcomeId) ?? null;
		}
		if (state.phaseIndex < state.scenario.phases.length) return null;
		return resolveOutcome(state);
	},

	totalRequired(state: ScenarioState): number {
		return state.scenario.phases.reduce((sum, phase) => sum + phase.required.length, 0);
	},

	correctRate(state: ScenarioState): number {
		const total = state.correctActions + state.wrongActions;
		return total === 0 ? 1 : state.correctActions / total;
	}
};

function requestAction(
	state: ScenarioState,
	actionId: string,
	by: ActorRole,
	nowMs: number,
	source: TaskSource
): TransitionResult {
	if (state.finalOutcomeId) {
		return { state, feedback: { correct: false, message: 'scenario_finished' } };
	}
	const phase = currentPhase(state);
	if (!phase) return { state, feedback: { correct: false, message: 'no_phase' } };

	const lane = state.actorLanes[by];
	if (lane.task) {
		return {
			state,
			feedback: {
				correct: false,
				message: lane.task.actionId === actionId ? 'action_in_progress' : 'actor_busy'
			}
		};
	}

	const registry = getRegistry();
	let action: Action;
	try {
		action = registry.byId(actionId);
	} catch {
		return recordWrongAction(state, actionId, actionId, by, nowMs, 'unknown_action');
	}

	if (!actorCanAccessBag(state, action.bag, by)) {
		return { state, feedback: { correct: false, message: 'equipment_unavailable' } };
	}

	const required = phase.required.find((entry) => entry.action_id === actionId);
	if (required && state.completedRequiredIds.has(actionId)) {
		return { state, feedback: { correct: false, message: 'already_completed' } };
	}
	if (taskExistsForAction(state, actionId)) {
		return { state, feedback: { correct: false, message: 'action_in_progress' } };
	}

	const prerequisiteMet = !required?.after || state.completedRequiredIds.has(required.after);
	if (required && !prerequisiteMet) {
		return recordWrongAction(state, actionId, action.label['zh-Hant'], by, nowMs, 'wrong_order');
	}
	const isCorrect = Boolean(required) && roleMatches(required?.by, by);
	if (!isCorrect || !required) {
		return recordWrongAction(state, actionId, action.label['zh-Hant'], by, nowMs, 'wrong_action');
	}

	const timing = resolveTiming(action, required);
	if (timing.durationMs === 0) {
		const completed = completeCorrectAction(state, action, required, by, nowMs);
		return {
			state: state.phaseStarted ? planPartnerAction(completed, nowMs) : completed,
			feedback: { correct: true, message: 'ok' }
		};
	}

	return startNewTask(state, actionId, by, source, timing, nowMs);
}

function startNewTask(
	state: ScenarioState,
	actionId: string,
	actor: ActorRole,
	source: TaskSource,
	timing: { durationMs: number; interruptible: boolean },
	nowMs: number
): TransitionResult {
	const phase = currentPhase(state);
	if (!phase) return { state, feedback: { correct: false, message: 'no_phase' } };
	const taskId = `${state.scenario.id}:${phase.id}:${actor}:${state.nextTaskSequence}`;
	const task: ActorTask = {
		taskId,
		phaseId: phase.id,
		actionId,
		actor,
		source,
		status: 'busy',
		queuedAtMs: nowMs,
		readyAtMs: nowMs,
		startedAtMs: nowMs,
		completesAtMs: nowMs + timing.durationMs,
		durationMs: timing.durationMs,
		interruptible: timing.interruptible
	};
	const next = setLane(
		{
			...state,
			nextTaskSequence: state.nextTaskSequence + 1,
			log: [...state.log, { kind: 'task_started', tMs: nowMs, taskId, actionId, by: actor }]
		},
		actor,
		task
	);
	return { state: next, feedback: { correct: true, message: 'task_started' } };
}

function planPartnerAction(state: ScenarioState, nowMs: number): ScenarioState {
	if (state.finalOutcomeId || !state.phaseStarted) return state;
	const phase = currentPhase(state);
	if (!phase) return state;
	const partner = oppositeRole(state.playerRole);
	if (state.actorLanes[partner].status !== 'idle') return state;

	const required = phase.required.find(
		(entry) =>
			entry.by === partner &&
			!state.completedRequiredIds.has(entry.action_id) &&
			(!entry.after || state.completedRequiredIds.has(entry.after)) &&
			!taskExistsForAction(state, entry.action_id)
	);
	if (!required) return state;

	const action = getRegistry().byId(required.action_id);
	const timing = resolveTiming(action, required);
	const taskId = `${state.scenario.id}:${phase.id}:${partner}:${state.nextTaskSequence}`;
	const task: ActorTask = {
		taskId,
		phaseId: phase.id,
		actionId: required.action_id,
		actor: partner,
		source: 'partner_auto',
		status: 'queued',
		queuedAtMs: nowMs,
		readyAtMs: nowMs + state.partnerReactionMs,
		startedAtMs: null,
		completesAtMs: null,
		durationMs: timing.durationMs,
		interruptible: timing.interruptible
	};
	return setLane(
		{
			...state,
			nextTaskSequence: state.nextTaskSequence + 1,
			log: [
				...state.log,
				{
					kind: 'task_queued',
					tMs: nowMs,
					taskId,
					actionId: required.action_id,
					by: partner
				}
			]
		},
		partner,
		task
	);
}

function startQueuedTask(
	state: ScenarioState,
	actor: ActorRole,
	taskId: string,
	nowMs: number,
	source?: TaskSource
): TransitionResult {
	const task = state.actorLanes[actor].task;
	if (!task || task.status !== 'queued' || task.taskId !== taskId) {
		return { state, feedback: { correct: false, message: 'no_active_task' } };
	}
	const phase = currentPhase(state);
	if (!phase || phase.id !== task.phaseId) {
		return { state, feedback: { correct: false, message: 'stale_task' } };
	}

	const started: ActorTask = {
		...task,
		source: source ?? task.source,
		status: 'busy',
		startedAtMs: nowMs,
		completesAtMs: nowMs + task.durationMs
	};
	let next = setLane(
		{
			...state,
			log: [
				...state.log,
				{
					kind: 'task_started',
					tMs: nowMs,
					taskId,
					actionId: task.actionId,
					by: actor
				}
			]
		},
		actor,
		started
	);

	if (task.durationMs === 0) {
		next = completeTask(next, actor, taskId, nowMs);
		return { state: next, feedback: { correct: true, message: 'ok' } };
	}
	return { state: next, feedback: { correct: true, message: 'task_started' } };
}

function interruptTask(
	state: ScenarioState,
	actor: ActorRole,
	reason: TaskInterruptionReason,
	nowMs: number
): TransitionResult {
	const task = state.actorLanes[actor].task;
	if (!task) return { state, feedback: { correct: false, message: 'no_active_task' } };
	if (reason === 'actor_cancelled' && task.status === 'busy' && !task.interruptible) {
		return { state, feedback: { correct: false, message: 'not_interruptible' } };
	}
	const next = clearLaneWithLog(state, actor, reason, nowMs);
	return { state: next, feedback: { correct: true, message: 'task_interrupted' } };
}

function tick(state: ScenarioState, nowMs: number): ScenarioState {
	if (state.finalOutcomeId || !state.phaseStarted) return state;
	const startingPhaseIndex = state.phaseIndex;
	let next = state;

	while (!next.finalOutcomeId && next.phaseStarted && next.phaseIndex === startingPhaseIndex) {
		const event = nextDueEvent(next, nowMs);
		if (!event) break;
		const beforeEvent = next;

		if (event.kind === 'complete') {
			next = completeTask(next, event.actor, event.taskId, event.tMs);
		} else if (event.kind === 'deadline') {
			next = timeoutPhase(next, event.tMs);
		} else {
			next = startQueuedTask(next, event.actor, event.taskId, event.tMs).state;
		}
		if (next === beforeEvent) break;
	}

	return next;
}

function nextDueEvent(state: ScenarioState, nowMs: number): DueEvent | null {
	const phase = currentPhase(state);
	if (!phase) return null;
	const events: DueEvent[] = [];

	for (const actor of ACTOR_ORDER) {
		const task = state.actorLanes[actor].task;
		if (task?.status === 'busy' && task.completesAtMs !== null && task.completesAtMs <= nowMs) {
			events.push({ kind: 'complete', tMs: task.completesAtMs, actor, taskId: task.taskId });
		}
		if (task?.status === 'queued' && task.readyAtMs <= nowMs) {
			events.push({ kind: 'start', tMs: task.readyAtMs, actor, taskId: task.taskId });
		}
	}
	if (typeof phase.timeout === 'number') {
		const deadline = state.phaseStartTimeMs + phase.timeout * 1_000;
		if (deadline <= nowMs) events.push({ kind: 'deadline', tMs: deadline });
	}

	events.sort(compareDueEvents);
	return events[0] ?? null;
}

function compareDueEvents(a: DueEvent, b: DueEvent): number {
	if (a.tMs !== b.tMs) return a.tMs - b.tMs;
	const priority = { complete: 0, deadline: 1, start: 2 } as const;
	if (priority[a.kind] !== priority[b.kind]) return priority[a.kind] - priority[b.kind];
	if ('actor' in a && 'actor' in b) {
		const actorOrder = ACTOR_ORDER.indexOf(a.actor) - ACTOR_ORDER.indexOf(b.actor);
		if (actorOrder !== 0) return actorOrder;
		return a.taskId.localeCompare(b.taskId);
	}
	return 0;
}

function completeTask(
	state: ScenarioState,
	actor: ActorRole,
	taskId: string,
	nowMs: number
): ScenarioState {
	const task = state.actorLanes[actor].task;
	if (
		!task ||
		task.status !== 'busy' ||
		task.taskId !== taskId ||
		task.phaseId !== currentPhase(state)?.id
	) {
		return state;
	}
	const phase = currentPhase(state);
	const required = phase?.required.find((entry) => entry.action_id === task.actionId);
	if (!required || state.completedRequiredIds.has(task.actionId)) return state;

	const action = getRegistry().byId(task.actionId);
	const withoutTask = setLane(state, actor, null);
	const completed = completeCorrectAction(withoutTask, action, required, actor, nowMs);
	return completed.phaseStarted ? planPartnerAction(completed, nowMs) : completed;
}

function completeCorrectAction(
	state: ScenarioState,
	action: Action,
	required: RequiredEntry,
	actor: ActorRole,
	nowMs: number
): ScenarioState {
	const next: ScenarioState = {
		...state,
		completedRequiredIds: new Set(state.completedRequiredIds),
		flags: new Set(state.flags),
		revealedVitals: [...state.revealedVitals],
		log: [...state.log],
		correctActions: state.correctActions + 1,
		consecutiveMistakes: 0
	};
	next.completedRequiredIds.add(action.id);
	if (required.set_flag) next.flags.add(required.set_flag);
	next.revealedVitals = [...new Set([...next.revealedVitals, ...(action.reveals ?? [])])];
	next.log.push({
		kind: 'action',
		tMs: nowMs,
		actionId: action.id,
		actionLabel: action.label['zh-Hant'],
		by: actor,
		correct: true
	});

	return maybeFinalize(maybeAdvancePhase(next, nowMs), nowMs);
}

function timeoutPhase(state: ScenarioState, deadlineMs: number): ScenarioState {
	const phase = currentPhase(state);
	if (!phase) return state;
	let next = cancelAllTasks(state, 'phase_timeout', deadlineMs);
	next = {
		...next,
		completedRequiredIds: new Set(next.completedRequiredIds),
		flags: new Set(next.flags),
		patient: clonePatient(next.patient),
		log: [...next.log]
	};

	if (phase.on_skip) {
		const worsen = phase.on_skip.worsen ?? 1;
		next.worsenLevel += worsen;
		if (phase.on_skip.flags) for (const flag of phase.on_skip.flags) next.flags.add(flag);
		next.log.push({
			kind: 'on_skip',
			tMs: deadlineMs,
			phaseId: phase.id,
			worsen,
			note: phase.on_skip.note
		});
		degradePatient(next.patient, worsen);
	}

	next.phaseIndex += 1;
	next.phaseStartTimeMs = deadlineMs;
	next.phaseStarted = false;
	next.completedRequiredIds = new Set();
	next.consecutiveMistakes = 0;
	const followingPhase = next.scenario.phases[next.phaseIndex];
	if (followingPhase) {
		next.log.push({ kind: 'phase_advance', tMs: deadlineMs, toPhaseId: followingPhase.id });
	}
	return maybeFinalize(next, deadlineMs);
}

function recordWrongAction(
	state: ScenarioState,
	actionId: string,
	actionLabel: string,
	actor: ActorRole,
	nowMs: number,
	message: string
): TransitionResult {
	const next: ScenarioState = {
		...state,
		wrongActions: state.wrongActions + 1,
		consecutiveMistakes: state.consecutiveMistakes + 1,
		completedRequiredIds: new Set(state.completedRequiredIds),
		flags: new Set(state.flags),
		log: [
			...state.log,
			{
				kind: 'action',
				tMs: nowMs,
				actionId,
				actionLabel,
				by: actor,
				correct: false
			}
		]
	};
	return { state: next, feedback: { correct: false, message } };
}

function resolveTiming(
	action: Action,
	required: RequiredEntry
): { durationMs: number; interruptible: boolean } {
	return {
		durationMs: (required.timing?.duration_seconds ?? action.timing?.duration_seconds ?? 0) * 1_000,
		interruptible: required.timing?.interruptible ?? action.timing?.interruptible ?? false
	};
}

function currentPhase(state: ScenarioState): Phase | null {
	return state.scenario.phases[state.phaseIndex] ?? null;
}

function roleMatches(required: 'lead' | 'assist' | undefined, actual: ActorRole): boolean {
	return !required || actual === required;
}

function oppositeRole(role: ActorRole): ActorRole {
	return role === 'lead' ? 'assist' : 'lead';
}

function actorCanAccessBag(state: ScenarioState, bag: BagId, actor: ActorRole): boolean {
	if (bag === 'hand' || bag === 'vehicle') return true;
	const location = state.bagLocations[bag];
	if (actor === state.playerRole) return location === 'on_scene';
	return location === 'on_scene' || location === 'on_partner';
}

function taskExistsForAction(state: ScenarioState, actionId: string): boolean {
	return ACTOR_ORDER.some((actor) => state.actorLanes[actor].task?.actionId === actionId);
}

function idleLane(actor: ActorRole): ActorLane {
	return { actor, status: 'idle', task: null };
}

function setLane(state: ScenarioState, actor: ActorRole, task: ActorTask | null): ScenarioState {
	return {
		...state,
		actorLanes: {
			...state.actorLanes,
			[actor]: task ? { actor, status: task.status, task } : idleLane(actor)
		}
	};
}

function clearLaneWithLog(
	state: ScenarioState,
	actor: ActorRole,
	reason: TaskInterruptionReason,
	nowMs: number
): ScenarioState {
	const task = state.actorLanes[actor].task;
	if (!task) return state;
	return setLane(
		{
			...state,
			log: [
				...state.log,
				{
					kind: 'task_interrupted',
					tMs: nowMs,
					taskId: task.taskId,
					actionId: task.actionId,
					by: actor,
					reason
				}
			]
		},
		actor,
		null
	);
}

function cancelAllTasks(
	state: ScenarioState,
	reason: TaskInterruptionReason,
	nowMs: number
): ScenarioState {
	let next = state;
	for (const actor of ACTOR_ORDER) {
		next = clearLaneWithLog(next, actor, reason, nowMs);
	}
	return next;
}

function clonePatient(patient: PatientVitals): PatientVitals {
	return structuredClone(patient);
}

function degradePatient(patient: PatientVitals, worsen: number): void {
	if (worsen <= 0) return;
	const tag = ` (惡化+${worsen})`;
	patient.consciousness['zh-Hant'] = (patient.consciousness['zh-Hant'] ?? '') + tag;
}

function isPhaseComplete(phase: Phase, completedIds: Set<string>): boolean {
	return phase.required.every((required) => completedIds.has(required.action_id));
}

function maybeAdvancePhase(state: ScenarioState, nowMs: number): ScenarioState {
	const phase = currentPhase(state);
	if (!phase || !isPhaseComplete(phase, state.completedRequiredIds)) return state;

	let next = cancelAllTasks(state, 'phase_changed', nowMs);
	next = {
		...next,
		phaseIndex: next.phaseIndex + 1,
		phaseStartTimeMs: nowMs,
		phaseStarted: false,
		completedRequiredIds: new Set(),
		consecutiveMistakes: 0,
		log: [...next.log]
	};
	const followingPhase = next.scenario.phases[next.phaseIndex];
	if (followingPhase) {
		next.log.push({ kind: 'phase_advance', tMs: nowMs, toPhaseId: followingPhase.id });
	}
	return next;
}

function maybeFinalize(state: ScenarioState, nowMs: number): ScenarioState {
	if (state.finalOutcomeId || state.phaseIndex < state.scenario.phases.length) return state;
	const outcome = resolveOutcome(state);
	if (!outcome) return state;
	const withoutTasks = cancelAllTasks(state, 'scenario_finished', nowMs);
	const next: ScenarioState = {
		...withoutTasks,
		log: [...withoutTasks.log],
		finalOutcomeId: outcome.id
	};
	next.log.push({ kind: 'outcome', tMs: nowMs, outcomeId: outcome.id });
	return next;
}

function resolveOutcome(state: ScenarioState): Outcome | null {
	const context = {
		correctRate: ScenarioEngine.correctRate(state),
		worsenLevel: state.worsenLevel,
		flags: state.flags
	};
	for (const outcome of state.scenario.outcomes) {
		if (evaluateCondition(outcome.when, context)) return outcome;
	}
	return state.scenario.outcomes[state.scenario.outcomes.length - 1] ?? null;
}
