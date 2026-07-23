import { test, expect } from '@playwright/test';
import { chooseMode, clickAction, startScenarioAsLead } from './helpers/scenario';

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
