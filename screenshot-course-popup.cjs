const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:5190/competency-management');
  await page.waitForTimeout(1500);
  // Go to Reports tab
  await page.getByRole('button', { name: /reports/i }).first().click();
  await page.waitForTimeout(800);
  // Click "Skill-Wise Learner Progress" tab (if not already on it)
  await page.getByRole('button', { name: /skill-wise learner progress/i }).first().click().catch(() => {});
  await page.waitForTimeout(600);
  // Click the "1 Learner" link to open detail view
  await page.getByRole('button', { name: /1 learner/i }).first().click();
  await page.waitForTimeout(800);
  // Click the courses link to open the course popup
  await page.getByRole('button', { name: /course/i }).first().click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'course-popup.png', fullPage: false });
  await browser.close();
})();
