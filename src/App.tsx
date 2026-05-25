import { useState } from 'react';
import { LangProvider, useLang } from './contexts/LangContext';
import PCPage from './pages/PCPage';
import ProbabilityPage from './pages/ProbabilityPage';
import FormulasPage from './pages/FormulasPage';

type Tab = 'pc' | 'prob' | 'formulas';

const TAB_ACCENT: Record<Tab, string> = {
  pc: 'var(--gold)',
  prob: 'var(--blue)',
  formulas: 'var(--green)',
};

function AppInner() {
  const { t, toggleLang } = useLang();
  const [tab, setTab] = useState<Tab>('pc');

  const tabs: { id: Tab; label: string }[] = [
    { id: 'pc', label: t.tabPC },
    { id: 'prob', label: t.tabProb },
    { id: 'formulas', label: t.tabFormulas },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      <header className="border-b sticky top-0 z-50 backdrop-blur-md" style={{ borderColor: 'var(--border)', background: 'rgba(30,36,51,0.95)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, var(--gold), #B8860B)', color: '#1E2433' }}>
                Σ
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'Cormorant Garamond, serif' }}>
                  {t.appTitle}
                </div>
                <div className="text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>{t.appSubtitle}</div>
              </div>
            </div>
            <button
              onClick={toggleLang}
              className="px-3 py-1 text-xs font-semibold rounded-lg border transition-all duration-200 hover:opacity-80"
              style={{ borderColor: 'rgba(212,168,67,0.4)', color: 'var(--gold)', background: 'rgba(212,168,67,0.08)' }}
            >
              {t.langToggle}
            </button>
          </div>
          <div className="flex">
            {tabs.map(({ id, label }) => {
              const isActive = tab === id;
              const accent = TAB_ACCENT[id];
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="relative px-4 py-2.5 text-sm font-medium transition-all duration-200 flex-1 sm:flex-none"
                  style={{ color: isActive ? accent : 'var(--text-muted)' }}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t" style={{ background: accent }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>
      <main className="flex-1">
        {tab === 'pc' && <PCPage />}
        {tab === 'prob' && <ProbabilityPage />}
        {tab === 'formulas' && (
          <FormulasPage onPortalToPC={() => setTab('pc')} onPortalToProb={() => setTab('prob')} />
        )}
      </main>
      <footer className="border-t py-5 mt-4" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-1">
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{t.footer}</p>
          <p className="text-xs" style={{ color: 'var(--text-dim)', opacity: 0.6 }}>{t.footerNote}</p>
        </div>
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
