## Context

本 change 是 greenfield 初始化:從空目錄建置一個可玩的 MVP。專案目標是把 EMT-1 考試範圍的技術與流程轉成互動遊戲,先用 1 個單項(上頸圈)與 3 個情境(OHCA、創傷、低血糖)驗證「玩法 + 內容治理流程」是否可行,之後再擴充更多關卡。

**核心約束**

- 完全免費上線:部署到 GitHub Pages,不能有後端、不能有付費服務
- 跨裝置可玩:RWD,主要場景是手機單手操作
- 內容可由非工程師編輯:YAML 不是 JSON,用中文 key、中文動作名
- 醫學內容不能錯:引擎層要能擋下劇情/格式不合理的資料
- 教學正確性 > 技術炫技:複雜互動不必要,重點是動作對、流程對

**利害關係人**

- EMT-1 考生與在職救護員(玩家)
- EMT 教學老師(PO/審稿人)
- 開源社群(未來貢獻者)

## Goals / Non-Goals

**Goals**

- 一份 SvelteKit(static)專案,本地 `npm run dev` 與 `npm run build` 皆可跑
- 兩個純函數引擎(`ScenarioEngine`、`TechniqueEngine`),完全不碰 DOM,100% unit test 覆蓋主邏輯
- YAML 內容格式穩定、有硬性驗證、中文友善
- MVP 4 個關卡實際可玩,每關都經教學審稿
- GitHub Pages 網址上線,任何人點連結即玩
- 玩法創新但不複雜:身體部位點擊 + 器材袋分頁 + 主手/副手視角切換

**Non-Goals(MVP 明確排除)**

- 帳號系統、跨裝置同步、排行榜、社群互動
- 筆試題庫、知識點條目式學習
- 音效、配音、3D 角色動畫
- 多語系翻譯內容(MVP 僅實作繁中 locale;框架本身在 MVP 就建好,見 D11)
- 關卡編輯器 UI(Phase 2 再做)
- 線上數據分析、行為追蹤
- 離線 PWA(Phase 2 可加)

## Decisions

### D1. 前端框架:Svelte 5 + SvelteKit(static adapter)

**Rationale**

- 反應式狀態語法最短,適合病人狀態、倒數計時、工具箱展開等頻繁變化的 UI
- SvelteKit 內建檔案式路由、Vite 打包、adapter-static 一鍵產純靜態檔
- Rich Harris 主導、社群非中國背景(符合利害關係人偏好)
- 編譯後 bundle 小,手機載入快

### D2. 內容格式:YAML(非 JSON)

**Rationale**

- 支援中文 key、中文動作名、多行敘述、註解,非工程師可直接讀寫
- YAML 排版貼近一般筆記,審稿老師用 VSCode / Sublime / 記事本都能開
- JSON 引號逗號括號多,漏一個字就壞,審稿成本高

**Alternatives considered**

- **JSON**:太難讀寫,只能工程師改,違反「資料分離 + 非工程師可貢獻」目標
- **Markdown + YAML front-matter**:narrative 適合寫 markdown,但結構化欄位(required、outcomes)仍需 YAML,兩種混搭更複雜
- **自創 DSL**:最友善但要寫 parser,MVP 不划算

### D3. 引擎純函數化、無 UI 依賴

**Rationale**

- 引擎只輸出狀態,不碰 DOM、不呼叫 setTimeout/localStorage
- 測試時直接餵進 action 序列、比對 outcome,無需瀏覽器環境
- UI 改版、視覺大換血都不影響引擎行為

**介面契約**

- `ScenarioEngine.init(scenario, playerRole) → ScenarioState`
- `ScenarioEngine.performAction(state, actionId, by) → { newState, feedback }`
- `ScenarioEngine.tick(state, nowMs) → newState`
- `ScenarioEngine.getOutcome(state) → Outcome | null`
- 所有函數純函數,不 mutate 輸入,回傳新 state

### D4. 決策互動:身體部位點擊 + 器材袋分頁

**Rationale**

- 避免「10 個動作列出來等於多選題提示」的問題
- 身體部位模擬真實 EMT 評估的空間思維(檢查意識 → 靠近頭,測脈搏 → 摸頸/腕)
- 袋子分頁呼應三寶實務(手邊有什麼器材就能做什麼),強化記憶
- 仍是「簡單可按」風格,不打字、不拖曳

**Alternatives considered**

- **4 選 1 選單**:利害關係人明確反對,變成腦力遊戲而非 EMT 練習
- **打字 + 關鍵字比對**:最硬核但手機難操作
- **全動作列表**:視覺擠、仍有提示效應

### D5. 劇情錯誤不立即致命,惡化累積決定結局

**Rationale**

- 教學心理學:單一錯誤即 Game Over 會讓玩家挫折、不願重玩
- 真實急救也是「累積的延誤」造成不良結局,不是單一失誤
- 仍保有「想救活他」的重玩動力:結局之間有明確差距

**具體機制**

- 每個 phase 有 `timeout_sec`,超時觸發 `on_skip`,`patientWorsenLevel += 1~2`
- 最終 `outcomes` 依 `正確率` + `惡化等級` + 具名旗標(例 `已電擊`)判定
- 每個 `on_skip` 必填 `note`,說明醫學上的惡化原因(學到因果)

### D6. 主手/副手雙角色可扮演

**Rationale**

- EMT 考試實務測兩個位置,兩種操作與視角都要熟
- 增加遊戲可玩次數(同情境玩兩次,各學一個角色)
- 同伴 AI 負責對方角色,非玩家扮演的位置由 AI 執行明顯該做的動作;
  需要協調的事(例:何時 AED 電擊)仍要玩家指示,避免 AI 代玩

### D7. 資料硬性驗證

**驗證規則**(`validateScenario` / `validateTechnique` 必檢項)

- `timeout_sec` 若存在須 ≥ 5 秒
- 有 `on_skip` 必須有 `note`(不可空字串)
- `outcomes` 必須至少含一個 `when: 預設` 的兜底結局
- 所有 `required` 動作中文名都要在 `actions.yml` 找得到
- `crew.*.攜帶` 袋子名須屬合法五類(hand/o2kit/jumpkit/aed/vehicle)
- 單項 `steps` 不可為空陣列
- 單項 `step.action` 動作名都要在 `actions.yml` 找得到
- 錯誤皆以清楚訊息列出,指出檔案、位置、欄位、合法值

**執行時機**

- CI 每次 PR/push 跑驗證
- 應用程式 loadScenario/loadTechnique 時再跑一次(防呆)

### D8. Stick figure 視覺 + 免費圖庫混搭

**Rationale**

- 「簡單可愛」為 PO 定調,不做精細擬真
- 允許混用 AI 生成、unDraw、Iconify、Open Peeps、SVG Repo 等 CC0/MIT 素材
- 避免重新造輪子,讓 MVP 快速上線

**統一視覺的方法**

- 所有 SVG 套單一色票(黑線 / 醒目紅 / 氧氣藍),違和的素材用 CSS `filter: grayscale(1) brightness(0.9)` 收斂
- 動畫只用 CSS transitions 與 SVG SMIL 的基本能力,不引入動畫函式庫
- 建立 `static/illustrations/` 子資料夾分類(scenes / patients / actions / outcomes)

### D9. 進度儲存:localStorage 單一 key

**鍵名:`emt1game:progress`**,值為 JSON 物件,結構:

```ts
type Progress = {
	scenarios: Record<
		string,
		{ playedAs: Record<'lead' | 'assist', { bestStars: number; runs: number }> }
	>;
	techniques: Record<string, { bestStars: number; runs: number }>;
};
```

讀取時容錯(缺鍵、舊版遷移),寫入時合併最佳星等,清除時移除整個 key(需二次確認)。

### D11. i18n 策略:UI 與內容兩層都從 MVP 就做框架,只實作 zh-Hant

**核心原則**

- **UI chrome**(按鈕/選單/錯誤訊息/結算樣板字):走 `svelte-i18n` + `src/lib/i18n/locales/zh-Hant.json`
- **教材內容**(scenario/technique/action 的可翻譯欄位):採 **inline locale map** 格式直接內嵌於 YAML
- MVP 只實作 `zh-Hant` locale;框架就位後,未來要加英文等語系只需加翻譯(不動結構、不動 code)

**YAML 欄位分兩類**

| 類別       | 欄位範例                                                                                                                                                | 格式                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| 穩定結構   | `id`、`bag`、`default_role`、`body_region`、`required`、`when`、`timeout`、`order`                                                                      | 純值(字串/數字/陣列)               |
| 可翻譯內容 | `action.label`、`scenario.title`、`phase.narrative`、`phase.on_skip.note`、`outcome.title`、`outcome.text`、`technique.title / description`、`step.tip` | **locale map**(鍵為 BCP-47 locale) |

**範例**

```yaml
phases:
  - id: arrival # 穩定結構:不翻譯
    narrative: # 可翻譯:locale map
      zh-Hant: 你抵達現場...
      # en: You arrive at the scene...  (Phase 2 加就好)
    required: [評估現場安全] # 動作 label 用當前 primary locale,loader 解析為 id
    timeout: 30
    on_skip:
      worsen: 1
      note:
        zh-Hant: 你忘了觀察交通
```

**Loader 行為**

- 讀 YAML 後,所有可翻譯欄位**必須**為 object 結構(至少含 `zh-Hant` 鍵)
- 向後相容:若欄位為純字串,視為 `{ zh-Hant: string }` 並發 deprecation warning
- 顯示時依當前 locale 取值,缺該 locale 時 fallback 到 `zh-Hant`
- `required` 的動作名於載入時解析為 action id,後續引擎只用 id 運算;切換 locale 不影響邏輯

**Rationale**

- PO 明確表示要 MVP 就確定格式,未來加語系**不動現有 YAML 結構**
- inline map 比 sidecar 檔案對作者心智負擔更低(一個檔案看完所有版本)
- 結構 id 穩定 → 無論未來用 inline map / sidecar / 整份替換都能擴
- MVP 雖只有 zh-Hant 一個 key,但 schema 就位 = 擴語系時零遷移成本

**Alternatives considered**

- **純字串(不做 i18n)**:作者最省事,但未來若要翻譯需改所有 YAML
- **Sidecar 檔案**:primary + `i18n/en/...` 對應檔,結構乾淨但檔案倍增、作者維運成本高
- **抽離 key + 翻譯字典**(`narrative_key: ohca.arrival.narrative`):最正式但作者寫起來太痛苦

### D10. 測試策略

**Vitest 單元測試**(主戰場)

- ScenarioEngine:phase 推進、required 完成、錯誤動作、tick 觸發 on_skip、outcome 判定
- TechniqueEngine:順序驗證、錯誤計數、tip 揭露、星等計算
- validateScenario / validateTechnique:每條規則都有一個失敗案例與一個通過案例

**Playwright smoke test**(少量,MVP 只做 3 條)

- 首頁 → 選情境 → 選角色 → 完成一局 → 結算顯示
- 單項玩過 → 星等正確保存於 localStorage
- 清除進度後,首頁進度條重置

**Type-check**

- `tsc --noEmit` 入 CI,型別錯誤直接 fail

## Risks / Trade-offs

- **Risk:教學內容錯誤傳播** → **Mitigation**:PR 範本強制填「資料來源 + 審稿者」,CI 跑驗證。首版 MVP 由 PO 本人逐關審過;後續貢獻需指定審稿人 review
- **Risk:身體部位點擊對小螢幕不友善** → **Mitigation**:每個身體區塊點擊熱區要夠大(至少 44×44 px,符合 Apple HIG),視覺有高亮提示;MVP 上線後立即手機實機測
- **Risk:YAML 縮排錯誤非工程師難 debug** → **Mitigation**:`validateScenario` 錯誤訊息要人話、指出行號;README 附「常見錯誤」與 VSCode YAML 外掛設定
- **Risk:免費圖庫混搭風格不一致** → **Mitigation**:建立視覺指南(單色票、濾鏡規則),新素材須符合才合併
- **Risk:localStorage 被清掉玩家進度丟失** → **Mitigation**:接受此限制(已告知 PO);UI 清楚標示「進度僅存本機」
- **Risk:情境/單項內容經常要改,引擎也跟著調** → **Mitigation**:YAML schema 版本化(頂層 `schema_version: 1`),引擎支援多版本但優先 warning 鼓勵升級
- **Trade-off:完全無後端 = 無跨裝置同步** → PO 已接受,這是 MVP 的刻意取捨
- **Trade-off:繁中優先,英文翻譯先不寫** → MVP 走 D11 的 inline locale map 格式,YAML 欄位已是 `{ zh-Hant: ... }` 結構,未來只要加 `en:` 鍵即可,不動 code 與 schema
- **Trade-off:Svelte 5 社群比 React/Vue 小** → 若未來貢獻者以 React 為主,可考慮 Phase 3 評估遷移;但 MVP 階段 Svelte 足以

## Migration Plan

- **Deploy 步驟**
  1. 建立 GitHub repo,公開設定
  2. 初次建置完成後 push `main`,GitHub Actions 跑 CI + deploy → GitHub Pages 上線
  3. 將網址分享給 PO 與小範圍 beta tester
- **Rollback 策略**
  - Git revert 上一個 release commit → GitHub Actions 重跑 → 自動發佈前一版
  - 若 YAML 內容有問題緊急下架某關卡,改 `data/scenarios/<id>.yml` 加 `hidden: true` 讓選關不顯示(引擎忽略 hidden=true 的關卡)
- **漸進上線**
  - v0.1:1 單項 + 1 情境(OHCA)先上,讓 PO 體驗玩法 → 調整
  - v0.2:補齊創傷、低血糖情境 → 完整 MVP
  - v0.3+:Phase 2 任務(更多單項、編輯器 UI、PWA 等)

## Open Questions

- **Q1:動作 id 的命名慣例**。目前用英文 snake_case(`check_consciousness_avpu`),但我們強調中文友善,是否改用中文拼音或純編號?
  - 暫定:英文 snake_case 供程式碼內部使用,**YAML 內容全寫中文 label**,兩者靠 `actions.yml` 對應
- **Q2:情境時間軸回顧要多詳細?** 目前規劃顯示每一步做了什麼、正確答案、講解;講解文字要放在 YAML 哪個欄位?
  - 暫定:每個 action 可在 `actions.yml` 選填 `explain: |`,時間軸回顧時讀取
- **Q3:同伴 AI 的「明顯該做」判斷標準?** 太聰明會代玩、太笨會卡關
  - 暫定:只在「當前 phase required 中明確標示 `by: partner` 的動作」自動執行,且要有 1~3 秒延遲模擬真人反應;其他一律等指示
- **Q4:MVP 之後關卡優先順序?**
  - 暫定:單項(上長背板、BVM、OPA、血糖、中風指標、止血包紮、骨折)先;情境後(兒童、孕婦、老人、多傷患 START)
- **Q5:網址使用何種 domain?**
  - 暫定:先 `<user>.github.io/emt-game`,未來若 PO 有 custom domain 再綁
