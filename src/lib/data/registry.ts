import type { Action, BagId, BodyRegion } from '$lib/types/content';

export class ActionRegistry {
	private byIdMap = new Map<string, Action>();
	private byLabelMap = new Map<string, Action>();

	constructor(actions: Action[] = []) {
		for (const a of actions) this.add(a);
	}

	add(action: Action): void {
		if (this.byIdMap.has(action.id)) {
			throw new Error(`ActionRegistry: duplicate id "${action.id}"`);
		}
		const label = action.label['zh-Hant'];
		if (this.byLabelMap.has(label)) {
			throw new Error(`ActionRegistry: duplicate label "${label}" (id ${action.id})`);
		}
		this.byIdMap.set(action.id, action);
		this.byLabelMap.set(label, action);
	}

	byId(id: string): Action {
		const a = this.byIdMap.get(id);
		if (!a) throw new Error(`ActionRegistry: unknown action id "${id}"`);
		return a;
	}

	tryById(id: string): Action | undefined {
		return this.byIdMap.get(id);
	}

	byBag(bag: BagId): Action[] {
		return [...this.byIdMap.values()].filter((a) => a.bag === bag);
	}

	byBodyRegion(region: BodyRegion): Action[] {
		return [...this.byIdMap.values()].filter((a) => a.body_region === region);
	}

	all(): Action[] {
		return [...this.byIdMap.values()];
	}

	size(): number {
		return this.byIdMap.size;
	}
}
