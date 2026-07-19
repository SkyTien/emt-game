## ADDED Requirements

### Requirement: Catalog presentation is authorable in YAML

Scenario and technique authors SHALL be able to declare optional summary, difficulty, estimated minutes, section, tags, featured state and ordering under a shared `catalog` object without editing TypeScript or Svelte.

#### Scenario: Author adds a standard scenario card

- **GIVEN** a new valid scenario YAML with localized title and optional catalog metadata
- **WHEN** content validation and the static build run
- **THEN** the scenario SHALL appear in the scenario catalog with the authored presentation
- **AND** no route-level ID list SHALL require modification

#### Scenario: Legacy content omits catalog

- **GIVEN** a valid legacy scenario or technique without `catalog`
- **WHEN** the catalog UI renders it
- **THEN** safe summary, difficulty, time and ordering defaults SHALL be derived
- **AND** gameplay semantics SHALL remain unchanged

### Requirement: Catalog metadata is strictly validated

Catalog metadata SHALL use localized maps for player-facing strings, known difficulty values, bounded integer time estimates and typed boolean/number fields.

#### Scenario: Invalid time estimate

- **GIVEN** `catalog.estimated_minutes` is zero, greater than 60 or non-integral
- **WHEN** content validation runs
- **THEN** validation SHALL fail with a field-specific `invalid_estimated_minutes` error

#### Scenario: Invalid localized tag

- **GIVEN** one catalog tag lacks a non-empty `zh-Hant` value
- **WHEN** content validation runs
- **THEN** validation SHALL fail or report the existing locale-map compatibility warning according to the shared localization rules

### Requirement: Quick play is data-driven

Resolved scenarios with `catalog.quick_play: true` SHALL be discoverable through the content layer and grouped by `catalog.variant_group`.

#### Scenario: Non-engineer adds an OHCA variant

- **GIVEN** a hidden child scenario extends the OHCA base and declares the existing variant group with quick_play enabled
- **WHEN** the quick dispatch pool is loaded
- **THEN** the new resolved scenario SHALL be eligible without changing route code

#### Scenario: Quick play lacks a group

- **GIVEN** a scenario declares quick_play true but no non-empty variant_group
- **WHEN** content validation runs
- **THEN** validation SHALL fail before build

### Requirement: Catalog metadata inherits predictably

Scenario inheritance SHALL shallow-merge parent and child catalog objects while child arrays replace parent arrays.

#### Scenario: Variant overrides only quick-play state

- **GIVEN** a base scenario declares summary, difficulty, tags and variant_group
- **AND** a child scenario declares only quick_play true
- **WHEN** the child is resolved
- **THEN** it SHALL retain the base presentation fields and enable quick play
