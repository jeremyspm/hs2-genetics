// P6 check-in screenshots: karyotype, phrase chips, the story's three steps, a question on her chart, the Write screen.
//   node tools/p6shots.mjs [--w=375,1280] [--out=shots/p6]
import { createRequire } from 'node:module';
import { mkdirSync, existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/USER/Desktop/github/airi/node_modules/playwright');
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/opt/pw-browsers/chromium'].find(p => existsSync(p));
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const widths = (arg('w') || '375,1280').split(',').map(Number), out = arg('out') || 'shots/p6';
const BASE = process.env.BASE || 'http://127.0.0.1:8765/hs2-genetics/';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: CHROME });
for (const w of widths) {
  const page = await browser.newPage({ viewport: { width: w, height: w < 600 ? 812 : 800 }, deviceScaleFactor: w < 600 ? 2 : 1 });
  const shot = async n => { await page.waitForTimeout(150); await page.screenshot({ path: `${out}/${n}-${w}.png`, fullPage: w < 600 }); console.log(n, w); };
  await page.goto(BASE + '#write', { waitUntil: 'networkidle' }); await shot('write-screen');
  await page.goto(BASE + '#kar', { waitUntil: 'networkidle' }); await page.click('[data-drill="kar-dis"]');
  await page.evaluate(() => { const q = SIT.items[0].q; answer((q.key + 1) % q.opts.length); }); await shot('kar-dis-wrong');
  await page.goto(BASE + '#write', { waitUntil: 'networkidle' }); await page.click('[data-drill="ped-chips"]');
  await page.evaluate(() => { const it = SIT.items[0], q = it.q; it.st.pk = {}; q.groups.forEach(g => { const r = g.opts.map((o, j) => o.right ? j : -1).filter(j => j >= 0); it.st.pk[g.id] = g.multi ? r.slice(0, -1).concat(g.opts.findIndex(o => !o.right)) : (g.id === 'dad' ? g.opts.findIndex(o => !o.right) : r[0]); }); paintSit(); });
  await shot('chips-before'); await page.click('#ckChips'); await shot('chips-wrong');
  await page.evaluate(() => SV('drawFirst', false));
  await page.goto(BASE + '#write', { waitUntil: 'networkidle' }); await page.click('[data-drill="story:XLR"]'); await shot('story-step1');
  await page.evaluate(() => { const i = SIT.items[0].q.charts4.findIndex(c => !c.right); document.querySelector('[data-c4="' + i + '"]').click(); }); await shot('story-step1-wrong');
  await page.click('#storyNext'); await page.evaluate(() => { const it = SIT.items[0]; it.st.taps = it.q.tapKey.slice(0, 1); paintSit(); }); await shot('story-step2');
  await page.click('#ckTap'); await shot('story-step2-checked'); await page.click('#storyNext');
  await page.evaluate(() => { document.querySelector('[data-s3="0:0"]').click(); document.querySelector('[data-s3="1:1"]').click(); }); await shot('story-step3-done');
  await page.goto(BASE + '#her/ad4', { waitUntil: 'networkidle' }); await shot('her-ask-button');
  await page.click('[data-askher]'); await page.evaluate(() => { const q = SIT.items[0].q; if (q.opts) answer(q.key); }); await shot('her-ask-q1');
  await page.goto(BASE, { waitUntil: 'networkidle' }); await shot('home');
  await page.close();
}
await browser.close();
