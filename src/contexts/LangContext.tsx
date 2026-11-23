import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Lang, type Translations } from '../lib/i18n';

interface LangCtx {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
}

const LangContext = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(()=>{try{return localStorage.getItem('dse-language') === 'en' ? 'en' : 'zh';}catch{return 'zh';}});
  useEffect(()=>{document.documentElement.lang=lang==='zh'?'zh-HK':'en';try{localStorage.setItem('dse-language',lang);}catch{/* Storage may be disabled. */}},[lang]);
  const toggleLang = () => setLang(l => l === 'zh' ? 'en' : 'zh');
  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggleLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
