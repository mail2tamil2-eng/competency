const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1400, height: 900 });
  await p.goto('http://127.0.0.1:5190/competency-management/learner', { waitUntil: 'networkidle' });
  await p.click('button:has-text("Reset demo data")');
  await p.waitForTimeout(500);
  await p.click('button:has-text("Yes, reset")');
  await p.waitForTimeout(800);
  await p.evaluate(() => {
    const key = 'axle-competency-v1';
    const d = JSON.parse(localStorage.getItem(key) || '{}');
    d.workflow = d.workflow || {};
    d.workflow.careerPaths = [{ id: 'cp-test', name: 'Sales Career Path', roles: ['Executive', 'Team Lead', 'Manager'], thresholds: [30, 60], status: 'Active' }];
    d.workflow.roleProgressions = [
      { id: 'cp-test-t0', currentRole: 'Executive', nextRole: 'Team Lead', threshold: 30, status: 'Active' },
      { id: 'cp-test-t1', currentRole: 'Team Lead', nextRole: 'Manager', threshold: 60, status: 'Active' }
    ];
    localStorage.setItem(key, JSON.stringify(d));
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const career = await p.$('.cm-lp-career');
  if (career) {
    await career.screenshot({ path: 'C:/Users/M1582/Downloads/career_panel_crop.png' });
    console.log('career screenshot taken');
  } else {
    console.log('career element not found');
  }
  // Also screenshot the full page at 1400 wide
  await p.screenshot({ path: 'C:/Users/M1582/Downloads/learner_1400.png', fullPage: true });
  console.log('done');
  await b.close();
})().catch(e => console.error(e.message));
