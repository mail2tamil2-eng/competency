import { chromium } from 'playwright';
const br = await chromium.launch({ channel: 'chrome' });
const page = await br.newPage();
await page.setViewportSize({ width: 1400, height: 900 });
await page.goto('http://127.0.0.1:5191/competency-management');
await page.waitForLoadState('networkidle');
await page.click('button:has-text("Progress")');
await page.waitForTimeout(400);
await page.screenshot({ path: 'ss_lp_table.png' });

await page.click('button:has-text("View skills")');
await page.waitForTimeout(400);
await page.screenshot({ path: 'ss_lp_panel.png' });

const skillBtn = page.locator('.cm-lp-skill-name').first();
await skillBtn.click();
await page.waitForTimeout(300);
await page.screenshot({ path: 'ss_lp_detail.png' });

const updateBtn = page.locator('.cm-lp-update-btn').first();
await updateBtn.click();
await page.waitForTimeout(200);
await page.screenshot({ path: 'ss_lp_update.png' });

await br.close();
console.log('done');
