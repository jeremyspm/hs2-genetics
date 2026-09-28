/* HS2 Genetics Trainer · her-charts.js
   Every pedigree chart in her Module 3 bank (hs2-test3/img/HS2DATA-…), re-drawn as data, with HER question,
   HER options and HER key word for word (from hs2-test3's built bank, 21 Sep 2026). x = where the symbol sits in her
   figure, in symbol widths. "check" says how the engine must reach her key on its own; tests/run.mjs asserts it
   (the calibration set, spec §2.4 and §6.4). Loaded by index.html (window.HER) and by the tests. */
(function (root) {
'use strict';
const HER = [
{ id: 'kj', t: 'Kate and Joe', imgs: ['HS2DATA-a3ee3fe92deb70db.jpg'], numbering: 'names', fill: 'black', people: `
kate    F 1 4.8 - -            Kate
joe     M 1 6.9 - -            Joe
curtis  M 2 2.4 a -            Curtis
anne    F 2 4.6 - joe+kate     Anne
max     M 2 7.3 a joe+kate     Max
natalie F 2 9.4 - -            Natalie
devon   F 3 1.4 - curtis+anne  Devon
ken     M 3 3.4 - curtis+anne  Ken
kim     F 3 5.4 - curtis+anne  Kimberly
ryan    M 3 7.1 - max+natalie  Ryan
donna   F 3 9.6 a max+natalie  Donna`,
  couples: 'kate-joe curtis-anne max-natalie',
  qs: [{ bank: 'q6b152501ab', quiz: '211120', q: 'Curtis, Max, and Donna are all affected by a _________________ trait/disorder.',
    opts: ['No answer text provided.', 'x-linked', 'dominant', 'recessive'], key: 'recessive', check: { t: 'mode' } }] },

{ id: 'gm', t: 'The affected grandmother', imgs: ['HS2DATA-18ccfe39bcf5a43f.jpg', 'HS2DATA-784330d9f34c20d9.webp'], numbering: 'none', fill: 'red',
  legend: true, people: `
g1m M 1 2.1 - -       -
g1f F 1 3.6 a -       -
g2f F 1 8.2 - -       -
g2m M 1 9.7 - -       -
c1  M 2 1.0 - g1m+g1f -
c2  F 2 2.4 - g1m+g1f -
c3  F 2 3.8 - g1m+g1f -
c4  M 2 5.3 - g1m+g1f -
c5  F 2 7.4 - g2m+g2f -
c6  M 2 8.9 - g2m+g2f -
c7  F 2 10.2 - g2m+g2f -
d1  F 3 3.7 - c4+c5   -
d2  M 3 5.1 a c4+c5   -
d3  F 3 6.5 t1 c4+c5  -
d4  F 3 7.8 t1 c4+c5  -
d5  M 3 9.2 - c4+c5   -`,
  couples: 'g1m-g1f g2f-g2m c4-c5',
  qs: [{ bank: 'qf5f07e4e1b', quiz: '211120', q: 'Is this pedigree showing a dominant or recessive trait/disorder?',
    opts: ['y-linked', 'x-linked', 'recessive', 'dominant'], key: 'recessive', check: { t: 'mode' } },
  { bank: 'q3dc03a23ff', quiz: '211120', q: 'What pattern of inheritance does this trait follow? (her question, as printed across the top of her figure)',
    opts: ['Recessive autosomal', 'Dominant sex-linked', 'Recessive sex-linked', 'Dominant autosomal'], key: 'Recessive autosomal', check: { t: 'mode' } }] },

{ id: 'f5', t: 'Five females', imgs: ['HS2DATA-aa267b336b4b7320.jpg', 'HS2DATA-4a7170fc113b5bc5.jpg'], numbering: 'roman', fill: 'black', people: `
i1   M 1 4.5 - -        1
i2   F 1 5.9 - -        2
ii1  M 2 2.2 - -        1
ii2  F 2 3.9 - i1+i2    2
ii3  F 2 5.2 - i1+i2    3
ii4  F 2 6.8 - i1+i2    4
ii5  M 2 8.2 - -        5
iii1 M 3 2.9 a ii1+ii2  1
iii2 F 3 7.5 - ii5+ii4  2`,
  couples: 'i1-i2 ii1-ii2 ii4-ii5',
  qs: [{ bank: 'q828e188c01', quiz: '211120', q: 'How many females are shown in this pedigree?', opts: ['5', '2', '1', '4'], key: '5', check: { t: 'count', what: 'F' } },
  { bank: 'qe716789a0b', quiz: '211120', q: 'If this pedigree is showing an autosomal recessive trait, what are the genotypes of individual II-1 and II-2?',
    opts: ['Aa and Aa', 'aa and Aa', 'aa and AA/Aa', 'Aa/AA and aa'], key: 'Aa and Aa', check: { t: 'geno2', who: ['ii1', 'ii2'], mode: 'AR', L: 'A', unk: 'slash' } }] },

{ id: 'dec', t: 'Two deceased', imgs: ['HS2DATA-5939d8ebe01d0d78.jpg', 'HS2DATA-677f58b08d8cfd82.jpg'], numbering: 'roman', fill: 'black', people: `
i1   F 1 2.9 d -        1
i2   M 1 4.3 d -        2
ii1  F 2 1.4 - -        1
ii2  M 2 2.9 a i2+i1    2
ii3  F 2 4.3 a i2+i1    3
ii4  M 2 5.8 - -        4
iii1 F 3 1.4 - ii2+ii1  1
iii2 M 3 2.8 a ii2+ii1  2
iii3 M 3 4.4 - ii4+ii3  3
iii4 F 3 5.8 - ii4+ii3  4
iii5 M 3 7.3 a ii4+ii3  5
iii6 M 3 8.6 a ii4+ii3  6`,
  couples: 'i1-i2 ii1-ii2 ii3-ii4',
  qs: [{ bank: 'qc9602dec1c', quiz: '211120', q: 'How many individuals are deceased in this pedigree?', opts: ['3', '5', '2', '7'], key: '2', check: { t: 'count', what: 'deceased' } },
  { bank: 'qa12e55cdb1', quiz: '211120', q: 'The circle and squares that are shaded in mean that those individuals ______?',
    opts: ['are not affected with the trait or disorder', 'are affected with the trait or disorder', 'are carriers for the trait or disorder', 'are females'],
    key: 'are affected with the trait or disorder', check: { t: 'fixed', why: 'Shaded = affected: the one symbol rule her bank asks.' } }] },

{ id: 'pedA', t: 'Pedigree A', part: 'ab', imgs: ['HS2DATA-0850a5d8c9be334a.jpg'], numbering: 'none', fill: 'black', title: 'A', people: `
a1  M 1 1.4 - -       -
a2  F 1 2.5 - -       -
a3  M 1 4.3 a -       -
a4  F 1 5.4 - -       -
a5  F 2 1.0 - a1+a2   -
a6  F 2 2.1 - a1+a2   -
a7  M 2 3.3 - a1+a2   -
a8  F 2 4.9 a a3+a4   -
a9  M 3 2.2 - a7+a8   -
a10 F 3 3.3 a a7+a8   -
a11 M 3 4.4 - -       -
a12 M 3 5.5 a a7+a8   -
a13 F 3 6.6 - -       -
a14 M 4 2.2 a a11+a10 -
a15 F 4 3.3 a a11+a10 -
a16 F 4 4.4 - a11+a10 -
a17 M 4 5.5 a a12+a13 -
a18 F 4 6.6 - a12+a13 -`,
  couples: 'a1-a2 a3-a4 a7-a8 a10-a11 a12-a13', qs: [] },
{ id: 'pedB', t: 'Pedigree B', part: 'ab', imgs: ['HS2DATA-0850a5d8c9be334a.jpg'], numbering: 'none', fill: 'black', title: 'B', people: `
b1 F 1 2.2 - -     -
b2 M 1 3.3 - -     -
b3 F 2 1.0 - b2+b1 -
b4 F 2 2.1 - b2+b1 -
b5 M 2 3.3 - b2+b1 -
b6 F 2 4.4 - -     -
b7 F 3 2.8 - b5+b6 -
b8 M 3 3.9 - b5+b6 -
b9 F 3 5.0 a b5+b6 -`,
  couples: 'b1-b2 b5-b6',
  qs: [{ bank: 'qc0197d62c5', quiz: '211120', q: 'Which pedigree is showing a dominant trait/ disorder?', opts: ['Pedigree A', 'No answer text provided.', 'Pedigree B'],
    key: 'Pedigree A', check: { t: 'aorb', a: 'pedA', b: 'pedB', want: 'dominant' } }] },

{ id: 'ad3', t: 'Assign the recessives first', imgs: ['HS2DATA-4dce09ffef157cba.jpg'], numbering: 'roman', fill: 'black', legend: true, people: `
i1   M 1 2.8 a -       1
i2   F 1 4.3 - -       2
ii1  M 2 1.8 - i1+i2   1
ii2  F 2 3.6 a i1+i2   2
ii3  M 2 5.3 a i1+i2   3
ii4  F 2 6.7 - -       4
iii1 F 3 5.1 a ii3+ii4 1
iii2 F 3 6.8 - ii3+ii4 2`,
  couples: 'i1-i2 ii3-ii4',
  qs: [{ bank: 'q0b060be2ee', quiz: '211120', q: 'Once you determine if the trait/disorder being show in the pedigree is dominant or recessive, which individuals do you assign a genotype to first?',
    opts: ['all the individuals with a dominant genotype', 'the unshaded individuals', 'the shaded individuals', 'all the individuals with a recessive genotype'],
    key: 'all the individuals with a recessive genotype', check: { t: 'fixed', why: "Her rule 3: label the homozygous recessives first, then work out everyone else from their parents and children." } }] },

{ id: 'mt', t: 'Inheritance pattern of mtDNA', imgs: ['HS2DATA-89012e4998bde900.jpg'], numbering: 'none', fill: 'red', simplified: true,
  legendText: 'Red = has the mother\'s mtDNA (her figure draws it as a red glow and calls it "carrier")', people: `
j        M 1 6.7 - -                -
l        F 1 8.1 a -                -
bride1   F 2 3.8 - -                -
s        M 2 5.2 a j+l              -
bl       F 2 6.5 a j+l              -
y        M 2 8.1 a j+l              -
d        F 2 9.5 a j+l              -
guard    M 2 10.9 - -               -
briefc   M 3 2.6 - -                -
sung     F 3 4.1 - s+bride1         -
greent   M 3 5.1 - s+bride1         -
tophat   M 3 8.3 - -                -
bride2   F 3 9.6 a guard+d          -
pilot    M 3 10.9 a guard+d         -
newsf    F 3 12.2 - -               -
mech     M 4 0.6 - -                -
dark     F 4 2.0 - briefc+sung      -
newsm    M 4 3.2 - briefc+sung      -
paint    M 4 4.7 - briefc+sung      -
tux      M 4 5.7 - -                -
teach    F 4 7.1 a tophat+bride2    -
doc      M 4 8.5 - -                -
writer   F 4 9.9 a tophat+bride2    -
sailor   M 4 11.5 - pilot+newsf     -
nurse    F 4 12.9 - -               -
orange   M 5 1.3 - mech+dark        -
paint2   M 5 6.3 a tux+teach        -
headset  F 5 9.2 a doc+writer       -
grad     M 5 11.9 - sailor+nurse    -
comp     M 5 12.9 - sailor+nurse    -`,
  couples: 'j-l bride1-s d-guard briefc-sung tophat-bride2 pilot-newsf mech-dark tux-teach doc-writer sailor-nurse',
  qs: [{ bank: 'q8cef152617', quiz: '211120', q: 'From the human pedigree chart one can deduce that mitochondrial DNA is passed on from',
    opts: ['Mothers to all their children', 'Mothers to their male children', 'Mothers to their female children', 'Fathers to their female children'],
    key: 'Mothers to all their children', check: { t: 'mt' } }] },

{ id: 'dcd', t: 'Affected father to affected son', imgs: ['HS2DATA-dcd0644e2521ab2d.webp'], numbering: 'none', genLabels: true, fill: 'black', legend: true, people: `
i1   M 1 6.2 - -        -
i2   F 1 7.2 a -        -
ii1  M 2 3.2 - i1+i2    -
ii2  F 2 5.0 a i1+i2    -
ii3  M 2 6.2 - -        -
ii4  F 2 7.2 a i1+i2    -
ii5  F 2 8.7 - i1+i2    -
ii6  M 2 10.5 a i1+i2   -
iii1 M 3 3.1 - -        -
iii2 F 3 4.1 a ii3+ii4  -
iii3 M 3 6.1 - ii3+ii4  -
iii4 M 3 8.2 a ii3+ii4  -
iii5 F 3 9.3 - -        -
iii6 F 3 10.4 - ii3+ii4 -
iv1  M 4 3.1 a iii1+iii2 -
iv2  F 4 4.1 - iii1+iii2 -
iv3  F 4 5.0 - iii1+iii2 -
iv4  M 4 7.0 - iii4+iii5 -
iv5  F 4 8.0 a iii4+iii5 -
iv6  F 4 9.1 - iii4+iii5 -
iv7  M 4 10.2 a iii4+iii5 -`,
  couples: 'i1-i2 ii3-ii4 iii1-iii2 iii4-iii5',
  qs: [{ bank: 'q425d07a7a7', quiz: '211120', q: 'Which assumption about the disease would be accurate?',
    opts: ['Recessive autosomal', 'Dominant autosomal', 'recessive sex linked', 'Dominant sex-linked'], key: 'Dominant autosomal', check: { t: 'mode' } }] },

{ id: 'wt', t: 'The Wellcome Trust chart', imgs: ['HS2DATA-a216dac7295f92aa.jpg'], numbering: 'none', fill: 'salmon', carriersShown: true, carrierStyle: 'dot', legend: true, people: `
w1   M 1 4.2 - -        -
w2   F 1 5.9 c -        -
w3   F 2 1.7 c w1+w2    -
w4   M 2 5.0 a w1+w2    -
w5   M 2 8.4 - w1+w2    -
h3   M 2 0 h -          -
h4   F 2 0 h -          -
h5   F 2 0 h -          -
w6   F 3 1.2 - h3+w3    -
w7   M 3 2.2 a h3+w3    -
w8   F 3 3.6 c w4+h4    -
w9   F 3 4.5 c w4+h4    -
w10  M 3 5.5 - w4+h4    -
w11  M 3 6.4 - w4+h4    -
w13  M 3 7.9 - w5+h5    -
w14  M 3 8.9 - w5+h5    -
h7   F 3 0 h -          -
h8   M 3 0 h -          -
h9   M 3 0 h -          -
w12  F 4 2.2 c w7+h7    -
w15  M 4 3.6 a h8+w8    -
w16  M 4 4.5 a h9+w9    -
w17  M 4 5.5 - h9+w9    -
w18  F 4 6.4 - h9+w9    -`,
  couples: 'w1-w2 w3-h3 w4-h4 w5-h5 w7-h7 w8-h8 w9-h9',
  qs: [{ bank: 'q4fdd32d03f', quiz: '211120', q: 'What pattern of inheritance is shown in this pedigree?',
    opts: ['autosomal dominant', 'sex-linked recessive', 'sex-linked dominant', 'autosomal recessive'], key: 'sex-linked recessive', check: { t: 'mode' } }] },

{ id: 'e5', t: 'E and e', imgs: ['HS2DATA-5ddd418b83d0de94.png'], numbering: 'roman', fill: 'black', people: `
i1   M 1 3.6 - -        1
i2   F 1 5.1 a -        2
ii1  M 2 1.6 - -        1
ii2  F 2 2.9 a i1+i2    2
ii3  M 2 4.3 - i1+i2    3
ii4  M 2 5.9 a i1+i2    4
ii5  F 2 7.1 a -        5
iii1 M 3 1.2 - ii1+ii2  1
iii2 F 3 2.3 - ii1+ii2  2
iii3 M 3 3.4 - ii1+ii2  3
iii4 M 3 5.5 a ii4+ii5  4
iii5 M 3 6.5 a ii4+ii5  5
iii6 F 3 7.5 a ii4+ii5  6`,
  couples: 'i1-i2 ii1-ii2 ii4-ii5',
  qs: [{ bank: 'qfbef5fc57c', quiz: '211120', q: 'What is the genotype of III-1?', opts: ['EE', 'Ee', 'ee', 'E?'], key: 'ee', check: { t: 'geno', who: 'iii1', L: 'E', unk: 'q', assume: 'AD' },
    // Jeremy's ruling, 28 Sep 2026: her key wins on this chart. The engine alone finds autosomal recessive more likely (no skip, and two affected parents with only affected children), so it keys Ee.
    note: "Her key assumes it is dominant: it never skips a generation (her rule 1). Autosomal recessive would also fit this chart, and the tool alone would call it recessive (then III-1 is Ee)." },
  { bank: 'qeff3a0957d', quiz: '211120', q: 'What percentage of the offspring of I-1 and I-2 have a chance of being affected by the disease represented by this pedigree chart?',
    opts: ['0%', '75%', '100%', '50%'], key: '50%', check: { t: 'next', f: 'i1', m: 'i2' } }] },

{ id: 'xs', t: 'The star notation', imgs: ['HS2DATA-5a89ecf60fd237d3.png'], numbering: 'roman', fill: 'black', people: `
i1   M 1 3.6 - -        1
i2   F 1 5.1 a -        2
ii1  M 2 1.7 - -        1
ii2  F 2 3.1 - i1+i2    2
ii3  M 2 4.4 a i1+i2    3
ii4  M 2 5.7 a i1+i2    4
ii5  F 2 7.0 a -        5
iii1 M 3 1.3 - ii1+ii2  1
iii2 F 3 2.4 - ii1+ii2  2
iii3 M 3 3.5 a ii1+ii2  3
iii4 M 3 5.5 a ii4+ii5  4
iii5 M 3 6.4 a ii4+ii5  5
iii6 F 3 7.4 a ii4+ii5  6`,
  couples: 'i1-i2 ii1-ii2 ii4-ii5',
  qs: [{ bank: 'q29ffd86db7', quiz: '211120', q: 'What is the genotype of II-4? (* indicates an affected allele.)', opts: ['X*X', 'X*Y', 'XY', 'E*e', 'EE'], key: 'X*Y',
    check: { t: 'geno', who: 'ii4', x: 'star' } }] },

{ id: 'xld', t: 'X-linked Dominant', imgs: ['HS2DATA-12d9ef788c542acd.png'], numbering: 'running', fill: 'black', title: 'X-linked Dominant', blanksUnder: true,
  shadingMeans: 'dominant-phenotype', people: `
p1  F 1 2.1 a -      1
p2  M 1 3.8 - -      2
p3  M 2 0.8 a p2+p1  3
p4  F 2 2.2 a p2+p1  4
p5  M 2 3.6 - p2+p1  5
p6  F 2 4.9 - p2+p1  6
p7  M 2 6.5 a -      7
p8  F 3 3.3 a p7+p6  8
p9  M 3 4.7 - p7+p6  9
p10 F 3 6.1 a p7+p6  10
p11 M 3 7.3 - p7+p6  11`,
  couples: 'p1-p2 p6-p7',
  qs: [{ bank: 'q97ce02769b', quiz: '211120', q: 'Assuming the dominant phenotype is shaded, what is the genotype of individual 5?', opts: ['XRY', 'XrY', 'XrXr', 'XRXr'], key: 'XrY',
    check: { t: 'geno', who: 'p5', mode: 'XLD', L: 'R', x: 'flat', alsoEngine: true } },
  { bank: 'q6354b1493f', quiz: '211120', q: 'Assuming the dominant phenotype is shaded, what is the genotype of individual 6?', opts: ['XRXr', 'XrY', 'XrXr', 'XRY'], key: 'XrXr',
    check: { t: 'geno', who: 'p6', mode: 'XLD', L: 'R', x: 'flat', alsoEngine: true } }] },

{ id: 'arr', t: 'Autosomal Recessive', imgs: ['HS2DATA-9ca2b27cf0212d5c.png'], numbering: 'running', fill: 'black', title: 'AUTOSOMAL RECESSIVE', blanksUnder: true,
  shadingMeans: 'homozygous-recessive', people: `
p1  M 1 2.3 a -       1
p2  F 1 3.8 - -       2
p3  M 1 6.1 - -       3
p4  F 1 7.7 a -       4
p5  F 2 0.7 a -       5
p6  M 2 1.9 - p1+p2   6
p7  F 2 3.0 - p1+p2   7
p8  F 2 4.1 - p1+p2   8
p9  M 2 5.3 - p3+p4   9
p10 M 2 6.7 a p3+p4   10
p11 F 2 7.8 a -       11
p12 F 2 9.1 - p3+p4   12
p13 M 3 0.7 a p6+p5   13
p14 F 3 2.0 - p6+p5   14
p15 M 3 3.5 - p9+p8   15
p16 F 3 4.5 - p9+p8   16
p17 F 3 5.6 a p9+p8   17
p18 F 3 6.7 a p10+p11 18
p19 M 3 7.8 a p10+p11 19`,
  couples: 'p1-p2 p3-p4 p5-p6 p8-p9 p10-p11',
  qs: [{ bank: 'qa6bc759eb5', quiz: '211120', q: 'Assuming the individuals with homozygous recessive genotypes are shaded, what is the genotype of individual 8?',
    opts: ['rr', 'Rr', 'RR', 'R?'], key: 'Rr', check: { t: 'geno', who: 'p8', mode: 'AR', L: 'R', unk: 'q', alsoEngine: true } }] },

{ id: 'vic', t: "Queen Victoria's family", imgs: ['HS2DATA-7645c8fcb7f6fc24.png'], numbering: 'names', fill: 'red', carriersShown: true, carrierStyle: 'half', people: `
am   F 1 3.1 - -          -
af   M 1 4.8 - -          -
vm   F 1 6.5 - -          -
vf   M 1 8.1 - -          -
ab   M 2 2.9 - af+am      -
alb  M 2 4.9 - af+am      Prince Albert, 1819-1861
qv   F 2 7.3 c vf+vm      Queen Victoria, 1819-1901
k1   F 3 0.7 - alb+qv     Victoria
k2   M 3 1.8 - alb+qv     King Edward VII
k3   F 3 2.9 c alb+qv     Alice
k4   M 3 4.0 - alb+qv     Alfred
k5   F 3 5.1 - alb+qv     Helena
k6   F 3 6.3 - alb+qv     Louise
k7   M 3 7.4 - alb+qv     Arthur
k8   M 3 8.5 a alb+qv     Leopold
k9   F 3 9.6 c alb+qv     Beatrice`,
  couples: 'am-af vm-vf alb=qv', sibs: [['af', 'vm']],
  qs: [{ bank: 'qc5fee1c7ab', quiz: '211120', q: "The condition shown in this genogram is an X-linked recessive hemophilia, occurring in Queen Victoria's offspring. Which of her children had an XhY genotype?",
    opts: ['Alfred', 'Arthur', 'Leopold', 'King Edward'], key: 'Leopold', check: { t: 'whoHas', mode: 'XLR', among: ['k4', 'k7', 'k8', 'k2'], d: 1, sex: 'M' } }] },

{ id: 'p7', t: 'Pedigree 7', imgs: ['HS2DATA-0e0e48c106f76271.gif'], numbering: 'roman', fill: 'blue', caption: 'Pedigree 7. X-linked recessive inheritance.', people: `
i1   M 1 3.9 a -        1
i2   F 1 5.3 - -        2
ii1  M 2 1.0 - -        1
ii2  F 2 2.1 - i1+i2    2
ii3  M 2 3.9 - i1+i2    3
ii4  F 2 4.9 - -        4
ii5  F 2 7.1 - i1+i2    5
ii6  M 2 8.2 - -        6
iii1 F 3 1.0 - ii1+ii2  1
iii2 M 3 2.1 a ii1+ii2  2
iii3 F 3 3.8 - ii3+ii4  3
iii4 M 3 4.8 - ii3+ii4  4
iii5 F 3 7.0 - ii6+ii5  5
iii6 M 3 8.1 - ii6+ii5  6`,
  couples: 'i1-i2 ii1-ii2 ii3-ii4 ii5-ii6',
  qs: [{ bank: 'q59b500675f', quiz: '211120', q: 'Use the pedigree to answer the following question. What gender is the individual II-1?', opts: ['Not enough information given', 'Female', 'Male'], key: 'Male',
    check: { t: 'gender', who: 'ii1' } },
  { bank: 'q0e3117daa9', quiz: '211120', q: 'The pedigree below illustrates a sex-linked recessive trait. What is the phenotype of individual II-2?', opts: ['carrier', 'normal', 'affected'], key: 'normal',
    check: { t: 'pheno', who: 'ii2', mode: 'XLR' } }] },

{ id: 'ad4', t: 'Dominant, three generations', imgs: ['HS2DATA-4ada9cef908a08a8.png'], also: ['../hs2-final/img/slides/Exam-Revison-ppt-for-Hs2-Final-59.jpg'], numbering: 'roman', fill: 'black', people: `
i1   M 1 2.6 - -        1
i2   F 1 4.1 a -        2
ii1  M 2 1.0 - -        1
ii2  F 2 2.5 - i1+i2    2
ii3  M 2 4.1 a i1+i2    3
ii4  F 2 5.5 - -        4
ii5  F 2 6.8 a i1+i2    5
ii6  M 2 8.2 - -        6
iii1 F 3 0.9 - ii1+ii2  1
iii2 F 3 2.6 - ii1+ii2  2
iii3 F 3 3.9 a ii3+ii4  3
iii4 M 3 5.5 a ii3+ii4  4
iii5 M 3 6.7 a ii6+ii5  5
iii6 M 3 8.3 - ii6+ii5  6`,
  couples: 'i1-i2 ii1-ii2 ii3-ii4 ii5-ii6',
  qs: [{ bank: 'q1a71e2abca', quiz: '211120', q: 'Use the pedigree to answer the following question. What is the genotype of individual III-2?', opts: ['Dd', 'dd', 'Not enough information given', 'DD'], key: 'dd',
    check: { t: 'geno', who: 'iii2', L: 'D' } },
  { bank: 'qa2e4edbb5f', quiz: '211120', cloze: true,
    q: 'This condition is [ ] since it occurs in [ ] and [ ] since it affects [ ]. If we use R to represent the dominant allele and r to represent the recessive allele the genotype of the female in generation 1 could be [ ] and that of the male 3 in generation II [ ].',
    blanks: [{ opts: ['Dominant', 'Recessive'], key: 'Dominant', check: { t: 'modeWord' } },
      { opts: ['every generation', 'every second generation'], key: 'every generation', check: { t: 'occurs' } },
      { opts: ['Y-linked', 'X-linked', 'Autosomal'], key: 'Autosomal', check: { t: 'linkWord' } },
      { opts: ['only girls', 'only boys', 'all genders'], key: 'all genders', check: { t: 'affects' } },
      { opts: ['RR= homozygous dominant', 'rr = homozygous recessive', 'Rr = heterozygous'], key: 'Rr = heterozygous', check: { t: 'geno', who: 'i2', L: 'R', prefix: true } },
      { opts: ['RR', 'rr', 'Rr'], key: 'Rr', check: { t: 'geno', who: 'ii3', L: 'R' } }] },
  { src: 'revision-59', q: 'Mode of inheritance? How do you know? Which coloured shape is the bb?', written: ['Dominant.', 'How you know: no evidence of skips.', 'The white ones are bb.'],
    check: { t: 'bbShape', key: 'white' } }] },

{ id: 'c5g', t: 'Five generations, cousins marry', imgs: ['HS2DATA-dec03e5277db4bb9.png', 'HS2DATA-a9b3768ed72a5b87.png'], numbering: 'roman', fill: 'blue', people: `
i1   M 1 2.7 - -         1
i2   F 1 3.7 - -         2
ii1  M 2 1.2 a i1+i2     1
ii2  F 2 2.2 - -         2
ii3  F 2 3.2 - i1+i2     3
ii4  F 2 4.2 - i1+i2     4
ii5  M 2 5.1 - i1+i2     5
ii6  F 2 6.1 - -         6
iii1 F 3 1.2 - ii1+ii2   1
iii2 M 3 2.2 - ii1+ii2   2
iii3 F 3 3.2 - -         3
iii4 M 3 4.2 - -         4
iii5 F 3 5.1 - ii5+ii6   5
iii6 M 3 6.1 - ii5+ii6   6
iv1  M 4 2.7 - iii2+iii3 1
iv2  F 4 4.7 - iii4+iii5 2
v1   F 5 3.7 a iv1+iv2   1`,
  couples: 'i1-i2 ii1-ii2 ii5-ii6 iii2-iii3 iii4-iii5 iv1=iv2',
  qs: [{ bank: 'q02e40ed1d9', quiz: '211120', q: 'Use the pedigree to answer the following question. What is the genotype of individual II-1?', opts: ['Bb', 'Not enough information given', 'bb', 'BB'], key: 'bb', check: { t: 'geno', who: 'ii1', L: 'B' } },
  { bank: 'q274277f374', quiz: '211120', q: 'Use the pedigree to answer the following question. What is the genotype of individual IV-2?', opts: ['Not enough information given', 'BB', 'bb', 'Bb'], key: 'Bb', check: { t: 'geno', who: 'iv2', L: 'B' } },
  { bank: 'qffa391d120', quiz: '211120', q: 'Use the pedigree to answer the following question. What gender is the individual III-4?', opts: ['Not enough information given', 'Female', 'Male'], key: 'Male', check: { t: 'gender', who: 'iii4' } },
  { bank: 'qbcdb578005', quiz: '211120', q: 'Use the pedigree to answer the following question. What gender is the individual II-4?', opts: ['Female', 'Male', 'Not enough information given'], key: 'Female', check: { t: 'gender', who: 'ii4' } },
  { bank: 'qf7a1926168', quiz: '211120', q: 'Use the pedigree to answer the following question. What is the genotype of individual I-2?', opts: ['aa', 'Aa', 'Not enough information is given', 'AA'], key: 'Aa', check: { t: 'geno', who: 'i2', L: 'A' } },
  { bank: 'q1dd7553eef', quiz: '211120', q: 'Use the pedigree to answer the following question. What is the genotype of individual I-1?', opts: ['aa', 'Aa', 'AA', 'Not enough information given'], key: 'Aa', check: { t: 'geno', who: 'i1', L: 'A' } }] },

{ id: 'aa3', t: 'Probably dominant', imgs: ['HS2DATA-aa3f43379be596cb.png'], numbering: 'none', genLabels: true, genWord: true, fill: 'black', people: `
i1   F 1 3.2 - -        -
i2   M 1 4.5 a -        -
ii1  M 2 2.6 a i2+i1    -
ii2  F 2 3.7 a i2+i1    -
ii3  F 2 4.7 a i2+i1    -
ii4  M 2 6.2 - -        -
iii1 F 3 3.9 a ii4+ii3  -
iii2 M 3 5.0 a ii4+ii3  -
iii3 M 3 6.0 - ii4+ii3  -
iii4 M 3 7.0 a ii4+ii3  -
iii5 M 3 8.1 - ii4+ii3  -`,
  couples: 'i1-i2 ii3-ii4',
  qs: [{ bank: 'q7682f4e1b2', quiz: '211120', q: 'The trait affecting the people in this pedigree chart is probably:',
    opts: ['autosomal recessive', 'sex-linked dominant', 'autosomal dominant', 'sex-linked recessive'], key: 'autosomal dominant', check: { t: 'mode', probably: true } }] },

{ id: 'yl', t: 'Y-linked', imgs: ['HS2DATA-a2ec08e5d146a65a.jpg'], numbering: 'roman', fill: 'black', unaffFill: 'grey', people: `
i1    M 1 4.6 a -          1
i2    F 1 5.8 - -          2
i3    F 1 8.1 - -          3
i4    M 1 9.1 a -          4
ii1   F 2 2.8 - -          1
ii2   M 2 3.9 a i1+i2      2
ii3   F 2 6.5 - i1+i2      3
ii4   M 2 7.5 a i4+i3      4
ii5   M 2 8.5 a i4+i3      5
ii6   F 2 9.6 - i4+i3      6
ii7   M 2 10.6 - -         7
iii1  M 3 1.7 - -          1
iii2  F 3 2.7 - ii2+ii1    2
iii3  M 3 3.4 a ii2+ii1    3
iii4  M 3 4.4 a ii2+ii1    4
iii5  M 3 5.4 a ii4+ii3    5
iii6  F 3 6.5 - ii4+ii3    6
iii7  M 3 7.5 a ii4+ii3    7
iii8  M 3 8.5 a ii4+ii3    8
iii9  F 3 9.6 - ii7+ii6    9
iii10 M 3 10.6 - ii7+ii6   10
iii11 F 3 11.7 - -         11
iv1   M 4 1.7 - iii1+iii2  1
iv2   M 4 8.5 a iii8+iii9  2
iv3   F 4 10.6 - iii10+iii11 3
iv4   F 4 11.6 - iii10+iii11 4
iv5   F 4 12.7 - iii10+iii11 5`,
  couples: 'i1-i2 i3-i4 ii1-ii2 ii3-ii4 ii6-ii7 iii1-iii2 iii8-iii9 iii10-iii11',
  qs: [{ bank: 'qf2bb3de90f', quiz: '211120', cloze: true, q: 'This condition is [ ] since it occurs in [ ] and [ ] since it affects [ ].',
    blanks: [{ opts: ['Y-linked', 'autosomal recessive', 'autosomal dominant', 'X-linked'], key: 'Y-linked', check: { t: 'modeWord' } },
      { opts: ['males in every second generation', 'random genders in every generation', 'random genders in every second generation', 'males in every generation'], key: 'males in every generation', check: { t: 'occurs' } },
      { opts: ['autosomal', 'mitochondrial', 'sex-linked'], key: 'sex-linked', check: { t: 'linkWord' } },
      { opts: ['only males', 'all genders equally', 'only females', 'mainly males'], key: 'only males', check: { t: 'affects' } }] }] },

{ id: 'rulesD', t: 'Her rules figure: dominant', part: 'rules', imgs: ['HS2DATA-7366599b88d81789.jpg'], numbering: 'none', fill: 'black', caption: 'Dominant trait', people: `
m1 F 1 1.3 a -     -
m2 M 1 3.6 a -     -
k1 M 2 1.6 a m2+m1 -
k2 F 2 3.7 - m2+m1 -`,
  couples: 'm1-m2',
  qs: [{ bank: 'qd5ae970dc8', quiz: '211120', cloze: true, q: 'This condition is [ ] since it occurs in [ ] and [ ] since it affects [ ].',
    blanks: [{ opts: ['recessive', 'dominant'], key: 'dominant', check: { t: 'modeWord' } },
      { opts: ['every generation', 'every second generation'], key: 'every generation', check: { t: 'occurs' } },
      { opts: ['autosomal', 'sex-linked'], key: 'autosomal', check: { t: 'linkWord' } },
      { opts: ['one gender much more than another', 'both genders'], key: 'both genders', check: { t: 'affects' } }] }] },
{ id: 'rulesR', t: 'Her rules figure: recessive', part: 'rules', imgs: ['HS2DATA-7366599b88d81789.jpg'], numbering: 'none', fill: 'black', caption: 'Recessive trait', people: `
m1 F 1 1.3 - -     -
m2 M 1 3.3 - -     -
k1 M 2 1.3 - m2+m1 -
k2 F 2 3.4 a m2+m1 -`,
  couples: 'm1-m2', qs: [] },

{ id: 'hd', t: "Huntington's disease", imgs: ['HS2DATA-3fc4eb2aad5bc24e.png'], numbering: 'roman', fill: 'black', title: "Pedigree Analysis for Huntington's disease:", people: `
i1   M 1 6.8 a -        1
i2   F 1 7.8 - -        2
ii1  M 2 2.4 a -        1
ii2  F 2 3.4 - i1+i2    2
ii3  M 2 4.9 - i1+i2    3
ii4  M 2 6.8 a i1+i2    4
ii5  F 2 7.8 - -        5
ii6  F 2 8.9 a i1+i2    6
ii7  F 2 10.2 - i1+i2   7
ii8  M 2 11.4 a i1+i2   8
iii1 M 3 2.0 - ii1+ii2  1
iii2 F 3 2.9 - ii1+ii2  2
iii3 F 3 3.8 a ii1+ii2  3
iii4 F 3 6.9 a ii4+ii5  4
iii5 M 3 7.8 a ii4+ii5  5`,
  couples: 'i1-i2 ii1-ii2 ii4-ii5',
  qs: [{ bank: 'q3eb5f72a2f', quiz: '211014', cloze: true,
    q: "1. I-1 and I-2 had [ ] children. [ ] of their children were affected by Huntington's disease. [ ] of their female offspring, in the generations shown in the pedigree chart, were affected by the disease. 2. II-4 and II-5 had ___daughters and ___ sons [ ]. 3. Individuals II-1 and II-2 are [ ] and individuals II-2 and II-3 are [ ] 4. Huntington's disease, a mutation of Chromosome 4, is a [ ] trait. The best way to confirm this is to check whether [ ]. 5. The genotypes: I-1 [ ] I-2 [ ] II-1 [ ] II-2 [ ] II-3 [ ] III-4 [ ]",
    blanks: [{ opts: ['6', '8', '3', '4'], key: '6', check: { t: 'kids', f: 'i1', m: 'i2' } },
      { opts: ['50%', '75%', '25%', '100%'], key: '50%', check: { t: 'pctAff', f: 'i1', m: 'i2' } },
      { opts: ['3/7', 'no correct answer given', '50%', '100%'], key: '50%', check: { t: 'pctFemDesc', f: 'i1', m: 'i2' } },
      { opts: ['2 and 0', '0 and 1', '1 and 1'], key: '1 and 1', check: { t: 'dauSons', f: 'ii4', m: 'ii5' } },
      { opts: ['siblings', 'third cousins', 'an infertile couple', 'a couple that reproduces'], key: 'a couple that reproduces', check: { t: 'rel', a: 'ii1', b: 'ii2' } },
      { opts: ['a sister and brother in law', 'a reproducing couple', 'siblings', 'cousins'], key: 'siblings', check: { t: 'rel', a: 'ii2', b: 'ii3' } },
      { opts: ['X-linked recessive', 'autosomal dominant', 'X-linked dominant', 'autosomal recessive'], key: 'autosomal dominant', check: { t: 'mode' } },
      { opts: ['any affected individuals have unaffected parents- that would make the trait dominant', 'any affected individuals have unaffected parents- that would make the trait recessive'],
        key: 'any affected individuals have unaffected parents- that would make the trait recessive', check: { t: 'fixed', why: 'Her rule 1: an affected child of two unaffected parents means it skipped, so it would be recessive.' } },
      { opts: ['Hh', 'HH', 'hh'], key: 'Hh', check: { t: 'geno', who: 'i1', L: 'H' } },
      { opts: ['HH', 'hh', 'Hh'], key: 'hh', check: { t: 'geno', who: 'i2', L: 'H' } },
      { opts: ['hh', 'HH', 'Hh'], key: 'Hh', check: { t: 'geno', who: 'ii1', L: 'H' } },
      { opts: ['HH', 'hh', 'Hh'], key: 'hh', check: { t: 'geno', who: 'ii2', L: 'H' } },
      { opts: ['hh', 'HH', 'Hh'], key: 'hh', check: { t: 'geno', who: 'ii3', L: 'H' } },
      { opts: ['hh', 'Hh', 'HH'], key: 'Hh', check: { t: 'geno', who: 'iii4', L: 'H' } }] }] },

{ id: 'saq', t: 'Her written SAQ chart', imgs: ['HS2DATA-72f76aea0493bb6b.jpg'], numbering: 'none', fill: 'grey', sexOutline: true, legend: true, people: `
dad  M 1 6.5 a -        -
mum  F 1 7.9 - -        -
c1   F 2 3.3 a dad+mum  -
s1   M 2 4.3 - -        -
c2   M 2 5.6 - dad+mum  -
c3   F 2 6.9 a dad+mum  -
c4   M 2 8.4 - dad+mum  -
s4   F 2 9.5 - -        -
c5   M 2 10.5 a dad+mum -
s5   F 2 11.5 - -       -
g1   F 3 1.4 - s1+c1    -
g2   M 3 2.4 - s1+c1    -
g3   F 3 3.3 a s1+c1    -
g4   M 3 4.3 a s1+c1    -
g5   F 3 6.3 - c4+s4    -
g6   M 3 7.3 - c4+s4    -
g7   F 3 8.3 - c4+s4    -
g8   F 3 9.3 - c4+s4    -
g9   F 3 10.5 a c5+s5   -
g10  M 3 11.5 - c5+s5   -
g11  F 3 12.5 - c5+s5   -
g12  M 3 13.5 a c5+s5   -`,
  couples: 'dad-mum c1-s1 c4-s4 c5-s5',
  qs: [{ bank: 'q7baff97fb9', quiz: '211104',
    // her model answer, word for word (hs2-test3/content/her-answers.json, key "look at the following pedigree chart")
    written: ['This is an autosomal dominant disease.', "We know it is dominant as we see it present in each generation and we don't see it skipping generations.",
      "We know it's likely autosomal as we see it in both sexes relatively equally, and we also see that a father with the disease has passed it onto his son.",
      'The Dad must be Bb, as he has the disease, but some of his children do not, so he must be able to pass a recessive, non diseased allele to those children.',
      'The mum does not have the disease, and so she must be a homozygous recessive bb', 'We can do a punnet square', 'B b', 'b Bb bb', 'b Bb bb',
      'which shows that if they have another child, there is a 50% chance they would inherit the disease from their dad.'],
    q: 'Look at the following pedigree chart. 1. What is the mode of inheritance? 2. How can you tell? 3. What are the genotypes of the parents at the top of the chart? 4. What is the chance of those parents having another child with the disease if they had another child?',
    check: { t: 'saq', mode: 'AD', dad: 'Bb', mum: 'bb', pct: '50%', L: 'B' } }] },

{ id: 's79', t: 'Revision slide 79', imgs: [], also: ['../hs2-final/img/slides/Exam-Revison-ppt-for-Hs2-Final-79.jpg'], numbering: 'none', fill: 'black', people: `
l1 F 1 3.1 - -     -
l2 M 1 4.7 a -     -
r1 F 1 6.4 - -     -
r2 M 1 8.0 - -     -
x1 F 2 2.6 - l2+l1 -
x2 F 2 3.8 - l2+l1 -
m1 M 2 5.0 - l2+l1 -
f1 F 2 6.6 - r2+r1 -
x3 F 2 7.8 a r2+r1 -
x4 M 2 8.9 a r2+r1 -
x5 M 2 10.1 - r2+r1 -
y1 F 3 5.2 - m1+f1 -
y2 F 3 6.4 a m1+f1 -`,
  couples: 'l1-l2 r1-r2 m1-f1',
  qs: [{ src: 'revision-79', q: 'Mode of inheritance? How do you know? Which coloured shape is the bb?',
    written: ['Autosomal recessive.', 'How you know: it skips a generation — two parents without the disease have a child that does.', 'The black / filled-in ones are bb.'],
    check: { t: 'mode', opts: ['autosomal dominant', 'autosomal recessive', 'sex-linked dominant', 'sex-linked recessive'], key: 'autosomal recessive', bb: 'black' } }] }
];
if (typeof module !== 'undefined' && module.exports) module.exports = HER; else root.HER = HER;
})(typeof window !== 'undefined' ? window : globalThis);
