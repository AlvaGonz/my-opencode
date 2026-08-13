const { chromium } = require('playwright');
const TARGET_URL = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${TARGET_URL}/#/admin/projects/ecc3f121-f494-d477-6ce5-00069f8a27ab/edit`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: './page-edit.png', fullPage: true });

  const deleteBtn = page.locator('button:has-text("Eliminar Expediente")');
  const deleteBtnExists = await deleteBtn.count();
  console.log('Delete button exists:', deleteBtnExists > 0);
  if (deleteBtnExists > 0) {
    console.log('Delete button text:', await deleteBtn.textContent());
    console.log('Delete button visible:', await deleteBtn.isVisible());
  }

  const dialog = page.locator('dialog');
  const dialogCount = await dialog.count();
  console.log('Dialog elements in DOM:', dialogCount);
  if (dialogCount > 0) {
    const isOpen = await dialog.first().getAttribute('open');
    console.log('Dialog open attr:', isOpen);
    console.log('Dialog visible:', await dialog.first().isVisible());
  }

  if (deleteBtnExists > 0) {
    await deleteBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: './modal-open.png', fullPage: true });
    console.log('After click - Dialog visible:', await dialog.first().isVisible());
  }

  await browser.close();
})();
