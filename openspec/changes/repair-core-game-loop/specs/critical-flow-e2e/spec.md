## ADDED Requirements

### Requirement: Playwright starts a reachable preview server
The Playwright configuration SHALL bind and connect to the same IPv4 host and port in local and CI execution.

#### Scenario: Clean E2E run
- **GIVEN** no preview server is already running
- **WHEN** `npm run test:e2e` starts
- **THEN** Playwright SHALL build the app, start preview on `127.0.0.1:4173`, and load the home page without connection refusal

### Requirement: Scenario smoke test covers the complete session
At least one deterministic scenario E2E SHALL exercise role selection, player actions, partner actions, finalization, result display, and role-specific localStorage progress.

#### Scenario: Complete deterministic OHCA run
- **GIVEN** a fixed OHCA variant and a selected role
- **WHEN** all required player actions are completed and partner actions run
- **THEN** the browser SHALL reach the matching result route, display the resolved outcome and stars, and persist one scenario run for that role

### Requirement: Technique smoke test covers reachable actions
The cervical collar E2E SHALL complete the authored five-step sequence through controls visible to a real user and SHALL verify result persistence.

#### Scenario: Complete cervical collar
- **GIVEN** the technique play page is loaded
- **WHEN** the five actions are selected in order through hand and jumpkit controls
- **THEN** the browser SHALL reach the result page and localStorage SHALL contain a 3-star technique run

### Requirement: CI runs all quality gates
CI SHALL run typecheck, unit tests, content validation, lint, build, and E2E, and any failing gate SHALL fail the workflow.

#### Scenario: Bare localized UI string is introduced
- **GIVEN** an untranslated CJK UI string is added
- **WHEN** CI runs lint
- **THEN** the workflow SHALL fail before deployment
