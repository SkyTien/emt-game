# EMT-1 練功房

台灣 EMT-1 互動式練習遊戲——網頁即玩，免費公開，專注於「單項技術」與「情境判斷」雙模式訓練。

**遊戲網址**：[部署後填入 GitHub Pages URL]

## 功能特色

- **情境演練**：模擬真實出勤流程（OHCA、機車外傷、低血糖鑑別），含主副手角色選擇
- **單項技術**：逐步驟練習操作程序（如上頸圈），錯誤累積 ≥2 次自動顯示提示
- **無後端**：所有進度存 localStorage，離線可玩
- **開放內容**：YAML 格式定義動作/情境/單項，貢獻者無需寫程式碼

## 本地開發

需要 Node.js 20+。

```bash
npm install
npm run dev           # 啟動開發伺服器 (http://localhost:5173)
npm run build         # 產出靜態網站到 build/
npm run preview       # 預覽 build 結果 (http://localhost:4173)
npm run test          # 執行 Vitest 單元測試
npm run test:e2e      # 執行 Playwright E2E 測試
npm run typecheck     # TypeScript 型別檢查
npm run validate:content  # 驗證 data/ 下所有 YAML 格式
npm run lint          # ESLint + Prettier + i18n lint
npm run format        # Prettier 自動排版
```

## 目錄結構

```
data/
  actions/actions.yml       # 全局動作定義
  scenarios/*.yml           # 情境 YAML
  techniques/*.yml          # 單項 YAML
src/
  lib/
    data/                   # 資料載入、驗證
    engine/                 # 情境引擎、單項引擎
    i18n/                   # 國際化（目前唯一 locale: zh-Hant）
    progress/               # localStorage 進度管理
    types/                  # TypeScript 型別
    ui/                     # 共用 Svelte 元件
  routes/                   # SvelteKit 路由
static/
  illustrations/            # 插畫素材（scenes/patients/actions/outcomes）
```

## 新增情境 / 動作 / 單項

> 詳細 YAML 格式說明請見 [docs/content-authoring.md](docs/content-authoring.md)。

1. 在 `data/` 下新增或修改 YAML（動作 / 單項 / 情境）。
2. 執行 `npm run validate:content` 確認格式無誤。
3. 開 PR，於範本中填寫「資料來源」與「審稿者」。
4. 由 EMT 教學老師審閱（劇情合理、醫學正確）後合併。

### 快速範例：新增一個動作

在 `data/actions/actions.yml` 的 `actions:` 清單下加入：

```yaml
- id: check_pupils
  label: { zh-Hant: 檢查瞳孔 }
  bag: hand
  default_role: lead
  body_region: head
  explain:
    zh-Hant: 瞳孔大小、對光反射、等大等圓
```

### 快速範例：新增一個情境

複製 `data/scenarios/ohca_adult_street.yml`，修改 `id`、`title`、`phases`、`outcomes`。
所有可翻譯欄位使用 `{ zh-Hant: "..." }` locale map 格式。

## 部署

合併到 `main` 後，GitHub Actions 會自動 build 並部署至 GitHub Pages。
部署 workflow 詳見 [.github/workflows/deploy.yml](.github/workflows/deploy.yml)。

如需在不同 repo 路徑下部署，設定 `BASE_PATH` 環境變數：

```bash
BASE_PATH=/my-repo-name npm run build
```

## 貢獻

歡迎任何形式的貢獻——新情境、修正醫學內容、UI 改善、i18n。
開 PR 前請先閱讀 [docs/content-authoring.md](docs/content-authoring.md)，
並確認 `npm run validate:content` 與 `npm test` 全數通過。

## 授權

MIT，詳見 [LICENSE](LICENSE)。
插畫素材請各自遵守其原始授權（CC0 / CC BY），詳見 [docs/visual-guide.md](docs/visual-guide.md)。
