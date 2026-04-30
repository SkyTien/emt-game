# 參數與用法速查 (Parameters Reference)

本文件提供 **scenarios** 與 **actions** 中所有參數的快速參考。詳細說明見 [content-authoring.md](content-authoring.md)。

---

## 目錄

1. [Actions (動作)](#actions-動作)
2. [Scenarios (情境演練)](#scenarios-情境演練)
3. [Techniques (單項技術)](#techniques-單項技術)
4. [條件語法速查](#條件語法速查)
5. [常用值列舉](#常用值列舉)

---

## Actions (動作)

**檔案位置**：`data/actions/actions.yml`

所有可用的 action ID 及其對應的中文標籤，見 **[ACTIONS.md](ACTIONS.md)** （自動生成）。

### 參數結構

```yaml
actions: # 陣列，所有動作定義
  - id: <string> # ✓ 必填，唯一識別符，snake_case
    label: <LocalizedString> # ✓ 必填，顯示名稱
    bag: <BagId> # ✓ 必填，器材袋分類
    default_role: <Role> #   可選，預設執行角色
    body_region: <BodyRegion> #   可選，身體部位
    icon: <string> #   可選，icon 路徑
    explain: <LocalizedString> #   可選，學習說明
```

| 參數           | 型別                                                 | 必填 | 說明                                                      | 舉例                           |
| -------------- | ---------------------------------------------------- | ---- | --------------------------------------------------------- | ------------------------------ |
| `id`           | string                                               | ✓    | 英文 snake_case，發布後不可改；供 scenario/technique 引用 | `check_pupils`, `cpr_adult`    |
| `label`        | LocalizedString                                      | ✓    | 遊戲顯示名稱；用於 UI 呈現與回溯相容性                    | `{ zh-Hant: 檢查瞳孔 }`        |
| `bag`          | `hand` \| `o2kit` \| `jumpkit` \| `aed` \| `vehicle` | ✓    | 動作所屬器材袋（見下方）                                  | `hand`, `jumpkit`              |
| `default_role` | `lead` \| `assist` \| `either`                       |      | 預設執行角色；省略等同 `either`                           | `lead`                         |
| `body_region`  | BodyRegion                                           |      | 操作身體部位，影響 UI 呈現（見下方）                      | `head`, `chest`                |
| `icon`         | string                                               |      | Lucide icon 名稱或路徑                                    | `ShieldCheck`, `Activity`      |
| `explain`      | LocalizedString                                      |      | 時間軸回顧中顯示的教學說明                                | `{ zh-Hant: 瞳孔反射檢查... }` |

### 有效的 BagId 值

| 值        | 含義               |
| --------- | ------------------ |
| `hand`    | 雙手、基本工具     |
| `o2kit`   | 氧氣套組           |
| `jumpkit` | 快速急救包         |
| `aed`     | 自動體外心臟電擊器 |
| `vehicle` | 救護車器械         |

### 有效的 BodyRegion 值

```
head      # 頭部（眼睛、耳朵、口腔）
neck      # 頸部（氣道、動脈、頸椎）
chest     # 胸部（呼吸、心跳、胸外按壓）
wrist     # 腕部（脈搏、血壓、血氧）
abdomen   # 腹部
leg       # 腿部
arm       # 手臂
general   # 全身性動作
```

---

## Scenarios (情境演練)

**檔案位置**：`data/scenarios/<id>.yml`

### 頂層結構

```yaml
id: <string> # ✓ 必填，snake_case，與檔名一致
schema_version: <number> # ✓ 必填，目前為 1
title: <LocalizedString> # ✓ 必填，情境標題
player_role: <Role | 'either'> # ✓ 必填，玩家角色選項
illustration: <string> #   可選，預設場景插畫
patient_initial: <PatientVitals> # ✓ 必填，初始病人狀態
crew: <CrewConfig> # ✓ 必填，lead/assist 配置
phases: <Phase[]> # ✓ 必填，階段陣列
outcomes: <Outcome[]> # ✓ 必填，結局陣列
hidden: <boolean> #   可選，預設 false
```

### 頂層參數詳解

| 參數              | 型別                           | 必填 | 說明                                 | 舉例                             |
| ----------------- | ------------------------------ | ---- | ------------------------------------ | -------------------------------- |
| `id`              | string                         | ✓    | 英文 snake_case，與檔名一致          | `ohca_adult_street`              |
| `schema_version`  | number                         | ✓    | 目前為 `1`                           | `1`                              |
| `title`           | LocalizedString                | ✓    | 遊戲標題                             | `{ zh-Hant: 路倒成人救護 }`      |
| `player_role`     | `lead` \| `assist` \| `either` | ✓    | 玩家扮演角色；either 時顯示選擇      | `either`                         |
| `illustration`    | string                         |      | 場景插畫路徑（PNG/SVG）              | `/illustrations/scenes/ohca.png` |
| `patient_initial` | PatientVitals                  | ✓    | 初始患者生命徵象                     | 見下方                           |
| `crew`            | CrewConfig                     | ✓    | 主副手配置                           | 見下方                           |
| `phases`          | Phase[]                        | ✓    | 遊戲階段（至少 1 個）                | 見下方                           |
| `outcomes`        | Outcome[]                      | ✓    | 結局列表（至少含 1 個 `when: 預設`） | 見下方                           |
| `hidden`          | boolean                        |      | 預設為 false；true 時在選單隱藏      | `false`                          |

### PatientVitals（病人生命徵象）

```yaml
patient_initial:
  consciousness: <LocalizedString> # ✓ 必填，意識狀態（如「無反應」、「嗜睡」）
  breath: <LocalizedString> # ✓ 必填，呼吸（如「無呼吸」、「急促」）
  pulse: <LocalizedString> # ✓ 必填，脈搏（如「無脈搏」、「微弱」）
  skin: <LocalizedString> #   可選，皮膚（如「蒼白濕冷」）
  glucose: <LocalizedString> #   可選，血糖（如「低」）
  spO2: <LocalizedString> #   可選，血氧飽和度（如「低於 90%」）
  bp: <LocalizedString> #   可選，血壓（如「收縮壓 < 90」）
```

| 欄位            | 必填 | 說明           | 舉例                         |
| --------------- | ---- | -------------- | ---------------------------- |
| `consciousness` | ✓    | 意識等級或狀態 | `{ zh-Hant: 無反應 }`        |
| `breath`        | ✓    | 呼吸狀態       | `{ zh-Hant: 無呼吸 }`        |
| `pulse`         | ✓    | 脈搏狀態       | `{ zh-Hant: 摸不到 }`        |
| `skin`          |      | 微循環徵象     | `{ zh-Hant: 蒼白濕冷 }`      |
| `glucose`       |      | 血糖狀態       | `{ zh-Hant: 低於 70 mg/dL }` |
| `spO2`          |      | 血氧飽和度     | `{ zh-Hant: 低於 90% }`      |
| `bp`            |      | 血壓           | `{ zh-Hant: 收縮壓 < 90 }`   |

⚠️ **注意**：`patient_initial` 僅用於初始狀態顯示，不會自動更新。outcome 條件評估**不檢查**生命徵象。

### CrewConfig（主副手配置）

```yaml
crew:
  lead:
    role: lead # ✓ 固定為 lead
    carries: <BagId[]> # ✓ 主手攜帶的器材袋陣列
    duty: <LocalizedString> #   可選，主手職責說明
  assist:
    role: assist # ✓ 固定為 assist
    carries: <BagId[]> # ✓ 副手攜帶的器材袋陣列
    duty: <LocalizedString> #   可選，副手職責說明
```

**舉例**：

```yaml
crew:
  lead:
    role: lead
    carries: [hand, aed, jumpkit]
    duty: { zh-Hant: 評估、CPR、AED 操作 }
  assist:
    role: assist
    carries: [hand, o2kit]
    duty: { zh-Hant: BVM 通氣、通報 }
```

### Phases（階段陣列）

```yaml
phases:
  - id: <string> # ✓ 必填，階段識別符
    narrative: <LocalizedString> # ✓ 必填，旁白文本
    required: <RequiredAction[]> # ✓ 必填，必要動作陣列（可空）
    timeout: <number> # ✓ 必填，超時秒數（最少 5）
    on_skip: <OnSkip> # ✓ 必填，超時處置
    hint: <LocalizedString> #   可選，遊戲內提示
    illustration: <string> #   可選，此 phase 專用插畫
```

#### Phase 參數詳解

| 參數           | 型別             | 必填 | 說明                           | 舉例                            |
| -------------- | ---------------- | ---- | ------------------------------ | ------------------------------- |
| `id`           | string           | ✓    | 階段識別符，英文，唯一非空     | `arrival`, `cpr`, `aed`         |
| `narrative`    | LocalizedString  | ✓    | 旁白文本，玩家看到的故事情節   | `{ zh-Hant: 病人倒臥... }`      |
| `required`     | RequiredAction[] | ✓    | 必要動作陣列；可空但通常有內容 | 見下方                          |
| `timeout`      | number           | ✓    | 秒數上限；最小值 5             | `30`, `60`                      |
| `on_skip`      | OnSkip           | ✓    | 超時時的回應（惡化、說明）     | 見下方                          |
| `hint`         | LocalizedString  |      | 遊戲內提示（玩家卡關時顯示）   | `{ zh-Hant: 先評估... }`        |
| `illustration` | string           |      | 此 phase 專用插畫；覆蓋頂層    | `/illustrations/scenes/cpr.png` |

#### RequiredAction（必要動作）

```yaml
required:
  - { action_id: <string>, by?: <ActorRole>, set_flag?: <string> }
```

| 欄位        | 必填 | 型別                  | 說明                                                     | 舉例                         |
| ----------- | ---- | --------------------- | -------------------------------------------------------- | ---------------------------- |
| `action_id` | ✓    | string                | **推薦**：對應 actions.yml 的 id                         | `assess_safety`, `cpr_adult` |
| `action`    |      | string                | **已棄用**：中文 label（需執行遷移指令更新為 action_id） | `評估現場安全`（舊）         |
| `by`        |      | `player` \| `partner` | 執行者限制；省略表示任何人                               | `player`, `partner`          |
| `set_flag`  |      | string                | 完成後設定的旗標名稱，供 outcome 條件使用                | `已電擊`, `初評完成`         |

**舉例**（推薦用法）：

```yaml
required:
  - { action_id: assess_safety } # 任何人可執行
  - { action_id: put_on_gloves_mask } # 任何人
  - { action_id: cpr_adult, by: player } # 只有玩家
  - { action_id: call_dispatch, by: partner } # 只有同伴 AI
  - { action_id: aed_shock, set_flag: 已電擊 } # 完成後設旗標
```

#### OnSkip（超時處置）

```yaml
on_skip:
  worsen: <number> # ✓ 必填，惡化等級（0 ~ 3）
  note: <LocalizedString> # ✓ 必填，解釋文本
  flags: <string[]> #   可選，超時時設定的旗標
```

| 欄位     | 型別            | 必填 | 說明                                         | 舉例                            |
| -------- | --------------- | ---- | -------------------------------------------- | ------------------------------- |
| `worsen` | number          | ✓    | 惡化程度（0 = 無、1 = 輕、2 = 中、3 = 嚴重） | `1`, `2`                        |
| `note`   | LocalizedString | ✓    | 超時原因與後果說明                           | `{ zh-Hant: 延遲 CPR 導致... }` |
| `flags`  | string[]        |      | 超時時自動設定的旗標（罕見）                 | `['patient_worsened']`          |

### Outcomes（結局陣列）

```yaml
outcomes:
  - id: <string> # ✓ 必填，結局識別符
    when: <string> # ✓ 必填，條件字串
    title: <LocalizedString> # ✓ 必填，結局標題
    text: <LocalizedString> # ✓ 必填，結局敘述
    illustration: <string> #   可選，結局插畫
```

#### Outcome 參數詳解

| 參數           | 型別            | 必填 | 說明                   | 舉例                               |
| -------------- | --------------- | ---- | ---------------------- | ---------------------------------- |
| `id`           | string          | ✓    | 結局識別符，唯一       | `success`, `rosc`, `doa`           |
| `when`         | string          | ✓    | 條件語法（見下方速查） | `正確率>=0.9 且 已電擊`            |
| `title`        | LocalizedString | ✓    | 結局名稱               | `{ zh-Hant: 復甦成功 }`            |
| `text`         | LocalizedString | ✓    | 結局詳細敘述           | `{ zh-Hant: 患者恢復自主循環... }` |
| `illustration` | string          |      | 結局插畫路徑           | `/illustrations/scenes/rosc.png`   |

⚠️ **必須有且只有一個** `when: 預設` 的 outcome 作為兜底，通常放在最後。

**舉例**：

```yaml
outcomes:
  - id: excellent
    when: 正確率>=0.95 且 已電擊
    title: { zh-Hant: 優秀 }
    text: { zh-Hant: 救護技術熟練... }

  - id: good
    when: 正確率>=0.8 且 已電擊
    title: { zh-Hant: 良好 }
    text: { zh-Hant: 救護流程完整... }

  - id: default
    when: 預設
    title: { zh-Hant: 完成 }
    text: { zh-Hant: 請檢視時間軸了解細節... }
```

---

## Techniques (單項技術)

**檔案位置**：`data/techniques/<id>.yml`

### 頂層結構

```yaml
id: <string> # ✓ 必填，snake_case，與檔名一致
schema_version: <number> # ✓ 必填，目前為 1
title: <LocalizedString> # ✓ 必填，技術名稱
description: <LocalizedString> #   可選，簡短說明
body_region: <BodyRegion> #   可選，主要操作部位
illustration: <string> #   可選，操作示意圖
steps: <TechniqueStep[]> # ✓ 必填，步驟陣列（至少 1 個）
hidden: <boolean> #   可選，預設 false
```

### 參數詳解

| 參數             | 型別            | 必填 | 說明                          | 舉例                               |
| ---------------- | --------------- | ---- | ----------------------------- | ---------------------------------- |
| `id`             | string          | ✓    | 英文 snake_case，與檔名一致   | `cervical_collar`                  |
| `schema_version` | number          | ✓    | 目前為 `1`                    | `1`                                |
| `title`          | LocalizedString | ✓    | 技術名稱                      | `{ zh-Hant: 上頸圈 }`              |
| `description`    | LocalizedString |      | 技術目的或簡介                | `{ zh-Hant: 穩定頸椎... }`         |
| `body_region`    | BodyRegion      |      | 主要操作部位                  | `neck`                             |
| `illustration`   | string          |      | 操作示意圖路徑                | `/illustrations/scenes/collar.png` |
| `steps`          | TechniqueStep[] | ✓    | 步驟陣列                      | 見下方                             |
| `hidden`         | boolean         |      | 預設 false；true 時在選單隱藏 | `false`                            |

### TechniqueStep（步驟）

```yaml
steps:
  - id: <string> # ✓ 必填，步驟識別符
    action_id: <string> # ✓ 推薦，對應 actions.yml 的 id
    tip: <LocalizedString> #   可選，錯誤提示
```

| 欄位        | 型別            | 必填 | 說明                                                     | 舉例                             |
| ----------- | --------------- | ---- | -------------------------------------------------------- | -------------------------------- |
| `id`        | string          | ✓    | 英文識別符，穩定不可改                                   | `ppe`, `positioning`, `assembly` |
| `action_id` | string          | ✓    | **推薦**：對應 actions.yml 的 id                         | `put_on_gloves_mask`             |
| `action`    | string          |      | **已棄用**：中文 label（需執行遷移指令更新為 action_id） | `戴手套口罩`（舊）               |
| `tip`       | LocalizedString |      | 當錯誤累計 ≥2 次時顯示的提示                             | `{ zh-Hant: 確保面罩密封... }`   |

**舉例**（推薦用法）：

```yaml
id: cervical_collar
schema_version: 1
title: { zh-Hant: 上頸圈 }
description: { zh-Hant: 脊椎損傷患者固定頸椎 }
body_region: neck
illustration: /illustrations/scenes/collar.png

steps:
  - id: ppe
    action_id: put_on_gloves_mask
    tip: { zh-Hant: BSI 優先 }

  - id: assess
    action: 評估脊椎損傷風險
    tip: { zh-Hant: 詢問機制與症狀 }

  - id: position
    action: 固定頸椎位置
    tip: { zh-Hant: 雙手穩定頸部 }

  - id: apply
    action: 固定頸圈
    tip: { zh-Hant: 確保頸圈貼合 }
```

---

## 條件語法速查

用於 `outcomes[].when` 欄位。

| 語法        | 說明               | 舉例                          | 成立條件                    |
| ----------- | ------------------ | ----------------------------- | --------------------------- |
| `預設`      | 兜底條件，永遠成立 | `when: 預設`                  | **必須恰好有一個且放最後**  |
| `旗標名稱`  | 旗標存在           | `when: 已電擊`                | `set_flag: 已電擊` 曾被設定 |
| `正確率>=N` | 正確動作占比 ≥ N   | `when: 正確率>=0.9`           | 正確 ÷ 總動作 ≥ 0.9         |
| `A 且 B`    | 兩個條件同時成立   | `when: 正確率>=0.8 且 已電擊` | A ∧ B                       |
| `A 或 B`    | 任一條件成立       | `when: 已電擊 或 已通報`      | A ∨ B                       |

**複合條件範例**：

```yaml
outcomes:
  - id: perfect
    when: 正確率>=0.95 且 已電擊 且 已通報
    title: { zh-Hant: 完美 }
    text: { zh-Hant: 所有流程均無誤... }

  - id: good
    when: (正確率>=0.8 且 已電擊) 或 (正確率>=0.9 且 未超時)
    title: { zh-Hant: 良好 }
    text: { zh-Hant: 救護技術良好... }

  - id: default
    when: 預設
    title: { zh-Hant: 完成 }
    text: { zh-Hant: 請檢視時間軸學習... }
```

**邏輯優先級**：`且` > `或`（先計算 A 且 B，再計算結果 或 C）

---

## 常用值列舉

### LocalizedString（可翻譯字串）

```yaml
# 單行 locale map（推薦）
title: { zh-Hant: 路倒成人救護 }

# 多行 locale map（含其他語言）
title:
  zh-Hant: 路倒成人救護
  en: Adult OHCA on Street

# Block scalar（多行長文字）
narrative:
  zh-Hant: >
    你抵達現場，發現一名中年男子倒臥在步道旁。
    周圍有民眾聚集，你需要先評估環境安全。
```

**必須含 `zh-Hant` 鍵；其他 locale 選填。**

### BagId（器材袋）完整列舉

```
hand      # 雙手與基本裝備
o2kit     # 氧氣套組
jumpkit   # 快速急救包
aed       # 自動體外心臟電擊器
vehicle   # 救護車專用設備
```

### Role（角色）完整列舉

```
lead      # 主手（隊長）
assist    # 副手
either    # 任何角色（scenario 用）
```

### BodyRegion（身體部位）完整列舉

```
head      # 頭部（眼、耳、口、鼻）
neck      # 頸部（氣道、動脈、脊椎）
chest     # 胸部（心肺、肋骨）
wrist     # 腕部（脈搏、血壓、血氧）
abdomen   # 腹部
leg       # 腿部
arm       # 手臂
general   # 全身性動作
```

### ActorRole（執行者角色）

```
player    # 玩家
partner   # AI 同伴
either    # 任何人（省略時預設）
```

---

## 驗證清單

新增或修改內容前，檢查：

- [ ] 所有 `id` 為英文 snake_case
- [ ] 所有可翻譯欄位包含 `zh-Hant` 鍵
- [ ] scenario/technique 中引用的 action 名稱與 actions.yml 完全一致
- [ ] scenario 的 `phases` 有 ≥1 個
- [ ] scenario 的 `outcomes` 有且只有 1 個 `when: 預設` 兜底
- [ ] scenario 的 `phases[].timeout` ≥ 5
- [ ] technique 的 `steps` 有 ≥1 個
- [ ] 執行 `npm run validate:content` 通過

---

## 常見錯誤與修正

| 錯誤                          | 原因                      | 修正                                   |
| ----------------------------- | ------------------------- | -------------------------------------- |
| `找不到動作「xxx」`           | scenario 引用的動作不存在 | 檢查 label 是否與 actions.yml 完全一致 |
| `可翻譯欄位必須含 zh-Hant`    | 使用純字串而非 locale map | 改為 `{ zh-Hant: "..." }`              |
| `逾時秒數過短`                | timeout < 5               | 改為 ≥5 的值                           |
| `outcomes 必須有「預設」兜底` | 缺少 `when: 預設`         | 在最後加 `when: 預設` 的 outcome       |
| `id 重複`                     | 同一檔案內 id 重複        | 修改其中一個 id                        |
| `schema_version 必須為 1`     | 版本號錯誤                | 改為 `1`                               |

---

## 快速複製範本

### 新動作範本

```yaml
- id: my_action
  label: { zh-Hant: 我的動作 }
  bag: hand
  default_role: lead
  body_region: general
  icon: IconName
  explain: { zh-Hant: 這個動作的說明 }
```

### 新情境範本

```yaml
id: my_scenario
schema_version: 1
title: { zh-Hant: 我的情境 }
player_role: either
illustration: /illustrations/scenes/my_scene.png

patient_initial:
  consciousness: { zh-Hant: 清醒 }
  breath: { zh-Hant: 正常 }
  pulse: { zh-Hant: 規則 }

crew:
  lead:
    role: lead
    carries: [hand, jumpkit]
    duty: { zh-Hant: 評估、決策 }
  assist:
    role: assist
    carries: [hand, o2kit]
    duty: { zh-Hant: 協助、紀錄 }

phases:
  - id: phase1
    narrative: { zh-Hant: 情節開始... }
    required:
      - { action_id: check_scene_safe }
      - { action_id: wear_ppe, by: player }
    timeout: 30
    on_skip:
      worsen: 1
      note: { zh-Hant: 超時原因 }
    hint: { zh-Hant: 遊戲提示 }

outcomes:
  - id: success
    when: 正確率>=0.9
    title: { zh-Hant: 成功 }
    text: { zh-Hant: 結局敘述 }

  - id: default
    when: 預設
    title: { zh-Hant: 完成 }
    text: { zh-Hant: 預設結局 }
```

### 新單項範本

```yaml
id: my_technique
schema_version: 1
title: { zh-Hant: 我的技術 }
description: { zh-Hant: 技術說明 }
body_region: general
illustration: /illustrations/scenes/my_technique.png

steps:
  - id: step1
    action_id: check_airway
    tip: { zh-Hant: 確認氣道暢通後再進行 }

  - id: step2
    action_id: manual_inline_stabilization
    tip: { zh-Hant: 雙手穩定頸部不動 }
```
