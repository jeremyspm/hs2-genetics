/* HS2 Genetics Trainer · engine.js
   The whole of the genetics: modes, the solver, mode keying, witnesses, notation, Punnett squares,
   the chart generator, layout and every question maker. No DOM. The page loads this file as
   window.GEN; tests/run.mjs loads the SAME file with require(). Spec: HS2-GENETICS-TRAINER-SPEC.md §4. */
(function (root) {
'use strict';
const GEN = {};

/* ── random numbers (seedable, so a test failure can be replayed) ─────────────────── */
function rng(seed) {
  let a = (seed >>> 0) || 1;
  const f = function () {
    a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  f.pick = xs => xs[Math.floor(f() * xs.length)];
  f.chance = p => f() < p;
  f.shuffle = xs => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  f.weighted = pairs => { let s = 0; for (const [, w] of pairs) s += w; let r = f() * s; for (const [v, w] of pairs) { if ((r -= w) < 0) return v; } return pairs[pairs.length - 1][0]; };
  return f;
}
GEN.rng = rng;

/* ── modes ────────────────────────────────────────────────────────────────────────────
   A genotype is one small integer d = how many copies of the DISEASE allele a person has.
   Autosomal: 0-2. X-linked: females 0-2, males 0-1. Y-linked: males 0-1, females 0. MT: 0-1. */
const MODES = ['AD', 'AR', 'XLD', 'XLR', 'YL', 'MT'];
const MODE_NAME = { AD: 'autosomal dominant', AR: 'autosomal recessive', XLD: 'X-linked dominant', XLR: 'X-linked recessive', YL: 'Y-linked', MT: 'mitochondrial' };
const DOMINANT = { AD: 1, XLD: 1 }, RECESSIVE = { AR: 1, XLR: 1 }, XLINKED = { XLD: 1, XLR: 1 };
GEN.MODES = MODES; GEN.MODE_NAME = MODE_NAME;

function genos(mode, sex) {
  switch (mode) {
    case 'AD': case 'AR': return [0, 1, 2];
    case 'XLD': case 'XLR': return sex === 'F' ? [0, 1, 2] : [0, 1];
    case 'YL': return sex === 'M' ? [0, 1] : [0];
    case 'MT': return [0, 1];
  }
  throw new Error('mode ' + mode);
}
function affectedOf(mode, sex, d) {
  switch (mode) {
    case 'AD': case 'XLD': return d >= 1;
    case 'AR': return d === 2;
    case 'XLR': return sex === 'F' ? d === 2 : d === 1;
    case 'YL': case 'MT': return d === 1;
  }
}
const carrierOf = (mode, sex, d) => d >= 1 && !affectedOf(mode, sex, d);
/* P(child genotype = d) given the father's and mother's genotypes; an array indexed by d */
function childDist(mode, fd, md, sex) {
  switch (mode) {
    case 'AD': case 'AR': { const pf = fd / 2, pm = md / 2; return [(1 - pf) * (1 - pm), pf * (1 - pm) + (1 - pf) * pm, pf * pm]; }
    case 'XLD': case 'XLR': { const pm = md / 2; if (sex === 'M') return [1 - pm, pm]; return fd ? [0, 1 - pm, pm] : [1 - pm, pm, 0]; }
    case 'YL': return sex === 'M' ? (fd ? [0, 1] : [1, 0]) : [1];
    case 'MT': return md ? [0, 1] : [1, 0];
  }
}
GEN.genos = genos; GEN.affectedOf = affectedOf; GEN.carrierOf = carrierOf; GEN.childDist = childDist;

/* does genotype d agree with what is DRAWN for this person? (shading, and a carrier mark when shown) */
function fits(mode, p, d) {
  if (affectedOf(mode, p.sex, d) !== !!p.affected) return false;
  if (p.carrierShown && !carrierOf(mode, p.sex, d)) return false;
  return true;
}
GEN.fits = fits;

/* ── chart indexing ───────────────────────────────────────────────────────────────── */
const PREP = new WeakMap();
function prep(ch) {
  let X = PREP.get(ch); if (X) return X;
  const P = ch.people, by = {}, kids = {}, partners = {};
  P.forEach((p, i) => { by[p.id] = p; kids[p.id] = []; partners[p.id] = []; p._i = i; });
  P.forEach(p => {
    if (!!p.father !== !!p.mother) throw new Error('person ' + p.id + ' has one parent drawn');
    if (p.father) { kids[p.father].push(p.id); kids[p.mother].push(p.id); }
  });
  (ch.couples || []).forEach(c => { partners[c.a].push(c.b); partners[c.b].push(c.a); });
  const founder = id => !by[id].father;
  const marriedIn = new Set(P.filter(p => founder(p.id) && partners[p.id].some(q => !founder(q))).map(p => p.id));
  const order = P.slice().sort((a, b) => a.gen - b.gen || a._i - b._i).map(p => p.id);
  P.forEach(p => { if (p.father && !(by[p.father].gen < p.gen && by[p.mother].gen < p.gen)) throw new Error('parents must sit in an earlier generation: ' + p.id); });
  const internal = order.filter(id => kids[id].length);
  const leaves = order.filter(id => !kids[id].length);
  // couples that have children, keyed "father|mother"
  const fams = {};
  P.forEach(p => { if (p.father) { const k = p.father + '|' + p.mother; (fams[k] = fams[k] || { f: p.father, m: p.mother, kids: [] }).kids.push(p.id); } });
  X = { by, kids, partners, founder, marriedIn, order, internal, leaves, fams: Object.values(fams) };
  PREP.set(ch, X); return X;
}
GEN.prep = prep;

/* ── the solver (§4.3) ───────────────────────────────────────────────────────────────
   Enumerates genotypes only for people who have children, top-down with pruning; a leaf is
   checked against its parents. For every consistent assignment it records each person's
   genotype, each family's parent pair, the cost (married-in unaffected people who must carry)
   and the likelihood weight used by the keying rule (§4.4). */
function solve(ch, mode, opt) {
  opt = opt || {};
  const X = prep(ch), { by, kids, founder, marriedIn, internal, leaves } = X;
  const g = {}, sets = {}, pairs = {};
  for (const p of ch.people) sets[p.id] = new Set();
  for (const f of X.fams) pairs[f.f + '|' + f.m] = new Set();
  const leafKidsOf = {};                       // parent id -> leaf children to check once both parents are set
  for (const id of leaves) { const p = by[id]; if (p.father) { (leafKidsOf[p.father] = leafKidsOf[p.father] || []).push(id); (leafKidsOf[p.mother] = leafKidsOf[p.mother] || []).push(id); } }
  const topW = {};                             // T-scheme options per founder (§4.4.2)
  const tOpts = id => {
    const p = by[id];
    let o = genos(mode, p.sex).filter(d => fits(mode, p, d));
    if (DOMINANT[mode] && p.affected) o = o.filter(d => d === 1);     // affected founders in dominant modes are heterozygous
    return o;
  };
  for (const id of internal.concat(leaves)) if (founder(id)) topW[id] = tOpts(id);
  let count = 0, minCost = Infinity, nodes = 0;
  const T = {};                                // married-in config -> {cost, w}
  const limit = opt.limit || 2e6;
  const leafOpts = id => {
    const p = by[id];
    if (founder(id)) return genos(mode, p.sex).filter(d => fits(mode, p, d)).map(d => [d, 1]);
    const dist = childDist(mode, g[p.father], g[p.mother], p.sex), out = [];
    for (const d of genos(mode, p.sex)) if (dist[d] > 0 && fits(mode, p, d)) out.push([d, dist[d]]);
    return out;
  };
  const leafList = []; // per assignment: [id, opts]
  function record() {
    count++;
    let cost = 0, w = 1, tOK = true;
    const key = [];
    for (const id of internal) sets[id].add(g[id]);
    for (const [id, os] of leafList) for (const [d] of os) sets[id].add(d);
    for (const f of X.fams) pairs[f.f + '|' + f.m].add(g[f.f] + '|' + g[f.m]);
    for (const id of internal) {
      const p = by[id];
      if (founder(id)) {
        if (marriedIn.has(id)) { if (!p.affected && g[id] >= 1) cost++; key.push(g[id]); }
        if (!topW[id].includes(g[id])) tOK = false;
        else if (!marriedIn.has(id)) w *= 1 / topW[id].length;
      } else w *= childDist(mode, g[p.father], g[p.mother], p.sex)[g[id]];
    }
    for (const [id, os] of leafList) {
      if (founder(id)) continue;
      let s = 0; for (const [, pr] of os) s += pr; w *= s;
    }
    if (cost < minCost) minCost = cost;
    if (tOK) { const k = key.join(','); if (!T[k]) T[k] = { cost, w: 0 }; T[k].w += w; }
  }
  function dfs(i) {
    if (++nodes > limit) throw new Error('solver budget');
    if (i === internal.length) { record(); return; }
    const id = internal[i], p = by[id];
    let opts;
    if (founder(id)) opts = genos(mode, p.sex).filter(d => fits(mode, p, d));
    else { const dist = childDist(mode, g[p.father], g[p.mother], p.sex); opts = genos(mode, p.sex).filter(d => dist[d] > 0 && fits(mode, p, d)); }
    for (const d of opts) {
      g[id] = d;
      const mark = leafList.length; let ok = true;
      for (const c of (leafKidsOf[id] || [])) {
        const q = by[c]; if (g[q.father] === undefined || g[q.mother] === undefined) continue;
        const os = leafOpts(c); if (!os.length) { ok = false; break; } leafList.push([c, os]);
      }
      if (ok) dfs(i + 1);
      leafList.length = mark;
      delete g[id];
    }
  }
  // leaf founders (no parents, no children) never enter the recursion: add them once
  const loneLeaves = leaves.filter(id => founder(id));
  for (const id of loneLeaves) { const os = leafOpts(id); if (!os.length) return empty(); leafList.push([id, os]); }
  dfs(0);
  function empty() { return { mode, possible: false, sets: {}, pairs: {}, cost: Infinity, T: 0, count: 0 }; }
  if (!count) return empty();
  let bestT = 0;
  for (const k in T) if (T[k].cost === minCost && T[k].w > bestT) bestT = T[k].w;
  const outSets = {}; for (const id in sets) outSets[id] = [...sets[id]].sort();
  const outPairs = {}; for (const k in pairs) outPairs[k] = [...pairs[k]].map(s => s.split('|').map(Number));
  return { mode, possible: true, sets: outSets, pairs: outPairs, cost: minCost, T: bestT, count };
}
GEN.solve = solve;

/* ── keying the mode (§4.4) ───────────────────────────────────────────────────────── */
const OPTION_SETS = {                       // her option wordings -> the set of modes each one names
  'autosomal dominant': ['AD'], 'autosomal recessive': ['AR'], 'sex-linked dominant': ['XLD'], 'sex-linked recessive': ['XLR'],
  'x-linked dominant': ['XLD'], 'x-linked recessive': ['XLR'], 'dominant autosomal': ['AD'], 'recessive autosomal': ['AR'],
  'dominant sex-linked': ['XLD'], 'recessive sex-linked': ['XLR'], 'recessive sex linked': ['XLR'],
  dominant: ['AD', 'XLD'], recessive: ['AR', 'XLR'], 'x-linked': ['XLD', 'XLR'], 'sex-linked': ['XLD', 'XLR'], 'y-linked': ['YL'],
  mitochondrial: ['MT'], autosomal: ['AD', 'AR']
};
const modesOf = opt => OPTION_SETS[String(opt).toLowerCase().replace(/\s+/g, ' ').trim()] || null;
GEN.modesOf = modesOf;

function analyse(ch) {
  let A = ANA.get(ch); if (A) return A;
  const res = {}; for (const m of MODES) res[m] = solve(ch, m);
  const poss = MODES.filter(m => res[m].possible);
  const minCost = poss.length ? Math.min(...poss.map(m => res[m].cost)) : Infinity;
  const low = poss.filter(m => res[m].cost === minCost);
  const bestT = low.length ? Math.max(...low.map(m => res[m].T)) : 0;
  const P = low.filter(m => res[m].T >= bestT / 8 - 1e-15);
  A = { res, poss, P, minCost, bestT };
  ANA.set(ch, A); return A;
}
const ANA = new WeakMap();
GEN.analyse = analyse;

/* which option of an option list is keyed? null when none or more than one option contains all of P */
function keyOption(P, options) {
  const hits = options.filter(o => { const s = modesOf(o); return s && P.every(m => s.includes(m)); });
  return hits.length === 1 ? hits[0] : null;
}
GEN.keyOption = keyOption;

/* ── witnesses (§4.5) ─────────────────────────────────────────────────────────────── */
function witnesses(ch, A) {
  const X = prep(ch), { by } = X, W = [];
  A = A || analyse(ch);
  const aff = id => !!by[id].affected;
  for (const f of X.fams) {
    const fa = by[f.f], mo = by[f.m];
    for (const cid of f.kids) {
      const c = by[cid], son = c.sex === 'M';
      if (!aff(f.f) && !aff(f.m) && aff(cid)) W.push({ k: 'skip', ids: [f.f, f.m, cid], out: ['AD', 'XLD'], strict: true });
      if (aff(f.f) && aff(f.m) && !aff(cid)) W.push({ k: 'aa-u', ids: [f.f, f.m, cid], out: ['AR', 'XLR'], strict: true });
      if (aff(f.m) && son && !aff(cid)) W.push({ k: 'xlr-mum-son', ids: [f.m, cid], out: ['XLR'], strict: true });
      if (!aff(f.f) && !son && aff(cid)) W.push({ k: 'xlr-dad-daughter', ids: [f.f, cid], out: ['XLR'], strict: true });
      if (aff(f.f) && !son && !aff(cid)) W.push({ k: 'xld-dad-daughter', ids: [f.f, cid], out: ['XLD'], strict: true });
      if (!aff(f.m) && son && aff(cid)) W.push({ k: 'xld-mum-son', ids: [f.m, cid], out: ['XLD'], strict: true });
      if (aff(f.f) && son && aff(cid) && !aff(f.m)) W.push({ k: 'father-son', ids: [f.f, cid], out: ['XLD', 'XLR'], strict: false });
      if (aff(cid) !== aff(f.m)) W.push({ k: 'mt', ids: [f.m, cid], out: ['MT'], strict: true });
    }
  }
  for (const p of ch.people) if (p.affected && p.sex === 'F') { W.push({ k: 'female', ids: [p.id], out: ['YL'], strict: true }); break; }
  if (ch.carriersShown) for (const p of ch.people) if (p.carrierShown) {
    W.push({ k: 'carrier', ids: [p.id], out: p.sex === 'M' ? ['AD', 'XLD', 'YL', 'MT', 'XLR'] : ['AD', 'XLD', 'YL', 'MT'], strict: true }); break;
  }
  // cost-based: a married-in person who would have to be a carrier
  for (const m of ['AR', 'XLR']) {
    const r = A.res[m]; if (!r.possible || r.cost <= A.minCost) continue;
    for (const id of X.marriedIn) { const p = by[id]; const s = r.sets[id]; if (!p.affected && s && s.length && s.every(d => d >= 1)) W.push({ k: 'must-carry', ids: [id], out: [m], strict: false, mode: m }); }
  }
  // the Y-linked pattern: every son of an affected man is affected, no daughter is (makes the autosomal modes unlikely)
  const affMen = ch.people.filter(p => p.affected && p.sex === 'M' && X.kids[p.id].length);
  if (affMen.length && !ch.people.some(p => p.affected && p.sex === 'F')) {
    const ok = affMen.every(m => X.kids[m.id].every(c => (by[c].sex === 'M') === !!by[c].affected)) &&
      ch.people.every(p => !p.affected || !p.father || by[p.father].affected);
    if (ok) W.push({ k: 'y-pattern', ids: affMen.map(p => p.id), out: ['AD', 'AR'], strict: false });
  }
  // her X-linked dominant rule seen in full: every daughter of an affected father is affected, and none of his sons
  // (makes the autosomal modes unlikely; nothing strict ever rules out autosomal dominant for an X-linked dominant chart)
  const affDads = ch.people.filter(p => p.affected && p.sex === 'M' && X.kids[p.id].length);
  if (affDads.length) {
    const ks = affDads.flatMap(d => X.kids[d.id]);
    const ok = ks.length >= 3 && ks.some(c => by[c].sex === 'F') && ks.some(c => by[c].sex === 'M') &&
      affDads.every(d => X.kids[d.id].every(c => (by[c].sex === 'F') === !!by[c].affected));
    if (ok) W.push({ k: 'xld-pattern', ids: affDads.map(p => p.id).concat(ks), out: ['AD', 'AR'], strict: false });
  }
  return W;
}
GEN.witnesses = witnesses;
/* §4.4.6: can a mode question keyed on keySet be asked of this chart with these options? */
function evidenceOK(ch, keySet, options, A) {
  A = A || analyse(ch);
  if (ch.people.filter(p => p.affected).length < 3) return false;
  const W = witnesses(ch, A);
  const others = new Set(); options.forEach(o => (modesOf(o) || []).forEach(m => { if (!keySet.includes(m)) others.add(m); }));
  for (const m of others) if (!W.some(w => w.out.includes(m))) return false;
  return true;
}
GEN.evidenceOK = evidenceOK;

/* ── notation (§4.2) ──────────────────────────────────────────────────────────────── */
const SUPU = { A: 'ᴬ', B: 'ᴮ', D: 'ᴰ', E: 'ᴱ', G: 'ᴳ', H: 'ᴴ', K: 'ᴷ', M: 'ᴹ', N: 'ᴺ', R: 'ᴿ', T: 'ᵀ' };
const SUPL = { a: 'ᵃ', b: 'ᵇ', d: 'ᵈ', e: 'ᵉ', g: 'ᵍ', h: 'ʰ', k: 'ᵏ', m: 'ᵐ', n: 'ⁿ', r: 'ʳ', t: 'ᵗ' };
const LETTERS = Object.keys(SUPU);
GEN.LETTERS = LETTERS;
/* how many DOMINANT alleles a genotype has (the letter we print as a capital) */
function domCount(mode, sex, d) {
  const n = (mode === 'XLD' || mode === 'XLR') && sex === 'M' ? 1 : 2;
  return DOMINANT[mode] ? d : n - d;
}
function xs(L, dom, style) {      // one X with a dominant (true) or recessive allele
  if (style === 'flat') return 'X' + (dom ? L : L.toLowerCase());
  return 'X' + (dom ? SUPU[L] : SUPL[L.toLowerCase()]);
}
/* fmtG(mode, sex, d, {L, x:'sup'|'flat'|'star'}) -> "Bb", "XᴮXᵇ", "XBXb", "X*X", "XᴮY" … capital first, always */
function fmtG(mode, sex, d, st) {
  const L = (st && st.L) || 'A', x = (st && st.x) || 'sup';
  if (mode === 'AD' || mode === 'AR') { const k = domCount(mode, sex, d); return L.repeat(k) + L.toLowerCase().repeat(2 - k); }
  if (mode === 'XLD' || mode === 'XLR') {
    if (x === 'star') return sex === 'M' ? (d ? 'X*Y' : 'XY') : (d === 2 ? 'X*X*' : d === 1 ? 'X*X' : 'XX');
    const k = domCount(mode, sex, d);
    if (sex === 'M') return xs(L, k === 1, x) + 'Y';
    return xs(L, k >= 1, x) + xs(L, k === 2, x);
  }
  if (mode === 'YL') return sex === 'M' ? (d ? 'XY*' : 'XY') : 'XX';
  if (mode === 'MT') return d ? 'affected mtDNA' : 'normal mtDNA';
}
GEN.fmtG = fmtG;
/* "not decided" forms her bank uses for someone who is AA or Aa */
function fmtUnknown(mode, sex, st, form) {
  const L = (st && st.L) || 'A';
  if (mode === 'AD' || mode === 'AR') {
    if (form === 'q') return L + '?';
    if (form === '_') return L + '_';
    if (form === 'slash') return L + L + '/' + L + L.toLowerCase();
    return L + L + ' or ' + L + L.toLowerCase();
  }
  if ((mode === 'XLD' || mode === 'XLR') && sex === 'F') {
    const x = (st && st.x) === 'flat' ? 'flat' : 'sup';
    return xs(L, true, x) + xs(L, true, x) + ' or ' + xs(L, true, x) + xs(L, false, x);
  }
  return NEI;
}
const NEI = 'Not enough information given';
GEN.NEI = NEI; GEN.fmtUnknown = fmtUnknown;
/* the two-member "dominant allele, second unknown" set? (e.g. {AA, Aa} or {XᴬXᴬ, XᴬXᵃ}) */
function isDomUnknown(mode, sex, set) {
  if (set.length !== 2) return false;
  const k = set.map(d => domCount(mode, sex, d)).sort().join();
  return (mode === 'AD' || mode === 'AR' || ((mode === 'XLD' || mode === 'XLR') && sex === 'F')) && k === '1,2';
}
GEN.isDomUnknown = isDomUnknown;

/* ── Punnett squares (§4.8) ───────────────────────────────────────────────────────── */
/* families: 'auto' complete dominance (letters), 'xl' X-linked recessive, 'xld' X-linked dominant,
   'abo' (A, B codominant, both over O), 'inc' incomplete dominance, 'cod' codominance (two capitals) */
function gametes(fam, g) {
  if (fam === 'xl' || fam === 'xld') { const m = g.match(/X[^XY]*|Y/g); return m; }
  if (fam === 'abo') return g.match(/Iᴬ|Iᴮ|i|A|B|O/g);
  if (fam === 'inc' || fam === 'cod') return g.match(/[A-Z][ʳʷᴿᵂ']?/g);
  return g.split('');
}
function joinG(fam, a, b) {
  if (fam === 'xl' || fam === 'xld') {
    if (a === 'Y') return b + 'Y'; if (b === 'Y') return a + 'Y';
    const rank = x => /X[A-Zᴬ-ᵂ]/.test(x) && !/X[a-zᵃ-ᶻʰʳ]/.test(x) ? 0 : 1;
    return rank(a) <= rank(b) ? a + b : b + a;
  }
  if (fam === 'abo') {
    const ord = x => ({ A: 0, 'Iᴬ': 0, B: 1, 'Iᴮ': 1, O: 2, i: 2 })[x];
    return ord(a) <= ord(b) ? a + b : b + a;
  }
  if (fam === 'inc' || fam === 'cod') return [a, b].sort().join('');
  const up = x => x === x.toUpperCase();
  return up(a) || !up(b) ? a + b : b + a;
}
function punnett(fam, g1, g2, info) {
  info = info || {};
  const top = gametes(fam, g1), side = gametes(fam, g2);   // g1 across the top, g2 down the side
  const cells = side.map(s => top.map(t => joinG(fam, t, s)));
  const flat = cells.flat();
  const count = xs => { const o = {}; xs.forEach(x => o[x] = (o[x] || 0) + 1); return o; };
  const geno = count(flat);
  const phen = count(flat.map(c => phenoOf(fam, c, info)));
  const out = { top, side, cells, geno, phen, n: 4 };
  if (fam === 'xl' || fam === 'xld') {
    const aff = c => phenoOf(fam, c, info) === 'affected';
    const sons = flat.filter(c => /Y$/.test(c)), dau = flat.filter(c => !/Y$/.test(c));
    out.pChildAff = flat.filter(aff).length / 4;
    out.pSonAff = sons.length ? sons.filter(aff).length / sons.length : null;
    out.pDauAff = dau.length ? dau.filter(aff).length / dau.length : null;
    out.pAffSon = sons.filter(aff).length / 4;
    out.pCarrierDau = fam === 'xl' ? dau.filter(c => !aff(c) && hasRec(c)).length / 4 : 0;   // a dominant trait has no healthy carriers
  }
  return out;
}
function hasRec(c) { return /X[a-zᵃ-ᶻʰʳ]|X\*/.test(c); }
function phenoOf(fam, c, info) {
  if (fam === 'xl') { if (/Y$/.test(c)) return hasRec(c) ? 'affected' : 'unaffected'; return (c.match(/X[a-zᵃ-ᶻʰʳ]/g) || []).length === 2 ? 'affected' : 'unaffected'; }
  if (fam === 'xld') { return /X[A-Zᴬ-ᵂ]/.test(c.replace(/X[a-zᵃ-ᶻʰʳ]/g, '')) ? 'affected' : 'unaffected'; }
  if (fam === 'abo') {
    const s = c.replace(/Iᴬ/g, 'A').replace(/Iᴮ/g, 'B').replace(/i/g, 'O');
    const a = s.includes('A'), b = s.includes('B');
    return a && b ? 'AB' : a ? 'A' : b ? 'B' : 'O';
  }
  if (fam === 'inc' || fam === 'cod') { const k = c.match(/[A-Z][ʳʷᴿᵂ']?/g); return k[0] === k[1] ? (info.names && info.names[k[0]]) || k[0] : (info.het || 'blend'); }
  const up = c.split('').filter(x => x === x.toUpperCase()).length;
  return up ? (info.dom || 'dominant') : (info.rec || 'recessive');
}
GEN.punnett = punnett; GEN.gametes = gametes; GEN.joinG = joinG; GEN.phenoOf = phenoOf;
/* her formats: "25% RR, 50% Rr, 25% rr" (dominant first) and fractions */
const PCT = n => Math.round(n * 100) + '%';
const FRAC = { 0: 'no-one (0)', 0.25: 'a quarter (1/4)', 0.5: 'half (1/2)', 0.75: 'three quarters (3/4)', 1: 'all (1)' };
GEN.PCT = PCT; GEN.FRAC = FRAC;
function ratioText(counts, order) {
  const ks = order || Object.keys(counts);
  return ks.filter(k => counts[k]).map(k => PCT(counts[k] / 4) + ' ' + k).join(', ');
}
GEN.ratioText = ratioText;

/* ── the chart generator (§4.6) ─────────────────────────────────────────────────────
   Simulates forward from a mode. The genotypes it draws are kept on _d for debugging only: every key is
   re-derived from the DRAWN chart by the solver, never read from _d. */
const NAMES_F = ['Kate', 'Anne', 'Natalie', 'Devon', 'Kimberly', 'Donna', 'Aroha', 'Mere', 'Ana', 'Mele', 'Priya', 'Olivia', 'Grace', 'Hana', 'Ruby', 'Leilani', 'Isla', 'Tui', 'Sofia', 'Emma', 'Maia', 'Nikau', 'Lucy', 'Amelia', 'Ngaio', 'Ella', 'Zoe', 'Mia'];
const NAMES_M = ['Joe', 'Curtis', 'Max', 'Ken', 'Ryan', 'Simon', 'Tama', 'Wiremu', 'Hemi', 'Sione', 'Raj', 'Liam', 'Noah', 'Ari', 'Leo', 'Tane', 'Jack', 'Eli', 'Manaia', 'Rawiri', 'Oliver', 'Finn', 'Kai', 'Isaac', 'Tom', 'Sam', 'Ben', 'Hugo'];
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
GEN.ROMAN = ROMAN;
function sampleD(R, dist) { let r = R(); for (let d = 0; d < dist.length; d++) { if ((r -= dist[d]) < 0) return d; } return dist.length - 1; }
function founderD(R, mode, sex, want) {  // want: 'aff' | 'carrier' | 'normal'
  if (want === 'aff') {
    if (mode === 'AD') return R.chance(0.08) ? 2 : 1;
    if (mode === 'XLD') return sex === 'M' ? 1 : (R.chance(0.08) ? 2 : 1);
    if (mode === 'AR') return 2;
    if (mode === 'XLR') return sex === 'M' ? 1 : 2;
    return 1;                                  // YL (male), MT
  }
  if (want === 'carrier') return (mode === 'AR' || (mode === 'XLR' && sex === 'F')) ? 1 : 0;
  return 0;
}
function genChart(R, mode, o) {
  o = o || {};
  const numbering = o.numbering || R.weighted([['roman', 6], ['running', 2], ['names', 2]]);
  for (let tries = 0; tries < 80; tries++) {
    const ch = buildChart(R, mode, o);
    const L = layout(ch);
    if (L.width > (o.maxSlots || (numbering === 'names' ? 6 : 8))) continue;   // names need wider slots to stay readable
    if (o.accept && !o.accept(ch)) continue;
    labelChart(ch, R, Object.assign({}, o, { numbering }));
    return ch;
  }
  return null;
}
GEN.genChart = genChart;
function buildChart(R, mode, o) {
  const nGen = o.gens || R.weighted([[3, 5], [4, 4], [5, 1]]);
  const people = [], couples = [];
  let n = 0;
  const mk = (sex, gen, d, extra) => { const p = Object.assign({ id: 'p' + (++n), sex, gen, _d: d }, extra || {}); p.affected = affectedOf(mode, sex, d); people.push(p); return p; };
  // the top couple
  const affSex = mode === 'YL' ? 'M' : mode === 'MT' ? (R.chance(0.85) ? 'F' : 'M') : R.pick(['M', 'F']);
  let fd, md;
  const noAff = (mode === 'AR' && R.chance(0.35)) || (mode === 'XLR' && R.chance(0.45));
  if (noAff) { fd = founderD(R, mode, 'M', mode === 'AR' ? 'carrier' : 'normal'); md = founderD(R, mode, 'F', 'carrier'); }
  else if (affSex === 'M') { fd = founderD(R, mode, 'M', 'aff'); md = founderD(R, mode, 'F', R.chance(RECESSIVE[mode] ? 0.5 : 0) ? 'carrier' : 'normal'); }
  else { md = founderD(R, mode, 'F', 'aff'); fd = founderD(R, mode, 'M', R.chance(mode === 'AR' ? 0.5 : 0) ? 'carrier' : 'normal'); }
  const leftMale = R.chance(0.5);
  const F0 = mk('M', 1, fd), M0 = mk('F', 1, md);
  couples.push(leftMale ? { a: F0.id, b: M0.id } : { a: M0.id, b: F0.id });
  let frontier = [{ f: F0, m: M0 }];
  const maxKids = nGen === 3 ? 5 : nGen === 4 ? 4 : 3;
  for (let gen = 2; gen <= nGen; gen++) {
    const born = [];
    for (const fam of frontier) {
      const k = R.int(gen === nGen ? 1 : 2, maxKids);
      const sibs = [];
      for (let i = 0; i < k; i++) {
        const sex = R.pick(['M', 'F']);
        const d = sampleD(R, childDist(mode, fam.f._d, fam.m._d, sex));
        const c = mk(sex, gen, d, { father: fam.f.id, mother: fam.m.id });
        sibs.push(c); born.push(c);
      }
      if (sibs.length >= 2 && R.chance(o.twins != null ? o.twins : 0.03)) { const i = R.int(0, sibs.length - 2); sibs[i].twin = sibs[i + 1].twin = gen; }
    }
    if (gen === nGen) break;
    // who marries: at least one per generation, so the chart reaches its last generation
    const next = [];
    const cand = R.shuffle(born);
    // a cousin marriage now and then (double line): the last child of one sibship and the first child of the next
    if (gen >= 3 && nGen - gen >= 1 && R.chance(o.cousins != null ? o.cousins : 0.35)) {
      // families in drawing order (by the birth order of the parent who was born into the chart)
      const fams = frontier.filter(f => born.some(c => c.father === f.f.id)).map(f => Object.assign({ par: [f.f, f.m].find(p => p.father) }, f))
        .filter(f => f.par).sort((x, y) => people.indexOf(x.par) - people.indexOf(y.par));
      for (let i = 0; i + 1 < fams.length; i++) {
        const A = fams[i], B = fams[i + 1];
        if (A.par.father !== B.par.father) continue;  // A's and B's parents are siblings, so their children are first cousins
        const ka = born.filter(c => c.father === A.f.id), kb = born.filter(c => c.father === B.f.id);
        const a = ka[ka.length - 1], b = kb[0];
        if (a.sex === b.sex) continue;
        couples.push({ a: a.id, b: b.id, consanguineous: true, cousin: true });
        a._wed = b._wed = true;
        next.push(a.sex === 'M' ? { f: a, m: b } : { f: b, m: a });
        break;
      }
    }
    const want = Math.max(1, Math.round(born.length * (nGen - gen >= 2 ? 0.45 : 0.55)));
    for (const c of cand) {
      if (next.length >= want) break;
      if (c._wed) continue;
      const sex = c.sex === 'M' ? 'F' : 'M';
      let d = 0;
      const r = R();
      const canAff = !(mode === 'YL' && sex === 'F');
      if (canAff && r < (o.affSpouse != null ? o.affSpouse : 0.15)) d = founderD(R, mode, sex, 'aff');
      else if (r < 0.15 + (o.carrierSpouse != null ? o.carrierSpouse : 0.2)) d = founderD(R, mode, sex, 'carrier');
      const s = mk(sex, gen, d);
      const sibs = born.filter(x => x.father === c.father);
      const idx = sibs.indexOf(c);
      s._side = idx < (sibs.length - 1) / 2 ? 'L' : idx > (sibs.length - 1) / 2 ? 'R' : R.pick(['L', 'R']);
      couples.push(s._side === 'L' ? { a: s.id, b: c.id } : { a: c.id, b: s.id });
      c._wed = true;
      next.push(c.sex === 'M' ? { f: c, m: s } : { f: s, m: c });
    }
    frontier = next;
  }
  // deceased: the top couple now and then
  if (R.chance(o.deceased != null ? o.deceased : 0.12)) { F0.deceased = true; if (R.chance(0.6)) M0.deceased = true; }
  people.forEach(p => { delete p._wed; });
  const ch = { people, couples, numbering: 'roman', fill: 'black', mode_: mode };
  return ch;
}

/* ── layout (§4.7) ───────────────────────────────────────────────────────────────────
   Her charts carry x from her figure. A generated chart is laid out as nested units (a person, their
   partner, their children's units); every unit owns its own slice of the width, so lines never cross. */
function layout(ch) {
  const vis = ch.people.filter(p => !p.hidden);
  if (vis.every(p => typeof p.x === 'number' && !p._auto)) {
    const mn = Math.min(...vis.map(p => p.x));
    const pos = {}; vis.forEach(p => pos[p.id] = p.x - mn + 0.5);
    // an only child sits straight under the couple when her figure has it nearly there (no one-pixel jog)
    const X0 = prep(ch);
    for (const f of X0.fams) { const ks = f.kids.filter(k => !X0.by[k].hidden); if (ks.length !== 1 || X0.by[f.f].hidden || X0.by[f.m].hidden) continue; const mid = (pos[f.f] + pos[f.m]) / 2; if (Math.abs(pos[ks[0]] - mid) < 0.35 && !X0.kids[ks[0]].length) pos[ks[0]] = mid; }
    return { pos, width: Math.max(...vis.map(p => pos[p.id])) + 0.5, gens: Math.max(...vis.map(p => p.gen)) };
  }
  const X = prep(ch), { by, kids } = X;
  const cp = {}; ch.couples.forEach(c => { cp[c.a] = c; cp[c.b] = c; });
  const absorbed = new Set(ch.couples.filter(c => c.cousin).map(c => c.b));
  const kidsOf = (a, b) => ch.people.filter(p => (p.father === a && p.mother === b) || (p.father === b && p.mother === a)).filter(p => !absorbed.has(p.id) || false);
  function unit(p) {
    const c = cp[p.id];
    let sp = null, left = false;
    if (c) { const q = c.a === p.id ? c.b : c.a; sp = by[q]; left = c.b === p.id; }
    const ks = sp ? kidsOf(p.id, sp.id).map(unit) : [];
    const u = { p, sp, left, kids: ks };
    const kw = ks.reduce((s, k) => s + k.w, 0);
    u.w = Math.max(sp ? 2 : 1, kw); u.kw = kw;
    return u;
  }
  const top = ch.couples.find(c => !by[c.a].father && !by[c.b].father && !X.marriedIn.has(c.a));
  const root = unit(by[top.a]);
  const pos = {};
  (function place(u, x0) {
    let cc;
    if (u.kids.length) {
      let x = x0 + (u.w - u.kw) / 2;
      for (const k of u.kids) { place(k, x); x += k.w; }
      const an = u.kids.map(k => k.anchor);
      cc = (Math.min(...an) + Math.max(...an)) / 2;
      if (u.sp) cc = Math.min(Math.max(cc, x0 + 1), x0 + u.w - 1);
    } else cc = x0 + u.w / 2;
    if (u.sp) {
      const me = u.left ? cc + 0.5 : cc - 0.5, him = u.left ? cc - 0.5 : cc + 0.5;
      pos[u.p.id] = me; pos[u.sp.id] = him; u.anchor = me;
    } else { pos[u.p.id] = cc; u.anchor = cc; }
  })(root, 0);
  return { pos, width: root.w, gens: Math.max(...ch.people.map(p => p.gen)) };
}
GEN.layout = layout;

function labelChart(ch, R, o) {
  const L = layout(ch);
  ch.people.forEach(p => { p.x = L.pos[p.id]; p._auto = true; });
  const numbering = o.numbering;
  ch.numbering = numbering;
  ch.fill = o.fill || R.weighted([['black', 5], ['red', 2], ['blue', 2], ['grey', 1]]);
  const rows = {};
  ch.people.forEach(p => (rows[p.gen] = rows[p.gen] || []).push(p));
  let run = 0;
  const usedF = R.shuffle(NAMES_F), usedM = R.shuffle(NAMES_M);
  Object.keys(rows).sort((a, b) => a - b).forEach(g => {
    rows[g].sort((a, b) => a.x - b.x).forEach((p, i) => {
      p.label = numbering === 'roman' ? String(i + 1) : numbering === 'running' ? String(++run) : numbering === 'names' ? (p.sex === 'F' ? usedF : usedM).pop() : '';
    });
  });
}
/* how a person is named in a question: II-4, individual 5, or Kate */
function who(ch, p) {
  if (ch.numbering === 'roman') return ROMAN[p.gen] + '-' + p.label;
  return p.label || '';
}
GEN.who = who;
const whoLong = (ch, p) => ch.numbering === 'names' ? p.label : ch.numbering === 'roman' ? 'individual ' + who(ch, p) : 'individual ' + p.label;
GEN.whoLong = whoLong;

/* ── relations (her worksheet: siblings, a couple that reproduces, in-laws, cousins) ───────── */
function relation(ch, a, b) {
  const X = prep(ch), { by, partners } = X, A = by[a], B = by[b];
  if (partners[a].includes(b)) return (X.kids[a].some(k => X.kids[b].includes(k))) ? 'couple' : 'couple-nokids';
  if (A.father && A.father === B.father && A.mother === B.mother) return 'siblings';
  if (A.father === b || A.mother === b || B.father === a || B.mother === a) return 'parent';
  const gp = x => x.father ? [by[x.father], by[x.mother]] : [];
  if (gp(A).some(q => q.father === b || q.mother === b) || gp(B).some(q => q.father === a || q.mother === a)) return 'grandparent';
  // in-law: B is the partner of A's sibling (or the other way round)
  const sibsOf = x => x.father ? ch.people.filter(q => q.id !== x.id && q.father === x.father && q.mother === x.mother).map(q => q.id) : [];
  if (sibsOf(A).some(s => partners[s].includes(b)) || sibsOf(B).some(s => partners[s].includes(a))) return 'in-law';
  const pa = A.father ? [A.father, A.mother] : [], pb = B.father ? [B.father, B.mother] : [];
  if (pa.length && pb.length && pa.some(x => pb.some(y => relation(ch, x, y) === 'siblings'))) return 'cousins';
  if (A.father && B.father && (A.father === B.father || A.mother === B.mother)) return 'half-siblings';
  return 'other';
}
GEN.relation = relation;

/* ── the chart as words, for Copy for Claude (§5.10) ───────────────────────────────── */
function describe(ch, mode) {
  const vis = ch.people.filter(p => !p.hidden), X = prep(ch), { by } = X;
  const lines = [];
  if (ch.title) lines.push('Title: ' + ch.title);
  const rows = {}; vis.forEach(p => (rows[p.gen] = rows[p.gen] || []).push(p));
  const nm = p => who(ch, p) || ('the ' + (p.sex === 'M' ? 'male' : 'female') + ' at position ' + (rows[p.gen].indexOf(p) + 1) + ' in generation ' + ROMAN[p.gen]);
  Object.keys(rows).sort((a, b) => a - b).forEach(g => {
    const r = rows[g].slice().sort((a, b) => a.x - b.x);
    lines.push('Generation ' + ROMAN[g] + ': ' + r.map(p => {
      let s = nm(p) + ' ' + (p.sex === 'M' ? 'male' : 'female') + ' ' + (p.affected ? 'affected' : p.carrierShown ? 'carrier (marked)' : 'unaffected');
      if (p.deceased) s += ', deceased';
      if (p.father) { const f = by[p.father], m = by[p.mother]; const par = [f, m].filter(x => !x.hidden).map(nm); s += ', child of ' + par.join(' and '); }
      else if (X.marriedIn.has(p.id)) s += ', married in';
      if (p.twin) s += ', a twin';
      return s;
    }).join('; ') + '.');
  });
  const cons = ch.couples.filter(c => c.consanguineous);
  cons.forEach(c => lines.push('Double line (related couple): ' + nm(by[c.a]) + ' and ' + nm(by[c.b]) + '.'));
  if (ch.shadingMeans === 'dominant-phenotype') lines.push('Shading means the dominant phenotype.');
  if (ch.shadingMeans === 'homozygous-recessive') lines.push('Shading means a homozygous recessive genotype.');
  if (mode) lines.push('Mode given: ' + MODE_NAME[mode] + '.');
  return lines.join('\n');
}
GEN.describe = describe;

/* ── the chart as SVG (a string, so node can render it too) ────────────────────────────
   opts: glow:[ids] (the witness ring, never a colour change), sel:[ids], focus:id, marks:{id:text} (a genotype
   under the symbol), cls (extra class), idp (id prefix for focusable people) */
const FILL = { black: '#1b1b1b', red: '#d62d20', blue: '#1d4ed8', grey: '#8a8a8a', salmon: '#ef7d74' };
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
GEN.esc = esc;
function svg(ch, opts) {
  opts = opts || {};
  const vis = ch.people.filter(p => !p.hidden), X = prep(ch), { by } = X;
  const nameRows = ch.numbering === 'names' ? Math.max(1, ...vis.map(p => wrap2(p.label || '').length)) : 1;
  // 8 slots fit 375 px with symbols >= 28 px; a row grows to fit names that wrap onto 2-3 lines
  const L = layout(ch), SW = ch.numbering === 'names' ? 74 : 58, MK = opts.marks ? 26 : 0, RH = (ch.blanksUnder ? 112 : 100) + 16 * (nameRows - 1) + MK, SZ = 42, R2 = SZ / 2;   // MK: room for a genotype tag under each label
  const showGen = ch.numbering === 'roman' || ch.genLabels;
  const left = showGen ? 36 : 8, top = (ch.title ? 44 : 14) + (ch.sibs ? 26 : 0);
  const px = id => left + L.pos[id] * SW, py = g => top + (g - 1) * RH + R2;
  const W = left + L.width * SW + 10;
  const H = top + (L.gens - 1) * RH + SZ + 18 * nameRows + MK + 6 + (ch.blanksUnder ? 22 : 0) + (ch.legend || ch.legendText ? 34 : 0) + (ch.caption ? 26 : 0) + 8;
  const fill = FILL[ch.fill] || ch.fill || FILL.black;
  const unaff = ch.unaffFill === 'grey' ? '#b9b9b9' : '#fff';
  const o = [];
  const line = (x1, y1, x2, y2, w) => o.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#222" stroke-width="${w || 2}"/>`);
  if (ch.title) o.push(`<text x="${W / 2}" y="30" text-anchor="middle" font-size="20" font-weight="700" fill="#111">${esc(ch.title)}</text>`);
  if (showGen) for (let g = 1; g <= L.gens; g++) o.push(`<text x="4" y="${py(g) + 7}" font-size="19" font-weight="700" fill="#111" font-family="Georgia,serif">${ROMAN[g]}</text>`);
  if (ch.genWord) o.push(`<text x="6" y="${top - 2}" font-size="13" fill="#333">Generation</text>`);
  // couples
  for (const c of ch.couples) {
    const A = by[c.a], B = by[c.b]; if (A.hidden || B.hidden) continue;
    const [l, r] = L.pos[c.a] < L.pos[c.b] ? [c.a, c.b] : [c.b, c.a];
    const y = py(A.gen), x1 = px(l) + R2, x2 = px(r) - R2;
    if (c.consanguineous) { line(x1, y - 3, x2, y - 3); line(x1, y + 3, x2, y + 3); } else line(x1, y, x2, y);
  }
  // sibships
  for (const f of X.fams) {
    const F = by[f.f], M = by[f.m];
    const ks = f.kids.filter(k => !by[k].hidden); if (!ks.length) continue;
    const gy = py(by[ks[0]].gen) - R2 - 20;                       // the sibship line
    let dx;
    if (F.hidden || M.hidden) { const par = F.hidden ? M : F; dx = px(par.id); line(dx, py(par.gen) + R2, dx, gy); }
    else { dx = (px(f.f) + px(f.m)) / 2; line(dx, py(F.gen), dx, gy); }
    const tw = {}; ks.forEach(k => { const t = by[k].twin; if (t) (tw[t] = tw[t] || []).push(k); });
    const drops = ks.map(k => { const t = by[k].twin; return t && tw[t].length > 1 ? tw[t].reduce((s, q) => s + px(q), 0) / tw[t].length : px(k); });
    const xs = drops.concat([dx]);
    line(Math.min(...xs), gy, Math.max(...xs), gy);
    ks.forEach((k, i) => { const t = by[k].twin; if (t && tw[t].length > 1) line(drops[i], gy, px(k), py(by[k].gen) - R2); else line(px(k), gy, px(k), py(by[k].gen) - R2); });
  }
  if (ch.sibs) for (const [a, b] of ch.sibs) {
    const y0 = py(by[a].gen) - R2, yb = y0 - 22;
    line(px(a), y0, px(a), yb); line(px(b), y0, px(b), yb); line(px(a), yb, px(b), yb);
  }
  // people
  const glow = new Set(opts.glow || []), sel = new Set(opts.sel || []), bad = new Set(opts.bad || []), good = new Set(opts.good || []);
  for (const p of vis) {
    const x = px(p.id), y = py(p.gen);
    const cls = ['ps', glow.has(p.id) ? 'glow' : '', sel.has(p.id) ? 'sel' : '', opts.focus === p.id ? 'foc' : '', bad.has(p.id) ? 'bad' : '', good.has(p.id) ? 'good' : ''].filter(Boolean).join(' ');
    const lab = who(ch, p) || (p.sex === 'M' ? 'male' : 'female') + ' in generation ' + ROMAN[p.gen];
    const st = `${p.sex === 'M' ? 'male' : 'female'}, ${p.affected ? 'affected' : p.carrierShown ? 'carrier' : 'unaffected'}${p.deceased ? ', deceased' : ''}`;
    o.push(`<g class="${cls}" data-p="${p.id}"${opts.tap ? ` tabindex="-1" role="button"` : ''} aria-label="${esc(lab + ': ' + st)}">`);
    if (glow.has(p.id)) o.push(p.sex === 'M' ? `<rect class="ring" x="${x - R2 - 7}" y="${y - R2 - 7}" width="${SZ + 14}" height="${SZ + 14}" rx="6" fill="none" stroke="#f59e0b" stroke-width="5" opacity=".95"/>` : `<circle class="ring" cx="${x}" cy="${y}" r="${R2 + 7}" fill="none" stroke="#f59e0b" stroke-width="5" opacity=".95"/>`);
    if (sel.has(p.id) || good.has(p.id) || bad.has(p.id)) { const col = bad.has(p.id) ? '#dc2626' : good.has(p.id) ? '#16a34a' : '#2563eb'; o.push(p.sex === 'M' ? `<rect x="${x - R2 - 5}" y="${y - R2 - 5}" width="${SZ + 10}" height="${SZ + 10}" rx="4" fill="none" stroke="${col}" stroke-width="3.5"/>` : `<circle cx="${x}" cy="${y}" r="${R2 + 5}" fill="none" stroke="${col}" stroke-width="3.5"/>`); }
    const outline = ch.sexOutline ? (p.sex === 'M' ? '#1e5aa8' : '#c05a8d') : '#1b1b1b';
    const f = p.affected ? fill : unaff;
    if (p.sex === 'M') o.push(`<rect x="${x - R2}" y="${y - R2}" width="${SZ}" height="${SZ}" fill="${f}" stroke="${outline}" stroke-width="2.2"/>`);
    else o.push(`<circle cx="${x}" cy="${y}" r="${R2}" fill="${f}" stroke="${outline}" stroke-width="2.2"/>`);
    if (p.carrierShown) {
      if (ch.carrierStyle === 'half') o.push(p.sex === 'M' ? `<rect x="${x}" y="${y - R2}" width="${R2}" height="${SZ}" fill="${fill}"/>` : `<path d="M${x} ${y - R2} A${R2} ${R2} 0 0 1 ${x} ${y + R2} Z" fill="${fill}"/>`);
      else o.push(`<circle cx="${x}" cy="${y}" r="5" fill="${fill}"/>`);
      o.push(p.sex === 'M' ? `<rect x="${x - R2}" y="${y - R2}" width="${SZ}" height="${SZ}" fill="none" stroke="#1b1b1b" stroke-width="2.2"/>` : `<circle cx="${x}" cy="${y}" r="${R2}" fill="none" stroke="#1b1b1b" stroke-width="2.2"/>`);
      if (ch.carrierStyle === 'half') line(x, y - R2, x, y + R2, 2.2);
    }
    if (p.deceased) line(x - R2 - 8, y + R2 + 8, x + R2 + 8, y - R2 - 8, 2.4);
    if (opts.focus === p.id) o.push(`<rect x="${x - R2 - 10}" y="${y - R2 - 10}" width="${SZ + 20}" height="${SZ + 20}" rx="8" fill="none" stroke="#2563eb" stroke-width="3" stroke-dasharray="6 4"/>`);
    // hit area: the whole slot, so a thumb never misses
    o.push(`<rect class="hit" x="${x - SW / 2}" y="${y - R2 - 10}" width="${SW}" height="${SZ + 38}" fill="transparent"/>`);
    let ly = y + R2 + 22;   // clear of the glow ring
    if (p.label) {
      const words = ch.numbering === 'names' ? wrap2(p.label) : [p.label];
      words.forEach((w, i) => o.push(`<text x="${x}" y="${ly + i * 16}" text-anchor="middle" font-size="${ch.numbering === 'names' ? 14 : 17}" fill="#111" font-weight="${ch.numbering === 'names' ? 600 : 700}">${esc(w)}</text>`));
      ly += 16 * words.length;
    }
    if (ch.blanksUnder) o.push(`<line x1="${x - 14}" y1="${ly + 2}" x2="${x + 14}" y2="${ly + 2}" stroke="#444" stroke-width="1.4"/>`);
    if (opts.marks && opts.marks[p.id] != null) {
      const mk = String(opts.marks[p.id]), mc = (opts.markCls && opts.markCls[p.id]) || '';
      const col = mc === 'bad' ? '#dc2626' : mc === 'good' ? '#15803d' : '#1d4ed8';
      const my = ly + (ch.blanksUnder ? 10 : 0) - 8;
      o.push(`<rect x="${x - 27}" y="${my}" width="54" height="21" rx="5" fill="#fff" stroke="${col}" stroke-width="1.6"/><text x="${x}" y="${my + 15.5}" text-anchor="middle" font-size="14" font-weight="700" fill="${col}">${esc(mk)}</text>`);
    }
    o.push('</g>');
  }
  let yb = top + (L.gens - 1) * RH + SZ + 18 * nameRows + MK + 6 + (ch.blanksUnder ? 22 : 0) + 6;
  if (ch.legend || ch.legendText) {
    const t = ch.legendText || null;
    if (t) o.push(`<text x="${left}" y="${yb + 18}" font-size="13" fill="#333">${esc(t)}</text>`);
    else {
      o.push(`<rect x="${left}" y="${yb + 4}" width="18" height="18" fill="${fill}" stroke="#1b1b1b"/><text x="${left + 24}" y="${yb + 18}" font-size="13" fill="#333">affected male</text>`);
      o.push(`<circle cx="${left + 145}" cy="${yb + 13}" r="9" fill="${fill}" stroke="#1b1b1b"/><text x="${left + 160}" y="${yb + 18}" font-size="13" fill="#333">affected female</text>`);
      if (ch.carriersShown) o.push(`<circle cx="${left + 290}" cy="${yb + 13}" r="9" fill="#fff" stroke="#1b1b1b"/><circle cx="${left + 290}" cy="${yb + 13}" r="3" fill="${fill}"/><text x="${left + 305}" y="${yb + 18}" font-size="13" fill="#333">carrier</text>`);
    }
    yb += 34;
  }
  if (ch.caption) o.push(`<text x="${left}" y="${yb + 18}" font-size="14" fill="#222" font-style="italic">${esc(ch.caption)}</text>`);
  return `<svg class="ped${opts.cls ? ' ' + opts.cls : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="${vis.some(p => p._auto) ? `min-width:${Math.round(W * 28 / SZ)}px;` : ''}max-width:${Math.round(W * (opts.grow || 1))}px" role="img" aria-label="${esc(opts.aria || 'Pedigree chart')}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif">${o.join('')}</svg>`;
}
function wrap2(s) {         // a long name wraps onto lines of about 10 characters, like her figures
  if (s.length <= 9) return [s];
  const out = []; let cur = '';
  for (const w of s.split(' ')) { if (cur && (cur + ' ' + w).length > 10) { out.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w; }
  if (cur) out.push(cur);
  return out.slice(0, 3);
}
GEN.svg = svg;

/* ── slips (§3): every distractor carries the id of the wrong rule that produces it ─────── */
const SLIPS = {
  W1: { name: 'Hidden carrier', what: 'the unaffected parent of an affected child has no copy', fix: 'An affected child got one recessive allele from EACH parent, so this unaffected parent must be a carrier, even if they married in.' },
  W2: { name: 'Autosomal vs X-linked', what: 'mixing up how autosomes and the X are passed on', fix: "Autosomes come from both parents to every child. Only the X is special: a son gets Dad's Y, never his X." },
  W3: { name: 'Working backwards', what: 'a parent or relative tells you a hidden allele', fix: 'Start from the recessive relative: someone who is bb can only pass on b.' },
  W4: { name: 'Over-calling X-linked', what: 'calling it X-linked when it is plain autosomal', fix: "An affected mother gives an X-linked recessive allele to ALL her sons. If one of her sons is unaffected, it can't be X-linked recessive." },
  W5: { name: 'Dominant-disorder genotypes', what: 'giving unaffected people a dominant allele', fix: 'In a dominant disorder, unaffected means homozygous recessive. The white shapes are the recessive ones.' },
  W6: { name: 'Probability wording', what: 'son vs child vs affected son; each child is a fresh chance', fix: "'A son' means you only count the boy boxes. Each pregnancy is a new square: the 4th child has the same chance as the 1st." },
  W7: { name: 'Genotype vs phenotype', what: 'carrier is a genotype, not a look', fix: 'Carrier is a genotype. What you SEE (the phenotype) is normal.' },
  W8: { name: 'Forced vs unknown', what: 'a definite answer where the chart cannot decide, or the reverse', fix: 'Only give a definite genotype when the chart forces it. If nothing decides between AA and Aa, the answer is not enough information.' },
  W9: { name: 'Chart reading', what: 'symbols, numbering and relations', fix: 'Squares are males, circles are females, shaded is affected, a slash is deceased. Someone who married in is a partner, not a sibling.' }
};
GEN.SLIPS = SLIPS;
/* her method, in her words (§2.10). The SAQ Trainer calls these "Emma's three questions". */
const RULE = {
  skip: 'Her question 1: does it skip a generation? If it skips (an affected child of two unaffected parents), it is recessive. If it never skips, it is dominant.',
  sex: 'Her question 2: is there a gender difference? Even means autosomal, lopsided means X-linked. A father passing it to his son rules out X-linked.',
  xl: 'In X-linked recessive, affected mothers pass it to ALL their sons. In X-linked dominant, affected fathers pass it to ALL their daughters.',
  rec: 'Her question 3: who are the homozygous recessives? Label them first, then work out everyone else from their parents and children.',
  mt: 'Mitochondrial DNA is passed on from mothers to all their children, never from fathers.',
  yl: 'Y-linked: only males are affected, and every son of an affected man is affected.',
  pun: 'Draw the Punnett square of the parents: one parent across the top, one down the side, one letter from each into every box.',
  read: 'Squares are males, circles are females, shaded means affected, and a slash means deceased. Generations are the Roman numerals down the left.'
};
GEN.RULE = RULE;

/* case matters: EE, Ee and ee are three different answers */
const norm = s => String(s).replace(/\s+/g, ' ').trim();
/* build a multiple choice: key + distractors in priority order, deduplicated, shuffled */
function mcq(R, key, dis, n, same) {
  n = n || 4;
  const seen = [key], out = [key];
  for (const d of dis) {
    if (out.length >= n) break;
    if (!d || d.t == null) continue;
    if (seen.some(s => norm(s.t) === norm(d.t) || (same && same(s.t, d.t)))) continue;
    seen.push(d); out.push(d);
  }
  const opts = R.shuffle(out);
  return { opts: opts.map(o => ({ t: o.t, slip: o.slip || null })), key: opts.indexOf(key) };
}
GEN.mcq = mcq;
const pct = v => Math.round(v * 100) + '%';
const QUARTERS = [0, 0.25, 0.5, 0.75, 1];
const isQuarter = v => QUARTERS.some(q => Math.abs(q - v) < 1e-9);

function visible(ch) { return ch.people.filter(p => !p.hidden); }
/* a name for anyone, even on a chart with no numbers */
function nameOf(ch, id) {
  const p = prep(ch).by[id];
  if (ch.numbering === 'names') return p.label;
  if (ch.numbering === 'roman') return ROMAN[p.gen] + '-' + p.label;
  if (ch.numbering === 'running') return p.label ? 'individual ' + p.label : '';
  return 'the ' + (p.affected ? 'affected ' : p.carrierShown ? 'carrier ' : 'unaffected ') + (p.sex === 'M' ? 'man' : 'woman') + ' in generation ' + ROMAN[p.gen];
}
GEN.nameOf = nameOf;
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
function wText(ch, w) {
  const n = i => nameOf(ch, w.ids[i]);
  switch (w.k) {
    case 'skip': return `${cap(n(0))} and ${n(1)} are unaffected, but their child ${n(2)} is affected. It skipped, so it is recessive.`;
    case 'aa-u': return `${cap(n(0))} and ${n(1)} are both affected, but their child ${n(2)} is not. Two affected parents with an unaffected child means it is dominant, and both parents are heterozygous.`;
    case 'xlr-mum-son': return `${cap(n(0))} is affected but her son ${n(1)} is not. An X-linked recessive mother passes it to ALL her sons, so it isn't X-linked recessive.`;
    case 'xlr-dad-daughter': return `${cap(n(1))} is affected but her father ${n(0)} is not. In X-linked recessive a daughter needs an affected X from her dad, so it isn't X-linked recessive.`;
    case 'xld-dad-daughter': return `${cap(n(0))} is affected but his daughter ${n(1)} is not. An X-linked dominant father passes it to ALL his daughters, so it isn't X-linked dominant.`;
    case 'xld-mum-son': return `${cap(n(1))} is affected but his mother ${n(0)} is not. A son's X comes from his mum, so it isn't X-linked dominant.`;
    case 'father-son': return `${cap(n(0))} passes it to his son ${n(1)}. A son gets Dad's Y, never his X, so a father passing it to his son rules out X-linked.`;
    case 'mt': return `${cap(n(1))} does not match their mother ${n(0)}. Mitochondrial traits go from a mother to all her children, so it isn't mitochondrial.`;
    case 'female': return `${cap(n(0))} is an affected female, so it can't be Y-linked.`;
    case 'carrier': return `${cap(n(0))} is drawn as a carrier. A dominant trait has no healthy carriers, so it is recessive.`;
    case 'must-carry': return `${MODE_NAME[w.mode].replace(/^./, c => c.toUpperCase())} would need ${n(0)}, who married in, to be a carrier too. That is unlikely.`;
    case 'y-pattern': return 'Every son of an affected man is affected and no female is. That is the Y-linked pattern, not an autosomal one.';
    case 'xld-pattern': return 'Every daughter of an affected father is affected and none of his sons is. That is her X-linked dominant rule: affected fathers pass it to ALL their daughters.';
  }
  return '';
}
GEN.wText = wText;
const WRANK = { skip: 0, 'aa-u': 0, 'xlr-mum-son': 1, 'xld-dad-daughter': 1, 'father-son': 2, 'xld-mum-son': 3, 'xlr-dad-daughter': 3, female: 1, carrier: 0, mt: 4, 'must-carry': 5, 'y-pattern': 6, 'xld-pattern': 6 };
/* the proof of a keyed mode: one witness against each mode it has to beat */
function proofFor(ch, keySet, against, A) {
  const W = witnesses(ch, A).slice().sort((a, b) => WRANK[a.k] - WRANK[b.k]);
  const out = [];
  for (const m of against) {
    if (keySet.includes(m)) continue;
    const w = W.find(x => x.out.includes(m));
    if (w && !out.includes(w)) out.push(w);
  }
  return out;
}
GEN.proofFor = proofFor;

/* ── pedigree questions (§5.3) ────────────────────────────────────────────────────────
   Every type has a derive(chart, args): the key, the slip-tagged distractors and "is this option right?",
   worked out from the DRAWN chart alone. The maker picks a chart and args, then calls derive; the tests
   strip every hidden genotype and call the same derive again (spec §6.3). */
const MODE_SETS = [
  { opts: ['autosomal dominant', 'autosomal recessive', 'sex-linked dominant', 'sex-linked recessive'], stem: 'What pattern of inheritance is shown in this pedigree?' },
  { opts: ['Recessive autosomal', 'Dominant autosomal', 'Recessive sex-linked', 'Dominant sex-linked'], stem: 'What pattern of inheritance does this trait follow?' },
  { opts: ['recessive sex linked', 'Recessive autosomal', 'Dominant sex-linked', 'Dominant autosomal'], stem: 'Which assumption about the disease would be accurate?' },
  { opts: ['autosomal recessive', 'sex-linked dominant', 'autosomal dominant', 'sex-linked recessive'], stem: 'The trait affecting the people in this pedigree chart is probably:', probably: true },
  { opts: ['y-linked', 'x-linked', 'recessive', 'dominant'], stem: 'Is this pedigree showing a dominant or recessive trait/disorder?', coarse: true },
  { opts: ['x-linked', 'dominant', 'recessive'], stem: '{names} are all affected by a _____ trait/disorder.', coarse: true, names: true },
  { opts: ['dominant', 'recessive'], stem: 'Is this pedigree showing a dominant or recessive trait/disorder?', coarse: true }
];
GEN.MODE_SETS = MODE_SETS;
const PROBABLY_STEM = 'The trait affecting the people in this pedigree chart is probably:';
function modeSlip(keySet, opt) {
  const s = modesOf(opt); if (!s || !keySet) return null;
  const auto = x => x.every(m => m === 'AD' || m === 'AR'), xl = x => x.every(m => XLINKED[m]);
  if (keySet.includes('AR') && auto(keySet) && s.includes('XLR') && xl(s)) return 'W4';
  if ((auto(keySet) && xl(s)) || (xl(keySet) && auto(s))) return 'W2';
  return null;
}
GEN.modeSlip = modeSlip;
function skillOf(P) { if (P.length && P.every(m => XLINKED[m] || m === 'YL')) return 'sexlinked'; if (P.length && P.every(m => m === 'MT')) return 'mito'; return 'pedigree'; }

/* genotype text for a solver set, in one style */
function genoText(mode, p, set, st, unkForm) {
  if (set.length === 1) return fmtG(mode, p.sex, set[0], st);
  if (isDomUnknown(mode, p.sex, set)) return unkForm === 'nei' ? NEI : fmtUnknown(mode, p.sex, st, unkForm);
  return NEI;
}
GEN.genoText = genoText;
const isUnknownText = t => /not enough information|\?|_|\bor\b|\//i.test(t);
GEN.isUnknownText = isUnknownText;
const sameGeno = (a, b) => isUnknownText(a) && isUnknownText(b);
/* the wrong genotypes for one person; each tagged one is produced by a named wrong rule */
function genoDistractors(mode, ch, p, set, st, R) {
  const out = [], unk = st.unk || 'nei';
  const F = (d, slip) => ({ t: fmtG(mode, p.sex, d, st), slip });
  const known = set.length === 1;
  // W1: a forced carrier in a recessive mode, read as having no copy
  if (RECESSIVE[mode] && known && carrierOf(mode, p.sex, set[0])) out.push(F(0, 'W1'));
  // W5: dominant disorders: a dominant allele given to the unaffected, or two to an affected heterozygote
  if (DOMINANT[mode]) {
    if (!p.affected) { out.push(F(1, 'W5')); if (p.sex === 'F' || mode === 'AD') out.push(F(2, 'W5')); }
    else if (known && set[0] === 1 && (p.sex === 'F' || mode === 'AD')) out.push(F(2, 'W5'));
  }
  // W8: definite where the chart can't decide, or "can't tell" where it can
  if (known) out.push({ t: unk === 'nei' ? NEI : fmtUnknown(mode, p.sex, st, unk), slip: 'W8' });
  else set.forEach(d => out.push(F(d, 'W8')));
  // X-linked: an autosomal pair written on an X chart (W2)
  if (XLINKED[mode] && st.x !== 'star') { const L = st.L || 'A', k = p.sex === 'M' ? 1 : domCount(mode, 'F', set[0]); out.push({ t: L.repeat(k) + L.toLowerCase().repeat(2 - k), slip: 'W2' }); }
  // everything else the person could be, untagged
  if (RECESSIVE[mode] && p.affected && (mode === 'AR' || p.sex === 'F')) out.push(F(1, null));
  (R ? R.shuffle(genos(mode, p.sex)) : genos(mode, p.sex)).forEach(d => out.push(F(d, null)));
  if (!known) out.push({ t: NEI, slip: null });
  return out;
}
function pickStyle(R, mode, o) {
  const L = (o && o.L) || R.pick(LETTERS);
  const x = XLINKED[mode] ? R.weighted([['sup', 5], ['flat', 3], ['star', 2]]) : 'sup';
  const unk = R.weighted([['nei', 4], ['q', 2], ['_', 1], ['or', 2]]);
  return { L, x, unk };
}
function premiseText(mode, kind) {
  const nm = { AD: 'an autosomal dominant', AR: 'an autosomal recessive', XLD: 'a sex-linked dominant', XLR: 'a sex-linked recessive' }[mode];
  return kind === 'illus' ? `The pedigree below illustrates ${nm} trait.` : `If this pedigree is showing ${nm} trait,`;
}
/* a mode he could name himself from this chart (keyed, with the evidence §4.4.6 wants) */
function foundMode(ch, A) {
  A = A || analyse(ch);
  if (A.P.length !== 1) return null;
  const k = keyOption(A.P, MODE_SETS[0].opts); if (!k) return null;
  return evidenceOK(ch, modesOf(k), MODE_SETS[0].opts, A) ? A.P[0] : null;
}
GEN.foundMode = foundMode;
const modeOK = (ch, a) => a.premise ? solve(ch, a.mode).possible : foundMode(ch) === a.mode;

const DERIVE = {
  'ped-mode'(ch, a) {
    const A = analyse(ch), k = keyOption(A.P, a.opts), ks = k ? modesOf(k) : null;
    return { ok: !!k && evidenceOK(ch, ks, a.opts, A), key: k, keySet: ks,
      tagged: a.opts.filter(x => x !== k).map(x => ({ t: x, slip: modeSlip(ks, x) })).filter(x => x.slip), correct: t => t === k };
  },
  'ped-geno'(ch, a) {
    const r = solve(ch, a.mode), p = prep(ch).by[a.who], set = r.possible ? r.sets[a.who] : [];
    const ok = modeOK(ch, a) && (set.length === 1 || isDomUnknown(a.mode, p.sex, set));
    const key = ok ? genoText(a.mode, p, set, a.st, a.st.unk) : null;
    return { ok, key, set, tagged: ok ? genoDistractors(a.mode, ch, p, set, a.st, null).filter(d => d.slip) : [],
      correct: t => set.length === 1 ? norm(t) === norm(key) : isUnknownText(t) };
  },
  'ped-geno2'(ch, a) {
    const r = solve(ch, 'AR'), X = prep(ch);
    const [p1, p2] = a.who.map(id => X.by[id]);
    const s1 = r.sets[p1.id], s2 = r.sets[p2.id];
    const ok = r.possible && s1.length === 1 && s2.length === 1;
    if (!ok) return { ok: false, tagged: [], correct: () => false };
    const g1 = fmtG('AR', p1.sex, s1[0], { L: 'A' }), g2 = fmtG('AR', p2.sex, s2[0], { L: 'A' });
    const c1 = s1[0] === 1, c2 = s2[0] === 1;
    const key = `${g1} and ${g2}`;
    const tagged = [{ t: `${c1 ? 'AA' : g1} and ${c2 ? 'AA' : g2}`, slip: 'W1' }, { t: `${c1 ? 'Aa/AA' : g1} and ${c2 ? 'AA/Aa' : g2}`, slip: 'W8' }];
    if (c1 && c2) tagged.push({ t: `AA and ${g2}`, slip: 'W1' }, { t: `${g1} and AA`, slip: 'W1' });
    return { ok: ok && (c1 || c2), key, tagged: tagged.filter(x => x.t !== key), correct: t => t === key };
  },
  'ped-next'(ch, a) {
    const v = coupleProb(ch, a.mode, a.f, a.m, a.what);
    const ok = modeOK(ch, a) && v != null && isQuarter(v);
    if (!ok) return { ok: false, tagged: [], correct: () => false };
    const pairs = solve(ch, a.mode).pairs[a.f + '|' + a.m].slice().sort();
    const [fd, md] = pairs[0], m = a.mode, P = (x, y, w) => childProbs(m, x, y)[w];
    const X = prep(ch), F = X.by[a.f], M = X.by[a.m], tagged = [];
    if (a.what === 'son' || a.what === 'dau') tagged.push({ t: pct(P(fd, md, a.what === 'son' ? 'affson' : 'affdau')), slip: 'W6' }, { t: pct(P(fd, md, 'child')), slip: 'W6' });
    if (a.what === 'affson') tagged.push({ t: pct(P(fd, md, 'son')), slip: 'W6' }, { t: pct(P(fd, md, 'child')), slip: 'W6' });
    if (a.what === 'child' && XLINKED[m]) tagged.push({ t: pct(P(fd, md, 'son')), slip: 'W6' });
    if (RECESSIVE[m]) tagged.push({ t: pct(P(carrierOf(m, 'M', fd) ? 0 : fd, carrierOf(m, 'F', md) ? 0 : md, a.what)), slip: 'W1' });
    if (DOMINANT[m]) tagged.push({ t: pct(P(F.affected && m === 'AD' ? 2 : fd, M.affected ? 2 : md, a.what)), slip: 'W5' });
    const key = pct(v);
    return { ok, key, fd, md, tagged: tagged.filter(x => x.t !== key && isQuarter(parseInt(x.t, 10) / 100)), correct: t => t === key };
  },
  'ped-read'(ch, a) {
    const V = visible(ch), X = prep(ch), c = f => V.filter(f).length;
    let key, tagged = [];
    switch (a.kind) {
      case 'females': case 'males': {
        const s = a.kind === 'females' ? 'F' : 'M', o = s === 'F' ? 'M' : 'F';
        key = String(c(p => p.sex === s));
        tagged = [{ t: String(c(p => p.sex === o)), slip: 'W9' }, { t: String(c(p => p.sex === s && p.affected)), slip: 'W9' }]; break;
      }
      case 'affected': key = String(c(p => p.affected)); tagged = [{ t: String(c(p => !p.affected)), slip: 'W9' }, { t: String(c(p => p.affected && p.sex === 'M')), slip: 'W9' }]; break;
      case 'deceased': key = String(c(p => p.deceased)); tagged = [{ t: String(c(p => p.affected)), slip: 'W9' }]; if (key === '0') return { ok: false, tagged: [], correct: () => false }; break;
      case 'gens': key = String(Math.max(...V.map(p => p.gen))); break;
      case 'gender': { const p = X.by[a.who]; key = p.sex === 'M' ? 'Male' : 'Female'; tagged = [{ t: p.sex === 'M' ? 'Female' : 'Male', slip: 'W9' }, { t: NEI, slip: 'W9' }]; break; }
      case 'kids': {
        const f = X.fams.find(x => x.f === a.f && x.m === a.m), n = f.kids.length;
        const withSp = n + f.kids.filter(k => X.partners[k].length).length, grand = n + f.kids.reduce((s, k) => s + X.kids[k].length, 0);
        key = String(n); tagged = [withSp !== n ? { t: String(withSp), slip: 'W9' } : null, grand !== n ? { t: String(grand), slip: 'W9' } : null].filter(Boolean); break;
      }
      case 'relation': {
        const rel = relation(ch, a.a, a.b), A1 = X.by[a.a];
        const inlaw = A1.sex === 'F' ? 'a sister and brother in law' : 'a brother and sister in law';
        const W = { couple: 'a couple that reproduces', siblings: 'siblings', 'in-law': inlaw, cousins: 'cousins' };
        if (!W[rel]) return { ok: false, tagged: [], correct: () => false };
        key = W[rel];
        if (rel === 'in-law') tagged = [{ t: 'siblings', slip: 'W9' }, { t: 'a couple that reproduces', slip: 'W9' }];
        if (rel === 'couple') tagged = [{ t: 'siblings', slip: 'W9' }, { t: 'an infertile couple', slip: 'W9' }];
        if (rel === 'siblings') tagged = [{ t: inlaw, slip: 'W9' }];
        break;
      }
    }
    return { ok: true, key, tagged: tagged.filter(x => x.t !== key), correct: t => t === key };
  },
  'ped-cloze'(ch, a) {
    const A = analyse(ch), keys = clozeKeys(ch, a.mode, a.v);
    const ok = !!keys && A.P.length === 1 && A.P[0] === a.mode && evidenceOK(ch, [a.mode], MODE_SETS[0].opts.concat(a.mode === 'YL' ? ['y-linked'] : []), A);
    const slots = ['mode', 'occurs', 'link', 'affects'];
    return { ok, keys, blanks: ok ? slots.map((s, i) => ({ key: keys[i], tagged: CLOZE[a.v][s].filter(x => x !== keys[i]).map(x => ({ t: x, slip: blankSlip(s, x, keys[i], a.mode) })).filter(x => x.slip) })) : [] };
  },
  'ped-ab'(charts, a) {
    const want = modesOf(a.want), otherW = modesOf(a.want === 'dominant' ? 'recessive' : 'dominant');
    const is = (ch, set) => { const A = analyse(ch); return A.P.length && A.P.every(m => set.includes(m)) && evidenceOK(ch, set, ['dominant', 'recessive'], A); };
    const aW = is(charts[0], want) && is(charts[1], otherW), bW = is(charts[1], want) && is(charts[0], otherW);
    const key = aW ? 'Pedigree A' : bW ? 'Pedigree B' : null;
    return { ok: !!key && aW !== bW, key, tagged: [], correct: t => t === key };
  },
  'ped-pheno'(ch, a) {
    const r = solve(ch, a.mode), p = prep(ch).by[a.who];
    const key = p.affected ? 'affected' : 'normal';
    const isC = r.possible && r.sets[a.who].length === 1 && carrierOf(a.mode, p.sex, r.sets[a.who][0]);
    return { ok: r.possible, key, carrier: isC, tagged: p.affected ? [] : [{ t: 'carrier', slip: 'W7' }], correct: t => t === key };
  },
  'ped-bb'(ch, a) {
    const A = analyse(ch);
    const ok = A.P.length === 1 && A.P[0] === a.mode && evidenceOK(ch, [a.mode], ['dominant', 'recessive'], A);
    const key = a.mode === 'AD' ? 'the white ones' : `the ${a.col} ones`;
    const tagged = [{ t: 'none of them: you cannot tell', slip: 'W8' }];
    if (a.mode === 'AD') tagged.push({ t: `the ${a.col} ones`, slip: 'W5' });
    return { ok, key, tagged, correct: t => t === key };
  },
  'ped-mt'(ch) {
    const A = analyse(ch);
    return { ok: A.P.length === 1 && A.P[0] === 'MT', key: 'Mothers to all their children', tagged: [], correct: t => t === 'Mothers to all their children' };
  },
  'ped-all'(ch, a) {
    const r = solve(ch, a.mode); if (!r.possible) return { ok: false, people: [] };
    const st = { L: a.L, x: 'sup' }, m = a.mode;
    const unkOf = sex => (m === 'AD' || m === 'AR') ? a.L + '_' : fmtG(m, 'F', DOMINANT[m] ? 2 : 0, st).replace(/.$/, '_');
    const people = visible(ch).map(p => {
      const set = r.sets[p.id];
      const key = set.length === 1 ? fmtG(m, p.sex, set[0], st) : isDomUnknown(m, p.sex, set) ? unkOf(p.sex) : null;
      const cycle = genos(m, p.sex).map(d => fmtG(m, p.sex, d, st));
      if (m === 'AD' || m === 'AR' || p.sex === 'F') cycle.push(unkOf(p.sex));
      return { id: p.id, key, cycle, set };
    });
    return { ok: people.every(p => p.key && p.cycle.includes(p.key)), people };
  }
};
GEN.DERIVE = DERIVE;
/* the slip behind a wrong genotype in the genotype-everyone task */
function allSlip(mode, p, set, pick, st) {
  const d = genos(mode, p.sex).find(x => fmtG(mode, p.sex, x, st) === pick);
  if (d == null) return set.length === 1 ? 'W8' : null;               // picked "A_" where it is decided
  if (set.length > 1) return 'W8';                                      // picked a definite one where it can't be decided
  if (RECESSIVE[mode] && carrierOf(mode, p.sex, set[0]) && d === 0) return 'W1';
  if (DOMINANT[mode] && !p.affected && d >= 1) return 'W5';
  if (DOMINANT[mode] && p.affected && set[0] === 1 && d === 2) return 'W5';
  return null;
}
GEN.allSlip = allSlip;

/* ── the makers ── */
function modeQ(R, o) {
  const mode = o.mode;
  for (let t = 0; t < 40; t++) {
    const ch = genChart(R, mode, { numbering: o.numbering });
    if (!ch) continue;
    const A = analyse(ch);
    if (!A.P.includes(mode)) continue;
    for (const S of R.shuffle(MODE_SETS)) {
      if (S.names && ch.numbering !== 'names') continue;
      const D = DERIVE['ped-mode'](ch, { opts: S.opts }); if (!D.ok) continue;
      const others = A.poss.filter(m => !A.P.includes(m));
      let stem = S.stem;
      if (others.length && !S.probably && !S.coarse) stem = PROBABLY_STEM;
      if (S.names) { const aff = visible(ch).filter(p => p.affected).map(p => p.label); stem = stem.replace('{names}', aff.slice(0, -1).join(', ') + (aff.length > 2 ? ',' : '') + ' and ' + aff[aff.length - 1]); }
      const m = mcq(R, { t: D.key }, S.opts.filter(x => x !== D.key).map(x => ({ t: x, slip: modeSlip(D.keySet, x) })), S.opts.length);
      const against = [...new Set(S.opts.flatMap(x => modesOf(x) || []))];
      const proof = proofFor(ch, D.keySet, against, A);
      return { type: 'ped-mode', skill: skillOf(A.P), chart: ch, args: { opts: S.opts }, stem, opts: m.opts, key: m.key, keySet: D.keySet, P: A.P,
        probably: others.length > 0, others, proof, fb: modeFeedback(ch, A, D.keySet, proof, others) };
    }
  }
  return null;
}
function modeFeedback(ch, A, ks, proof, others) {
  const lines = [];
  if (ks.includes('YL')) lines.push(RULE.yl); else if (ks.includes('MT')) lines.push(RULE.mt);
  else if (ks.every(m => DOMINANT[m]) || ks.every(m => RECESSIVE[m])) lines.push(RULE.skip);
  if (ks.length === 1 && ks[0] !== 'YL' && ks[0] !== 'MT') lines.push(RULE.sex);
  const note = others.length ? `That is why it says "probably": ${others.map(m => MODE_NAME[m]).join(' or ')} could still fit if more people who married in were carriers.` : '';
  return { rule: lines.slice(0, 2), evidence: proof.map(w => wText(ch, w)), glow: [...new Set(proof.flatMap(w => w.ids))], note };
}
function genoQ(R, o) {
  const mode = o.mode;
  if (mode === 'YL' || mode === 'MT') return null;
  const shade = o.premise === 'shade';
  for (let t = 0; t < 40; t++) {
    const ch = genChart(R, mode, { numbering: shade ? 'running' : o.numbering });
    if (!ch) continue;
    const A = analyse(ch);
    if (!(o.premise ? A.res[mode].possible : foundMode(ch, A) === mode)) continue;
    const r = A.res[mode], st = pickStyle(R, mode, o);
    const cand = visible(ch).filter(p => p.label && (r.sets[p.id].length === 1 || isDomUnknown(mode, p.sex, r.sets[p.id])));
    const unk = cand.filter(p => r.sets[p.id].length > 1), kn = cand.filter(p => r.sets[p.id].length === 1);
    const interesting = kn.filter(p => (RECESSIVE[mode] && carrierOf(mode, p.sex, r.sets[p.id][0])) || (DOMINANT[mode] && !p.affected) || (DOMINANT[mode] && p.affected && r.sets[p.id][0] === 1));
    const p = unk.length && R.chance(0.3) ? R.pick(unk) : interesting.length && R.chance(0.75) ? R.pick(interesting) : kn.length ? R.pick(kn) : null;
    if (!p) continue;
    const args = { mode, who: p.id, st, premise: o.premise || null };
    const D = DERIVE['ped-geno'](ch, args); if (!D.ok) continue;
    let stem;
    if (shade) {
      ch.title = { AD: 'Autosomal Dominant', AR: 'Autosomal Recessive', XLD: 'X-linked Dominant', XLR: 'X-linked Recessive' }[mode];
      ch.shadingMeans = DOMINANT[mode] ? 'dominant-phenotype' : 'homozygous-recessive';
      ch.blanksUnder = true;
      stem = `${DOMINANT[mode] ? 'Assuming the dominant phenotype is shaded' : 'Assuming the individuals with homozygous recessive genotypes are shaded'}, what is the genotype of ${whoLong(ch, p)}?`;
    } else if (o.premise) stem = `${premiseText(mode)} what is the genotype of ${whoLong(ch, p)}?`;
    else stem = `Use the pedigree to answer the following question. What is the genotype of ${whoLong(ch, p)}?`;
    if (st.x === 'star' && XLINKED[mode]) stem += ' (* indicates an affected allele.)';
    const q = mcq(R, { t: D.key }, genoDistractors(mode, ch, p, D.set, st, R), 4, sameGeno);
    if (q.opts.length < 3) continue;
    return { type: 'ped-geno', skill: XLINKED[mode] ? 'sexlinked' : 'pedigree', chart: ch, args, stem, opts: q.opts, key: q.key, mode, premise: o.premise || null,
      fb: genoFeedback(ch, mode, p, r, st, !!o.premise) };
  }
  return null;
}
function genoFeedback(ch, m, p, r, st, given) {
  const X = prep(ch), set = r.sets[p.id], nm = nameOf(ch, p.id);
  const lines = [], glow = [p.id];
  const recT = fmtG(m, p.sex, DOMINANT[m] ? 0 : (XLINKED[m] && p.sex === 'M' ? 1 : 2), st);
  if (set.length > 1) lines.push(`Nothing on the chart decides whether ${nm} has one dominant allele or two, so the answer is not enough information.`);
  else {
    const d = set[0], g = fmtG(m, p.sex, d, st);
    if (p.affected && RECESSIVE[m]) lines.push(`${cap(nm)} is affected by a recessive trait, so ${nm} is ${g}. Label the homozygous recessives first.`);
    else if (!p.affected && DOMINANT[m]) lines.push(`In a dominant disorder, unaffected means homozygous recessive, so ${nm} is ${g}.`);
    else if (p.affected && DOMINANT[m]) {
      const rel = X.kids[p.id].concat(p.father ? [p.father, p.mother] : []).filter(k => !X.by[k].affected && !X.by[k].hidden && (!XLINKED[m] || p.sex === 'F'));
      if (rel.length && d === 1) { glow.push(rel[0]); lines.push(`${cap(nm)} is affected, but has an unaffected ${X.kids[p.id].includes(rel[0]) ? 'child' : 'parent'} (${nameOf(ch, rel[0])}). So ${nm} also carries a recessive allele: ${g}.`); }
      else lines.push(`${cap(nm)} is affected and is ${g}.`);
    } else if (carrierOf(m, p.sex, d)) {
      const affKid = X.kids[p.id].find(k => X.by[k].affected), affPar = p.father && [p.father, p.mother].find(k => X.by[k].affected);
      let why;
      if (affKid) why = XLINKED[m] && X.by[affKid].sex === 'M' ? `${cap(nm)} is unaffected but has an affected son (${nameOf(ch, affKid)}), and a son's X comes from his mother.` : `${cap(nm)} is unaffected but has an affected child (${nameOf(ch, affKid)}), who got one recessive allele from EACH parent.`;
      else if (affPar) why = `${cap(nm)} is unaffected but has an affected ${X.by[affPar].sex === 'M' ? 'father' : 'mother'} (${nameOf(ch, affPar)}), who could only pass on a recessive allele.`;
      else why = `${cap(nm)} must carry a hidden recessive allele.`;
      if (affKid) glow.push(affKid); else if (affPar) glow.push(affPar);
      lines.push(`${why} So ${nm} is ${g}, a carrier.`);
    } else lines.push(`${cap(nm)} is ${g}.`);
  }
  return { rule: [RULE.rec], evidence: lines, glow: [...new Set(glow)], note: given ? '' : `First name the mode: this chart shows ${MODE_NAME[m]}.` };
}
function geno2Q(R) {
  for (let t = 0; t < 60; t++) {
    const ch = genChart(R, 'AR', { numbering: 'roman', carrierSpouse: 0.35 });
    if (!ch) continue;
    const X = prep(ch);
    const cs = R.shuffle(ch.couples.filter(c => (X.marriedIn.has(c.a) || X.marriedIn.has(c.b)) && X.kids[c.a].some(k => X.by[k].affected)));
    for (const c of cs) {
      const who = [c.a, c.b].sort((x, y) => X.by[x].x - X.by[y].x);
      const D = DERIVE['ped-geno2'](ch, { who }); if (!D.ok) continue;
      const fill = [{ t: D.key.replace(/Aa/g, 'aa'), slip: null }, { t: 'aa and AA/Aa', slip: null }, { t: 'Aa/AA and aa', slip: null }];
      const q = mcq(R, { t: D.key }, D.tagged.concat(fill), 4);
      if (q.opts.length < 4) continue;
      const affKid = X.kids[who[0]].find(k => X.by[k].affected && X.kids[who[1]].includes(k));
      return { type: 'ped-geno2', skill: 'pedigree', chart: ch, mode: 'AR', premise: 'mode', args: { who },
        stem: `If this pedigree is showing an autosomal recessive trait, what are the genotypes of individual ${nameOf(ch, who[0])} and ${nameOf(ch, who[1])}?`, opts: q.opts, key: q.key,
        fb: { rule: [RULE.rec], evidence: [`Their child ${nameOf(ch, affKid)} is aa and got one a from EACH parent. So an unaffected parent here must be a carrier, Aa, even the one who married in.`], glow: who.concat([affKid]), note: '' } };
    }
  }
  return null;
}

/* next-child chances (§4.3: only when every consistent assignment agrees, and it is 0/25/50/75/100 %) */
function childProbs(mode, fd, md) {
  const s = childDist(mode, fd, md, 'M'), dd = childDist(mode, fd, md, 'F');
  const sum = (dist, sex, f) => dist.reduce((a, p, d) => a + (f(mode, sex, d) ? p : 0), 0);
  const affS = sum(s, 'M', affectedOf), affD = sum(dd, 'F', affectedOf), carD = sum(dd, 'F', carrierOf), carS = sum(s, 'M', carrierOf);
  return { child: (affS + affD) / 2, son: affS, dau: affD, affson: affS / 2, affdau: affD / 2, carrier: (carS + carD) / 2, cardau: carD / 2 };
}
GEN.childProbs = childProbs;
function coupleProb(ch, mode, f, m, what) {
  const r = solve(ch, mode); if (!r.possible) return null;
  const pairs = r.pairs[f + '|' + m]; if (!pairs) return null;
  const vals = [...new Set(pairs.map(([a, b]) => childProbs(mode, a, b)[what]))];
  return vals.length === 1 ? vals[0] : null;
}
GEN.coupleProb = coupleProb;
const NEXT_STEM = {
  child: (a, b) => `What is the chance that ${a} and ${b}'s next child will be affected?`,
  childHer: (a, b) => `What percentage of the offspring of ${a} and ${b} have a chance of being affected by the disease represented by this pedigree chart?`,
  son: (a, b) => `If ${a} and ${b} have another son, what is the chance that he is affected?`,
  affson: (a, b) => `What is the chance that ${a} and ${b}'s next child is an affected son?`,
  dau: (a, b) => `If ${a} and ${b} have another daughter, what is the chance that she is affected?`
};
function nextQ(R, o) {
  const mode = o.mode;
  if (mode === 'YL' || mode === 'MT') return null;
  for (let t = 0; t < 50; t++) {
    const ch = genChart(R, mode, { numbering: o.numbering || R.weighted([['roman', 3], ['names', 1]]) });
    if (!ch) continue;
    const X = prep(ch);
    const fams = X.fams.filter(f => !X.by[f.f].hidden && !X.by[f.m].hidden);
    const f = R.chance(0.5) ? fams[0] : R.pick(fams);
    const whats = XLINKED[mode] ? ['child', 'son', 'affson', 'dau'] : ['child', 'childHer', 'affson'];
    const what = o.what || R.pick(whats), w2 = what === 'childHer' ? 'child' : what;
    const args = { mode, f: f.f, m: f.m, what: w2, premise: o.premise || null };
    const D = DERIVE['ped-next'](ch, args); if (!D.ok) continue;
    const fill = R.shuffle(QUARTERS).map(x => ({ t: pct(x), slip: null }));
    const q = mcq(R, { t: D.key }, D.tagged.concat(fill), 4);
    const a = nameOf(ch, f.f), b = nameOf(ch, f.m);
    const [A1, B1] = X.by[f.f].x < X.by[f.m].x ? [a, b] : [b, a];
    const st = { L: R.pick(LETTERS), x: 'sup' };
    const gf = fmtG(mode, 'M', D.fd, st), gm = fmtG(mode, 'F', D.md, st);
    return { type: 'ped-next', skill: XLINKED[mode] ? 'sexlinked' : 'pedigree', chart: ch, mode, premise: o.premise || null, args,
      stem: (o.premise ? premiseText(mode, 'illus') + ' ' : '') + NEXT_STEM[what](A1, B1), opts: q.opts, key: q.key,
      square: { fam: XLINKED[mode] ? (DOMINANT[mode] ? 'xld' : 'xl') : 'auto', f: gf, m: gm, L: st.L },
      fb: { rule: [RULE.rec, RULE.pun], evidence: [`${cap(a)} is ${gf} and ${b} is ${gm}. Their Punnett square gives ${D.key} for ${{ child: 'each child', son: 'each son', dau: 'each daughter', affson: 'an affected son, counted out of all the children' }[w2]}.`],
        glow: [f.f, f.m], note: o.premise ? '' : `First name the mode: this chart shows ${MODE_NAME[mode]}.` } };
  }
  return null;
}

/* reading the chart: counts, gender, relations */
const READ_KINDS = ['females', 'males', 'affected', 'deceased', 'gens', 'gender', 'relation', 'kids'];
function readQ(R, o) {
  const mode = o.mode || R.pick(['AD', 'AR', 'XLR', 'XLD']);
  for (let t = 0; t < 30; t++) {
    const kind = o.kind || R.weighted([['females', 2], ['males', 1], ['affected', 1], ['deceased', 1], ['gens', 1], ['gender', 2], ['relation', 3], ['kids', 2]]);
    const ch = genChart(R, mode, { numbering: o.numbering || R.weighted([['roman', 4], ['running', 1], ['names', 1]]), deceased: kind === 'deceased' ? 0.9 : 0.12 });
    if (!ch) continue;
    const V = visible(ch), X = prep(ch);
    const args = { kind };
    if (kind === 'gender') args.who = R.pick(V.filter(q => q.label)).id;
    if (kind === 'kids') { const f = R.pick(X.fams); args.f = f.f; args.m = f.m; }
    if (kind === 'relation') {
      const pairs = [];
      for (const cpl of ch.couples) pairs.push([cpl.a, cpl.b]);
      for (const f of X.fams) for (let i = 0; i + 1 < f.kids.length; i++) pairs.push([f.kids[i], f.kids[i + 1]]);
      for (const cpl of ch.couples) for (const s of V) if (relation(ch, s.id, cpl.a) === 'siblings' && X.marriedIn.has(cpl.b)) pairs.push([s.id, cpl.b]);
      const V2 = V.filter(p => p.gen >= 3);
      for (let i = 0; i < V2.length; i++) for (let j = i + 1; j < V2.length; j++) if (relation(ch, V2[i].id, V2[j].id) === 'cousins') pairs.push([V2[i].id, V2[j].id]);
      const [a, b] = R.pick(pairs).sort((x, y) => X.by[x].x - X.by[y].x);
      args.a = a; args.b = b;
    }
    const D = DERIVE['ped-read'](ch, args); if (!D.ok) continue;
    const n = +D.key;
    const fill = kind === 'gender' ? [] : kind === 'relation' ? ['siblings', 'a couple that reproduces', 'cousins', 'third cousins', 'an infertile couple'].map(t => ({ t, slip: null }))
      : [n + 1, n - 1, n + 2, n + 3].filter(x => x >= 0).map(x => ({ t: String(x), slip: null }));
    const q = mcq(R, { t: D.key }, D.tagged.concat(fill), kind === 'gender' ? 3 : 4);
    if (q.opts.length < (kind === 'gender' ? 3 : 4)) continue;
    let stem, glow = [], ev;
    const nm = id => nameOf(ch, id);
    switch (kind) {
      case 'females': case 'males': stem = `How many ${kind} are shown in this pedigree?`; glow = V.filter(p => p.sex === (kind === 'females' ? 'F' : 'M')).map(p => p.id);
        ev = `${kind === 'females' ? 'Circles are females' : 'Squares are males'}: there are ${D.key}, counting the people who married in.`; break;
      case 'affected': stem = 'How many individuals in this pedigree are affected?'; glow = V.filter(p => p.affected).map(p => p.id); ev = `Shaded means affected: ${D.key} shaded symbols.`; break;
      case 'deceased': stem = 'How many individuals are deceased in this pedigree?'; glow = V.filter(p => p.deceased).map(p => p.id); ev = `A diagonal slash through a symbol means deceased: ${D.key} have one.`; break;
      case 'gens': stem = 'How many generations are shown in this pedigree?'; ev = `Each row is a generation: ${ROMAN.slice(1, n + 1).join(', ')}.`; break;
      case 'gender': stem = `Use the pedigree to answer the following question. What gender is the individual ${nm(args.who)}?`; glow = [args.who];
        ev = `${cap(nm(args.who))} is a ${X.by[args.who].sex === 'M' ? 'square, so male' : 'circle, so female'}.`; break;
      case 'kids': stem = `How many children did ${nm(args.f)} and ${nm(args.m)} have?`; glow = X.fams.find(x => x.f === args.f && x.m === args.m).kids.slice();
        ev = `Count the lines that drop from their sibship line: ${D.key}. Partners who married in are not their children.`; break;
      case 'relation': stem = `What is the family relation between ${nm(args.a)} and ${nm(args.b)}? They are…`; glow = [args.a, args.b];
        ev = { 'a couple that reproduces': 'A marriage line joins them and a line drops to their children: a couple that reproduces.', siblings: 'They hang from the same sibship line, under the same parents: siblings.', cousins: 'Their parents are brother and sister, so they are cousins.' }[D.key]
          || 'One of them married in: they are joined to the other one\'s sibling by a marriage line, so they are in-laws, not siblings.'; break;
    }
    return { type: 'ped-read', skill: 'pedigree', chart: ch, args, stem, opts: q.opts, key: q.key, kind, fb: { rule: [RULE.read], evidence: [ev], glow, note: '' } };
  }
  return null;
}

/* the justify-it cloze (her three versions of "This condition is [ ] since it occurs in [ ] and [ ] since it affects [ ]") */
const CLOZE = {
  v1: { mode: ['dominant', 'recessive'], occurs: ['every generation', 'every second generation'], link: ['autosomal', 'sex-linked'], affects: ['both genders', 'one gender much more than another'] },
  v2: { mode: ['Dominant', 'Recessive'], occurs: ['every generation', 'every second generation'], link: ['Y-linked', 'X-linked', 'Autosomal'], affects: ['only girls', 'only boys', 'all genders'] },
  v3: { mode: ['Y-linked', 'autosomal recessive', 'autosomal dominant', 'X-linked'], occurs: ['males in every second generation', 'random genders in every generation', 'random genders in every second generation', 'males in every generation'], link: ['autosomal', 'mitochondrial', 'sex-linked'], affects: ['only males', 'all genders equally', 'only females', 'mainly males'] }
};
GEN.CLOZE = CLOZE;
function clozeKeys(ch, m, v) {
  const V = visible(ch), am = V.filter(p => p.affected && p.sex === 'M').length, af = V.filter(p => p.affected && p.sex === 'F').length;
  if (v === 'v3') return m === 'YL' ? ['Y-linked', 'males in every generation', 'sex-linked', 'only males'] : null;
  if (m === 'YL' || m === 'MT') return null;
  const skips = witnesses(ch).some(w => w.k === 'skip');
  const mw = DOMINANT[m] ? 0 : 1, C = CLOZE[v];
  if (DOMINANT[m] === !!skips) return null;
  let link, affects;
  if (m === 'AD' || m === 'AR') { if (!am || !af) return null; link = v === 'v1' ? 'autosomal' : 'Autosomal'; affects = v === 'v1' ? 'both genders' : 'all genders'; }
  else {
    link = v === 'v1' ? 'sex-linked' : 'X-linked';
    if (v === 'v1') { if (m === 'XLR' ? am < 2 * Math.max(1, af) : af < 2 * Math.max(1, am)) return null; affects = 'one gender much more than another'; }
    else if (m === 'XLR' && !af) affects = 'only boys';
    else if (m === 'XLD' && !am) affects = 'only girls';
    else return null;
  }
  return [C.mode[mw], C.occurs[mw], link, affects];
}
GEN.clozeKeys = clozeKeys;
function blankSlip(slot, x, key, mode) {
  if (slot === 'link') { if (/sex|x-linked/i.test(x) && /auto/i.test(key)) return mode === 'AR' ? 'W4' : 'W2'; if (/auto/i.test(x) && /sex|x-/i.test(key)) return 'W2'; }
  return null;
}
function clozeQ(R, o) {
  const mode = o.mode;
  for (let t = 0; t < 60; t++) {
    const ch = genChart(R, mode, { numbering: 'roman' });
    if (!ch) continue;
    for (const v of mode === 'YL' ? ['v3'] : R.shuffle(['v1', 'v2'])) {
      const D = DERIVE['ped-cloze'](ch, { mode, v }); if (!D.ok) continue;
      const slots = ['mode', 'occurs', 'link', 'affects'];
      const blanks = slots.map((s, i) => {
        const sh = R.shuffle(CLOZE[v][s].map(x => ({ t: x, slip: x === D.keys[i] ? null : blankSlip(s, x, D.keys[i], mode) })));
        return { opts: sh, key: sh.findIndex(x => x.t === D.keys[i]) };
      });
      const A = analyse(ch), proof = proofFor(ch, [mode], ['AD', 'AR', 'XLD', 'XLR'], A);
      return { type: 'ped-cloze', skill: skillOf([mode]), chart: ch, mode, args: { mode, v }, stem: 'This condition is [0] since it occurs in [1] and [2] since it affects [3].', blanks,
        fb: { rule: [mode === 'YL' ? RULE.yl : RULE.skip, RULE.sex], evidence: proof.slice(0, 3).map(w => wText(ch, w)), glow: [...new Set(proof.slice(0, 3).flatMap(w => w.ids))], note: '' } };
    }
  }
  return null;
}

/* A or B: which chart shows a dominant (or recessive) trait? */
function abQ(R, o) {
  const want = o.want || R.pick(['dominant', 'recessive']);
  const pick = (modes, set) => {
    for (let t = 0; t < 40; t++) {
      const ch = genChart(R, R.pick(modes), { numbering: 'none', maxSlots: 7, gens: R.pick([3, 3, 4]) });
      if (!ch) continue;
      const A = analyse(ch);
      if (A.P.length && A.P.every(x => modesOf(set).includes(x)) && evidenceOK(ch, modesOf(set), ['dominant', 'recessive'], A)) return ch;
    }
    return null;
  };
  const d = pick(['AD', 'AD', 'XLD'], 'dominant'), r = pick(['AR', 'AR', 'XLR'], 'recessive');
  if (!d || !r) return null;
  const aIsWant = R.chance(0.5);
  const tgt = want === 'dominant' ? d : r, oth = want === 'dominant' ? r : d;
  const charts = aIsWant ? [tgt, oth] : [oth, tgt];
  charts[0].title = 'A'; charts[1].title = 'B';
  const D = DERIVE['ped-ab'](charts, { want }); if (!D.ok) return null;
  const opts = [{ t: 'Pedigree A', slip: null }, { t: 'Pedigree B', slip: null }];
  const pf = (ch, set) => proofFor(ch, set, ['AD', 'AR', 'XLD', 'XLR'], analyse(ch)).filter(w => w.k === 'skip' || w.k === 'aa-u' || w.k === 'must-carry');
  const pT = pf(tgt, modesOf(want)), pO = pf(oth, modesOf(want === 'dominant' ? 'recessive' : 'dominant'));
  return { type: 'ped-ab', skill: 'pedigree', charts, args: { want }, stem: `Which pedigree is showing a ${want} trait/ disorder?`, opts, key: opts.findIndex(x => x.t === D.key),
    fb: { rule: [RULE.skip], evidence: [pT[0] ? D.key + ': ' + wText(tgt, pT[0]) : '', pO[0] ? 'The other one: ' + wText(oth, pO[0]) : ''].filter(Boolean),
      glow: [], glowA: (aIsWant ? pT : pO).flatMap(w => w.ids), glowB: (aIsWant ? pO : pT).flatMap(w => w.ids), note: '' } };
}

/* a carrier's phenotype is normal (W7) */
function phenoQ(R, o) {
  const mode = RECESSIVE[o.mode] ? o.mode : R.pick(['XLR', 'AR']);
  for (let t = 0; t < 40; t++) {
    const ch = genChart(R, mode, { numbering: 'roman' });
    if (!ch) continue;
    const r = solve(ch, mode), V = visible(ch).filter(p => p.label);
    const carriers = V.filter(p => !p.affected && r.sets[p.id].length === 1 && carrierOf(mode, p.sex, r.sets[p.id][0]));
    const p = carriers.length && R.chance(0.7) ? R.pick(carriers) : R.pick(V);
    const args = { mode, who: p.id };
    const D = DERIVE['ped-pheno'](ch, args); if (!D.ok) continue;
    const q = mcq(R, { t: D.key }, D.tagged.concat([{ t: D.key === 'normal' ? 'affected' : 'normal', slip: null }, { t: 'carrier', slip: null }]), 3);
    const nm = nameOf(ch, p.id);
    return { type: 'ped-pheno', skill: XLINKED[mode] ? 'sexlinked' : 'pedigree', chart: ch, mode, premise: 'mode', args,
      stem: `${premiseText(mode, 'illus')} What is the phenotype of individual ${nm}?`, opts: q.opts, key: q.key,
      fb: { rule: [SLIPS.W7.fix], evidence: [D.carrier ? `${cap(nm)} is a carrier (that is a genotype), but what you see is normal: the symbol is not shaded.` : p.affected ? `${cap(nm)} is shaded, so the phenotype is affected.` : `${cap(nm)} is not shaded, so the phenotype is normal.`], glow: [p.id], note: '' } };
  }
  return null;
}
/* "which coloured shape is the bb?" (her revision deck, slides 59 and 79) */
function bbQ(R, o) {
  const mode = o.mode === 'AR' || o.mode === 'AD' ? o.mode : R.pick(['AD', 'AR']);
  for (let t = 0; t < 40; t++) {
    const col = R.pick(['black', 'red', 'blue', 'grey']);
    const ch = genChart(R, mode, { numbering: 'roman', fill: col });
    if (!ch) continue;
    const args = { mode, col };
    const D = DERIVE['ped-bb'](ch, args); if (!D.ok) continue;
    const q = mcq(R, { t: D.key }, D.tagged.concat([{ t: mode === 'AD' ? `the ${col} ones` : 'the white ones', slip: null }, { t: 'both', slip: null }]), 4);
    const proof = proofFor(ch, [mode], ['AD', 'AR'], analyse(ch));
    return { type: 'ped-bb', skill: 'pedigree', chart: ch, mode, args, stem: 'Mode of inheritance? How do you know? Which coloured shape is the bb?', opts: q.opts, key: q.key,
      fb: { rule: [RULE.skip, RULE.rec], evidence: [mode === 'AD' ? 'It never skips a generation, so it is dominant. In a dominant disorder the unaffected (white) shapes are the recessive ones: bb.' : `It skips a generation, so it is recessive. The affected (${col}) shapes are the homozygous recessives: bb.`].concat(proof.slice(0, 1).map(w => wText(ch, w))),
        glow: [...new Set(proof.slice(0, 1).flatMap(w => w.ids))], note: 'Her exam revision deck asks this one (slides 59 and 79).' } };
  }
  return null;
}
/* mtDNA: who passes it on? (her key: mothers to all their children) */
function mtQ(R) {
  for (let t = 0; t < 40; t++) {
    const ch = genChart(R, 'MT', { numbering: 'none' });
    if (!ch) continue;
    const V = visible(ch), X = prep(ch);
    const mum = V.find(p => p.affected && p.sex === 'F' && X.kids[p.id].length), dad = V.find(p => p.affected && p.sex === 'M' && X.kids[p.id].length);
    if (!mum || !dad) continue;
    const D = DERIVE['ped-mt'](ch); if (!D.ok) continue;
    const opts = ['Mothers to all their children', 'Mothers to their male children', 'Mothers to their female children', 'Fathers to their female children'];
    const q = mcq(R, { t: opts[0] }, opts.slice(1).map(t => ({ t, slip: null })), 4);
    return { type: 'ped-mt', skill: 'mito', chart: ch, mode: 'MT', args: {}, stem: 'From this pedigree chart one can deduce that mitochondrial DNA is passed on from', opts: q.opts, key: q.key,
      fb: { rule: [RULE.mt], evidence: ['Every child of an affected mother is affected, sons and daughters alike. An affected father passes it to none of his children.'], glow: [mum.id, dad.id], note: '' } };
  }
  return null;
}
/* genotype everyone (§5.3.5): tap each person to cycle, then check */
function allQ(R, o) {
  const mode = ['AD', 'AR', 'XLR'].includes(o.mode) ? o.mode : R.pick(['AD', 'AR', 'AR', 'XLR']);
  for (let t = 0; t < 40; t++) {
    const ch = genChart(R, mode, { numbering: 'roman', gens: R.pick([3, 3, 4]) });
    if (!ch || visible(ch).length > 14) continue;
    const args = { mode, L: R.pick(LETTERS) };
    const D = DERIVE['ped-all'](ch, args); if (!D.ok) continue;
    const L = args.L;
    return { type: 'ped-all', skill: XLINKED[mode] ? 'sexlinked' : 'pedigree', chart: ch, mode, premise: 'mode', args, people: D.people,
      stem: `${premiseText(mode)} write the genotype of every person.`,
      hint: `Tap a person to change their genotype, then Check. ${(mode === 'XLR' ? 'X' + SUPU[L] + 'X_' : L + '_')} means the second allele can't be told from the chart.`,
      fb: { rule: [RULE.rec], evidence: ['Label the homozygous recessives first. Everyone else has at least one dominant allele, and their parents and children decide the second one.'], glow: [], note: '' } };
  }
  return null;
}

/* the registry the page and the tests share */
const PED_TYPES = {
  'ped-read': { label: 'Read the chart', make: readQ, modes: ['AD', 'AR', 'XLD', 'XLR'] },
  'ped-mode': { label: 'Name the mode', make: modeQ, modes: ['AD', 'AR', 'XLD', 'XLR', 'YL'] },
  'ped-cloze': { label: 'Justify it', make: clozeQ, modes: ['AD', 'AR', 'XLD', 'XLR', 'YL'] },
  'ped-geno': { label: 'Genotype of a person', make: genoQ, modes: ['AD', 'AR', 'XLD', 'XLR'] },
  'ped-geno2': { label: 'Two genotypes, mode given', make: geno2Q, modes: ['AR'] },
  'ped-all': { label: 'Genotype everyone', make: allQ, modes: ['AD', 'AR', 'XLR'] },
  'ped-next': { label: 'Next child', make: nextQ, modes: ['AD', 'AR', 'XLD', 'XLR'] },
  'ped-ab': { label: 'A or B', make: abQ, modes: ['dominant', 'recessive'] },
  'ped-pheno': { label: 'Phenotype of a carrier', make: phenoQ, modes: ['AR', 'XLR'] },
  'ped-bb': { label: 'Which shape is bb?', make: bbQ, modes: ['AD', 'AR'] },
  'ped-mt': { label: 'Mitochondrial', make: mtQ, modes: ['MT'] }
};
GEN.PED_TYPES = PED_TYPES;
/* make(type, R, opts): one question, or null if this mode can't give that type */
GEN.make = function (type, R, o) {
  const T = PED_TYPES[type] || (GEN.PUN_TYPES && GEN.PUN_TYPES[type]) || (GEN.KAR_TYPES && GEN.KAR_TYPES[type]);
  if (!T) throw new Error('no type ' + type);
  o = o || {};
  if (type === 'ped-ab' && o.mode) o = Object.assign({ want: o.mode }, o);
  const q = T.make(R, o);
  if (q) q.id = type + ':' + Math.floor(R() * 1e9).toString(36);
  return q;
};

/* ── calibration: how the engine reaches each of her keys on its own (§6.4; the page shows it too) ── */
function herCheck(chs, s, q, c, key, opts) {
  const ch = chs[s.id], A = GEN.analyse(ch), X = GEN.prep(ch), by = X.by;
  const V = ch.people.filter(p => !p.hidden);
  const oneMode = () => (A.P.length === 1 ? A.P[0] : null);
  switch (c.t) {
    case 'fixed': return { got: key, why: 'fixed: ' + c.why };
    case 'mode': {
      const os = (c.opts || opts).filter(o => GEN.modesOf(o));
      const k = GEN.keyOption(A.P, os);
      const ev = k ? GEN.evidenceOK(ch, GEN.modesOf(k), os, A) : false;
      const others = A.poss.filter(m => !A.P.includes(m));
      return { got: k, why: `P=[${A.P}] possible=[${A.poss}] evidence ${ev ? 'ok' : 'THIN'}${others.length ? ' (so "probably")' : ''}` };
    }
    case 'count': return { got: String(V.filter(p => c.what === 'F' ? p.sex === 'F' : c.what === 'deceased' ? p.deceased : false).length) };
    case 'gender': return { got: by[c.who].sex === 'M' ? 'Male' : 'Female' };
    case 'geno': {
      const m = c.mode || c.assume || oneMode();   // assume: her key presumes a mode the chart alone doesn't force (her-charts.js says why)
      if (!m) return { got: null, why: `no single mode: P=[${A.P}]` };
      if (c.alsoEngine && oneMode() !== m) return { got: null, why: `her title says ${m} but the engine finds P=[${A.P}]` };
      const r = GEN.solve(ch, m), p = by[c.who];
      const t = GEN.genoText(m, p, r.sets[c.who], { L: c.L || 'A', x: c.x || 'sup' }, c.unk || 'nei');
      return { got: c.prefix ? (opts.find(o => o.startsWith(t + ' ') || o.startsWith(t + '=')) || t) : t, why: `${m}${c.mode ? ' (given)' : c.assume ? ' (her key assumes it; the chart alone gives ' + (oneMode() || 'no single mode') + ')' : ' (found)'} set {${r.sets[c.who]}}` };
    }
    case 'geno2': {
      const r = GEN.solve(ch, c.mode);
      return { got: c.who.map(id => GEN.genoText(c.mode, by[id], r.sets[id], { L: c.L }, c.unk)).join(' and ') };
    }
    case 'next': { const m = oneMode(); if (!m) return { got: null, why: `no single mode: P=[${A.P}]` }; const v = GEN.coupleProb(ch, m, c.f, c.m, 'child'); return { got: v == null ? null : pct(v), why: m }; }
    case 'pheno': { const r = GEN.solve(ch, c.mode); const p = by[c.who]; return { got: p.affected ? 'affected' : 'normal', why: `set {${r.sets[c.who]}}` }; }
    case 'whoHas': {
      const r = GEN.solve(ch, c.mode);
      const hits = c.among.filter(id => by[id].sex === c.sex && JSON.stringify(r.sets[id]) === JSON.stringify([c.d]));
      return { got: hits.length === 1 ? by[hits[0]].label : null, why: `matches: ${hits.map(h => by[h].label)}` };
    }
    case 'aorb': {
      const want = GEN.modesOf(c.want), isW = id => { const A2 = GEN.analyse(chs[id]); return A2.P.every(m => want.includes(m)); };
      const a = isW(c.a), b = isW(c.b);
      return { got: a && !b ? 'Pedigree A' : b && !a ? 'Pedigree B' : null, why: `A P=[${GEN.analyse(chs[c.a]).P}] B P=[${GEN.analyse(chs[c.b]).P}]` };
    }
    case 'mt': return { got: A.P.length === 1 && A.P[0] === 'MT' ? 'Mothers to all their children' : null, why: `P=[${A.P}]` };
    case 'kids': return { got: String(X.fams.find(f => f.f === c.f && f.m === c.m).kids.length) };
    case 'pctAff': { const ks = X.fams.find(f => f.f === c.f && f.m === c.m).kids; return { got: pct(ks.filter(k => by[k].affected).length / ks.length) }; }
    case 'pctFemDesc': {
      const desc = []; const walk = id => X.kids[id].forEach(k => { if (!desc.includes(k)) { desc.push(k); walk(k); } }); walk(c.f);
      const fem = desc.filter(k => by[k].sex === 'F'); return { got: pct(fem.filter(k => by[k].affected).length / fem.length), why: `${fem.filter(k => by[k].affected).length} of ${fem.length} female descendants` };
    }
    case 'dauSons': { const ks = X.fams.find(f => f.f === c.f && f.m === c.m).kids; return { got: `${ks.filter(k => by[k].sex === 'F').length} and ${ks.filter(k => by[k].sex === 'M').length}` }; }
    case 'rel': { const r = GEN.relation(ch, c.a, c.b); return { got: { couple: 'a couple that reproduces', siblings: 'siblings' }[r] || r }; }
    case 'modeWord': case 'occurs': case 'linkWord': case 'affects': {
      const m = oneMode(); if (!m) return { got: null, why: `P=[${A.P}]` };
      const slot = { modeWord: 'mode', occurs: 'occurs', linkWord: 'link', affects: 'affects' }[c.t];
      const v = Object.keys(GEN.CLOZE).find(v => JSON.stringify([...GEN.CLOZE[v][slot]].sort()) === JSON.stringify([...opts].sort()));
      const ks = v && GEN.clozeKeys(ch, m, v);
      return { got: ks ? ks[['mode', 'occurs', 'link', 'affects'].indexOf(slot)] : null, why: `${m} ${v || 'no matching option set'}` };
    }
    case 'bbShape': { const m = oneMode(); return { got: m === 'AD' ? 'white' : m === 'AR' ? ch.fill : null, why: `P=[${A.P}]` }; }
    case 'saq': {
      const m = oneMode(); const r = GEN.solve(ch, 'AD');
      const dad = GEN.genoText('AD', by.dad, r.sets.dad, { L: c.L }, 'nei'), mum = GEN.genoText('AD', by.mum, r.sets.mum, { L: c.L }, 'nei');
      const v = GEN.coupleProb(ch, 'AD', 'dad', 'mum', 'child');
      return { got: `${m}|${dad}|${mum}|${pct(v)}`, want: `${c.mode}|${c.dad}|${c.mum}|${c.pct}` };
    }
  }
  return { got: null, why: 'unknown check ' + c.t };
}
GEN.herCheck = herCheck;

/* ── her charts are written as text tables (her-charts.js); this turns one into a chart ─────
   line: id sex gen x flags parents label…   flags: a affected, c carrier shown, d deceased, h hidden
   (a parent her chart does not draw), t1/t2… twins; parents "father+mother" or "-" */
function parseChart(spec) {
  const people = [];
  for (const raw of spec.people.split('\n')) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const f = line.split(/\s+/);
    const [id, sex, gen, x, flags, par] = f, label = f.slice(6).join(' ');
    const p = { id, sex, gen: +gen, x: +x, label: label === '-' ? '' : label };
    if (flags !== '-') {
      if (flags.includes('a')) p.affected = true;
      if (flags.includes('c')) p.carrierShown = true;
      if (flags.includes('d')) p.deceased = true;
      if (flags.includes('h')) p.hidden = true;
      const t = flags.match(/t(\d)/); if (t) p.twin = +t[1];
    }
    if (par !== '-') { const [fa, mo] = par.split('+'); p.father = fa; p.mother = mo; }
    people.push(p);
  }
  const couples = (spec.couples || '').split(/\s+/).filter(Boolean).map(s => {
    const cons = s.includes('='); const [a, b] = s.split(/[-=]/); return cons ? { a, b, consanguineous: true } : { a, b };
  });
  const ch = Object.assign({}, spec, { people, couples });
  delete ch.qs;
  return ch;
}
GEN.parseChart = parseChart;

if (typeof module !== 'undefined' && module.exports) module.exports = GEN; else root.GEN = GEN;
GEN._internal = { prep, domCount };
})(typeof window !== 'undefined' ? window : globalThis);
