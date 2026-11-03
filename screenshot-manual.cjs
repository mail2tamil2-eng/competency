const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5190/competency-management');
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /role.mapping/i }).first().click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /create/i }).first().click();
  await page.waitForTimeout(1000);
  await page.locator("select[aria-label='Enrolment Method']").selectOption('Manual');
  await page.waitForTimeout(600);
  await page.locator('.cm-audience-search-bar').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'verify-manual-audience.png', fullPage: false });
  await browser.close();
})();
