# OHCA v2 垂直切片 playtest

- 日期：2026-07-24
- 內容：`ohca_adult_timed_v2`
- 臨床審查：Tien（EMT-1）

## 結論

OHCA v2 可維持目前 actor task lane 契約，不需在遷移其他情境前修改 engine
semantics。垂直切片確認：

- 主手與副手可在現場通報、CPR 與氣道、AED 準備、電擊後 CPR 四個階段並行。
- production 的 2 秒 AI reaction 納入後，兩種玩家角色在每個 phase 都至少有
  5 秒 deadline 餘裕。
- 玩家可中止並重做 interruptible 壓胸動作，時間不退還且不增加 medical mistake。
- AED 分析與電擊不顯示玩家中止控制。
- 情境 assigned role 會覆蓋 action 的一般 default role，讓副手玩家能執行本情境
  指派的壓額抬下顎與 OPA。

## Deterministic pacing

以下是玩家在 lane 空閒時立即執行下一個 assigned action、AI 使用固定 2 秒
reaction 的 phase 剩餘時間：

| Phase            | 玩家主手餘裕 | 玩家副手餘裕 |
| ---------------- | -----------: | -----------: |
| arrival          |        17 秒 |        17 秒 |
| assess           |        17 秒 |        11 秒 |
| cpr_airway       |        15 秒 |        13 秒 |
| aed_prep         |        10 秒 |         8 秒 |
| aed_delivery     |         9 秒 |        13 秒 |
| post_shock_cpr   |        10 秒 |         8 秒 |
| reassess_handoff |        12 秒 |         6 秒 |

最小餘裕是副手玩家的再評估與交班 phase，共 6 秒，仍高於核可門檻。

## Browser coverage

- 桌機主手：完整 7 phases、兩條 lane 同時顯示、壓胸取消重做、ROSC 結算、
  localStorage 只保存一次，且無橫向溢位。
- 390 × 844 手機副手：完整 7 phases、跨 default role 的氣道動作、AED
  不可中止狀態、ROSC 結算，且無橫向溢位。
- Playwright 使用虛擬時鐘保留 production duration 與 2 秒 AI reaction，不以
  測試專用短秒數修改內容。

本次環境未提供 in-app Browser 控制介面，因此沒有額外產出人工截圖。
Playwright 的 viewport、可見文字、操作控制與 overflow assertions 已作為可重播的
視覺／互動檢查；後續若要調整字級或美術，仍建議在實機補一次主觀視覺巡檢。

## Contract decision

保留目前 contract：

- required-entry timing override 優先於 action timing。
- lead／assist 各一條 lane。
- production partner reaction 維持 2 秒。
- completion → deadline → queued start 的同時事件順序不變。
- actor cancellation 不計 wrong action；phase timeout 仍由 `on_skip` 決定後果。

本次只補 UI 的 assigned-role 顯示規則，不需修改 engine 或 OpenSpec contract。
