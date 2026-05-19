import { ScenarioEngine, type ScenarioState } from './scenario-engine';

/**
 * 同伴 AI:當 phase 中標示 by:'partner' 的 required 動作未完成,
 * 延遲 minMs~maxMs 後自動執行。純函數,只回傳「該執行什麼動作」,
 * 由 UI/timer 排程實際呼叫。
 *
 * 返回動作 ID 列表（對應已規範化的 action_id）。
 */
const partnerRole = (playerRole: 'lead' | 'assist') => playerRole === 'lead' ? 'assist' : 'lead';

export function findPartnerActions(state: ScenarioState): string[] {
	const phase = ScenarioEngine.currentPhase(state);
	if (!phase) return [];
	const partner = partnerRole(state.playerRole);
	return phase.required
		.filter((r) => r.by === partner)
		.filter((r) => !state.completedRequiredIds.has(r.action_id))
		.filter((r) => !r.after || state.completedRequiredIds.has(r.after))
		.map((r) => r.action_id);
}

/** 找當前 phase 中需由同伴（非玩家）執行但尚未完成、且前置條件已滿足的動作，供副手視角的同伴 AI 自動執行。 */
export function findPlayerActions(state: ScenarioState): string[] {
	const phase = ScenarioEngine.currentPhase(state);
	if (!phase) return [];
	const partner = partnerRole(state.playerRole);
	return phase.required
		.filter((r) => r.by === partner)
		.filter((r) => !state.completedRequiredIds.has(r.action_id))
		.filter((r) => !r.after || state.completedRequiredIds.has(r.after))
		.map((r) => r.action_id);
}

export function pickPartnerDelayMs(
	rand: () => number = Math.random,
	minMs = 1000,
	maxMs = 3000
): number {
	return minMs + rand() * (maxMs - minMs);
}
