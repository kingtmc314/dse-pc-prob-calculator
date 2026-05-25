import { useState } from 'react';
import { LangProvider, useLang } from './contexts/LangContext';
import { StatsProvider } from './contexts/StatsContext';
import PCPage from './pages/PCPage';
import ProbabilityPage from './pages/ProbabilityPage';
import FormulasPage from './pages/FormulasPage';
import StatsPage from './pages/StatsPage';

type Tab = 'pc' | 'prob' | 'formulas' | 'stats';

const TAB_ACCENT: Record<Tab, string> = {
  pc: 'var(--gold)',
  prob: 'var(--blue-bright)',
  formulas: 'var(--green)',
  stats: '#A78BFA',
};

const TAB_ICONS: Record<Tab, string> = {
  pc: '🔢',
  prob: '🎲',
  formulas: '📐',
  stats: '📊',
};

function AppInner() {
  const { lang, t, toggleLang } = useLang();
  const [tab, setTab] = useState<Tab>('pc');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pc', label: lang === 'zh' ? '排列與組合' : 'P & C' },
    { id: 'prob', label: lang === 'zh' ? '概率計算' : 'Probability' },
    { id: 'formulas', label: lang === 'zh' ? '公式參考' : 'Formulas' },
    { id: 'stats', label: lang === 'zh' ? '學習統計' : 'Statistics' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        background: 'rgba(10,13,22,0.97)',
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 1rem' }}>

          {/* Brand row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', paddingBottom: '0.4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: 'linear-gradient(135deg, #D4A843 0%, #8B6914 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.05rem', fontWeight: 800, color: '#1A1000',
                boxShadow: '0 2px 14px rgba(212,168,67,0.4)',
              }}>
                Σ
              </div>
              <div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.05rem', fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '0.01em',
                  lineHeight: 1.2,
                }}>
                  {t.appTitle}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', letterSpacing: '0.04em' }}>
                  {t.appSubtitle}
                </div>
              </div>
            </div>

            <button
              onClick={toggleLang}
              style={{
                padding: '0.32rem 0.9rem',
                fontSize: '0.75rem', fontWeight: 700,
                borderRadius: 7,
                border: '1px solid rgba(212,168,67,0.35)',
                background: 'rgba(212,168,67,0.08)',
                color: 'var(--gold)',
                cursor: 'pointer',
                transition: 'all 0.18s',
                letterSpacing: '0.06em',
              }}
            >
              {t.langToggle}
            </button>
          </div>

          {/* Tab row */}
          <div style={{ display: 'flex', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {tabs.map(({ id, label }) => {
              const isActive = tab === id;
              const accent = TAB_ACCENT[id];
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  style={{
                    position: 'relative',
                    padding: '0.6rem 0.85rem',
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? accent : 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.18s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>{TAB_ICONS[id]}</span>
                  {label}
                  {isActive && (
                    <span style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 2, borderRadius: '2px 2px 0 0',
                      background: accent,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main style={{ flex: 1 }}>
        {tab === 'pc' && <PCPage />}
        {tab === 'prob' && <ProbabilityPage />}
        {tab === 'formulas' && (
          <FormulasPage onPortalToPC={() => setTab('pc')} onPortalToProb={() => setTab('prob')} />
        )}
        {tab === 'stats' && <StatsPage />}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.25rem 1rem',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>{t.footer}</p>
        <p style={{ fontSize: '0.68rem', color: 'var(--text-dim)', opacity: 0.5 }}>{t.footerNote}</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <StatsProvider>
        <AppInner />
      </StatsProvider>
    </LangProvider>
  );
}
