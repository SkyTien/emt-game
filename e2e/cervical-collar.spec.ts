import { test, expect } from '@playwright/test';

/**
 * 13.2 Smoke test: 單項「上頸圈」全部正確完成 → 結算 3 星 → localStorage 有記錄
 *
 * 上頸圈步驟（須按序）:
 *   1. 戴手套口罩 (hand)
 *   2. 徒手固定頭部 (hand)
 *   3. 二度評估全身 (hand)
 *   4. 挑選頸圈尺寸 (jumpkit)
 *   5. 套上頸圈 (jumpkit)
 */

async function switchBag(page: import('@playwright/test').Page, bagLabel: string) {
	await page.getByRole('tab', { name: bagLabel }).click();
}

async function clickAction(page: import('@playwright/test').Page, actionLabel: string) {
	await page.getByRole('button', { name: actionLabel }).first().click();
}

test('上頸圈全對完成 → 結算 3 星 → localStorage 有記錄', async ({ page }) => {
	// 首頁
	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'EMT TRAINING' })).toBeVisible();

	// 進單項技術
	await page.getByRole('link', { name: '單項技術' }).click();
	await expect(page).toHaveURL(/\/techniques/);

	// 選上頸圈
	await page.getByRole('link', { name: /上頸圈/ }).click();
	await expect(page).toHaveURL(/\/techniques\/cervical_collar\/play/);

	// Step 1: 戴手套口罩 (hand bag)
	await switchBag(page, '徒手');
	await clickAction(page, '戴手套口罩');

	// Step 2: 徒手固定頭部 (hand bag)
	await clickAction(page, '徒手固定頭部');

	// Step 3: 二度評估全身 (hand bag)
	await clickAction(page, '二度評估全身');

	// Step 4: 挑選頸圈尺寸 (jumpkit)
	await switchBag(page, '救護包 (Jumpkit)');
	await clickAction(page, '挑選頸圈尺寸');

	// Step 5: 套上頸圈 (jumpkit)
	await clickAction(page, '套上頸圈');

	// 結算頁
	await expect(page).toHaveURL(/\/techniques\/cervical_collar\/result/, { timeout: 5_000 });

	// 檢查 3 星
	await expect(page.getByLabel('3/3')).toBeVisible();

	// 確認 localStorage 有記錄
	const stored = await page.evaluate(() => {
		const raw = localStorage.getItem('emt1game:progress');
		if (!raw) return null;
		try {
			return JSON.parse(raw);
		} catch {
			return null;
		}
	});

	expect(stored).not.toBeNull();
	expect(stored?.techniques?.cervical_collar?.bestStars).toBeGreaterThanOrEqual(3);
});
