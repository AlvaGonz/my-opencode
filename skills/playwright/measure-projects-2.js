const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/#/projects', { waitUntil: 'networkidle', timeout: 15000 });

  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource').map(r => ({
      name: (r.name.split('/').pop() || r.name).slice(0, 40),
      size: r.transferSize,
      duration: r.duration.toFixed(0),
      type: r.initiatorType,
    })).sort((a, b) => b.size - a.size).slice(0, 20)
  );
  console.log('\n--- Resources (direct /projects) ---');
  resources.forEach(r => console.log(`${(r.size/1024).toFixed(1).padStart(6)}KB ${r.duration.padStart(4)}ms ${r.type.padEnd(6)} ${r.name}`));

  const totalSize = resources.reduce((s, r) => s + r.size, 0);
  console.log(`\nTotal transfer size: ${(totalSize/1024).toFixed(0)}KB`);

  const hasVideo = resources.some(r => r.name.includes('webm') || r.name.includes('mp4'));
  console.log(`Has video resource: ${hasVideo}`);

  const hasVideoEl = await page.evaluate(() => !!document.querySelector('video'));
  console.log(`Has <video> element: ${hasVideoEl}`);

  const cls = await page.evaluate(() => new Promise(resolve => {
    let cls = 0;
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) cls += e.value;
    });
    obs.observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => { obs.disconnect(); resolve(cls); }, 2000);
  }));
  console.log(`CLS: ${cls.toFixed(3)}`);

  await browser.close();
})();
