import { test, expect } from '@playwright/test';

test('首頁顯示 YAML 推薦勤務與已儲存的訓練摘要', async ({ page }) => {
	await page.addInitScript(() => {
		localStorage.setItem(
			'emt1game:progress',
			JSON.stringify({
				version: 1,
				scenarios: {
					ohca_rosc_breathing: {
						playedAs: {
							lead: { bestStars: 3, runs: 2 },
							assist: { bestStars: 2, runs: 1 }
						}
					}
				},
				techniques: { cervical_collar: { bestStars: 3, runs: 4 } }
			})
		);
	});

	await page.goto('/');
	await expect(page.getByRole('heading', { name: 'EMT TRAINING' })).toBeVisible();
	await expect(page.getByRole('heading', { name: '今日派遣' })).toBeVisible();
	await expect(page.getByRole('button', { name: /路倒成人救護.*開始出勤/ })).toBeVisible();

	const progress = page.getByRole('region', { name: '訓練概況' });
	await expect(progress.getByText('情境出勤').locator('..')).toContainText('3');
	await expect(progress.getByText('技術練習').locator('..')).toContainText('4');
	await expect(progress.getByText('已接觸項目').locator('..')).toContainText('2');
});

test('手機尺寸下主要導覽與出勤入口可操作', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');

	const nav = page.getByRole('navigation', { name: '主要導覽' });
	await expect(nav.getByRole('link', { name: '首頁' })).toHaveAttribute('aria-current', 'page');
	await expect(nav.getByRole('link', { name: '任務' })).toBeVisible();
	await expect(nav.getByRole('link', { name: '技術' })).toBeVisible();
	await expect(nav.getByRole('link', { name: '設定' })).toBeVisible();
	await expect(page.getByRole('button', { name: /開始出勤/ })).toBeVisible();

	await nav.getByRole('link', { name: '任務' }).click();
	await expect(page).toHaveURL(/\/scenarios$/);
});

test('情境目錄依 YAML 排序顯示難度、時間與快速出勤', async ({ page }) => {
	await page.goto('/scenarios');

	const quick = page.getByRole('region', { name: '隨機情境' });
	await expect(quick.getByRole('button', { name: /路倒成人救護/ })).toContainText('病況隨機');
	await expect(quick.getByRole('button', { name: /路倒成人救護/ })).toContainText('約 5 分鐘');

	const fixed = page.getByRole('region', { name: '固定情境' });
	const cards = fixed.getByRole('link');
	await expect(cards).toHaveCount(2);
	await expect(cards.nth(0)).toContainText('交通事故救護');
	await expect(cards.nth(0)).toContainText('進階');
	await expect(cards.nth(0)).toContainText('約 7 分鐘');
	await expect(cards.nth(1)).toContainText('室內長者救護');
	await expect(cards.nth(1)).toContainText('基礎');
});

test('快速出勤只會進入已登錄的 OHCA 變體簡報', async ({ page }) => {
	await page.addInitScript(() => {
		Math.random = () => 0;
	});
	await page.goto('/scenarios');

	await page.getByRole('region', { name: '隨機情境' }).getByRole('button').click();
	await expect(page).toHaveURL(
		/\/scenarios\/(ohca_no_rosc|ohca_rosc_breathing|ohca_rosc_no_breathing)\/role$/
	);
	await expect(page.getByRole('heading', { name: '出勤簡報' })).toBeVisible();
	await expect(page).not.toHaveURL(/ohca_adult_street/);
});

test('出勤簡報顯示 AI 編組，並保留玩家選擇的副手角色', async ({ page }) => {
	const scenarioId = 'ohca_rosc_breathing';
	await page.goto(`/scenarios/${scenarioId}/role`);

	await expect(page.getByRole('heading', { name: '出勤簡報' })).toBeVisible();
	await expect(page.getByText('AI 副手待命')).toBeVisible();
	await expect(page.getByText(/另一名 EMT 由 AI 接手/)).toBeVisible();
	await expect(page.getByRole('button', { name: /主手/ })).toBeVisible();
	await expect(page.getByRole('button', { name: /副手/ })).toBeVisible();

	await page.getByRole('button', { name: /副手/ }).click();
	await expect(page).toHaveURL(new RegExp(`/scenarios/${scenarioId}/play$`));
	const storedRole = await page.evaluate(
		(id) => sessionStorage.getItem(`emt1game:role:${id}`),
		scenarioId
	);
	expect(storedRole).toBe('assist');
});
