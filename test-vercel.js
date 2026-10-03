const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));

    console.log('Navigating to vercel app...');
    await page.goto('https://hoa-management-vert.vercel.app/', { waitUntil: 'networkidle0' });
    
    console.log('Page loaded. Capturing screenshot...');
    await page.screenshot({ path: 'vercel_screenshot.png' });
    
    console.log('Done.');
    await browser.close();
  } catch (err) {
    console.error('Script Error:', err);
  }
})();
