## Context

`ScenarioState` 目前保存 phase、完成 action ID、計分、病人、器材與 log，但沒有進行中的工作。`ScenarioEngine.performAction` 在同一次呼叫中同時驗證、完成及套用效果。AI 副手由 scenario play route 找出第一個可做 action，再以 `setTimeout` 延遲 1–3 秒呼叫 `performAction`；timer 並不是可序列化、可比較或可由引擎取消的狀態。

Phase timer 已有清楚邊界：旁白結束後 route 以 `startPhase(state, nowMs)` 開始，引擎只接受顯式 `nowMs`。新的任務時間沿用相同原則：引擎不讀 `Date.now()`、不建立 timer、不操作 storage 或 router；route 只送入 intent 與目前時間。

## Goals / Non-Goals

**Goals:**

- 讓 lead 與 assist 可同時各執行一項工作，且 busy state 完全存在純 engine state。
- 讓動作從開始到完成具有明確、可測試且由 YAML 驅動的時間。
- 讓 AI 等待、手動指示、中斷、deadline 與同時完成不依賴 callback 競速。
- 讓既有未提供 timing 的情境保持目前的即時完成行為。
- 讓後續 OHCA v2 能先以一個情境驗證工作節奏，再決定是否遷移其他內容。

**Non-Goals:**

- 本 change 不實作 OHCA v2 醫療時間內容。
- 不加入多人連線、即時生理模擬、動畫時間軸、可暫停的 session 或背景儲存。
- 不改變既有醫療正解、phase timeout、outcome、星等或器材權限。
- 不允許 action 自行觸發 wall-clock timer、DOM callback 或隨機數。
- 第一版不支援 actor 同時執行兩項工作，也不支援自動搶占正在執行的工作。

## Decisions

### 1. Timing 使用 action 預設與 required-entry override

內容作者可在全域 action 設定一般 timing，情境 required entry 可針對該次使用做淺層覆寫：

```yaml
# data/actions/actions.yml
- id: chest_compressions
  label: { zh-Hant: 胸外按壓 }
  bag: hand
  timing:
    duration_seconds: 30
    interruptible: true
```

```yaml
# scenario phase
required:
  - action_id: chest_compressions
    by: lead
    timing:
      duration_seconds: 20
```

解析順序為 `{ duration_seconds: 0, interruptible: false }` → action timing → required-entry timing。未標 timing 的既有 action 因此仍在 request 成功時立即完成。陣列不合併，timing 只允許上述兩個欄位。

Validation 規則：

- `timing` 若存在必須是物件。
- `duration_seconds` 必須是 0–600 的有限整數。
- `interruptible` 必須是 boolean。
- required-entry timing 只能覆寫已解析存在的 action。
- effective duration 大於 0 時，effective timing 必須明確得到 `interruptible`；action 或 required-entry 任一層提供即可。
- phase timeout 規則仍獨立存在；第一個 OHCA v2 必須以測試證明其 authored durations 可在預期路徑內完成。

### 2. 每個 actor 擁有一條、至多一項工作的 lane

引擎狀態新增以下概念型別；實作名稱可微調，但語義不得改變：

```ts
type TaskSource = 'player' | 'partner_auto' | 'partner_directive';
type ActorLaneStatus = 'idle' | 'queued' | 'busy';

type ActorTask = {
  taskId: string;
  phaseId: string;
  actionId: string;
  actor: 'lead' | 'assist';
  source: TaskSource;
  status: 'queued' | 'busy';
  queuedAtMs: number;
  readyAtMs: number;
  startedAtMs: number | null;
  completesAtMs: number | null;
  durationMs: number;
  interruptible: boolean;
};

type ActorLane = {
  actor: 'lead' | 'assist';
  status: ActorLaneStatus;
  task: ActorTask | null;
};
```

`ScenarioState.actorLanes` 固定包含 lead 與 assist。`status` 是 `task` 的正規化結果：沒有 task 為 idle，queued task 為 queued，busy task 為 busy。state 另有單調遞增的 `nextTaskSequence`，task ID 由 scenario session、phase、actor 與 sequence 決定，不使用亂數或時間戳碰撞。

### 3. Request、start 與 complete 是三個獨立轉換

`requestAction(state, intent, nowMs)` 先沿用現有規則檢查 scenario、phase、action ID、role、equipment、required entry 與 `after`。失敗仍回傳既有具體 feedback；但 `actor_busy` 與 `action_in_progress` 是操作衝突，不計 wrong action。

正確且 effective duration 為 0 的 intent 在同次轉換完成，以維持相容。duration 大於 0 時只建立 busy task 與 `task_started` log；此時不得：

- 加入 `completedRequiredIds`
- 增加 `correctActions`
- 設定 required flag
- 揭露 patient vital
- 推進 phase 或結算 outcome

上述效果只由 `completeTask` 套用。完成前若 prerequisite、phase 或 task identity 已失效，該 completion 視為 stale event 並保持 state 不變。

### 4. AI reaction 是 queued engine state，不是 UI timer

AI partner 找到可執行 required action 後，建立 queued task。`readyAtMs` 使用 engine option 的固定 `partnerReactionMs`；production 預設 2000 ms，測試可顯式傳入 0。第一版不使用 `Math.random`，讓相同 scenario、state 與 `nowMs` 產生相同結果。

Queued actor 尚未開始醫療動作，因此不是 busy，但該 lane 已保留此 action，不得再排入第二項。到達 `readyAtMs` 後由 engine tick 將 task 轉成 busy 並設定 `startedAtMs`／`completesAtMs`。

### 5. 玩家手動指示只加速 queued task，不複製工作

- Partner lane 已 queued 同一 action：directive 將它立即轉成 busy，沿用相同 task ID。
- Partner lane queued 不同 action：舊 queue 以 `replaced_by_directive` 取消；新 action 通過一般驗證後立即開始。
- Partner lane busy 同一 action：回傳 `action_in_progress`，不得縮短時間或建立第二項。
- Partner lane busy 不同 action：回傳 `actor_busy`，不得自動搶占。
- 玩家自己的 lane busy 時選擇新 action：同樣回傳 `actor_busy`，且不增加錯誤計數。

### 6. 中斷分成 actor request 與 system cancellation

`interruptTask(state, actor, reason, nowMs)` 使用列舉 reason，至少包含：

- `actor_cancelled`
- `replaced_by_directive`
- `phase_timeout`
- `phase_changed`
- `scenario_finished`

Queued task 可被任何明確 reason 取消。Busy task 只有在 effective `interruptible: true` 時接受 `actor_cancelled`；拒絕時回傳 `not_interruptible`。System cancellation 一律可終止 busy task，因為舊 phase 或已結束 scenario 不得留下可完成的工作。

中斷會寫入 `task_interrupted` log，但不增加 correct／wrong、不套用醫療效果。時間已流逝不回復；phase timeout 的 worsen／flags 仍只由既有 `on_skip` 規則決定。

### 7. Tick 依事件時間與固定 tie-breaker 歸約

一次 `tick(state, nowMs)` 可處理目前 phase 內所有已到期 task 事件，但 phase 一旦改變就停止，維持「一次 tick 最多推進一個 phase」的既有保證。

事件先按 event timestamp 排序；時間相同時順序固定為：

1. busy task completion
2. phase deadline
3. queued task start

同類 task 同時發生時以 lead、assist、task ID 排序。這代表 action 在 deadline 當下完成可先被計入；剛好在 deadline 才 ready 的 AI task則不會開始。若背景分頁一次跨過多個時間點，引擎依相同順序追趕，不依 callback 實際抵達順序。

### 8. Phase 與 scenario 邊界清除舊 task

Phase timeout、required actions 完成造成的 phase advance，以及 scenario finalize 都必須取消仍綁定舊 phase 的 queued／busy task。取消是同一個純 transition 的一部分；route 不再持有需要 cleanup 的 partner timer。

Result persistence 維持現有 session schema。任務 start／complete／interrupted log 可加入現有 timeline，但不要求保存可恢復的 mid-session lanes。

## Engine Interface Contract

實作提供以下等價純介面：

```ts
ScenarioEngine.requestAction(state, intent, nowMs): ActionRequestResult;
ScenarioEngine.interruptTask(state, actor, reason, nowMs): TaskTransitionResult;
ScenarioEngine.tick(state, nowMs): ScenarioState;
ScenarioEngine.planPartnerAction(state, nowMs): ScenarioState;
```

所有函數：

- 不 mutate 輸入 state、Set、lane、task 或 log。
- 不讀 wall clock、亂數、DOM、storage 或 router。
- 對相同 serialized state、intent 與 `nowMs` 回傳結構相同的結果。
- 使用 canonical action ID 與 actor role，不使用 localized label。

`performAction` 可在 migration 期間保留為 duration 0 的 wrapper；所有 route 與測試遷移後再決定是否移除。

## Risks / Trade-offs

- [Timing metadata 增加作者負擔] → 既有內容預設 0 秒；只要求 OHCA v2 的 timed action 明確標示。
- [固定 AI reaction 顯得機械] → 先換取可重播與可測試性；未來可由 seeded deterministic policy 取代，不把 `Math.random` 放回 route。
- [背景分頁一次追趕多個事件] → 以 event timestamp 排序，phase change 後停止，避免一 tick 跳過多個 phase。
- [中斷可被用來規避錯誤] → 中斷不回復耗時，且 timeout 後果仍由 phase 規則處理；是否另計操作品質留待 OHCA v2 playtest。
- [兩條 lane 使 log 更複雜] → task ID 與 start／complete／interrupted event 必須成對，可由單元測試驗證。

## Migration Plan

1. 先新增 timing／lane 型別與 validator 測試，確認所有舊 YAML 解析為 instant action。
2. 以純 transition 測試固定 request、busy、complete、interrupt、deadline 與 tie-breaker。
3. 將現有 `performAction` 內的完成效果抽成只由 instant path 或 task completion 呼叫的 helper。
4. 將 partner delay 與 lane state移入 engine，route 只定期傳入 `nowMs` 與使用者 intent。
5. 在 UI 顯示兩位 actor 的 queued／busy action、剩餘時間與可中斷狀態。
6. 編寫 OHCA v2 vertical slice，經 EMT reviewer 確認 timing 不扭曲醫療流程後再考慮其他情境。

## Open Questions

- OHCA v2 各動作的實際 duration 必須由 EMT reviewer 與 playtest 決定；本規格只固定資料形狀與 engine semantics。
- 第一版 completion 是否要顯示獨立動畫不屬引擎契約，由 UI change 決定。
- 若 playtest 證明固定 2000 ms AI reaction 太一致，可新增 seeded policy；不得改回不可重播的 route-level randomness。
