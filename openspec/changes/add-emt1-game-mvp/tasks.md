> **執行順序硬性規定**:本 change 內所有 UI 相關任務(第 6、7、8、9 節)開工前,必須先完成 **1.9 ~ 1.13** 的 i18n 框架就位;所有 UI 元件從第一行 code 開始就**只能**透過 `$_('key')`(UI chrome)或 `localize(...)`(教材內容)取字串,**禁止**先寫硬編中文、之後再來 i18n。CI 的 i18n lint(1.12)會阻擋違規合併。

## 1. 專案骨架 Scaffold(MVP 必做)

- [x] 1.1 用 `npm create svelte@latest` 初始化 SvelteKit 專案(TypeScript、ESLint、Prettier、Vitest、Playwright 皆選)
- [x] 1.2 安裝 `@sveltejs/adapter-static` 並設定 `svelte.config.js` 使用 static adapter、`paths.base` 對應 GitHub Pages 子路徑
- [x] 1.3 安裝 YAML 解析函式庫(`yaml`),並寫 `src/lib/data/loader.ts` 封裝讀 YAML 檔的介面
- [x] 1.4 建立目錄骨架:`src/lib/engine/`、`src/lib/data/`、`src/lib/ui/`、`src/routes/`、`data/{actions,scenarios,techniques}/`、`static/illustrations/`
- [x] 1.5 在 `package.json` 設定 `dev / build / preview / test / test:e2e / typecheck / validate:content` scripts
- [x] 1.6 新增 README.md 骨架:專案簡介、本地開發指令、內容貢獻流程占位段落
- [x] 1.7 新增 `.github/PULL_REQUEST_TEMPLATE.md`,含「資料來源」「審稿者」欄位(data/ 改動需填)
- [x] 1.8 新增 MIT LICENSE
- [x] 1.9 安裝 `svelte-i18n`,於 `src/lib/i18n/index.ts` 初始化 store、設定 fallback locale 為 `zh-Hant`、啟用 `waitLocale`
- [x] 1.10 建立 `src/lib/i18n/locales/zh-Hant.json` 作為翻譯檔(MVP 唯一 locale),**鍵名採語意分層**: - 第一層代表功能域:`common`(通用按鈕/訊息)、`home`、`menu`、`scenario`、`technique`、`result`、`settings`、`error` - 第二層以下依語境細分(例:`scenario.toolbox.bag_not_on_scene`、`result.outcome.rosc.cta_replay`、`error.validation.timeout_too_short`) - 禁止「整句塞一層」(例:`everything_here`),違反時 PR review 退件 - 檔案若成長至 500 行以上,允許按一級鍵拆為 `zh-Hant/common.json` + `zh-Hant/scenario.json` 等多檔,於 `src/lib/i18n/index.ts` 合併註冊
- [x] 1.11 在 `+layout.svelte` 載入 i18n,確保 locale 就緒後才渲染子路由(`{#await waitLocale()}` 包圍 `<slot />`);SvelteKit static 模式下 i18n 於瀏覽器端初始化,首次渲染要避免 flash of untranslated content
- [x] 1.12 寫 ESLint 或 lint script 禁止元件內出現 bare 中文字串(白名單:註解、測試資料),強制走 `$_('key')`;違規時 CI 失敗
- [x] 1.13 實作 `src/lib/i18n/localize.ts` helper:`localize(value, locale)` 接受 `LocalizedString` 或純字串,回傳該 locale 字串(缺該 locale 時 fallback 到 `zh-Hant`);UI 顯示教材內容時全部走此函式

## 2. 內容格式與驗證器(MVP 必做)

- [x] 2.1 定義 TypeScript 型別:`Action`、`Scenario`、`Phase`、`Outcome`、`Technique`、`Step`、`Crew`、`PatientVitals`、`BagId`(`hand | o2kit | jumpkit | aed | vehicle`);**可翻譯欄位型別**用 `LocalizedString = { "zh-Hant": string; [locale: string]: string }`(zh-Hant 必備,其他選填)
- [x] 2.2 實作 `ActionRegistry` 類別:`load(path)`、`resolve(label)`、`byBag(bag)`、`byBodyRegion(region)`、`byId(id)`;拋錯時訊息含欄位與值
- [x] 2.3 實作 `validateActions(actions)`:袋子值檢查、id 唯一、label 唯一、icon 路徑檢查;**檢查所有可翻譯欄位為 LocalizedString 格式且至少含 `zh-Hant` 鍵**;純字串輸入需接受並發 deprecation warning(向後相容)
- [x] 2.4 實作 `validateScenario(scenario, registry)`:timeout ≥ 5、on_skip 必備 note、outcomes 必有 `when: 預設` 兜底、required 動作名都能被 registry 反查、crew 攜帶袋子合法;**所有可翻譯欄位必為 LocalizedString 且含 `zh-Hant`**、phase/outcome id 為穩定非空字串
- [x] 2.5 實作 `validateTechnique(technique, registry)`:steps 非空、每 step.action 都能被 registry 反查;**title/description/tip 必為 LocalizedString 含 `zh-Hant`**
- [x] 2.6 寫 CLI 腳本 `scripts/validate-content.ts`:掃描 `data/**/*.yml` 全數跑驗證,失敗 exit code ≠ 0(CI 用)
- [x] 2.7 為每條驗證規則撰寫 Vitest 測試:一個通過案例 + 一個失敗案例(共 ~15 個 test case)

## 3. 情境引擎(MVP 必做)

- [x] 3.1 定義 `ScenarioState`、`ActionLogEntry`、`Location`、`DirectiveEvent`、`Feedback` 型別
- [x] 3.2 實作 `ScenarioEngine.init(scenario, playerRole)`:初始化 state(phase 0、completedRequired 空、病人初始狀態、袋子位置)
- [x] 3.3 實作 `ScenarioEngine.performAction(state, actionId, by)`:依順序檢查袋子在場/角色合法/required 符合,回傳新 state 與 feedback
- [x] 3.4 實作同伴 AI 自動執行邏輯:當 required 標示 `by: partner` 且玩家未指示,延遲 1~3 秒自動執行
- [x] 3.5 實作 `ScenarioEngine.tick(state, nowMs)`:檢查 phase 超時 → 觸發 on_skip → 推進 phase
- [x] 3.6 實作條件語法解析器(支援 `正確率>=0.9`、`已電擊`、`且 / 或`、`預設`),用於 outcomes `when` 判定
- [x] 3.7 實作 `ScenarioEngine.getOutcome(state)`:從上到下評估 outcomes 條件,回傳第一個符合
- [x] 3.8 log 寫入:每次 action、phase_advance、on_skip、outcome 事件皆寫入,時間排序
- [x] 3.9 撰寫 Vitest 測試覆蓋上述每條規則(共 ~20 個 test case,包含各種結局路徑)

## 4. 單項引擎(MVP 必做)

- [x] 4.1 定義 `TechniqueState` 型別
- [x] 4.2 實作 `TechniqueEngine.init(technique)`:stepIndex=0、wrongTries=0、finished=false
- [x] 4.3 實作 `TechniqueEngine.performAction(state, actionId)`:正確推進、錯誤累加、finished 判定
- [x] 4.4 實作 tip 漸進揭露:該步驟 wrongTries ≥ 2 才在 feedback 附上 tip
- [x] 4.5 實作 `TechniqueEngine.getStars(state)`:完成時依 wrongTries 回傳 1~3 星;未完成回傳 null
- [x] 4.6 撰寫 Vitest 測試(~10 個 test case)

## 5. 進度儲存(MVP 必做)

- [x] 5.1 實作 `src/lib/progress/store.ts`:`load()`、`saveScenarioRun(scenarioId, role, stars)`、`saveTechniqueRun(techniqueId, stars)`、`clear()`
- [x] 5.2 實作舊版結構自動遷移(`scenarios[id].bestStars` → `scenarios[id].playedAs.lead.bestStars`)
- [x] 5.3 寫 localStorage mock 的 Vitest 測試(~5 個 test case)

## 6. UI 骨架與路由(MVP 必做)

> **i18n 前提**:本節起所有元件開工前必須已完成 1.9~1.13。UI 字串一律 `$_('key')`,教材內容一律 `localize(value, $locale)`。每個 PR 加 UI 元件時同步補翻譯鍵到 `zh-Hant.json`;i18n lint 為 CI 必過關卡。

- [x] 6.1 建立路由:`/`(首頁)、`/scenarios`、`/scenarios/[id]/role`、`/scenarios/[id]/play`、`/scenarios/[id]/result`、`/techniques`、`/techniques/[id]/play`、`/techniques/[id]/result`、`/settings`、`/about`
- [x] 6.2 首頁元件:標題 + 兩大模式按鈕 + 進度條 + 設定入口
- [x] 6.3 選關元件:情境/單項清單,讀進度顯示星等或「未嘗試」
- [x] 6.4 角色選擇元件:顯示主手/副手卡片含攜帶袋子與職責,`player_role === "兩者皆可"` 時才顯示
- [x] 6.5 設定頁:清除進度按鈕(含二次確認對話框)、關於、致謝、授權

## 7. 遊戲中畫面:情境(MVP 必做)

- [x] 7.1 頂列元件:關卡名、扮演角色、計時器(從 state.phaseStartTime 推算)
- [x] 7.2 場景插畫 slot:讀 phase.illustration 或 scenario 預設,淡入淡出轉場
- [x] 7.3 **身體部位點擊元件**:stick figure 病人 SVG,定義 `<g id="head" role="button">` 等熱區(至少 44×44 px),點擊後 emit 事件
- [x] 7.4 動作清單元件:依點擊的部位或切換的袋子分頁列出可做動作;按鈕顯示 icon + 中文 label
- [x] 7.5 病人狀態列元件:意識/呼吸/脈搏三欄,接 state.patient 更新;惡化事件時背景紅閃 1 秒(CSS keyframes)
- [x] 7.6 旁白框元件:打字機效果逐字顯示 phase.narrative
- [x] 7.7 階段進度元件:`已做 ▪▪□(2/3)`
- [x] 7.8 器材袋分頁元件:五個分頁按鈕 + 指示同伴,不在場的分頁顯示禁用狀態與說明
- [x] 7.9 指示同伴分頁:列出同伴當前可執行的動作,點擊後呼叫引擎的 directive API
- [x] 7.10 `onMount` 時訂閱引擎 state,`setInterval(500ms)` 呼叫 `engine.tick`
- [x] 7.11 情境進入/離開時清理計時器與訂閱

## 8. 遊戲中畫面:單項(MVP 必做)

- [x] 8.1 場景插畫 slot
- [x] 8.2 步驟進度顯示(第 N 步 / 共 M 步)
- [x] 8.3 器材袋分頁工具箱(複用情境用的元件)
- [x] 8.4 身體部位點擊元件(若該單項涉及病人部位,例:上頸圈點頸部)
- [x] 8.5 Tip 區:wrongTries ≥ 2 才顯示
- [x] 8.6 錯誤計數顯示

## 9. 結算畫面(MVP 必做)

- [x] 9.1 情境結算元件:結局標題、結局插畫、結局文字、正確率/錯誤/惡化、星等、時間軸回顧入口、再來一次與返回選關
- [x] 9.2 時間軸回顧元件:收合/展開的清單,每筆顯示時間、誰做了什麼、正確與否、講解;action/on_skip/phase_advance 不同樣式
- [x] 9.3 單項結算元件:單項名、錯誤數、星等、再來一次與返回選關
- [x] 9.4 結算時呼叫 `saveScenarioRun` / `saveTechniqueRun` 寫 localStorage

## 10. 視覺素材(MVP 必做)

- [x] 10.1 建立 `static/illustrations/` 子資料夾:`scenes/`、`patients/`、`actions/`、`outcomes/`
- [x] 10.2 定義視覺色票(CSS custom properties):黑線、醒目紅、氧氣藍、背景白/淺灰
- [x] 10.3 製作 stick figure 病人 SVG(仰臥姿態,含頭/頸/胸/手腕/腹部/四肢 `<g>` 區塊)
- [ ] 10.4 製作/蒐集三個情境的場景插畫(路倒街頭、機車事故、室內昏迷)
- [ ] 10.5 製作/蒐集結局插畫(病人恢復呼吸、持續 CPR、到院前 DOA、送醫好轉)
- [ ] 10.6 製作/蒐集 5 類袋子 icon + ~40 個動作 icon
- [x] 10.7 CSS 濾鏡規則統一視覺(對 CC0 素材套 `filter` 收斂色調)

## 11. MVP 內容 YAML(MVP 必做,需審稿)

- [x] 11.1 撰寫 `data/actions.yml`:覆蓋 4 個關卡所需所有動作,每個動作標註 bag、default_role、body_region(若適用)、icon、可選 explain;**label 與 explain 皆採 `{ zh-Hant: ... }` locale map 格式**
- [x] 11.2 撰寫 `data/techniques/cervical_collar.yml`:上頸圈 5 步,含 tip;**所有可翻譯欄位皆為 `{ zh-Hant: ... }` 格式**、phases/outcomes/steps 用穩定 id
- [x] 11.3 撰寫 `data/scenarios/ohca_adult_street.yml`:路倒成人 OHCA,phases 覆蓋抵達→評估→CPR→AED→ISBAR,4 個 outcomes;**採 locale map 格式**
- [x] 11.4 撰寫 `data/scenarios/motorcycle_trauma.yml`:機車事故多重外傷,phases 覆蓋現場管制→頸椎→ABC→止血→骨折→長背板→送醫;**採 locale map 格式**
- [x] 11.5 撰寫 `data/scenarios/hypoglycemia_stroke_rule_out.yml`:低血糖合併意識改變,重點在血糖先於中風指標的鑑別;**採 locale map 格式**
- [ ] 11.6 **PO 審稿**:所有 4 份 YAML 由 EMT 教學老師逐關審過(劇情合理、醫學正確),PR 內記錄審稿者
- [x] 11.7 跑 `npm run validate:content` 全數通過

## 12. CI / 部署(MVP 必做)

- [x] 12.1 設定 `svelte.config.js` 的 `paths.base` 對應 GitHub Pages repo path
- [x] 12.2 新增 `.github/workflows/ci.yml`:trigger 在 push 與 PR,jobs 為 `typecheck`、`test`(Vitest)、`validate:content`、`e2e`(Playwright,只跑 smoke)
- [x] 12.3 新增 `.github/workflows/deploy.yml`:push main 觸發,build → 發 GitHub Pages(用官方 pages-deploy-action)
- [ ] 12.4 repo 設定 Pages 啟用、CI 通過為必要合併條件
- [ ] 12.5 第一次部署驗證:合併 main → 幾分鐘後網址可開 → 手機實機玩一局 OHCA

## 13. E2E Smoke Test(MVP 必做)

- [x] 13.1 Playwright test:首頁 → 進 OHCA → 選主手 → 正確完成一局 → 看到 ROSC 結局
- [x] 13.2 Playwright test:單項「上頸圈」玩過 → 結算 3 星 → localStorage 有對應記錄
- [x] 13.3 Playwright test:設定頁清除進度 → 首頁進度條歸零

## 14. 文件(MVP 必做)

- [x] 14.1 README:專案簡介、遊戲網址、本地開發指令、貢獻指南(如何新增情境/動作/單項)、授權
- [x] 14.2 `docs/content-authoring.md`:YAML 格式詳解、常見錯誤、VSCode 設定建議
- [x] 14.3 `docs/visual-guide.md`:視覺指南,色票、CSS 濾鏡規則、素材歸屬標示要求
- [x] 14.4 `docs/CHANGELOG.md`:紀錄 v0.1、v0.2 內容

## 15. Phase 2(延後,不在 MVP 範圍)

- [ ] 15.1 更多單項:上長背板、BVM、OPA/NPA、血糖、中風指標、止血、骨折、燒燙傷
- [ ] 15.2 更多情境:兒童、孕婦、老人、多傷患 START 檢傷、休克、水域、燒燙傷
- [ ] 15.3 關卡編輯器 UI(網頁表單 → 匯出 YAML 下載)
- [ ] 15.4 PWA 離線支援(service worker + manifest)
- [ ] 15.5 英文版翻譯:新增 `src/lib/i18n/locales/en.json`、新增語系切換 UI;框架 MVP 已就位,此任務只需加檔案與切換器
- [ ] 15.6 音效(可選擇關閉)
- [ ] 15.7 輕量隱私友善分析(Plausible / Umami 評估)
