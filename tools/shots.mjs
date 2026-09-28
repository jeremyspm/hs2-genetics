// Screenshots for the check-ins: node tools/shots.mjs <route>[,<route>…] [--w=375,1280] [--full] [--out=shots]
// Needs the preview server (node tools/serve.mjs). Playwright comes from $PLAYWRIGHT (a node_modules/playwright path);
// the browser is the installed Chrome, or $CHROME (on the cloud box: /opt/pw-browsers/chromium).
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const PW = process.env.PLAYWRIGHT || 'C:/Users/USER/Desktop/github/airi/node_modules/playwright';
const { chromium } = require(PW);
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/opt/pw-browsers/chromium'].find(p => existsSync(p));
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const routes = (process.argv[2] || '').split(',');
const widths = (arg('w') || '375,1280').split(',').map(Number);
const out = arg('out') || 'shots';
const base = process.env.BASE || 'http://127.0.0.1:8765/hs2-genetics/';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 812 : 800 }, deviceScaleFactor: w < 600 ? 2 : 1 });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  for (const r of routes) {
    await page.goto(base + (r ? '#' + r : ''), { waitUntil: 'networkidle' });
    await page.evaluate(() => { if (typeof render === 'function') render(); });
    await page.waitForTimeout(250);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    const name = `${out}/${(r || 'home').replace(/[\/#:?]/g, '_')}-${w}.png`;
    await page.screenshot({ path: name, fullPage: process.argv.includes('--full') });
    console.log(name, over ? 'HORIZONTAL OVERFLOW' : 'no overflow', errs.length ? 'ERRORS: ' + errs.join(' | ') : '');
    errs.length = 0;
  }
  await page.close();
}
await browser.close();
