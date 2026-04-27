# action-registry Spec Delta

## ADDED Requirements

### Requirement: 動作總表載入

系統 SHALL 在啟動時載入 `data/actions.yml`,將所有可執行動作註冊為唯一真相來源(single source of truth),包含動作中文 label、所屬袋子、預設執行角色、icon 對應。

#### Scenario: 首次啟動載入動作總表

- **GIVEN** `data/actions.yml` 存在且格式合法
- **WHEN** 應用程式啟動
- **THEN** 所有動作以中文 label 為鍵被註冊進 `ActionRegistry`
- **AND** 每個動作可透過中文 label 反查到其 `id`、`bag`、`default_role`、`icon`

#### Scenario: 動作總表格式錯誤時擋下

- **GIVEN** `data/actions.yml` 中有某個動作 `bag` 欄位不在 `hand / o2kit / jumpkit / aed / vehicle` 五個允許值之內
- **WHEN** 應用程式啟動
- **THEN** 系統 SHALL 拋出明確錯誤訊息並停止載入
- **AND** 錯誤訊息指出是哪個動作、哪個欄位、不合法的值

### Requirement: 中文名稱反查

系統 SHALL 提供以中文 label 反查動作 id 的 API,讓情境/單項 YAML 可以直接寫中文動作名而不用寫 id。

#### Scenario: 中文 label 正確反查

- **GIVEN** 動作總表中存在 `label: 檢查意識 AVPU` 的動作,其 `id` 為 `check_consciousness_avpu`
- **WHEN** 呼叫 `registry.resolve("檢查意識 AVPU")`
- **THEN** 回傳該動作完整物件,包含 `id: "check_consciousness_avpu"`

#### Scenario: 中文 label 找不到對應動作

- **GIVEN** 動作總表沒有 label 為 `幫病人禱告` 的動作
- **WHEN** 呼叫 `registry.resolve("幫病人禱告")`
- **THEN** 回傳 `null` 或拋出 `UnknownActionError`,錯誤訊息包含原始中文字串

### Requirement: 按袋子與類別查詢

系統 SHALL 提供按袋子(bag)與語意類別(category)查詢動作的 API,供 UI 工具箱分頁使用。

#### Scenario: 查詢急救包中所有動作

- **GIVEN** 動作總表已載入
- **WHEN** 呼叫 `registry.byBag("jumpkit")`
- **THEN** 回傳所有 `bag === "jumpkit"` 的動作清單

#### Scenario: 查詢胸部可做的動作

- **GIVEN** 動作總表中,動作可標註 `body_region: chest` 等屬性
- **WHEN** 呼叫 `registry.byBodyRegion("chest")`
- **THEN** 回傳胸部相關動作(呼吸觀察、聽診、CPR 按壓、AED 貼電極等)
