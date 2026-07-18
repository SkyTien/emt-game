## ADDED Requirements

### Requirement: Scenario structure is validated before build
Content validation SHALL reject invalid schema versions, player or crew roles, patient vital locale maps, body regions, required actor roles, duplicate required action IDs, invalid prerequisites, invalid reveal keys, and inheritance cycles.

#### Scenario: Duplicate required action
- **GIVEN** one phase contains two required entries with the same action ID
- **WHEN** content validation runs
- **THEN** validation SHALL fail with a field-specific duplicate-required error

#### Scenario: Inheritance cycle
- **GIVEN** scenario A extends B and scenario B extends A
- **WHEN** resolved scenarios are validated
- **THEN** validation SHALL fail without recursing indefinitely

### Requirement: Outcome conditions are strict and deterministic
Every outcome condition SHALL parse completely with balanced parentheses and supported metrics/operators. Each scenario SHALL contain exactly one `預設` outcome and it SHALL be last.

#### Scenario: Trailing invalid tokens
- **GIVEN** an outcome condition contains a valid comparison followed by an unsupported token sequence
- **WHEN** content validation runs
- **THEN** validation SHALL fail instead of silently evaluating the valid prefix

#### Scenario: Default outcome shadows later outcomes
- **GIVEN** a `預設` outcome appears before another outcome
- **WHEN** content validation runs
- **THEN** validation SHALL fail and identify that default must be last

### Requirement: Local illustration references exist
Every non-HTTP illustration path SHALL resolve to an existing file under `static`, and rendered routes SHALL apply the SvelteKit base path.

#### Scenario: Missing outcome image
- **GIVEN** outcome YAML references `/illustrations/outcomes/missing.png`
- **WHEN** content validation runs
- **THEN** validation SHALL fail and report the source file and illustration field

### Requirement: Existing content remains build-valid
After validation is strengthened, all checked-in actions, categories, resolved scenarios, and techniques SHALL pass without suppressing errors.

#### Scenario: Repository content validation
- **GIVEN** the repository's committed `data/` and `static/` trees
- **WHEN** `npm run validate:content` runs
- **THEN** the command SHALL exit successfully with every content file checked
