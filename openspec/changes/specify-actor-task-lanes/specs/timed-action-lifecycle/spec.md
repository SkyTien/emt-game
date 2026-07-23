## ADDED Requirements

### Requirement: Timing resolves without breaking existing content

The content layer SHALL resolve required-entry timing over action timing and action timing over an instant backward-compatible default. Existing actions without timing metadata SHALL complete in the same engine transition as a successful request.

#### Scenario: Existing scenario omits timing

- **GIVEN** an existing required action has no action-level or required-entry timing
- **WHEN** the actor requests the eligible action
- **THEN** the action SHALL complete immediately
- **AND** existing completion, scoring, patient, phase, and feedback behavior SHALL be preserved

#### Scenario: Scenario overrides a shared action duration

- **GIVEN** an action declares a 30-second duration
- **AND** the current required entry overrides duration to 20 seconds
- **WHEN** timing is resolved
- **THEN** the effective duration SHALL be 20 seconds
- **AND** all non-overridden timing fields SHALL come from the action

### Requirement: Timing metadata is strictly validated

Timing SHALL contain only a finite integer `duration_seconds` from 0 through 600 and a boolean `interruptible`. A positive effective duration SHALL have an explicitly resolved interruption policy.

#### Scenario: Timed action omits interruption policy

- **GIVEN** an action resolves to a positive duration
- **AND** neither the action nor required entry declares `interruptible`
- **WHEN** content validation runs
- **THEN** validation SHALL fail with the action ID and timing path

### Requirement: Starting a timed action does not complete it

A successful request for a positive-duration action SHALL create one busy task. Completion IDs, correct counters, flags, vital reveals, phase advancement, and outcomes SHALL remain unchanged until that task completes.

#### Scenario: Lead begins chest compressions

- **GIVEN** lead is idle and chest compressions are eligible with a 30-second duration
- **WHEN** lead requests chest compressions at 1,000 ms
- **THEN** the lead lane SHALL contain a busy task completing at 31,000 ms
- **AND** chest compressions SHALL NOT yet be marked complete
- **AND** correct action count SHALL NOT increase

### Requirement: Completion applies medical effects exactly once

When a busy task reaches `completesAtMs`, the engine SHALL apply the existing correct-action effects exactly once using the task's canonical action ID and actor.

#### Scenario: Tick reaches task completion

- **GIVEN** a busy task completes at 31,000 ms
- **WHEN** the engine ticks at 31,000 ms and later ticks again
- **THEN** the action SHALL be completed on the first tick
- **AND** correct count, flags, reveals, logs, and phase progress SHALL change at most once

### Requirement: Busy actors cannot begin another action

An action request targeting a busy actor SHALL return `actor_busy`, preserve both tasks and medical state, and SHALL NOT count as a wrong medical action.

#### Scenario: Assist selects equipment while already treating

- **GIVEN** assist has a busy task
- **WHEN** another otherwise eligible assist action is requested
- **THEN** the request SHALL return `actor_busy`
- **AND** wrong action count SHALL remain unchanged
- **AND** the original task SHALL keep its completion time

### Requirement: Interruption has explicit actor and system semantics

Queued tasks MAY always be cancelled. An actor cancellation SHALL stop a busy task only when its effective timing is interruptible. Phase timeout, phase change, and scenario completion SHALL cancel stale busy tasks regardless of author interruption policy.

#### Scenario: Player cancels an interruptible action

- **GIVEN** the player's busy task is interruptible
- **WHEN** the player cancels it before completion
- **THEN** the lane SHALL become idle
- **AND** a `task_interrupted` log SHALL record `actor_cancelled`
- **AND** no correct or wrong action SHALL be added

#### Scenario: Player tries to cancel committed work

- **GIVEN** the player's busy task is not interruptible
- **WHEN** the player requests cancellation
- **THEN** the engine SHALL return `not_interruptible`
- **AND** the busy task SHALL remain unchanged

#### Scenario: Phase times out during committed work

- **GIVEN** a non-interruptible task belongs to the current phase
- **WHEN** the phase deadline occurs before task completion
- **THEN** the engine SHALL cancel the task with `phase_timeout`
- **AND** only the phase `on_skip` contract SHALL determine worsening and flags

### Requirement: Event ordering is deterministic

Tick SHALL reduce due events by event timestamp. At an identical timestamp, busy completions SHALL precede phase deadline, and phase deadline SHALL precede queued starts. Tasks of the same event kind SHALL be ordered by lead, assist, and task ID.

#### Scenario: Action completes exactly at deadline

- **GIVEN** a required task completion and phase deadline are both 30,000 ms
- **WHEN** the engine ticks at 30,000 ms
- **THEN** the task SHALL complete before timeout evaluation
- **AND** a completed phase SHALL NOT apply `on_skip`

#### Scenario: Partner becomes ready exactly at deadline

- **GIVEN** a queued partner task becomes ready at the phase deadline
- **WHEN** the engine ticks at that timestamp
- **THEN** the phase deadline SHALL be processed first
- **AND** the queued task SHALL be cancelled without starting

### Requirement: Tick catch-up cannot skip multiple phases

A delayed tick MAY reduce multiple due task events in the current phase, but SHALL stop after the first phase change.

#### Scenario: Browser resumes after a long background interval

- **GIVEN** current-phase task events and later phase deadlines are all earlier than `nowMs`
- **WHEN** the engine receives one catch-up tick
- **THEN** it SHALL deterministically settle only the current phase
- **AND** it SHALL NOT skip a second phase
