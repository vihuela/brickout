// Screenshot helper: node scripts/shoot.js <name> <url-params> <waitMs> [actions]
// actions: "tap:x,y"  "drag:x1,y1,x2,y2"  "wait:ms"  (logical 390x844 css px)
const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const [, , name = 'shot', params = '', waitMs = '2000', ...actions] = process.argv;
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--disable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('console', m => { if (m.type() === 'error') console.log('[console]', m.text()); });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  const url = 'file://' + path.resolve(__dirname, '../www/index.html') + (params ? '?' + params : '');
  await page.goto(url);
  await new Promise(r => setTimeout(r, parseInt(waitMs)));

  for (const act of actions) {
    const [kind, rest] = act.split(':');
    const nums = (rest || '').split(',').map(Number);
    if (kind === 'tap') {
      await page.touchscreen.touchStart(nums[0], nums[1]);
      await new Promise(r => setTimeout(r, 60));
      await page.touchscreen.touchEnd();
    } else if (kind === 'drag') {
      await page.touchscreen.touchStart(nums[0], nums[1]);
      for (let i = 1; i <= 8; i++) {
        await page.touchscreen.touchMove(
          nums[0] + (nums[2] - nums[0]) * i / 8,
          nums[1] + (nums[3] - nums[1]) * i / 8);
        await new Promise(r => setTimeout(r, 25));
      }
      await page.touchscreen.touchEnd();
    } else if (kind === 'draghold') {
      await page.touchscreen.touchStart(nums[0], nums[1]);
      for (let i = 1; i <= 8; i++) {
        await page.touchscreen.touchMove(
          nums[0] + (nums[2] - nums[0]) * i / 8,
          nums[1] + (nums[3] - nums[1]) * i / 8);
        await new Promise(r => setTimeout(r, 25));
      }
      // hold, no touchEnd
    } else if (kind === 'js') {
      await page.evaluate(act.slice(3));
    } else if (kind === 'wait') {
      await new Promise(r => setTimeout(r, nums[0]));
    }
  }
  await page.screenshot({ path: '/tmp/brickout_ref/' + name + '.png' });
  await browser.close();
  console.log('saved', name + '.png');
})();
