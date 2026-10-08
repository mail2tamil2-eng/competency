import { chromium } from 'playwright';

const br = await chromium.launch({ channel: 'chrome' });
const page = await br.newPage();
await page.setViewportSize({ width: 1400, height: 900 });

await page.goto('http://127.0.0.1:5191/competency-management');
await page.waitForLoadState('networkidle');
await page.click('button:has-text("Progress")');
await page.waitForTimeout(500);

// Expand first learner
await page.click('tbody tr.cm-learner-row');
await page.waitForTimeout(400);
await page.screenshot({ path: 'ss_gap_track.png', fullPage: false });

// Scroll down to see full expanded content
await page.evaluate(() => window.scrollTo(0, 300));
await page.waitForTimeout(200);
await page.screenshot({ path: 'ss_gap_track_scroll.png', fullPage: false });

await br.close();
console.log('Done');
