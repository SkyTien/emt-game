## 1. Baseline and Review Gates

- [x] 1.1 [MVP] Record the current unit, typecheck, build, content-validation, lint, and E2E results so implementation regressions are distinguishable from known failures

  Baseline recorded 2026-07-18 (Node 24.15.0):
  - `npm test`: pass — 7 files, 100 tests
  - `npm run typecheck`: pass — 0 errors, 0 warnings
  - `npm run build`: pass — existing oversized-chunk warning
  - `npm run validate:content`: pass — 9 files (required a less-restricted local run because `tsx` creates an IPC socket)
  - `npm run lint`: fail — Prettier reports 5 files (`validators.ts`, `partner-ai.ts`, `scenario-engine.ts`, scenario play route, scenario list route)
  - `npm run test:e2e`: fail — all 3 tests receive `ERR_CONNECTION_REFUSED` at `127.0.0.1:4173`
- [x] 1.2 [MVP] Add focused failing unit tests for action identity, repeated actions, wrong-order mistakes, vitals preservation, outcome stars, phase timing, and one-time scenario finalization
- [x] 1.3 [MVP] Have the PO/EMT reviewer decide the three known medical-content contradictions before changing required action order or clinical hints
- [x] 1.4 [Phase 2] Record deferred illustration replacement and broader clinical-content review as follow-up work outside this repair

## 2. Engine State and Scoring

- [x] 2.1 [MVP] Make action IDs the canonical completion key across the scenario engine, technique engine, UI checks, logs, and persisted results
- [x] 2.2 [MVP] Return an explicit already-completed result without changing state, logs, score counters, or progress when an action is repeated
- [x] 2.3 [MVP] Count and log wrong-order attempts while leaving required-action progress unchanged
- [x] 2.4 [MVP] Preserve every optional patient-vitals field when cloning or transitioning patient state
- [x] 2.5 [MVP] Replace localized-label matching with typed action reveal metadata and apply only declared vital reveals
- [x] 2.6 [MVP] Derive deterministic one-to-three-star ratings from authored outcome priority and cover single-outcome scenarios

## 3. Scenario Lifecycle

- [x] 3.1 [MVP] Add a pure phase-start transition that records the deadline only after narration ends and player action access opens
- [x] 3.2 [MVP] Wire the scenario route clock to engine ticks while preventing one tick from skipping more than one phase
- [x] 3.3 [MVP] Finalize a scenario exactly once when an outcome is reached, including result, stars, mistakes, and elapsed timeline values
- [x] 3.4 [MVP] Persist the finalized session and scenario progress before navigating to the result route
- [x] 3.5 [MVP] Make scenario result rendering recover safely from absent, malformed, or stale session data
- [x] 3.6 [MVP] Calculate timeline offsets relative to scenario start instead of displaying epoch-based durations

## 4. Roles, Partner, and Equipment

- [x] 4.1 [MVP] Initialize and render bag locations from engine state instead of marking every bag as already beside the patient
- [x] 4.2 [MVP] Enforce role and equipment availability consistently for both player roles and all five action sources
- [x] 4.3 [MVP] Run partner automation symmetrically when the player is lead or assist, using the opposite role's pending actions
- [x] 4.4 [MVP] Cancel stale partner timers when phase, role, or manual instruction changes
- [x] 4.5 [MVP] Add deterministic tests for partner timing, manual overrides, and unavailable equipment

## 5. Technique Interaction

- [x] 5.1 [MVP] Expose configurable hand and assessment actions in the toolbox without revealing unrelated actions
- [x] 5.2 [MVP] Ensure every required cervical-collar action is reachable through its authored bag and body-region metadata
- [x] 5.3 [MVP] Save technique progress and navigate to results exactly once after completion
- [x] 5.4 [MVP] Make technique result rendering recover safely when persisted session data is missing or invalid
- [x] 5.5 [MVP] Keep hints optional and non-blocking while recording mistakes for rating calculation

## 6. Content Contract and Assets

- [x] 6.1 [MVP] Extend action and patient schemas for reveal metadata, roles, body regions, optional vitals, and supported action sources
- [x] 6.2 [MVP] Validate duplicate required actions, valid references, condition syntax, default outcome coverage, and timeout/on-skip rules
- [x] 6.3 [MVP] Validate inheritance resolution and reject missing parents or cycles before scenarios load
- [x] 6.4 [MVP] Validate every referenced local image and static asset during content validation
- [x] 6.5 [MVP] Add simple local SVG placeholders for currently missing required assets without changing gameplay semantics
- [x] 6.6 [MVP] Run strict validation against all current scenarios, techniques, and action definitions

## 7. UI Paths and Static Hosting

- [x] 7.1 [MVP] Replace root-relative navigation and raw asset paths with SvelteKit base-aware paths
- [x] 7.2 [MVP] Confirm scenario, technique, and result routes work under the configured GitHub Pages base path
- [x] 7.3 [MVP] Decide and document the static-host reload strategy for dynamic routes, then add the required fallback if repository deployment needs it
- [x] 7.4 [Phase 2] Split the global Lucide icon import and other oversized chunks after the repaired flow is stable

## 8. Critical E2E Coverage

- [x] 8.1 [MVP] Bind Playwright's preview server explicitly to 127.0.0.1 and verify the configured base URL is reachable
- [x] 8.2 [MVP] Rewrite the cervical-collar E2E test around current accessible labels and complete the full action sequence
- [x] 8.3 [MVP] Add a deterministic scenario E2E that reaches an outcome, persists progress, and renders a result
- [x] 8.4 [MVP] Update settings and navigation smoke tests to current labels and route structure
- [x] 8.5 [MVP] Verify repeated completion and page refresh do not create duplicate saved runs

## 9. Quality Gates and Handoff

- [x] 9.1 [MVP] Fix formatting and bare-CJK lint findings only in files touched by this change
- [x] 9.2 [MVP] Add lint and production build gates to CI alongside unit tests and content validation
- [x] 9.3 [MVP] Run focused tests, then the complete unit, typecheck, lint, content-validation, build, and Playwright suites
- [x] 9.4 [MVP] Run change-impact detection and confirm only expected symbols and execution flows changed
- [x] 9.5 [MVP] Update project documentation with the repaired save/result flow, validation guarantees, and known Phase 2 work
