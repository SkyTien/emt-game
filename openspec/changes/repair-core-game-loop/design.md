## Context

專案已完成 SvelteKit 靜態網站骨架、兩個純 TypeScript 引擎、YAML 內容、localStorage 進度與結果頁，但目前各層契約不一致：

- 情境 play route 只呼叫 `performAction`，沒有呼叫 `tick`、保存 run、寫入結果或導向 result。
- `saveScenarioRun` 與情境 result 頁存在，但沒有 production caller；情境也沒有星等計算契約。
- 單項 UI 排除 hand bag，而上頸圈前 3 步中有 3 個 hand action，且 general action 無人體圖入口。
- 引擎以 action ID 保存完成狀態，UI 卻以中文 label 判斷完成。
- 病人 clone 丟失 optional vitals，揭露邏輯依賴中文 label 關鍵字。
- UI 將所有器材 mock 為在場，同伴 AI 只在玩家選副手時啟動。
- 單元測試 100 項通過、typecheck 與 build 通過，但 3 個 E2E 全部失敗；lint 亦失敗。
- 21 個 YAML 圖片引用中有 15 個指向不存在的本地檔案。

實作必須維持 UI／引擎／內容三層分離。引擎仍為同步純函數，不直接讀取時間、DOM、storage 或 router；Svelte route 負責時鐘、保存與導頁。

## Goals / Non-Goals

**Goals:**

- 讓所有現有情境都能從開始完整走到結果頁，並正確保存角色別進度。
- 讓上頸圈單項的每個步驟都有可到達的 UI 入口並能保存結果。
- 讓 timeout、on_skip、outcome、星等、完成標記與時間軸具備一致且可測試的行為。
- 讓玩家角色、同伴行為與器材位置真正由引擎狀態控制。
- 在 build/CI 前阻擋會造成 runtime 斷關的內容錯誤。
- 以 Vitest 覆蓋純引擎契約，以 Playwright 覆蓋跨層核心流程。

**Non-Goals:**

- 不新增關卡、後端、帳號、排行榜、多語系、音效或跨裝置同步。
- 不在未經 PO／EMT 教官確認前改寫醫療處置正解、提示或結局文字。
- 不在本 change 完成 PWA/offline、全面視覺重做或完整無障礙改造。
- 不恢復使用者目前刪除中的舊 `add-emt1-game-mvp` change 或 `build_error*.txt`。

## Decisions

### 1. 引擎維持純函數，route 負責 session orchestration

`ScenarioEngine.performAction(state, actionId, role, nowMs)` 與 `tick(state, nowMs)` 僅回傳新 state；不得自行保存或導頁。情境 route 監看 `finalOutcomeId`，只執行一次 finalize：計算星等、呼叫 `saveScenarioRun`、寫入 versioned session result，再透過 `goto` 導向 result。

替代方案是讓引擎直接操作 storage/router，但會破壞可測試性與三層分離，因此不採用。

### 2. Phase timeout 從玩家取得操作權時開始

旁白播放期間玩家不能操作，因此 phase timeout 在 Typewriter 完成或被跳過、操作面板解鎖時才開始。route 將明確呼叫純函數 `startPhase(state, nowMs)`（名稱可依實作調整）重設該 phase 的計時起點；之後以固定 interval 更新畫面時間並呼叫 `tick`。

每次 `tick` 最多推進一個 phase，避免背景分頁恢復時一次跳過整局。進入下一 phase 後，必須再次等待旁白解鎖才啟動新 timer。

### 3. Action ID 是跨層唯一識別；重複完成不計分

完成狀態、UI 標記、disabled 狀態、前置條件與 log 一律使用 action ID。若 action 已在當前 phase 完成，引擎回傳 `already_completed` 且 state 完全不變，不增加正確數、錯誤數或 log。

同一 phase 不允許兩個 required entry 使用同一 action ID；內容驗證需阻擋此情況。順序錯誤則視為實際錯誤，增加 wrong/consecutive mistakes 並寫入 log，讓提示與時間軸一致。

### 4. 情境星等依 outcome 優先序產生

作者已使用 outcomes 順序表達「最佳到兜底」。完成時：第一個 outcome 為 3 星、最後一個 default outcome 為 1 星、中間 outcome 為 2 星；只有一個 outcome 時為 3 星。此規則避免在 UI 重複另一套醫療評分門檻，且所有現有情境可直接套用。

Phase 2 可再把 stars 明確寫進 outcome YAML；MVP 先維持向後相容。

### 5. 生命徵象以資料欄位揭露，不分析翻譯文字

`Action` 增加 optional `reveals`，值只能是 PatientVitals keys。評估動作完成後，引擎依該欄位揭露狀態。病人初始化需完整深拷貝所有存在的 vitals，不能只保留 consciousness/breath/pulse。

替代方案是維護 action ID hard-coded map；雖比中文 label 穩定，但仍使內容與程式耦合，因此採 YAML metadata。

### 6. 同伴 AI 對兩種玩家角色採一致規則

所有明確標記為另一角色的 required action，若前置條件成立，均由同伴 AI 延遲執行；玩家可透過「指示同伴」立即觸發同一 pending action。任一途徑完成後，既有 timer 必須清除，避免 stale action 落到下一 phase。

玩家 toolbox 使用 `gameState.bagLocations`。在同伴身上的器材不可由玩家直接操作，但同伴執行自己的 required action 時可以使用其器材。未標示 `by` 的 action 視為任一角色可做，但 AI 不主動搶做。

### 7. 單項沿用共用 action UI，但允許 hand bag

`Toolbox` 增加可配置的 hand bag 顯示能力；情境模式維持 hand action 由 assessment/scene 呈現，單項模式則啟用 hand tab。如此不需為單項建立第二套 action registry，也能讓 general hand actions 可達。

### 8. 內容驗證分成純 schema 與檔案系統檢查

共用 validators 驗證 schema、role、body region、reveals keys、required 重複、after cycle、outcome 條件語法與 default outcome 位置。Node `validate-content` script 額外驗證 inheritance cycle、所有 resolved scenario，以及 `/illustrations/...` 本地檔案存在。

既有規則仍保留：timeout 至少 5 秒、on_skip 必填 localized note、action 引用存在、outcomes 至少一個且有唯一 default。

### 9. E2E 使用固定 IPv4 host 與穩定內容 ID

Playwright webServer 明確執行 `npm run preview -- --host 127.0.0.1`。測試不得依賴已移除的列表文字或隨機 OHCA variant；使用固定 route/content ID，並驗證 URL、結果、localStorage，而非內部 CSS class。

### 10. 插畫策略

本 change 先確保所有引用可載入並經 base path 解析。缺少正式插畫時，可使用同尺寸的簡單 SVG placeholder，並由 `IllustrationSlot` 統一顯示；不得留下 404。正式 AI／免費圖庫素材與視覺統一屬 Phase 2，需補授權與來源。

## Risks / Trade-offs

- [Outcome 順序被誤用會影響星等] → validator 要求唯一 default 在最後，文件明確說明由佳到差排序。
- [同伴 AI 與手動指示競速] → 所有 timer 以 phase/action ID 驗證當前 state，effect cleanup 必須取消舊 timer。
- [計時 UI effect 造成重複 finalize] → 使用 session-local finalized guard，finalize helper 採 idempotent 設計。
- [新增 reveals metadata 漏標] → 為目前所有生命徵象評估 action 補 metadata，加入內容測試。
- [加嚴 validator 會使現有內容先失敗] → 同一 change 內修正非醫療性的 schema/素材問題，再啟用 CI gate。
- [E2E 遊戲流程較慢或 flaky] → 測試環境提供固定 partner delay/typing speed seam，不在 production 寫死測試判斷。
- [GitHub Pages 深層路由仍有限制] → 本 change 先修正 base path 與核心導航；完整 404 SPA fallback/prerender 策略列為部署後續，除非阻擋 smoke test。

## Migration Plan

1. 先新增 failing unit tests，固定重複 action、完整 vitals、timeout、星等與條件語法。
2. 修正純引擎與內容型別，再更新 UI action ID 契約。
3. 接通情境 finalize、storage 與 result，接著修復單項可達性。
4. 加嚴內容驗證並處理所有現有 validation failure。
5. 更新 E2E/CI，依序執行 unit、typecheck、content validation、lint、build、E2E。
6. 若發生回歸，可逐層回退 route orchestration；localStorage shape 不需破壞性 migration。

## Open Questions

- 醫療內容審查決定（2026-07-18，並以消防署教材核對）：動作需區分必要、條件式必要與加分。一般持續出血先直接加壓；危及生命的大量肢體出血、截肢或加壓無效時，止血帶為條件式必要。抽吸僅在血液、嘔吐物或分泌物可能阻塞呼吸道時為條件式必要。口服葡萄糖前必須確認病人清醒、能配合且可安全吞嚥；不符合時不得以口服處置作為必要通關動作。
- GitHub Pages 是否要求可直接重新整理任一動態 route，需在核心流程穩定後決定 prerender entries 或 `404.html` fallback。
