## ADDED Requirements

### Requirement: Action ID is the canonical completion key
The engine, UI, prerequisite checks, completion styles, and logs SHALL use stable action IDs as the canonical identity. Localized labels SHALL be display-only.

#### Scenario: Completed action is rendered
- **GIVEN** `completedRequiredIds` contains `check_breath`
- **WHEN** ActionList renders the action whose ID is `check_breath`
- **THEN** that action SHALL be marked completed regardless of its localized label

### Requirement: Completed actions cannot change score twice
Performing an action already completed in the current phase SHALL return `already_completed` and SHALL leave counters, flags, completed IDs, phase, and log unchanged.

#### Scenario: Player repeats one correct action
- **GIVEN** a multi-action phase where one required action is already complete
- **WHEN** the player performs the same action again before completing the phase
- **THEN** `correctActions` SHALL NOT increase and no new log entry SHALL be added

### Requirement: Wrong-order attempts are observable mistakes
Performing a required action before its `after` prerequisite SHALL increment wrong and consecutive-mistake counters, append an incorrect action log, and return `wrong_order` without completing the action.

#### Scenario: AED shock before analysis
- **GIVEN** `aed_shock` requires `aed_analyze` and analysis is incomplete
- **WHEN** the actor performs `aed_shock`
- **THEN** the action SHALL remain incomplete, one mistake SHALL be recorded, and the feedback SHALL identify wrong order

### Requirement: Patient state preserves and explicitly reveals vitals
Scenario initialization SHALL deep-copy every authored patient vital. Completing an action SHALL reveal only the vital keys declared by that action's `reveals` metadata.

#### Scenario: Hypoglycemia patient initialization
- **GIVEN** patient YAML includes skin, glucose, spO2, and blood pressure
- **WHEN** the scenario state is initialized
- **THEN** all four optional values SHALL remain present in the state

#### Scenario: Blood glucose assessment
- **GIVEN** `blood_glucose_test` declares `reveals: [glucose]`
- **WHEN** that action is completed correctly
- **THEN** glucose SHALL become visible without inspecting any translated action label

### Requirement: Role and equipment state control action access
The scenario UI SHALL use `ScenarioState.bagLocations`. A player SHALL NOT directly use a bag located on the partner, while the partner SHALL be able to perform required actions using bags they carry.

#### Scenario: Lead does not carry oxygen kit
- **GIVEN** the player is lead and the oxygen kit location is `on_partner`
- **WHEN** the toolbox renders
- **THEN** oxygen-kit actions SHALL NOT be directly selectable by the player

### Requirement: Partner AI behaves symmetrically
For either player role, the opposite actor SHALL automatically perform pending actions explicitly assigned to them after a delay, while manual direction MAY complete the same pending action earlier and SHALL cancel the stale timer.

#### Scenario: Player is lead in OHCA
- **GIVEN** the current phase has a prerequisite-satisfied assist action
- **WHEN** the partner delay elapses
- **THEN** the assist action SHALL be performed as assist and the phase SHALL continue normally

#### Scenario: Player directs before timer fires
- **GIVEN** a partner action has been scheduled
- **WHEN** the player directs that action before the delay elapses
- **THEN** the action SHALL complete once and the scheduled callback SHALL NOT modify a later state
