const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5190/competency-management');
  await page.waitForTimeout(1500);
  // Click Proof Submissions tab in admin
  await page.getByRole('button', { name: /proof submissions/i }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'admin-proofs.png', fullPage: false });
  await browser.close();
})();
