const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  page.on('requestfailed', request => console.log('REQ FAILED:', request.url(), request.failure().errorText));
  
  try {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('.login-input[type="email"]');
    await page.type('.login-input[type="email"]', 'test@test.com');
    await page.type('.login-input[type="password"]', 'cricket123');
    await page.click('button[type="submit"]');
    
    await page.waitForSelector('input[placeholder="Team Name"]');
    await page.type('input[placeholder="Team Name"]', 'Puppeteer Team');
    
    console.log("Clicking Add Team button...");
    const btn = await page.$x("//button[contains(., 'Add Team')]");
    if (btn.length > 0) {
      await btn[0].click();
    } else {
      console.log("Add Team button not found");
    }
    
    await new Promise(r => setTimeout(r, 2000));
    console.log("Done");
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();