# HS2 · Genetics Trainer (live, unlisted: https://jeremyspm.github.io/hs2-genetics/)

Pedigree charts, Punnett squares and karyotypes for HS2 (722.541) **Test 3, which closes Mon 26 Oct 2026** (confirm on Canvas),
and the genetics cases of the final (Thu 5 Nov). Her words, in six quiz stems: **PEDIGREE CHARTS WILL BE TESTED IN TEST 3**.

## What it is

A drill machine built on her own Module 3 bank (the 168 genetics questions in `hs2-test3`, 317 quiz marks). It **makes** fresh
charts and crosses in exactly the shapes her quizzes use, **works out every key** from the chart as drawn, and **names the slip**
behind every wrong answer, the way MedCalc Drill does: every wrong option is what a named mistake would give, so picking it says
which mistake it was. It also **re-draws her own charts** beside her figures and asks every question type of them.

- **Home** (one 375×812 screen): 🧭 *Decide for me* (10 at a time: about 6 at your most-missed slip, 3 from the least-seen rows of
  her Genetics list, 1 review; a miss comes back 3 later), then Pedigree drills (11 shapes), Punnett squares (10), Karyotypes (4),
  Write it · from a story, the ⏱ Test 3 genetics set, Slips and readiness, and Her charts.
- **The Test 3 set**: 12 items in her shapes and option wordings, one karyotype, one written; on her clock (65 min / 37 Q ≈ 1 min
  45 s each = 21 min); no feedback until the end, then the score by slip and a review.
- **Write it**: her student-marked pedigree SAQ (quiz 211104) on a generated chart, either built from her-worded phrase chips or
  written on paper and self-marked; her model answer shows word for word. Her Punnett SAQ stays in the Test 3 SAQ Trainer (linked).
- **From a story**: the final's case 14 (colour blindness) and case 15 (cystic fibrosis and Huntington's whānau) shapes: pick the
  chart that matches, tap everyone who must be a carrier, answer the pass-it-on questions; or draw it on paper first.
- **Her charts**: all 23 of her pedigree figures redrawn from data beside her image (hot-linked from `../hs2-test3/img/`, never
  copied), her question and key word for word, the engine's own derivation under each, and 🎲 every other question asked of it.
- Tap only, never typing: options, chips, inline drop-down panels (never a native `<select>`), tap-to-cycle genotypes. Keys 1–4
  answer, Enter moves on; on the handheld the arrow keys move a ring over the people on a chart and Space taps.
- Copy for Claude on every answer: the question, your answer, the key, the slip and the chart written out in words.

## What it is not

- Not her answers where she has not given one: every generated chart, cross and key is the tool's. Her charts, questions, options,
  keys and model answers are hers and labelled as hers.
- No dihybrid crosses (her bank only ever uses "dihybrid" as a wrong option), no Rhesus, no penetrance or new mutations, no Bayesian
  "2/3 carrier" arithmetic (her arithmetic stops at 0 / 25 / 50 / 75 / 100 %), no typed answers, no AI marking, no accounts.
- Progress lives only in this browser (`hs2gen.log`); the theme follows the Test 3 Paper Sim's (`hs2t3.theme`).

## How a key is made (engine.js)

- **The solver** enumerates genotypes only for people who have children, top down, and checks the leaves against their parents,
  for six modes (AD, AR, XLD, XLR, Y-linked, mitochondrial). It returns which modes are possible, every genotype each person can
  have, each couple's possible parent pair, and two numbers the keying needs.
- **Naming the mode (spec §4.4)**: *cost* = how many people who married in would have to be hidden carriers; *likelihood* = how
  well the mode predicts the children. The plausible set is the cheapest modes minus any below 1/8 of the best likelihood. An option
  is keyed only if exactly one option covers the whole set; if another mode is still possible the stem says "probably", as hers do.
  A mode question is asked only with ≥ 3 affected people and a **witness** against every other mode on offer: the people whose
  pattern rules it out (two unaffected parents with an affected child, an affected mother's unaffected son, a father passing it to
  his son…). The witnesses glow on the chart in the feedback and are what "tap the evidence" is checked against.
- One witness was added to the spec's list: her rule *affected fathers pass it to ALL their daughters*, seen in full. Nothing strict
  ever rules out autosomal dominant on an X-linked dominant chart, so without it that mode could never be keyed 4-way.
- A genotype question is asked only when the chart decides it, or when the right answer is "not enough information" (sometimes on
  purpose, for W8). A next-child chance is asked only when every consistent assignment gives the same value.
- **Her key wins** (Jeremy, 28 Sep 2026): on her chart `5ddd418` her key (III-1 = ee) assumes dominant; the rule above alone finds
  autosomal recessive ~10× likelier. Her chart page shows her key with a note; the general rule is unchanged.

## The slips

| id | slip | a wrong option it produces |
|---|---|---|
| W1 | Hidden carrier | `AA` for the unaffected parent of an affected child |
| W2 | Autosomal vs X-linked | "sex-linked" on a chart where a father passes it to his son |
| W3 | Working backwards | `BB` for the brown-eyed man whose mother was blue-eyed |
| W4 | Over-calling X-linked | "sex-linked recessive" on plain autosomal recessive |
| W5 | Dominant-disorder genotypes | `Ee` for an unaffected person in a dominant disorder |
| W6 | Probability wording | 25 % for "if they have a son" (it is 50 %); "less now they've had one" |
| W7 | Genotype vs phenotype | "carrier" as a phenotype; a genotypic ratio for a phenotypic one |
| W8 | Forced vs unknown | a definite `AA` where the chart cannot decide, or the reverse |
| W9 | Chart reading | counting a married-in partner as a sibling; also any miss on an option with no named slip |

## Linked from

- **hs2-test3** home: a link card under Practise (`42f3b75`), slim on a phone so that home still fits one screen.
- **hs2-final** What to learn, the case 14 and case 15 rows (`0f6f8b9`): buttons that open the matching story drill directly.
- Deep links: `#go/<drill>` starts a drill by name (`#go/story:XLR`, `#go/story:AR`, `#go/story:AD`, `#go/ped-mode`, `#go/mixedPun`…);
  Back then lands on home.

## Files

- `engine.js`: all the genetics, no DOM. The page loads it as `window.GEN`; the tests `require()` the same file.
- `her-charts.js`: her 23 charts as text tables (who, sex, generation, where she drew them, shading, parents, label), each with her
  questions, options and key word for word and the check the engine must pass.
- `index.html`: the app. The token block, cards, buttons, options, header, theme toggle and home rows are ported from
  `hs2-test3/template.html`. No build step.
- `tests/run.mjs`: 1 Punnett against a naive gamete enumeration (every letter, X-linked, all 21 ABO pairs in both notations,
  incomplete dominance) · 2 the solver against an independent brute force over 2,000 small charts, including impossible ones ·
  3 500 generated questions per type and mode, every key and every slip-tagged distractor re-derived from a chart stripped of the
  simulation's genotypes · 3b 2,140 questions on her own charts, none of which may change her chart · 4 every one of her 61 keys ·
  5 parse gate · 7 speed (generate + solve, median ~0.1 ms). About 267,000 checks, ~30 s.
- `tests/drive.mjs` (test 6): every drill in headless Chrome at 375×812 and 1280×800, 200 items each, answered at random through the
  real buttons, plus Decide for me, the set and its review, questions on her charts, undo and reset. Fails on a console error, a
  horizontal overflow, a person not drawn and labelled, feedback over ~80 words, or an arrow character in feedback.
  `BASE=https://jeremyspm.github.io/hs2-genetics/` drives the live site.
- `tools/serve.mjs` serves this repo beside `hs2-test3` and `hs2-final` the way Pages does (`T3=`/`FINAL=` point at other checkouts);
  `tools/shots.mjs`, `tools/sitshots.mjs`, `tools/p6shots.mjs` take the check-in screenshots.

```
node tools/serve.mjs          # then http://127.0.0.1:8765/hs2-genetics/
node tests/run.mjs            # --quick for a fast loop, --only=4 for one section
node tests/drive.mjs --n=20   # needs the server; Playwright from $PLAYWRIGHT, Chrome or $CHROME
```

## Traps met while building (so they are not met twice)

- **Case-insensitive de-duplication ate genotype options.** `EE`, `Ee` and `ee` collapsed into one option until option
  comparison became case-sensitive. The same bug made "is this option right?" accept `Ee` for `ee`.
- **The likelihood rule and her key can disagree** (chart `5ddd418`). Test 4 fails loudly on any such chart; it is decided by
  Jeremy and recorded in `her-charts.js` (`assume`), never tuned away.
- **A requeued miss was dropped** when it came due after the fresh questions ran out; `addItem` now serves any pending miss first.
- **Sitting flags must be set before the first paint**, or the set's first question has no timer.
- **Editing the sims:** clone them with `core.autocrlf=false` (their `resplice.mjs` expects LF) and use `resplice.mjs` for a
  template-only change; `build.mjs` needs his Canvas archive and the sibling repos.
