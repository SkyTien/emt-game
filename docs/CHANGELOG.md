# Changelog

本專案遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式，版本號採用 [Semantic Versioning](https://semver.org/lang/zh-TW/)。

---

## [Unreleased]

待發布的變更將在此記錄。

---

## [0.2.0] - 待定

### Added

- **CI / 部署流程**
  - `.github/workflows/ci.yml`：Push 與 PR 觸發，包含 typecheck / Vitest / validate:content / Playwright smoke
  - `.github/workflows/deploy.yml`：Push to main 自動部署至 GitHub Pages
- **E2E Smoke Tests**
  - `e2e/ohca.spec.ts`：OHCA 完整一局 → ROSC 結局
  - `e2e/cervical-collar.spec.ts`：上頸圈全對 → 3 星 → localStorage 記錄
  - `e2e/settings.spec.ts`：設定頁清除進度 → 進度歸零
- **視覺**
  - `src/app.css`：CSS 濾鏡規則統一外部 CC0 素材色調（場景插畫、結局插畫、動作 icon、袋子 icon）
- **文件**
  - `docs/content-authoring.md`：YAML 格式詳解、常見錯誤、VSCode 設定建議
  - `docs/visual-guide.md`：視覺指南，色票、CSS 濾鏡規則、素材歸屬標示要求
  - `docs/CHANGELOG.md`：本文件
  - `README.md`：完整更新，加入專案結構、部署說明、貢獻指南

---

## [0.1.0] - 2026-04-21

初始 MVP 版本。

### Added

- **專案骨架**
  - SvelteKit + TypeScript + ESLint + Prettier + Vitest + Playwright
  - `@sveltejs/adapter-static` 靜態部署，`BASE_PATH` env var 對應 GitHub Pages
  - MIT LICENSE

- **國際化框架**
  - `svelte-i18n` 整合，fallback locale `zh-Hant`
  - `src/lib/i18n/locales/zh-Hant.json`：完整 MVP 翻譯鍵
  - `src/lib/i18n/localize.ts`：LocalizedString helper
  - i18n lint script（`scripts/i18n-lint.ts`）禁止元件內出現 bare 中文字串

- **型別與驗證**
  - `src/lib/types/content.ts`：`Action`、`Scenario`、`Technique` 等完整型別定義，`LocalizedString` 格式
  - `src/lib/data/validators.ts`：`validateActions`、`validateScenario`、`validateTechnique` 含可翻譯欄位檢查
  - `src/lib/data/registry.ts`：`ActionRegistry` 類別（`load / resolve / byBag / byBodyRegion / byId`）
  - `scripts/validate-content.ts`：CLI 驗證腳本，exit code ≠ 0 時 CI 失敗

- **遊戲引擎**
  - `src/lib/engine/scenario-engine.ts`：`ScenarioEngine`（init / performAction / tick / getOutcome）
  - `src/lib/engine/technique-engine.ts`：`TechniqueEngine`（init / performAction / getStars）
  - `src/lib/engine/condition.ts`：條件語法解析器（`正確率>=0.9`、`已電擊`、`且/或`、`預設`）
  - `src/lib/engine/partner-ai.ts`：同伴 AI 自動執行（延遲 1~3 秒）
  - Vitest 測試：情境引擎 ~20 個、單項引擎 ~10 個、驗證器 ~15 個

- **進度儲存**
  - `src/lib/progress/store.ts`：localStorage 進度管理（load / saveScenarioRun / saveTechniqueRun / clear）
  - 舊版結構自動遷移（`bestStars` → `playedAs.lead.bestStars`）

- **UI 元件與路由**
  - 路由：`/`、`/scenarios`、`/scenarios/[id]/role`、`/scenarios/[id]/play`、`/scenarios/[id]/result`、`/techniques`、`/techniques/[id]/play`、`/techniques/[id]/result`、`/settings`、`/about`
  - 元件：`PatientFigure`（stick figure SVG 含熱區）、`PatientStatus`（意識/呼吸/脈搏、紅閃）、`Narrator`（打字機效果）、`PhaseProgress`、`Timer`、`IllustrationSlot`（淡入淡出）、`Toolbox`（五袋分頁 + 指示同伴）、`ActionList`、`StarBar`、`Modal`

- **視覺素材骨架**
  - `static/illustrations/` 目錄：`scenes/`、`patients/`、`actions/`、`outcomes/`
  - CSS custom properties 色票（黑線、醒目紅、氧氣藍、背景）
  - `PatientFigure.svelte`：stick figure SVG（仰臥，含 7 個可點擊熱區）

- **MVP 內容 YAML**
  - `data/actions/actions.yml`：~30 個動作，涵蓋 OHCA / 機車外傷 / 低血糖 / 上頸圈
  - `data/techniques/cervical_collar.yml`：上頸圈 5 步驟含 tip
  - `data/scenarios/ohca_adult_street.yml`：路倒成人 OHCA，5 個 phases，3 個 outcomes
  - `data/scenarios/motorcycle_trauma.yml`：機車事故多重外傷，7 個 phases
  - `data/scenarios/hypoglycemia_stroke_rule_out.yml`：低血糖合併意識改變

---

[Unreleased]: https://github.com/your-org/emt-game/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/your-org/emt-game/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/your-org/emt-game/releases/tag/v0.1.0
