const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  page.on('response', response => {
    if (response.status() >= 300 && response.status() < 400) {
      console.log(`Redirect: ${response.url()} -> ${response.headers()['location'] || 'N/A'} (${response.status()})`);
    }
    if (response.status() >= 400) {
      console.log(`Error: ${response.url()} -> ${response.status()}`);
    }
  });

  await page.goto(`${TARGET_URL}/#/admin/projects/ecc3f121-f494-d477-6ce5-00069f8a27ab/edit`, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('URL after navigation:', page.url());
  console.log('Page title:', await page.title());
  const body = await page.locator('body').textContent();
  console.log('Body text (first 500 chars):', body.substring(0, 500));
  await page.screenshot({ path: './what-page.png', fullPage: true });
  await browser.close();
})();
