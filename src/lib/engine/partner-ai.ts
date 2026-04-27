import { ScenarioEngine, type ScenarioState } from './scenario-engine';

/**
 * 同伴 AI:當 phase 中標示 by:'partner' 的 required 動作未完成,
 * 延遲 minMs~maxMs 後自動執行。純函數,只回傳「該執行什麼動作」,
 * 由 UI/timer 排程實際呼叫。
 */
export function findPartnerActions(state: ScenarioState): string[] {
	const phase = ScenarioEngine.currentPhase(state);
	if (!phase) return [];
	return phase.required
		.filter((r) => r.by === 'partner')
		.map((r) => r.action)
		.filter((label) => !state.completedRequiredIds.has(label));
}

export function pickPartnerDelayMs(
	rand: () => number = Math.random,
	minMs = 1000,
	maxMs = 3000
): number {
	return minMs + rand() * (maxMs - minMs);
}
