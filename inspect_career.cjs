const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const p = await b.newPage();
  await p.setViewportSize({ width: 1400, height: 900 });
  await p.goto('http://127.0.0.1:5190/competency-management/learner', { waitUntil: 'networkidle' });

  // Reset + inject career path
  await p.click('button:has-text("Reset demo data")');
  await p.waitForTimeout(400);
  await p.click('button:has-text("Yes, reset")');
  await p.waitForTimeout(600);
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

  // Inspect computed styles
  const info = await p.evaluate(() => {
    const career = document.querySelector('.cm-lp-career');
    const panel = document.querySelector('.cm-lp-panel');
    const card = document.querySelector('section.cm-card');
    if (!career) return { error: 'cm-lp-career not found' };
    const cs = window.getComputedStyle(career);
    const ps = window.getComputedStyle(panel);
    const ks = window.getComputedStyle(card);
    const rect = career.getBoundingClientRect();
    const prect = panel.getBoundingClientRect();
    return {
      career: { position: cs.position, display: cs.display, width: cs.width, top: rect.top, left: rect.left, w: rect.width },
      panel: { position: ps.position, display: ps.display, width: ps.width, top: prect.top, left: prect.left, w: prect.width },
      card: { position: ks.position, display: ks.display, width: ks.width },
      careerParent: career.parentElement?.className,
      careerParentTag: career.parentElement?.tagName,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await b.close();
})().catch(e => console.error(e.message));
