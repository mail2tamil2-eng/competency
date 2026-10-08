import { chromium } from 'playwright';
const br = await chromium.launch({ channel: 'chrome' });
const page = await br.newPage();
await page.setViewportSize({ width: 1400, height: 900 });
await page.goto('http://127.0.0.1:5191/competency-management');
await page.waitForLoadState('networkidle');
await page.click('button:has-text("Progress")');
await page.waitForTimeout(400);

// Expand both learners
const toggles = page.locator('.cm-expand-toggle');
await toggles.nth(0).click();
await page.waitForTimeout(200);
await toggles.nth(1).click();
await page.waitForTimeout(300);
await page.screenshot({ path: 'ss_multi_expanded.png', fullPage: true });

// Open an update popover on first skill
const updateBtns = page.locator('.cm-lp-update-btn');
await updateBtns.first().click();
await page.waitForTimeout(200);
await page.screenshot({ path: 'ss_multi_popover.png', fullPage: true });

await br.close();
console.log('done');
