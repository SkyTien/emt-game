## ADDED Requirements

### Requirement: Home is a single-player dispatch hub

The home route SHALL present one primary featured dispatch, scenario and technique mode entries, and a concise persisted progress summary before secondary settings/about links.

#### Scenario: Returning player opens home

- **GIVEN** local progress contains completed scenario and technique runs
- **WHEN** the player opens home
- **THEN** the hub SHALL show total runs and best-known mastery context
- **AND** the primary dispatch SHALL remain immediately reachable with a single action

#### Scenario: New player opens home

- **GIVEN** no saved progress exists
- **WHEN** the player opens home
- **THEN** the hub SHALL render useful zero-state copy without empty charts or disabled primary navigation

### Requirement: Training cards communicate commitment and progress

Scenario and technique cards SHALL display an illustration when available, localized summary, difficulty, estimated duration, tags and persisted best result.

#### Scenario: Scenario has no catalog metadata

- **GIVEN** a visible scenario omits optional catalog metadata
- **WHEN** the scenario catalog renders
- **THEN** the card SHALL use deterministic fallback content and remain playable

#### Scenario: Technique has authored section

- **GIVEN** a technique declares a localized catalog section
- **WHEN** the technique catalog renders
- **THEN** it SHALL appear under that section without a Svelte code change

### Requirement: Quick dispatch groups variants into one entry

Scenarios sharing a quick-play variant group SHALL render as one catalog dispatch entry and SHALL select one eligible resolved scenario only when the player starts it.

#### Scenario: Player starts randomized OHCA

- **GIVEN** three eligible scenarios share the OHCA variant group
- **WHEN** the player activates the quick dispatch card
- **THEN** exactly one scenario SHALL be selected and navigation SHALL use its role route

### Requirement: Navigation is consistent and responsive

Home, scenario catalog and technique catalog SHALL share a mobile-safe navigation pattern and maintain readable cards at narrow and desktop widths.

#### Scenario: Narrow phone viewport

- **GIVEN** a viewport approximately 360 CSS pixels wide
- **WHEN** any catalog route renders
- **THEN** primary actions SHALL remain at least 44 CSS pixels high
- **AND** no horizontal page scrolling SHALL be required
