import { test, expect } from '@playwright/test';
import { chooseMode, clickAction, finishNarrative, startScenarioAsLead } from './helpers/scenario';

test('手機操作選單保留劇情、可明確關閉，換階段時會自動收合', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await startScenarioAsLead(page, 'ohca_rosc_breathing');

	await finishNarrative(page, '你抵達現場');
	await chooseMode(page, '患者評估');

	const closePanel = page.getByRole('button', { name: '關閉操作選單' });
	await expect(closePanel).toBeVisible();
	await expect(page.locator('.mode-panel-header')).toContainText('你抵達現場');

	await closePanel.click();
	await expect(closePanel).toBeHidden();
	await expect(page.locator('.narrative-static')).toContainText('你抵達現場');
	await expect(page.getByRole('button', { name: '略過簡報' })).toBeHidden();

	await chooseMode(page, '現場勘查');
	await clickAction(page, '評估現場安全');
	await clickAction(page, '戴手套口罩');

	await finishNarrative(page, '病人臉色蒼白');
	await expect(closePanel).toBeHidden();
});

test('略過簡報後倒數啟動，非當前處置會顯示具體回饋且不加進度', async ({ page }) => {
	await startScenarioAsLead(page, 'ohca_rosc_breathing');

	const timer = page.getByLabel('本階段剩餘時間');
	await expect(timer).toContainText('勤務簡報');
	await page.getByRole('button', { name: '略過簡報' }).click();
	await expect(page.getByRole('button', { name: '略過簡報' })).toBeHidden();
	await expect(timer).toContainText(/剩餘 \d+ 秒/);
	const taskLanes = page.getByLabel('救護人員任務狀態');
	await expect(taskLanes).toBeVisible();
	await expect(taskLanes).toContainText('主手');
	await expect(taskLanes).toContainText('副手');

	const progress = page.locator('.phase-progress');
	const before = await progress.getAttribute('aria-label');
	await chooseMode(page, '患者評估');
	await page.getByRole('button', { name: '頭部' }).click();
	await clickAction(page, '拍肩呼喚評估意識 AVPU');

	await expect(page.getByText('這不是目前最需要的處置，請重新觀察現場與病人。')).toBeVisible();
	await expect(progress).toHaveAttribute('aria-label', before ?? '0/3');

	const firstValue = Number((await timer.textContent())?.match(/\d+/)?.[0]);
	await page.waitForTimeout(1_100);
	const secondValue = Number((await timer.textContent())?.match(/\d+/)?.[0]);
	expect(secondValue).toBeLessThan(firstValue);
});
