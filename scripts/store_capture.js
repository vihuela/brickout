// Batch capture raw material for Play Store listing graphics.
// Usage: node scripts/store_capture.js [outDir]
// Two viewport sets: '916' = 540x960@2 (1080x1920 full-bleed), 'phone' = 390x844@2 (framed mockups).
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const SHOTS = [
  // name, viewport, url params, wait ms, actions (shoot.js syntax)
  ['title',        'phone', 'lang=en', 2500, []],
  ['title916',     '916',   'lang=en', 2500, []],
  ['shop',         'phone', 'lang=en', 2000, ['js:BO.store.gems=735', 'tap:38,42', 'wait:900']],
  ['aim',          '916',   'scene=game&level=6&lang=en', 1600, ['draghold:270,760,205,560', 'wait:120']],
  ['aim_phone',    'phone', 'scene=game&level=6&lang=en', 1600, ['draghold:195,660,150,470', 'wait:120']],
  ['classic_a',    '916',   'scene=game&level=9&mode=classic&auto=1&lang=en', 3200, []],
  ['classic_b',    '916',   'scene=game&level=9&mode=classic&auto=1&lang=en', 4400, []],
  ['classic_c',    '916',   'scene=game&level=12&mode=classic&auto=1&lang=en', 5200, []],
  ['classic_phone','phone', 'scene=game&level=9&mode=classic&auto=1&lang=en', 4400, []],
  ['gravity_a',    '916',   'scene=game&level=8&mode=gravity&auto=1&lang=en', 3600, []],
  ['gravity_b',    '916',   'scene=game&level=8&mode=gravity&auto=1&lang=en', 4800, []],
  ['gravity_phone','phone', 'scene=game&level=8&mode=gravity&auto=1&lang=en', 4200, []],
  ['limit_phone',  'phone', 'scene=game&level=7&mode=limit&auto=1&lang=en', 3800, []],
];

const VIEWPORTS = {
  '916':   { width: 540, height: 960, deviceScaleFactor: 2 },
  'phone': { width: 390, height: 844, deviceScaleFactor: 2 },
};

(async () => {
  const outDir = process.argv[2] || path.resolve(__dirname, '../store-listing/_raw');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: 'new',
    args: ['--disable-gpu', '--mute-audio', '--autoplay-policy=no-user-gesture-required'],
  });

  for (const [name, vp, params, waitMs, actions] of SHOTS) {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORTS[vp]);
    page.on('pageerror', e => console.log('[pageerror]', name, e.message));
    const url = 'file://' + path.resolve(__dirname, '../www/index.html') + (params ? '?' + params : '');
    await page.goto(url);
    await new Promise(r => setTimeout(r, waitMs));
    for (const act of actions) {
      const [kind] = act.split(':');
      const rest = act.slice(kind.length + 1);
      const nums = rest.split(',').map(Number);
      if (kind === 'tap') {
        await page.touchscreen.touchStart(nums[0], nums[1]);
        await new Promise(r => setTimeout(r, 60));
        await page.touchscreen.touchEnd();
      } else if (kind === 'draghold') {
        await page.touchscreen.touchStart(nums[0], nums[1]);
        for (let i = 1; i <= 8; i++) {
          await page.touchscreen.touchMove(
            nums[0] + (nums[2] - nums[0]) * i / 8,
            nums[1] + (nums[3] - nums[1]) * i / 8);
          await new Promise(r => setTimeout(r, 25));
        }
      } else if (kind === 'js') {
        await page.evaluate(rest);
      } else if (kind === 'wait') {
        await new Promise(r => setTimeout(r, nums[0]));
      }
    }
    await page.screenshot({ path: path.join(outDir, name + '.png') });
    await page.close();
    console.log('saved', name + '.png');
  }
  await browser.close();
})();
