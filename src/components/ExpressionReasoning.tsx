import { useLang } from '../contexts/LangContext';
import KatexRenderer from './KatexRenderer';
import { termToLatex, type ExprTerm } from '../lib/mathEngine';

export default function ExpressionReasoning({ terms, probability = false }: { terms: ExprTerm[]; probability?: boolean }) {
  const { lang } = useLang();
  const zh = (z: string, e: string) => lang === 'zh' ? z : e;
  return <details className="expression-reasoning" open>
    <summary>{zh('為甚麼用這些項目？', 'Why use these terms?')}</summary>
    <div className="expression-reasoning-items">{terms.map((term, i) => <div key={i}>
      <KatexRenderer latex={`\\displaystyle ${termToLatex(term)}`} />
      <p>{term.type === 'factorial'
        ? zh(`把 ${term.n} 個相異物件全部排列。每個位置都不同，所以交換後算新結果。`, `Arrange all ${term.n} distinct objects. Positions are different, so a swap creates a new outcome.`)
        : term.type === 'permutation'
          ? zh(`從 ${term.n} 個中選 ${term.r ?? 0} 個，分配到不同位置／職位，不重複選取。先選誰、再放哪裏都重要。`, `Choose ${term.r ?? 0} of ${term.n}, without replacement, for distinct positions or roles. Both membership and assignment matter.`)
          : zh(`從 ${term.n} 個中選 ${term.r ?? 0} 個，只計成員。不因組內交換次序而增加結果，因此除去 r! 次重複。`, `Choose ${term.r ?? 0} of ${term.n}; only membership matters. Divide out the r! reorderings of each group.`)}</p>
    </div>)}</div>
    <p className="engine-note">{zh('乘法原理：每一階段都要完成，且每個前階段結果有相同數目的後續選擇，才可把各階段選法相乘；重複選人的算式需要另行調整。', 'Multiply stage counts only when all stages are required and every earlier outcome has the stated number of continuations. Avoid choosing the same person twice.')}</p>
    {probability && <p className="expression-caution">{zh('概率檢查：所有基本結果必須等可能；分子與分母必須採用同一種結果定義。算式數值介乎 0 與 1，並不代表模型一定正確。', 'Probability check: elementary outcomes must be equally likely, and numerator and denominator must define outcomes consistently. A number between 0 and 1 does not by itself validate the model.')}</p>}
  </details>;
}
