import { describe, expect, it } from 'vitest';
import { loadActions, loadPhases } from '$lib/data/content';
import { ICON_NAMES } from './icon-names';

const STATIC_ICON_NAMES = [
	'Activity',
	'Ambulance',
	'ArrowLeft',
	'Brain',
	'BriefcaseMedical',
	'Circle',
	'CircleDot',
	'ClipboardCheck',
	'ClipboardList',
	'Footprints',
	'Gauge',
	'Hand',
	'HeartPulse',
	'MessageSquareText',
	'ScanFace',
	'Search',
	'Shield',
	'UserPlus',
	'Wind',
	'X',
	'Zap'
];

const contentIconNames = [
	...loadActions().flatMap((action) => (action.icon ? [action.icon] : [])),
	...loadPhases().flatMap((phase) => [
		...(phase.icon ? [phase.icon] : []),
		...phase.categories.flatMap((category) => (category.icon ? [category.icon] : []))
	])
];

const supportedIconNames = [...new Set([...contentIconNames, ...STATIC_ICON_NAMES])].sort();

describe('Icon', () => {
	it('maps every authored and static icon name', () => {
		const iconNameSet = new Set<string>(ICON_NAMES);
		const missingIconNames = supportedIconNames.filter((name) => !iconNameSet.has(name));

		expect(missingIconNames).toEqual([]);
	});
});
