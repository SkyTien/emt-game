# technique-engine Spec Delta

## ADDED Requirements

### Requirement: 單項初始化

`TechniqueEngine` SHALL 以已驗證的單項資料初始化,狀態為 `stepIndex: 0`、`wrongTries: 0`、`finished: false`。

#### Scenario: 初始化頸圈單項

- **GIVEN** 已驗證的「上頸圈」單項資料,`steps` 共 5 步
- **WHEN** 呼叫 `engine.init(technique)`
- **THEN** 回傳狀態 `stepIndex: 0, wrongTries: 0, finished: false`

### Requirement: 動作順序驗證

`TechniqueEngine` SHALL 在玩家執行動作時,比對是否為當前 `stepIndex` 應做的動作;正確則推進 stepIndex,錯誤則累加 `wrongTries` 並回傳提示。

#### Scenario: 正確順序動作推進

- **GIVEN** stepIndex=0,第 0 步應做「戴手套」
- **WHEN** 玩家執行「戴手套」
- **THEN** stepIndex 推進到 1,`wrongTries` 不變

#### Scenario: 錯誤順序不推進但累加錯誤

- **GIVEN** stepIndex=0,第 0 步應做「戴手套」,第 1 步為「徒手頸椎固定」
- **WHEN** 玩家執行「徒手頸椎固定」
- **THEN** stepIndex 仍為 0
- **AND** `wrongTries` 從 0 變為 1
- **AND** 回傳 feedback「順序不對,請先完成前面的步驟」

#### Scenario: 不在步驟清單中的動作

- **GIVEN** 上頸圈單項,steps 中無「胸外按壓」
- **WHEN** 玩家執行「胸外按壓」
- **THEN** `wrongTries` 累加
- **AND** feedback「此動作非本單項步驟」

### Requirement: 提示漸進揭露

`TechniqueEngine` SHALL 僅在同一步驟累計錯誤達 2 次以上時,才顯示該步驟的 `tip`,避免玩家一開始就被劇透正確答案。

#### Scenario: 首次錯誤不給 tip

- **GIVEN** stepIndex=2,該步驟有 `tip: "量測下顎角到斜方肌"`
- **WHEN** 玩家第 1 次做錯
- **THEN** feedback 不含 tip,僅提示「順序不對/動作不適用」

#### Scenario: 累計錯 2 次後給 tip

- **GIVEN** 同上,玩家已在該步驟錯 2 次
- **WHEN** 玩家第 3 次嘗試仍錯
- **THEN** feedback 包含該步驟的 tip

### Requirement: 完成判定與星等

`TechniqueEngine` SHALL 在所有步驟完成後將 `finished` 設為 true,並依 `wrongTries` 計算星等:0 錯 = 3 星、1~2 錯 = 2 星、3 錯以上 = 1 星,只要完成皆算通過。

#### Scenario: 全對拿 3 星

- **GIVEN** 玩家依序正確完成 5 步,`wrongTries: 0`
- **WHEN** 完成最後一步
- **THEN** `finished: true`
- **AND** `engine.getStars()` 回傳 3

#### Scenario: 錯 1 次拿 2 星

- **GIVEN** 玩家完成所有步驟,全程 `wrongTries: 1`
- **WHEN** 完成最後一步
- **THEN** `engine.getStars()` 回傳 2

#### Scenario: 錯 4 次拿 1 星

- **GIVEN** 玩家完成所有步驟,全程 `wrongTries: 4`
- **WHEN** 完成最後一步
- **THEN** `engine.getStars()` 回傳 1

#### Scenario: 未完成不給星等

- **GIVEN** 玩家尚在第 3 步
- **WHEN** 呼叫 `engine.getStars()`
- **THEN** 回傳 `null` 或拋出錯誤,表示單項尚未完成
