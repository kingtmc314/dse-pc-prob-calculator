import { lazy, Suspense, useEffect, useState } from 'react';
import { BookOpen, Calculator, ChevronRight, GraduationCap, Layers3, Play, Sigma } from 'lucide-react';
import { LangProvider, useLang } from './contexts/LangContext';
import KatexRenderer from './components/KatexRenderer';
import './upgrade.css';

const PCPage = lazy(() => import('./pages/PCPage'));
const ProbabilityPage = lazy(() => import('./pages/ProbabilityPage'));
const FormulasPage = lazy(() => import('./pages/FormulasPage'));
const CountingAnimation = lazy(() => import('./components/CountingAnimation'));
const DSEPage = lazy(() => import('./pages/DSEPage'));
type Tab = 'learn' | 'dse' | 'pc' | 'prob' | 'formulas';
const validTabs: Tab[] = ['learn', 'dse', 'pc', 'prob', 'formulas'];

function AppInner() {
  const { lang, toggleLang } = useLang();
  const zh = (z: string, e: string) => lang === 'zh' ? z : e;
  const [tab, setTab] = useState<Tab>(() => {
    const value = window.location.hash.slice(1) as Tab;
    return validTabs.includes(value) ? value : 'learn';
  });
  useEffect(() => {
    const update = () => { const value = window.location.hash.slice(1) as Tab; setTab(validTabs.includes(value) ? value : 'learn'); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const go = (next: Tab) => { setTab(next); window.location.hash = next; window.scrollTo({ top: 0, behavior: 'instant' }); };
  const tabs = [
    { id: 'learn' as Tab, label: zh('動畫教室', 'Visual studio'), Icon: Play },
    { id: 'dse' as Tab, label: zh('DSE 題目', 'DSE practice'), Icon: GraduationCap },
    { id: 'pc' as Tab, label: zh('排列與組合', 'P & C'), Icon: Layers3 },
    { id: 'prob' as Tab, label: zh('概率', 'Probability'), Icon: Calculator },
    { id: 'formulas' as Tab, label: zh('公式手冊', 'Reference'), Icon: BookOpen },
  ];
  return (
    <div className="academy-app">
      <a className="skip-link" href="#main-content">{zh('跳至主要內容', 'Skip to content')}</a>
      <header className="academy-header">
        <div className="academy-brand-row">
          <button className="academy-brand" onClick={() => go('learn')} aria-label={zh('回到動畫教室', 'Go to visual studio')}>
            <span className="academy-logo"><Sigma size={24} /></span>
            <span><strong>{zh('數學 · 看得明白', 'Mathematics, made visible')}</strong><small>DSE · PERMUTATIONS & PROBABILITY</small></span>
          </button>
          <button className="academy-lang" onClick={toggleLang} aria-label={zh('Switch to English', '切換至繁體中文')}>{lang === 'zh' ? 'EN / 中文' : '中文 / EN'}</button>
        </div>
        <nav className="academy-nav" aria-label={zh('主導航', 'Main navigation')}>
          {tabs.map(({id, label, Icon}) => <button key={id} onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined} className={tab === id ? 'selected' : ''}><Icon size={17} /><span>{label}</span></button>)}
        </nav>
      </header>
      <main id="main-content" className="academy-main">
        <Suspense fallback={<div className="academy-loading" role="status">{zh('正在打開學習工具…', 'Opening your learning workspace…')}</div>}>
          {tab === 'learn' && <div className="studio-wrap">
            <section className="studio-hero">
              <div className="studio-hero-copy">
                <div className="studio-eyebrow"><span /> {zh('由情境理解，到公式推導', 'FROM A STORY TO A SOLUTION')}</div>
                <h1>{zh('不只計出答案。', 'More than an answer.')}<br/><em>{zh('看懂每一步。', 'Understand every step.')}</em></h1>
                <p>{zh('把抽象的排列與組合，變成看得見的選擇、位置和小組。先理解為何這樣數，再用 DSE 風格題練習。', 'Turn abstract counting into visible choices, positions and groups. Discover why a method works, then put it to the test with DSE-style questions.')}</p>
                <div className="studio-hero-actions"><button className="btn-primary" onClick={() => document.getElementById('animation-classroom')?.scrollIntoView({behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'})}><Play size={16}/>{zh('開始動畫推導', 'Explore the animation')}</button><button className="btn-outline" onClick={() => go('dse')}>{zh('挑戰 DSE 題目', 'Try a DSE question')}<ChevronRight size={16}/></button></div>
              </div>
              <aside className="studio-note">
                <span className="studio-note-label">01 / THE KEY QUESTION</span>
                <h2>{zh('交換兩個人，', 'Swap two people.')}<br/>{zh('算不算新結果？', 'Is it a new outcome?')}</h2>
                <div className="studio-swap" aria-hidden="true"><span>A</span><span className="studio-swap-arrow">⇄</span><span>B</span></div>
                <div className="studio-note-rule"><strong>{zh('有不同職位／位置', 'Distinct roles / positions')}</strong><span>{zh('排列：次序重要', 'Permutation: order matters')}</span></div>
                <div className="studio-note-rule"><strong>{zh('只選同一個小組', 'Just the same group')}</strong><span>{zh('組合：次序不重要', 'Combination: order does not matter')}</span></div>
                <KatexRenderer display latex={'\\displaystyle {}^nP_r = {}^nC_r \\times r!'} />
              </aside>
            </section>
            <div className="studio-path" aria-label={zh('解題流程', 'Solution workflow')}>
              {[zh('讀清楚情境', 'Read the story'),zh('判斷次序', 'Decide on order'),zh('拆開計數', 'Count in stages'),zh('檢查樣本空間', 'Check the sample space')].map((label,i) => <div key={label}><span>0{i+1}</span><strong>{label}</strong></div>)}
            </div>
            <section id="animation-classroom" className="studio-classroom">
              <div className="studio-section-title"><div><span className="studio-eyebrow">THE COUNTING STUDIO</span><h2>{zh('讓思考過程動起來', 'See the reasoning in motion')}</h2></div><p>{zh('可播放、暫停，亦可逐步慢慢看。', 'Play, pause, or take one step at a time.')}</p></div>
              <CountingAnimation />
            </section>
            <section className="studio-next-grid">
              <button onClick={() => go('dse')}><GraduationCap size={24}/><h3>{zh('由理解走向應用', 'From understanding to practice')}</h3><p>{zh('四類原創 DSE 風格題與隨機變式。先選策略，再逐步推導。', 'Four original DSE-style templates with variants. Choose a strategy, then build a solution.')}</p><span>{zh('打開題庫', 'Open practice')} →</span></button>
              <button onClick={() => go('pc')}><Calculator size={24}/><h3>{zh('自己的情境，自己建立', 'Build your own problem')}</h3><p>{zh('保留五步故事精靈，也可直接使用 n!、nPr、nCr 混合算式。', 'Use the five-step story wizard or go straight to mixed n!, nPr and nCr expressions.')}</p><span>{zh('打開計算工具', 'Open calculator')} →</span></button>
            </section>
          </div>}
          {tab === 'dse' && <DSEPage />}
          {tab === 'pc' && <PCPage />}
          {tab === 'prob' && <ProbabilityPage />}
          {tab === 'formulas' && <FormulasPage onPortalToPC={() => go('pc')} onPortalToProb={() => go('prob')}/>}
        </Suspense>
      </main>
      <footer className="academy-footer"><span>Σ · {zh('理解概念，比記住公式更重要。', 'Understanding comes before memorising.')}</span><small>{zh('原創教學及 DSE 風格練習，非考評局官方試題。圓排列及 Bayes 屬延伸學習。', 'Original teaching and DSE-style practice; not official HKEAA papers. Circular permutations and Bayes are enrichment topics.')}</small></footer>
    </div>
  );
}
export default function App() { return <LangProvider><AppInner /></LangProvider>; }
