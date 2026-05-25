// ============================================================
// Probability Page – Simple, Combination-based, Bayes Theorem
// + SVG Tree Diagram + Full LaTeX derivation steps
// Design: Light Elegant Academic — ivory bg, deep navy text,
//         gold/blue/teal accents, math grid background
// ============================================================

import { useState, useCallback } from 'react';
import { useLang } from '../contexts/LangContext';
import KatexRenderer from '../components/KatexRenderer';
import {
  simpleProbability, combinationProbability, bayesTheorem,
  fracToLatex, type ProbResult, type BayesResult, type BayesTreeNode,
} from '../lib/mathEngine';

type Mode = 'single' | 'comb' | 'bayes';

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

// ── Fraction input helper ──────────────────────────────────
function FractionInput({
  label, num, den, onNum, onDen,
}: {
  label: string;
  num: number; den: number;
  onNum: (v: number) => void; onDen: (v: number) => void;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <input
          type="number" min={0} value={num}
          onChange={e => onNum(Math.max(0, parseInt(e.target.value) || 0))}
          className="input-field"
          style={{ flex: 1 }}
        />
        <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 300 }}>/</span>
        <input
          type="number" min={1} value={den}
          onChange={e => onDen(Math.max(1, parseInt(e.target.value) || 1))}
          className="input-field"
          style={{ flex: 1 }}
        />
      </div>
    </div>
  );
}

// ── SVG Tree Diagram (light theme) ────────────────────────
function TreeDiagram({ data }: { data: BayesTreeNode[] }) {
  const root = data[0];
  if (!root?.children) return null;

  const W = 480, H = 280;
  const rootX = 40, rootY = H / 2;
  const midX = 180;
  const leafX = 360;

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
        x: leafX, y: leafY,
        label: leaf.label,
        prob: fracToLatex(leaf.prob),
        joint: fracToLatex(jFrac),
        isB: leaf.label === 'B',
      });
    });
  });

  return (
    <div style={{ overflowX: 'auto', padding: '0.5rem 0' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 320, display: 'block' }}>
        {/* Background */}
        <rect x={0} y={0} width={W} height={H} fill="var(--bg-section)" rx={8} />

        {/* Root node */}
        <circle cx={rootX} cy={rootY} r={10} fill="var(--navy)" opacity={0.85} />
        <text x={rootX} y={rootY - 14} textAnchor="middle" fontSize={11}
          fill="var(--text-muted)" fontFamily="Source Sans 3, sans-serif">Ω</text>

        {branches.map(({ child, childY, leaves }, ci) => (
          <g key={ci}>
            {/* Root → child line */}
            <line x1={rootX + 10} y1={rootY} x2={midX - 12} y2={childY}
              stroke="var(--gold-bright)" strokeWidth={1.8} opacity={0.6} />
            {/* Branch label */}
            <foreignObject
              x={(rootX + midX) / 2 - 22} y={childY + (ci === 0 ? -26 : 6)}
              width={64} height={22}
            >
              <div style={{ fontSize: 10, color: 'var(--gold)', textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace' }}>
                {fracToLatex(child.prob)}
              </div>
            </foreignObject>
            {/* Child node */}
            <circle cx={midX} cy={childY} r={10} fill="var(--navy-light)" opacity={0.85} />
            <text x={midX} y={childY - 14} textAnchor="middle" fontSize={11}
              fill="var(--navy)" fontFamily="Source Sans 3, sans-serif" fontWeight={600}>
              {child.label}
            </text>

            {leaves.map((_leaf, li) => {
              const lp = leafPositions[ci * 2 + li];
              return (
                <g key={li}>
                  {/* Child → leaf */}
                  <line x1={midX + 10} y1={childY} x2={lp.x - 10} y2={lp.y}
                    stroke={lp.isB ? 'var(--teal)' : 'var(--border)'}
                    strokeWidth={lp.isB ? 2 : 1.4} opacity={lp.isB ? 0.8 : 0.5} />
                  {/* Branch prob */}
                  <foreignObject
                    x={(midX + lp.x) / 2 - 20} y={lp.y + (li === 0 ? -22 : 4)}
                    width={54} height={20}
                  >
                    <div style={{ fontSize: 9, color: 'var(--navy-light)', textAlign: 'center',
                      fontFamily: 'JetBrains Mono, monospace' }}>
                      {lp.prob}
                    </div>
                  </foreignObject>
                  {/* Leaf node */}
                  <circle cx={lp.x} cy={lp.y} r={9}
                    fill={lp.isB ? 'var(--teal)' : 'var(--bg-muted)'}
                    stroke={lp.isB ? 'var(--teal)' : 'var(--border)'}
                    strokeWidth={1.5} opacity={lp.isB ? 0.85 : 0.7} />
                  <text x={lp.x} y={lp.y - 13} textAnchor="middle" fontSize={10}
                    fill="var(--navy)" fontFamily="Source Sans 3, sans-serif" fontWeight={600}>
                    {lp.label}
                  </text>
                  {/* Joint prob */}
                  {lp.isB && (
                    <foreignObject x={lp.x + 16} y={lp.y - 10} width={100} height={22}>
                      <div style={{ fontSize: 9, color: 'var(--teal)',
                        fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>
                        = {lp.joint}
                      </div>
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

// ── Step card ─────────────────────────────────────────────
function StepCard({ latex, index }: { latex: string; index: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
      background: 'var(--bg-section)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--r-md)',
      padding: 'clamp(0.6rem, 2vw, 0.9rem) clamp(0.75rem, 2vw, 1.1rem)',
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%',
        background: 'var(--navy)', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
        fontFamily: 'var(--font-body)',
      }}>{index + 1}</span>
      <div style={{ flex: 1, overflowX: 'auto' }}>
        <KatexRenderer display latex={latex} />
      </div>
    </div>
  );
}

export default function ProbabilityPage() {
  const { t, lang } = useLang();
  const [mode, setMode] = useState<Mode>('single');

  // Single prob
  const [fav, setFav] = useState(3);
  const [total, setTotal] = useState(10);

  // Comb prob
  const [cA, setCA] = useState(5);
  const [cX, setCX] = useState(2);
  const [cB, setCB] = useState(5);
  const [cY, setCY] = useState(1);
  const [cN, setCN] = useState(10);
  const [cR, setCR] = useState(3);

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
        if (cX + cY !== cR) { setError(lang === 'zh' ? `x + y 必須等於 r（${cX} + ${cY} ≠ ${cR}）` : `x + y must equal r (${cX} + ${cY} ≠ ${cR})`); return; }
        if (cX > cA || cY > cB) { setError(lang === 'zh' ? '選取數不能超過各類型總數' : 'Selection cannot exceed group totals'); return; }
        setProbResult(combinationProbability(cN, cR, cA, cX, cB, cY));
      } else {
        if (pANum > pADen) { setError(lang === 'zh' ? 'P(A) 不能大於 1' : 'P(A) cannot exceed 1'); return; }
        setBayesResult(bayesTheorem(
          [pANum, pADen],
          [pBgANum, pBgADen],
          [pBgAcNum, pBgAcDen],
        ));
        setShowTree(true);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [mode, fav, total, cA, cX, cB, cY, cN, cR, pANum, pADen, pBgANum, pBgADen, pBgAcNum, pBgAcDen, lang]);

  const modeLabels: Record<Mode, string> = {
    single: t.modeSingle,
    comb: t.modeCombProb,
    bayes: t.modeBayes,
  };

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
          <button
            key={m}
            onClick={() => { setMode(m); setProbResult(null); setBayesResult(null); setError(''); }}
            className={`tab-btn ${mode === m ? 'active' : ''}`}
          >
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
              ? `\\displaystyle P = \\frac{C^{a}_{x} \\times C^{b}_{y}}{C^{n}_{r}}`
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
                onChange={e => setFav(Math.max(0, parseInt(e.target.value) || 0))}
                className="input-field" />
            </div>
            <div>
              <label className="input-label">{t.inputTotal}</label>
              <input type="number" min={1} value={total}
                onChange={e => setTotal(Math.max(1, parseInt(e.target.value) || 1))}
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

      {/* ── Combination Prob Inputs ── */}
      {mode === 'comb' && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)' }}>
          <div className="section-hd">
            <div className="section-hd-icon">🔢</div>
            <div>
              <div className="section-hd-title">{lang === 'zh' ? '組合數概率設定' : 'Combination Probability Setup'}</div>
              <div className="section-hd-desc">{lang === 'zh' ? '從兩類物件中各取若干個' : 'Select from two groups'}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'clamp(0.5rem, 1.5vw, 0.85rem)', marginBottom: '0.85rem' }}>
            <div>
              <label className="input-label">{lang === 'zh' ? '總數 n' : 'Total n'}</label>
              <input type="number" min={1} value={cN}
                onChange={e => setCN(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field" />
            </div>
            <div>
              <label className="input-label">{lang === 'zh' ? '取出 r 個' : 'Select r'}</label>
              <input type="number" min={1} value={cR}
                onChange={e => setCR(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(0.5rem, 1.5vw, 0.85rem)', marginBottom: '0.85rem' }}>
            <div className="card-flat" style={{ padding: 'clamp(0.65rem, 2vw, 1rem)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
                {lang === 'zh' ? '類型 A' : 'Type A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <label className="input-label">{lang === 'zh' ? 'A 總數' : 'Total A'}</label>
                  <input type="number" min={0} value={cA}
                    onChange={e => setCA(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
                <div>
                  <label className="input-label">{lang === 'zh' ? '從 A 取 x 個' : 'Select x from A'}</label>
                  <input type="number" min={0} value={cX}
                    onChange={e => setCX(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
              </div>
            </div>
            <div className="card-flat" style={{ padding: 'clamp(0.65rem, 2vw, 1rem)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
                {lang === 'zh' ? '類型 B' : 'Type B'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <label className="input-label">{lang === 'zh' ? 'B 總數' : 'Total B'}</label>
                  <input type="number" min={0} value={cB}
                    onChange={e => setCB(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
                <div>
                  <label className="input-label">{lang === 'zh' ? '從 B 取 y 個' : 'Select y from B'}</label>
                  <input type="number" min={0} value={cY}
                    onChange={e => setCY(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
              </div>
            </div>
          </div>
          <button onClick={calculate} className="btn-primary">
            {lang === 'zh' ? '計算' : 'Calculate'}
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
            <FractionInput label={t.inputPA} num={pANum} den={pADen} onNum={setPANum} onDen={setPADen} />
            <FractionInput label={t.inputPBgivenA} num={pBgANum} den={pBgADen} onNum={setPBgANum} onDen={setPBgADen} />
            <FractionInput label={t.inputPBgivenAc} num={pBgAcNum} den={pBgAcDen} onNum={setPBgAcNum} onDen={setPBgAcDen} />
          </div>
          <button onClick={calculate} className="btn-primary">
            {lang === 'zh' ? '計算' : 'Calculate'}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'var(--red-light)', border: '1px solid rgba(192,57,43,0.25)',
          borderLeft: '4px solid var(--red)',
          borderRadius: 'var(--r-md)', padding: '0.75rem 1rem',
          color: 'var(--red)', fontSize: 'clamp(0.78rem, 1.8vw, 0.88rem)',
          fontFamily: 'var(--font-body)', marginBottom: '0.75rem',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── Simple / Comb Result ── */}
      {probResult && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 6, height: 28, background: 'var(--teal)',
              borderRadius: 3, flexShrink: 0,
            }} />
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
              {probResult.steps.map((step, i) => (
                <StepCard key={i} latex={step} index={i} />
              ))}
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
            <button
              onClick={() => setShowTree(s => !s)}
              className="btn-ghost"
            >
              🌳 {t.labelTree} {showTree ? '▲' : '▼'}
            </button>
          </div>

          <div className="formula-box" style={{ marginBottom: '0.85rem' }}>
            <KatexRenderer display latex={`\\displaystyle ${bayesResult.latex}`} />
            <div style={{ fontSize: 'clamp(0.72rem, 1.5vw, 0.8rem)', color: 'var(--text-muted)', marginTop: '0.4rem', fontFamily: 'var(--font-body)' }}>
              {t.labelDecimal}：<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)', fontWeight: 600 }}>{bayesResult.decimal}</span>
            </div>
          </div>

          {/* Tree Diagram */}
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

          {/* Steps */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '0.85rem', marginBottom: '0.85rem' }}>
            <div style={{ fontSize: 'clamp(0.68rem, 1.3vw, 0.75rem)', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem', fontFamily: 'var(--font-body)' }}>
              {t.labelSteps}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {bayesResult.steps.map((step, i) => (
                <StepCard key={i} latex={step} index={i} />
              ))}
            </div>
          </div>

          {/* Bayes formula reminder */}
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
