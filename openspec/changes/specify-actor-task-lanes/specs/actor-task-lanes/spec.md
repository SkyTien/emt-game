## ADDED Requirements

### Requirement: Scenario state owns one lane per actor

Scenario initialization SHALL create lead and assist lanes. Each lane SHALL be `idle`, `queued`, or `busy` and SHALL contain at most one task.

#### Scenario: Timed scenario begins

- **GIVEN** a scenario is initialized for either player role
- **WHEN** actor lanes are inspected
- **THEN** both lead and assist lanes SHALL exist
- **AND** both lanes SHALL be idle with no task

### Requirement: Lead and assist work concurrently

One eligible task MAY be busy in each actor lane at the same time. Starting work in one lane SHALL NOT alter the other lane.

#### Scenario: Two EMTs begin independent actions

- **GIVEN** lead and assist are idle
- **AND** two eligible required actions are assigned to different actors
- **WHEN** both actions are requested
- **THEN** both lanes SHALL be busy
- **AND** each task SHALL retain its own start and completion timestamps

### Requirement: Task identity is stable and deterministic

Every queued or busy task SHALL have a unique ID derived from deterministic scenario state, phase, actor, and a monotonic sequence. Task identity SHALL NOT depend on localized labels, random values, or callback identity.

#### Scenario: Same transition is replayed

- **GIVEN** identical serialized scenario state, action intent, and `nowMs`
- **WHEN** the transition is evaluated twice
- **THEN** both results SHALL contain the same task ID and lane state

### Requirement: Partner reaction is queued engine state

An automatically selected partner action SHALL enter the partner lane as a queued task with a deterministic `readyAtMs`. The route SHALL NOT own a partner action timer or choose a random delay.

#### Scenario: Partner action becomes eligible

- **GIVEN** the partner lane is idle
- **AND** one partner-required action is prerequisite-satisfied
- **WHEN** partner planning runs with a 2,000 ms reaction policy at 1,000 ms
- **THEN** that action SHALL be queued with `readyAtMs` 3,000 ms
- **AND** the actor SHALL not be busy before the queued task starts

### Requirement: Manual direction reuses or replaces queued work

Directing the same queued partner action SHALL start the existing task immediately. Directing a different eligible action SHALL cancel the queued task with `replaced_by_directive` and create one new task. Manual direction SHALL NOT duplicate an action.

#### Scenario: Player accelerates the queued partner action

- **GIVEN** assist has queued an AED action for later
- **WHEN** the player directs that same AED action now
- **THEN** the existing task SHALL become busy immediately
- **AND** its task ID SHALL remain unchanged
- **AND** only one completion SHALL be possible

#### Scenario: Player redirects an idle-waiting partner

- **GIVEN** assist has queued one action but has not started it
- **WHEN** the player directs a different eligible assist action
- **THEN** the old queue SHALL be interrupted with `replaced_by_directive`
- **AND** exactly one new task SHALL occupy the assist lane

### Requirement: Busy work is never implicitly preempted

Directing or automatically planning an action for a busy actor SHALL NOT replace, shorten, or duplicate the active task.

#### Scenario: Player directs a different action to a busy partner

- **GIVEN** the partner lane contains a busy task
- **WHEN** the player directs another partner action
- **THEN** the engine SHALL return `actor_busy`
- **AND** the active task SHALL remain unchanged

#### Scenario: Player directs the action already in progress

- **GIVEN** the partner is already performing the directed action
- **WHEN** the same directive is sent
- **THEN** the engine SHALL return `action_in_progress`
- **AND** the completion time SHALL not be accelerated

### Requirement: Stale lane work cannot cross a phase boundary

Every task SHALL be bound to its originating phase. Phase timeout, phase advancement, or scenario finalization SHALL clear all queued and busy tasks from the old phase with a system interruption log.

#### Scenario: One task advances the phase while another callback is stale

- **GIVEN** a task belongs to the old phase
- **AND** another completion causes the phase to advance
- **WHEN** a later tick or stale UI callback references the old task
- **THEN** both lanes SHALL contain no old-phase task
- **AND** the stale event SHALL leave state unchanged

### Requirement: Actor lane transitions are pure

Lane planning, request, start, completion, interruption, and tick transitions SHALL not mutate input state and SHALL not read wall-clock time, randomness, DOM, storage, or routing.

#### Scenario: Unit test freezes transition input

- **GIVEN** a deeply frozen scenario state and explicit `nowMs`
- **WHEN** any lane transition is evaluated
- **THEN** the input SHALL remain unchanged
- **AND** repeated evaluation SHALL return structurally equivalent output

### Requirement: Actor lane state is visible and actionable

The scenario HUD SHALL identify lead and assist lane state, current action, and remaining queue or work time. The player SHALL receive a cancel control only for their own busy interruptible task.

#### Scenario: Player and partner are working concurrently

- **GIVEN** lead and assist lanes both contain busy tasks
- **WHEN** the scenario HUD renders
- **THEN** both actor roles, action labels, and remaining seconds SHALL be visible
- **AND** only the player's interruptible task SHALL expose a cancel control
