// ============================================================
// DSE P&C + Probability Math Engine
// Covers: Permutation, Combination, Circular, Probability,
//         Bayes Theorem, Random Practice Questions
// All results are exact integers / fractions
// ============================================================

// ── Factorial ──────────────────────────────────────────────
export function factorial(n: number): number {
  if (n < 0) throw new Error('n must be >= 0');
  if (n === 0 || n === 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ── GCD / Fraction simplification ─────────────────────────
export function gcd(a: number, b: number): number {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

export interface Fraction { num: number; den: number; }

export function simplify(num: number, den: number): Fraction {
  if (den === 0) throw new Error('Denominator cannot be 0');
  const g = gcd(Math.abs(num), Math.abs(den));
  const sign = den < 0 ? -1 : 1;
  return { num: sign * num / g, den: sign * den / g };
}

export function fracToLatex(f: Fraction): string {
  if (f.den === 1) return String(f.num);
  return `\\dfrac{${f.num}}{${f.den}}`;
}

export function fracToDecimal(f: Fraction): string {
  return (f.num / f.den).toFixed(4).replace(/\.?0+$/, '');
}

// ── P&C Core ───────────────────────────────────────────────
export interface PCResult {
  value: number;
  latex: string;
  steps: string[];
}

/** P(n,r) = n! / (n-r)! */
export function permutation(n: number, r: number): PCResult {
  if (r > n) throw new Error('r cannot exceed n');
  const val = factorial(n) / factorial(n - r);
  const steps: string[] = [
    `\\displaystyle P^{${n}}_{${r}} = \\frac{${n}!}{(${n}-${r})!} = \\frac{${n}!}{${n - r}!}`,
    `\\displaystyle = \\frac{${factorial(n).toLocaleString()}}{${factorial(n - r).toLocaleString()}} = ${val.toLocaleString()}`,
  ];
  return {
    value: val,
    latex: `P^{${n}}_{${r}} = ${val.toLocaleString()}`,
    steps,
  };
}

/** C(n,r) = n! / (r!(n-r)!) */
export function combination(n: number, r: number): PCResult {
  if (r > n) throw new Error('r cannot exceed n');
  const val = factorial(n) / (factorial(r) * factorial(n - r));
  const steps: string[] = [
    `\\displaystyle C^{${n}}_{${r}} = \\binom{${n}}{${r}} = \\frac{${n}!}{${r}! \\cdot (${n}-${r})!}`,
    `\\displaystyle = \\frac{${factorial(n).toLocaleString()}}{${factorial(r).toLocaleString()} \\times ${factorial(n - r).toLocaleString()}} = ${val.toLocaleString()}`,
  ];
  return {
    value: val,
    latex: `C^{${n}}_{${r}} = ${val.toLocaleString()}`,
    steps,
  };
}

/** Circular permutation: (n-1)! */
export function circularPermutation(n: number): PCResult {
  const val = factorial(n - 1);
  const steps: string[] = [
    `\\displaystyle \\text{Circular}(${n}) = (${n}-1)! = ${n - 1}!`,
    `\\displaystyle = ${val.toLocaleString()}`,
  ];
  return {
    value: val,
    latex: `(${n}-1)! = ${val.toLocaleString()}`,
    steps,
  };
}

/** Circular permutation with identical items: (n-1)! / k! */
export function circularWithIdentical(n: number, k: number): PCResult {
  if (k > n) throw new Error('k cannot exceed n');
  const val = factorial(n - 1) / factorial(k);
  const steps: string[] = [
    `\\displaystyle \\frac{(${n}-1)!}{${k}!} = \\frac{${n - 1}!}{${k}!}`,
    `\\displaystyle = \\frac{${factorial(n - 1).toLocaleString()}}{${factorial(k).toLocaleString()}} = ${val.toLocaleString()}`,
  ];
  return {
    value: val,
    latex: `\\frac{(${n}-1)!}{${k}!} = ${val.toLocaleString()}`,
    steps,
  };
}

// ── Probability ────────────────────────────────────────────
export interface ProbResult {
  fraction: Fraction;
  latex: string;
  steps: string[];
  decimal: string;
}

/** Simple probability: favourable / total */
export function simpleProbability(favourable: number, total: number): ProbResult {
  const f = simplify(favourable, total);
  const steps: string[] = [
    `\\displaystyle P = \\frac{\\text{favourable}}{\\text{total}} = \\frac{${favourable}}{${total}}`,
    f.den !== 1
      ? `\\displaystyle = \\frac{${f.num}}{${f.den}}`
      : `\\displaystyle = ${f.num}`,
  ];
  return {
    fraction: f,
    latex: `P = ${fracToLatex(f)}`,
    steps,
    decimal: fracToDecimal(f),
  };
}

/** Combination-based probability: C(a,x)*C(b,y) / C(n,r) */
export function combinationProbability(
  n: number, r: number,
  a: number, x: number,
  b: number, y: number,
): ProbResult {
  if (x + y !== r) throw new Error('x + y must equal r');
  const num = combination(a, x).value * combination(b, y).value;
  const den = combination(n, r).value;
  const f = simplify(num, den);
  const steps: string[] = [
    `\\displaystyle P = \\frac{C^{${a}}_{${x}} \\times C^{${b}}_{${y}}}{C^{${n}}_{${r}}}`,
    `\\displaystyle = \\frac{${combination(a, x).value.toLocaleString()} \\times ${combination(b, y).value.toLocaleString()}}{${den.toLocaleString()}}`,
    `\\displaystyle = \\frac{${num.toLocaleString()}}{${den.toLocaleString()}} = ${fracToLatex(f)}`,
  ];
  return {
    fraction: f,
    latex: `P = ${fracToLatex(f)}`,
    steps,
    decimal: fracToDecimal(f),
  };
}

// ── Bayes Theorem ──────────────────────────────────────────
export interface BayesResult {
  pAgivenB: Fraction;
  pB: Fraction;
  latex: string;
  steps: string[];
  decimal: string;
  treeData: BayesTreeNode[];
}

export interface BayesTreeNode {
  label: string;
  prob: Fraction;
  children?: BayesTreeNode[];
}

/**
 * Bayes: P(A|B) = P(B|A)*P(A) / [P(B|A)*P(A) + P(B|A')*P(A')]
 * All inputs as [numerator, denominator]
 */
export function bayesTheorem(
  pA: [number, number],       // P(A)
  pBgivenA: [number, number], // P(B|A)
  pBgivenAc: [number, number], // P(B|A')
): BayesResult {
  const pAf = simplify(pA[0], pA[1]);
  const pAcf = simplify(pA[1] - pA[0], pA[1]);
  const pBgAf = simplify(pBgivenA[0], pBgivenA[1]);
  const pBgAcf = simplify(pBgivenAc[0], pBgivenAc[1]);

  // P(B∩A) = P(B|A)*P(A)
  const pBAnum = pBgAf.num * pAf.num;
  const pBAden = pBgAf.den * pAf.den;
  const pBA = simplify(pBAnum, pBAden);

  // P(B∩A') = P(B|A')*P(A')
  const pBAcnum = pBgAcf.num * pAcf.num;
  const pBAcden = pBgAcf.den * pAcf.den;
  const pBAc = simplify(pBAcnum, pBAcden);

  // P(B) = P(B∩A) + P(B∩A')
  const pBnum = pBA.num * pBAc.den + pBAc.num * pBA.den;
  const pBden = pBA.den * pBAc.den;
  const pBf = simplify(pBnum, pBden);

  // P(A|B) = P(B∩A) / P(B)
  const pAgBnum = pBA.num * pBf.den;
  const pAgBden = pBA.den * pBf.num;
  const pAgBf = simplify(pAgBnum, pAgBden);

  const steps: string[] = [
    `\\displaystyle P(A) = ${fracToLatex(pAf)}, \\quad P(A') = ${fracToLatex(pAcf)}`,
    `\\displaystyle P(B \\mid A) = ${fracToLatex(pBgAf)}, \\quad P(B \\mid A') = ${fracToLatex(pBgAcf)}`,
    `\\displaystyle P(B \\cap A) = P(B \\mid A) \\cdot P(A) = ${fracToLatex(pBgAf)} \\times ${fracToLatex(pAf)} = ${fracToLatex(pBA)}`,
    `\\displaystyle P(B \\cap A') = P(B \\mid A') \\cdot P(A') = ${fracToLatex(pBgAcf)} \\times ${fracToLatex(pAcf)} = ${fracToLatex(pBAc)}`,
    `\\displaystyle P(B) = P(B \\cap A) + P(B \\cap A') = ${fracToLatex(pBA)} + ${fracToLatex(pBAc)} = ${fracToLatex(pBf)}`,
    `\\displaystyle P(A \\mid B) = \\frac{P(B \\cap A)}{P(B)} = \\frac{${fracToLatex(pBA)}}{${fracToLatex(pBf)}} = ${fracToLatex(pAgBf)}`,
  ];

  const treeData: BayesTreeNode[] = [
    {
      label: 'Start',
      prob: simplify(1, 1),
      children: [
        {
          label: 'A',
          prob: pAf,
          children: [
            { label: 'B', prob: pBgAf },
            { label: "B'", prob: simplify(pBgivenA[1] - pBgivenA[0], pBgivenA[1]) },
          ],
        },
        {
          label: "A'",
          prob: pAcf,
          children: [
            { label: 'B', prob: pBgAcf },
            { label: "B'", prob: simplify(pBgivenAc[1] - pBgivenAc[0], pBgivenAc[1]) },
          ],
        },
      ],
    },
  ];

  return {
    pAgivenB: pAgBf,
    pB: pBf,
    latex: `P(A \\mid B) = ${fracToLatex(pAgBf)}`,
    steps,
    decimal: fracToDecimal(pAgBf),
    treeData,
  };
}

// ── Random Practice Questions ──────────────────────────────
export type QuestionType = 'permutation' | 'combination' | 'circular' | 'probability' | 'bayes';

export interface PracticeQuestion {
  type: QuestionType;
  textZh: string;
  textEn: string;
  answer: number | Fraction;
  answerLatex: string;
  steps: string[];
  hint: string;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const PEOPLE_ZH = ['學生', '男生', '女生', '運動員', '歌手', '演員'];
const PEOPLE_EN = ['students', 'boys', 'girls', 'athletes', 'singers', 'actors'];
const OBJECTS_ZH = ['書', '球', '卡', '珠', '獎盃', '旗'];
const OBJECTS_EN = ['books', 'balls', 'cards', 'beads', 'trophies', 'flags'];
const COLORS_ZH = ['紅', '藍', '綠', '黃', '白'];
const COLORS_EN = ['red', 'blue', 'green', 'yellow', 'white'];

export function generateQuestion(type: QuestionType): PracticeQuestion {
  switch (type) {
    case 'permutation': {
      const n = randInt(5, 10);
      const r = randInt(2, Math.min(n, 5));
      const obj = randInt(0, PEOPLE_ZH.length - 1);
      const res = permutation(n, r);
      return {
        type,
        textZh: `從 ${n} 位${PEOPLE_ZH[obj]}中，選出 ${r} 位排成一排，共有多少種排法？`,
        textEn: `In how many ways can ${r} ${PEOPLE_EN[obj]} be arranged in a row from a group of ${n}?`,
        answer: res.value,
        answerLatex: `P^{${n}}_{${r}} = ${res.value.toLocaleString()}`,
        steps: res.steps,
        hint: `\\displaystyle P^{n}_{r} = \\frac{n!}{(n-r)!}`,
      };
    }
    case 'combination': {
      const n = randInt(5, 12);
      const r = randInt(2, Math.min(n - 1, 5));
      const obj = randInt(0, OBJECTS_ZH.length - 1);
      const res = combination(n, r);
      return {
        type,
        textZh: `從 ${n} 件${OBJECTS_ZH[obj]}中，選出 ${r} 件，共有多少種選法？`,
        textEn: `In how many ways can ${r} ${OBJECTS_EN[obj]} be chosen from ${n}?`,
        answer: res.value,
        answerLatex: `C^{${n}}_{${r}} = ${res.value.toLocaleString()}`,
        steps: res.steps,
        hint: `\\displaystyle C^{n}_{r} = \\frac{n!}{r!(n-r)!}`,
      };
    }
    case 'circular': {
      const n = randInt(4, 8);
      const res = circularPermutation(n);
      const obj = randInt(0, PEOPLE_ZH.length - 1);
      return {
        type,
        textZh: `${n} 位${PEOPLE_ZH[obj]}圍坐一圓桌，共有多少種坐法？`,
        textEn: `In how many ways can ${n} ${PEOPLE_EN[obj]} be seated around a circular table?`,
        answer: res.value,
        answerLatex: `(${n}-1)! = ${res.value.toLocaleString()}`,
        steps: res.steps,
        hint: `\\displaystyle (n-1)!`,
      };
    }
    case 'probability': {
      // Bag with colored balls
      const colors = randInt(2, 3);
      const counts: number[] = [];
      for (let i = 0; i < colors; i++) counts.push(randInt(2, 6));
      const total = counts.reduce((a, b) => a + b, 0);
      const r = randInt(2, Math.min(3, total - 1));
      const target = randInt(0, colors - 1);
      const targetCount = counts[target];
      const otherCount = total - targetCount;
      // P(exactly 1 target in r draws) = C(target,1)*C(other,r-1)/C(total,r)
      if (targetCount < 1 || otherCount < r - 1) {
        // fallback to simple
        const fav = randInt(1, total - 1);
        const res = simpleProbability(fav, total);
        return {
          type,
          textZh: `袋中有 ${total} 個球，其中 ${fav} 個為紅球，隨機取一球，求取得紅球的概率。`,
          textEn: `A bag contains ${total} balls, of which ${fav} are red. A ball is drawn at random. Find the probability of drawing a red ball.`,
          answer: res.fraction,
          answerLatex: `P = ${fracToLatex(res.fraction)}`,
          steps: res.steps,
          hint: `\\displaystyle P = \\frac{\\text{有利結果數}}{\\text{總結果數}}`,
        };
      }
      const res = combinationProbability(total, r, targetCount, 1, otherCount, r - 1);
      const colorName = COLORS_ZH[target % COLORS_ZH.length];
      const colorNameEn = COLORS_EN[target % COLORS_EN.length];
      const countDesc = counts.map((c, i) => `${c} 個${COLORS_ZH[i % COLORS_ZH.length]}球`).join('、');
      const countDescEn = counts.map((c, i) => `${c} ${COLORS_EN[i % COLORS_EN.length]}`).join(', ');
      return {
        type,
        textZh: `袋中有${countDesc}，共 ${total} 個。隨機取出 ${r} 個，求恰好有 1 個${colorName}球的概率。`,
        textEn: `A bag contains ${countDescEn} balls (total ${total}). ${r} balls are drawn at random. Find the probability of getting exactly 1 ${colorNameEn} ball.`,
        answer: res.fraction,
        answerLatex: `P = ${fracToLatex(res.fraction)}`,
        steps: res.steps,
        hint: `\\displaystyle P = \\frac{C^{${targetCount}}_{1} \\times C^{${otherCount}}_{${r - 1}}}{C^{${total}}_{${r}}}`,
      };
    }
    case 'bayes': {
      // Disease test scenario
      const prev = randInt(1, 5); // prevalence %
      const sens = randInt(85, 99); // sensitivity %
      const spec = randInt(80, 98); // specificity %
      const fp = 100 - spec;
      const res = bayesTheorem([prev, 100], [sens, 100], [fp, 100]);
      return {
        type,
        textZh: `某疾病的患病率為 ${prev}%。某測試對患者的陽性率（靈敏度）為 ${sens}%，對非患者的陽性率（假陽性率）為 ${fp}%。若某人測試結果為陽性，求他確實患病的概率。`,
        textEn: `A disease has a prevalence of ${prev}%. A test has sensitivity ${sens}% (true positive rate) and false positive rate ${fp}%. If a person tests positive, find the probability they actually have the disease.`,
        answer: res.pAgivenB,
        answerLatex: `P(\\text{病} \\mid +) = ${fracToLatex(res.pAgivenB)}`,
        steps: res.steps,
        hint: `\\displaystyle P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B)}`,
      };
    }
  }
}

// ============================================================
// Flexible Expression Engine
// Supports: n!, P(n,r), C(n,r) and mixed products of these
// Used by: ProbabilityPage comb mode, PCPage
// ============================================================

/** A single term in a flexible expression */
export type TermType = 'factorial' | 'permutation' | 'combination';

export interface ExprTerm {
  type: TermType;
  n: number;
  r?: number; // required for permutation and combination
}

/** Evaluate a single term to its numeric value */
export function evalTerm(t: ExprTerm): number {
  switch (t.type) {
    case 'factorial':
      return factorial(t.n);
    case 'permutation': {
      const r = t.r ?? 0;
      if (r > t.n) throw new Error(`P(${t.n},${r}): r cannot exceed n`);
      return factorial(t.n) / factorial(t.n - r);
    }
    case 'combination': {
      const r = t.r ?? 0;
      if (r > t.n) throw new Error(`C(${t.n},${r}): r cannot exceed n`);
      return factorial(t.n) / (factorial(r) * factorial(t.n - r));
    }
  }
}

/** Render a single term as LaTeX */
export function termToLatex(t: ExprTerm): string {
  switch (t.type) {
    case 'factorial':
      return `${t.n}!`;
    case 'permutation':
      return `P^{${t.n}}_{${t.r ?? 0}}`;
    case 'combination':
      return `C^{${t.n}}_{${t.r ?? 0}}`;
  }
}

/** Evaluate a product of terms (numerator or denominator) */
export function evalTermList(terms: ExprTerm[]): number {
  if (terms.length === 0) return 1;
  return terms.reduce((acc, t) => acc * evalTerm(t), 1);
}

/** Render a product of terms as LaTeX (joined by x) */
export function termListToLatex(terms: ExprTerm[]): string {
  if (terms.length === 0) return '1';
  return terms.map(termToLatex).join(' \\times ');
}

/**
 * Flexible P&C probability:
 *   P = (product of numerator terms) / (product of denominator terms)
 * Returns full ProbResult with step-by-step LaTeX derivation.
 */
export function flexibleProbability(
  numeratorTerms: ExprTerm[],
  denominatorTerms: ExprTerm[],
): ProbResult {
  const numVal = evalTermList(numeratorTerms);
  const denVal = evalTermList(denominatorTerms);
  if (denVal === 0) throw new Error('Denominator evaluates to 0');
  const f = simplify(numVal, denVal);

  const numLatex = termListToLatex(numeratorTerms);
  const denLatex = termListToLatex(denominatorTerms);

  const numExpanded = numeratorTerms.map(t => evalTerm(t).toLocaleString()).join(' \\times ');
  const denExpanded = denominatorTerms.map(t => evalTerm(t).toLocaleString()).join(' \\times ');

  const steps: string[] = [
    `\\displaystyle P = \\frac{${numLatex}}{${denLatex}}`,
    `\\displaystyle = \\frac{${numExpanded}}{${denExpanded}}`,
    `\\displaystyle = \\frac{${numVal.toLocaleString()}}{${denVal.toLocaleString()}} = ${fracToLatex(f)}`,
  ];

  return {
    fraction: f,
    latex: `P = ${fracToLatex(f)}`,
    steps,
    decimal: fracToDecimal(f),
  };
}

/**
 * Flexible P&C count (for PCPage):
 *   result = (product of numerator terms) / (product of denominator terms)
 * Returns value + LaTeX steps.
 */
export function flexibleCount(
  numeratorTerms: ExprTerm[],
  denominatorTerms: ExprTerm[],
): { value: number; latex: string; steps: string[] } {
  const numVal = evalTermList(numeratorTerms);
  const denVal = denominatorTerms.length > 0 ? evalTermList(denominatorTerms) : 1;
  if (denVal === 0) throw new Error('Denominator evaluates to 0');
  const value = numVal / denVal;

  const numLatex = termListToLatex(numeratorTerms);
  const denLatex = denominatorTerms.length > 0 ? termListToLatex(denominatorTerms) : '';

  const numExpanded = numeratorTerms.map(t => evalTerm(t).toLocaleString()).join(' \\times ');
  const denExpanded = denominatorTerms.map(t => evalTerm(t).toLocaleString()).join(' \\times ');

  const fracLatex = denLatex
    ? `\\dfrac{${numLatex}}{${denLatex}}`
    : numLatex;
  const fracExpanded = denLatex
    ? `\\dfrac{${numExpanded}}{${denExpanded}}`
    : numExpanded;

  const steps: string[] = [
    `\\displaystyle ${fracLatex}`,
    `\\displaystyle = ${fracExpanded}`,
    `\\displaystyle = ${value.toLocaleString()}`,
  ];

  return {
    value,
    latex: `${fracLatex} = ${value.toLocaleString()}`,
    steps,
  };
}
