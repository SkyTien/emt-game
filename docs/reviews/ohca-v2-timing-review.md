# OHCA v2 計時與中斷審查

- 狀態：已核可
- 提案日期：2026-07-24
- 核可日期：2026-07-24
- 預計內容 ID：`ohca_adult_timed_v2`

## 審查目的

這份文件只確認 OHCA v2 垂直切片的臨床順序、遊戲計時與中斷語意。所有
`duration_seconds` 都是「玩家在任務軌上被占用的模擬時間」，不是 EMT
術科技術測驗的標準完成秒數，也不能當成真實現場的處置時限。

核可前不得：

- 在 `data/scenarios/` 新增 OHCA v2 可玩內容。
- 將下列秒數寫入全域 action 預設。
- 將本提案標示為 EMT 教材或臨床標準。

## 依據與不可妥協原則

- 醫療專業人員若 10 秒內無法明確摸到脈搏，應立即開始胸外按壓。
- 高品質 CPR 應盡量減少胸外按壓中斷。
- AED 取得及準備期間應持續 CPR；可電擊時應儘早電擊。
- 電擊後應立即恢復胸外按壓。
- 成人胸外按壓速率、深度與通氣品質仍以正式教材為準，遊戲的 task duration
  不取代上述品質指標。

參考資料：

- [AHA 2025 Adult Basic Life Support](https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support)
- [內政部消防署：教學用緊急醫療救護單項技術操作規範](https://www.nfa.gov.tw/Upload/pro/attachment/0bff8c000169ce60170cb8012cecceb7.pdf)
- [衛生福利部：全民 CPR、AED 與 EMT 制度相關資料](https://dep.mohw.gov.tw/doma/fp-2710-7586-106.html)

## 建議的垂直切片

OHCA v2 採獨立情境，不繼承並附加既有 OHCA phases。既有 OHCA 內容維持
instant action；只有 v2 的 required entry 使用 timing override。

| Phase        | 主手任務                             | 副手任務                                        | 建議 timeout | 審查重點                                              |
| ------------ | ------------------------------------ | ----------------------------------------------- | -----------: | ----------------------------------------------------- |
| 現場與通報   | 現場安全 2 秒 → BSI 2 秒             | 通報 119 6 秒                                   |        25 秒 | 兩人可同時開始工作                                    |
| OHCA 確認    | AVPU 3 秒 → 呼吸 5 秒 → 頸動脈 5 秒  | 無                                              |        30 秒 | 三項維持現行順序；脈搏判斷不超過 10 秒                |
| CPR 與氣道   | 胸外按壓 30 秒                       | 暢通氣道 3 秒 → OPA 5 秒 → 接氧 4 秒 → BVM 8 秒 |        45 秒 | 兩條 lane 並行；模擬 30 秒不是完整 CPR cycle          |
| AED 準備     | 胸外按壓 20 秒                       | 開機 2 秒 → 貼片 8 秒                           |        30 秒 | 貼片與準備期間不中斷壓胸                              |
| 分析與電擊   | 無                                   | 分析 5 秒 → 電擊 2 秒                           |        20 秒 | 分析與電擊期間病人 clear                              |
| 電擊後 CPR   | 胸外按壓 20 秒                       | BVM 8 秒                                        |        30 秒 | 電擊後立即恢復 CPR，兩人再次並行                      |
| 再評估與交班 | 頸動脈 5 秒 → 呼吸 5 秒 → ISBAR 8 秒 | 無                                              |        30 秒 | 沿用 ROSC with breathing 結局，避免一次改多個臨床分支 |

production 的 AI partner reaction 固定為 2 秒。上表 timeout 已把 AI
每個循序任務前的 reaction 納入，任一玩家角色皆應有至少 5 秒餘裕。

## 建議的中斷規則

| 動作                                                                     | `interruptible` | 理由                                                                             |
| ------------------------------------------------------------------------ | --------------- | -------------------------------------------------------------------------------- |
| 現場安全、BSI、通報、AVPU、呼吸、脈搏、氣道、OPA、接氧、BVM、貼片、ISBAR | `true`          | 玩家可停止並重做；已花時間不退還，phase deadline 繼續前進                        |
| 胸外按壓                                                                 | `true`          | 真實上可停止，但遊戲透過持續倒數與逾時後果阻止無成本濫用；也能測到明確的中斷回饋 |
| AED 開機                                                                 | `true`          | 尚未進入分析前可停止或重新分工                                                   |
| AED 分析、電擊                                                           | `false`         | 任務短且屬已承諾的安全關鍵操作，避免 UI 允許在過程中任意取消                     |

系統因 phase timeout、phase change 或 scenario 完成而取消工作時，仍一律終止
task，並只由既有 `on_skip` 決定病況惡化與計分。

## Reviewer 必須決定

請逐項填寫「核可」或具體修正值：

| 決策                                | 結果 | 修正或備註 |
| ----------------------------------- | ---- | ---------- |
| 臨床處置順序與兩人分工              | 核可 |            |
| CPR 期間並行準備氣道與 AED          | 核可 |            |
| 各 phase 的模擬 task duration       | 核可 |            |
| 各 phase timeout 與至少 5 秒餘裕    | 核可 |            |
| 胸外按壓允許玩家主動取消後重做      | 核可 |            |
| AED 分析與電擊不可由玩家主動取消    | 核可 |            |
| 僅實作 ROSC with breathing 單一路徑 | 核可 |            |

Reviewer：

- 姓名：Tien
- EMT／教學資格：EMT-1
- 審查日期：2026-07-24
- 結論：核可

## 核可後的工程驗收

- 新增獨立 OHCA v2 scenario，既有 OHCA YAML 不變。
- lead 與 assist 至少在 CPR、AED 準備、電擊後 CPR 三個 phases 並行。
- required-entry timing 的 validator 與 scenario loader 測試通過。
- 純 engine 測試覆蓋兩種玩家角色、完整事件時間序列、deadline 餘裕與中斷。
- Playwright 覆蓋完整 timed flow、lane HUD、取消回饋、結算與進度只保存一次。
- 手機與桌面各完成一次 pacing、角色清晰度與 deadline fairness playtest。
