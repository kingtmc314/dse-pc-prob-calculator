// ============================================================
// Formulas Page – DSE P&C + Probability Formula Reference
// All formulas in LaTeX displaystyle
// Portal buttons jump to calculator with pre-filled values
// Design: Dark Academic / Chalkboard
// ============================================================

import { useLang } from '../contexts/LangContext';
import KatexRenderer from '../components/KatexRenderer';

interface FormulaCard {
  titleZh: string;
  titleEn: string;
  latex: string;
  descZh: string;
  descEn: string;
  portalTab?: 'pc' | 'prob';
  color: string;
}

const FORMULAS: FormulaCard[] = [
  // ── P&C ──
  {
    titleZh: '排列公式',
    titleEn: 'Permutation Formula',
    latex: `\\displaystyle P^{n}_{r} = \\frac{n!}{(n-r)!}`,
    descZh: '從 n 個不同物件中，取出 r 個作有序排列',
    descEn: 'Number of ordered arrangements of r items from n distinct items',
    portalTab: 'pc',
    color: 'var(--gold)',
  },
  {
    titleZh: '組合公式',
    titleEn: 'Combination Formula',
    latex: `\\displaystyle C^{n}_{r} = \\binom{n}{r} = \\frac{n!}{r!\\,(n-r)!}`,
    descZh: '從 n 個不同物件中，取出 r 個作無序選取',
    descEn: 'Number of unordered selections of r items from n distinct items',
    portalTab: 'pc',
    color: 'var(--gold)',
  },
  {
    titleZh: '圓形排列',
    titleEn: 'Circular Permutation',
    latex: `\\displaystyle \\text{圓排列}(n) = (n-1)!`,
    descZh: 'n 個不同物件圍成一圈的排列數（固定一個，其餘全排）',
    descEn: 'Arrangements of n distinct items in a circle (fix one, permute the rest)',
    portalTab: 'pc',
    color: 'var(--gold)',
  },
  {
    titleZh: '含相同物件的圓排列',
    titleEn: 'Circular Permutation with Identical Items',
    latex: `\\displaystyle \\frac{(n-1)!}{k!}`,
    descZh: 'n 個物件中有 k 個相同，圍成一圈的排列數',
    descEn: 'Circular arrangements of n items where k are identical',
    portalTab: 'pc',
    color: 'var(--gold)',
  },
  {
    titleZh: '加法原理',
    titleEn: 'Addition Principle',
    latex: `\\displaystyle |A \\cup B| = |A| + |B| \\quad (A \\cap B = \\emptyset)`,
    descZh: '兩個互斥事件的總方法數等於各自方法數之和',
    descEn: 'Total ways for two mutually exclusive events equals sum of individual ways',
    color: 'var(--gold)',
  },
  {
    titleZh: '乘法原理',
    titleEn: 'Multiplication Principle',
    latex: `\\displaystyle |A \\times B| = |A| \\cdot |B|`,
    descZh: '兩個獨立步驟的總方法數等於各步驟方法數之積',
    descEn: 'Total ways for two independent steps equals product of individual ways',
    color: 'var(--gold)',
  },
  // ── Probability ──
  {
    titleZh: '古典概率',
    titleEn: 'Classical Probability',
    latex: `\\displaystyle P(A) = \\frac{\\text{有利結果數}}{\\text{樣本空間大小}}`,
    descZh: '所有基本事件等可能時的概率計算',
    descEn: 'Probability when all outcomes are equally likely',
    portalTab: 'prob',
    color: 'var(--blue)',
  },
  {
    titleZh: '互補事件',
    titleEn: 'Complementary Events',
    latex: `\\displaystyle P(A') = 1 - P(A)`,
    descZh: '事件 A 不發生的概率',
    descEn: 'Probability that event A does not occur',
    color: 'var(--blue)',
  },
  {
    titleZh: '加法定理',
    titleEn: 'Addition Theorem',
    latex: `\\displaystyle P(A \\cup B) = P(A) + P(B) - P(A \\cap B)`,
    descZh: '事件 A 或 B 發生的概率',
    descEn: 'Probability that event A or B occurs',
    color: 'var(--blue)',
  },
  {
    titleZh: '互斥事件加法定理',
    titleEn: 'Addition Theorem (Mutually Exclusive)',
    latex: `\\displaystyle P(A \\cup B) = P(A) + P(B) \\quad \\text{若 } A \\cap B = \\emptyset`,
    descZh: '互斥事件（不能同時發生）的加法定理',
    descEn: 'Addition theorem when A and B cannot occur simultaneously',
    color: 'var(--blue)',
  },
  {
    titleZh: '獨立事件乘法定理',
    titleEn: 'Multiplication Theorem (Independent)',
    latex: `\\displaystyle P(A \\cap B) = P(A) \\cdot P(B) \\quad \\text{若 A, B 獨立}`,
    descZh: 'A 與 B 獨立時，兩者同時發生的概率',
    descEn: 'Probability of both A and B occurring when they are independent',
    color: 'var(--blue)',
  },
  {
    titleZh: '條件概率',
    titleEn: 'Conditional Probability',
    latex: `\\displaystyle P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}, \\quad P(B) > 0`,
    descZh: '已知 B 發生的條件下，A 發生的概率',
    descEn: 'Probability of A given that B has occurred',
    portalTab: 'prob',
    color: 'var(--blue)',
  },
  {
    titleZh: '全概率定理',
    titleEn: 'Total Probability Theorem',
    latex: `\\displaystyle P(B) = P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')`,
    descZh: '利用完備事件組計算 P(B)',
    descEn: 'Calculate P(B) using a complete partition of the sample space',
    color: 'var(--blue)',
  },
  {
    titleZh: '貝葉斯定理',
    titleEn: "Bayes' Theorem",
    latex: `\\displaystyle P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')}`,
    descZh: '由後驗概率反推先驗概率，適用於診斷、測試等場景',
    descEn: 'Reverse conditional probability, used in diagnostic and testing scenarios',
    portalTab: 'prob',
    color: 'var(--green)',
  },
  {
    titleZh: '組合數概率',
    titleEn: 'Combination-based Probability',
    latex: `\\displaystyle P = \\frac{C^{a}_{x} \\cdot C^{b}_{y}}{C^{n}_{r}}, \\quad x + y = r`,
    descZh: '從兩類物件中各取若干個的概率',
    descEn: 'Probability of selecting specific numbers from two types of items',
    portalTab: 'prob',
    color: 'var(--green)',
  },
];

interface Props {
  onPortalToPC: () => void;
  onPortalToProb: () => void;
}

export default function FormulasPage({ onPortalToPC, onPortalToProb }: Props) {
  const { t } = useLang();

  const pcFormulas = FORMULAS.filter(f => f.color === 'var(--gold)');
  const probFormulas = FORMULAS.filter(f => f.color === 'var(--blue)');
  const bayesFormulas = FORMULAS.filter(f => f.color === 'var(--green)');

  function FormulaSection({ title, formulas, accent }: { title: string; formulas: FormulaCard[]; accent: string }) {
    return (
      <div className="space-y-3">
        <h2 className="text-base font-semibold" style={{ color: accent, fontFamily: 'Cormorant Garamond, serif' }}>
          {title}
        </h2>
        <div className="space-y-3">
          {formulas.map((f, i) => (
            <div key={i} className="bg-[var(--bg2)] rounded-xl border border-[var(--border)] p-4 hover:border-opacity-30 transition-all duration-200"
              style={{ borderColor: `${accent}20` }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--text)] mb-0.5">{f.titleZh}</div>
                  <div className="text-xs text-[var(--text-muted)] mb-3 italic">{f.titleEn}</div>
                  <div className="overflow-x-auto">
                    <KatexRenderer display latex={f.latex} />
                  </div>
                  <div className="mt-2 text-xs text-[var(--text-muted)]">{f.descZh}</div>
                  <div className="text-xs text-[var(--text-dim)] italic">{f.descEn}</div>
                </div>
                {f.portalTab && (
                  <button
                    onClick={() => f.portalTab === 'pc' ? onPortalToPC() : onPortalToProb()}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 hover:opacity-90 active:scale-95"
                    style={{
                      borderColor: `${accent}50`,
                      color: accent,
                      background: `${accent}10`,
                    }}
                  >
                    {f.portalTab === 'pc' ? t.btnTryPC : t.btnTryProb} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t.formulasTitle}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t.formulasDesc}</p>
      </div>

      <FormulaSection title={t.fmPC} formulas={pcFormulas} accent="var(--gold)" />
      <FormulaSection title={t.fmProb} formulas={probFormulas} accent="var(--blue)" />
      <FormulaSection title={t.fmBayes} formulas={bayesFormulas} accent="var(--green)" />
    </div>
  );
}
