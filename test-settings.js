const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Navigate to login
  await page.goto('http://localhost:3000/login');
  await page.type('input[placeholder="username"]', 'admin');
  await page.type('input[placeholder="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForNavigation();
  
  // Navigate to settings
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000/settings', { waitUntil: 'networkidle0' });
  
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('PAGE TEXT:\n', bodyText.substring(0, 500));
  
  await browser.close();
})();
