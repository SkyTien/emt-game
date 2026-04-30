# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
npm install              # 安裝依賴
npm run dev             # 啟動開發伺服器 (http://localhost:5173)
npm run build           # 產出靜態網站到 build/
npm run test            # 執行 Vitest 單元測試
npm run test:watch      # 執行單元測試（監視模式）
npm run test:e2e        # 執行 Playwright E2E 測試
npm run typecheck       # TypeScript 型別檢查
npm run validate:content # 驗證 data/ 下所有 YAML 格式
npm run lint            # ESLint + Prettier + i18n lint
npm run format          # Prettier 自動排版
```

## 專案概述

EMT-1 練功房是台灣 EMT-1（緊急醫療技術員）的互動式練習遊戲，無後端、開放內容。核心由兩個引擎驅動：

- **情境引擎** (`ScenarioEngine`)：模擬真實出勤流程，含角色選擇、階段推進、條件評估
- **單項引擎** (`TechniqueEngine`)：逐步驟引導操作程序，累積錯誤達 2 次後顯示提示

所有遊戲內容以 YAML 格式定義於 `data/` 目錄，無須編寫程式碼即可貢獻。

## 架構與核心模組

### 資料層 (`src/lib/data/`)

- **loader.ts**：從 YAML 檔案載入並解析 actions、techniques、scenarios
- **content.ts**：載入所有內容、構建全局 action registry
- **validators.ts**：驗證 YAML 結構（schema、引用完整性、條件語法）
- **registry.ts**：action 全局註冊表，供 engine 查詢

### 引擎層 (`src/lib/engine/`)

- **scenario-engine.ts**：
  - 管理情境遊戲狀態（phase、flags、patient、equipment location）
  - 驗證動作合法性、計算正確性、推進階段
  - 評估結局條件（基於 flags 與正確率）
  - 返回 feedback（正確/錯誤、提示）
- **technique-engine.ts**：
  - 管理單項技術狀態（step 進度、錯誤累計）
  - 追蹤連續錯誤，達 2 次後解鎖 tip
  - 返回動作是否完成

- **partner-ai.ts**：決定同伴應執行哪些動作（供時間軸顯示）

- **condition.ts**：解析與評估 outcome 條件字串（`預設`, `旗標`, `正確率>=N`, `且/或` 邏輯）

### 進度管理 (`src/lib/progress/`)

- **store.ts**：localStorage 進度持久化（遊戲狀態、技術進度、統計）

### 國際化 (`src/lib/i18n/`)

- **localize.ts**：取得指定 locale 字串（目前只支援 zh-Hant）

### UI 元件 (`src/lib/ui/`)

- Svelte 共用元件：timeline、phase display、action buttons、outcome display 等

### 路由 (`src/routes/`)

- SvelteKit 頁面：遊戲列表、遊戲主頁、情境遊玩、單項遊玩、時間軸回顧等

## 內容製作（YAML 結構）

詳細說明見 [docs/content-authoring.md](docs/content-authoring.md)。簡要：

| 檔案位置                   | 責任       | 主要欄位                                                       |
| -------------------------- | ---------- | -------------------------------------------------------------- |
| `data/actions/actions.yml` | 全局動作表 | id, label, bag, default_role, body_region, icon, explain       |
| `data/techniques/<id>.yml` | 單項技術   | id, schema_version, title, steps[] (含 action_id)              |
| `data/scenarios/<id>.yml`  | 情境演練   | id, schema_version, title, phases[] (含 action_id), outcomes[] |

**可翻譯欄位** 使用 locale map：`{ zh-Hant: "..." }`，必須含 `zh-Hant` 鍵。

## 常見開發任務

### 新增動作

1. 在 `data/actions/actions.yml` 的 `actions:` 陣列新增條目
2. 填寫 `id`（snake_case）、`label`（locale map）、`bag`、`body_region`、`explain`
3. 執行 `npm run validate:content` 驗證
4. 在 `static/illustrations/actions/<id>.svg` 放置 icon

### 新增單項技術

1. 建立 `data/techniques/<id>.yml`
2. 定義 `id`, `schema_version: 1`, `title`, `steps[]`
3. 每個 step 含 `id`, `action_id`（對應 actions.yml 的 id），`tip`（可選）
4. 執行 `npm run validate:content`

### 新增情境演練

1. 建立 `data/scenarios/<id>.yml`
2. 定義頂層欄位：`id`, `schema_version: 1`, `title`, `player_role`, `patient_initial`, `crew`, `phases[]`, `outcomes[]`
3. `phases[].required[]` 中指定必要動作：使用 `action_id`（推薦），可含 `by` 限制角色、`set_flag` 設定旗標
4. `outcomes[]` 中定義結局條件（`when` 欄位使用條件語法）
5. 執行 `npm run validate:content`

### 測試遊戲邏輯

- 單元測試：`npm run test` 或 `npm run test:watch`
- E2E 測試：`npm run test:e2e`
- 遊戲流程測試：啟動 `npm run dev`，手動遊玩新內容

## 驗證流程

在提交 PR 前，執行：

```bash
npm run validate:content  # 檢查 YAML 格式與引用完整性
npm run typecheck         # TypeScript 型別檢查
npm test                  # 單元測試
npm run lint              # ESLint + Prettier + i18n lint
```

常見 validation 錯誤見 [docs/content-authoring.md#驗證與常見錯誤](docs/content-authoring.md#驗證與常見錯誤)。

## 部署

合併到 `main` 後，GitHub Actions 自動 build 並部署至 GitHub Pages。詳見 `.github/workflows/deploy.yml`。

部署路徑預設為 repo 根路徑；需調整可設定 `BASE_PATH` 環境變數：

```bash
BASE_PATH=/my-repo-name npm run build
```

## 編輯器設定

建議在 `.vscode/settings.json` 配置 YAML schema：

```json
{
	"yaml.schemas": {
		"./openspec/schemas/action.schema.json": "data/actions/*.yml",
		"./openspec/schemas/scenario.schema.json": "data/scenarios/*.yml",
		"./openspec/schemas/technique.schema.json": "data/techniques/*.yml"
	},
	"editor.formatOnSave": true,
	"[yaml]": {
		"editor.defaultFormatter": "esbenp.prettier-vscode"
	}
}
```

建議安裝擴充：

- [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## 關鍵概念

### Action（動作）

遊戲中可執行的單位操作，如「評估現場安全」、「檢查脈搏」。動作屬於某個器材袋（hand/o2kit/jumpkit/aed/vehicle），可指定預設執行角色（lead/assist/either）。

### Technique（單項技術）

一組步驟的序列，教導特定操作程序（如上頸圈、BVM 給氧）。每步驟引用一個 action；錯誤累計 ≥2 次後顯示提示。

### Scenario（情境演練）

完整遊戲場景，模擬真實出勤。含多個 phase（階段），每個 phase 定義旁白、必要動作、超時處理。遊戲結束時基於 flags 與正確率評估 outcome（結局）。

### Phase（階段）

情境中的一個狀態段。包含：

- `narrative`：旁白文本
- `required[]`：必要動作列表（含可選的 `by`、`set_flag`）
- `timeout`：秒數上限
- `on_skip`：超時時的惡化等級與說明

### Outcome（結局）

遊戲結束時的結果，基於條件評估（`when`）。條件可含旗標、正確率、邏輯組合。

### Flags（旗標）

由動作完成設定（`set_flag`），供 outcome 條件檢查。如「已電擊」表示 AED 電擊動作已完成。

### Patient Vitals（病人生命徵象）

初始狀態定義（意識、呼吸、脈搏等），不會自動更新；outcome 條件不檢查。

### Bag（器材袋）

動作所屬的器材類別：hand、o2kit、jumpkit、aed、vehicle。影響動作可用性與UI呈現。

### Role（角色）

lead（主手）或 assist（副手）。決定可執行的動作與器材分配。

## 除錯

- 型別錯誤：執行 `npm run typecheck` 檢查 TypeScript
- YAML 錯誤：執行 `npm run validate:content` 檢查格式與引用
- 邏輯錯誤：查看 browser console（dev server）或 test 輸出
- 時間軸不符預期：檢查 engine 返回的 action log 與 feedback

## 重要文件

- [README.md](README.md) — 專案簡介與快速開始
- [docs/content-authoring.md](docs/content-authoring.md) — 完整 YAML 製作指南（必讀）
- [docs/visual-guide.md](docs/visual-guide.md) — 插畫與素材指南
- [docs/CHANGELOG.md](docs/CHANGELOG.md) — 版本變更
