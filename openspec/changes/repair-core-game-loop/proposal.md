## Why

既有 MVP 已具備情境引擎、單項引擎、YAML 內容與結果頁，但核心遊戲迴圈沒有完整接線：情境無法計時或結算、進度不會保存，唯一的上頸圈單項也因動作入口不可達而無法完成。這次變更不是 greenfield 初始化，而是先恢復 MVP 的基本可玩性與可驗證性，避免繼續新增內容時擴大既有斷點。

## What Changes

- 接通情境執行階段的計時、逾時處理、最終 outcome、星等、結果暫存、進度保存與結果頁導向。
- 統一完成動作的識別方式為 action ID，避免 UI 狀態失真與重複動作灌高分。
- 讓單項模式中的每個 required action 都有可到達的操作入口，確保上頸圈可完整進入結果頁。
- 保留病人的所有生命徵象欄位，並以明確資料契約揭露評估結果，不再依賴中文標籤字串判斷。
- 修正角色、同伴 AI 與器材位置的接線，使 UI 使用引擎狀態而不是全器材在場的 mock。
- 更新 Playwright 啟動設定與 smoke tests，覆蓋情境完成、單項完成與進度保存。
- 補強內容驗證，至少阻擋不可達單項步驟、重複 required action、無效 outcome 條件及不存在的本地插畫。
- 本 change 不修改 EMT 醫療正解；已發現的教材矛盾將列為需 PO/教官審稿的後續任務。

## Capabilities

### New Capabilities

- `scenario-session-lifecycle`: 定義情境從初始化、動作、計時、逾時、結算、保存到結果頁的完整生命週期。
- `technique-action-access`: 定義單項步驟的動作可達性、依序完成、提示、星等與結果保存。
- `gameplay-state-consistency`: 定義 action ID、完成狀態、重複操作、生命徵象、角色與器材權限的一致契約。
- `playable-content-validation`: 定義 build 前必須驗證的內容可玩性、條件語法與本地素材完整性。
- `critical-flow-e2e`: 定義本機與 CI 必須通過的核心使用流程 smoke tests。

### Modified Capabilities

目前 `openspec/specs/` 沒有可供增量修改的既有 capability；本 change 以新 capability 記錄現行 MVP 的修復後契約。

## Impact

- 引擎：`src/lib/engine/scenario-engine.ts`、`src/lib/engine/technique-engine.ts`、`src/lib/engine/condition.ts`、`src/lib/engine/partner-ai.ts`
- UI：情境與單項 play/result routes、`ActionList`、`Toolbox`、`PatientStatus`、計時顯示
- 資料：content types、validators、YAML 可玩性與插畫引用
- 儲存：`src/lib/progress/store.ts` 的情境 run 寫入路徑
- 測試與 CI：Vitest、Playwright、內容驗證與 lint/build gate
- 部署：維持 SvelteKit static adapter 與 GitHub Pages；不新增後端或帳號系統
- 工作區安全：不得恢復或覆寫使用者目前已刪除的舊 `add-emt1-game-mvp` change 與 `build_error*.txt`
