import { beforeEach, describe, expect, it } from 'vitest';
import { clear, load, saveScenarioRun, saveTechniqueRun, STORAGE_KEY, type Storage } from './store';

class MemoryStorage implements Storage {
	private map = new Map<string, string>();
	getItem(key: string): string | null {
		return this.map.has(key) ? (this.map.get(key) as string) : null;
	}
	setItem(key: string, value: string): void {
		this.map.set(key, value);
	}
	removeItem(key: string): void {
		this.map.delete(key);
	}
}

let storage: MemoryStorage;

beforeEach(() => {
	storage = new MemoryStorage();
});

describe('progress store', () => {
	it('load() returns empty when nothing stored', () => {
		const p = load(storage);
		expect(p.scenarios).toEqual({});
		expect(p.techniques).toEqual({});
	});

	it('saveScenarioRun keeps best stars across runs and counts runs', () => {
		saveScenarioRun('ohca', 'lead', 2, storage);
		saveScenarioRun('ohca', 'lead', 1, storage);
		saveScenarioRun('ohca', 'lead', 3, storage);
		const p = load(storage);
		expect(p.scenarios.ohca.playedAs.lead).toEqual({ bestStars: 3, runs: 3 });
	});

	it('saveTechniqueRun keeps best stars across runs', () => {
		saveTechniqueRun('collar', 1, storage);
		saveTechniqueRun('collar', 3, storage);
		saveTechniqueRun('collar', 2, storage);
		const p = load(storage);
		expect(p.techniques.collar).toEqual({ bestStars: 3, runs: 3 });
	});

	it('clear() removes the key', () => {
		saveTechniqueRun('collar', 3, storage);
		clear(storage);
		expect(storage.getItem(STORAGE_KEY)).toBeNull();
		expect(load(storage).techniques).toEqual({});
	});

	it('migrates legacy { bestStars } scenario shape into playedAs.lead', () => {
		const legacy = JSON.stringify({
			scenarios: { ohca: { bestStars: 2, runs: 5 } },
			techniques: {}
		});
		storage.setItem(STORAGE_KEY, legacy);
		const p = load(storage);
		expect(p.scenarios.ohca.playedAs.lead).toEqual({ bestStars: 2, runs: 5 });
	});
});
