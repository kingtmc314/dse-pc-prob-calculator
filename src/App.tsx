import { useState } from 'react';
import { LangProvider, useLang } from './contexts/LangContext';
import PCPage from './pages/PCPage';
import ProbabilityPage from './pages/ProbabilityPage';
import FormulasPage from './pages/FormulasPage';

type Tab = 'pc' | 'prob' | 'formulas';

const TAB_ACCENT: Record<Tab, string> = {
  pc:       '#B8860B',
  prob:     '#1565C0',
  formulas: '#2A7F6F',
};

const TAB_ICONS: Record<Tab, string> = {
  pc:       '⊕',
  prob:     '◎',
  formulas: '∑',
};

function AppInner() {
  const { lang, t, toggleLang } = useLang();
  const [tab, setTab] = useState<Tab>('pc');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pc',       label: lang === 'zh' ? '排列與組合' : 'P & C' },
    { id: 'prob',     label: lang === 'zh' ? '概率計算'   : 'Probability' },
    { id: 'formulas', label: lang === 'zh' ? '公式參考'   : 'Formulas' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Sticky Header ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(246,242,234,0.97)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
      }}>
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 clamp(0.75rem,3vw,1.5rem)' }}>

          {/* Brand + lang toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 'clamp(0.5rem,1.5vw,0.75rem)',
            paddingBottom: 'clamp(0.25rem,0.8vw,0.4rem)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {/* Logo */}
              <div style={{
                width: 'clamp(30px,5vw,36px)',
                height: 'clamp(30px,5vw,36px)',
                borderRadius: 9,
                flexShrink: 0,
                background: 'linear-gradient(135deg,#D4A843 0%,#8B6914 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(0.9rem,2vw,1.1rem)',
                fontWeight: 800,
                color: '#1A1000',
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 2px 10px rgba(184,134,11,0.35)',
              }}>Σ</div>
              {/* Title */}
              <div>
                <div style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'clamp(0.85rem,2vw,1.05rem)',
                  fontWeight: 700,
                  color: 'var(--navy)',
                  lineHeight: 1.2,
                  letterSpacing: '0.01em',
                }}>{t.appTitle}</div>
                <div style={{
                  fontSize: 'clamp(0.58rem,1.2vw,0.68rem)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.04em',
                  fontFamily: 'var(--font-body)',
                }}>{t.appSubtitle}</div>
              </div>
            </div>

            {/* Lang toggle */}
            <button
              onClick={toggleLang}
              style={{
                padding: 'clamp(0.25rem,0.7vw,0.35rem) clamp(0.65rem,1.5vw,0.9rem)',
                fontSize: 'clamp(0.68rem,1.4vw,0.78rem)',
                fontWeight: 700,
                borderRadius: 7,
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--navy)',
                cursor: 'pointer',
                transition: 'all 0.18s',
                letterSpacing: '0.06em',
                fontFamily: 'var(--font-body)',
                boxShadow: 'var(--shadow-xs)',
              }}
            >{t.langToggle}</button>
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
                    padding: 'clamp(0.45rem,1.2vw,0.6rem) clamp(0.7rem,2vw,1rem)',
                    fontSize: 'clamp(0.75rem,1.6vw,0.88rem)',
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? accent : 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'color 0.18s',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <span style={{ fontSize: 'clamp(0.8rem,1.6vw,0.9rem)', fontFamily: 'serif' }}>
                    {TAB_ICONS[id]}
                  </span>
                  {label}
                  {isActive && (
                    <span style={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      height: 2,
                      borderRadius: '2px 2px 0 0',
                      background: accent,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, paddingBottom: 'clamp(1.5rem,4vw,2.5rem)' }}>
        {tab === 'pc'       && <PCPage />}
        {tab === 'prob'     && <ProbabilityPage />}
        {tab === 'formulas' && (
          <FormulasPage
            onPortalToPC={() => setTab('pc')}
            onPortalToProb={() => setTab('prob')}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: 'clamp(0.85rem,2vw,1.25rem) clamp(0.75rem,3vw,1.5rem)',
        textAlign: 'center',
        background: 'var(--bg-card)',
      }}>
        <p style={{
          fontSize: 'clamp(0.65rem,1.3vw,0.75rem)',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-body)',
          marginBottom: '0.15rem',
        }}>{t.footer}</p>
        <p style={{
          fontSize: 'clamp(0.58rem,1.1vw,0.65rem)',
          color: 'var(--text-light)',
          fontFamily: 'var(--font-body)',
        }}>{t.footerNote}</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AppInner />
    </LangProvider>
  );
}
