import { useEffect, useId, useState } from 'react';
import { LayoutGroup, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CircleAlert, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import type { AnimationCopy, ContextAnimationModel, ContextRow } from '../lib/contextAnimation';
import KatexRenderer from './KatexRenderer';
import './CountingAnimation.css';
import './ContextAnimation.css';

/** Embedded lessons receive the current problem, identities, constraints and formula from their page. */
export default function ContextAnimation({ model }: { model: ContextAnimationModel }) {
  const { lang } = useLang();
  const text = (value: AnimationCopy) => value[lang];
  const tr = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const id = useId();
  const reduced = useReducedMotion();
  const [playback, setPlayback] = useState({ key: model.key, step: 0, playing: false });
  const [speed, setSpeed] = useState(1);
  const last = Math.max(0, model.steps.length - 1);
  const step = playback.key === model.key ? Math.min(playback.step, last) : 0;
  const playing = playback.key === model.key && playback.playing;
  const current = model.steps[step];
  const duration = reduced ? 0 : 0.24;
  const items = new Map(model.items.map(item => [item.id, item]));
  const occurrences = new Map<string, number>();
  current?.rows.forEach(row => row.ids.forEach(itemId => { if (itemId) occurrences.set(itemId, (occurrences.get(itemId) ?? 0) + 1); }));

  useEffect(() => {
    if (playback.key === model.key) return;
    const frame = requestAnimationFrame(() => setPlayback({ key: model.key, step: 0, playing: false }));
    return () => cancelAnimationFrame(frame);
  }, [model.key, playback.key]);
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => setPlayback(previous => {
      if (previous.key !== model.key || !previous.playing) return previous;
      const next = Math.min(previous.step + 1, last);
      return { ...previous, step: next, playing: next < last };
    }), 5500 / speed);
    return () => clearTimeout(timer);
  }, [playing, step, model.key, last, speed]);

  const go = (next: number, play = false) => setPlayback({ key: model.key, step: Math.max(0, Math.min(next, last)), playing: play });
  const token = (itemId: string, rowIndex: number) => {
    const item = items.get(itemId);
    if (!item) return <span className="ctx-placeholder" aria-label={tr('尚未填入的位置', 'Unfilled position')}>?</span>;
    return <motion.span key={itemId} layout={!reduced} layoutId={`${id}-item-${itemId}${(occurrences.get(itemId) ?? 0) > 1 ? `-comparison-${rowIndex}` : ''}`} transition={{ duration, ease: 'easeInOut' }}
      className={`ca-token ctx-token ${item.category === 'A' ? 'ca-token-adult' : ''}`} data-item-id={itemId} data-category={item.category} aria-label={text(item.label)} title={text(item.label)}>
      <span className="ctx-emoji" aria-hidden="true">{item.emoji}</span><span className="ctx-identity">{itemId.replace(/^([a-z]+)-(\d+)$/i, (_, prefix: string, number: string) => prefix[0].toUpperCase() + number)}</span>
    </motion.span>;
  };
  const renderRow = (row: ContextRow, rowIndex: number) => {
    const style = row.style ?? 'pool';
    const highlight = new Set(row.highlightIds ?? []);
    const firstBundle = row.ids.findIndex(value => highlight.has(value));
    return <div className={`ctx-row ctx-row-${style}`} key={rowIndex}>
      <p className="ca-row-label">{text(row.label)}</p>
      {style === 'circle' ? <div className="ctx-circle" role="group" aria-label={text(row.label)}>{row.ids.map((itemId, index) => {
        const angle = 2 * Math.PI * index / Math.max(1, row.ids.length) - Math.PI / 2;
        return <div className="ctx-circle-position" style={{ left: `${50 + 40 * Math.cos(angle)}%`, top: `${50 + 40 * Math.sin(angle)}%` }} key={itemId}>{token(itemId, rowIndex)}</div>;
      })}<span className="ctx-circle-center">{tr('固定一個身份', 'Fix one identity')}</span></div> :
      <motion.div layout={!reduced} transition={{ duration }} className={`ctx-track ${style === 'team' ? 'ctx-team-track' : ''}`}>
        {style === 'gaps' ? Array.from({ length: row.ids.length + 1 }, (_, index) => <div className="ctx-gap-piece" key={index}>
          <span className={`ctx-gap ${row.gapIndices?.includes(index) ? 'ctx-gap-selected' : ''}`}><small>{index + 1}</small>{row.gapIndices?.includes(index) ? '✓' : '·'}</span>
          {index < row.ids.length && token(row.ids[index], rowIndex)}
        </div>) : row.ids.map((itemId, index) => {
          if (style === 'bundle' && highlight.has(itemId)) {
            if (index !== firstBundle) return null;
            return <motion.div layout={!reduced} transition={{ duration }} className="ctx-bundle" key="bundle"><small>{tr('捆綁單元', 'One bundle')}</small><div>{row.ids.filter(value => highlight.has(value)).map(value => token(value, rowIndex))}</div></motion.div>;
          }
          return style === 'line' || row.roles ? <div className={`ctx-position ${highlight.has(itemId) ? 'ctx-position-highlight' : ''}`} key={`${itemId || 'empty'}-${index}`}>
            <span className="ca-place-label">{row.roles?.[index] ? text(row.roles[index]) : tr(`第 ${index + 1} 位`, `Place ${index + 1}`)}</span>{token(itemId, rowIndex)}
          </div> : token(itemId, rowIndex);
        })}
        {!row.ids.length && <span className="ca-empty-note">{tr('此階段沒有物件在這裡', 'No objects here at this stage')}</span>}
      </motion.div>}
    </div>;
  };
  if (!current) return null;
  return <MotionConfig reducedMotion="user"><section className="ca-module ca-compact ctx-module" data-model-key={model.key} aria-labelledby={`${id}-title`}>
    <header className="ca-header"><div><p className="ca-eyebrow">{tr('跟隨本頁題目 · 動畫推導', 'THIS PAGE’S PROBLEM · ANIMATED REASONING')}</p><h2 className="ca-heading" id={`${id}-title`}>{text(model.title)}</h2></div><span className="ca-demo-badge">{tr('使用本題數字及條件', 'Current numbers & conditions')}</span></header>
    <div className="ca-question"><p>{text(model.question)}</p></div>
    <div className="ca-stage ctx-stage" role="group" aria-label={tr('本題情境動畫', 'Animation of the current problem')}><LayoutGroup id={id}>{current.rows.map(renderRow)}</LayoutGroup></div>
    <p className="ctx-example-note">{tr('圖像展示本題的一條推導路徑／一個身份示例；總方法數由算式計算，並非只計畫面上的安排。', 'The diagram shows one reasoning path or identity example for this problem. The formula counts all outcomes, not just the pictured arrangement.')}</p>
    <div className="ca-progress" aria-hidden="true">{model.steps.map((_, index) => <span key={index} className={`ca-progress-segment ${index <= step ? 'ca-progress-segment-filled' : ''}`} />)}</div>
    <div className="ca-step-heading"><span className="ca-step-number">{tr(`步驟 ${step + 1} / ${model.steps.length}`, `Step ${step + 1} of ${model.steps.length}`)}</span><span className="ca-playback-status">{playing ? tr('播放中', 'Playing') : step === last ? tr('已完成', 'Complete') : tr('已暫停', 'Paused')}</span></div>
    <div className="ca-explanation" aria-live="polite" aria-atomic="true"><h3 className="ca-step-title">{text(current.title)}</h3><div className="ca-formula"><KatexRenderer display latex={current.latex} /></div>
      <div className="ca-reason"><Lightbulb className="ca-detail-icon" aria-hidden="true"/><div><h4>{tr('為甚麼？', 'Why?')}</h4><p>{text(current.reason)}</p></div></div>
      <div className="ca-pitfall"><CircleAlert className="ca-detail-icon" aria-hidden="true"/><div><h4>{tr('易錯提醒', 'Watch out')}</h4><p>{text(current.pitfall)}</p></div></div>
    </div>
    <nav className="ca-controls" aria-label={tr('本題動畫播放控制', 'Current problem playback controls')}>
      <button type="button" className="ca-control" onClick={() => go(step - 1)} disabled={step === 0} aria-label={tr('上一步，並暫停', 'Previous step and pause')}><ChevronLeft className="ca-control-icon"/><span>{tr('上一步', 'Previous')}</span></button>
      <button type="button" className="ca-control ca-control-primary" onClick={() => go(step === last ? 0 : step, !playing)} aria-label={playing ? tr('暫停動畫', 'Pause animation') : tr('播放動畫', 'Play animation')} aria-pressed={playing}>{playing ? <Pause className="ca-control-icon"/> : <Play className="ca-control-icon"/>}<span>{playing ? tr('暫停', 'Pause') : tr('播放', 'Play')}</span></button>
      <button type="button" className="ca-control" onClick={() => go(step + 1)} disabled={step === last} aria-label={tr('下一步，並暫停', 'Next step and pause')}><span>{tr('下一步', 'Next')}</span><ChevronRight className="ca-control-icon"/></button>
      <button type="button" className="ca-control" onClick={() => go(0, true)} aria-label={tr('從第一步重播', 'Replay from the first step')}><RotateCcw className="ca-control-icon"/><span>{tr('重播', 'Replay')}</span></button>
    </nav>
    <footer className="ca-footer"><p>{reduced ? tr('已減少動態效果；仍可逐步閱讀。', 'Reduced motion is on; step-by-step reading remains available.') : tr('更換題目、數量或條件後，動畫會重設並跟隨新題目。', 'Changing the problem, counts or conditions resets the animation to the new problem.')}</p><label className="ca-speed-label" htmlFor={`${id}-speed`}>{tr('速度', 'Speed')}<select id={`${id}-speed`} className="ca-select ca-speed-select" value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label></footer>
  </section></MotionConfig>;
}
