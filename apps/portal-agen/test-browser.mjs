import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure().errorText));
  page.on('response', async response => {
    if (response.url().includes('/api/users') && response.request().method() === 'POST') {
      console.log('POST /api/users response:', response.status(), await response.text());
    }
  });

  await page.goto('https://kontenmu.labmu.dev/');
  
  // Wait for login form
  await page.waitForSelector('input[placeholder="Username"]');
  await page.type('input[placeholder="Username"]', 'spemutu');
  await page.type('input[placeholder="Password"]', 'B1smillah_123');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForSelector('text/SMP MUHAMMADIYAH 1 GRESIK');
  
  // Go to Users page
  await page.goto('https://kontenmu.labmu.dev/school-users');
  await page.waitForSelector('button:has-text("Tambah User")');
  await page.click('button:has-text("Tambah User")');

  // Fill form
  await page.waitForSelector('input[name="nama"]');
  await page.type('input[name="nama"]', 'koplak_puppeteer');
  await page.type('input[name="username"]', 'koplak_puppeteer');
  
  // Submit
  await page.click('button:has-text("Simpan")');
  
  // Wait a bit
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
