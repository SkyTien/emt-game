## ADDED Requirements

### Requirement: Scenario timer starts when interaction is available
The scenario UI SHALL start each phase timeout only after the phase narrative has completed or the player has skipped the typewriter animation and obtained access to actions.

#### Scenario: Narrative does not consume action time
- **GIVEN** a phase has a 30-second timeout and its narrative is still playing
- **WHEN** wall-clock time advances
- **THEN** the phase SHALL remain active and no `on_skip` effect SHALL be applied

#### Scenario: Timeout advances one phase
- **GIVEN** the player has obtained action access and the current phase timeout has elapsed
- **WHEN** the UI calls `ScenarioEngine.tick` with the current timestamp
- **THEN** exactly one phase SHALL be skipped, its `on_skip` effects SHALL be logged and applied, and the next phase timer SHALL wait for its narrative

### Requirement: Scenario completion finalizes exactly once
When the scenario engine produces a `finalOutcomeId`, the UI SHALL finalize the run exactly once by deriving stars, saving role-specific progress, writing a versioned session result, and navigating to the matching result route.

#### Scenario: Last required action completes the run
- **GIVEN** a scenario is on its final phase with one unfinished required action
- **WHEN** the correct actor performs that action
- **THEN** the run SHALL receive an outcome and stars, localStorage SHALL record one run for the selected role, sessionStorage SHALL contain the result payload, and the browser SHALL navigate to the result page

#### Scenario: Reactive effects run more than once
- **GIVEN** a finalized scenario state has already been saved
- **WHEN** the Svelte effect re-runs without a new game session
- **THEN** progress runs SHALL NOT increment again and navigation SHALL NOT be scheduled again

### Requirement: Scenario stars follow outcome priority
The scenario engine SHALL derive 3 stars for the first outcome, 1 star for the final default outcome, and 2 stars for an intermediate outcome; a scenario with only one outcome SHALL yield 3 stars.

#### Scenario: Best outcome awards three stars
- **GIVEN** a completed scenario resolves to the first authored outcome
- **WHEN** stars are calculated
- **THEN** the result SHALL be 3

#### Scenario: Default outcome awards one star
- **GIVEN** a completed scenario resolves to the final default outcome and more than one outcome exists
- **WHEN** stars are calculated
- **THEN** the result SHALL be 1

### Requirement: Result timeline uses elapsed time
The scenario result page SHALL display log time relative to the run start, not Unix epoch time, and SHALL provide a recoverable empty-result state when session data is absent or malformed.

#### Scenario: Result page opened after a run
- **GIVEN** a result payload contains `startTimeMs` and timestamped log entries
- **WHEN** the timeline is opened
- **THEN** each timestamp SHALL equal `max(0, entry.tMs - startTimeMs)` formatted as elapsed seconds

#### Scenario: Result payload is invalid
- **GIVEN** sessionStorage contains malformed or incompatible result data
- **WHEN** the result page mounts
- **THEN** the page SHALL show a localized unavailable-result message and a link back to the scenario list instead of loading forever or throwing
