// ============================================================
// Probability Page – Simple, Combination-based, Bayes Theorem
// + SVG Tree Diagram + Full LaTeX derivation steps
// Design: Dark Academic / Chalkboard
// ============================================================

import { useState, useCallback } from 'react';
import { useLang } from '../contexts/LangContext';
import KatexRenderer from '../components/KatexRenderer';
import {
  simpleProbability, combinationProbability, bayesTheorem,
  fracToLatex, type ProbResult, type BayesResult, type BayesTreeNode,
} from '../lib/mathEngine';

type Mode = 'single' | 'comb' | 'bayes';

// ── Fraction input helper ──────────────────────────────────
function FractionInput({
  label, num, den, onNum, onDen,
}: {
  label: string;
  num: number; den: number;
  onNum: (v: number) => void; onDen: (v: number) => void;
}) {
  const inputCls = "w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-[var(--text)] text-center text-sm font-mono focus:outline-none focus:border-[var(--blue)]/60 transition-colors";
  return (
    <div>
      <label className="block text-xs text-[var(--text-muted)] mb-1">{label}</label>
      <div className="flex items-center gap-1">
        <input type="number" min={0} value={num} onChange={e => onNum(Math.max(0, parseInt(e.target.value) || 0))} className={inputCls} />
        <span className="text-[var(--text-muted)] text-lg">/</span>
        <input type="number" min={1} value={den} onChange={e => onDen(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
      </div>
    </div>
  );
}

// ── SVG Tree Diagram ───────────────────────────────────────
function TreeDiagram({ data }: { data: BayesTreeNode[] }) {
  const root = data[0];
  if (!root?.children) return null;

  const W = 420, H = 240;
  const rootX = 30, rootY = H / 2;
  const midX = 160;
  const leafX = 320;

  const branches = root.children.map((child, ci) => {
    const childY = ci === 0 ? H * 0.25 : H * 0.75;
    return { child, childY, leaves: child.children || [] };
  });

  const leafPositions: { x: number; y: number; label: string; prob: string; joint: string; isB: boolean }[] = [];
  branches.forEach(({ child, childY, leaves }) => {
    leaves.forEach((leaf, li) => {
      const leafY = childY + (li === 0 ? -50 : 50);
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

  function gcd(a: number, b: number): number {
    while (b) { [a, b] = [b, a % b]; }
    return a;
  }

  return (
    <div className="overflow-x-auto">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="min-w-[320px]">
        {/* Root node */}
        <circle cx={rootX} cy={rootY} r={8} fill="var(--gold)" opacity={0.8} />

        {branches.map(({ child, childY, leaves }, ci) => (
          <g key={ci}>
            {/* Root → child */}
            <line x1={rootX + 8} y1={rootY} x2={midX - 12} y2={childY}
              stroke="rgba(212,168,67,0.5)" strokeWidth={1.5} />
            {/* Branch label (prob) */}
            <foreignObject
              x={(rootX + midX) / 2 - 20} y={childY + (ci === 0 ? -26 : 8)}
              width={60} height={22}
            >
              <div style={{ fontSize: 10, color: 'var(--gold)', textAlign: 'center' }}>
                {fracToLatex(child.prob)}
              </div>
            </foreignObject>
            {/* Child node */}
            <circle cx={midX} cy={childY} r={8} fill="var(--blue)" opacity={0.8} />
            <text x={midX} y={childY - 12} textAnchor="middle" fontSize={11} fill="var(--text)">{child.label}</text>

            {leaves.map((_leaf, li) => {
              const lp = leafPositions[ci * 2 + li];
              return (
                <g key={li}>
                  {/* Child → leaf */}
                  <line x1={midX + 8} y1={childY} x2={lp.x - 12} y2={lp.y}
                    stroke={lp.isB ? 'rgba(107,155,210,0.6)' : 'rgba(255,255,255,0.15)'}
                    strokeWidth={lp.isB ? 2 : 1.2} />
                  {/* Branch prob */}
                  <foreignObject
                    x={(midX + lp.x) / 2 - 18} y={lp.y + (li === 0 ? -22 : 4)}
                    width={50} height={20}
                  >
                    <div style={{ fontSize: 9, color: 'rgba(107,155,210,0.9)', textAlign: 'center' }}>
                      {lp.prob}
                    </div>
                  </foreignObject>
                  {/* Leaf node */}
                  <circle cx={lp.x} cy={lp.y} r={7}
                    fill={lp.isB ? 'var(--blue)' : 'rgba(255,255,255,0.1)'}
                    stroke={lp.isB ? 'var(--blue)' : 'rgba(255,255,255,0.2)'}
                    strokeWidth={1} />
                  <text x={lp.x} y={lp.y - 10} textAnchor="middle" fontSize={10} fill="var(--text)">{lp.label}</text>
                  {/* Joint prob */}
                  {lp.isB && (
                    <foreignObject x={lp.x + 14} y={lp.y - 10} width={90} height={22}>
                      <div style={{ fontSize: 9, color: 'rgba(126,200,164,0.9)' }}>
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

export default function ProbabilityPage() {
  const { t } = useLang();
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
        if (fav > total) { setError('有利結果不能大於總結果'); return; }
        setProbResult(simpleProbability(fav, total));
      } else if (mode === 'comb') {
        if (cX + cY !== cR) { setError(`x + y 必須等於 r（${cX} + ${cY} ≠ ${cR}）`); return; }
        if (cX > cA || cY > cB) { setError('選取數不能超過各類型總數'); return; }
        setProbResult(combinationProbability(cN, cR, cA, cX, cB, cY));
      } else {
        if (pANum > pADen) { setError('P(A) 不能大於 1'); return; }
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
  }, [mode, fav, total, cA, cX, cB, cY, cN, cR, pANum, pADen, pBgANum, pBgADen, pBgAcNum, pBgAcDen]);

  const inputCls = "w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] text-center text-lg font-mono focus:outline-none focus:border-[var(--blue)]/60 transition-colors";
  const btnBlue = "px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--blue)] to-[#4a7ab5] text-white font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-150";
  const btnGhost = "px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-xs hover:border-[rgba(255,255,255,0.2)] hover:text-[var(--text)] transition-all duration-150";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t.probTitle}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t.probDesc}</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        {(['single', 'comb', 'bayes'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setProbResult(null); setBayesResult(null); setError(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === m
                ? 'bg-[var(--blue)]/20 border border-[var(--blue)]/50 text-[var(--blue)]'
                : 'bg-[var(--bg2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {m === 'single' ? t.modeSingle : m === 'comb' ? t.modeCombProb : t.modeBayes}
          </button>
        ))}
      </div>

      {/* Formula preview */}
      <div className="bg-[var(--bg2)] rounded-xl border border-[var(--border)] p-4">
        <KatexRenderer display latex={
          mode === 'single'
            ? `\\displaystyle P = \\frac{\\text{有利結果數}}{\\text{總結果數}}`
            : mode === 'comb'
              ? `\\displaystyle P = \\frac{C^{a}_{x} \\times C^{b}_{y}}{C^{n}_{r}}`
              : `\\displaystyle P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')}`
        } />
      </div>

      {/* Inputs */}
      {mode === 'single' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{t.inputFav}</label>
            <input type="number" min={0} value={fav} onChange={e => setFav(Math.max(0, parseInt(e.target.value) || 0))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{t.inputTotal}</label>
            <input type="number" min={1} value={total} onChange={e => setTotal(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
          </div>
          <div className="flex items-end">
            <button onClick={calculate} className={`${btnBlue} w-full`}>計算</button>
          </div>
        </div>
      )}

      {mode === 'comb' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">總數 n</label>
              <input type="number" min={1} value={cN} onChange={e => setCN(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-muted)] mb-1">取出 r 個</label>
              <input type="number" min={1} value={cR} onChange={e => setCR(Math.max(1, parseInt(e.target.value) || 1))} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--bg2)] rounded-lg p-3 space-y-2 border border-[var(--border)]">
              <div className="text-xs text-[var(--gold)] font-semibold">類型 A</div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">A 總數</label>
                <input type="number" min={0} value={cA} onChange={e => setCA(Math.max(0, parseInt(e.target.value) || 0))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">從 A 取 x 個</label>
                <input type="number" min={0} value={cX} onChange={e => setCX(Math.max(0, parseInt(e.target.value) || 0))} className={inputCls} />
              </div>
            </div>
            <div className="bg-[var(--bg2)] rounded-lg p-3 space-y-2 border border-[var(--border)]">
              <div className="text-xs text-[var(--blue)] font-semibold">類型 B</div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">B 總數</label>
                <input type="number" min={0} value={cB} onChange={e => setCB(Math.max(0, parseInt(e.target.value) || 0))} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">從 B 取 y 個</label>
                <input type="number" min={0} value={cY} onChange={e => setCY(Math.max(0, parseInt(e.target.value) || 0))} className={inputCls} />
              </div>
            </div>
          </div>
          <button onClick={calculate} className={`${btnBlue} w-full sm:w-auto`}>計算</button>
        </div>
      )}

      {mode === 'bayes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FractionInput label={t.inputPA} num={pANum} den={pADen} onNum={setPANum} onDen={setPADen} />
            <FractionInput label={t.inputPBgivenA} num={pBgANum} den={pBgADen} onNum={setPBgANum} onDen={setPBgADen} />
            <FractionInput label={t.inputPBgivenAc} num={pBgAcNum} den={pBgAcDen} onNum={setPBgAcNum} onDen={setPBgAcDen} />
          </div>
          <button onClick={calculate} className={`${btnBlue} w-full sm:w-auto`}>計算</button>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-300 text-sm">{error}</div>
      )}

      {/* Simple / Comb Result */}
      {probResult && (
        <div className="bg-[var(--bg2)] rounded-xl border border-[var(--blue)]/30 p-5 space-y-4">
          <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.labelProbResult}</span>
          <div className="text-center py-2">
            <KatexRenderer display latex={`\\displaystyle ${probResult.latex}`} />
            <div className="text-xs text-[var(--text-muted)] mt-2">
              {t.labelDecimal}：<span className="font-mono text-[var(--blue)]">{probResult.decimal}</span>
            </div>
          </div>
          <div className="border-t border-[var(--border)] pt-3 space-y-2">
            <div className="text-xs text-[var(--text-muted)] mb-2">{t.labelSteps}：</div>
            {probResult.steps.map((step, i) => (
              <div key={i} className="bg-[var(--bg3)] rounded-lg px-4 py-2">
                <KatexRenderer display latex={step} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bayes Result */}
      {bayesResult && (
        <div className="bg-[var(--bg2)] rounded-xl border border-[var(--blue)]/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.labelBayesFormula}</span>
            <button onClick={() => setShowTree(s => !s)} className={btnGhost}>
              {t.labelTree} {showTree ? '▲' : '▼'}
            </button>
          </div>

          <div className="text-center py-2">
            <KatexRenderer display latex={`\\displaystyle ${bayesResult.latex}`} />
            <div className="text-xs text-[var(--text-muted)] mt-2">
              {t.labelDecimal}：<span className="font-mono text-[var(--blue)]">{bayesResult.decimal}</span>
            </div>
          </div>

          {showTree && (
            <div className="border-t border-[var(--border)] pt-3">
              <div className="text-xs text-[var(--text-muted)] mb-2">{t.labelTree}：</div>
              <div className="bg-[var(--bg3)] rounded-lg p-3">
                <TreeDiagram data={bayesResult.treeData} />
              </div>
            </div>
          )}

          <div className="border-t border-[var(--border)] pt-3 space-y-2">
            <div className="text-xs text-[var(--text-muted)] mb-2">{t.labelSteps}：</div>
            {bayesResult.steps.map((step, i) => (
              <div key={i} className="bg-[var(--bg3)] rounded-lg px-4 py-2">
                <KatexRenderer display latex={step} />
              </div>
            ))}
          </div>

          {/* Bayes formula reminder */}
          <div className="bg-[var(--bg3)] rounded-lg p-4 border border-[var(--blue)]/20">
            <div className="text-xs text-[var(--text-muted)] mb-2">{t.labelBayesFormula}：</div>
            <KatexRenderer display latex={`\\displaystyle P(A \\mid B) = \\frac{P(B \\mid A) \\cdot P(A)}{P(B \\mid A) \\cdot P(A) + P(B \\mid A') \\cdot P(A')}`} />
          </div>
        </div>
      )}
    </div>
  );
}
