# scenario-engine Spec Delta

## ADDED Requirements

### Requirement: 情境初始化

`ScenarioEngine` SHALL 接受已驗證的情境資料與玩家選定角色,初始化為可供 UI 訂閱的純資料狀態;引擎函數不可直接操作 DOM 或瀏覽器 API。

#### Scenario: 玩家選定扮演主手後初始化

- **GIVEN** 一個合法的 OHCA 情境、玩家選擇扮演主手
- **WHEN** 呼叫 `engine.init(scenario, "lead")`
- **THEN** 回傳的 state 中,`playerRole === "lead"`、`currentPhaseIndex === 0`、`completedRequired` 為空集合
- **AND** 病人初始生命徵象來自 scenario.patient
- **AND** 兩位隊員的 `carrying` 按 scenario.crew 設定
- **AND** 袋子位置(`bagsAt`)初始為「病人旁」(若 crew 攜帶中)或「車上」(否則)

### Requirement: 執行玩家動作

`ScenarioEngine` SHALL 在玩家點選動作時,依「袋子是否在場 → 角色合法性 → 是否符合當前 phase required」順序判定,並回傳結果物件供 UI 顯示。

#### Scenario: 正確動作推進 phase

- **GIVEN** 情境處於第 0 個 phase,`required: [評估現場安全, 戴手套]`、`order: 任意`,玩家已做「評估現場安全」
- **WHEN** 玩家執行「戴手套」
- **THEN** 動作被接受,`correctActions++`
- **AND** `completedRequired` 變為 `{ 評估現場安全, 戴手套 }`
- **AND** 因 required 全數完成,`currentPhaseIndex` 推進到 1

#### Scenario: 錯誤動作不扣命但被標記

- **GIVEN** 情境處於第 1 個 phase,required 不含「AED 電擊」
- **WHEN** 玩家執行「AED 電擊」
- **THEN** 動作被拒絕(狀態不變)
- **AND** `wrongActions++`
- **AND** 回傳 feedback「此動作此時不適用(請先確認是否已準備好電擊時機)」
- **AND** 病人狀態不變(錯誤本身不直接惡化,僅累積在錯誤次數)

#### Scenario: 所需袋子不在場時動作被阻擋

- **GIVEN** AED 目前在救護車上(副手尚未帶至病人旁)
- **WHEN** 玩家執行「貼 AED 電極」
- **THEN** 動作被拒絕
- **AND** 回傳 feedback「AED 目前不在病人旁,需先請副手取來」
- **AND** `wrongActions` 不增加(視為操作性錯誤而非判斷錯誤)

### Requirement: 時間觸發惡化

`ScenarioEngine` SHALL 由 UI 定時呼叫 `tick(nowMs)`,檢查當前 phase 是否超過 `timeout` 仍未完成所有 required,超時則套用 `on_skip`(累加 `patientWorsenLevel` 並寫入 log),並推進到下一 phase。

#### Scenario: phase 未在時限內完成

- **GIVEN** 情境某 phase `timeout: 30`、`on_skip: { worsen: 2, note: "每延遲 1 分鐘 CPR 存活率下降 7~10%" }`,玩家進入此 phase 已過 31 秒且未完成 required
- **WHEN** 呼叫 `engine.tick(nowMs)`
- **THEN** `patientWorsenLevel += 2`
- **AND** log 中新增一筆 `on_skip` 事件,含 note 與 phase id
- **AND** 推進至下一 phase

#### Scenario: phase 已完成但未推進被 tick 觸發推進

- **GIVEN** 玩家已完成所有 required 但引擎尚未因 performAction 推進
- **WHEN** 呼叫 `engine.tick`
- **THEN** 引擎推進到下一 phase

### Requirement: 同伴自動行為

`ScenarioEngine` SHALL 為玩家未扮演的隊員(partner)執行「明顯該做」的動作,其他動作需等玩家發出「指示同伴」才執行,以模擬真實搭檔協作但不完全替玩家完成任務。

#### Scenario: 副手自動開始 CPR

- **GIVEN** 玩家扮演主手,情境進入 CPR 啟動 phase,required 包含「胸外按壓」
- **WHEN** 引擎 tick
- **THEN** 副手在幾秒內自動執行「胸外按壓」(因這是明顯該做的事)
- **AND** log 記錄此動作由 partner 執行

#### Scenario: 副手需玩家指示才做非預設動作

- **GIVEN** 玩家扮演主手,required 包含「副手貼 AED 電極」,但副手未主動執行
- **WHEN** 玩家透過「指示同伴」點選「貼 AED 電極」
- **THEN** 副手執行該動作
- **AND** log 記錄 `by: partner, directed_by: player`

### Requirement: 結局判定

`ScenarioEngine` SHALL 在最後一個 phase 完成後,依 `outcomes` 從上到下評估 `when` 條件,採用第一個符合的結局;條件語法支援 `正確率`、`惡化等級`、具名旗標(如 `已電擊`)與 `預設` 兜底。

#### Scenario: 高正確率且已電擊 → ROSC

- **GIVEN** 全場 correctActions=12、wrongActions=1,正確率 92%、已執行 AED 電擊、`patientWorsenLevel === 0`
- **AND** outcomes:`[{when: 正確率>=0.9 且 已電擊, id: rosc}, ...]`
- **WHEN** 呼叫 `engine.getOutcome()`
- **THEN** 回傳 id 為 `rosc` 的結局物件

#### Scenario: 正確率低 → 走兜底結局

- **GIVEN** 全場 correctActions=3、wrongActions=8,正確率 27%
- **AND** outcomes 中僅 `when: 預設` 的 `failed` 結局符合
- **WHEN** 呼叫 `engine.getOutcome()`
- **THEN** 回傳 id 為 `failed` 的結局物件

### Requirement: 劇情時間軸紀錄

`ScenarioEngine` SHALL 以陣列方式記錄玩家與同伴所有動作、phase 推進、`on_skip` 事件、最終結局,供結算頁回顧使用。

#### Scenario: 結算後檢視時間軸

- **GIVEN** 一局遊戲結束
- **WHEN** 讀取 `engine.state.log`
- **THEN** 回傳的陣列元素依時間排序
- **AND** 每筆有 `t`(相對秒數)、`type`(`action` / `phase_advance` / `on_skip` / `outcome`)、`detail`(動作名/phase id/惡化 note/結局 id)
