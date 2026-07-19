import { test, expect } from '@playwright/test';
import {
	assessmentAction,
	chooseMode,
	clickAction,
	completeSharedOhcaPhases,
	finishNarrative,
	startScenarioAsLead
} from './helpers/scenario';

const SCENARIO_ID = 'ohca_no_rosc';

test('未 ROSC 變體會持續 CPR 送醫並儲存獨立進度', async ({ page }) => {
	test.setTimeout(90_000);
	await startScenarioAsLead(page, SCENARIO_ID);
	await completeSharedOhcaPhases(page);

	await finishNarrative(page, '仍摸不到脈搏');
	await assessmentAction(page, '檢查頸動脈脈搏', '頸部');

	await finishNarrative(page, '繼續高品質 CPR');
	await assessmentAction(page, '成人胸外按壓', '胸部');
	await chooseMode(page, '現場勘查');
	await clickAction(page, 'ISBAR 交班');

	await expect(page).toHaveURL(new RegExp(`/scenarios/${SCENARIO_ID}/result$`), {
		timeout: 10_000
	});
	await expect(page.getByRole('heading', { name: '持續 CPR 送醫' })).toBeVisible();

	const stored = await page.evaluate((id) => {
		const progress = JSON.parse(localStorage.getItem('emt1game:progress') ?? '{}');
		return progress.scenarios?.[id]?.playedAs?.lead;
	}, SCENARIO_ID);
	expect(stored?.runs).toBe(1);
	expect(stored?.bestStars).toBeGreaterThan(0);
});
