import { test, expect, type Page } from '@playwright/test';
import {
	assessmentAction,
	chooseMode,
	clickAction,
	finishNarrative,
	startScenarioAsLead,
	startScenarioAsRole
} from './helpers/scenario';

const SCENARIO_ID = 'ohca_adult_timed_v2';

async function advance(page: Page, milliseconds: number) {
	await page.clock.fastForward(milliseconds);
	await expect(page.getByLabel('救護人員任務狀態')).toBeVisible();
}

test('OHCA v2 主手可用立即動作完成完整協作流程並只保存一次', async ({ page }) => {
	test.setTimeout(90_000);
	await page.clock.install({ time: new Date('2026-07-24T00:00:00Z') });
	await startScenarioAsLead(page, SCENARIO_ID);

	await finishNarrative(page, '你與搭檔抵達');
	await chooseMode(page, '現場勘查');
	await clickAction(page, '評估現場安全');
	await clickAction(page, '戴手套口罩');
	await expect(page.getByLabel('救護人員任務狀態')).toContainText('通報通訊指揮中心');
	await advance(page, 2_000);

	await finishNarrative(page, '病人臉色蒼白');
	await assessmentAction(page, '拍肩呼喚評估意識 AVPU', '頭部');
	await assessmentAction(page, '看呼吸起伏', '胸部');
	await assessmentAction(page, '檢查頸動脈脈搏', '頸部');

	await finishNarrative(page, '病人無正常呼吸');
	await assessmentAction(page, '成人胸外按壓', '胸部');
	const lanes = page.getByLabel('救護人員任務狀態');
	await expect(lanes).toContainText('壓額抬下顎');
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth
		)
	).toBe(true);
	await advance(page, 8_000);

	await finishNarrative(page, 'AED 已送到病人身旁');
	await assessmentAction(page, '成人胸外按壓', '胸部');
	await advance(page, 4_000);

	await finishNarrative(page, '電擊片已貼妥');
	await advance(page, 4_000);

	await finishNarrative(page, '電擊完成後');
	await assessmentAction(page, '成人胸外按壓', '胸部');
	await advance(page, 2_000);

	await finishNarrative(page, '完成一輪 CPR');
	await assessmentAction(page, '檢查頸動脈脈搏', '頸部');
	await assessmentAction(page, '看呼吸起伏', '胸部');
	await chooseMode(page, '現場勘查');
	await clickAction(page, 'ISBAR 交班');

	await expect(page).toHaveURL(new RegExp(`/scenarios/${SCENARIO_ID}/result$`));
	await expect(page.getByRole('heading', { name: 'ROSC — 雙人協作順暢' })).toBeVisible();

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

test('OHCA v2 副手可在手機版完成跨預設角色的氣道與 AED 流程', async ({ page }) => {
	test.setTimeout(90_000);
	await page.setViewportSize({ width: 390, height: 844 });
	await page.clock.install({ time: new Date('2026-07-24T00:00:00Z') });
	await startScenarioAsRole(page, SCENARIO_ID, '副手');

	await finishNarrative(page, '你與搭檔抵達');
	await chooseMode(page, '現場勘查');
	await clickAction(page, '通報通訊指揮中心');
	await advance(page, 4_000);

	await finishNarrative(page, '病人臉色蒼白');
	await advance(page, 6_000);

	await finishNarrative(page, '病人無正常呼吸');
	await assessmentAction(page, '壓額抬下顎', '頭部');
	const mobileLanes = page.getByLabel('救護人員任務狀態');
	await expect(mobileLanes).toContainText('主手');
	await expect(mobileLanes).toContainText('副手');
	await expect(mobileLanes).toContainText('成人胸外按壓');
	expect(
		await page.evaluate(
			() => document.documentElement.scrollWidth <= document.documentElement.clientWidth
		)
	).toBe(true);
	await chooseMode(page, '急救裝備');
	await page.getByRole('tab', { name: '救護包 (Jumpkit)' }).click();
	await clickAction(page, '置入口咽呼吸道 OPA');
	await page.getByRole('tab', { name: '氧氣組 (O2)' }).click();
	await clickAction(page, '接氧氣瓶');
	await clickAction(page, 'BVM 給氧通氣');
	await advance(page, 2_000);

	await finishNarrative(page, 'AED 已送到病人身旁');
	await chooseMode(page, '急救裝備');
	await page.getByRole('tab', { name: 'AED 電擊器' }).click();
	await clickAction(page, '開啟 AED 電源');
	await clickAction(page, '貼 AED 電擊片');
	await advance(page, 2_000);

	await finishNarrative(page, '電擊片已貼妥');
	await chooseMode(page, '急救裝備');
	await page.getByRole('tab', { name: 'AED 電擊器' }).click();
	await clickAction(page, '啟動 AED 分析');
	await expect(page.locator('.phase-progress')).toHaveAttribute('aria-label', '1/2');
	await clickAction(page, 'AED 電擊');

	await finishNarrative(page, '電擊完成後');
	await chooseMode(page, '急救裝備');
	await page.getByRole('tab', { name: '氧氣組 (O2)' }).click();
	await clickAction(page, 'BVM 給氧通氣');
	await advance(page, 2_000);

	await finishNarrative(page, '完成一輪 CPR');
	await advance(page, 6_000);

	await expect(page).toHaveURL(new RegExp(`/scenarios/${SCENARIO_ID}/result$`));
	await expect(page.getByRole('heading', { name: 'ROSC — 雙人協作順暢' })).toBeVisible();

	const viewportFits = await page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth
	);
	expect(viewportFits).toBe(true);
});

test('OHCA v2 階段逾時後仍可進入下一階段', async ({ page }) => {
	await page.clock.install({ time: new Date('2026-07-24T00:00:00Z') });
	await startScenarioAsLead(page, SCENARIO_ID);

	await finishNarrative(page, '你與搭檔抵達');
	await advance(page, 25_000);

	await expect(page.getByText(/病人臉色蒼白、嘴唇發紺/)).toBeVisible();
	await expect(page.locator('.phase-progress')).toHaveAttribute('aria-label', '0/3');
});
