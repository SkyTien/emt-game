## ADDED Requirements

### Requirement: Completed action presentation uses canonical IDs

Every action list completion class and check mark SHALL compare canonical action IDs rather than localized labels.

#### Scenario: Player completes an action in Traditional Chinese

- **GIVEN** completed IDs contains `check_scene_safe`
- **WHEN** ActionList renders the localized action
- **THEN** the matching action SHALL be marked complete regardless of locale text

### Requirement: Active phase time is visible

Once narration finishes and interaction opens, the scenario HUD SHALL display remaining phase time derived from current route time and engine phase timestamps.

#### Scenario: Narration is still playing

- **GIVEN** a phase has not started
- **WHEN** the HUD renders
- **THEN** it SHALL indicate that the dispatch briefing is active rather than decrementing time

#### Scenario: Countdown becomes urgent

- **GIVEN** an active phase has ten seconds or less remaining
- **WHEN** route clock state updates
- **THEN** the timer SHALL use an urgent accessible presentation without changing engine state

### Requirement: Narration can be skipped safely

Players SHALL be able to reveal the full current narrative and open interaction immediately, while the narration completion callback fires at most once.

#### Scenario: Player skips a long briefing

- **GIVEN** typewriter narration is active
- **WHEN** the player activates skip
- **THEN** the full text SHALL appear
- **AND** the phase timer SHALL start exactly once

### Requirement: Feedback explains the rejected action

The UI SHALL map every engine feedback code to a localized, actionable message while preserving correct/incorrect visual status.

#### Scenario: Equipment is unavailable

- **GIVEN** the player selects an action whose bag is not on scene
- **WHEN** the engine returns `equipment_unavailable`
- **THEN** the feedback SHALL explain that the equipment must be brought to the patient
- **AND** it SHALL not present a generic flow error only
