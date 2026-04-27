import { test, expect } from '@playwright/test';

/**
 * 13.1 Smoke test: 首頁 → OHCA → 主手 → 完整一局 → 看到 ROSC 結局
 *
 * 操作流程：
 *   首頁 → 情境演練 → 路倒成人 OHCA → 選「主手」→ 按順序執行所有玩家動作
 *   Partner AI 會自動執行 partner 動作 (最多等 5 秒)
 *   → 結算頁看到 ROSC 結局
 */

const TIMEOUT = 10_000;

/** 點選工具箱分頁 */
async function switchBag(page: import('@playwright/test').Page, bagLabel: string) {
	await page.getByRole('tab', { name: bagLabel }).click();
}

/** 點選動作按鈕（可能在工具箱或動作清單） */
async function clickAction(page: import('@playwright/test').Page, actionLabel: string) {
	await page.getByRole('button', { name: actionLabel }).first().click();
}

test('OHCA 主手完整一局 → ROSC 結局', async ({ page }) => {
	// 首頁
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'EMT-1 練功房' })).toBeVisible();

	// 進情境演練
	await page.getByRole('link', { name: '情境演練' }).click();
	await expect(page).toHaveURL(/\/scenarios/);

	// 選 OHCA 關卡
	await page.getByRole('link', { name: /路倒成人 OHCA/ }).click();
	await expect(page).toHaveURL(/\/scenarios\/ohca_adult_street\/role/);

	// 選主手
	await page.getByRole('button', { name: '主手' }).click();
	await expect(page).toHaveURL(/\/scenarios\/ohca_adult_street\/play/);

	// === Phase 1: arrival ===
	// hand bag 已是預設，直接點動作
	await clickAction(page, '評估現場安全');
	await clickAction(page, '戴手套口罩');

	// === Phase 2: assess ===
	await clickAction(page, '拍肩呼喚評估意識 AVPU');
	await clickAction(page, '看呼吸起伏');
	await clickAction(page, '檢查頸動脈脈搏');

	// === Phase 3: cpr ===
	// 玩家只需做「成人胸外按壓」，partner 自動完成其餘
	await clickAction(page, '成人胸外按壓');
	// 等 partner AI 完成通報與 BVM（最多 8 秒）
	await page.waitForFunction(
		() => {
			const narrator = document.querySelector('.narrator');
			return narrator?.textContent?.includes('AED') ?? false;
		},
		{ timeout: 15_000 }
	);

	// === Phase 4: aed ===
	await switchBag(page, 'AED');
	await clickAction(page, '貼 AED 電擊片');
	await clickAction(page, '啟動 AED 分析');
	await clickAction(page, 'AED 電擊');

	// === Phase 5: handoff ===
	await switchBag(page, '車上');
	await clickAction(page, '移送上救護車');
	await clickAction(page, '送醫');

	// ISBAR 在 hand bag
	await switchBag(page, '徒手');
	await clickAction(page, 'ISBAR 交班');

	// 結算頁：ROSC
	await expect(page).toHaveURL(/\/scenarios\/ohca_adult_street\/result/, { timeout: TIMEOUT });
	await expect(page.getByText(/ROSC/)).toBeVisible({ timeout: TIMEOUT });
});
