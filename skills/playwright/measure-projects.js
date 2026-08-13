const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/#', { waitUntil: 'networkidle', timeout: 15000 });
  await page.evaluate(() => window.location.hash = '#/projects');
  await page.waitForLoadState('networkidle', { timeout: 15000 });
  await page.waitForTimeout(500);

  const timing = await page.evaluate(() => {
    const paints = performance.getEntriesByType('paint');
    return {
      fp: paints.find(e => e.name === 'first-paint')?.startTime,
      fcp: paints.find(e => e.name === 'first-contentful-paint')?.startTime,
    };
  });
  console.log(`FP: ${timing.fp?.toFixed(0)}ms  FCP: ${timing.fcp?.toFixed(0)}ms`);

  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map(r => ({
      name: (r.name.split('/').pop() || r.name).slice(0, 40),
      size: r.transferSize,
      duration: r.duration.toFixed(0),
      type: r.initiatorType,
    })).sort((a, b) => b.size - a.size).slice(0, 15)
  );
  console.log('\n--- Top 15 resources by size ---');
  resources.forEach(r => console.log(`${(r.size/1024).toFixed(1).padStart(6)}KB ${r.duration.padStart(4)}ms ${r.type.padEnd(6)} ${r.name}`));

  const totalSize = resources.reduce((s, r) => s + r.size, 0);
  console.log(`\nTotal transfer size: ${(totalSize/1024).toFixed(0)}KB`);

  const cls = await page.evaluate(() => new Promise(resolve => {
    let cls = 0;
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
    });
    obs.observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => { obs.disconnect(); resolve(cls); }, 2000);
  }));
  console.log(`CLS: ${cls.toFixed(3)} (Goal: <0.1)`);

  const lcp = await page.evaluate(() => new Promise(resolve => {
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) { obs.disconnect(); resolve(e.startTime); }
    });
    obs.observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => { obs.disconnect(); resolve('N/A'); }, 3000);
  }));
  console.log(`LCP: ${lcp}ms (Goal: <2500ms)`);

  const domNodes = await page.evaluate(() => document.querySelectorAll('*').length);
  console.log(`DOM nodes: ${domNodes}`);

  await browser.close();
})();
