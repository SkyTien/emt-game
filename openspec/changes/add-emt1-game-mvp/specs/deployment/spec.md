# deployment Spec Delta

## ADDED Requirements

### Requirement: 靜態建置

系統 SHALL 使用 `@sveltejs/adapter-static` 產出純靜態檔案(HTML / CSS / JS / 圖片),不依賴任何伺服器端執行環境。

#### Scenario: 本地建置產出 build 目錄

- **GIVEN** 專案已安裝依賴
- **WHEN** 執行 `npm run build`
- **THEN** `build/` 目錄產出 `index.html`、資產 chunk、靜態資源
- **AND** 目錄中無任何 Node.js 伺服器程式
- **AND** 直接用 `python -m http.server` 或 `npx serve build` 即可本地預覽

### Requirement: GitHub Pages 發佈

系統 SHALL 透過 GitHub Actions 工作流將 `build/` 內容發佈至 GitHub Pages,push 到 `main` 自動觸發。

#### Scenario: 合併到 main 觸發部署

- **GIVEN** 一個修正 bug 的 PR 已合併到 `main`
- **WHEN** GitHub Actions 工作流執行完畢
- **THEN** GitHub Pages 的網址內容更新為最新 build
- **AND** 更新後幾分鐘內世界各地訪客開網址即玩

#### Scenario: 失敗部署不影響現有站點

- **GIVEN** 某次 push 造成 build 失敗
- **WHEN** GitHub Actions 失敗
- **THEN** 既有 GitHub Pages 內容保持不變(上一個成功 build)
- **AND** PR 顯示紅色 X,開發者收到通知

### Requirement: CI 測試與資料驗證

GitHub Actions SHALL 在每個 PR 與 `main` push 上執行:TypeScript 型別檢查、Vitest 單元測試、Playwright smoke test、所有 YAML 內容驗證;任一失敗即阻擋合併/部署。

#### Scenario: 引擎測試失敗阻擋合併

- **GIVEN** 某 PR 改動 `ScenarioEngine` 導致 unit test 失敗
- **WHEN** GitHub Actions CI 執行
- **THEN** CI job `test` 失敗
- **AND** PR 顯示需修正的紅 X,保護規則不讓合併

#### Scenario: YAML 內容驗證失敗阻擋合併

- **GIVEN** 某 PR 新增情境,timeout 設為 2 秒(小於下限)
- **WHEN** GitHub Actions 執行資料驗證
- **THEN** CI job `validate-content` 失敗,日誌指出 phase id 與具體問題
- **AND** PR 不得合併

### Requirement: 無後端、無第三方追蹤

系統 SHALL 不在 production 中使用任何後端服務、分析服務、廣告 SDK,不設任何 cookie 也不存放任何玩家個人資料。

#### Scenario: 產出的 HTML 無第三方腳本

- **GIVEN** production build 已完成
- **WHEN** 檢查 `build/**/*.html` 與 JS 產物
- **THEN** 不含 Google Analytics、Plausible 等分析腳本的 URL
- **AND** 不含後端 API 呼叫(fetch 到非同 origin 的動態資源)

### Requirement: 開源授權與貢獻流程

Repo SHALL 採用 MIT 或類似寬鬆授權,提供 README 說明內容貢獻流程與 PR/Issue 範本。

#### Scenario: README 含內容貢獻說明

- **GIVEN** repo 已初始化
- **WHEN** 開啟 `README.md`
- **THEN** 含「如何新增情境」「如何新增動作」「資料來源與審稿規範」等段落
- **AND** `.github/PULL_REQUEST_TEMPLATE.md` 含「資料來源」「審稿者」欄位要求(若改動 `data/`)
