# mvp-content Spec Delta

## ADDED Requirements

### Requirement: MVP 動作總表涵蓋範圍

`data/actions.yml` SHALL 至少涵蓋 MVP 三情境與一單項所需的所有動作,且每個動作皆經教學審稿標記袋子歸屬與預設角色。

#### Scenario: OHCA 情境所需動作齊備

- **GIVEN** MVP 動作總表已完成
- **WHEN** 載入「路倒成人 OHCA」情境並驗證
- **THEN** 所有 phase required 中的動作名皆可反查到對應定義
- **AND** 至少包含:評估現場安全、戴手套、檢查意識 AVPU、檢查呼吸 10 秒、檢查脈搏、請求支援、徒手打開呼吸道、BVM 通氣、胸外按壓、AED 貼電極、AED 開機、AED 分析、AED 電擊、ISBAR 交班

#### Scenario: 創傷情境所需動作齊備

- **GIVEN** 同上
- **WHEN** 載入「機車事故多重外傷」情境並驗證
- **THEN** 至少包含:評估現場安全、戴手套、徒手頸椎固定、量測頸圈尺寸、套上頸圈、長背板翻身(log roll)、綁長背板固定帶、頭部固定器、大量出血評估、止血繃帶、三角巾包紮、骨折評估、夾板固定、送醫

#### Scenario: 低血糖情境所需動作齊備

- **GIVEN** 同上
- **WHEN** 載入「低血糖合併意識改變」情境並驗證
- **THEN** 至少包含:評估現場安全、戴手套、檢查意識 AVPU、SAMPLE 病史、血糖監測、辛辛那提中風指標、氧氣鼻導管、送醫決策

### Requirement: 單項「上頸圈」內容

`data/techniques/cervical_collar.yml` SHALL 以正確順序列出上頸圈的步驟,並在每一步附上教學 tip,讓錯 2 次後可揭露。

#### Scenario: 上頸圈單項合法可玩

- **GIVEN** `data/techniques/cervical_collar.yml` 已寫入
- **WHEN** 載入並驗證
- **THEN** 驗證通過
- **AND** 步驟依序包含:戴手套 → 徒手頸椎固定 → 量測頸圈尺寸 → 套上頸圈 → 確認固定
- **AND** 每步皆附 tip

### Requirement: 情境「路倒成人 OHCA」內容

`data/scenarios/ohca_adult_street.yml` SHALL 覆蓋 OHCA 完整流程:抵達現場 → 現場評估 → 初步評估 → 啟動 CPR → AED 操作 → 持續 CPR/ALS 接手 → ISBAR 交班,並定義 3~4 個結局(ROSC、送醫救回、DOA、失敗)。

#### Scenario: OHCA 情境可完整走完

- **GIVEN** 情境已寫入並通過驗證
- **WHEN** 玩家以扮演主手身分全程正確執行,且 AED 電擊成功
- **THEN** 結局為 `rosc`
- **AND** 時間軸含所有 phase 完成事件

#### Scenario: OHCA 情境可扮演副手

- **GIVEN** 同情境,玩家選擇扮演副手
- **WHEN** 遊戲進行
- **THEN** 工具箱預設顯示副手攜帶袋子(急救包 + AED)的動作可用
- **AND** 主手(由 AI 控制)自動執行氣道/評估/BVM 相關動作

### Requirement: 情境「機車事故多重外傷」內容

`data/scenarios/motorcycle_trauma.yml` SHALL 覆蓋創傷處理流程:現場安全(交通管制)→ 徒手頸椎 → ABC 評估 → 止血 → 骨折固定 → 頸圈 → 長背板 → 送醫,並涵蓋創傷特殊注意事項。

#### Scenario: 創傷情境正確順序結局

- **GIVEN** 情境已寫入並通過驗證
- **WHEN** 玩家依序完成頸椎保護 → 止血 → 骨折固定 → 長背板 → 送醫
- **THEN** 結局為「順利送醫後續復原」

#### Scenario: 創傷情境忘了頸椎保護

- **GIVEN** 同情境
- **WHEN** 玩家未於第一時間做徒手頸椎固定,直接處理出血
- **THEN** 觸發 `on_skip`,`patientWorsen` 增加,note 說明「頸椎損傷風險未排除,後續翻身可能加重傷害」
- **AND** 最終結局可能為「送醫後神經功能下降」而非最佳結局

### Requirement: 情境「低血糖合併意識改變」內容

`data/scenarios/hypoglycemia_stroke_rule_out.yml` SHALL 呈現中老年糖尿病人意識改變情境,核心教學為「血糖必先於中風指標」的鑑別診斷流程。

#### Scenario: 低血糖情境正確鑑別

- **GIVEN** 情境已寫入並通過驗證
- **WHEN** 玩家依序:現場安全 → AVPU → 血糖檢查(發現血糖 45 mg/dL)→ 送醫
- **THEN** 結局為「送醫途中意識恢復」

#### Scenario: 玩家先做中風指標未先測血糖

- **GIVEN** 同情境
- **WHEN** 玩家先做辛辛那提中風指標而未測血糖
- **THEN** 觸發 `on_skip`,note 說明「意識改變先排除低血糖是 EMT 基本鑑別診斷」
- **AND** 時間軸記錄此延誤

### Requirement: 劇情合理性審稿

所有 MVP 情境與單項 YAML SHALL 經教學審稿人(PO)審過,審稿結果記錄於對應 PR 的 commit message 或 review note,確保劇情與惡化因果醫學合理。

#### Scenario: PR 無審稿註記不得合併

- **GIVEN** 某 PR 新增或修改 `data/scenarios/*.yml` 或 `data/techniques/*.yml`
- **WHEN** PR 進行 review
- **THEN** PR 必須包含「資料來源」與「審稿者」欄位
- **AND** CI 會跑 `validateScenario` / `validateTechnique` 作為第二層守門
