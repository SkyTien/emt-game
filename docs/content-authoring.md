# 內容製作指南 (Content Authoring Guide)

本文件說明如何為 EMT-1 練功房新增或修改 **動作**、**單項技術**、**情境演練** 的 YAML 檔案。

---

## 目錄

1. [基本概念](#基本概念)
2. [可翻譯欄位 (LocalizedString)](#可翻譯欄位-localizedstring)
3. [動作 (actions.yml)](#動作-actionsyml)
4. [單項技術 (techniques/\*.yml)](#單項技術-techniquesyml)
5. [目錄卡片 (catalog)](#目錄卡片-catalog)
6. [情境演練 (scenarios/\*.yml)](#情境演練-scenariosyml)
7. [驗證與常見錯誤](#驗證與常見錯誤)
8. [VSCode 設定建議](#vscode-設定建議)

---

## 基本概念

所有遊戲內容以 YAML 格式儲存於 `data/` 目錄：

```
data/
  actions/actions.yml         # 全局動作總表
  techniques/<id>.yml         # 每個單項一個檔案
  scenarios/<id>.yml          # 每個情境一個檔案
```

修改完後執行 `npm run validate:content` 確認格式無誤，才能開 PR。

---

## 可翻譯欄位 (LocalizedString)

所有面向使用者的文字欄位都使用 **locale map** 格式，以支援多語系：

```yaml
# 正確寫法（locale map）
title: { zh-Hant: 路倒成人 OHCA }

# 多行文字使用 block scalar
narrative:
  zh-Hant: >
    你抵達現場，在公園步道旁有一名中年男子倒臥在地。
    先穩住場面、評估安全。

# 錯誤寫法（純字串，會產生 deprecation warning）
title: 路倒成人 OHCA
```

**規則**：

- `zh-Hant` 鍵必填
- 其他 locale（如 `en`）選填
- 純字串向後相容但不建議使用，未來版本可能移除

---

## 動作 (actions.yml)

檔案路徑：`data/actions/actions.yml`

### 欄位說明

| 欄位           | 必填 | 說明                                                                    |
| -------------- | ---- | ----------------------------------------------------------------------- |
| `id`           | ✓    | 英文 snake_case，**發布後不可改**（避免破壞情境引用）                   |
| `label`        | ✓    | 顯示名稱，LocalizedString；用於 UI 呈現與回溯相容性                     |
| `bag`          | ✓    | 所在器材袋：`hand / o2kit / jumpkit / aed / vehicle`                    |
| `default_role` |      | 預設執行角色：`lead / assist / either`（省略視為 either）               |
| `body_region`  |      | 身體部位：`head / neck / chest / wrist / abdomen / leg / arm / general` |
| `icon`         |      | icon 檔案路徑（如 `static/illustrations/actions/check_pulse.svg`）      |
| `explain`      |      | 時間軸回顧顯示的學習說明，LocalizedString                               |

### 範例

```yaml
- id: check_pupils
  label: { zh-Hant: 檢查瞳孔 }
  bag: hand
  default_role: lead
  body_region: head
  explain:
    zh-Hant: 瞳孔大小、對光反射、等大等圓，HEENT 的一部分
```

### 注意事項

- `id` 一旦上線就不能改，修改會導致既有情境/單項引用失效
- 情境與單項一律以穩定的 action `id` 引用；顯示名稱可獨立修訂
- 每個動作需補對應的 icon SVG（詳見 [visual-guide.md](visual-guide.md)）

---

## 單項技術 (techniques/\*.yml)

檔案路徑範例：`data/techniques/cervical_collar.yml`

### 欄位說明

| 欄位             | 必填 | 說明                                |
| ---------------- | ---- | ----------------------------------- |
| `id`             | ✓    | 英文 snake_case，與檔名一致         |
| `schema_version` | ✓    | 目前為 `1`                          |
| `title`          | ✓    | LocalizedString                     |
| `description`    |      | LocalizedString，簡短說明此技術目的 |
| `body_region`    |      | 主要操作部位                        |
| `illustration`   |      | 場景插畫路徑                        |
| `steps`          | ✓    | 步驟陣列（至少 1 個）               |

### steps 欄位

| 欄位        | 必填 | 說明                                             |
| ----------- | ---- | ------------------------------------------------ |
| `id`        | ✓    | 步驟識別符，英文，穩定不可改                     |
| `action_id` | ✓    | **新**：對應 `actions.yml` 中的 `id`（推薦用法） |
| `action`    |      | **已棄用**：中文 label（向後相容，不推薦用法）   |
| `tip`       |      | LocalizedString，錯誤 ≥2 次才顯示                |

### 完整範例

```yaml
id: bvm_ventilation
schema_version: 1
title: { zh-Hant: BVM 給氧通氣 }
description:
  zh-Hant: 使用 Bag-Valve-Mask 進行正壓通氣
body_region: head
illustration: /illustrations/scenes/bvm.svg

catalog:
  summary: { zh-Hant: 練習雙手固定面罩與正壓通氣順序。 }
  difficulty: beginner
  estimated_minutes: 3
  section: { zh-Hant: 呼吸道 }
  tags:
    - { zh-Hant: BVM }

steps:
  - id: ppe
    action_id: put_on_gloves_mask # 推薦：使用 action_id
    tip:
      zh-Hant: BSI 為所有接觸病人前的標準動作

  - id: position_mask
    action_id: position_mask_ec # 推薦：使用 action_id
    tip:
      zh-Hant: EC 手法固定，確保密封

  - id: squeeze_bag
    action_id: bvm_ventilation # 推薦：使用 action_id
    tip:
      zh-Hant: 擠壓 1 秒，觀察胸部起伏，每 6 秒一次
```

---

## 目錄卡片 (catalog)

`catalog` 只控制首頁、情境目錄與技術目錄的呈現，不會改變醫療流程、計分或結局。情境與單項都可使用同一格式；所有欄位皆可省略，省略時系統會從既有內容推估摘要、難度與時間。

```yaml
catalog:
  summary:
    zh-Hant: 中年男性倒臥公園，與 AI 副手協作完成評估與復甦。
  difficulty: intermediate # beginner / intermediate / advanced
  estimated_minutes: 5 # 1 到 60 的整數
  section:
    zh-Hant: 循環與復甦
  tags:
    - { zh-Hant: OHCA }
    - { zh-Hant: AI 副手 }
  featured: true # 優先作為首頁推薦
  sort: 10 # 數字越小越前面
```

### 一般情境或單項

建立 YAML 並填入 `catalog` 後，目錄會自動顯示卡片，不需要修改 Svelte 或 TypeScript。`summary`、`section` 與每個 `tags` 項目都必須使用 LocalizedString。

### 快速出勤變體

多個隱藏子情境可用同一個 `variant_group` 組成一張隨機出勤卡。父情境提供共用卡片資料，子情境只需開啟 quick play：

```yaml
# 父情境
hidden: true
catalog:
  summary: { zh-Hant: 路倒成人 OHCA 隨機病況。 }
  difficulty: intermediate
  estimated_minutes: 5
  variant_group: ohca_adult

# 子情境
extends: ohca_adult_street
hidden: true
catalog:
  quick_play: true
```

`catalog` 會由父層淺層繼承；子層只需覆寫不同欄位。若子層寫入 `tags`，會完整取代父層 tags，不會自動串接。`quick_play: true` 必須能從本層或父層取得非空 `variant_group`。

---

## 情境演練 (scenarios/\*.yml)

檔案路徑範例：`data/scenarios/ohca_adult_street.yml`

### 頂層欄位

| 欄位              | 必填 | 說明                                                               |
| ----------------- | ---- | ------------------------------------------------------------------ |
| `id`              | ✓    | 英文 snake_case，與檔名一致                                        |
| `schema_version`  | ✓    | 目前為 `1`                                                         |
| `title`           | ✓    | LocalizedString                                                    |
| `illustration`    |      | 預設場景插畫路徑                                                   |
| `catalog`         |      | 目錄卡片 metadata；省略時使用安全預設                              |
| `player_role`     | ✓    | `lead / assist / either`（either 會顯示角色選擇頁）                |
| `patient_initial` | ✓    | 初始病人狀態（consciousness / breath / pulse，皆 LocalizedString） |
| `crew`            | ✓    | 定義主副手（lead / assist），各含 `carries`（bag 陣列）與 `duty`   |
| `phases`          | ✓    | 階段陣列（至少 1 個）                                              |
| `outcomes`        | ✓    | 結局陣列（至少含 1 個 `when: 預設` 兜底）                          |

### phases 欄位

| 欄位           | 必填 | 說明                                                                |
| -------------- | ---- | ------------------------------------------------------------------- |
| `id`           | ✓    | 穩定非空字串，英文                                                  |
| `narrative`    | ✓    | LocalizedString，顯示於旁白框                                       |
| `required`     | ✓    | 必要動作陣列（可空陣列但通常至少 1 個）                             |
| `timeout`      | ✓    | 超時秒數（最小 5）                                                  |
| `on_skip`      | ✓    | 超時處置：`worsen`（惡化等級）+ `note`（LocalizedString，解釋原因） |
| `illustration` |      | 覆蓋此 phase 的場景插畫                                             |

### required 欄位

```yaml
required:
  - { action_id: cpr_adult, by: lead } # 只有主手可執行
  - { action_id: call_dispatch, by: assist } # 只有副手可執行
  - { action_id: aed_pads } # 任何人皆可
  - { action_id: aed_shock, set_flag: 已電擊 } # 完成後設定旗標，用於 outcome 條件
```

- `action_id`: **推薦**，對應 `actions.yml` 的 `id`
- `action`: **已棄用**，舊版本 (Chinese label)，需運行遷移指令更新
- `by`: `lead / assist`（省略表示任何角色都可執行）
- `set_flag`: 完成後設定一個旗標，供 `outcomes[].when` 條件使用

### outcomes 欄位

| 欄位           | 必填 | 說明                       |
| -------------- | ---- | -------------------------- |
| `id`           | ✓    | 穩定非空字串               |
| `when`         | ✓    | 條件字串（見下方條件語法） |
| `title`        | ✓    | LocalizedString            |
| `text`         | ✓    | LocalizedString            |
| `illustration` |      | 結局插畫路徑               |

**條件語法**：

| 語法          | 說明                             |
| ------------- | -------------------------------- |
| `預設`        | 兜底，永遠成立（必須有且放最後） |
| `已電擊`      | 旗標存在                         |
| `正確率>=0.9` | 正確動作 / 總動作 ≥ 0.9          |
| `正確率>=0.7` | 同上，閾值 0.7                   |
| `A 且 B`      | 兩條件同時成立                   |
| `A 或 B`      | 任一條件成立                     |

### 完整小範例

```yaml
id: cardiac_arrest_indoor
schema_version: 1
title: { zh-Hant: 室內心跳停止 }
player_role: either
illustration: /illustrations/scenes/indoor.svg

patient_initial:
  consciousness: { zh-Hant: 無反應 }
  breath: { zh-Hant: 無呼吸 }
  pulse: { zh-Hant: 摸不到 }

crew:
  lead:
    role: lead
    carries: [aed, jumpkit]
    duty: { zh-Hant: CPR、AED 操作 }
  assist:
    role: assist
    carries: [o2kit]
    duty: { zh-Hant: BVM、通報 }

phases:
  - id: assess
    narrative: { zh-Hant: 病人倒臥在客廳，家屬在旁哭泣。 }
    required:
      - { action_id: assess_safety }
      - { action_id: put_on_gloves_mask }
    timeout: 30
    on_skip:
      worsen: 1
      note: { zh-Hant: 未先評估安全即接觸病人。 }

  - id: cpr
    narrative: { zh-Hant: 確認無脈搏，立即 CPR。 }
    required:
      - { action_id: cpr_adult, by: lead }
      - { action_id: aed_shock, set_flag: 已電擊 }
    timeout: 60
    on_skip:
      worsen: 2
      note: { zh-Hant: CPR 延遲，存活率下降。 }

outcomes:
  - id: rosc
    when: 正確率>=0.9 且 已電擊
    title: { zh-Hant: ROSC }
    text: { zh-Hant: 病人恢復自主循環。 }

  - id: doa
    when: 預設
    title: { zh-Hant: 到院前 DOA }
    text: { zh-Hant: 請檢視時間軸。 }
```

---

## 驗證與常見錯誤

執行驗證：

```bash
npm run validate:content
```

### 常見錯誤訊息

| 錯誤訊息                                     | 原因                                               | 解法                                           |
| -------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| `找不到動作「xxx」`                          | scenario/technique 引用的動作在 actions.yml 找不到 | 確認 action_id 與 actions.yml 中的 id 完全一致 |
| `可翻譯欄位必須含 zh-Hant 鍵`                | 使用純字串而非 locale map                          | 改為 `{ zh-Hant: "..." }`                      |
| `逾時秒數過短`                               | timeout < 5                                        | 調高 timeout                                   |
| `outcomes 必須有一個 when="預設" 的兜底結局` | 少了兜底 outcome                                   | 在最後加 `when: 預設` 的 outcome               |
| `id 重複`                                    | 同一檔案內 id 重複                                 | 修改其中一個 id                                |

---

## VSCode 設定建議

建議在 `.vscode/settings.json` 加入：

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

建議安裝：

- [YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) — YAML 語法高亮與 schema 驗證
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) — 自動排版
