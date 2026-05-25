// ============================================================
// Formulas Page – DSE P&C + Probability Formula Reference
// All formulas in LaTeX displaystyle
// Portal buttons jump to calculator with pre-filled values
// Design: Light Elegant Academic — ivory bg, deep navy text,
//         gold/blue/teal accents, math grid background
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
  color: 'gold' | 'blue' | 'teal';
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
    color: 'gold',
  },
  {
    titleZh: '組合公式',
    titleEn: 'Combination Formula',
    latex: `\\displaystyle C^{n}_{r} = \\binom{n}{r} = \\frac{n!}{r!\\,(n-r)!}`,
    descZh: '從 n 個不同物件中，取出 r 個作無序選取',
    descEn: 'Number of unordered selections of r items from n distinct items',
    portalTab: 'pc',
    color: 'gold',
  },
  {
    titleZh: '圓形排列',
    titleEn: 'Circular Permutation',
    latex: `\\displaystyle (n-1)!`,
    descZh: 'n 個不同物件圍成一圈的排列數（固定一個，其餘全排）',
    descEn: 'Arrangements of n distinct items in a circle (fix one, permute the rest)',
    portalTab: 'pc',
    color: 'gold',
  },
  {
    titleZh: '捆綁法（相鄰條件）',
    titleEn: 'Bundling Method (Adjacent)',
    latex: `\\displaystyle (B+1)! \\times A!`,
    descZh: '將 A 類捆成一組，與 B 類一起排列，再乘以 A 類內部排列',
    descEn: 'Bundle A-type as one unit, arrange with B-type, then multiply internal arrangements of A',
    color: 'gold',
  },
  {
    titleZh: '插空法（不相鄰條件）',
    titleEn: 'Insertion Method (Non-adjacent)',
    latex: `\\displaystyle B! \\times P^{B+1}_{A}`,
    descZh: '先排 B 類，再將 A 類插入 B 類之間及兩端的空位',
    descEn: 'Arrange B-type first, then insert A-type into gaps between and around B-type',
    color: 'gold',
  },
  {
    titleZh: '加法原理',
    titleEn: 'Addition Principle',
    latex: `\\displaystyle |A \\cup B| = |A| + |B| \\quad (A \\cap B = \\emptyset)`,
    descZh: '兩個互斥事件的總方法數等於各自方法數之和',
    descEn: 'Total ways for two mutually exclusive events equals sum of individual ways',
    color: 'gold',
  },
  {
    titleZh: '乘法原理',
    titleEn: 'Multiplication Principle',
    latex: `\\displaystyle |A \\times B| = |A| \\cdot |B|`,
    descZh: '兩個獨立步驟的總方法數等於各步驟方法數之積',
    descEn: 'Total ways for two independent steps equals product of individual ways',
    color: 'gold',
  },
  // ── Probability ──
  {
    titleZh: '古典概率',
    titleEn: 'Classical Probability',
    latex: `\\displaystyle P(A) = \\frac{\\text{有利結果數}}{\\text{樣本空間大小}}`,
    descZh: '所有基本事件等可能時的概率計算',
    descEn: 'Probability when all outcomes are equally likely',
    portalTab: 'prob',
    color: 'blue',
  },
  {
    titleZh: '互補事件',
    titleEn: 'Complementary Events',
    latex: `\\displaystyle P(A') = 1 - P(A)`,
    descZh: '事件 A 不發生的概率（餘事法）',
    descEn: 'Probability that event A does not occur (complementary counting)',
    color: 'blue',
  },
  {
    titleZh: '加法定理',
    titleEn: 'Addition Theorem',
    latex: `\\displaystyle P(A \\cup B) = P(A) + P(B) - P(A \\cap B)`,
    descZh: '事件 A 或 B 發生的概率',
    descEn: 'Probability that event A or B occurs',
    color: 'blue',
  },
  {
    titleZh: '互斥事件加法定理',
    titleEn: 'Addition Theorem (Mutually Exclusive)',
    latex: `\\displaystyle P(A \\cup B) = P(A) + P(B) \\quad \\text{若 } A \\cap B = \\emptyset`,
    descZh: '互斥事件（不能同時發生）的加法定理',
    descEn: 'Addition theorem when A and B cannot occur simultaneously',
    color: 'blue',
  },
  {
    titleZh: '獨立事件乘法定理',
    titleEn: 'Multiplication Theorem (Independent)',
    latex: `\\displaystyle P(A \\cap B) = P(A) \\cdot P(B) \\quad \\text{若 A, B 獨立}`,
    descZh: 'A 與 B 獨立時，兩者同時發生的概率',
    descEn: 'Probability of both A and B occurring when they are independent',
    color: 'blue',
  },
  {
    titleZh: '條件概率',
    titleEn: 'Conditional Probability',
    latex: `\\displaystyle P(A \\mid B) = \\frac{P(A \\cap B)}{P(B)}, \\quad P(B) > 0`,
    descZh: '已知 B 發生的條件下，A 發生的概率',
    descEn: 'Probability of A given that B has occurred',
    portalTab: 'prob',
    color: 'blue',
  },
  {
    titleZh: '全概率定理',
    titleEn: 'Total Probability Theorem',
    latex: `\\displaystyle P(B) = P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')`,
    descZh: '利用完備事件組計算 P(B)',
    descEn: 'Calculate P(B) using a complete partition of the sample space',
    color: 'blue',
  },
  // ── Bayes ──
  {
    titleZh: '貝葉斯定理',
    titleEn: "Bayes' Theorem",
    latex: `\\displaystyle P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')}`,
    descZh: '由後驗概率反推先驗概率，適用於診斷、測試等場景',
    descEn: 'Reverse conditional probability, used in diagnostic and testing scenarios',
    portalTab: 'prob',
    color: 'teal',
  },
  {
    titleZh: '排列與組合的概率',
    titleEn: 'P&C Probability',
    latex: `\\displaystyle P = \\frac{C^{a}_{x} \\cdot C^{b}_{y}}{C^{n}_{r}}, \\quad x + y = r`,
    descZh: '從兩類物件中各取若干個的概率',
    descEn: 'Probability of selecting specific numbers from two types of items',
    portalTab: 'prob',
    color: 'teal',
  },
];

const COLOR_MAP = {
  gold: { css: 'var(--gold)', bg: 'rgba(180,140,60,0.07)', border: 'rgba(180,140,60,0.18)' },
  blue: { css: 'var(--navy-light)', bg: 'rgba(42,82,152,0.06)', border: 'rgba(42,82,152,0.16)' },
  teal: { css: 'var(--teal)', bg: 'rgba(32,178,170,0.06)', border: 'rgba(32,178,170,0.18)' },
};

interface Props {
  onPortalToPC: () => void;
  onPortalToProb: () => void;
}

export default function FormulasPage({ onPortalToPC, onPortalToProb }: Props) {
  const { t, lang } = useLang();

  const pcFormulas = FORMULAS.filter(f => f.color === 'gold');
  const probFormulas = FORMULAS.filter(f => f.color === 'blue');
  const bayesFormulas = FORMULAS.filter(f => f.color === 'teal');

  function FormulaSection({ title, formulas, colorKey }: {
    title: string;
    formulas: FormulaCard[];
    colorKey: 'gold' | 'blue' | 'teal';
  }) {
    const c = COLOR_MAP[colorKey];
    return (
      <div style={{ marginBottom: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
        {/* Section heading */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.65rem',
          marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)',
        }}>
          <div style={{
            width: 4, height: 22, background: c.css,
            borderRadius: 2, flexShrink: 0,
          }} />
          <h2 style={{
            fontSize: 'clamp(0.95rem, 2.2vw, 1.1rem)',
            fontWeight: 700,
            color: 'var(--navy)',
            fontFamily: 'var(--font-display)',
            margin: 0,
          }}>{title}</h2>
          <div style={{
            flex: 1, height: 1,
            background: `linear-gradient(to right, ${c.css}30, transparent)`,
          }} />
        </div>

        {/* Formula cards grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))',
          gap: 'clamp(0.6rem, 1.5vw, 0.9rem)',
        }}>
          {formulas.map((f, i) => (
            <div key={i} style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 'var(--r-lg)',
              padding: 'clamp(0.85rem, 2.5vw, 1.2rem)',
              transition: 'box-shadow 0.2s, transform 0.15s',
              cursor: 'default',
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${c.css}18`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                (e.currentTarget as HTMLElement).style.transform = 'none';
              }}
            >
              {/* Title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.65rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'clamp(0.82rem, 1.8vw, 0.92rem)',
                    fontWeight: 700,
                    color: 'var(--navy)',
                    fontFamily: 'var(--font-display)',
                    marginBottom: '0.15rem',
                  }}>{f.titleZh}</div>
                  <div style={{
                    fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)',
                    color: 'var(--text-muted)',
                    fontStyle: 'italic',
                    fontFamily: 'var(--font-body)',
                  }}>{f.titleEn}</div>
                </div>
                {f.portalTab && (
                  <button
                    onClick={() => f.portalTab === 'pc' ? onPortalToPC() : onPortalToProb()}
                    style={{
                      flexShrink: 0,
                      padding: '0.3rem 0.65rem',
                      borderRadius: 'var(--r-sm)',
                      fontSize: 'clamp(0.65rem, 1.3vw, 0.72rem)',
                      fontWeight: 700,
                      border: `1.5px solid ${c.css}60`,
                      color: c.css,
                      background: `${c.css}10`,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: 'var(--font-body)',
                      letterSpacing: '0.03em',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.background = `${c.css}20`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.background = `${c.css}10`;
                    }}
                  >
                    {f.portalTab === 'pc' ? (t.btnTryPC || '試試計算器') : (t.btnTryProb || '試試概率')} →
                  </button>
                )}
              </div>

              {/* LaTeX formula */}
              <div style={{
                background: 'rgba(255,255,255,0.7)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--r-md)',
                padding: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                overflowX: 'auto',
                marginBottom: '0.55rem',
              }}>
                <KatexRenderer display latex={f.latex} />
              </div>

              {/* Description */}
              <div style={{
                fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)',
                color: 'var(--text-secondary)',
                fontFamily: 'var(--font-body)',
                lineHeight: 1.5,
              }}>{f.descZh}</div>
              <div style={{
                fontSize: 'clamp(0.65rem, 1.2vw, 0.72rem)',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-body)',
                fontStyle: 'italic',
                marginTop: '0.2rem',
                lineHeight: 1.4,
              }}>{f.descEn}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap" style={{ paddingTop: 'clamp(1rem, 3vw, 1.5rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1>{t.formulasTitle}</h1>
        <p>{t.formulasDesc}</p>
      </div>

      {/* Quick stats bar */}
      <div style={{
        display: 'flex', gap: 'clamp(0.5rem, 1.5vw, 0.85rem)', flexWrap: 'wrap',
        marginBottom: 'clamp(1.2rem, 3vw, 1.8rem)',
      }}>
        {[
          { label: lang === 'zh' ? 'P&C 公式' : 'P&C Formulas', count: pcFormulas.length, color: 'var(--gold)' },
          { label: lang === 'zh' ? '概率公式' : 'Probability', count: probFormulas.length, color: 'var(--navy-light)' },
          { label: lang === 'zh' ? '貝葉斯' : 'Bayes', count: bayesFormulas.length, color: 'var(--teal)' },
        ].map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--r-md)',
            padding: '0.4rem 0.85rem',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: item.color, flexShrink: 0,
            }} />
            <span style={{
              fontSize: 'clamp(0.7rem, 1.4vw, 0.78rem)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-body)',
            }}>
              <strong style={{ color: item.color, fontFamily: 'var(--font-mono)' }}>{item.count}</strong> {item.label}
            </span>
          </div>
        ))}
      </div>

      <FormulaSection title={t.fmPC} formulas={pcFormulas} colorKey="gold" />
      <FormulaSection title={t.fmProb} formulas={probFormulas} colorKey="blue" />
      <FormulaSection title={t.fmBayes} formulas={bayesFormulas} colorKey="teal" />

      {/* Footer note */}
      <div style={{
        marginTop: 'clamp(1rem, 3vw, 1.5rem)',
        padding: 'clamp(0.75rem, 2vw, 1rem)',
        background: 'var(--bg-section)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--r-lg)',
        fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-body)',
        lineHeight: 1.6,
        textAlign: 'center',
      }}>
        {lang === 'zh'
          ? '所有公式均以 LaTeX displaystyle 渲染。按「→」按鈕可跳轉至對應計算器。'
          : 'All formulas rendered in LaTeX displaystyle. Click "→" to jump to the corresponding calculator.'}
      </div>
    </div>
  );
}
