// HS2 Genetics Trainer · the test runner (spec §6). Loads the SAME engine.js the page loads.
//   node tests/run.mjs            everything but the browser drive
//   node tests/run.mjs --quick    fewer items per type (for a fast loop)
// Exits non-zero on any failure. The browser drive (§6.6) is tests/drive.mjs.
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const G = require(join(ROOT, 'engine.js'));
const HER = require(join(ROOT, 'her-charts.js'));
const QUICK = process.argv.includes('--quick');
const ONLY = (process.argv.find(a => a.startsWith('--only=')) || '').slice(7);

let fails = 0, checks = 0;
const failLines = [];
function ok(cond, msg) { checks++; if (!cond) { fails++; if (failLines.length < 60) failLines.push(msg); } return cond; }
function section(name, fn) {
  if (ONLY && !name.startsWith(ONLY)) return;
  const f0 = fails, c0 = checks, t0 = Date.now();
  fn();
  console.log(`${fails === f0 ? 'PASS' : 'FAIL'}  ${name}  (${checks - c0} checks, ${fails - f0} failed, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  while (failLines.length) console.log('      · ' + failLines.shift());
}

/* ─── 1. Punnett, brute force (§6.1) ─────────────────────────────────────────────── */
section('1 Punnett brute force', () => {
  const count = xs => { const o = {}; xs.forEach(x => o[x] = (o[x] || 0) + 1); return o; };
  const same = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
  // autosomal complete dominance, every letter
  for (const L of G.LETTERS) {
    const l = L.toLowerCase(), gs = [L + L, L + l, l + l];
    for (const a of gs) for (const b of gs) {
      const kids = [];
      for (const x of a) for (const y of b) kids.push([x, y].sort((p, q) => (p === L ? 0 : 1) - (q === L ? 0 : 1)).join(''));
      const P = G.punnett('auto', a, b, { dom: 'dom', rec: 'rec' });
      ok(same(P.geno, count(kids)), `auto ${a}×${b}: engine ${JSON.stringify(P.geno)} vs naive ${JSON.stringify(count(kids))}`);
      ok(same(P.phen, count(kids.map(k => k.includes(L) ? 'dom' : 'rec'))), `auto ${a}×${b} phenotypes`);
    }
  }
  // X-linked, both notations, recessive and dominant
  for (const [U, lo] of [['ᴴ', 'ʰ'], ['H', 'h'], ['ᴮ', 'ᵇ'], ['R', 'r']]) {
    const XU = 'X' + U, XL = 'X' + lo;
    const dads = [XU + 'Y', XL + 'Y'], mums = [XU + XU, XU + XL, XL + XL];
    for (const fam of ['xl', 'xld']) for (const f of dads) for (const m of mums) {
      const fg = [f.slice(0, 1 + U.length), 'Y'], mg = [m.slice(0, 1 + U.length), m.slice(1 + U.length)];
      const kids = [];
      for (const x of fg) for (const y of mg) kids.push(x === 'Y' ? y + 'Y' : [x, y].sort((p, q) => (p === XU ? 0 : 1) - (q === XU ? 0 : 1)).join(''));
      const P = G.punnett(fam, f, m);
      ok(same(P.geno, count(kids)), `${fam} ${f}×${m}: ${JSON.stringify(P.geno)} vs ${JSON.stringify(count(kids))}`);
      const recN = k => (k.match(new RegExp('X' + lo, 'g')) || []).length;
      const aff = k => fam === 'xl' ? (k.endsWith('Y') ? recN(k) === 1 : recN(k) === 2) : (k.endsWith('Y') ? recN(k) === 0 : recN(k) < 2);
      const sons = kids.filter(k => k.endsWith('Y')), daus = kids.filter(k => !k.endsWith('Y'));
      ok(P.pChildAff === kids.filter(aff).length / 4, `${fam} ${f}×${m} P(child affected)`);
      ok(P.pSonAff === sons.filter(aff).length / sons.length, `${fam} ${f}×${m} P(son affected)`);
      ok(P.pDauAff === daus.filter(aff).length / daus.length, `${fam} ${f}×${m} P(daughter affected)`);
      ok(P.pAffSon === sons.filter(aff).length / 4, `${fam} ${f}×${m} P(affected son)`);
      ok(P.pCarrierDau === daus.filter(k => !aff(k) && recN(k) === 1).length / 4, `${fam} ${f}×${m} P(carrier daughter)`);
    }
  }
  // ABO: all 21 genotype pairs, both notations
  for (const [A, B, O] of [['A', 'B', 'O'], ['Iᴬ', 'Iᴮ', 'i']]) {
    const gs = [A + A, A + O, B + B, B + O, A + B, O + O];
    const al = g => g === A + A ? [A, A] : g === A + O ? [A, O] : g === B + B ? [B, B] : g === B + O ? [B, O] : g === A + B ? [A, B] : [O, O];
    const ord = x => x === A ? 0 : x === B ? 1 : 2;
    const type = k => { const s = new Set(k); return s.has(A) && s.has(B) ? 'AB' : s.has(A) ? 'A' : s.has(B) ? 'B' : 'O'; };
    let pairs = 0;
    for (let i = 0; i < 6; i++) for (let j = i; j < 6; j++) {
      pairs++;
      const kids = [];
      for (const x of al(gs[i])) for (const y of al(gs[j])) kids.push([x, y].sort((p, q) => ord(p) - ord(q)));
      const P = G.punnett('abo', gs[i], gs[j]);
      ok(same(P.geno, count(kids.map(k => k.join('')))), `abo ${gs[i]}×${gs[j]}: ${JSON.stringify(P.geno)} vs ${JSON.stringify(count(kids.map(k => k.join(''))))}`);
      ok(same(P.phen, count(kids.map(type))), `abo ${gs[i]}×${gs[j]} blood types`);
    }
    ok(pairs === 21, 'all 21 ABO pairs');
  }
  // incomplete dominance
  const names = { R: 'red', W: 'white' };
  for (const a of ['RR', 'RW', 'WW']) for (const b of ['RR', 'RW', 'WW']) {
    const kids = []; for (const x of a) for (const y of b) kids.push([x, y].sort().join(''));
    const P = G.punnett('inc', a, b, { names, het: 'pink' });
    ok(same(P.geno, count(kids)), `inc ${a}×${b}`);
    ok(same(P.phen, count(kids.map(k => k[0] === k[1] ? names[k[0]] : 'pink'))), `inc ${a}×${b} phenotypes`);
  }
});

/* ─── an independent brute force for the pedigree solver ──────────────────────────── */
const NV = {                       // genotype spaces and rules, written again from scratch
  space(mode, sex) { if (mode === 'AD' || mode === 'AR') return [0, 1, 2]; if (mode === 'XLD' || mode === 'XLR') return sex === 'F' ? [0, 1, 2] : [0, 1]; if (mode === 'YL') return sex === 'M' ? [0, 1] : [0]; return [0, 1]; },
  aff(mode, sex, d) { return mode === 'AD' ? d > 0 : mode === 'AR' ? d === 2 : mode === 'XLD' ? d > 0 : mode === 'XLR' ? (sex === 'M' ? d === 1 : d === 2) : d === 1; },
  // probability of a child genotype, by listing the gametes
  pChild(mode, fd, md, sex, cd) {
    const gam = (d, n) => Array.from({ length: n }, (_, i) => i < d ? 1 : 0);
    let hit = 0, tot = 0;
    if (mode === 'AD' || mode === 'AR') { for (const x of gam(fd, 2)) for (const y of gam(md, 2)) { tot++; if (x + y === cd) hit++; } }
    else if (mode === 'XLD' || mode === 'XLR') { for (const y of gam(md, 2)) { tot++; if ((sex === 'M' ? y : fd + y) === cd) hit++; } }
    else if (mode === 'YL') { tot = 1; hit = (sex === 'M' ? fd : 0) === cd ? 1 : 0; }
    else { tot = 1; hit = md === cd ? 1 : 0; }
    return hit / tot;
  }
};
function naive(ch, mode) {
  const P = ch.people, by = Object.fromEntries(P.map(p => [p.id, p]));
  const hasPar = id => !!by[id].father;
  const partners = {}; P.forEach(p => partners[p.id] = []);
  ch.couples.forEach(c => { partners[c.a].push(c.b); partners[c.b].push(c.a); });
  const mi = new Set(P.filter(p => !hasPar(p.id) && partners[p.id].some(q => hasPar(q))).map(p => p.id));
  const carrier = (p, d) => d > 0 && !NV.aff(mode, p.sex, d);
  const fits = (p, d) => NV.aff(mode, p.sex, d) === !!p.affected && (!p.carrierShown || carrier(p, d));
  const tOpts = p => NV.space(mode, p.sex).filter(d => fits(p, d) && !((mode === 'AD' || mode === 'XLD') && p.affected && d !== 1));
  const sets = {}; P.forEach(p => sets[p.id] = new Set());
  const pairs = {}; P.forEach(p => { if (p.father) pairs[p.father + '|' + p.mother] = new Set(); });
  let any = false, minCost = Infinity; const T = {};
  const g = {};
  (function rec(i) {
    if (i === P.length) {
      for (const p of P) { if (!fits(p, g[p.id])) return; if (p.father && NV.pChild(mode, g[p.father], g[p.mother], p.sex, g[p.id]) === 0) return; }
      any = true;
      P.forEach(p => sets[p.id].add(g[p.id]));
      for (const k in pairs) { const [f, m] = k.split('|'); pairs[k].add(g[f] + '|' + g[m]); }
      let cost = 0; for (const id of mi) if (!by[id].affected && g[id] > 0) cost++;
      minCost = Math.min(minCost, cost);
      let w = 1, tok = true;
      for (const p of P) {
        if (!p.father) { const o = tOpts(p); if (!o.includes(g[p.id])) tok = false; else if (!mi.has(p.id)) w /= o.length; }
        else w *= NV.pChild(mode, g[p.father], g[p.mother], p.sex, g[p.id]);
      }
      if (tok) { const key = [...mi].map(id => g[id]).join(','); T[key] = T[key] || { cost, w: 0 }; T[key].w += w; }
      return;
    }
    const p = P[i];
    for (const d of NV.space(mode, p.sex)) { g[p.id] = d; rec(i + 1); }
  })(0);
  let bestT = 0; for (const k in T) if (T[k].cost === minCost && T[k].w > bestT) bestT = T[k].w;
  return { possible: any, sets, pairs, cost: minCost, T: bestT };
}
function smallChart(R) {
  for (;;) {
    const mode = R.pick(G.MODES);
    const ch = G.genChart(R, mode, { gens: R.pick([2, 3, 3]), maxSlots: 7, twins: 0, cousins: 0.5 });
    if (!ch || ch.people.length > 10) continue;
    // scramble some phenotypes so impossible charts are tested too, and sometimes show carriers
    if (R.chance(0.5)) { const n = R.int(1, 2); for (let i = 0; i < n; i++) { const p = R.pick(ch.people); p.affected = !p.affected; } }
    if (R.chance(0.2)) { ch.carriersShown = true; ch.people.forEach(p => { if (!p.affected && R.chance(0.25)) p.carrierShown = true; }); }
    ch.people.forEach(p => delete p._d);
    return ch;
  }
}

/* ─── 2. solver vs naive (§6.2) ──────────────────────────────────────────────────── */
section('2 solver vs brute force', () => {
  const R = G.rng(20260928);
  const N = QUICK ? 300 : 2000;
  let impossible = 0;
  for (let i = 0; i < N; i++) {
    const ch = smallChart(R);
    for (const mode of G.MODES) {
      const a = G.solve(ch, mode), b = naive(ch, mode);
      if (!ok(a.possible === b.possible, `chart ${i} ${mode}: possible ${a.possible} vs ${b.possible}`)) continue;
      if (!a.possible) { impossible++; continue; }
      for (const p of ch.people) ok(JSON.stringify(a.sets[p.id]) === JSON.stringify([...b.sets[p.id]].sort()), `chart ${i} ${mode} ${p.id}: set ${a.sets[p.id]} vs ${[...b.sets[p.id]].sort()}`);
      for (const k in b.pairs) ok(JSON.stringify(a.pairs[k].map(x => x.join('|')).sort()) === JSON.stringify([...b.pairs[k]].sort()), `chart ${i} ${mode} pairs ${k}`);
      ok(a.cost === b.cost, `chart ${i} ${mode}: cost ${a.cost} vs ${b.cost}`);
      ok(Math.abs(a.T - b.T) <= 1e-12 * Math.max(1, b.T), `chart ${i} ${mode}: T ${a.T} vs ${b.T}`);
    }
  }
  ok(impossible > 100, `enough impossible cases exercised (${impossible})`);
});

/* ─── 3. generated questions (§6.3) ──────────────────────────────────────────────── */
function strip(ch) {
  const c = JSON.parse(JSON.stringify(ch));
  c.people.forEach(p => { delete p._d; delete p._side; });
  delete c.mode_;
  return c;
}
section('3 generated questions', () => {
  const R = G.rng(424242);
  const N = QUICK ? 60 : 500;
  const stats = [];
  for (const [type, T] of Object.entries(G.PED_TYPES)) {
    for (const mode of T.modes) {
      const premises = type === 'ped-geno' ? [null, 'mode', 'shade'] : [null];
      const slots = {}; let made = 0, tries = 0, ms = 0;
      while (made < N && tries < N * 3) {
        tries++;
        const t0 = performance.now();
        const q = G.make(type, R, { mode, premise: R.pick(premises) });
        ms += performance.now() - t0;
        if (!q) continue;
        made++;
        const tag = `${type}/${mode} #${made}`;
        if (type === 'ped-ab') {
          const D = G.DERIVE[type](q.charts.map(strip), q.args);
          ok(D.ok && q.opts[q.key].t === D.key, `${tag}: key ${q.opts[q.key].t} vs ${D.key}`);
          slots[q.key] = (slots[q.key] || 0) + 1; continue;
        }
        const ch = strip(q.chart);
        const D = G.DERIVE[type](ch, q.args);
        if (!ok(D.ok, `${tag}: re-derive says the question is not askable`)) continue;
        if (type === 'ped-cloze') {
          q.blanks.forEach((b, i) => {
            ok(b.opts[b.key].t === D.blanks[i].key, `${tag} blank ${i}: ${b.opts[b.key].t} vs ${D.blanks[i].key}`);
            ok(new Set(b.opts.map(o => o.t)).size === b.opts.length, `${tag} blank ${i}: duplicate options`);
            for (const o of b.opts) if (o.slip) ok(D.blanks[i].tagged.some(x => x.t === o.t && x.slip === o.slip), `${tag} blank ${i}: slip ${o.slip} on "${o.t}" does not re-derive`);
          });
          continue;
        }
        if (type === 'ped-all') {
          q.people.forEach((p, i) => ok(p.key === D.people[i].key, `${tag} ${p.id}: ${p.key} vs ${D.people[i].key}`));
          continue;
        }
        const texts = q.opts.map(o => o.t);
        ok(new Set(texts).size === texts.length, `${tag}: duplicate options ${texts}`);
        ok(D.correct(q.opts[q.key].t), `${tag}: keyed option "${q.opts[q.key].t}" is not right (derive says ${D.key})`);
        ok(texts.filter(t => D.correct(t)).length === 1, `${tag}: ${texts.filter(t => D.correct(t)).length} right options in ${texts}`);
        for (const o of q.opts) if (o.slip) ok(D.tagged.some(x => x.t === o.t && x.slip === o.slip), `${tag}: slip ${o.slip} on "${o.t}" does not re-derive (${JSON.stringify(D.tagged)})`);
        if (type === 'ped-next') ok(texts.every(t => /^(0|25|50|75|100)%$/.test(t)), `${tag}: a chance outside 0/25/50/75/100: ${texts}`);
        if (type === 'ped-mode') {
          ok(ch.people.filter(p => p.affected).length >= 3, `${tag}: fewer than 3 affected`);
          ok(G.evidenceOK(ch, G.modesOf(q.opts[q.key].t), q.args.opts), `${tag}: evidence rule §4.4.6`);
        }
        slots[q.key] = (slots[q.key] || 0) + 1;
      }
      ok(made >= N * 0.9, `${type}/${mode}: only ${made} of ${N} made`);
      const counts = Object.values(slots), n = counts.reduce((a, b) => a + b, 0), k = Math.max(...Object.keys(slots).map(Number)) + 1;
      if (n && k > 1) ok(Math.min(...Array.from({ length: k }, (_, i) => slots[i] || 0)) >= (QUICK ? 0.3 : 0.5) * n / k, `${type}/${mode}: key position not spread: ${JSON.stringify(slots)}`);
      stats.push(`${type}/${mode} ${made} (${(ms / Math.max(1, tries)).toFixed(1)} ms)`);
    }
  }
  // the Punnett types: no chart, the args alone re-derive the key
  for (const [type] of Object.entries(G.PUN_TYPES)) {
    const slots = {}; let made = 0;
    for (let k = 0; k < N; k++) {
      const q = G.make(type, R, {}); if (!q) continue; made++;
      const tag = `${type} #${made}`;
      const D = G.DERIVE[type](null, JSON.parse(JSON.stringify(q.args)));
      if (!ok(D.ok, `${tag}: re-derive says not askable`)) continue;
      if (type === 'pun-build') {
        ok(D.key === JSON.stringify(q.P.cells), `${tag}: square`);
        ok(q.P.cells.flat().every(c => q.cellOpts.includes(c)), `${tag}: a right box is missing from the choices`);
        continue;
      }
      const texts = q.opts.map(o => o.t);
      ok(new Set(texts).size === texts.length, `${tag}: duplicate options ${texts}`);
      ok(D.correct(q.opts[q.key].t), `${tag}: keyed "${q.opts[q.key].t}" but derive says ${D.key}`);
      ok(texts.filter(t => D.correct(t)).length === 1, `${tag}: ${texts.filter(t => D.correct(t)).length} right options in ${texts}`);
      for (const o of q.opts) if (o.slip) ok(D.tagged.some(x => x.t === o.t && x.slip === o.slip), `${tag}: slip ${o.slip} on "${o.t}" does not re-derive`);
      ok(texts.every(t => !/^\d+%$/.test(t) || /^(0|25|50|75|100)%$/.test(t)), `${tag}: a chance outside 0/25/50/75/100: ${texts}`);
      slots[q.key] = (slots[q.key] || 0) + 1;
    }
    ok(made >= N * 0.9, `${type}: only ${made} of ${N}`);
    const n = Object.values(slots).reduce((a, b) => a + b, 0), k = Math.max(0, ...Object.keys(slots).map(Number)) + 1;
    if (n && k > 1) ok(Math.min(...Array.from({ length: k }, (_, i) => slots[i] || 0)) >= (QUICK ? 0.3 : 0.5) * n / k, `${type}: key position not spread: ${JSON.stringify(slots)}`);
    stats.push(`${type} ${made}`);
  }
  console.log('      made: ' + stats.join(' · '));
});

/* ─── 4. calibration: her charts, her keys (§6.4) ─────────────────────────────────── */
section('4 calibration (her charts, her keys)', () => {
  const chs = {}; HER.forEach(s => chs[s.id] = G.parseChart(s));
  let n = 0;
  for (const s of HER) for (const q of s.qs) {
    const items = q.blanks ? q.blanks.map((b, i) => ({ c: b.check, key: b.key, opts: b.opts, label: `${s.id} ${q.bank || q.src} blank ${i + 1}` })) : [{ c: q.check, key: q.key, opts: q.opts, label: `${s.id} ${q.bank || q.src}` }];
    if (q.check && q.check.bb) items.push({ c: { t: 'bbShape' }, key: q.check.bb, opts: [], label: `${s.id} ${q.src} bb` });
    for (const it of items) {
      n++;
      const want = it.c.key || it.key;
      const r = G.herCheck(chs, s, q, it.c, want, it.opts || []);
      const w = r.want || want;
      ok(r.got === w, `${it.label}: her key "${w}", engine "${r.got}"${r.why ? '  [' + r.why + ']' : ''}`);
    }
  }
  console.log(`      ${n} of her keys checked`);
});

/* ─── 5. parse gate (§6.5) ───────────────────────────────────────────────────────── */
section('5 parse gate', () => {
  for (const f of ['engine.js', 'her-charts.js']) { try { new Function(readFileSync(join(ROOT, f), 'utf8')); ok(true); } catch (e) { ok(false, `${f}: ${e.message}`); } }
  const html = join(ROOT, 'index.html');
  if (!existsSync(html)) { console.log('      (no index.html yet)'); return; }
  const src = readFileSync(html, 'utf8');
  const blocks = [...src.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  ok(blocks.length > 0, 'index.html has an inline script');
  blocks.forEach((b, i) => { try { new Function(b); ok(true); } catch (e) { ok(false, `index.html inline script ${i}: ${e.message}`); } });
});

/* ─── 7. speed (§6.7) ────────────────────────────────────────────────────────────── */
section('7 speed', () => {
  const R = G.rng(77), ts = [];
  for (let i = 0; i < (QUICK ? 200 : 1000); i++) {
    const t0 = performance.now(); const ch = G.genChart(R, R.pick(G.MODES)); G.analyse(ch); ts.push(performance.now() - t0);
  }
  ts.sort((a, b) => a - b);
  const med = ts[ts.length >> 1], p99 = ts[Math.floor(ts.length * 0.99)];
  console.log(`      generate + solve (all six modes): median ${med.toFixed(2)} ms, p99 ${p99.toFixed(2)} ms`);
  ok(med < 50, `median ${med} ms`);
});

console.log(`\n${fails ? 'FAILED' : 'ALL PASSED'}: ${checks - fails}/${checks} checks`);
process.exit(fails ? 1 : 0);
