# Action 參考表

本表自動從 `data/actions/actions.yml` 生成，列出所有可用的 action ID 及其對應的中文標籤。

**使用方式**：在 scenario 或 technique YAML 中，使用 `action_id` 欄位引用下表的 `ID` 欄。

## 手邊物品 (`hand`)

| ID                            | 標籤 (zh-Hant)        | 身體部位 | 預設角色 | 說明                                                                |
| ----------------------------- | --------------------- | -------- | -------- | ------------------------------------------------------------------- |
| `ask_chief_complaint`         | 詢問主訴              | head     | lead     | SAMPLE 史:S/A/M/P/L/E,先問主訴與發病經過                            |
| `assess_abc`                  | 快速 ABC 評估         | general  | lead     | A 暢通 / B 呼吸 / C 循環,3 秒內排序威脅生命的問題                   |
| `call_113_dispatch`           | 通報通訊指揮中心      | general  | assist   | —                                                                   |
| `check_airway`                | 確認氣道暢通          | neck     | —        | 確認是否有異物或壓迫,有無異常呼吸音                                 |
| `check_breath`                | 看呼吸起伏            | chest    | lead     | 5~10 秒內判斷有無正常呼吸,異常呼吸視同無呼吸                        |
| `check_consciousness_avpu`    | 拍肩呼喚評估意識 AVPU | head     | lead     | A 警覺 / V 對聲音反應 / P 對痛刺激反應 / U 無反應                   |
| `check_pulse_carotid`         | 檢查頸動脈脈搏        | neck     | lead     | 同步看呼吸測脈搏,5~10 秒內完成                                      |
| `check_pulse_radial`          | 檢查橈動脈脈搏        | wrist    | —        | —                                                                   |
| `check_pupils`                | 檢查瞳孔              | head     | —        | 檢查瞳孔大小、對光反應及是否對稱,評估中樞神經狀況                   |
| `check_scene_safe`            | 評估現場安全          | general  | lead     | 「五安一移」中的安全評估,確認交通、瓦斯、墜落等危害排除後再接近病人 |
| `check_skin_signs`            | 檢查皮膚徵象          | general  | —        | 評估微循環:檢查體溫（濕冷/溫暖）、色澤（蒼白/發紺/紅潤）            |
| `cpr_compress_adult`          | 成人胸外按壓          | chest    | lead     | 速率 100~120 次/分,深度 5~6 cm,完全回彈,中斷不超過 10 秒            |
| `declare_critical`            | 判斷為危急個案        | general  | —        | 初評完成後,依意識、呼吸、循環異常與否決定是否立即送醫               |
| `declare_stable`              | 判斷為非危急個案      | general  | —        | 初評完成且無危急徵象                                                |
| `isbar_handoff`               | ISBAR 交班            | general  | lead     | I 自我介紹 / S 病情 / B 病史 / A 評估 / R 建議,清楚簡潔             |
| `manual_inline_stabilization` | 徒手固定頭部          | head     | assist   | 雙手扶住頭兩側保持中立位,直到頸圈套上                               |
| `physical_exam`               | 全身身體檢查          | general  | —        | 從頭到腳快速檢查有無其餘傷病、腫脹或壓痛                            |
| `sample_history`              | 詢問 SAMPLE 病史      | general  | —        | 詢問 症狀/過敏/藥物/病史/最後一餐/事件經過                          |
| `secondary_survey`            | 二度評估全身          | general  | —        | 從頭到腳系統性觸診、視診,搜尋隱性出血或骨折                         |
| `stroke_cps_assess`           | 辛辛那提中風指標 CPSS | head     | lead     | 臉部 / 肢體 / 言語三項中有一項異常就視為中風,須先排除低血糖         |
| `wear_ppe`                    | 戴手套口罩            | general  | —        | BSI:接觸病人前必戴手套口罩                                          |

## 氧氣套組 (`o2kit`)

| ID                     | 標籤 (zh-Hant) | 身體部位 | 預設角色 | 說明                                                   |
| ---------------------- | -------------- | -------- | -------- | ------------------------------------------------------ |
| `bvm_ventilate`        | BVM 給氧通氣   | head     | assist   | 30:2 或 10 秒一次(高級氣道下),避免過度通氣             |
| `connect_o2`           | 接氧氣瓶       | general  | assist   | —                                                      |
| `nasal_cannula_oxygen` | 鼻管給氧       | head     | assist   | 將鼻管置於患者鼻腔，給予低濃度氧氣，流量通常 1~4 L/min |

## 進階套組 (`jumpkit`)

| ID                          | 標籤 (zh-Hant) | 身體部位 | 預設角色 | 說明                                                     |
| --------------------------- | -------------- | -------- | -------- | -------------------------------------------------------- |
| `blood_glucose_test`        | 量血糖         | wrist    | lead     | 意識改變病人應 routine 量血糖,小於 60 mg/dL 即視為低血糖 |
| `cervical_collar_apply`     | 套上頸圈       | neck     | lead     | 由下往上套,後片先就位、前片包覆固定,黏扣帶確實貼緊       |
| `cervical_collar_pick_size` | 挑選頸圈尺寸   | neck     | —        | 量下顎到肩膀的指距(通常 2~4 指),選對應頸圈               |
| `control_bleeding_pressure` | 直接加壓止血   | leg      | —        | 紗布或乾淨布料覆蓋傷口,以掌根直接加壓                    |
| `long_board_immobilize`     | 上長背板       | general  | lead     | 維持脊椎中立位翻身上板,綁帶順序:胸→骨盆→大腿→小腿→頭     |
| `measure_bp`                | 量測血壓       | arm      | —        | 測量收縮壓與舒張壓以評估血循狀態                         |
| `measure_spo2`              | 量測血氧       | wrist    | —        | 測量血氧飽和度 (SpO2),確認有無缺氧                       |
| `oral_glucose_give`         | 口服葡萄糖     | head     | lead     | 病人意識清楚且能吞嚥才可給予,昏迷者禁口服                |
| `splint_extremity`          | 副木固定肢體   | leg      | —        | 固定範圍涵蓋傷處上下兩個關節                             |

## AED (`aed`)

| ID            | 標籤 (zh-Hant) | 身體部位 | 預設角色 | 說明                                                    |
| ------------- | -------------- | -------- | -------- | ------------------------------------------------------- |
| `aed_analyze` | 啟動 AED 分析  | chest    | lead     | —                                                       |
| `aed_attach`  | 貼 AED 電擊片  | chest    | assist   | 一片右上鎖骨下、一片左下乳線外,皮膚乾燥、移除金屬與貼片 |
| `aed_shock`   | AED 電擊       | chest    | lead     | 大喊「我清、你清、大家清」,確認無人接觸後按下電擊鈕     |

## 車輛 (`vehicle`)

| ID                      | 標籤 (zh-Hant) | 身體部位 | 預設角色 | 說明                                          |
| ----------------------- | -------------- | -------- | -------- | --------------------------------------------- |
| `load_into_ambulance`   | 移送上救護車   | general  | lead     | —                                             |
| `scene_traffic_control` | 設置現場警示   | general  | assist   | 警示燈、三角錐、引導圍觀群眾後退,避免二次事故 |
| `transport_to_hospital` | 送醫           | general  | lead     | —                                             |
