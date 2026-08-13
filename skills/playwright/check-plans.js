const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE_ERROR:', err.message));
  page.on('response', resp => {
    if (resp.status() >= 400) console.log('HTTP_ERROR:', resp.status(), resp.url());
  });
  await page.goto('http://localhost:3000/#/plans', { waitUntil: 'networkidle', timeout: 30000 }).catch(e => console.log('NAV_ERROR:', e.message));
  await page.waitForTimeout(3000);
  const text = await page.innerText('body').catch(() => '');
  console.log('--- BODY TEXT ---');
  console.log(text.substring(0, 2000));
  await browser.close();
})();
