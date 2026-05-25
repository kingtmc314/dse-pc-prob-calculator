// ============================================================
// StatsContext.tsx – Global statistics tracker
// Tracks: calculations, practice attempts/correct, formula views,
//         history log, recent accuracy trend
// ============================================================

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface HistoryItem {
  type: 'pc' | 'prob' | 'practice';
  description: string;
  answer: number | string;
  timestamp: string;
}

export interface Stats {
  pcCalcs: number;
  probCalcs: number;
  practiceAttempts: number;
  practiceCorrect: number;
  formulaViews: number;
  history: HistoryItem[];
  recentAccuracy: number[]; // 0 or 100 for each recent attempt
}

interface StatsCtx {
  stats: Stats;
  recordPCCalc: (description: string, answer: number) => void;
  recordProbCalc: (description: string, answer: string) => void;
  recordPractice: (correct: boolean, description: string, answer: number) => void;
  recordFormulaView: () => void;
  clearStats: () => void;
}

const defaultStats: Stats = {
  pcCalcs: 0,
  probCalcs: 0,
  practiceAttempts: 0,
  practiceCorrect: 0,
  formulaViews: 0,
  history: [],
  recentAccuracy: [],
};

const StatsContext = createContext<StatsCtx | null>(null);

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit' });
}

export function StatsProvider({ children }: { children: ReactNode }) {
  const [stats, setStats] = useState<Stats>(() => {
    try {
      const saved = localStorage.getItem('dse_pc_stats');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return defaultStats;
  });

  const save = useCallback((next: Stats) => {
    setStats(next);
    try { localStorage.setItem('dse_pc_stats', JSON.stringify(next)); } catch { /* ignore */ }
  }, []);

  const recordPCCalc = useCallback((description: string, answer: number) => {
    setStats(prev => {
      const next: Stats = {
        ...prev,
        pcCalcs: prev.pcCalcs + 1,
        history: [...prev.history.slice(-49), {
          type: 'pc', description, answer, timestamp: getTimestamp(),
        }],
      };
      try { localStorage.setItem('dse_pc_stats', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const recordProbCalc = useCallback((description: string, answer: string) => {
    setStats(prev => {
      const next: Stats = {
        ...prev,
        probCalcs: prev.probCalcs + 1,
        history: [...prev.history.slice(-49), {
          type: 'prob', description, answer, timestamp: getTimestamp(),
        }],
      };
      try { localStorage.setItem('dse_pc_stats', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const recordPractice = useCallback((correct: boolean, description: string, answer: number) => {
    setStats(prev => {
      const recentAccuracy = [...prev.recentAccuracy, correct ? 100 : 0].slice(-10);
      const next: Stats = {
        ...prev,
        practiceAttempts: prev.practiceAttempts + 1,
        practiceCorrect: prev.practiceCorrect + (correct ? 1 : 0),
        recentAccuracy,
        history: [...prev.history.slice(-49), {
          type: 'practice', description, answer, timestamp: getTimestamp(),
        }],
      };
      try { localStorage.setItem('dse_pc_stats', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const recordFormulaView = useCallback(() => {
    setStats(prev => {
      const next = { ...prev, formulaViews: prev.formulaViews + 1 };
      try { localStorage.setItem('dse_pc_stats', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const clearStats = useCallback(() => {
    save(defaultStats);
  }, [save]);

  return (
    <StatsContext.Provider value={{ stats, recordPCCalc, recordProbCalc, recordPractice, recordFormulaView, clearStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const ctx = useContext(StatsContext);
  if (!ctx) throw new Error('useStats must be used within StatsProvider');
  return ctx;
}
