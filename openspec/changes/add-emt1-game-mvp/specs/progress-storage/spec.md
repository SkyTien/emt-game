# progress-storage Spec Delta

## ADDED Requirements

### Requirement: 本地進度保存

系統 SHALL 使用瀏覽器 `localStorage` 於 `emt1game:progress` 鍵保存玩家的情境與單項進度,不設帳號、不連後端。

#### Scenario: 完成一次情境寫入進度

- **GIVEN** 玩家剛以扮演主手身分在「路倒成人 OHCA」情境拿到 3 星
- **WHEN** 結算頁被顯示
- **THEN** `localStorage["emt1game:progress"]` 新增或更新以下結構:
  ```json
  {
  	"scenarios": {
  		"ohca_adult_street": {
  			"playedAs": {
  				"lead": { "bestStars": 3, "runs": 1 }
  			}
  		}
  	}
  }
  ```

#### Scenario: 再次挑戰更新最佳星等

- **GIVEN** 玩家先前拿 2 星,再次挑戰同情境同角色拿 3 星
- **WHEN** 結算頁顯示
- **THEN** `bestStars` 更新為 3、`runs` 累加 1

#### Scenario: 再次挑戰未超越不覆寫最佳星等

- **GIVEN** 玩家先前拿 3 星,再次挑戰同情境同角色只拿 1 星
- **WHEN** 結算頁顯示
- **THEN** `bestStars` 保持 3、`runs` 累加 1

### Requirement: 主手/副手分別計算

系統 SHALL 針對同一情境,分別記錄玩家扮演主手與副手的進度,兩種角色的星等不互相覆蓋。

#### Scenario: 同情境兩種角色各自記錄

- **GIVEN** 玩家已在「路倒成人 OHCA」以主手身分拿 3 星
- **WHEN** 玩家再以副手身分挑戰同情境拿 2 星
- **THEN** `playedAs.lead.bestStars === 3`、`playedAs.assist.bestStars === 2`

### Requirement: 單項進度

系統 SHALL 針對單項以相同結構記錄,但單項不分角色。

#### Scenario: 單項首次通關

- **GIVEN** 玩家在「上頸圈」單項拿 3 星
- **WHEN** 結算頁顯示
- **THEN** `techniques.cervical_collar.bestStars === 3`、`runs === 1`

### Requirement: 清除進度

系統 SHALL 提供清除進度功能,需二次確認,清除後 `localStorage["emt1game:progress"]` 被移除。

#### Scenario: 玩家點選清除並確認

- **GIVEN** 玩家有已存進度
- **WHEN** 於設定頁點「清除進度」並按下「確認」
- **THEN** `localStorage["emt1game:progress"]` 被移除
- **AND** 首頁進度條重置為 0

#### Scenario: 玩家點選清除但取消

- **GIVEN** 玩家有已存進度
- **WHEN** 於設定頁點「清除進度」但在確認對話框按「取消」
- **THEN** `localStorage["emt1game:progress"]` 保持不變

### Requirement: 進度格式相容

系統 SHALL 在讀取舊進度時,容錯處理缺少欄位的情況(例:舊版沒有 `playedAs` 分角色,需自動遷移為新結構),不應因讀取失敗讓玩家進度歸零。

#### Scenario: 舊版進度自動遷移

- **GIVEN** `localStorage["emt1game:progress"]` 內容為舊版:`{ "scenarios": { "ohca_adult_street": { "bestStars": 2, "runs": 3 } } }`
- **WHEN** 應用程式啟動並讀取進度
- **THEN** 結構自動遷移為 `{ "scenarios": { "ohca_adult_street": { "playedAs": { "lead": { "bestStars": 2, "runs": 3 } } } } }`
- **AND** 下次寫入時採用新結構
