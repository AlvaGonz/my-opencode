const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/#/projects', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1000);

  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map(r => ({
      name: (r.name.split('/').pop() || r.name).slice(0, 40),
      size: r.transferSize,
      duration: r.duration.toFixed(0),
      type: r.initiatorType,
    })).sort((a, b) => b.size - a.size).slice(0, 20)
  );
  console.log('\n--- Resources ---');
  resources.forEach(r => console.log(`${(r.size/1024).toFixed(1).padStart(6)}KB ${r.duration.padStart(4)}ms ${r.type.padEnd(6)} ${r.name}`));
  console.log(`\nTotal: ${(resources.reduce((s, r) => s + r.size, 0) / 1024).toFixed(0)}KB`);

  const cls = await page.evaluate(() => new Promise(resolve => {
    let cls = 0;
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
    });
    obs.observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => { obs.disconnect(); resolve(cls); }, 2000);
  }));
  console.log(`CLS: ${cls.toFixed(3)}`);

  const lcp = await page.evaluate(() => new Promise(resolve => {
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) { obs.disconnect(); resolve(e.startTime); }
    });
    obs.observe({ type: 'largest-contentful-paint', buffered: true });
    setTimeout(() => { obs.disconnect(); resolve('N/A'); }, 4000);
  }));
  console.log(`LCP: ${lcp}ms`);

  const dom = await page.evaluate(() => document.querySelectorAll('*').length);
  console.log(`DOM: ${dom}`);

  await browser.close();
})();
