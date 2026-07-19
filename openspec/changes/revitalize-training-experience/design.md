## Context

現有首頁只有兩個模式連結，情境與技術目錄只有標題及星等。情境 route 以 `OHCA_POOL` 常數列出三個隨機情境 ID；這代表內容作者即使能自行編寫 YAML，仍無法控制首頁推薦與快速出勤。另一方面，情境引擎已回傳 `wrong_order`、`equipment_unavailable`、`already_completed` 等精確 feedback code，但 UI 將它們壓縮成同一個紅叉。

本 change 維持 UI／引擎／內容三層分離：YAML 描述內容與目錄呈現，純 TS 載入及驗證內容，Svelte 僅負責呈現。所有 metadata 都是 presentation-only，不得影響醫療判定或引擎狀態。

## Goals / Non-Goals

**Goals:**

- 首頁在一個畫面內提供快速出勤、兩種訓練模式與可理解的進度摘要。
- 目錄卡資訊由 YAML 驅動，新增一般情境或快速出勤變體不需修改 route。
- metadata 為可選欄位；既有或社群內容省略時仍以安全預設渲染。
- 非工程作者能從文件複製範例，並透過 `npm run validate:content` 得到欄位級錯誤。
- 修正最影響遊玩理解、但不需要重寫引擎的 HUD 與 feedback 問題。
- 為 Phase 2 的玩家主手／AI 副手並行任務保留清楚的內容與元件邊界。

**Non-Goals:**

- 本 change 不實作多人連線、帳號、排行榜、貨幣或每日登入。
- 不改寫情境醫療正解、required action、outcome 或星等門檻。
- 不在本 change 實作 action duration、兩條 actor task lane、即時生理模擬或全新 OHCA v2 引擎。
- 不要求所有第三方或舊 YAML 立即補齊 catalog metadata。

## Decisions

### 1. Catalog metadata 採可選、共用、局部可繼承的 YAML 區塊

情境與技術共用以下資料形狀：

```yaml
catalog:
  summary:
    zh-Hant: 中年男性倒臥公園，需與 AI 副手協作完成復甦。
  difficulty: intermediate
  estimated_minutes: 5
  section:
    zh-Hant: 循環與復甦
  tags:
    - { zh-Hant: OHCA }
    - { zh-Hant: AI 副手 }
  featured: true
  sort: 10
  variant_group: ohca_adult
  quick_play: true
```

`summary`、`section` 與 `tags` 使用既有 `LocalizedString`，不在 UI 寫死中文。`difficulty` 僅允許 `beginner | intermediate | advanced`，由 i18n 顯示。`estimated_minutes` 是 1 到 60 的整數。`sort` 越小越前。`featured` 控制首頁優先推薦。`variant_group` 將多個不可直接列出的情境組成一張快速出勤卡；`quick_play` 明確表示該 resolved scenario 可被隨機選中。

所有欄位皆可省略。UI fallback：summary 使用情境第一段 narrative 或 technique description 的短版；difficulty 為 intermediate；estimated time 由 phase timeout 或 step count 推估；tags 可為空；sort 為 1000。

### 2. 情境繼承對 catalog 使用淺層合併

現有 scenario inheritance 對頂層採 spread。為了讓 OHCA 子變體只需寫 `quick_play: true`，`catalog` 改為 `{ ...parent.catalog, ...child.catalog }`。`tags` 等陣列仍由子層整體覆蓋，避免隱性串接造成作者困惑。

### 3. 快速出勤候選由內容層提供

內容層新增讀取 resolved hidden scenarios 的查詢，route 不接觸 glob、繼承或硬編 ID。快速出勤僅從 `catalog.quick_play: true` 的 resolved scenarios 選擇，並依 `variant_group` 分組。沒有 quick-play 內容時，首頁退回第一個可見 scenario。

隨機只在使用者按下開始時執行，不在 render 階段改變，避免 hydration 或重繪造成選項漂移。

### 4. 目錄呈現使用共用元件，路由只組合資料

新增 `TrainingNav`、`TrainingCard`、`ProgressSummary` 等小型元件。元件接收已解析的 title、summary、image、metadata 與 progress，不自行讀 YAML、storage 或 router。這讓未來加入新模式或 AI crew briefing 時可沿用視覺，不與內容載入耦合。

### 5. 視覺採勤務終端，而非一般設定清單

全域 token 改為深海軍藍背景、藍灰卡片、救護黃主要操作、青綠狀態、紅色只表示危急。卡片插畫加深色 overlay 以維持文字可讀性。所有主要操作維持至少 44px，手機單手直拿為第一優先，桌面只增加留白與欄數。

本 change 不引入 CSS framework 或遠端字型，避免增加 build 與離線風險。

### 6. Gameplay feedback 使用既有純引擎訊號

情境 route 維護顯示用的 `nowMs`，以 `phaseStartTimeMs` 與 timeout 計算倒數；倒數仍不寫回引擎。Typewriter 提供 skip control，完成 callback 保持一次性。FeedbackOverlay 接收 feedback code，使用 i18n 顯示具體訊息。

ActionList 完成樣式與 check mark 改用 `completedIds.has(action.id)`；不得依 label 或 locale。

### 7. Phase 2 AI 副手沿用內容邊界

後續 action duration、actor task lane、指令與回報會新增獨立 engine state，不放入 `catalog`。Catalog 只描述如何找到與介紹關卡；醫療流程仍在 phases/actions，AI 行為仍在純 TS 引擎。如此非工程作者不會因首頁改版被迫理解 UI 實作，也不會把醫療規則混入 presentation metadata。

## Validation Rules

- `catalog` 若存在必須是物件。
- summary、section、tags 每個項目必須是有效 LocalizedString。
- difficulty 僅允許 beginner、intermediate、advanced。
- estimated_minutes 必須是 1–60 的整數。
- sort 必須是有限數字。
- featured、quick_play 必須是 boolean。
- variant_group 若存在必須為非空字串。
- quick_play 為 true 時必須同時提供 variant_group。
- 所有現有 illustration filesystem 驗證規則維持不變。

## Risks / Trade-offs

- [Metadata 增加作者負擔] → 全欄位可選並提供 fallback；官方內容補齊以作範本。
- [隱藏 scenario 被誤選] → 只有明確 `quick_play: true` 才能進候選池。
- [Catalog 與醫療內容混淆] → validator 與文件明確標示 catalog 只影響目錄呈現。
- [深色主題影響遊戲內舊元件] → 新 token 保留原變數名稱，逐頁視覺驗證並避免一次改寫所有 scoped CSS。
- [首頁資料過多] → 手機只顯示一張 featured dispatch、兩張模式卡及精簡進度；完整內容留在目錄頁。

## Migration Plan

1. 新增型別、驗證與測試；舊 YAML 在無 catalog 時仍通過。
2. 為官方情境與技術補 catalog metadata，移除 route 的 OHCA ID 常數。
3. 建立共用目錄元件與全域 token，依序替換首頁、情境、技術 route。
4. 修正 ActionList、倒數、Typewriter skip 與 feedback message。
5. 更新作者文件並執行 unit、typecheck、lint、content validation、build、E2E。
