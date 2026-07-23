## Why

現行情境引擎只區分「尚未完成／已完成」，正確動作會在點擊當下立即生效；AI 副手的延遲則由 Svelte route 以 `setTimeout` 與隨機值控制。這使引擎無法回答「誰正在做什麼、何時完成、能否中斷」，也讓背景分頁、手動指示與 phase timeout 的競合行為依賴 UI callback 時序。

在實作玩家與 AI 副手並行任務前，必須先固定可純函數測試的時間、busy state 與中斷契約。本 change 先建立該規格基線，經確認後實作通用任務軌；正式醫療秒數與 OHCA v2 仍留待 EMT reviewer 與下一個內容增量。

## What Changes

- 定義 lead／assist 各自唯一的 actor task lane，以及 `idle`、`queued`、`busy` 三種狀態。
- 定義 action-level timing 與 phase required-entry override，既有未標 timing 的內容維持即時完成。
- 將正確動作拆成 request、start、complete 三個純狀態轉換；醫療效果、計分與完成標記只在 complete 時套用。
- 定義 AI 副手排程、玩家手動指示、actor busy rejection 與同一 action 去重行為。
- 定義玩家取消、系統取消、phase timeout、phase change 與 scenario finalize 的中斷規則。
- 定義同時到期與背景分頁追趕時的固定事件排序，確保相同輸入永遠得到相同 state。
- 實作 timing schema、validator、純任務軌、engine-owned AI queue、busy／中斷 feedback 與 HUD 狀態。
- 保留 OHCA v2 垂直切片為下一階段，不擅自替醫療動作指定正式秒數。

## Capabilities

### New Capabilities

- `timed-action-lifecycle`: 定義 timing 內容格式、動作開始／完成、中斷、deadline 與向後相容行為。
- `actor-task-lanes`: 定義兩條角色任務軌、busy state、AI 排程、手動指示與並行／競合規則。

## Impact

- 引擎：`src/lib/engine/scenario-engine.ts`、`src/lib/engine/partner-ai.ts` 與單元測試。
- 內容契約：`src/lib/types/content.ts`、`src/lib/data/validators.ts` 與作者文件；既有 YAML 不需遷移。
- UI：scenario play route 只提供時鐘與 intent，busy／進度／取消狀態由 engine state 呈現。
- 不改變：目前已審閱的 required action 順序、outcome 條件、星等、localStorage 結果格式與靜態部署策略。
- 正式 timed content 尚未加入；現有內容仍為 instant action，但 AI reaction 已由 route timer 遷入 engine queue。
