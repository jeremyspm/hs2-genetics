// Test 6 (spec §6.6): drive every drill in headless Chromium at 375x812 and 1280x800.
//   node tests/drive.mjs [--n=200] [--only=ped-mode]      needs the preview server (node tools/serve.mjs)
// Answers each item at random (taps, blanks, evidence included), then checks: no console errors, no horizontal
// overflow, and a visible, labelled symbol for every person on every chart. Exits non-zero on any failure.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'C:/Users/USER/Desktop/github/airi/node_modules/playwright');
const CHROME = process.env.CHROME || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/opt/pw-browsers/chromium'].find(p => existsSync(p));
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=')[1];
const N = +(arg('n') || 200), ONLY = arg('only');
const BASE = process.env.BASE || 'http://127.0.0.1:8765/hs2-genetics/';
const browser = await chromium.launch({ executablePath: CHROME });
let fails = 0; const failLines = [];
const bad = m => { fails++; if (failLines.length < 40) failLines.push(m); };
for (const [w, h] of [[375, 812], [1280, 800]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  const drills = [];
  for (const scr of ['ped', 'pun']) { await page.goto(BASE + '#' + scr, { waitUntil: 'networkidle' }); (await page.$$eval('[data-drill]', bs => bs.map(b => b.dataset.drill))).forEach(d => drills.push([scr, d])); }
  for (const [scr, d] of drills) {
    if (ONLY && d !== ONLY) continue;
    const t0 = Date.now();
    await page.goto(BASE + '#' + scr, { waitUntil: 'load' });
    await page.click(`[data-drill="${d}"]`);
    for (let k = 0; k < N; k++) {
      // a round is 10; start another from the done screen
      if (await page.$('#again')) await page.click('#again');
      const info = await page.evaluate(() => { const it = SIT.items[SIT.i]; const q = it.q; return { type: q.type, n: q.opts ? q.opts.length : 0, blanks: q.blanks ? q.blanks.length : 0, people: q.people ? q.people.map(p => p.id) : [], build: q.type === 'pun-build' }; });
      // every person on every chart: drawn, labelled, on screen horizontally
      const sym = await page.evaluate(() => {
        const it = SIT.items[SIT.i], chs = it.q.charts || (it.q.chart ? [it.q.chart] : []);
        const want = chs.reduce((a, c) => a + c.people.filter(p => !p.hidden).length, 0);
        const gs = [...document.querySelectorAll('.qchart svg.ped g.ps')];
        const vis = gs.filter(g => { const r = g.getBoundingClientRect(); return r.width > 8 && r.height > 8 && g.getAttribute('aria-label'); });
        const over = document.documentElement.scrollWidth > innerWidth;
        return { want, got: vis.length, over };
      });
      if (sym.got !== sym.want) bad(`${w}px ${d} #${k} (${info.type}): ${sym.got} of ${sym.want} people drawn and labelled`);
      if (sym.over) bad(`${w}px ${d} #${k} (${info.type}): horizontal overflow`);
      if (info.n) {
        await page.click(`[data-o="${Math.floor(Math.random() * info.n)}"]`);
        if (info.type === 'ped-mode' && Math.random() < 0.5 && await page.$('#evStart')) {
          await page.click('#evStart');
          const ps = await page.$$('#cbox .ps');
          for (let j = 0; j < 3 && ps.length; j++) await (await page.$$('#cbox .ps'))[Math.floor(Math.random() * ps.length)].click();
          await page.click(Math.random() < 0.7 ? '#evCheck' : '#evSkip');
        }
        if (await page.$('#sqShow') && Math.random() < 0.3) await page.click('#sqShow');
      } else if (info.blanks) {
        for (let b = 0; b < info.blanks; b++) {
          if (!(await page.$('.ddp'))) await page.click(`[data-b="${b}"]`);
          const os = await page.$$('.ddo'); await os[Math.floor(Math.random() * os.length)].click();
        }
        await page.click('#ckCloze');
      } else if (info.build) {
        const right = Math.random() < 0.5;
        if (right) await page.evaluate(() => { const it = SIT.items[SIT.i], P = it.q.P; it.st.top = P.top.slice(); it.st.side = P.side.slice(); it.st.cells = P.cells.map(r => r.slice()); paintSit(); });
        else {
          for (const k of ['t0', 't1', 's0', 's1']) { const cs = await page.$$('[data-chip]'); await cs[Math.floor(Math.random() * cs.length)].click(); await page.click('[data-slot="' + k + '"]'); }
          for (const c of ['0,0', '0,1', '1,0', '1,1']) { const n = 1 + Math.floor(Math.random() * 3); for (let j = 0; j < n; j++) await page.click('[data-cell="' + c + '"]'); }
        }
        await page.click('#ckBuild');
        if (right && !(await page.evaluate(() => SIT.items[SIT.i].st.ok))) bad(w + 'px pun-build: the right square was marked wrong');
      } else if (info.people.length) {
        const n = Math.floor(Math.random() * info.people.length * 2);
        for (let j = 0; j < n; j++) { const ps = await page.$$('#cbox .ps'); await ps[Math.floor(Math.random() * ps.length)].click(); }
        if (Math.random() < 0.3) { await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowDown'); await page.keyboard.press('Space'); }
        await page.click('#ckAll');
      }
      const fb = await page.$('.fb .verdict');
      if (!fb) bad(`${w}px ${d} #${k} (${info.type}): no feedback after answering`);
      const words = await page.evaluate(() => { const f = document.querySelector('.fb'); if (!f) return 0; const c = f.cloneNode(true); c.querySelectorAll('.fbacts,.evres,.sq,.meta').forEach(x => x.remove()); return c.textContent.trim().split(/\s+/).length; });
      if (words > 95) bad(`${w}px ${d} #${k} (${info.type}): feedback is ${words} words`);
      if (await page.evaluate(() => /[→←⇒]/.test((document.querySelector('.fb') || { textContent: '' }).textContent.replace(/\S+→\S+/g, '')))) bad(`${w}px ${d} #${k}: an arrow character in feedback`);
      if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) bad(`${w}px ${d} #${k} (${info.type}): overflow after answering`);
      await page.click('#nextQ');
      if (errs.length) { bad(`${w}px ${d} #${k}: ${errs.join(' | ')}`); errs.length = 0; }
    }
    console.log(`${w}px ${d}: ${N} items, ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  await page.close();
}
await browser.close();
failLines.forEach(l => console.log('  · ' + l));
console.log(fails ? `FAILED: ${fails} problems` : 'PASS  6 browser drive');
process.exit(fails ? 1 : 0);
