## 1. Contract Baseline

- [x] 1.1 [Phase 2] Record the current instant-action and route-owned partner timer behavior
- [x] 1.2 [Phase 2] Define backward-compatible action timing and required-entry override semantics
- [x] 1.3 [Phase 2] Define lead and assist lane states, task identity, and pure engine boundaries
- [x] 1.4 [Phase 2] Define busy rejection, partner queue, manual directive, and duplicate prevention rules
- [x] 1.5 [Phase 2] Define actor/system interruption and stale-task cancellation semantics
- [x] 1.6 [Phase 2] Define deterministic deadline, simultaneous-event, and background catch-up ordering

## 2. Deterministic Crew Engine

- [x] 2.1 [Phase 2] Add failing tests for instant compatibility, timed completion, two-lane concurrency, busy rejection, interruption, and event ordering
- [x] 2.2 [Phase 2] Add timing and lane types plus strict content validation
- [x] 2.3 [Phase 2] Implement pure request, start, completion, interruption, partner planning, and tick transitions
- [x] 2.4 [Phase 2] Preserve current scoring, patient effects, phase advancement, and result persistence at task completion
- [x] 2.5 [Phase 2] Replace route-owned partner timers and randomness with engine-owned queued tasks
- [x] 2.6 [Phase 2] Render actor task status, remaining duration, busy feedback, and allowed cancellation
- [x] 2.7 [Phase 2] Run unit, typecheck, lint, content-validation, build, and current Playwright regression suites

## 3. OHCA v2 Vertical Slice

- [x] 3.1 [Phase 2] Have an EMT reviewer approve timed OHCA actions and interruption expectations before authoring

  Approved by Tien (EMT-1) on 2026-07-24 and recorded in
  `docs/reviews/ohca-v2-timing-review.md`.

- [x] 3.2 [Phase 2] Author one OHCA v2 scenario that exercises concurrent lead and assist lanes
- [x] 3.3 [Phase 2] Add deterministic engine and Playwright coverage for the complete timed flow
- [x] 3.4 [Phase 2] Playtest mobile pacing, partner clarity, deadline fairness, and interruption feedback
- [x] 3.5 [Phase 2] Decide whether to revise the contract before migrating any other scenario

  The current contract is retained. Automated desktop/mobile playtest evidence and the decision
  are recorded in `docs/reviews/ohca-v2-playtest.md`.
