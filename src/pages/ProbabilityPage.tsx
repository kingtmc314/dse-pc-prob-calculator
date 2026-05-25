// ============================================================
// ProbabilityPage.tsx – Simple, P&C Probability, Bayes Theorem
// + SVG Tree Diagram + Full LaTeX derivation steps
// + Story-style Scenario Templates for comb mode
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
type ScenarioKey = 'office' | 'school' | 'restaurant' | 'family';

interface Scenario {
  nameZh: string; nameEn: string;
  typeAZh: string; typeAEn: string; emojiA: string;
  typeBZh: string; typeBEn: string; emojiB: string;
  descZh: string; descEn: string;
  bgColor: string;
}

// ── Scenario Database (mirrors PCPage) ────────────────────
const SCENARIOS: Record<ScenarioKey, Scenario> = {
  office: {
    nameZh: '辦公室選拔', nameEn: 'Office Selection',
    typeAZh: '經理', typeAEn: 'Manager', emojiA: '👔',
    typeBZh: '員工', typeBEn: 'Staff', emojiB: '💼',
    descZh: '從經理和員工中隨機抽出委員會',
    descEn: 'Randomly select a committee from managers and staff',
    bgColor: 'rgba(212,168,67,0.06)',
  },
  school: {
    nameZh: '影畢業相', nameEn: 'Graduation Photo',
    typeAZh: '老師', typeAEn: 'Teacher', emojiA: '👨‍🏫',
    typeBZh: '學生', typeBEn: 'Student', emojiB: '🧑‍🎓',
    descZh: '從老師和學生中隨機選出代表',
    descEn: 'Randomly pick representatives from teachers and students',
    bgColor: 'rgba(107,155,210,0.06)',
  },
  restaurant: {
    nameZh: '茶餐廳點菜', nameEn: 'Cha Chaan Teng',
    typeAZh: '主食', typeAEn: 'Main Dish', emojiA: '🍛',
    typeBZh: '飲品', typeBEn: 'Drink', emojiB: '🥤',
    descZh: '從主食和飲品中隨機抽出套餐',
    descEn: 'Randomly draw a set meal from dishes and drinks',
    bgColor: 'rgba(126,200,164,0.06)',
  },
  family: {
    nameZh: '家庭聚餐', nameEn: 'Family Gathering',
    typeAZh: '成人', typeAEn: 'Adult', emojiA: '👨',
    typeBZh: '兒童', typeBEn: 'Child', emojiB: '👦',
    descZh: '從成人和兒童中隨機選出代表',
    descEn: 'Randomly select representatives from adults and children',
    bgColor: 'rgba(224,112,112,0.06)',
  },
};

const SCENARIO_KEYS: ScenarioKey[] = ['office', 'school', 'restaurant', 'family'];

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
        <rect x={0} y={0} width={W} height={H} fill="var(--bg-section)" rx={8} />
        <circle cx={rootX} cy={rootY} r={10} fill="var(--navy)" opacity={0.85} />
        <text x={rootX} y={rootY - 14} textAnchor="middle" fontSize={11}
          fill="var(--text-muted)" fontFamily="Source Sans 3, sans-serif">Ω</text>

        {branches.map(({ child, childY, leaves }, ci) => (
          <g key={ci}>
            <line x1={rootX + 10} y1={rootY} x2={midX - 12} y2={childY}
              stroke="var(--gold-bright)" strokeWidth={1.8} opacity={0.6} />
            <foreignObject
              x={(rootX + midX) / 2 - 22} y={childY + (ci === 0 ? -26 : 6)}
              width={64} height={22}
            >
              <div style={{ fontSize: 10, color: 'var(--gold)', textAlign: 'center',
                fontFamily: 'JetBrains Mono, monospace' }}>
                {fracToLatex(child.prob)}
              </div>
            </foreignObject>
            <circle cx={midX} cy={childY} r={10} fill="var(--navy-light)" opacity={0.85} />
            <text x={midX} y={childY - 14} textAnchor="middle" fontSize={11}
              fill="var(--navy)" fontFamily="Source Sans 3, sans-serif" fontWeight={600}>
              {child.label}
            </text>

            {leaves.map((_leaf, li) => {
              const lp = leafPositions[ci * 2 + li];
              return (
                <g key={li}>
                  <line x1={midX + 10} y1={childY} x2={lp.x - 10} y2={lp.y}
                    stroke={lp.isB ? 'var(--teal)' : 'var(--border)'}
                    strokeWidth={lp.isB ? 2 : 1.4} opacity={lp.isB ? 0.8 : 0.5} />
                  <foreignObject
                    x={(midX + lp.x) / 2 - 20} y={lp.y + (li === 0 ? -22 : 4)}
                    width={54} height={20}
                  >
                    <div style={{ fontSize: 9, color: 'var(--navy-light)', textAlign: 'center',
                      fontFamily: 'JetBrains Mono, monospace' }}>
                      {lp.prob}
                    </div>
                  </foreignObject>
                  <circle cx={lp.x} cy={lp.y} r={9}
                    fill={lp.isB ? 'var(--teal)' : 'var(--bg-muted)'}
                    stroke={lp.isB ? 'var(--teal)' : 'var(--border)'}
                    strokeWidth={1.5} opacity={lp.isB ? 0.85 : 0.7} />
                  <text x={lp.x} y={lp.y - 13} textAnchor="middle" fontSize={10}
                    fill="var(--navy)" fontFamily="Source Sans 3, sans-serif" fontWeight={600}>
                    {lp.label}
                  </text>
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

  // Comb scenario
  const [combScenario, setCombScenario] = useState<ScenarioKey>('office');

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

  const sc = SCENARIOS[combScenario];

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

      {/* ── P&C Probability Inputs ── */}
      {mode === 'comb' && (
        <div className="card" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: 'clamp(0.75rem, 2vw, 1.1rem)' }}>

          {/* Step 1: Scenario Selector */}
          <div className="section-hd" style={{ marginBottom: '0.85rem' }}>
            <div className="section-hd-icon">🎭</div>
            <div>
              <div className="section-hd-title">{lang === 'zh' ? '第一步：選擇情境' : 'Step 1: Choose Scenario'}</div>
              <div className="section-hd-desc">{lang === 'zh' ? '選擇一個生活化情境，讓題目更直觀' : 'Pick a real-life context to make the problem more vivid'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.5rem', marginBottom: '1.1rem' }}>
            {SCENARIO_KEYS.map(key => {
              const s = SCENARIOS[key];
              const isActive = combScenario === key;
              return (
                <button
                  key={key}
                  onClick={() => { setCombScenario(key); setProbResult(null); setError(''); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.3rem', padding: '0.65rem 0.5rem',
                    background: isActive ? 'var(--navy)' : s.bgColor,
                    border: isActive ? '2px solid var(--navy)' : '1.5px solid var(--border-light)',
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer', transition: 'all 0.18s ease',
                    color: isActive ? 'white' : 'var(--text-primary)',
                  }}
                >
                  <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{s.emojiA}{s.emojiB}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700,
                    fontFamily: 'var(--font-body)',
                    textAlign: 'center', lineHeight: 1.3,
                    color: isActive ? 'rgba(255,255,255,0.95)' : 'var(--text-primary)',
                  }}>
                    {lang === 'zh' ? s.nameZh : s.nameEn}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Story Banner */}
          <div style={{
            background: sc.bgColor,
            border: '1px solid var(--border-light)',
            borderLeft: '4px solid var(--gold)',
            borderRadius: 'var(--r-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1rem',
            fontFamily: 'var(--font-body)',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              {lang === 'zh' ? '題目情境' : 'Scenario'}
            </div>
            <div style={{ fontSize: 'clamp(0.78rem, 1.8vw, 0.88rem)', color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {lang === 'zh'
                ? `從 ${cN} 人（含 ${cA} 位${sc.typeAZh} ${sc.emojiA} 及 ${cB} 位${sc.typeBZh} ${sc.emojiB}）中隨機選出 ${cR} 人，恰好有 ${cX} 位${sc.typeAZh}及 ${cY} 位${sc.typeBZh}的概率是？`
                : `From ${cN} people (${cA} ${sc.typeAEn}s ${sc.emojiA} and ${cB} ${sc.typeBEn}s ${sc.emojiB}), ${cR} are randomly chosen. What is the probability of getting exactly ${cX} ${sc.typeAEn}(s) and ${cY} ${sc.typeBEn}(s)?`
              }
            </div>
          </div>

          {/* Step 2: Inputs */}
          <div className="section-hd" style={{ marginBottom: '0.75rem' }}>
            <div className="section-hd-icon">🔢</div>
            <div>
              <div className="section-hd-title">{lang === 'zh' ? '第二步：輸入數值' : 'Step 2: Enter Values'}</div>
              <div className="section-hd-desc">{lang === 'zh' ? '設定總人數及各類型的數量' : 'Set total count and group sizes'}</div>
            </div>
          </div>

          {/* Total n and r */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(0.5rem, 1.5vw, 0.85rem)', marginBottom: '0.85rem' }}>
            <div>
              <label className="input-label">{lang === 'zh' ? 'Total n' : 'Total n'}</label>
              <input type="number" min={1} value={cN}
                onChange={e => setCN(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field" />
            </div>
            <div>
              <label className="input-label">{lang === 'zh' ? '選出 r 人' : 'Select r'}</label>
              <input type="number" min={1} value={cR}
                onChange={e => setCR(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field" />
            </div>
          </div>

          {/* Type A and B */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(0.5rem, 1.5vw, 0.85rem)', marginBottom: '0.85rem' }}>
            <div className="card-flat" style={{ padding: 'clamp(0.65rem, 2vw, 1rem)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
                {sc.emojiA} {lang === 'zh' ? sc.typeAZh : sc.typeAEn}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <label className="input-label">{lang === 'zh' ? `${sc.typeAZh}總數 a` : `Total ${sc.typeAEn}s (a)`}</label>
                  <input type="number" min={0} value={cA}
                    onChange={e => setCA(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
                <div>
                  <label className="input-label">{lang === 'zh' ? `選 x 位${sc.typeAZh}` : `Select x ${sc.typeAEn}s`}</label>
                  <input type="number" min={0} value={cX}
                    onChange={e => setCX(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
              </div>
            </div>
            <div className="card-flat" style={{ padding: 'clamp(0.65rem, 2vw, 1rem)' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--navy-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem', fontFamily: 'var(--font-body)' }}>
                {sc.emojiB} {lang === 'zh' ? sc.typeBZh : sc.typeBEn}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <label className="input-label">{lang === 'zh' ? `${sc.typeBZh}總數 b` : `Total ${sc.typeBEn}s (b)`}</label>
                  <input type="number" min={0} value={cB}
                    onChange={e => setCB(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
                <div>
                  <label className="input-label">{lang === 'zh' ? `選 y 位${sc.typeBZh}` : `Select y ${sc.typeBEn}s`}</label>
                  <input type="number" min={0} value={cY}
                    onChange={e => setCY(Math.max(0, parseInt(e.target.value) || 0))}
                    className="input-field" />
                </div>
              </div>
            </div>
          </div>

          {/* Constraint hint */}
          <div style={{
            fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-body)',
            marginBottom: '0.85rem', padding: '0.5rem 0.75rem',
            background: 'var(--bg-section)', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border-light)',
          }}>
            {lang === 'zh'
              ? `⚠️ 注意：x + y 必須等於 r（目前：${cX} + ${cY} = ${cX + cY}，r = ${cR}）`
              : `⚠️ Note: x + y must equal r (currently: ${cX} + ${cY} = ${cX + cY}, r = ${cR})`
            }
          </div>

          <button onClick={calculate} className="btn-primary">
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

          {/* Story result summary for comb mode */}
          {mode === 'comb' && (
            <div style={{
              background: sc.bgColor,
              border: '1px solid var(--border-light)',
              borderLeft: '4px solid var(--teal)',
              borderRadius: 'var(--r-md)',
              padding: '0.65rem 0.9rem',
              marginBottom: '0.85rem',
              fontSize: 'clamp(0.75rem, 1.7vw, 0.85rem)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              lineHeight: 1.6,
            }}>
              {lang === 'zh'
                ? `${sc.emojiA} ${sc.typeAZh} × ${cX} 人 + ${sc.emojiB} ${sc.typeBZh} × ${cY} 人，從 ${cN} 人中選 ${cR} 人`
                : `${sc.emojiA} ${cX} ${sc.typeAEn}(s) + ${sc.emojiB} ${cY} ${sc.typeBEn}(s), choosing ${cR} from ${cN}`
              }
            </div>
          )}

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
