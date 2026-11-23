// ============================================================
// ProbabilityPage.tsx – Simple, P&C Probability, Bayes Theorem
// + SVG Tree Diagram + Full LaTeX derivation steps
// + Flexible Term Builder for comb mode (n!, nPr, nCr, mixed)
// Design: Light Elegant Academic
// ============================================================

import { useState, useCallback } from 'react';
import { useLang } from '../contexts/LangContext';
import KatexRenderer from '../components/KatexRenderer';
import CountingAnimation from '../components/CountingAnimation';
import ExpressionReasoning from '../components/ExpressionReasoning';
import {
  simpleProbability, flexibleProbability, bayesTheorem,
  fracToLatex, termToLatex, evalTermExact, evalTermListExact,
  type ProbResult, type BayesResult, type BayesTreeNode,
  type ExprTerm, type TermType,
} from '../lib/mathEngine';

type Mode = 'single' | 'comb' | 'bayes';

// ── Scenario Data (same as PCPage) ──────────────────────────────
type ScenarioKey = 'office' | 'school' | 'restaurant' | 'family';
interface ProbScenario {
  nameZh: string; nameEn: string;
  emojiA: string; emojiB: string;
  typeAZh: string; typeAEn: string;
  typeBZh: string; typeBEn: string;
  bgColor: string;
}
const PROB_SCENARIOS: Record<ScenarioKey, ProbScenario> = {
  office: {
    nameZh: '辦公室選拔', nameEn: 'Office Selection',
    emojiA: '👔', emojiB: '💼',
    typeAZh: '經理', typeAEn: 'Manager',
    typeBZh: '員工', typeBEn: 'Staff',
    bgColor: 'rgba(212,168,67,0.04)',
  },
  school: {
    nameZh: '影畢業相', nameEn: 'Graduation Photo',
    emojiA: '👨‍🏫', emojiB: '🧑‍🎓',
    typeAZh: '老師', typeAEn: 'Teacher',
    typeBZh: '學生', typeBEn: 'Student',
    bgColor: 'rgba(107,155,210,0.04)',
  },
  restaurant: {
    nameZh: '茶餐廳點菜', nameEn: 'Cha Chaan Teng',
    emojiA: '🍛', emojiB: '🥤',
    typeAZh: '主食', typeAEn: 'Main Dish',
    typeBZh: '飲品', typeBEn: 'Drink',
    bgColor: 'rgba(126,200,164,0.04)',
  },
  family: {
    nameZh: '家庭聚餐', nameEn: 'Family Gathering',
    emojiA: '👨', emojiB: '👦',
    typeAZh: '成人', typeAEn: 'Adult',
    typeBZh: '兒童', typeBEn: 'Child',
    bgColor: 'rgba(224,112,112,0.04)',
  },
};

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

// ── Term Row Component ─────────────────────────────────────
function TermRow({
  term, index, onUpdate, onRemove, lang,
}: {
  term: ExprTerm;
  index: number;
  onUpdate: (i: number, t: ExprTerm) => void;
  onRemove: (i: number) => void;
  lang: string;
}) {
  const typeLabel: Record<TermType, string> = {
    factorial: lang === 'zh' ? 'n!' : 'n!',
    permutation: lang === 'zh' ? 'P(n,r) 排列' : 'P(n,r) Perm',
    combination: lang === 'zh' ? 'C(n,r) 組合' : 'C(n,r) Comb',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: 'var(--bg-section)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--r-md)',
      padding: '0.5rem 0.65rem',
      flexWrap: 'wrap',
    }}>
      {/* Type selector */}
      <select
        value={term.type}
        onChange={e => {
          const newType = e.target.value as TermType;
          onUpdate(index, { ...term, type: newType, r: newType === 'factorial' ? undefined : (term.r ?? 1) });
        }}
        style={{
          padding: '0.25rem 0.4rem',
          borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
        }}
      >
        {(['factorial', 'permutation', 'combination'] as TermType[]).map(t => (
          <option key={t} value={t}>{typeLabel[t]}</option>
        ))}
      </select>

      {/* n input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>n=</span>
        <input
          type="number" min={0} max={20} value={term.n}
          onChange={e => onUpdate(index, { ...term, n: Math.max(0, Math.min(20, parseInt(e.target.value) || 0)) })}
          style={{
            width: 44, padding: '0.25rem 0.35rem',
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontFamily: 'var(--font-mono)',
            textAlign: 'center',
          }}
        />
      </div>

      {/* r input (only for P and C) */}
      {term.type !== 'factorial' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}>r=</span>
          <input
            type="number" min={0} max={term.n} value={term.r ?? 0}
            onChange={e => onUpdate(index, { ...term, r: Math.max(0, Math.min(term.n, parseInt(e.target.value) || 0)) })}
            style={{
              width: 44, padding: '0.25rem 0.35rem',
              borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}
          />
        </div>
      )}

      {/* LaTeX preview */}
      <div style={{
        flex: 1, minWidth: 60,
        padding: '0.2rem 0.4rem',
        background: 'rgba(255,255,255,0.6)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--r-sm)',
        overflow: 'hidden',
      }}>
        <KatexRenderer latex={`\\displaystyle ${termToLatex(term)}`} display={false} />
      </div>

      {/* Numeric value */}
      <div style={{
        fontSize: '0.72rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)',
        fontWeight: 600, minWidth: 36, textAlign: 'right',
      }}>
        {(() => { try { return '= ' + evalTermExact(term).toLocaleString(); } catch { return '—'; } })()}
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(index)}
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(192,57,43,0.1)', border: '1px solid rgba(192,57,43,0.2)',
          color: 'var(--red)', cursor: 'pointer', fontSize: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'all 0.15s',
        }}
        title="Remove"
      >×</button>
    </div>
  );
}

// ── Term List Builder ──────────────────────────────────────
function TermListBuilder({
  label, terms, onChange, lang, accentColor,
}: {
  label: string;
  terms: ExprTerm[];
  onChange: (terms: ExprTerm[]) => void;
  lang: string;
  accentColor: string;
}) {
  const addTerm = (type: TermType) => {
    onChange([...terms, { type, n: 5, r: type === 'factorial' ? undefined : 2 }]);
  };
  const updateTerm = (i: number, t: ExprTerm) => {
    const next = [...terms]; next[i] = t; onChange(next);
  };
  const removeTerm = (i: number) => {
    onChange(terms.filter((_, idx) => idx !== i));
  };

  // Compute product value
  let productVal = 1n;
  let productErr = '';
  try {
    productVal = evalTermListExact(terms);
  } catch (e: unknown) {
    productErr = e instanceof Error ? e.message : 'Error';
  }

  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 4, height: 18, background: accentColor, borderRadius: 2, flexShrink: 0 }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', fontFamily: 'var(--font-body)' }}>{label}</span>
          {terms.length > 0 && !productErr && (
            <span style={{ fontSize: '0.72rem', color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              = {productVal.toLocaleString()}
            </span>
          )}
          {productErr && (
            <span style={{ fontSize: '0.68rem', color: 'var(--red)', fontFamily: 'var(--font-body)' }}>⚠️ {productErr}</span>
          )}
        </div>
        {/* Add buttons */}
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {(['factorial', 'permutation', 'combination'] as TermType[]).map(t => (
            <button
              key={t}
              onClick={() => addTerm(t)}
              style={{
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-section)',
                color: accentColor,
                fontSize: '0.65rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                transition: 'all 0.15s',
              }}
            >
              + {t === 'factorial' ? 'n!' : t === 'permutation' ? 'P(n,r)' : 'C(n,r)'}
            </button>
          ))}
        </div>
      </div>

      {terms.length === 0 ? (
        <div style={{
          padding: '0.5rem 0.75rem',
          background: 'var(--bg-section)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
          textAlign: 'center',
        }}>
          {lang === 'zh' ? '點擊上方按鈕加入項目' : 'Click buttons above to add terms'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {terms.map((t, i) => (
            <TermRow key={i} term={t} index={i} onUpdate={updateTerm} onRemove={removeTerm} lang={lang} />
          ))}
          {/* Product LaTeX preview */}
          {terms.length > 1 && (
            <div style={{
              padding: '0.35rem 0.6rem',
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--r-sm)',
              overflowX: 'auto',
            }}>
              <KatexRenderer display={false} latex={`\\displaystyle ${terms.map(t => termToLatex(t)).join(' \\times ')}`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Fraction Input ─────────────────────────────────────────
function FractionInput({
  label, num, den, onNum, onDen,
}: {
  label: string; num: number; den: number;
  onNum: (v: number) => void; onDen: (v: number) => void;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <input type="number" min={0} value={num}
          onChange={e => onNum(Math.max(0, parseInt(e.target.value) || 0))}
          className="input-field" style={{ flex: 1 }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 300 }}>/</span>
        <input type="number" min={1} value={den}
          onChange={e => onDen(Math.max(1, parseInt(e.target.value) || 1))}
          className="input-field" style={{ flex: 1 }} />
      </div>
    </div>
  );
}

// ── SVG Tree Diagram ───────────────────────────────────────
function TreeDiagram({ data }: { data: BayesTreeNode[] }) {
  const root = data[0];
  if (!root?.children) return null;
  const W = 480, H = 280;
  const rootX = 40, rootY = H / 2;
  const midX = 180, leafX = 360;
  const branches = root.children.map((child, ci) => {
    const childY = ci === 0 ? H * 0.25 : H * 0.75;
    return { child, childY, leaves: child.children || [] };
  });
  const leafPositions: { x: number; y: number; label: string; prob: string; joint: string; isB: boolean }[] = [];
  branches.forEach(({ child, childY, leaves }) => {
    leaves.forEach((leaf, li) => {
      const leafY = childY + (li === 0 ? -55 : 55);
      const jointNum = child.prob.num * leaf.prob.num;
      const jointDen = child.prob.den * leaf.prob.den;
      const g = Math.abs(jointNum) > 0 ? gcd(Math.abs(jointNum), Math.abs(jointDen)) : 1;
      const jFrac = { num: jointNum / g, den: jointDen / g };
      leafPositions.push({
        x: leafX, y: leafY, label: leaf.label,
        prob: fracToLatex(leaf.prob), joint: fracToLatex(jFrac),
        isB: leaf.label === 'B',
      });
    });
  });
  return (
    <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 320, display: 'block' }}>
        <rect x={0} y={0} width={W} height={H} fill="var(--bg-section)" rx={8} />
        <circle cx={rootX} cy={rootY} r={10} fill="var(--navy)" opacity={0.85} />
        <text x={rootX} y={rootY - 14} textAnchor="middle" fontSize={11} fill="var(--text-muted)" fontFamily="Source Sans 3, sans-serif">Ω</text>
        {branches.map(({ child, childY, leaves }, ci) => (
          <g key={ci}>
            <line x1={rootX + 10} y1={rootY} x2={midX - 12} y2={childY} stroke="var(--gold-bright)" strokeWidth={1.8} opacity={0.6} />
            <foreignObject x={(rootX + midX) / 2 - 22} y={childY + (ci === 0 ? -26 : 6)} width={64} height={44}>
              <div style={{fontSize:10,textAlign:'center'}}><KatexRenderer latex={fracToLatex(child.prob)}/></div>
            </foreignObject>
            <circle cx={midX} cy={childY} r={10} fill="var(--navy-light)" opacity={0.85} />
            <text x={midX} y={childY - 14} textAnchor="middle" fontSize={11} fill="var(--navy)" fontFamily="Source Sans 3, sans-serif" fontWeight={600}>{child.label}</text>
            {leaves.map((_leaf, li) => {
              const lp = leafPositions[ci * 2 + li];
              return (
                <g key={li}>
                  <line x1={midX + 10} y1={childY} x2={lp.x - 10} y2={lp.y}
                    stroke={lp.isB ? 'var(--teal)' : 'var(--border)'} strokeWidth={lp.isB ? 2 : 1.4} opacity={lp.isB ? 0.8 : 0.5} />
                  <foreignObject x={(midX + lp.x) / 2 - 20} y={lp.y + (li === 0 ? -22 : 4)} width={54} height={40}>
                    <div style={{ fontSize: 9, color: 'var(--navy-light)', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace' }}><KatexRenderer latex={lp.prob}/></div>
                  </foreignObject>
                  <circle cx={lp.x} cy={lp.y} r={9}
                    fill={lp.isB ? 'var(--teal)' : 'var(--bg-muted)'}
                    stroke={lp.isB ? 'var(--teal)' : 'var(--border)'} strokeWidth={1.5} opacity={lp.isB ? 0.85 : 0.7} />
                  <text x={lp.x} y={lp.y - 13} textAnchor="middle" fontSize={10} fill="var(--navy)" fontFamily="Source Sans 3, sans-serif" fontWeight={600}>{lp.label}</text>
                  {lp.isB && (
                    <foreignObject x={lp.x + 16} y={lp.y - 10} width={100} height={44}>
                      <div style={{ fontSize: 9, color: 'var(--teal)', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}><KatexRenderer latex={`= ${lp.joint}`}/></div>
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Step Card ──────────────────────────────────────────────
function StepCard({ latex, index }: { latex: string; index: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      background: 'var(--bg-section)', border: '1px solid var(--border-light)',
      borderRadius: 'var(--r-md)',
      padding: 'clamp(0.6rem, 2vw, 0.9rem) clamp(0.75rem, 2vw, 1.1rem)',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%', background: 'var(--navy)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, fontFamily: 'var(--font-body)',
      }}>{index + 1}</span>
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <KatexRenderer display latex={latex} />
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ProbabilityPage() {
  const { t, lang } = useLang();
  const [mode, setMode] = useState<Mode>('comb');

  // Single prob
  const [fav, setFav] = useState(3);
  const [total, setTotal] = useState(10);

  // Scenario
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('school');
  const [storyPreset,setStoryPreset] = useState<'choose'|'order'|'mixed'|'custom'>('choose');
  const [showAnimation,setShowAnimation] = useState(false);
  const loadPreset=(preset:'choose'|'order'|'mixed')=>{
    setStoryPreset(preset);setError('');setProbResult(null);setShowAnimation(false);
    if(preset==='order'){setNumTerms([{type:'permutation',n:5,r:3}]);setDenTerms([{type:'permutation',n:10,r:3}]);}
    else {setNumTerms([{type:'combination',n:5,r:2},{type:'combination',n:5,r:1},...(preset==='mixed' ? [{type:'factorial' as const,n:3}] : [])]);setDenTerms([preset==='mixed' ? {type:'permutation',n:10,r:3} : {type:'combination',n:10,r:3}]);}
  };

  // Flexible comb prob
  const [numTerms, setNumTerms] = useState<ExprTerm[]>([
    { type: 'combination', n: 5, r: 2 },
    { type: 'combination', n: 5, r: 1 },
  ]);
  const [denTerms, setDenTerms] = useState<ExprTerm[]>([
    { type: 'combination', n: 10, r: 3 },
  ]);

  // Bayes
  const [pANum, setPANum] = useState(1); const [pADen, setPADen] = useState(10);
  const [pBgANum, setPBgANum] = useState(9); const [pBgADen, setPBgADen] = useState(10);
  const [pBgAcNum, setPBgAcNum] = useState(2); const [pBgAcDen, setPBgAcDen] = useState(10);

  const [probResult, setProbResult] = useState<ProbResult | null>(null);
  const [bayesResult, setBayesResult] = useState<BayesResult | null>(null);
  const [error, setError] = useState('');
  const [showTree, setShowTree] = useState(false);

  const calculate = useCallback(() => {
    setError('');
    setProbResult(null);
    setBayesResult(null);
    setShowTree(false);
    try {
      if (mode === 'single') {
        if (fav > total) { setError(lang === 'zh' ? '有利結果不能大於總結果' : 'Favourable outcomes cannot exceed total outcomes'); return; }
        setProbResult(simpleProbability(fav, total));
      } else if (mode === 'comb') {
        if (numTerms.length === 0) { setError(lang === 'zh' ? '請在分子加入至少一個項目' : 'Add at least one term to the numerator'); return; }
        if (denTerms.length === 0) { setError(lang === 'zh' ? '請在分母加入至少一個項目' : 'Add at least one term to the denominator'); return; }
        setProbResult(flexibleProbability(numTerms, denTerms));
      } else {
        if (pANum > pADen) { setError(lang === 'zh' ? 'P(A) 不能大於 1' : 'P(A) cannot exceed 1'); return; }
        setBayesResult(bayesTheorem([pANum, pADen], [pBgANum, pBgADen], [pBgAcNum, pBgAcDen]));
        setShowTree(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [mode, fav, total, numTerms, denTerms, pANum, pADen, pBgANum, pBgADen, pBgAcNum, pBgAcDen, lang]);

  const modeLabels: Record<Mode, string> = {
    single: t.modeSingle,
    comb: t.modeCombProb,
    bayes: `${t.modeBayes} ${lang === 'zh' ? '（延伸）' : '(extension)'}`,
  };

  // Build formula preview LaTeX for comb mode
  const combFormulaPreview = (() => {
    if (numTerms.length === 0 && denTerms.length === 0) return `\\displaystyle P = \\frac{\\text{Numerator}}{\\text{Denominator}}`;
    const numL = numTerms.length > 0 ? numTerms.map(t => termToLatex(t)).join(' \\times ') : '1';
    const denL = denTerms.length > 0 ? denTerms.map(t => termToLatex(t)).join(' \\times ') : '1';
    return `\\displaystyle P = \\frac{${numL}}{${denL}}`;
  })();

  return (
    <div className="page-wrap" style={{ paddingTop: 'clamp(1rem, 3vw, 1.5rem)', paddingBottom: 'clamp(2rem, 5vw, 3rem)' }}>
      {/* Page Header */}
      <div className="page-header">
        <h1>{t.probTitle}</h1>
        <p>{t.probDesc}</p>
      </div>

      {/* Mode Selector */}
      <div className="tab-group" style={{ marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)' }}>
        {(['single', 'comb', 'bayes'] as Mode[]).map(m => (
          <button key={m}
            onClick={() => { setMode(m); setProbResult(null); setBayesResult(null); setError(''); setShowTree(false); }}
            className={`tab-btn ${mode === m ? 'active' : ''}`}>
            {modeLabels[m]}
          </button>
        ))}
      </div>

      {/* Formula Preview */}
      <div className="formula-box" style={{ marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)' }}>
        <KatexRenderer display latex={
          mode === 'single'
            ? `\\displaystyle P = \\frac{\\text{${lang === 'zh' ? '有利結果數' : 'Favourable outcomes'}}}{\\text{${lang === 'zh' ? '總結果數' : 'Total outcomes'}}}`
            : mode === 'comb'
              ? combFormulaPreview
              : `\\displaystyle P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')}`
        } />
      </div>

      {/* ── Single Prob Inputs ── */}
      {mode === 'single' && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)' }}>
          <div className="section-hd">
            <div className="section-hd-icon">🎯</div>
            <div>
              <div className="section-hd-title">{lang === 'zh' ? '輸入數值' : 'Enter Values'}</div>
              <div className="section-hd-desc">{lang === 'zh' ? '輸入有利結果數與總結果數' : 'Enter favourable and total outcomes'}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'clamp(0.6rem, 2vw, 1rem)' }}>
            <div>
              <label className="input-label">{t.inputFav}</label>
              <input type="number" min={0} value={fav}
                onChange={e => { setProbResult(null); setError(''); setFav(Math.max(0, parseInt(e.target.value) || 0)); }}
                className="input-field" />
            </div>
            <div>
              <label className="input-label">{t.inputTotal}</label>
              <input type="number" min={1} value={total}
                onChange={e => { setProbResult(null); setError(''); setTotal(Math.max(1, parseInt(e.target.value) || 1)); }}
                className="input-field" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={calculate} className="btn-primary" style={{ width: '100%' }}>
                {lang === 'zh' ? '計算' : 'Calculate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Flexible P&C Probability Inputs ── */}
      {mode === 'comb' && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)' }}>

          {/* Step 1: Scenario Selector */}
          <div className="section-hd" style={{ marginBottom: '0.85rem' }}>
            <div className="section-hd-icon">🎭</div>
            <div>
              <div className="section-hd-title">{lang === 'zh' ? '第一步：選擇情境' : 'Step 1: Choose a Scenario'}</div>
              <div className="section-hd-desc">{lang === 'zh' ? '選一個生活化情境，讓題目更直觀' : 'Pick a context to make the question more concrete'}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.6rem', marginBottom: '1rem' }}>
            {(Object.entries(PROB_SCENARIOS) as [ScenarioKey, ProbScenario][]).map(([key, sc]) => (
              <button key={key} aria-pressed={scenarioKey===key} onClick={() => setScenarioKey(key)}
                style={{
                  padding: '0.75rem 0.6rem', borderRadius: 'var(--r-lg)',
                  border: `2px solid ${scenarioKey === key ? 'var(--navy)' : 'var(--border-light)'}`,
                  background: scenarioKey === key ? 'rgba(26,43,77,0.07)' : sc.bgColor,
                  cursor: 'pointer', transition: 'all 0.18s',
                  textAlign: 'center',
                }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.3rem' }}>{sc.emojiA}{sc.emojiB}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: scenarioKey === key ? 'var(--navy)' : 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>
                  {lang === 'zh' ? sc.nameZh : sc.nameEn}
                </div>
              </button>
            ))}
          </div>

          <div className="tab-group" style={{marginBottom:16}}>
            {(['choose','order','mixed'] as const).map(preset=><button key={preset} className={`tab-btn ${storyPreset===preset?'active':''}`} onClick={()=>loadPreset(preset)}>{preset==='choose' ? (lang==='zh'?'只選小組 · nCr':'Choose a group · nCr') : preset==='order' ? (lang==='zh'?'依次安排 · nPr':'Ordered selection · nPr') : (lang==='zh'?'先選後排 · 混合':'Choose then arrange · Mixed')}</button>)}
          </div>
          {(()=>{
            const sc=PROB_SCENARIOS[scenarioKey],a=lang==='zh'?sc.typeAZh:sc.typeAEn,b=lang==='zh'?sc.typeBZh:sc.typeBEn;
            const story=storyPreset==='custom'
              ? (lang==='zh'?'目前為自訂算式。下列項目由你設定，故事背景不會自動證明此算式正確。請確保每個階段不重複計數，且分子分母描述同一樣本空間。':'Custom expression: these terms are yours. The story does not automatically validate the model. Avoid double counting and use a consistent sample space.')
              : storyPreset==='choose'
                ? (lang==='zh'?`有 5 個相異${a}和 5 個相異${b}，不放回地隨機選 3 個，每個三人／三物小組的機會相同。求恰好選到 2 個${a}和 1 個${b}的概率。只計成員，不計選取次序。`:`There are 5 distinct ${a} objects and 5 distinct ${b} objects. Choose 3 without replacement; every three-object group is equally likely. Find the probability of exactly 2 ${a} and 1 ${b}. Selection order is ignored.`)
                : storyPreset==='order'
                  ? (lang==='zh'?`有 5 個相異${a}和 5 個相異${b}，不放回地依次選出 3 個，放在第一、第二、第三個位置。所有有序結果等可能。求三個位置都是${a}的概率。`:`From 5 distinct ${a} and 5 distinct ${b} objects, draw 3 without replacement for positions 1, 2 and 3. All ordered outcomes are equally likely. Find the probability all three are ${a}.`)
                  : (lang==='zh'?`有 5 個相異${a}和 5 個相異${b}，隨機選 3 個再安排到三個不同位置，所有有序安排等可能。求所選成員恰好有 2 個${a}和 1 個${b}的概率（位置不限）。先選成員，再計 3! 種安排。`:`Choose 3 from 5 distinct ${a} and 5 distinct ${b} objects, then assign them to three distinct positions. All ordered arrangements are equally likely. Find the probability of exactly 2 ${a} and 1 ${b}, in any positions. Choose members first, then count 3! assignments.`);
            return <div className="card-gold" style={{padding:18,marginBottom:16}}><strong style={{fontSize:13,color:'var(--gold)'}}>{sc.emojiA}{sc.emojiB} {lang==='zh'?sc.nameZh:sc.nameEn}</strong><p style={{fontSize:14,marginTop:8,lineHeight:1.85}}>{story}</p></div>;
          })()}
          {storyPreset!=='custom' && <div style={{marginBottom:16}}><button className="btn-outline" onClick={()=>setShowAnimation(v=>!v)}>{lang==='zh'?'動畫理解此方法（示例為 5 選 3）':'Animate this method (5-choose-3 demo)'}</button>{showAnimation && <CountingAnimation compact scenario={scenarioKey} kind={storyPreset}/>}</div>}

          {/* Step 2: Header */}
          <div className="section-hd" style={{ marginBottom: '0.85rem' }}>
            <div className="section-hd-icon">🔢</div>
            <div>
              <div className="section-hd-title">{lang === 'zh' ? '第二步：建立概率算式' : 'Step 2: Build Probability Expression'}</div>
              <div className="section-hd-desc">
                {lang === 'zh'
                  ? '在分子和分母各加入 n!、P(n,r) 或 C(n,r) 項目，可混合使用'
                  : 'Add n!, P(n,r), or C(n,r) terms to numerator and denominator — mix freely'}
              </div>
            </div>
          </div>

          <ExpressionReasoning terms={[...numTerms,...denTerms]} probability />
          <p className="engine-note">{lang==='zh'?'分子：符合條件的結果。分母：全部等可能結果。使用精確整數及約分分數運算。':'Numerator: favourable outcomes. Denominator: all equally likely outcomes. Uses exact integer arithmetic and reduced fractions.'}</p>

          {/* Numerator */}
          <TermListBuilder
            label={lang === 'zh' ? '分子（有利結果數）' : 'Numerator (favourable)'}
            terms={numTerms}
            onChange={t => { setNumTerms(t); setStoryPreset('custom'); setShowAnimation(false); setProbResult(null); setError(''); }}
            lang={lang}
            accentColor="var(--gold)"
          />

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            margin: '0.5rem 0 0.85rem',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)', fontWeight: 600 }}>÷</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
          </div>

          {/* Denominator */}
          <TermListBuilder
            label={lang === 'zh' ? '分母（總結果數）' : 'Denominator (total)'}
            terms={denTerms}
            onChange={t => { setDenTerms(t); setStoryPreset('custom'); setShowAnimation(false); setProbResult(null); setError(''); }}
            lang={lang}
            accentColor="var(--teal)"
          />

          <button onClick={calculate} className="btn-primary" style={{ marginTop: '0.5rem' }}>
            {lang === 'zh' ? '計算概率' : 'Calculate Probability'}
          </button>
        </div>
      )}

      {/* ── Bayes Inputs ── */}
      {mode === 'bayes' && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)' }}>
          <div className="section-hd">
            <div className="section-hd-icon">🔄</div>
            <div>
              <div className="section-hd-title">{lang === 'zh' ? '貝葉斯定理輸入' : "Bayes' Theorem Input"}</div>
              <div className="section-hd-desc">{lang === 'zh' ? '輸入先驗概率與條件概率（分子/分母）' : 'Enter prior and conditional probabilities (numerator/denominator)'}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'clamp(0.6rem, 2vw, 1rem)', marginBottom: '0.85rem' }}>
            <FractionInput label={t.inputPA} num={pANum} den={pADen} onNum={v=>{setPANum(v);setBayesResult(null);setShowTree(false);setError('');}} onDen={v=>{setPADen(v);setBayesResult(null);setShowTree(false);setError('');}} />
            <FractionInput label={t.inputPBgivenA} num={pBgANum} den={pBgADen} onNum={v=>{setPBgANum(v);setBayesResult(null);setShowTree(false);setError('');}} onDen={v=>{setPBgADen(v);setBayesResult(null);setShowTree(false);setError('');}} />
            <FractionInput label={t.inputPBgivenAc} num={pBgAcNum} den={pBgAcDen} onNum={v=>{setPBgAcNum(v);setBayesResult(null);setShowTree(false);setError('');}} onDen={v=>{setPBgAcDen(v);setBayesResult(null);setShowTree(false);setError('');}} />
          </div>
          <button onClick={calculate} className="btn-primary">{lang === 'zh' ? '計算' : 'Calculate'}</button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--red-light)', border: '1px solid rgba(192,57,43,0.25)',
          borderLeft: '4px solid var(--red)', borderRadius: 'var(--r-md)',
          padding: '0.75rem 1rem', color: 'var(--red)',
          fontSize: 'clamp(0.78rem, 1.8vw, 0.88rem)', fontFamily: 'var(--font-body)', marginBottom: '0.75rem',
        }}>⚠️ {error}</div>
      )}

      {/* ── Result ── */}
      {probResult && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 6, height: 28, background: 'var(--teal)', borderRadius: 3, flexShrink: 0 }} />
            <span style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.78rem)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>
              {t.labelProbResult}
            </span>
          </div>
          <div className="formula-box" style={{ marginBottom: '0.85rem' }}>
            <KatexRenderer display latex={`\\displaystyle ${probResult.latex}`} />
            <div style={{ fontSize: 'clamp(0.72rem, 1.5vw, 0.8rem)', color: 'var(--text-muted)', marginTop: '0.4rem', fontFamily: 'var(--font-body)' }}>
              {t.labelDecimal}：<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontWeight: 600 }}>{probResult.decimal}</span>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem' }}>
            <div style={{ fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', fontFamily: 'var(--font-body)' }}>
              {t.labelSteps}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {probResult.steps.map((step, i) => <StepCard key={i} latex={step} index={i} />)}
            </div>
          </div>
        </div>
      )}

      {/* ── Bayes Result ── */}
      {bayesResult && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 6, height: 28, background: 'var(--teal)', borderRadius: 3, flexShrink: 0 }} />
              <span style={{ fontSize: 'clamp(0.7rem, 1.4vw, 0.78rem)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'var(--font-body)' }}>
                {t.labelBayesFormula}
              </span>
            </div>
            <button onClick={() => setShowTree(s => !s)} className="btn-ghost">
              🌳 {t.labelTree} {showTree ? '▲' : '▼'}
            </button>
          </div>
          <div className="formula-box" style={{ marginBottom: '0.85rem' }}>
            <KatexRenderer display latex={`\\displaystyle ${bayesResult.latex}`} />
            <div style={{ fontSize: 'clamp(0.72rem, 1.5vw, 0.8rem)', color: 'var(--text-muted)', marginTop: '0.4rem', fontFamily: 'var(--font-body)' }}>
              {t.labelDecimal}：<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontWeight: 600 }}>{bayesResult.decimal}</span>
            </div>
          </div>
          {showTree && (
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', marginBottom: '0.85rem' }}>
              <div style={{ fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', fontFamily: 'var(--font-body)' }}>
                {t.labelTree}
              </div>
              <div className="card-flat" style={{ padding: '0.75rem', background: 'var(--bg-section)' }}>
                <TreeDiagram data={bayesResult.treeData} />
              </div>
            </div>
          )}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', marginBottom: '0.85rem' }}>
            <div style={{ fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', fontFamily: 'var(--font-body)' }}>
              {t.labelSteps}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {bayesResult.steps.map((step, i) => <StepCard key={i} latex={step} index={i} />)}
            </div>
          </div>
          <div className="card-teal" style={{ padding: 'clamp(0.75rem, 2vw, 1rem)' }}>
            <div style={{ fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)', fontWeight: 700, color: 'var(--teal)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
              {t.labelBayesFormula}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <KatexRenderer display latex={`\\displaystyle P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
