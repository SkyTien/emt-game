## 1. Contract and Baseline

- [x] 1.1 [MVP] Record unit, typecheck, lint, content-validation, build and E2E baseline before implementation

  Baseline recorded 2026-07-19 (Node 24.15.0):
  - `npm test`: pass — 8 files, 117 tests
  - `npm run typecheck`: pass — 0 errors, 0 warnings
  - `npm run build`: pass
  - `npm run lint`: ESLint and Prettier pass; `lint:i18n` cannot create the sandboxed `tsx` IPC socket
  - `npm run validate:content`: cannot create the sandboxed `tsx` IPC socket
  - Playwright baseline remains the repaired critical-flow suite from the immediately preceding change and will be rerun at verification
- [x] 1.2 [MVP] Add failing tests for catalog validation, inheritance merge, quick-play discovery and ID-based completion rendering
- [x] 1.3 [MVP] Confirm this change does not alter reviewed medical action order or outcome conditions

## 2. Authorable Catalog

- [x] 2.1 [MVP] Add shared optional `CatalogMetadata` types to Scenario and Technique
- [x] 2.2 [MVP] Validate localized summary/section/tags, difficulty, estimated minutes, ordering and quick-play grouping
- [x] 2.3 [MVP] Merge inherited scenario catalog metadata without merging array values implicitly
- [x] 2.4 [MVP] Expose resolved quick-play candidates from the content layer without route-level scenario IDs
- [x] 2.5 [MVP] Add catalog metadata to all official visible scenarios, OHCA variants and techniques

## 3. Dispatch Hub UI

- [x] 3.1 [MVP] Add reusable training navigation, catalog card and progress-summary components
- [x] 3.2 [MVP] Replace the two-button home page with a featured dispatch, mode cards and progress summary
- [x] 3.3 [MVP] Replace the scenario row list with quick-play and authorable scenario cards
- [x] 3.4 [MVP] Replace the technique row list with section-aware skill cards and mastery context
- [x] 3.5 [MVP] Apply the dispatch-console visual tokens responsively without adding remote assets or a CSS framework

## 4. Gameplay Clarity

- [x] 4.1 [MVP] Use action IDs for every completed state marker in ActionList
- [x] 4.2 [MVP] Render a visible countdown from route clock state without moving time access into the engine
- [x] 4.3 [MVP] Make typewriter narration skippable while firing completion once
- [x] 4.4 [MVP] Map every ScenarioEngine feedback code to specific localized player guidance
- [x] 4.5 [MVP] Keep existing storage, outcome and partner behavior unchanged in this increment

## 5. Authoring Documentation

- [x] 5.1 [MVP] Document the copyable `catalog` YAML block, defaults and validation errors in PARAMETERS and content authoring docs
- [x] 5.2 [MVP] Explain how to add a normal scenario, a quick-play variant group and a technique without editing TypeScript
- [x] 5.3 [MVP] Update changelog and record Phase 2 actor task lanes / AI direction as a separate engine increment

## 6. Verification

- [x] 6.1 [MVP] Run focused content, validator and UI tests
- [x] 6.2 [MVP] Run complete unit, typecheck, lint, content-validation and build gates
- [x] 6.3 [MVP] Run Playwright critical flows and confirm existing scenarios and cervical-collar completion still work
- [x] 6.4 [MVP] Verify home, scenario and technique pages at narrow mobile and desktop widths

  Final verification recorded 2026-07-19:
  - `npm test`: pass — 10 files, 125 tests
  - `npm run typecheck`: pass — 0 errors, 0 warnings
  - `npm run lint`: pass, including formatting and i18n checks
  - `npm run validate:content`: pass — 9 content files
  - `npm run build`: pass
  - `npm run test:e2e`: pass — 10 critical flows
  - Visual checks: home, scenario catalog, technique catalog, role briefing and gameplay HUD at mobile and desktop widths

## 7. Future Single-Player Crew Engine

- [x] 7.1 [Phase 2] Specify action duration, interruption and actor busy-state contracts in a separate OpenSpec change

  Contract recorded in `openspec/changes/specify-actor-task-lanes/`.
- [x] 7.2 [Phase 2] Implement player and AI partner task lanes as pure deterministic engine state

  Implemented and verified in `openspec/changes/specify-actor-task-lanes/`.
- [ ] 7.3 [Phase 2] Author and playtest an OHCA v2 vertical slice before migrating other scenarios
