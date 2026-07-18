import { test, expect, type Page } from '@playwright/test';

const SCENARIO_ID = 'ohca_rosc_breathing';

async function finishNarrative(page: Page, expectedText: string) {
	const typewriter = page.locator('.typewriter-text');
	await expect(typewriter).toBeVisible({ timeout: 20_000 });
	await expect(typewriter).toContainText(expectedText, { timeout: 20_000 });
	if (await typewriter.locator('.cursor').isVisible()) {
		await typewriter.click();
	}
	if (await typewriter.locator('.continue-prompt').isVisible()) await typewriter.click();
}

async function chooseMode(page: Page, label: string) {
	const button = page.getByRole('button', { name: label });
	if (!(await button.evaluate((element) => element.classList.contains('active'))))
		await button.click();
}

async function clickAction(page: Page, label: string) {
	await page.getByRole('button', { name: label }).first().click();
}

async function assessmentAction(page: Page, label: string, region: '頭部' | '頸部' | '胸部') {
	await chooseMode(page, '患者評估');
	const zone = page.getByRole('button', { name: region });
	if (!(await zone.evaluate((element) => element.classList.contains('active')))) await zone.click();
	await clickAction(page, label);
}

test('固定 OHCA 主手流程會結算並只保存一次', async ({ page }) => {
	test.setTimeout(90_000);
	await page.goto(`/scenarios/${SCENARIO_ID}/role`);
	await page.getByRole('button', { name: '主手' }).click();
	await expect(page).toHaveURL(new RegExp(`/scenarios/${SCENARIO_ID}/play`));

	await finishNarrative(page, '你抵達現場');
	await chooseMode(page, '現場勘查');
	await clickAction(page, '評估現場安全');
	await clickAction(page, '戴手套口罩');

	await finishNarrative(page, '病人臉色蒼白');
	await assessmentAction(page, '拍肩呼喚評估意識 AVPU', '頭部');
	await assessmentAction(page, '看呼吸起伏', '胸部');
	await assessmentAction(page, '檢查頸動脈脈搏', '頸部');

	await finishNarrative(page, '確認患者無脈搏');
	await assessmentAction(page, '成人胸外按壓', '胸部');

	await finishNarrative(page, '自動體外心臟電擊');

	await finishNarrative(page, '電擊後你立即恢復按壓');
	await assessmentAction(page, '檢查頸動脈脈搏', '頸部');
	await assessmentAction(page, '看呼吸起伏', '胸部');

	await finishNarrative(page, '病人恢復自主循環與呼吸');
	await chooseMode(page, '急救裝備');
	await page.getByRole('tab', { name: '救護包 (Jumpkit)' }).click();
	await clickAction(page, '量測血氧');
	await assessmentAction(page, '檢查頸動脈脈搏', '頸部');
	await chooseMode(page, '現場勘查');
	await clickAction(page, 'ISBAR 交班');

	await expect(page).toHaveURL(new RegExp(`/scenarios/${SCENARIO_ID}/result`), { timeout: 10_000 });
	await expect(page.getByText(/ROSC/).first()).toBeVisible();

	const runsBeforeRefresh = await page.evaluate((id) => {
		const progress = JSON.parse(localStorage.getItem('emt1game:progress') ?? '{}');
		return progress.scenarios?.[id]?.playedAs?.lead?.runs ?? 0;
	}, SCENARIO_ID);
	expect(runsBeforeRefresh).toBe(1);
	await page.reload();
	const runsAfterRefresh = await page.evaluate((id) => {
		const progress = JSON.parse(localStorage.getItem('emt1game:progress') ?? '{}');
		return progress.scenarios?.[id]?.playedAs?.lead?.runs ?? 0;
	}, SCENARIO_ID);
	expect(runsAfterRefresh).toBe(1);
});
