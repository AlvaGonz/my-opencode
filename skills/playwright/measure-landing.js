const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Measure navigation timing
  await page.goto('http://localhost:3000/#/', { waitUntil: 'commit', timeout: 15000 });
  
  const timing = await page.evaluate(() => JSON.stringify(performance.timing));
  console.log('--- PERFORMANCE TIMING ---');
  console.log(timing);

  // Wait for full load
  await page.waitForLoadState('networkidle');
  
  const timing2 = await page.evaluate(() => JSON.stringify(performance.timing));
  const nav = JSON.parse(timing2);
  console.log('\n--- KEY METRICS ---');
  console.log('DOMContentLoaded:', nav.domContentLoadedEventEnd - nav.navigationStart, 'ms');
  console.log('Load:', nav.loadEventEnd - nav.navigationStart, 'ms');
  console.log('DOM Interactive:', nav.domInteractive - nav.navigationStart, 'ms');
  console.log('First Paint (if available):', (nav.responseStart - nav.navigationStart) || 'N/A', 'ms');

  // Count images
  const imgCount = await page.evaluate(() => document.images.length);
  console.log('\nImages on page:', imgCount);
  
  // List all image sources with sizes
  const images = await page.evaluate(() => 
    Array.from(document.images).map(img => ({
      src: img.src,
      width: img.width,
      height: img.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
      loading: img.loading || 'default'
    }))
  );
  console.log('\n--- IMAGES ---');
  images.forEach(img => console.log(`${img.src} -> ${img.naturalWidth}x${img.naturalHeight} (loading=${img.loading})`));

  // Check for render-blocking resources
  const resources = await page.evaluate(() => 
    performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      duration: r.duration.toFixed(0),
      size: r.transferSize || 0,
      type: r.initiatorType
    }))
  );
  console.log('\n--- RESOURCES (slowest first) ---');
  resources.sort((a, b) => b.duration - a.duration).slice(0, 15).forEach(r => 
    console.log(`${r.duration}ms ${r.type} ${r.name.split('/').pop() || r.name}`)
  );

  // Check for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });

  await browser.close();
})();
