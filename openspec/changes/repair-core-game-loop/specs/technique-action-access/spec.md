## ADDED Requirements

### Requirement: Every technique step is reachable from the play UI
For every action referenced by a technique step, the technique play UI SHALL expose an enabled action control through body-region selection or a bag tab. Hand actions, including `general` actions, SHALL remain reachable.

#### Scenario: General hand action is the current step
- **GIVEN** the current technique step references `wear_ppe` in the hand bag with body region `general`
- **WHEN** the player opens the technique controls
- **THEN** an action button for `wear_ppe` SHALL be available without requiring an unsupported body region

#### Scenario: Equipment action is the current step
- **GIVEN** the current step references a jumpkit action
- **WHEN** the player selects the jumpkit tab
- **THEN** the matching action SHALL be available and SHALL advance the step when selected

### Requirement: Technique completion saves and navigates once
When the final technique step succeeds, the UI SHALL calculate stars, save exactly one technique run, write a versioned session result, and navigate to the technique result page.

#### Scenario: Perfect cervical collar run
- **GIVEN** a new cervical collar session
- **WHEN** all five authored actions are performed in order without mistakes
- **THEN** the result SHALL be 3 stars, localStorage SHALL record one run, and the result page SHALL display zero errors

### Requirement: Technique hints follow the current step
Wrong attempts SHALL only affect the current step, and the current step tip SHALL be revealed on and after the configured threshold without leaking the next step.

#### Scenario: Two wrong attempts
- **GIVEN** the current technique step has a tip and zero wrong attempts
- **WHEN** the player performs two non-matching actions
- **THEN** total wrong attempts SHALL increase by two and only the current step tip SHALL be displayed
