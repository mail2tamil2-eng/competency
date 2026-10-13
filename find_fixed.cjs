const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1400, height: 900 });
  await p.goto('http://127.0.0.1:5190/competency-management/learner', { waitUntil: 'networkidle' });
  await p.click('button:has-text("Reset demo data")');
  await p.waitForTimeout(400);
  await p.click('button:has-text("Yes, reset")');
  await p.waitForTimeout(600);
  await p.evaluate(() => {
    const key = 'axle-competency-v1';
    const d = JSON.parse(localStorage.getItem(key) || '{}');
    d.workflow = d.workflow || {};
    d.workflow.careerPaths = [{ id: 'cp-test', name: 'Sales Career Path', roles: ['Executive', 'Team Lead', 'Manager'], thresholds: [30, 60], status: 'Active' }];
    localStorage.setItem(key, JSON.stringify(d));
  });
  await p.reload({ waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);

  const rules = await p.evaluate(() => {
    const panel = document.querySelector('.cm-lp-panel');
    if (!panel) return 'not found';
    const results = [];
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && rule.style && rule.style.position) {
            // Check if this rule could apply to our element
            try {
              if (panel.matches(rule.selectorText)) {
                results.push({ selector: rule.selectorText, position: rule.style.position, href: sheet.href });
              }
            } catch(e) {}
          }
        }
      } catch(e) {}
    }
    return results;
  });
  console.log(JSON.stringify(rules, null, 2));
  await b.close();
})().catch(e => console.error(e.message));
