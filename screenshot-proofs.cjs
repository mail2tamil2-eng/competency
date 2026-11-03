const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5190/competency-management');
  await page.waitForTimeout(1200);
  await page.locator('select[aria-label="Workspace View"]').selectOption('manager');
  await page.waitForTimeout(1000);
  // Click Proof Submissions tab
  await page.getByRole('link', { name: /proof submissions/i }).click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'compare-manager-proofs.png', fullPage: false });
  await browser.close();
})();
