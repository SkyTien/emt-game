import { ScenarioEngine, type ScenarioState } from './scenario-engine';

/**
 * 回傳當前 phase 可交由 AI 同伴執行的 required action IDs。
 * 實際 queue、reaction time、busy state 與完成時間由 ScenarioEngine 管理。
 *
 * 返回動作 ID 列表（對應已規範化的 action_id）。
 */
const partnerRole = (playerRole: 'lead' | 'assist') => (playerRole === 'lead' ? 'assist' : 'lead');

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
