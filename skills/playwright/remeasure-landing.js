const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/#/', { waitUntil: 'commit', timeout: 15000 });
  await page.waitForLoadState('networkidle');

  const timing = await page.evaluate(() => JSON.stringify(performance.timing));
  const nav = JSON.parse(timing);
  console.log('DOMContentLoaded:', nav.domContentLoadedEventEnd - nav.navigationStart, 'ms');
  console.log('Load:', nav.loadEventEnd - nav.navigationStart, 'ms');
  console.log('First Paint:', (nav.responseStart - nav.navigationStart), 'ms');

  const resources = await page.evaluate(() => 
    performance.getEntriesByType('resource')
      .filter(r => r.initiatorType === 'img' || r.initiatorType === 'video' || r.initiatorType === 'media')
      .map(r => ({ name: r.name.split('/').pop(), duration: r.duration.toFixed(0), size: r.transferSize, type: r.initiatorType }))
  );
  console.log('\n--- IMAGES/VIDEOS ---');
  resources.forEach(r => console.log(`${r.duration}ms ${r.type} ${r.name} (${r.size}B)`));

  const cls = await page.evaluate(() => {
    return new Promise(resolve => {
      let cls = 0;
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) cls += entry.value;
        }
      });
      observer.observe({ type: 'layout-shift', buffered: true });
      setTimeout(() => { observer.disconnect(); resolve(cls); }, 2000);
    });
  });
  console.log('\nCLS:', cls);
  
  const lcp = await page.evaluate(() => {
    return new Promise(resolve => {
      const observer = new PerformanceObserver(list => {
        const entries = list.getEntries();
        resolve(entries[entries.length - 1]?.renderTime || entries[entries.length - 1]?.loadTime || 0);
      });
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => { observer.disconnect(); resolve('N/A'); }, 2000);
    });
  });
  console.log('LCP:', lcp, 'ms');

  await browser.close();
})();
