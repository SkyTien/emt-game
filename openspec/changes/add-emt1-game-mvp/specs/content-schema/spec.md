# content-schema Spec Delta

## ADDED Requirements

### Requirement: 穩定結構 id

所有關卡結構元素(情境/單項/動作/phase/outcome/step)SHALL 以穩定識別 `id` 為主鍵;`id` 一經指定不得在後續版本任意更動,以維持內容的可翻譯性與向前相容。

#### Scenario: phase.id 是穩定字串

- **GIVEN** 情境 YAML 中 `phases[0].id: arrival`
- **WHEN** 新增英文翻譯或其他版本
- **THEN** `id: arrival` 保持不變(不會改成 `scene_arrival` 或中文)
- **AND** 其他地方(outcomes 條件、時間軸 log、progress 記錄)引用此 phase 都透過此穩定 id

### Requirement: 可翻譯字串採 locale map

所有**可翻譯**的字串欄位 SHALL 以 **locale map** 結構儲存(鍵為 BCP-47 locale 代碼,值為對應字串),不以單一字串儲存;`zh-Hant` 為 MVP 必填 locale,其他 locale 為選填。

**可翻譯欄位清單(MVP 範圍)**:

- `action.label`、可選 `action.explain`
- `scenario.title`、`phase.narrative`、`phase.on_skip.note`
- `outcome.title`、`outcome.text`
- `technique.title`、`technique.description`、`step.tip`

**非可翻譯欄位(不可做 locale map)**:

- 所有 `id`、`bag`、`default_role`、`body_region`、`icon`、`difficulty`、`timeout`、`order`、`required`、`when` 條件式、`player_role`、`crew.*.攜帶`

#### Scenario: 合法的動作總表範例(含 locale map)

- **GIVEN** 以下 `data/actions.yml` 內容:
  ```yaml
  categories:
    - name: 現場安全
      actions:
        - id: scene_safety
          label:
            zh-Hant: 評估現場安全
          bag: hand
          default_role: any
        - id: ppe_gloves
          label:
            zh-Hant: 戴手套
          bag: hand
          default_role: any
    - name: 呼吸道
      actions:
        - id: opa_insert
          label:
            zh-Hant: 置入 OPA 口咽呼吸道
          bag: jumpkit
          default_role: lead
          body_region: head
  ```
- **WHEN** 系統讀取此檔案
- **THEN** 三個動作成功註冊,MVP locale(`zh-Hant`)label 可反查到對應 id

#### Scenario: 未來加入 en 翻譯不需改結構

- **GIVEN** 同一個動作加入英文:
  ```yaml
  - id: scene_safety
    label:
      zh-Hant: 評估現場安全
      en: Assess scene safety
    bag: hand
    default_role: any
  ```
- **WHEN** 系統讀取並切換 locale 為 `en`
- **THEN** 動作顯示文字切為 "Assess scene safety"
- **AND** 動作 `id`(scene_safety)不變,所有引用處無需修改

#### Scenario: 缺少 zh-Hant 被驗證拒絕

- **GIVEN** 某動作 `label: { en: "Assess scene safety" }`(缺 zh-Hant)
- **WHEN** 執行驗證
- **THEN** 回傳錯誤,訊息指出動作 id 與「label 缺少必要 locale `zh-Hant`」

#### Scenario: 字串型態向後相容讀取

- **GIVEN** 舊版 YAML 某欄位寫成純字串 `label: 評估現場安全`(無 locale map)
- **WHEN** Loader 讀取
- **THEN** 視為 `{ zh-Hant: "評估現場安全" }` 並發出 deprecation warning
- **AND** 引擎正常運作

### Requirement: 情境 YAML 格式

系統 SHALL 接受 `data/scenarios/<id>.yml` 以 YAML 格式描述情境關卡,包含 `id`、`title`、`difficulty`、`player_role`、`patient`(初始生命徵象)、`crew`(主手/副手攜帶袋子)、`phases`(多階段劇本)、`outcomes`(結局清單)。

#### Scenario: 合法的最小情境範例

- **GIVEN** 以下 `data/scenarios/demo.yml` 內容:
  ```yaml
  id: demo
  title:
    zh-Hant: 示範情境
  difficulty: 1
  player_role: 兩者皆可
  patient:
    age: 58
    sex: 男
    consciousness: U
    breathing: 瀕死式
    pulse: 無
  crew:
    主手: { 攜帶: [三合一氧氣] }
    副手: { 攜帶: [急救包, AED] }
  phases:
    - id: arrival
      narrative:
        zh-Hant: 你抵達現場。
      required: [評估現場安全, 戴手套]
      order: 任意
      timeout: 45
      on_skip:
        worsen: 1
        note:
          zh-Hant: 你忘了觀察交通
  outcomes:
    - id: passed
      title:
        zh-Hant: 通關
      when: 預設
  ```
- **WHEN** 系統讀取並驗證此情境
- **THEN** 驗證通過,情境可被載入與啟動
- **AND** `phases[0].id === "arrival"` 為穩定識別
- **AND** 所有可翻譯欄位皆為 locale map 結構

### Requirement: 單項 YAML 格式

系統 SHALL 接受 `data/techniques/<id>.yml` 以 YAML 格式描述單項關卡,包含 `id`、`title`、`description`、`illustration`、`steps`(按序排列的步驟清單,每步有 `action`(中文 label)與可選 `tip`)。

#### Scenario: 合法的單項範例

- **GIVEN** 以下 `data/techniques/cervical_collar.yml` 內容:
  ```yaml
  id: cervical_collar
  title: 上頸圈
  description: 疑似頸椎損傷患者的頸圈固定
  illustration: cervical_collar_scene
  steps:
    - action: 戴手套
      tip: 接觸前必備
    - action: 徒手頸椎固定
      tip: 頸圈上之前先徒手固定
    - action: 量測頸圈尺寸
    - action: 套上頸圈
    - action: 確認固定
  ```
- **WHEN** 系統讀取並驗證此單項
- **THEN** 驗證通過,玩家必須按 `steps` 順序選出對應動作

### Requirement: 情境硬性驗證

系統 SHALL 在載入情境時進行硬性驗證,違規時拒絕載入並列出所有錯誤,讓內容錯誤在啟動/CI 階段就擋下,不讓玩家玩到一半才壞。

#### Scenario: timeout 過短被拒絕

- **GIVEN** 情境某個 phase 的 `timeout: 3`(小於下限 5 秒)
- **WHEN** 執行 `validateScenario(scenario)`
- **THEN** 回傳錯誤,訊息指出 phase id 與「timeout 須大於等於 5 秒」

#### Scenario: on_skip 缺 note 被拒絕

- **GIVEN** 情境某 phase 有 `on_skip: { worsen: 1 }` 但缺 `note`
- **WHEN** 執行 `validateScenario(scenario)`
- **THEN** 回傳錯誤,訊息指出 phase id 與「on_skip 必須附帶 note 說明惡化原因」

#### Scenario: outcomes 無預設條件被拒絕

- **GIVEN** 情境 outcomes 全部 `when` 條件都是具體判斷式,無 `when: 預設` 兜底
- **WHEN** 執行 `validateScenario(scenario)`
- **THEN** 回傳錯誤,訊息指出「outcomes 必須至少有一個 `when: 預設` 的兜底結局」

#### Scenario: required 動作不存在於動作總表

- **GIVEN** 情境 phase `required: [打病人]`,但動作總表沒這個動作
- **WHEN** 執行 `validateScenario(scenario)`
- **THEN** 回傳錯誤,訊息指出 phase id、未知的動作中文名

#### Scenario: crew 攜帶袋子名稱不合法

- **GIVEN** 情境 crew `主手: { 攜帶: [隨機袋] }`,「隨機袋」不在定義的五類袋子內
- **WHEN** 執行 `validateScenario(scenario)`
- **THEN** 回傳錯誤,訊息指出合法袋子清單

### Requirement: 單項硬性驗證

系統 SHALL 在載入單項時驗證步驟合法性,違規時拒絕載入。

#### Scenario: 步驟動作不存在

- **GIVEN** 單項某個 `step.action: 虛構動作`
- **WHEN** 執行 `validateTechnique(technique)`
- **THEN** 回傳錯誤,訊息指出步驟索引與未知動作名

#### Scenario: 步驟為空

- **GIVEN** 單項 `steps: []`
- **WHEN** 執行 `validateTechnique(technique)`
- **THEN** 回傳錯誤,訊息指出「單項至少要有 1 個步驟」
