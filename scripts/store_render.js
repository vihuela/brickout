// Render Play Store listing graphics from compose.html.
// Usage: node scripts/store_render.js [slide ...]   (default: all)
const puppeteer = require('puppeteer-core');
const path = require('path');

const OUT = {
  p1:   ['portrait-1-shoot-smash',  1080, 1920],
  p2:   ['portrait-2-perfect-aim',  1080, 1920],
  p3:   ['portrait-3-game-modes',   1080, 1920],
  p4:   ['portrait-4-ball-skins',   1080, 1920],
  l1:   ['landscape-1-hero',        1920, 1080],
  l2:   ['landscape-2-features',    1920, 1080],
  icon: ['app-icon-512',            512,  512, 'png'], // Play app icon: 32-bit PNG, <=1MB
  feature: ['feature-graphic-1024x500', 1024, 500],    // Play feature graphic: JPEG/PNG no alpha, <=15MB
};

(async () => {
  const slides = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(OUT);
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--disable-gpu', '--force-device-scale-factor=1', '--hide-scrollbars'],
  });
  for (const slide of slides) {
    const [name, w, h, fmt = 'jpeg'] = OUT[slide];
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto('file://' + path.resolve(__dirname, '../store-listing/_src/compose.html') + '?slide=' + slide);
    await new Promise(r => setTimeout(r, 700)); // fonts / images settle
    const ext = fmt === 'png' ? '.png' : '.jpg';
    const file = path.resolve(__dirname, '../store-listing/', name + ext);
    await page.screenshot(fmt === 'png' ? { path: file, type: 'png' }
                                        : { path: file, type: 'jpeg', quality: 95 });
    await page.close();
    console.log('rendered', name + ext, w + 'x' + h);
  }
  await browser.close();
})();
