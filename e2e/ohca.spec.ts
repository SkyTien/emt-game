import { test, expect } from '@playwright/test';
import {
	assessmentAction,
	chooseMode,
	clickAction,
	completeSharedOhcaPhases,
	finishNarrative,
	startScenarioAsLead
} from './helpers/scenario';

const SCENARIO_ID = 'ohca_rosc_breathing';

test('固定 OHCA 主手流程會結算並只保存一次', async ({ page }) => {
	test.setTimeout(90_000);
	await startScenarioAsLead(page, SCENARIO_ID);
	await completeSharedOhcaPhases(page);

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
