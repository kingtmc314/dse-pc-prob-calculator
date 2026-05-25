// ============================================================
// StatsPage.tsx – Statistics Dashboard
// Design: Premium Dark Glassmorphism | Professional Analytics
// Features:
//   • Session statistics (calculations, practice attempts, accuracy)
//   • Calculation history log
//   • Topic breakdown bar chart (SVG)
//   • Accuracy trend sparkline
//   • Motivational progress indicators
// ============================================================

import { useStats } from '../contexts/StatsContext';
import { useLang } from '../contexts/LangContext';

function MiniBarChart({ data, color }: { data: { label: string; value: number; max: number }[]; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 80, fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', flexShrink: 0 }}>
            {item.label}
          </div>
          <div style={{ flex: 1, height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, overflow: 'hidden' }}>
            <div
              className="animate-fade-in"
              style={{
                height: '100%',
                width: `${item.max > 0 ? Math.round((item.value / item.max) * 100) : 0}%`,
                background: color,
                borderRadius: 5,
                transition: 'width 0.8s cubic-bezier(0.23,1,0.32,1)',
              }}
            />
          </div>
          <div style={{ width: 28, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function AccuracyRing({ pct }: { pct: number }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--gold)' : 'var(--red)';
  return (
    <svg width={110} height={110} viewBox="0 0 110 110">
      <circle cx={55} cy={55} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={9} />
      <circle
        cx={55} cy={55} r={r} fill="none"
        stroke={color} strokeWidth={9}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform="rotate(-90 55 55)"
        style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.23,1,0.32,1)' }}
      />
      <text x={55} y={50} textAnchor="middle" dominantBaseline="middle" fontSize="17" fontWeight="700" fill={color}>
        {pct}%
      </text>
      <text x={55} y={68} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">
        accuracy
      </text>
    </svg>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) {
    return (
      <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
        — no data yet —
      </div>
    );
  }
  const w = 200, h = 40;
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => {
        const x = (i / (values.length - 1)) * w;
        const y = h - (v / max) * (h - 4) - 2;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </svg>
  );
}

export default function StatsPage() {
  const { stats, clearStats } = useStats();
  const { lang } = useLang();
  const zh = (z: string, e: string) => lang === 'zh' ? z : e;

  const accuracy = stats.practiceAttempts > 0
    ? Math.round((stats.practiceCorrect / stats.practiceAttempts) * 100)
    : 0;

  const topicMax = Math.max(stats.pcCalcs, stats.probCalcs, stats.practiceAttempts, 1);
  const topicData = [
    { label: zh('排列/組合', 'P&C'), value: stats.pcCalcs, max: topicMax },
    { label: zh('概率', 'Probability'), value: stats.probCalcs, max: topicMax },
    { label: zh('練習題', 'Practice'), value: stats.practiceAttempts, max: topicMax },
  ];

  const totalCalcs = stats.pcCalcs + stats.probCalcs;

  const milestones = [
    { val: 1, icon: '🌱', labelZh: '初學者', labelEn: 'Beginner' },
    { val: 5, icon: '📚', labelZh: '用功學生', labelEn: 'Studious' },
    { val: 10, icon: '🔥', labelZh: '數學達人', labelEn: 'Math Whiz' },
    { val: 20, icon: '🏆', labelZh: '排列王者', labelEn: 'P&C Master' },
    { val: 50, icon: '🎓', labelZh: 'DSE 精英', labelEn: 'DSE Elite' },
  ];
  const currentMilestone = milestones.filter(m => totalCalcs >= m.val).pop();
  const nextMilestone = milestones.find(m => totalCalcs < m.val);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 1rem 3rem' }}>

      {/* ── Header ── */}
      <div style={{ padding: '1.75rem 0 1.25rem' }}>
        <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.6rem', color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
          {zh('學習統計', 'Learning Statistics')}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {zh('追蹤你的學習進度與計算歷史', 'Track your learning progress and calculation history')}
        </p>
      </div>

      {/* ── Top KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
        {[
          {
            value: totalCalcs,
            label: zh('計算次數', 'Calculations'),
            color: 'var(--gold)',
            icon: '🔢',
          },
          {
            value: stats.practiceAttempts,
            label: zh('練習題數', 'Practice Attempts'),
            color: 'var(--blue-bright)',
            icon: '📝',
          },
          {
            value: stats.practiceCorrect,
            label: zh('答對題數', 'Correct Answers'),
            color: 'var(--green)',
            icon: '✅',
          },
          {
            value: stats.formulaViews,
            label: zh('公式查閱', 'Formula Views'),
            color: 'var(--purple)',
            icon: '📐',
          },
        ].map((card, i) => (
          <div key={i} className="stat-card animate-fade-in-up" style={{ animationDelay: `${i * 0.07}s` }}>
            <div style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{card.icon}</div>
            <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
            <div className="stat-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* ── Middle Row: Accuracy + Milestone ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1.5rem' }}>

        {/* Accuracy Ring */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '1.25rem', animationDelay: '0.28s' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            {zh('答題正確率', 'Practice Accuracy')}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <AccuracyRing pct={accuracy} />
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                <div>✅ {zh('答對', 'Correct')}: <strong style={{ color: 'var(--green)' }}>{stats.practiceCorrect}</strong></div>
                <div>❌ {zh('答錯', 'Wrong')}: <strong style={{ color: 'var(--red)' }}>{stats.practiceAttempts - stats.practiceCorrect}</strong></div>
                <div>📝 {zh('總題數', 'Total')}: <strong style={{ color: 'var(--text-primary)' }}>{stats.practiceAttempts}</strong></div>
              </div>
              {stats.practiceAttempts === 0 && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                  {zh('去做練習題吧！', 'Try some practice questions!')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Milestone */}
        <div className="glass-card animate-fade-in-up" style={{ padding: '1.25rem', animationDelay: '0.35s' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
            {zh('成就徽章', 'Achievement')}
          </h3>
          {currentMilestone ? (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.4rem' }}>{currentMilestone.icon}</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-bright)', marginBottom: '0.3rem' }}>
                {zh(currentMilestone.labelZh, currentMilestone.labelEn)}
              </div>
              {nextMilestone && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  {zh(`再做 ${nextMilestone.val - totalCalcs} 次計算解鎖`, `${nextMilestone.val - totalCalcs} more calcs to unlock`)} {nextMilestone.icon}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '0.4rem' }}>🌱</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {zh('開始計算以解鎖成就！', 'Start calculating to unlock achievements!')}
              </div>
            </div>
          )}
          {/* Milestone progress dots */}
          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
            {milestones.map((m, i) => (
              <div key={i} title={`${zh(m.labelZh, m.labelEn)} (${m.val})`}
                style={{
                  width: 28, height: 28, borderRadius: '50%', fontSize: '0.9rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: totalCalcs >= m.val ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${totalCalcs >= m.val ? 'rgba(212,168,67,0.5)' : 'var(--border)'}`,
                  opacity: totalCalcs >= m.val ? 1 : 0.4,
                  transition: 'all 0.3s',
                }}>
                {m.icon}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Topic Breakdown ── */}
      <div className="glass-card animate-fade-in-up" style={{ padding: '1.25rem', marginBottom: '1.25rem', animationDelay: '0.42s' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {zh('主題分佈', 'Topic Breakdown')}
        </h3>
        <MiniBarChart data={topicData} color="linear-gradient(90deg, var(--gold), rgba(212,168,67,0.5))" />
      </div>

      {/* ── Accuracy Trend ── */}
      <div className="glass-card animate-fade-in-up" style={{ padding: '1.25rem', marginBottom: '1.25rem', animationDelay: '0.49s' }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
          {zh('答題趨勢（最近 10 次）', 'Recent Accuracy Trend (Last 10)')}
        </h3>
        <div style={{ overflowX: 'auto', paddingBottom: '0.25rem' }}>
          <Sparkline values={stats.recentAccuracy} color="var(--green)" />
        </div>
        {stats.recentAccuracy.length === 0 && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
            {zh('完成練習題後，趨勢圖將顯示於此。', 'Complete practice questions to see your trend here.')}
          </div>
        )}
      </div>

      {/* ── Calculation History ── */}
      <div className="glass-card animate-fade-in-up" style={{ padding: '1.25rem', marginBottom: '1.25rem', animationDelay: '0.56s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {zh('計算歷史', 'Calculation History')}
          </h3>
          {stats.history.length > 0 && (
            <button className="btn-ghost" onClick={clearStats}
              style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem', color: 'var(--red)', borderColor: 'rgba(224,112,112,0.3)' }}>
              🗑 {zh('清除', 'Clear')}
            </button>
          )}
        </div>

        {stats.history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</div>
            {zh('尚無計算記錄。去計算一個吧！', 'No calculations yet. Go compute something!')}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: 320, overflowY: 'auto' }}>
            {[...stats.history].reverse().map((item, i) => (
              <div key={i} className="history-item animate-slide-in" style={{ animationDelay: `${i * 0.03}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>
                    {item.type === 'pc' ? '🔢' : item.type === 'prob' ? '🎲' : '📝'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 1 }}>
                      {item.timestamp}
                    </div>
                  </div>
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: '1rem', color: 'var(--gold-bright)', flexShrink: 0 }}>
                  {typeof item.answer === 'number' ? item.answer.toLocaleString() : item.answer}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tips ── */}
      <div className="blue-card animate-fade-in-up" style={{ padding: '1rem 1.25rem', animationDelay: '0.63s' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--blue-bright)', marginBottom: '0.5rem' }}>
          💡 {zh('DSE 溫習小貼士', 'DSE Study Tips')}
        </div>
        <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.85 }}>
          <li>{zh('每天做 3-5 道練習題，保持手感。', 'Do 3-5 practice questions daily to stay sharp.')}</li>
          <li>{zh('先理解「排 vs 選」的概念，再記公式。', 'Understand "arrange vs select" before memorizing formulas.')}</li>
          <li>{zh('遇到「至少」條件，優先考慮餘事法。', 'For "at least" conditions, always consider the complementary method first.')}</li>
          <li>{zh('圓排列固定一人，避免重複計算。', 'For circular permutations, fix one person to avoid overcounting.')}</li>
        </ul>
      </div>
    </div>
  );
}
