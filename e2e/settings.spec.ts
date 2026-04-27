import { test, expect } from '@playwright/test';

/**
 * 13.3 Smoke test: 設定頁清除進度 → 首頁進度條歸零
 *
 * 前置條件：先存一筆進度到 localStorage，再清除，確認清除後進度消失。
 */

test('設定頁清除進度 → 首頁進度歸零', async ({ page }) => {
	// 先注入假進度到 localStorage
	await page.goto('/');
	await page.evaluate(() => {
		const progress = {
			version: 1,
			scenarios: {
				ohca_adult_street: {
					playedAs: { lead: { bestStars: 3 } }
				}
			},
			techniques: {
				cervical_collar: { bestStars: 2 }
			}
		};
		localStorage.setItem('emt1game:progress', JSON.stringify(progress));
	});

	// 重新整理首頁，確認有進度顯示
	await page.reload();
	await expect(page.getByRole('heading', { name: 'EMT-1 練功房' })).toBeVisible();

	// 進入設定頁
	await page.getByRole('link', { name: '設定' }).click();
	await expect(page).toHaveURL(/\/settings/);
	await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();

	// 點「清除全部進度」
	await page.getByRole('button', { name: '清除全部進度' }).click();

	// 二次確認對話框
	await expect(page.getByText(/確認清除進度/)).toBeVisible();
	await page.getByRole('button', { name: '確認' }).click();

	// 確認 localStorage 已清除
	const stored = await page.evaluate(() => localStorage.getItem('emt1game:progress'));
	expect(stored).toBeNull();

	// 回首頁確認進度歸零（無 3 星、無進度）
	await page
		.getByRole('link', { name: /返回|首頁|EMT/ })
		.first()
		.click();
	await page.goto('/');

	// 確認情境列表顯示「未嘗試」或進度為 0
	await page.getByRole('link', { name: '情境演練' }).click();
	await expect(page.getByText(/未嘗試/).first()).toBeVisible({ timeout: 5_000 });
});
