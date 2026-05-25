// ============================================================
// P&C Page – Permutation, Combination, Circular Permutation
// + Emoji Visualization + Random DSE Practice Questions
// Design: Dark Academic / Chalkboard
// ============================================================

import { useState, useCallback } from 'react';
import { useLang } from '../contexts/LangContext';
import KatexRenderer from '../components/KatexRenderer';
import {
  permutation, combination, circularPermutation, circularWithIdentical,
  generateQuestion, type PracticeQuestion, type QuestionType,
} from '../lib/mathEngine';

type Mode = 'linear' | 'circular';
type SubMode = 'perm' | 'comb';

const EMOJIS = ['🧑', '📚', '⚽', '🃏', '🏆', '🎵', '🌟', '🎭', '🎯', '🎪'];
const CIRCLE_EMOJIS = ['👑', '🌸', '🍎', '🎀', '💎', '🌙', '⭐', '🌺', '🎸', '🦋'];

function EmojiLinear({ n, r }: { n: number; r: number }) {
  const items = Array.from({ length: Math.min(n, 10) }, (_, i) => EMOJIS[i % EMOJIS.length]);
  const selected = items.slice(0, Math.min(r, 10));
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-[var(--text-muted)]">全部 {n} 個：</span>
        {items.map((e, i) => (
          <span key={i} className={`text-2xl transition-all duration-300 ${i < r ? 'opacity-100 scale-110' : 'opacity-30'}`}>{e}</span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-[var(--text-muted)]">選取 {r} 個排列：</span>
        {selected.map((e, i) => (
          <span key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 100}ms`, animationDuration: '1s' }}>{e}</span>
        ))}
        {selected.length > 0 && (
          <span className="text-xs text-[var(--gold)] ml-2 font-mono">→ {r} 個位置</span>
        )}
      </div>
    </div>
  );
}

function EmojiCircular({ n }: { n: number }) {
  const items = Array.from({ length: Math.min(n, 10) }, (_, i) => CIRCLE_EMOJIS[i % CIRCLE_EMOJIS.length]);
  const radius = 70;
  const cx = 90, cy = 90;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(212,168,67,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
        {items.map((e, i) => {
          const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          return (
            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="18">{e}</text>
          );
        })}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="rgba(212,168,67,0.6)">{`(${n}-1)!`}</text>
      </svg>
      <span className="text-xs text-[var(--text-muted)]">圓形排列：固定一個，其餘 {n - 1} 個全排</span>
    </div>
  );
}

interface CalcResult {
  value: number;
  latex: string;
  steps: string[];
}

export default function PCPage() {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>('linear');
  const [subMode, setSubMode] = useState<SubMode>('perm');
  const [n, setN] = useState(5);
  const [r, setR] = useState(3);
  const [k, setK] = useState(2);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState('');
  const [showSteps, setShowSteps] = useState(false);
  const [showViz, setShowViz] = useState(false);

  // Practice question state
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [checkResult, setCheckResult] = useState<'correct' | 'wrong' | null>(null);
  const [showQAnswer, setShowQAnswer] = useState(false);

  const calculate = useCallback(() => {
    setError('');
    setResult(null);
    setShowSteps(false);
    try {
      if (n < 1 || r < 0) { setError(t.errorRange); return; }
      if (mode === 'linear') {
        if (r > n) { setError(t.errorNR); return; }
        const res = subMode === 'perm' ? permutation(n, r) : combination(n, r);
        setResult(res);
      } else {
        const res = k > 1 ? circularWithIdentical(n, k) : circularPermutation(n);
        setResult(res);
      }
      setShowViz(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  }, [n, r, k, mode, subMode, t]);

  const genQuestion = useCallback(() => {
    const types: QuestionType[] = mode === 'circular'
      ? ['circular']
      : subMode === 'perm' ? ['permutation'] : ['combination'];
    const q = generateQuestion(types[0]);
    setQuestion(q);
    setUserAnswer('');
    setCheckResult(null);
    setShowQAnswer(false);
  }, [mode, subMode]);

  const checkAnswer = useCallback(() => {
    if (!question) return;
    const ans = question.answer;
    const val = typeof ans === 'number' ? ans : ans.num / ans.den;
    const userVal = parseFloat(userAnswer);
    if (Math.abs(userVal - val) < 0.001) {
      setCheckResult('correct');
    } else {
      setCheckResult('wrong');
    }
  }, [question, userAnswer]);

  const inputCls = "w-full bg-[var(--bg3)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] text-center text-lg font-mono focus:outline-none focus:border-[var(--gold)]/60 transition-colors";
  const btnGold = "px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--gold)] to-[#B8860B] text-[#1E2433] font-semibold text-sm hover:opacity-90 active:scale-95 transition-all duration-150";
  const btnGhost = "px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-muted)] text-xs hover:border-[var(--border-hover)] hover:text-[var(--text)] transition-all duration-150";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
          {t.pcTitle}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{t.pcDesc}</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 flex-wrap">
        {(['linear', 'circular'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult(null); setError(''); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              mode === m
                ? 'bg-[var(--gold)]/20 border border-[var(--gold)]/50 text-[var(--gold)]'
                : 'bg-[var(--bg2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {m === 'linear' ? t.modeLinear : t.modeCircular}
          </button>
        ))}
      </div>

      {/* Sub-mode for linear */}
      {mode === 'linear' && (
        <div className="flex gap-2">
          {(['perm', 'comb'] as SubMode[]).map(sm => (
            <button
              key={sm}
              onClick={() => { setSubMode(sm); setResult(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                subMode === sm
                  ? 'bg-[var(--blue)]/20 border border-[var(--blue)]/50 text-[var(--blue)]'
                  : 'bg-[var(--bg2)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {sm === 'perm' ? t.modePermutation : t.modeCombination}
            </button>
          ))}
        </div>
      )}

      {/* Formula preview */}
      <div className="bg-[var(--bg2)] rounded-xl border border-[var(--border)] p-4">
        <KatexRenderer
          display
          latex={
            mode === 'circular'
              ? k > 1
                ? `\\displaystyle \\text{圓排列（含相同）} = \\frac{(n-1)!}{k!}`
                : `\\displaystyle \\text{圓排列} = (n-1)!`
              : subMode === 'perm'
                ? `\\displaystyle P^{n}_{r} = \\frac{n!}{(n-r)!}`
                : `\\displaystyle C^{n}_{r} = \\binom{n}{r} = \\frac{n!}{r!(n-r)!}`
          }
        />
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-[var(--text-muted)] mb-1">{t.inputN}</label>
          <input
            type="number" min={1} max={20} value={n}
            onChange={e => setN(Math.max(1, parseInt(e.target.value) || 1))}
            className={inputCls}
          />
        </div>
        {mode === 'linear' && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">{t.inputR}</label>
            <input
              type="number" min={0} max={n} value={r}
              onChange={e => setR(Math.max(0, parseInt(e.target.value) || 0))}
              className={inputCls}
            />
          </div>
        )}
        {mode === 'circular' && (
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              {t.inputK} <span className="text-[var(--text-dim)]">{t.inputKHint}</span>
            </label>
            <input
              type="number" min={1} max={n} value={k}
              onChange={e => setK(Math.max(1, parseInt(e.target.value) || 1))}
              className={inputCls}
            />
          </div>
        )}
        <div className="flex items-end">
          <button onClick={calculate} className={`${btnGold} w-full`}>{t.btnCalculate}</button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg px-4 py-2 text-red-300 text-sm">{error}</div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-[var(--bg2)] rounded-xl border border-[var(--gold)]/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)] uppercase tracking-wider">{t.labelResult}</span>
            <div className="flex gap-2">
              <button onClick={() => setShowSteps(s => !s)} className={btnGhost}>
                {t.labelSteps} {showSteps ? '▲' : '▼'}
              </button>
              <button onClick={() => setShowViz(s => !s)} className={btnGhost}>
                {t.labelVisualize} {showViz ? '▲' : '▼'}
              </button>
            </div>
          </div>
          <div className="text-center py-2">
            <KatexRenderer display latex={`\\displaystyle ${result.latex}`} />
          </div>

          {showSteps && (
            <div className="space-y-2 border-t border-[var(--border)] pt-3">
              {result.steps.map((step, i) => (
                <div key={i} className="bg-[var(--bg3)] rounded-lg px-4 py-2">
                  <KatexRenderer display latex={step} />
                </div>
              ))}
            </div>
          )}

          {showViz && (
            <div className="border-t border-[var(--border)] pt-3">
              {mode === 'circular'
                ? <EmojiCircular n={Math.min(n, 10)} />
                : <EmojiLinear n={Math.min(n, 10)} r={Math.min(r, 10)} />
              }
            </div>
          )}
        </div>
      )}

      {/* Practice Questions */}
      <div className="bg-[var(--bg2)] rounded-xl border border-[var(--border)] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text)]">{t.labelPractice}</span>
          <button onClick={genQuestion} className={btnGold}>{question ? t.btnNewQuestion : t.btnRandom}</button>
        </div>

        {question && (
          <div className="space-y-4">
            <div className="bg-[var(--bg3)] rounded-lg p-4 text-sm leading-relaxed text-[var(--text)]">
              {t.labelHint && (
                <div className="mb-3 flex items-start gap-2">
                  <span className="text-xs text-[var(--text-muted)] shrink-0 mt-0.5">{t.labelHint}：</span>
                  <KatexRenderer latex={question.hint} />
                </div>
              )}
              <p>{question.textZh}</p>
              <p className="text-[var(--text-muted)] text-xs mt-1 italic">{question.textEn}</p>
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="block text-xs text-[var(--text-muted)] mb-1">{t.labelYourAnswer}</label>
                <input
                  type="number"
                  value={userAnswer}
                  onChange={e => { setUserAnswer(e.target.value); setCheckResult(null); }}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div className="flex flex-col gap-2 shrink-0 pt-5">
                <button onClick={checkAnswer} disabled={!userAnswer} className={`${btnGold} disabled:opacity-40`}>
                  {t.btnCheckAnswer}
                </button>
                <button onClick={() => setShowQAnswer(s => !s)} className={btnGhost}>
                  {t.btnShowAnswer}
                </button>
              </div>
            </div>

            {checkResult && (
              <div className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                checkResult === 'correct'
                  ? 'bg-green-900/20 border border-green-500/30 text-green-300'
                  : 'bg-red-900/20 border border-red-500/30 text-red-300'
              }`}>
                {checkResult === 'correct' ? t.labelCorrect : t.labelWrong}
              </div>
            )}

            {showQAnswer && (
              <div className="bg-[var(--bg3)] rounded-lg p-4 space-y-3">
                <div className="text-xs text-[var(--text-muted)]">{t.labelAnswer}：</div>
                <KatexRenderer display latex={`\\displaystyle ${question.answerLatex}`} />
                <div className="border-t border-[var(--border)] pt-2 space-y-2">
                  {question.steps.map((step, i) => (
                    <div key={i} className="text-sm">
                      <KatexRenderer display latex={step} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
