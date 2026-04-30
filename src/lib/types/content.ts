export type LocalizedString = {
	'zh-Hant': string;
	[locale: string]: string;
};

export type BagId = 'hand' | 'o2kit' | 'jumpkit' | 'aed' | 'vehicle';
export const BAG_IDS = ['hand', 'o2kit', 'jumpkit', 'aed', 'vehicle'] as const;

export type BodyRegion =
	| 'head'
	| 'neck'
	| 'chest'
	| 'wrist'
	| 'abdomen'
	| 'leg'
	| 'arm'
	| 'general';

export type Role = 'lead' | 'assist' | 'either';

export type Action = {
	id: string;
	label: LocalizedString;
	bag: BagId;
	default_role?: Role;
	body_region?: BodyRegion;
	icon?: string;
	explain?: LocalizedString;
};

export type ActionCategory = {
	id: string;
	label: LocalizedString;
	icon?: string;
	actions: string[]; // action ids
};

export type ActionPhase = {
	id: string;
	label: LocalizedString;
	icon?: string;
	categories: ActionCategory[];
};

export type Phase = {
	id: string;
	narrative: LocalizedString;
	required: {
		/**
		 * Stable action ID (e.g., "check_pulse_carotid").
		 * Primary reference format.
		 */
		action_id: string;
		by?: 'player' | 'partner' | 'either';
		set_flag?: string;
	}[];
	timeout?: number;
	on_skip?: {
		worsen?: number;
		note: LocalizedString;
		flags?: string[];
	};
	hint?: LocalizedString;
	illustration?: string;
};

export type Outcome = {
	id: string;
	when: string;
	title: LocalizedString;
	text: LocalizedString;
	illustration?: string;
};

export type PatientVitals = {
	consciousness: LocalizedString;
	breath: LocalizedString;
	pulse: LocalizedString;
	skin?: LocalizedString;
	glucose?: LocalizedString;
	spO2?: LocalizedString;
	bp?: LocalizedString;
};

export type CrewMember = {
	role: Role;
	carries: BagId[];
	duty?: LocalizedString;
};

export type Scenario = {
	id: string;
	schema_version: number;
	title: LocalizedString;
	player_role: Role | 'either';
	illustration?: string;
	patient_initial: PatientVitals;
	crew: { lead: CrewMember; assist: CrewMember };
	phases: Phase[];
	outcomes: Outcome[];
	hidden?: boolean;
};

export type TechniqueStep = {
	id: string;
	/**
	 * Stable action ID (e.g., "check_pulse_carotid").
	 * Primary reference format.
	 */
	action_id: string;
	tip?: LocalizedString;
};

export type Technique = {
	id: string;
	schema_version: number;
	title: LocalizedString;
	description: LocalizedString;
	body_region?: BodyRegion;
	illustration?: string;
	steps: TechniqueStep[];
	hidden?: boolean;
};
