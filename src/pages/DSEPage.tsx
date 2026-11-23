import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Lightbulb, RefreshCw, Shuffle } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import KatexRenderer from '../components/KatexRenderer';
import CountingAnimation from '../components/CountingAnimation';
import {
  checkDSEAnswer, DSE_DIFFICULTIES, DSE_ORIGINAL_NOTICE, DSE_QUESTION_IDS, DSE_REFERENCES, DSE_TOPICS,
  generateDSEQuestions, generateDSEVariant,
  type DSEAnswerCheck, type DSEQuestion, type DSEQuestionId, type DSEText, type DSETopic,
} from '../lib/dseQuestions';
import './DSEPage.css';

const MASTERED_KEY = 'dse-original-practice-mastered-v1';
const TOPICS: DSETopic[] = ['permutation', 'combination', 'probability', 'mixed'];

function loadMastered(): DSEQuestionId[] {
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(MASTERED_KEY) ?? '[]');
    if (!Array.isArray(saved)) return [];
    return [...new Set(saved.filter((id): id is DSEQuestionId =>
      typeof id === 'string' && DSE_QUESTION_IDS.some(known => known === id)))];
  } catch {
    // Malformed data, unavailable localStorage, and server rendering must not break practice.
    return [];
  }
}

interface WorkspaceProps {
  question: DSEQuestion;
  mastered: boolean;
  onMaster: (id: DSEQuestionId) => void;
  onVariant: () => void;
  onRandom: () => void;
}

function PracticeWorkspace({ question, mastered, onMaster, onVariant, onRandom }: WorkspaceProps) {
  const { lang } = useLang();
  const l = (value: DSEText) => value[lang];
  const pick = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const [answer, setAnswer] = useState('');
  const [answerFeedback, setAnswerFeedback] = useState<DSEAnswerCheck | null>(null);
  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [visibleSteps, setVisibleSteps] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);
  const strategy = question.strategies.find(item => item.id === strategyId);
  const solutionId = `dse-solution-${question.id}`;
  const hintId = `dse-hint-${question.id}`;

  function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = checkDSEAnswer(question, answer);
    setAnswerFeedback(result);
    if (result.status === 'correct') onMaster(question.id);
  }

  return (
    <article className="dse-workspace" aria-labelledby="dse-problem-title">
      <header className="dse-problem-header">
        <div className="dse-problem-heading">
          <span className="dse-story-emoji" aria-hidden="true">{question.storyEmoji}</span>
          <div>
            <p className="dse-eyebrow">{pick('原創題型 · 隨機參數', 'ORIGINAL TEMPLATE · RANDOM PARAMETERS')}</p>
            <h2 id="dse-problem-title">{l(question.title)}</h2>
          </div>
        </div>
        <div className="dse-badges">
          <span className="dse-badge dse-badge-teal">{l(DSE_TOPICS[question.topic])}</span>
          <span className="dse-badge">{l(DSE_DIFFICULTIES[question.difficulty])}</span>
          <span className="dse-badge dse-badge-gold">{pick(`自學建議 ${question.suggestedMarks} 分 · 非官方`, `${question.suggestedMarks} suggested self-study marks · unofficial`)}</span>
          {mastered && <span className="dse-badge dse-badge-teal"><CheckCircle2 size={13} aria-hidden="true" />{pick('題型已完成', 'Template complete')}</span>}
        </div>
        <p className="dse-problem-text">{l(question.problem)}</p>
        <div className="dse-outcome-note">
          <strong>{pick('我們正在數甚麼？', 'What is one outcome?')}</strong>
          <p>{l(question.sampleSpace)}</p>
        </div>
        <div className="dse-problem-actions">
          <button type="button" className="dse-button" onClick={onVariant}><RefreshCw size={15} aria-hidden="true" />{pick('同題型新變式', 'New variant')}</button>
          <button type="button" className="dse-button dse-button-subtle" onClick={onRandom} title={pick('從四個題型隨機選另一題；會清除主題篩選', 'Choose another of the four templates; clears the topic filter')}><Shuffle size={15} aria-hidden="true" />{pick('隨機另一題', 'Random other question')}</button>
          <span className="dse-variant-label">{question.variantKey}</span>
        </div>
      </header>

      <section className="dse-practice-section" aria-labelledby="dse-strategy-title">
        <div className="dse-section-heading">
          <span className="dse-section-number" aria-hidden="true">01</span>
          <div><h3 id="dse-strategy-title">{pick('先想策略', 'Choose your strategy')}</h3><p>{pick('選一個最合適的方法，再看看理由。', 'Pick the most suitable approach and learn why.')}</p></div>
        </div>
        <fieldset className="dse-strategies">
          <legend className="dse-sr-only">{pick('單選：解題策略', 'Single choice: solution strategy')}</legend>
          {question.strategies.map((item, index) => (
            <label className={`dse-strategy${strategyId === item.id ? ' dse-strategy-selected' : ''}`} key={item.id}>
              <input type="radio" name={`dse-strategy-${question.id}`} value={item.id} checked={strategyId === item.id} onChange={() => setStrategyId(item.id)} />
              <span className="dse-strategy-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span>{l(item.label)}</span>
            </label>
          ))}
        </fieldset>
        {strategy && (
          <div className={`dse-feedback ${strategy.correct ? 'dse-feedback-success' : 'dse-feedback-review'}`} role="status">
            <strong>{strategy.correct ? pick('策略正確', 'Good strategy') : pick('再想一想', 'Rethink this approach')}</strong>
            <p>{l(strategy.feedback)}</p>
          </div>
        )}
        <button type="button" className="dse-text-button" aria-expanded={showHint} aria-controls={hintId} onClick={() => setShowHint(value => !value)}><Lightbulb size={16} aria-hidden="true" />{showHint ? pick('收起提示', 'Hide hint') : pick('需要一點提示？', 'Need a hint?')}</button>
        {showHint && <aside className="dse-hint" id={hintId}><strong>{pick('思考提示', 'Thinking hint')}</strong><p>{l(question.hint)}</p><div className="dse-formula"><KatexRenderer latex={question.hintFormula} display /></div></aside>}
      </section>

      <section className="dse-practice-section" aria-labelledby="dse-answer-title">
        <div className="dse-section-heading">
          <span className="dse-section-number" aria-hidden="true">02</span>
          <div><h3 id="dse-answer-title">{pick('試寫答案', 'Try an answer')}</h3><p>{pick('先自行計算，再核對。', 'Work it out first, then check.')}</p></div>
        </div>
        <form className="dse-answer-form" onSubmit={submitAnswer} noValidate>
          <div className="dse-answer-field">
            <label htmlFor="dse-answer-input">{pick('你的答案', 'Your answer')}</label>
            <input id="dse-answer-input" type="text" inputMode="text" autoComplete="off" spellCheck={false} maxLength={160} value={answer}
              placeholder={question.answer.kind === 'count' ? pick('例如 120 或 240/2', 'e.g. 120 or 240/2') : pick('例如 3/7 或 0.4286', 'e.g. 3/7 or 0.4286')}
              aria-describedby={`dse-answer-rule${answerFeedback ? ' dse-answer-feedback' : ''}`}
              aria-invalid={answerFeedback !== null && answerFeedback.status !== 'correct'}
              onChange={event => { setAnswer(event.target.value); setAnswerFeedback(null); }} />
          </div>
          <button type="submit" className="dse-button dse-button-primary" disabled={!answer.trim()}>{pick('核對答案', 'Check answer')}<ArrowRight size={16} aria-hidden="true" /></button>
        </form>
        <p className="dse-answer-rule" id="dse-answer-rule">{question.answer.kind === 'count'
          ? pick('接受整數、等值分數或精確小數。方法數必須完全相等，沒有近似容差。', 'Integers, equivalent fractions and exact decimals are accepted. Counts must match exactly; no approximation tolerance.')
          : pick('接受精確分數；非精確小數請至少輸入小數點後 4 位（絕對誤差 ≤ 0.00005）。精確整數或小數不受位數限制。不接受百分號或算式。', 'Use an exact fraction, or a non-exact decimal with at least 4 places (absolute error ≤ 0.00005). Exact integers or decimals have no minimum precision. No percentages or expressions.')}</p>
        {answerFeedback && <div id="dse-answer-feedback" role="status" className={`dse-feedback ${answerFeedback.status === 'correct' ? 'dse-feedback-success' : 'dse-feedback-review'}`}><strong>{answerFeedback.status === 'correct' ? pick('答對了', 'Correct') : answerFeedback.status === 'invalid' ? pick('檢查輸入格式', 'Check the input format') : answerFeedback.status === 'precision' ? pick('需要更多小數位', 'More decimal places needed') : pick('再試一次', 'Try again')}</strong><p>{l(answerFeedback.feedback)}</p></div>}
      </section>

      <section className="dse-practice-section dse-solution-section" aria-labelledby="dse-solution-title">
        <div className="dse-solution-heading">
          <div className="dse-section-heading">
            <span className="dse-section-number" aria-hidden="true">03</span>
            <div><h3 id="dse-solution-title">{pick('逐步理解', 'Reason it through')}</h3><p>{pick('每次揭示一步，留意常見錯誤。', 'Reveal one step at a time and watch for common mistakes.')}</p></div>
          </div>
          <button type="button" className={`dse-button dse-button-small${showAnimation ? ' dse-button-on' : ''}`} aria-expanded={showAnimation} aria-controls="dse-concept-animation" onClick={() => setShowAnimation(value => !value)}>{showAnimation ? pick('收起動畫', 'Hide animation') : pick('概念動畫', 'Concept animation')}</button>
        </div>
        {showAnimation && <aside className="dse-animation" id="dse-concept-animation"><CountingAnimation kind={question.animationKind} scenario={question.scenario} compact /><p>{pick('動畫以簡化例子說明方法，不代表本變式的實際人數或答案。', 'The animation illustrates the method with a simplified example, not the exact quantities or answer of this variant.')}</p></aside>}
        <div className="dse-step-toolbar">
          <span className="dse-step-counter" role="status">{pick(`已揭示 ${visibleSteps} / ${question.steps.length} 步`, `${visibleSteps} / ${question.steps.length} steps revealed`)}</span>
          <button type="button" className="dse-text-button" onClick={() => setVisibleSteps(question.steps.length)} disabled={visibleSteps === question.steps.length} aria-controls={solutionId}>{pick('揭示全部', 'Reveal all')}</button>
        </div>
        <div id={solutionId} className="dse-solution-content">
          {visibleSteps === 0 && <div className="dse-unrevealed"><BookOpen size={27} aria-hidden="true" /><p>{pick('解答暫時收起。準備好便揭示第一步。', 'The solution is hidden. Reveal the first step when you are ready.')}</p></div>}
          <ol className="dse-step-list">
            {question.steps.slice(0, visibleSteps).map((item, index) => (
              <li key={index} className={`dse-step${index === visibleSteps - 1 ? ' dse-step-current' : ''}`}>
                <div className="dse-step-title"><span className="dse-step-number">{index + 1}</span><h4>{l(item.title)}</h4></div>
                <div className="dse-formula"><KatexRenderer latex={item.formula} display /></div>
                <p className="dse-step-prose">{l(item.explanation)}</p>
                <p className="dse-common-mistake"><strong>{pick('常見錯誤：', 'Common mistake: ')}</strong>{l(item.commonMistake)}</p>
              </li>
            ))}
          </ol>
          {visibleSteps === question.steps.length && <div className="dse-final-answer"><span>{pick('精確答案', 'Exact answer')}</span><div className="dse-formula"><KatexRenderer latex={question.answerLatex} display /></div><p>{pick('自行再做一次並核對答案，才會記錄完成；查看解答不會自動完成題型。', 'Try again and check your answer to record completion. Viewing the solution does not complete the template.')}</p></div>}
        </div>
        <div className="dse-step-navigation">
          <button type="button" className="dse-button" disabled={visibleSteps === 0} onClick={() => setVisibleSteps(value => Math.max(0, value - 1))} aria-controls={solutionId}><ChevronLeft size={16} aria-hidden="true" />{pick('上一步', 'Previous')}</button>
          <button type="button" className="dse-button dse-button-primary" disabled={visibleSteps === question.steps.length} onClick={() => setVisibleSteps(value => Math.min(question.steps.length, value + 1))} aria-controls={solutionId}>{visibleSteps === 0 ? pick('揭示第一步', 'Reveal first step') : pick('揭示下一步', 'Next step')}<ChevronRight size={16} aria-hidden="true" /></button>
        </div>
      </section>
    </article>
  );
}

export default function DSEPage() {
  const { lang } = useLang();
  const pick = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const l = (value: DSEText) => value[lang];
  const [questions, setQuestions] = useState(generateDSEQuestions);
  const [selectedId, setSelectedId] = useState<DSEQuestionId>('office-roles');
  const [filter, setFilter] = useState<DSETopic | 'all'>('all');
  const [mastered, setMastered] = useState<DSEQuestionId[]>(loadMastered);
  const current = questions.find(question => question.id === selectedId) ?? questions[0];
  const filtered = questions.filter(question => filter === 'all' || question.topic === filter);

  useEffect(() => {
    try { window.localStorage.setItem(MASTERED_KEY, JSON.stringify(mastered)); }
    catch { /* Storage may be disabled; in-session progress still works. */ }
  }, [mastered]);

  function changeFilter(nextFilter: DSETopic | 'all') {
    setFilter(nextFilter);
    if (nextFilter !== 'all' && current.topic !== nextFilter) {
      const next = questions.find(question => question.topic === nextFilter);
      if (next) setSelectedId(next.id);
    }
  }

  function newVariant() {
    const replacement = generateDSEVariant(current);
    setQuestions(items => items.map(item => item.id === current.id ? replacement : item));
  }

  function randomOther() {
    const other = questions.filter(question => question.id !== current.id);
    const next = other[Math.floor(Math.random() * other.length)];
    if (next) { setSelectedId(next.id); setFilter('all'); }
  }

  function markMastered(id: DSEQuestionId) {
    setMastered(ids => ids.includes(id) ? ids : [...ids, id]);
  }

  return (
    <div className="dse-page" lang={lang === 'zh' ? 'zh-Hant' : 'en'}>
      <header className="dse-page-header">
        <div><p className="dse-eyebrow">{pick('數學實驗室 · HKDSE 自學', 'MATHS LAB · HKDSE SELF-STUDY')}</p><h1>{pick('DSE 練習室', 'DSE Practice Studio')}</h1><p className="dse-page-subtitle">{pick('四個生活情境，練習由辨認結果到建立方法。', 'Four everyday scenarios. Learn to define outcomes and choose a method.')}</p></div>
        <div className="dse-header-note"><BookOpen size={23} aria-hidden="true" /><span>{pick('理解方法，不只背公式。', 'Understand the method, not just the formula.')}</span></div>
      </header>
      <aside className="dse-original-notice"><span className="dse-original-label">{pick('原創練習', 'ORIGINAL PRACTICE')}</span><p>{l(DSE_ORIGINAL_NOTICE)}</p></aside>
      <div className="dse-mobile-switch"><label htmlFor="dse-mobile-question">{pick('選擇題型', 'Choose a question')}</label><select id="dse-mobile-question" value={selectedId} onChange={event=>{setSelectedId(event.target.value as DSEQuestionId);setFilter('all');}}>{questions.map(question=><option key={question.id} value={question.id}>{l(question.title)}</option>)}</select><span>{mastered.length} / 4</span></div>
      <div className="dse-layout">
        <aside className="dse-rail" aria-label={pick('題目選單及進度', 'Question selection and progress')}>
          <section className="dse-progress-card" aria-labelledby="dse-progress-title">
            <div className="dse-progress-top"><h2 id="dse-progress-title">{pick('你的學習進度', 'Your progress')}</h2><span>{mastered.length}<small> / 4</small></span></div>
            <progress className="dse-progress" value={mastered.length} max={4} aria-label={pick('已完成題型數', 'Completed templates')} />
            <p className="dse-progress-message">{mastered.length === 0 ? pick('0 / 4 完成。先選一道題，答對後便記錄第一個題型。', '0 / 4 complete. Choose a question and check a correct answer to complete your first template.') : mastered.length === 4 ? pick('4 / 4 完成！用新變式測試是否真正掌握。', '4 / 4 complete! Test your understanding with fresh variants.') : pick(`已完成 ${mastered.length} 個題型，繼續探索其他方法。`, `${mastered.length} templates complete. Explore the remaining methods.`)}</p>
            <p className="dse-storage-note">{pick('進度按題型而非每個變式計算；可用時儲存於此瀏覽器，沒有上傳。', 'Progress tracks templates, not individual variants. Saved in this browser when available; never uploaded.')}</p>
            {mastered.length > 0 && <button type="button" className="dse-text-button" onClick={() => setMastered([])}>{pick('重設完成記錄', 'Reset completion')}</button>}
          </section>
          <section className="dse-question-bank" aria-labelledby="dse-bank-title">
            <div className="dse-bank-heading"><h2 id="dse-bank-title">{pick('題型選單', 'Question bank')}</h2><span>{filtered.length} / 4</span></div>
            <label className="dse-filter-label" htmlFor="dse-topic-filter">{pick('按主題篩選', 'Filter by topic')}</label>
            <select id="dse-topic-filter" className="dse-topic-filter" value={filter} onChange={event => changeFilter(event.target.value as DSETopic | 'all')}>
              <option value="all">{pick('所有主題', 'All topics')}</option>
              {TOPICS.map(topic => <option key={topic} value={topic}>{l(DSE_TOPICS[topic])}</option>)}
            </select>
            <div className="dse-question-cards">
              {filtered.map(question => <button type="button" key={question.id} className={`dse-question-card${question.id === current.id ? ' dse-question-active' : ''}`} aria-pressed={question.id === current.id} onClick={() => setSelectedId(question.id)}>
                <span className="dse-card-emoji" aria-hidden="true">{question.storyEmoji}</span>
                <span className="dse-question-card-copy"><strong>{l(question.title)}</strong><span>{l(DSE_TOPICS[question.topic])}</span><small>{l(DSE_DIFFICULTIES[question.difficulty])} · {pick(`自學 ${question.suggestedMarks} 分`, `${question.suggestedMarks} self-study marks`)}</small></span>
                {mastered.includes(question.id) ? <CheckCircle2 className="dse-card-check" size={18} aria-label={pick('已完成', 'Complete')} /> : <ChevronRight className="dse-card-arrow" size={17} aria-hidden="true" />}
              </button>)}
            </div>
          </section>
          <section className="dse-reference-card" aria-labelledby="dse-references-title">
            <h2 id="dse-references-title">{pick('課程與官方參考', 'Curriculum & official references')}</h2>
            <p>{pick('本練習涵蓋不同物件、不重複的排列與組合，並結合相鄰條件及概率。圓形排列與貝氏定理並非必修部分要求；應用程式其他位置保留作延伸學習，不納入這四題。', 'This practice covers permutations and combinations of distinct objects without repetition, including adjacency and probability. Circular permutations and Bayes’ theorem are not required in the compulsory part; elsewhere in the app they remain extension topics, outside these four templates.')}</p>
            <a href={DSE_REFERENCES.curriculum} target="_blank" rel="noopener noreferrer">{pick('教育局：數學課程及評估指引', 'EDB: Mathematics curriculum guide')}<ExternalLink size={13} aria-hidden="true" /></a>
            <a href={DSE_REFERENCES.assessment} target="_blank" rel="noopener noreferrer">{pick('考評局：HKDSE 數學科資料', 'HKEAA: HKDSE Mathematics information')}<ExternalLink size={13} aria-hidden="true" /></a>
            <small>{pick('以上連結僅供查閱官方資料；本頁題目及建議分數均非官方。', 'Links are for official reference only. These questions and suggested marks are unofficial.')}</small>
          </section>
        </aside>
        <PracticeWorkspace key={current.variantKey} question={current} mastered={mastered.includes(current.id)} onMaster={markMastered} onVariant={newVariant} onRandom={randomOther} />
      </div>
    </div>
  );
}
