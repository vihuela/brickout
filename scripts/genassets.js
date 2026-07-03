// Render icon/splash source images from assets/gen.html
const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--disable-gpu'],
  });
  const jobs = [
    ['icon', 'icon-only.png', 1024, false],
    ['iconfg', 'icon-foreground.png', 1024, true],
    ['iconbg', 'icon-background.png', 1024, false],
    ['splash', 'splash.png', 2732, false],
    ['splash', 'splash-dark.png', 2732, false],
  ];
  for (const [mode, out, size, transparent] of jobs) {
    const page = await browser.newPage();
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.goto('file://' + path.resolve(__dirname, '../assets/gen.html') + '?mode=' + mode);
    await page.waitForFunction('window.__done === true');
    await new Promise(r => setTimeout(r, 300));
    const el = await page.$('#c');
    await el.screenshot({ path: path.resolve(__dirname, '../assets/' + out), omitBackground: transparent });
    await page.close();
    console.log('rendered', out);
  }
  await browser.close();
})();
