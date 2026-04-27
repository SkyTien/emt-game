# 視覺指南 (Visual Guide)

本文件說明 EMT-1 練功房的設計系統——色票、圖示規格、CSS 濾鏡規則，以及素材歸屬標示要求。

---

## 色票 (Color Tokens)

所有顏色以 CSS custom properties 定義於 `src/app.css`：

| Token           | 預設值    | 用途                           |
| --------------- | --------- | ------------------------------ |
| `--c-bg`        | `#ffffff` | 主背景                         |
| `--c-bg-soft`   | `#f4f4f5` | 次要背景（卡片、分頁）         |
| `--c-text`      | `#18181b` | 主要文字                       |
| `--c-text-soft` | `#52525b` | 次要文字（說明、標籤）         |
| `--c-line`      | `#18181b` | 線條（SVG stroke）             |
| `--c-accent`    | `#dc2626` | 醒目紅（主要按鈕、連結、強調） |
| `--c-o2`        | `#2563eb` | 氧氣藍（O₂ 相關元件）          |
| `--c-border`    | `#d4d4d8` | 邊框                           |
| `--c-warn-bg`   | `#fee2e2` | 警告背景（病人惡化）           |
| `--c-good`      | `#16a34a` | 正確/成功（3 星、正確動作）    |

---

## 素材目錄結構

```
static/illustrations/
  scenes/       # 場景插畫（情境背景、單項場景）
  patients/     # 病人插圖（stick figure SVG）
  actions/      # 動作 icon（每個 action.id 一個 SVG）
  outcomes/     # 結局插畫（rosc / cpr / doa / recovery 等）
```

---

## SVG 製作規格

### 場景插畫（scenes/）

- **尺寸**：建議 800×450（16:9）或 600×400
- **線條**：`stroke="#18181b"`（使用 `--c-line`），`stroke-width` 2~3px
- **填色**：以線稿為主，輔以淺色填充（避免飽和色）
- **格式**：純 SVG，清除 Inkscape/Illustrator metadata（使用 svgo 優化）

### 病人 stick figure（patients/）

- **仰臥姿態**，含以下 `<g>` 區塊（id 對應 body_region）：
  ```xml
  <g id="head" role="button">...</g>
  <g id="neck" role="button">...</g>
  <g id="chest" role="button">...</g>
  <g id="wrist" role="button">...</g>
  <g id="abdomen" role="button">...</g>
  <g id="leg" role="button">...</g>
  <g id="arm" role="button">...</g>
  ```
- 每個可點擊熱區至少 **44×44 px**（符合觸控標準）

### 動作 icon（actions/）

- **尺寸**：24×24 或 32×32 px viewBox
- **線稿**：黑色（`#000000`）；CSS 濾鏡會在渲染時套用顏色
- **格式**：單色線稿 SVG（方便 `filter: brightness(0)` 重新著色）
- 命名規則：`<action.id>.svg`（如 `check_scene_safe.svg`）

### 結局插畫（outcomes/）

- **尺寸**：同場景插畫，600×400 建議
- 需涵蓋：`rosc.svg`（恢復循環）、`cpr.svg`（持續 CPR）、`doa.svg`（到院前 DOA）、`recovery.svg`（送醫好轉）

---

## CSS 濾鏡規則

定義於 `src/app.css`，對引入的 CC0 素材統一收斂色調：

### 場景插畫

```css
.illustration-scene img,
.illustration-scene svg {
	filter: grayscale(0.25) brightness(0.95) contrast(1.05);
}
```

略去飽和度、稍微加深對比，保持線稿感一致性。

### 結局插畫

```css
/* 好結局：溫暖偏白 */
.illustration-outcome-good img,
.illustration-outcome-good svg {
	filter: grayscale(0.1) brightness(1) saturate(0.9) sepia(0.05);
}

/* 壞結局：去飽和偏灰 */
.illustration-outcome-bad img,
.illustration-outcome-bad svg {
	filter: grayscale(0.4) brightness(0.85) contrast(1.1);
}
```

UI 元件選用 class：

- 正面結局（ROSC、好轉）→ `illustration-outcome-good`
- 負面結局（DOA、惡化）→ `illustration-outcome-bad`

### 動作 icon

```css
.action-icon img {
	filter: brightness(0) saturate(100%);
}
```

將黑色線稿轉為純黑，再以父元素 `color` 或額外 `filter` 疊加顏色。

### 袋子 icon（依袋子類型著色）

```css
.bag-icon-hand img {
	filter: brightness(0) saturate(100%);
}
.bag-icon-o2kit img {
	filter: brightness(0) saturate(100%) invert(22%) sepia(97%)...;
}
.bag-icon-jumpkit img {
	filter: brightness(0) saturate(100%) invert(15%) sepia(90%)...;
}
.bag-icon-aed img {
	filter: brightness(0) saturate(100%) invert(48%) sepia(99%)...;
}
.bag-icon-vehicle img {
	filter: brightness(0) saturate(100%) invert(30%) sepia(10%)...;
}
```

---

## 素材歸屬標示要求

所有引入的外部素材**必須**在 `static/illustrations/CREDITS.md` 記錄：

```markdown
## CREDITS

| 檔案                    | 來源         | 授權      | 作者/出處        |
| ----------------------- | ------------ | --------- | ---------------- |
| scenes/street.svg       | 自製         | CC0       | EMT-1 練功房志工 |
| outcomes/rosc.svg       | OpenClipart  | CC0       | openclipart.org  |
| actions/check_pulse.svg | Noun Project | CC BY 3.0 | John Doe         |
```

### 授權相容性

- **CC0**（無版權）：可自由使用，不需標示，但建議仍記錄來源
- **CC BY**（姓名標示）：**必須**在 CREDITS.md 記錄作者與出處
- **CC BY-SA**（相同方式分享）：可使用，但衍生品需採用相同授權
- **版權保護素材**：**不可使用**，即使已取得單次授權也不符合開源精神

### 製作新素材

自製素材建議以 **CC0** 授權發布（於 CREDITS.md 標注「自製」），讓任何人都能再利用。

---

## 檢查清單

提交包含視覺素材的 PR 前，請確認：

- [ ] 所有 icon/插畫已加入 `static/illustrations/` 對應子目錄
- [ ] `static/illustrations/CREDITS.md` 已更新
- [ ] SVG 已用 svgo 優化（縮小體積）
- [ ] 可點擊 SVG 熱區 ≥ 44×44 px
- [ ] 線稿使用 `#18181b`（與 `--c-line` 對齊）
- [ ] 動作 icon 命名符合 `<action.id>.svg` 規則
