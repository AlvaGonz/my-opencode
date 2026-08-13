const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000/#/projects', { waitUntil: 'networkidle', timeout: 15000 });

  await page.waitForTimeout(500);

  const clsData = await page.evaluate(() => new Promise(resolve => {
    const shifts = [];
    const obs = new PerformanceObserver(list => {
      for (const e of list.getEntries()) {
        if (!e.hadRecentInput) {
          shifts.push({ value: e.value, sources: e.sources.map(s => ({
            node: s.node?.nodeName || '',
            text: (s.node?.textContent || '').trim().slice(0, 40),
            currentRect: s.currentRect,
            previousRect: s.previousRect,
          })) });
        }
      }
    });
    obs.observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => { obs.disconnect(); resolve(shifts.slice(0, 5)); }, 2500);
  }));

  console.log(`\n--- Top CLS shifts ---`);
  for (const shift of clsData) {
    console.log(`  Value: ${shift.value.toFixed(4)}`);
    for (const s of shift.sources.slice(0, 3)) {
      console.log(`    ${s.node}: "${s.text}" cur=[${s.currentRect?.x||0},${s.currentRect?.y||0} ${s.currentRect?.width||0}x${s.currentRect?.height||0}] prev=[${s.previousRect?.x||0},${s.previousRect?.y||0} ${s.previousRect?.width||0}x${s.previousRect?.height||0}]`);
    }
  }

  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.slice(0, 10).map(img => ({
      src: (img.src || '').split('/').pop()?.slice(0, 30),
      w: img.width,
      h: img.height,
      naturalW: img.naturalWidth,
      naturalH: img.naturalHeight,
      hasDims: img.hasAttribute('width') || img.hasAttribute('height'),
    }));
  });
  console.log(`\n--- Images ---`);
  images.forEach(img => console.log(`  ${img.src}: rendered ${img.w}x${img.h}, natural ${img.naturalW}x${img.naturalH}, hasDims=${img.hasDims}`));

  const pageInfo = await page.evaluate(() => {
    return {
      nImgs: document.querySelectorAll('img').length,
      nVideos: document.querySelectorAll('video, iframe').length,
      title: document.title,
      cards: document.querySelectorAll('[class*=card], [class*=Card], li.project-card, article').length,
    };
  });
  console.log(`\nPage: "${pageInfo.title}"`);
  console.log(`Images: ${pageInfo.nImgs}, Videos/iframes: ${pageInfo.nVideos}, Cards: ${pageInfo.cards}`);

  await browser.close();
})();
