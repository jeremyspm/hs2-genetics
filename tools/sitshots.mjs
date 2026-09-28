// Screenshots of a drill mid-sitting: node tools/sitshots.mjs <drill>[,<drill>…] [--w=375,1280] [--wrong] [--out=shots]
// Opens the drill, answers the first item (wrongly with --wrong, so the slip shows), and shoots the answered item.
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/USER/Desktop/github/airi/node_modules/playwright');
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/opt/pw-browsers/chromium'].find(p => existsSync(p));
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const drills = process.argv[2].split(','), widths = (arg('w') || '375,1280').split(',').map(Number), out = arg('out') || 'shots';
const WRONG = process.argv.includes('--wrong'), BEFORE = process.argv.includes('--before');
const BASE = process.env.BASE || 'http://127.0.0.1:8765/hs2-genetics/';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 812 : 800 }, deviceScaleFactor: w < 600 ? 2 : 1 });
  for (const d of drills) {
    await page.goto(BASE + '#' + (d.startsWith('pun') ? 'pun' : 'ped'), { waitUntil: 'networkidle' });
    await page.click(`[data-drill="${d}"]`);
    if (!BEFORE) await page.evaluate(wrong => {
      const it = SIT.items[SIT.i], q = it.q;
      if (q.opts) { const i = wrong ? q.opts.findIndex((o, j) => j !== q.key && o.slip) : q.key; answer(i >= 0 ? i : (q.key + 1) % q.opts.length); }
      else if (q.blanks) { it.st.blanks = q.blanks.map((b, i) => wrong && i === 2 ? (b.key + 1) % b.opts.length : b.key); document.querySelector('#ckCloze') || paintSit(); paintSit(); document.querySelector('#ckCloze').click(); }
      else if (q.people) { q.people.forEach((p, i) => { it.st.marks[p.id] = wrong && i % 3 === 0 ? (p.cycle.indexOf(p.key) + 1) % p.cycle.length : p.cycle.indexOf(p.key); }); paintSit(); document.querySelector('#ckAll').click(); }
    }, WRONG);
    await page.waitForTimeout(200);
    const name = `${out}/${d}${WRONG ? '-wrong' : BEFORE ? '-before' : ''}-${w}.png`;
    await page.screenshot({ path: name, fullPage: w < 600 });
    console.log(name, await page.evaluate(() => document.documentElement.scrollWidth > innerWidth) ? 'OVERFLOW' : '');
  }
  await page.close();
}
await browser.close();
