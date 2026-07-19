import { expect, type Page } from '@playwright/test';

export async function finishNarrative(page: Page, expectedText: string) {
	const typewriter = page.locator('.typewriter-text');
	await expect(typewriter).toBeVisible({ timeout: 10_000 });

	await expect(async () => {
		const currentSkip = typewriter.getByRole('button', { name: '略過簡報' });
		if (await currentSkip.isVisible()) await currentSkip.click();
		expect(await typewriter.textContent()).toContain(expectedText);
	}).toPass({ timeout: 15_000, intervals: [100, 250, 500] });

	const skip = typewriter.getByRole('button', { name: '略過簡報' });
	await expect(skip).toBeHidden();
}

export async function chooseMode(page: Page, label: string) {
	const button = page.getByRole('button', { name: label });
	if (!(await button.evaluate((element) => element.classList.contains('active')))) {
		await button.click();
	}
}

export async function clickAction(page: Page, label: string) {
	await page.getByRole('button', { name: label }).first().click();
}

export async function assessmentAction(
	page: Page,
	label: string,
	region: '頭部' | '頸部' | '胸部'
) {
	await chooseMode(page, '患者評估');
	const zone = page.getByRole('button', { name: region });
	if (!(await zone.evaluate((element) => element.classList.contains('active')))) {
		await zone.click();
	}
	await clickAction(page, label);
}

export async function startScenarioAsLead(page: Page, scenarioId: string) {
	await page.addInitScript(() => {
		Math.random = () => 0;
	});
	await page.goto(`/scenarios/${scenarioId}/role`);
	await page.getByRole('button', { name: '主手' }).click();
	await expect(page).toHaveURL(new RegExp(`/scenarios/${scenarioId}/play`));
}

export async function completeSharedOhcaPhases(page: Page) {
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
}
