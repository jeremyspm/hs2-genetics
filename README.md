# HS2 Genetics · Trainer (live, unlisted: https://jeremyspm.github.io/hs2-genetics/)

Pedigree charts, Punnett squares and karyotypes for HS2 (722.541) Test 3, which closes Mon 26 Oct 2026.
Her words, in six quiz stems: **PEDIGREE CHARTS WILL BE TESTED IN TEST 3**.

It makes endless fresh questions in the shapes her Module 3 bank uses (from `hs2-test3`, 168 genetics questions), works out
every key from the chart as drawn, names the slip behind every wrong answer (W1–W9), and re-draws her own charts beside her
figures. Spec: `HS2-GENETICS-TRAINER-SPEC.md` in `jeremyspm/estate` (branch `claude/gallant-hypatia-sbc0ik`).

## What is hers and what is the tool's

- **Hers, word for word:** every question, option and key on the Her charts screen (`her-charts.js`), her written-SAQ model
  answer, her option wordings ("sex-linked", "Recessive autosomal", "Not enough information given"), her cloze sentences, her
  method (her three questions). Her figures are hot-linked from `../hs2-test3/img/` and never copied here.
- **The tool's:** every generated chart, cross and key, and the model answer on a generated written question. Where her key
  presumes something the chart alone doesn't force (chart `5ddd418`, III-1 = ee), her key wins and a note says so
  (Jeremy's ruling, 28 Sep 2026).

## Files

- `engine.js` — all the genetics, no DOM: the solver, mode keying (spec §4.4), witnesses, notation, Punnett, the chart
  generator and layout, the SVG renderer, and every question type with its `derive`. The page and the tests load the same file.
- `her-charts.js` — her 23 charts as data, with her questions and the check the engine must pass for each.
- `index.html` — the app (the Paper Sim look, ported from `hs2-test3/template.html`). No build step.
- `tests/run.mjs` — tests 1–5 and 7: Punnett brute force, the solver against an independent brute force, 500 generated
  questions per type re-derived from a chart stripped of the simulation's genotypes, her keys (calibration), parse gate, speed.
- `tests/drive.mjs` — test 6: every drill in headless Chrome at 375×812 and 1280×800, plus Decide for me, the set, undo and reset.
- `tools/serve.mjs` serves this repo beside `hs2-test3` and `hs2-final` like Pages does; `tools/shots.mjs`, `tools/sitshots.mjs` take screenshots.

```
node tools/serve.mjs          # then http://127.0.0.1:8765/hs2-genetics/
node tests/run.mjs            # ~30 s
node tests/drive.mjs --n=20   # needs the server; Playwright from $PLAYWRIGHT, Chrome or $CHROME
```

## Not done yet

P7: the full README in the Paper Sim voice, and (only if asked) link cards on `hs2-test3` and `hs2-final`.
