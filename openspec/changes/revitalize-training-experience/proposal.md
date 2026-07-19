## Why

核心遊戲迴圈已恢復可完成、可結算與可保存，但玩家進入遊戲時仍只看到兩顆同權重按鈕，以及缺少插畫、難度、時間、摘要與進度脈絡的文字列表。情境 route 亦直接寫死 OHCA 隨機池 ID，新增或調整內容時仍需要工程師修改 Svelte，違反本專案「新增關卡只改 YAML」的架構原則。

本 change 先把遊戲外層改造成單人 EMT 的「出勤中心」，同時補齊現有遊戲內最影響理解的回饋。這是後續玩家主手、AI 副手並行任務系統的 UI 與內容契約基礎，但本 change 不一次重寫純函數情境引擎或醫療正解。

## What Changes

- 新增可選的 YAML `catalog` metadata，讓作者設定摘要、難度、預估時間、標籤、分類、排序、首頁推薦與快速出勤分組。
- 由內容載入層解析快速出勤候選，不再由 route 寫死情境 ID。
- 將首頁重做為出勤中心，包含推薦勤務、模式入口、能力／進度摘要與固定導覽。
- 將情境與單項技術列表重做為內容卡片，顯示插畫、摘要、標籤、時間、難度、最佳成績與遊玩次數。
- 新增共用目錄卡與底部導覽元件，避免三個 route 複製視覺與內容判斷。
- 修正完成動作 UI 仍以翻譯 label 比對的問題。
- 在情境 HUD 顯示玩家可感知的倒數，允許跳過旁白，並將引擎 feedback code 映射為具體中文回饋。
- 更新內容驗證、參數文件與測試，使非工程人員可依 YAML 範例新增內容，且錯誤在 build 前被阻擋。

## Capabilities

### New Capabilities

- `authorable-training-catalog`: 定義情境與單項技術的可選目錄 metadata、相容預設與驗證規則。
- `training-dispatch-hub`: 定義首頁、快速出勤、情境卡、技術卡、進度摘要與共用導覽。
- `actionable-gameplay-feedback`: 定義完成狀態、可見計時、可跳過旁白與具體錯誤訊息。

### Modified Capabilities

- `playable-content-validation`: 新增 catalog metadata 與快速出勤分組的 build-time 驗證。
- `gameplay-state-consistency`: UI 完成狀態一律使用 action ID。

## Impact

- 型別與載入：`src/lib/types/content.ts`、`src/lib/data/content.ts`
- 驗證：`src/lib/data/validators.ts`、`scripts/validate-content.ts` 與相關測試
- UI：首頁、情境列表、技術列表、情境 play route、共用目錄元件與全域樣式
- 內容：既有 scenario/technique YAML 增加可由作者維護的 `catalog` 區塊
- 文件：`docs/PARAMETERS.md`、`docs/content-authoring.md`、`docs/CHANGELOG.md`
- 不改變：現有 action ID、醫療步驟、結局條件、儲存格式、靜態部署策略
