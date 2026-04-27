## Why

台灣 EMT-1 考生目前缺乏一款能同時練習「單項技術操作」與「情境判斷」的互動學習工具。市面上的筆試題庫背得了口訣卻練不到流程,實體演練課有時間地點門檻。我們要做一個**網頁即玩、免費公開**的遊戲化訓練場,讓學員在零碎時間就能反覆演練出勤流程、鞏固肌肉記憶。

此次為 greenfield 初始化,建立完整專案骨架並上線首版可玩內容(1 單項 + 3 情境),驗證遊戲玩法與內容治理流程;往後追加關卡只需要新增一份 YAML 檔,不動程式碼。

## What Changes

- 建立 SvelteKit(static)專案骨架,配置 TypeScript、Vitest、Playwright、ESLint、GitHub Actions
- 定義內容格式(YAML):動作總表 `actions.yml`、單項關卡 `techniques/*.yml`、情境關卡 `scenarios/*.yml`
- 實作**情境引擎**(`ScenarioEngine`):phase 推進、required action 判定、病人狀態惡化、結局判定,純函數、零 UI 依賴
- 實作**單項引擎**(`TechniqueEngine`):步驟狀態機、錯誤計數、星等計算,純函數
- 實作**內容驗證器**(`validateScenario` / `validateTechnique`):啟動與 CI 階段擋下格式錯誤與劇情不合理
- 實作 UI 版面:首頁 / 選關 / 角色選擇 / 遊戲中(情境、單項) / 結算 + 時間軸
- 實作**身體部位互動**:stick figure 病人可點擊頭/頸/胸/手腕/腹部/四肢,動作按部位揭露,避免清單式隱性提示
- 實作**三寶袋子 + 徒手 + 車上器材**的動作分頁工具箱,區分主手/副手,支援「指示同伴」操作
- 寫入 MVP 內容:1 個單項(上頸圈)、3 個情境(路倒成人 OHCA、機車事故創傷、低血糖意識改變)
- 本地進度儲存(localStorage),情境進度區分扮演主手/副手;提供清除進度功能
- 部署到 GitHub Pages,透過 GitHub Actions 自動測試、資料驗證、發佈

## Capabilities

### New Capabilities

- `action-registry`:動作總表,所有可執行動作的單一真相來源,提供名稱解析、袋子歸屬、角色預設、UI icon 對應
- `content-schema`:YAML 內容格式定義與驗證,涵蓋 actions、scenarios、techniques 的結構、必填欄位、合理性檢查
- `scenario-engine`:情境模式狀態機,負責讀取情境、推進 phases、執行玩家動作、處理同伴 AI、更新病人狀態、判定結局
- `technique-engine`:單項模式狀態機,負責步驟順序驗證、錯誤計數、星等判定
- `progress-storage`:localStorage 進度保存,記錄每個情境/單項、每個扮演角色的最佳星等與嘗試次數
- `game-ui`:UI 畫面與互動,含身體部位點擊、器材袋分頁工具箱、旁白與病人狀態顯示、結算與時間軸回顧
- `mvp-content`:MVP 首發內容(1 單項 + 3 情境)與對應動作總表,所有關卡皆經教學審稿
- `deployment`:靜態建置 + GitHub Pages 發佈,CI 跑測試與資料驗證

### Modified Capabilities

(首次建置,無既有 capability 需修改)

## Impact

- **新增程式**:整個 `src/`(SvelteKit 路由、元件、引擎、驗證器)、`data/`(YAML 內容)、`static/`(插畫素材)
- **新增工具鏈**:Node.js 20+、npm、SvelteKit、Vite、Vitest、Playwright、GitHub Actions
- **依賴套件**:`svelte@5`、`@sveltejs/kit`、`@sveltejs/adapter-static`、`vitest`、`@playwright/test`、`js-yaml` 或 `yaml`
- **外部服務**:僅 GitHub Pages(免費、公開 repo)。不接後端、不接分析工具、不收任何玩家資料
- **無現有系統被破壞**:專案為全新 greenfield,無 breaking changes
- **文件**:README 說明內容貢獻流程、PR 範本要求「資料來源 + 審稿者」,確保 EMT 內容正確性
