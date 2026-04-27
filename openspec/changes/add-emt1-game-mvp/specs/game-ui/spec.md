# game-ui Spec Delta

## ADDED Requirements

### Requirement: 首頁與主選單

系統 SHALL 提供首頁包含遊戲名稱、兩大模式入口(單項 / 情境)、進度指示器、設定入口。

#### Scenario: 首頁顯示兩大模式與進度

- **GIVEN** 玩家進度為 4 / 4(全數關卡已通關)
- **WHEN** 開啟首頁
- **THEN** 顯示「情境模式」與「單項模式」兩個大按鈕
- **AND** 顯示進度「4/4」
- **AND** 顯示設定與關於入口

### Requirement: 關卡選擇畫面

系統 SHALL 以清單呈現單項與情境關卡,已通關的關卡顯示最佳星等,未嘗試顯示「未嘗試」,所有關卡皆可自由進入(非強制解鎖)。

#### Scenario: 情境清單顯示星等

- **GIVEN** 玩家已通關「路倒成人 OHCA」(主手 3 星、副手 2 星)
- **WHEN** 進入情境選關畫面
- **THEN** 該情境卡片顯示「主手 ⭐⭐⭐ / 副手 ⭐⭐」兩條星等
- **AND** 其他未嘗試情境顯示「未嘗試」

### Requirement: 情境角色選擇

系統 SHALL 在情境 `player_role === "兩者皆可"` 時,進入遊戲前先讓玩家選擇扮演主手或副手,並顯示該角色攜帶的袋子與主要職責。

#### Scenario: 選擇主手

- **GIVEN** 進入「路倒成人 OHCA」,該情境 `player_role: 兩者皆可`
- **WHEN** 角色選擇畫面顯示
- **THEN** 兩張卡片:主手(攜帶三合一氧氣、職責氣道/評估/ISBAR)、副手(攜帶急救包+AED、職責按壓/AED/器材)
- **AND** 玩家點主手後進入遊戲,state.playerRole === "lead"

### Requirement: 情境遊戲畫面

系統 SHALL 在情境遊戲中顯示:頂列(關卡名、角色、計時)、場景 stick figure 插畫與可點擊的病人身體、病人狀態列、旁白框與 phase 進度、器材袋分頁工具箱、指示同伴分頁。

#### Scenario: 畫面完整元素存在

- **GIVEN** 玩家進入情境遊戲畫面
- **WHEN** 初始渲染完成
- **THEN** 畫面含以上所有元素
- **AND** 旁白框以打字機效果逐字顯示當前 phase 的 narrative
- **AND** 病人狀態列顯示意識/呼吸/脈搏三項數值

### Requirement: 身體部位點擊互動

系統 SHALL 讓玩家點擊 stick figure 病人插畫上的身體部位(頭/頸/胸/手腕/腹部/四肢),點擊後才顯示該部位可執行的動作清單,避免一次列出所有動作造成隱性提示。

#### Scenario: 點頭部顯示頭部動作

- **GIVEN** 玩家處於情境遊戲畫面,工具箱目前顯示「徒手/評估」分頁
- **WHEN** 玩家點擊病人頭部區域
- **THEN** 畫面顯示該部位可執行動作清單:檢查意識 AVPU、瞳孔檢查、聽口鼻呼吸、徒手打開呼吸道、OPA/NPA 置入、抽吸
- **AND** 玩家未點擊身體時不顯示這些動作,僅顯示「請點擊病人身體部位」提示

#### Scenario: 點胸部顯示胸部動作

- **GIVEN** 同上
- **WHEN** 玩家點擊病人胸部
- **THEN** 清單改為:呼吸觀察 10 秒、聽診、胸外按壓、AED 貼電極

### Requirement: 器材袋分頁工具箱

系統 SHALL 以分頁呈現五類動作來源:徒手/評估、三合一氧氣、急救包、AED、車上器材,並根據袋子是否在病人旁決定分頁內動作是否可點擊。

#### Scenario: 急救包不在場時該分頁動作被禁用

- **GIVEN** 副手尚未將急救包帶至病人旁(急救包在車上)
- **WHEN** 玩家切換到「急救包」分頁
- **THEN** 分頁內所有動作按鈕呈 disabled 灰色狀態
- **AND** 分頁上方顯示提示「急救包目前不在病人旁,請指示副手取來」

### Requirement: 指示同伴分頁

系統 SHALL 提供「指示同伴」分頁,讓玩家可下達同伴該做的動作(取袋子、執行某動作);此分頁列出同伴當前可做的動作集合。

#### Scenario: 主手指示副手取 AED

- **GIVEN** 玩家扮演主手,AED 仍在車上、副手有空
- **WHEN** 玩家切到「指示同伴」分頁並點「副手去取 AED」
- **THEN** 引擎接收 directive 事件
- **AND** 場景旁白顯示「副手朝救護車跑去,準備取回 AED」
- **AND** 若此動作屬於當前 phase required,則推進狀態

### Requirement: 單項遊戲畫面

系統 SHALL 在單項遊戲中顯示:單項名稱、累計錯誤或當前星等、情境插畫、步驟進度(第 N 步 / 共 M 步)、器材袋分頁工具箱、第 2 次錯誤後才揭露的 tip 區。

#### Scenario: 畫面顯示第 3 步提示

- **GIVEN** 玩家在「上頸圈」單項,stepIndex=2,該步驟 `wrongTries === 2`
- **WHEN** 玩家再次做錯
- **THEN** tip 區顯示該步驟的 tip 文字
- **AND** 進度顯示「第 3 步 / 共 5 步」

### Requirement: 情境結算畫面

系統 SHALL 在情境完成後顯示結算畫面,包含病人結局標題、結局插畫、結局文字、正確率與錯誤數、星等、時間軸回顧入口、再來一次與返回選關按鈕。

#### Scenario: ROSC 結局畫面

- **GIVEN** 玩家以扮演主手完成 OHCA 情境,結局 id = `rosc`
- **WHEN** 結算畫面渲染
- **THEN** 顯示「結局:ROSC 恢復自主循環」
- **AND** 顯示對應插畫(病人恢復呼吸)
- **AND** 顯示 `正確率 92% | 錯誤 1 | 惡化 0` 與對應星等

#### Scenario: 點時間軸回顧展開

- **GIVEN** 結算畫面已顯示
- **WHEN** 玩家點「📜 時間軸回顧」
- **THEN** 展開清單:每一筆顯示時間戳、玩家/同伴做的動作、是否正確、講解
- **AND** `on_skip` 與 `phase_advance` 事件也以不同樣式呈現

### Requirement: 單項結算畫面

系統 SHALL 在單項完成後顯示:單項名稱、累計錯誤數、星等、再來一次與返回選關按鈕。

#### Scenario: 3 星單項結算

- **GIVEN** 玩家在「上頸圈」完成 5 步,`wrongTries === 0`
- **WHEN** 結算畫面渲染
- **THEN** 顯示「上頸圈 ⭐⭐⭐ 完美通關」

### Requirement: RWD 版面

系統 SHALL 適配手機直式與桌機橫式兩種版面:手機採上下堆疊(場景 / 狀態 / 工具箱由上而下),桌機採左右分欄(左場景右工具箱)。

#### Scenario: 手機直式版面

- **GIVEN** 視窗寬度 < 768px
- **WHEN** 情境遊戲畫面渲染
- **THEN** 場景、狀態列、旁白、工具箱上下堆疊,工具箱固定於畫面底部以利拇指操作

#### Scenario: 桌機橫式版面

- **GIVEN** 視窗寬度 >= 1024px
- **WHEN** 情境遊戲畫面渲染
- **THEN** 場景與旁白在左側、工具箱在右側欄位,旁白與狀態位於場景下方

### Requirement: i18n 框架為所有 UI 元件的硬性前置

系統 SHALL 在 MVP 第一版就啟用 i18n 框架(`svelte-i18n`),且所有 UI 元件從第一次提交起即透過 i18n 取得字串;**不允許**先硬編中文再於之後 refactor;MVP 僅實作繁體中文(`zh-Hant`)一個 locale,往後新增語系只需加翻譯檔,不改元件程式。

**字串兩類取得方式**

- **UI chrome**(按鈕/選單/錯誤訊息/結算樣板字)→ `$_('ui.key')`(svelte-i18n store)
- **教材內容**(scenario/technique/action 的可翻譯欄位,從 YAML 來)→ `localize(localizedString, $locale)` helper

**進入開發順序**:i18n 框架(svelte-i18n 安裝、locale 載入、localize helper、lint 規則)必須在所有 UI 元件之前完成;第一個 UI 元件提交時 CI 的 i18n lint 必須已經啟用。

#### Scenario: 元件內不得出現 bare 中文字串

- **GIVEN** 任一 `src/**/*.svelte` 或 `src/**/*.ts` 元件程式
- **WHEN** CI 執行 i18n lint 腳本
- **THEN** 元件內**不得含**非 i18n 的中文字串(白名單:註解、測試資料、`data/**` 內容)
- **AND** 違規時 CI fail,列出違規檔案與行號

#### Scenario: 新增 locale 不動元件

- **GIVEN** 未來新增 `src/lib/i18n/locales/en.json` 作為英文翻譯
- **WHEN** 將 locale 切到 `en` 並重載畫面
- **THEN** 所有 UI 文字顯示對應英文
- **AND** 沒有任何 `.svelte` 元件需要修改(僅靠 JSON 翻譯檔切換)

#### Scenario: 翻譯缺鍵有明確訊息

- **GIVEN** 某個元件呼叫 `$_('nonexistent.key')`
- **WHEN** 畫面渲染
- **THEN** 顯示鍵名本身(例:`nonexistent.key`)並在 console 印出警告
- **AND** CI 中 i18n lint 應額外偵測並報錯

#### Scenario: Locale 就緒前不得渲染主要內容

- **GIVEN** SvelteKit static 模式下使用者首次開啟頁面
- **WHEN** `+layout.svelte` 渲染
- **THEN** 在 `waitLocale()` 完成前不顯示任何需 i18n 的元件(可顯示純 logo 或無字 loading 動畫)
- **AND** locale 就緒後一次渲染完整畫面,避免 flash of untranslated content

#### Scenario: 情境/單項 YAML 內的中文直接顯示

- **GIVEN** `data/scenarios/*.yml` 內的 narrative、outcome title 為中文字串
- **WHEN** UI 讀取該情境並顯示
- **THEN** 直接顯示該中文字串(YAML 內容屬教材本身,不走 i18n key)
- **AND** Phase 2 若要英文化,會以 `data/i18n/en/scenarios/*.yml` 對照檔方式實作,不影響 MVP 架構

### Requirement: 基礎動畫

系統 SHALL 使用 CSS/SVG 原生動畫呈現:病人呼吸起伏(胸部 SVG path 上下位移)、狀態惡化閃紅(狀態列背景紅閃 1 秒)、旁白打字機逐字、場景切換淡入淡出。

#### Scenario: 病人無呼吸時胸部不起伏

- **GIVEN** 病人 breathing === "無"
- **WHEN** 場景渲染
- **THEN** 胸部 SVG 無呼吸動畫
- **AND** 當 breathing 變為「正常」時,胸部開始呼吸動畫

#### Scenario: 惡化事件觸發狀態列紅閃

- **GIVEN** `on_skip` 事件觸發,`patientWorsenLevel` 增加
- **WHEN** UI 接到狀態更新
- **THEN** 狀態列背景紅閃 1 秒
- **AND** 畫面底部顯示 note 文字(例:「每延遲 1 分鐘 CPR 存活率下降 7~10%」)
