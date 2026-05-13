const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => logs.push(`[pageerror] ${error.message}`));
  page.on('requestfailed', request => logs.push(`[requestfailed] ${request.url()} ${request.failure().errorText}`));

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 }).catch(e => logs.push(`[nav error] ${e.message}`));
  
  console.log("=== BROWSER LOGS ===");
  logs.forEach(l => console.log(l));
  console.log("====================");
  
  await browser.close();
})();
