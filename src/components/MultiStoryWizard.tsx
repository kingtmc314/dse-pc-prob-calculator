import { useId, useRef, useState } from 'react';
import { BookOpen, Check, ChevronLeft, ChevronRight, Layers, LockKeyhole, Play, Plus, Trash2, Users } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import type { AnimationCopy, ContextAnimationModel } from '../lib/contextAnimation';
import { calculateMulti } from '../lib/multiCounting';
import { buildMultiAnimation } from '../lib/multiAnimation';
import { buildMultiItems, MULTI_MAX_GROUPS, MULTI_MAX_ITEMS, type MultiGroup, type MultiMode, type MultiProblem, type MultiResult, type MultiBundle } from '../lib/multiTypes';
import ContextAnimation from './ContextAnimation';
import KatexRenderer from './KatexRenderer';
import './MultiStoryWizard.css';

type StoryKey = 'office' | 'school' | 'restaurant' | 'family';
type QuotaKind = 'any' | 'exactly' | 'min' | 'max' | 'range';
type FixedKind = 'head' | 'tail' | 'position';
interface QuotaEditor { kind: QuotaKind; value: number; min: number; max: number }
interface FixedRule { itemId: string; kind: FixedKind; position: number }
interface Story { name: AnimationCopy; description: AnimationCopy; categories: { label: AnimationCopy; emoji: string }[] }
const copy = (zh: string, en: string): AnimationCopy => ({ zh, en });
const STORIES: Record<StoryKey, Story> = {
  office: {
    name: copy('辦公室選拔', 'Office Selection'),
    description: copy('經理、員工和實習生選委員會，或排隊合照。', 'Managers, staff and interns choose a committee or line up for a photo.'),
    categories: [{ label: copy('經理', 'Manager'), emoji: '👔' }, { label: copy('員工', 'Staff'), emoji: '💼' }, { label: copy('實習生', 'Intern'), emoji: '🧑‍💻' }],
  },
  school: {
    name: copy('影畢業相', 'Graduation Photo'),
    description: copy('老師、學生和嘉賓一起影相，或選出代表。', 'Teachers, students and guests take a photo or choose representatives.'),
    categories: [{ label: copy('老師', 'Teacher'), emoji: '👨‍🏫' }, { label: copy('學生', 'Student'), emoji: '🧑‍🎓' }, { label: copy('嘉賓', 'Guest'), emoji: '🙋' }],
  },
  restaurant: {
    name: copy('茶餐廳點菜', 'Cha Chaan Teng'),
    description: copy('從主食、飲品和甜品中選擇，或安排上菜次序。', 'Choose mains, drinks and desserts, or arrange their serving order.'),
    categories: [{ label: copy('主食', 'Main Dish'), emoji: '🍛' }, { label: copy('飲品', 'Drink'), emoji: '🥤' }, { label: copy('甜品', 'Dessert'), emoji: '🍮' }],
  },
  family: {
    name: copy('家庭聚餐', 'Family Gathering'),
    description: copy('成人、兒童和長輩圍坐、排隊，或選出代表。', 'Adults, children and elders sit around a table, line up or choose representatives.'),
    categories: [{ label: copy('成人', 'Adult'), emoji: '👨' }, { label: copy('兒童', 'Child'), emoji: '👦' }, { label: copy('長輩', 'Elder'), emoji: '🧓' }],
  },
};
function presetGroups(key: StoryKey, firstId = 1): MultiGroup[] {
  return STORIES[key].categories.map((category, index) => ({ ...category, id: `g${firstId + index}`, count: [2, 3, 1][index] }));
}
const validCount = (count: number) => Number.isInteger(count) && count >= 0 && count <= MULTI_MAX_ITEMS;

export default function MultiStoryWizard() {
  const { lang } = useLang();
  const text = (value: AnimationCopy) => value[lang];
  const tr = (zh: string, en: string) => lang === 'zh' ? zh : en;
  const uid = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextGroup = useRef(4);
  const nextBundle = useRef(1);
  const [step, setStep] = useState(1);
  const [reached, setReached] = useState(1);
  const [storyKey, setStoryKey] = useState<StoryKey>('office');
  const [groups, setGroups] = useState<MultiGroup[]>(() => presetGroups('office'));
  const [mode, setMode] = useState<MultiMode>('line');
  const [selectCount, setSelectCount] = useState(3);
  const [bundles, setBundles] = useState<MultiBundle[]>([]);
  const [fixedRules, setFixedRules] = useState<FixedRule[]>([]);
  const [quotaEditors, setQuotaEditors] = useState<Record<string, QuotaEditor>>({});
  const [picked, setPicked] = useState<string[]>([]);
  const [fixedPerson, setFixedPerson] = useState('');
  const [fixedKind, setFixedKind] = useState<FixedKind>('head');
  const [fixedPosition, setFixedPosition] = useState(1);
  const [notice, setNotice] = useState<AnimationCopy | null>(null);
  const [actionError, setActionError] = useState<AnimationCopy | null>(null);
  const [result, setResult] = useState<MultiResult | null>(null);
  const [animation, setAnimation] = useState<ContextAnimationModel | null>(null);
  const [profileLimit, setProfileLimit] = useState(8);
  const story = STORIES[storyKey];
  const total = groups.reduce((sum, group) => sum + group.count, 0);
  const items = buildMultiItems(groups.map(group => ({ ...group, count: validCount(group.count) ? group.count : 0 })));
  const itemMap = new Map(items.map(item => [item.id, item]));
  const bundled = new Set(bundles.flatMap(bundle => bundle.itemIds));
  const fixedPeople = new Set(fixedRules.map(rule => rule.itemId));
  const isSelection = mode === 'select' || mode === 'selectArrange';
  const editorFor = (group: MultiGroup): QuotaEditor => quotaEditors[group.id] ?? { kind: 'any', value: Math.min(1, group.count), min: 0, max: group.count };
  const positionOf = (rule: FixedRule) => rule.kind === 'head' ? 1 : rule.kind === 'tail' ? total : rule.position;
  const problem: MultiProblem = {
    groups,
    mode,
    selectCount,
    bundles: isSelection ? [] : bundles,
    fixed: mode === 'line' ? fixedRules.map(rule => ({ itemId: rule.itemId, position: positionOf(rule) })) : [],
    quotas: isSelection ? groups.flatMap(group => {
      const q = editorFor(group);
      if (q.kind === 'any') return [];
      return [{ groupId: group.id, min: q.kind === 'exactly' ? q.value : q.kind === 'min' ? q.value : q.kind === 'range' ? q.min : 0, max: q.kind === 'exactly' || q.kind === 'max' ? q.value : q.kind === 'range' ? q.max : group.count }];
    }) : [],
  };
  const categoryError = groups.length < 1 || groups.length > MULTI_MAX_GROUPS
    ? copy('請保留 1 至 8 個類別。', 'Keep between 1 and 8 categories.')
    : groups.some(group => !validCount(group.count))
      ? copy('每個類別的數量必須是 0 至 16 的整數。', 'Each category count must be an integer from 0 to 16.')
      : total < 1 || total > MULTI_MAX_ITEMS
        ? copy(`目前總數 ${total}；請將相異物件總數設為 1 至 16。`, `The total is ${total}; use 1–16 distinct objects altogether.`)
        : groups.some(group => !group.label.zh.trim() || !group.label.en.trim() || !group.emoji.trim())
          ? copy('請為每個類別填寫名稱及圖示。', 'Give every category a name and an icon.') : null;
  const selectionError = isSelection && (!Number.isInteger(selectCount) || selectCount < 0 || selectCount > total)
    ? copy(`選取數量 r 必須是 0 至 ${total} 的整數。`, `Selection size r must be an integer from 0 to ${total}.`) : null;
  const quotaError = isSelection && problem.quotas.some(quota => {
    const count = groups.find(group => group.id === quota.groupId)?.count ?? 0;
    return !Number.isInteger(quota.min) || !Number.isInteger(quota.max) || quota.min < 0 || quota.max > count || quota.min > quota.max;
  }) ? copy('每個類別須符合 0 ≤ 下限 ≤ 上限 ≤ 該類別數量。不同類別的條件會同時套用。', 'For each category, use 0 ≤ minimum ≤ maximum ≤ its count. All category rules apply together.') : null;
  const validation = categoryError ?? selectionError ?? quotaError;
  const resetOutput = () => { setResult(null); setAnimation(null); setActionError(null); setProfileLimit(8); };
  const goTo = (next: number) => {
    setStep(next);
    setReached(previous => Math.max(previous, next));
    requestAnimationFrame(() => headingRef.current?.focus({ preventScroll: true }));
  };

  // Identity IDs survive name edits and deletion of other groups. Only removed
  // identities are pruned; a bundle with fewer than two survivors is no rule.
  const changeGroups = (next: MultiGroup[]) => {
    resetOutput();
    setGroups(next);
    const safe = next.map(group => ({ ...group, count: validCount(group.count) ? group.count : 0 }));
    const surviving = new Set(buildMultiItems(safe).map(item => item.id));
    const nextTotal = safe.reduce((sum, group) => sum + group.count, 0);
    let changed = false;
    const cleanedBundles = bundles.flatMap(bundle => {
      const ids = bundle.itemIds.filter(id => surviving.has(id));
      if (ids.length !== bundle.itemIds.length) changed = true;
      return ids.length >= 2 ? [{ ...bundle, itemIds: ids }] : [];
    });
    const cleanedFixed = fixedRules.filter(rule => surviving.has(rule.itemId) && (rule.kind !== 'position' || rule.position <= nextTotal));
    if (cleanedFixed.length !== fixedRules.length || (nextTotal !== total && cleanedFixed.some(rule => rule.kind === 'tail'))) changed = true;
    const cleanedQuotas: Record<string, QuotaEditor> = {};
    for (const [id, q] of Object.entries(quotaEditors)) {
      const group = next.find(value => value.id === id);
      if (!group) { changed = true; continue; }
      if (!validCount(group.count)) { cleanedQuotas[id] = q; continue; }
      const trimmed = { ...q, value: Math.min(q.value, group.count), min: Math.min(q.min, group.count), max: Math.min(q.max, group.count) };
      if (trimmed.value !== q.value || trimmed.min !== q.min || trimmed.max !== q.max) changed = true;
      cleanedQuotas[id] = trimmed;
    }
    setBundles(cleanedBundles);
    setFixedRules(cleanedFixed);
    setQuotaEditors(cleanedQuotas);
    setPicked(previous => previous.filter(id => surviving.has(id)));
    if (!surviving.has(fixedPerson)) setFixedPerson('');
    if (selectCount > nextTotal) { setSelectCount(nextTotal); changed = true; }
    if (changed) setNotice(copy('類別已更新：移除失效身份及定點規則，少於兩人的捆綁已取消，配額已縮至可用數量；隊尾位置及選取數量亦已更新。請重新核對條件。', 'Categories updated: removed identities and invalid fixed rules were pruned, bundles with fewer than two members were removed, and quotas were trimmed to availability. Last-position rules and selection size were updated too. Review the rules before calculating.'));
  };
  const chooseStory = (key: StoryKey) => {
    if (key === storyKey) return;
    resetOutput();
    setStoryKey(key);
    setGroups(presetGroups(key));
    setBundles([]); setFixedRules([]); setQuotaEditors({}); setPicked([]); setFixedPerson(''); setSelectCount(3);
    setNotice(copy('已載入新情境的三個類別（2、3、1）。舊身份及全部附加條件已清除，動作模式保留。', 'Loaded this story’s three categories (2, 3, 1). Previous identities and all extra restrictions were cleared; the action mode is retained.'));
  };
  const chooseMode = (next: MultiMode) => {
    if (next === mode) return;
    resetOutput();
    const nextSelection = next === 'select' || next === 'selectArrange';
    const cleared: AnimationCopy[] = [];
    if (nextSelection && bundles.length) { setBundles([]); cleared.push(copy('相鄰捆綁', 'adjacency bundles')); }
    if (next !== 'line' && fixedRules.length) { setFixedRules([]); cleared.push(copy('個別定點', 'individual fixed positions')); }
    if (!nextSelection && Object.values(quotaEditors).some(q => q.kind !== 'any')) { setQuotaEditors({}); cleared.push(copy('類別選取配額', 'category selection quotas')); }
    setMode(next); setPicked([]); setFixedPerson('');
    setNotice(cleared.length
      ? copy(`已切換模式並明確清除不適用的條件：${cleared.map(value => value.zh).join('、')}。其他適用條件保留。`, `Mode changed. Inapplicable restrictions were cleared: ${cleared.map(value => value.en).join(', ')}. Compatible rules were retained.`)
      : copy('模式已切換，沒有不適用的已加入條件。相鄰／定點只用於相應排列模式，類別配額只用於選取模式。', 'Mode changed; no added rules needed clearing. Adjacency/fixed rules belong to their arrangement modes, and quotas belong only to selection modes.'));
  };
  const updateQuota = (group: MultiGroup, update: Partial<QuotaEditor>) => {
    resetOutput();
    setQuotaEditors(previous => ({ ...previous, [group.id]: { ...editorFor(group), ...update } }));
  };
  const addBundle = () => {
    resetOutput();
    const ids = picked.filter(id => itemMap.has(id) && !bundled.has(id));
    if (ids.length < 2) { setActionError(copy('請選至少兩個未被捆綁的相異身份。', 'Select at least two distinct identities that are not already bundled.')); return; }
    setBundles(previous => [...previous, { id: `b${nextBundle.current++}`, itemIds: ids }]);
    setPicked([]);
  };
  const addFixed = () => {
    resetOutput();
    const position = fixedKind === 'head' ? 1 : fixedKind === 'tail' ? total : fixedPosition;
    if (!itemMap.has(fixedPerson) || fixedPeople.has(fixedPerson)) { setActionError(copy('請選一個尚未被指定位置的身份。', 'Choose an identity without an existing fixed-position rule.')); return; }
    if (!Number.isInteger(position) || position < 1 || position > total) { setActionError(copy(`指定位置必須是 1 至 ${total} 的整數。`, `A fixed position must be an integer from 1 to ${total}.`)); return; }
    if (fixedRules.some(rule => positionOf(rule) === position)) { setActionError(copy('這個位置已有另一個身份。請移除原規則或選擇其他位置。', 'Another identity already occupies this position. Remove that rule or choose another position.')); return; }
    setFixedRules(previous => [...previous, { itemId: fixedPerson, kind: fixedKind, position }]);
    setFixedPerson('');
  };
  const calculate = () => {
    setAnimation(null); setActionError(null); setResult(null);
    if (validation) { setActionError(validation); return; }
    try { setResult(calculateMulti(problem)); }
    catch { setActionError(copy('未能完成計算。請檢查人數和全部條件後再試。', 'The calculation could not be completed. Check the counts and all restrictions, then try again.')); }
  };
  const showAnimation = () => {
    if (!result?.valid) return;
    if (animation) { setAnimation(null); return; }
    try { setAnimation(buildMultiAnimation(problem, result, story.name)); }
    catch { setActionError(copy('未能載入本題動畫；精確答案及推導仍可閱讀。', 'The current animation could not load; the exact answer and reasoning remain available.')); }
  };
  const modeName: Record<MultiMode, AnimationCopy> = {
    line: copy('直線全排列', 'Arrange everyone in a line'),
    circle: copy('圓形全排列', 'Arrange everyone in a circle'),
    select: copy('只選取，不計次序', 'Select without order'),
    selectArrange: copy('先選取，再排列', 'Select, then arrange'),
  };
  const steps = [copy('選情境', 'Story'), copy('設類別', 'Categories'), copy('選動作', 'Action'), copy('加條件', 'Rules'), copy('看推導', 'Solution')];
  const stepTitles = [copy('從一個熟悉的故事開始', 'Start with a familiar story'), copy('誰在這個故事裡？', 'Who belongs in your story?'), copy('選人，還是排次序？', 'Select a set, or arrange an order?'), copy('把條件說清楚', 'Make every restriction explicit'), copy('由條件走到精確答案', 'From your rules to an exact answer')];
  const identity = (id: string, place?: number) => {
    const item = itemMap.get(id);
    if (!item) return null;
    return <span className="multi-identity" key={id} title={`${text(item.label)} · ${id}`} data-item-id={id}>
      {place !== undefined && <small className="multi-place">{tr(`第 ${place} 位`, `Place ${place}`)}</small>}
      <span className="multi-identity-emoji" aria-hidden="true">{item.emoji}</span>
      <span className="multi-identity-name">{text(item.label)}</span><code>{id}</code>
    </span>;
  };
  const quotaDescription = (group: MultiGroup) => {
    const q = editorFor(group);
    return q.kind === 'any' ? tr('不限', 'Unrestricted') : q.kind === 'exactly' ? tr(`恰好 ${q.value}`, `Exactly ${q.value}`) : q.kind === 'min' ? tr(`至少 ${q.value}`, `At least ${q.value}`) : q.kind === 'max' ? tr(`至多 ${q.value}`, `At most ${q.value}`) : tr(`${q.min} 至 ${q.max}`, `${q.min}–${q.max}`);
  };
  const summary = () => <section className="multi-summary" aria-label={tr('全部已加入條件摘要', 'Summary of all applied rules')}>
    <h3><BookOpen size={17} aria-hidden="true" />{tr('本題條件摘要', 'Your problem, at a glance')}</h3>
    <p><strong>{text(story.name)}</strong> · {text(modeName[mode])}{isSelection ? ` · r = ${selectCount}` : ` · n = ${total}`}</p>
    <ul>
      {groups.map(group => <li key={group.id}>{group.emoji} {text(group.label)} <code>{group.id}</code> × {group.count}{isSelection && <> · <strong>{quotaDescription(group)}</strong></>}</li>)}
      {!isSelection && bundles.map((bundle, index) => <li key={bundle.id}><strong>{tr(`捆綁 ${index + 1}`, `Bundle ${index + 1}`)}:</strong> {bundle.itemIds.map(id => `${itemMap.get(id) ? text(itemMap.get(id)!.label) : id} [${id}]`).join(' + ')}</li>)}
      {mode === 'line' && fixedRules.map(rule => <li key={rule.itemId}><strong>{itemMap.get(rule.itemId) ? text(itemMap.get(rule.itemId)!.label) : rule.itemId} [{rule.itemId}]</strong> → {rule.kind === 'head' ? tr('隊頭（第 1 位）', 'First (place 1)') : rule.kind === 'tail' ? tr(`隊尾（第 ${total} 位）`, `Last (place ${total})`) : tr(`第 ${rule.position} 位`, `Place ${rule.position}`)}</li>)}
    </ul>
    {!isSelection && !bundles.length && !fixedRules.length && <p className="multi-muted">{tr('沒有附加條件；所有身份各自相異。', 'No extra restrictions; every identity is distinct.')}</p>}
    {isSelection && <p className="multi-muted">{tr('以上類別配額同時生效；不套用相鄰捆綁或定點規則。', 'All category quotas apply simultaneously; adjacency bundles and fixed positions do not apply.')}</p>}
  </section>;
  const bundleBuilder = () => <section className="multi-rule-card" aria-labelledby={`${uid}-bundles`}>
    <h3 id={`${uid}-bundles`}><Layers size={18} aria-hidden="true" />{tr('個別身份相鄰捆綁', 'Build an adjacency bundle')}</h3>
    <p className="multi-muted">{tr('跨類別勾選任意兩個或以上身份，加入一個相鄰整體。內部次序可交換；不同捆綁互不重疊，不要求整個類別一起。', 'Pick any two or more identities, even across categories, to form one consecutive block. Internal order is free. Separate bundles are disjoint; you do not have to bundle a whole category.')}</p>
    {groups.map(group => <fieldset className="multi-pick-group" key={group.id}>
      <legend>{group.emoji} {text(group.label)} <code>{group.id}</code></legend>
      <div className="multi-pick-grid">{items.filter(item => item.groupId === group.id).map(item => <label className={`multi-pick ${bundled.has(item.id) ? 'multi-pick-used' : ''} ${picked.includes(item.id) ? 'multi-pick-selected' : ''}`} key={item.id}>
        <input type="checkbox" data-testid={`multi-pick-${item.id}`} checked={picked.includes(item.id)} disabled={bundled.has(item.id)} onChange={event => { resetOutput(); setPicked(previous => event.target.checked ? [...previous, item.id] : previous.filter(id => id !== item.id)); }} />
        <span aria-hidden="true">{item.emoji}</span><span><strong>{text(item.label)}</strong><code>{item.id}</code>{bundled.has(item.id) && <small>{tr('已在捆綁內', 'Already bundled')}</small>}</span>
      </label>)}</div>
      {!group.count && <p className="multi-muted">{tr('此類別沒有身份。', 'No identities in this category.')}</p>}
    </fieldset>)}
    <div className="multi-inline-actions"><button type="button" className="btn-secondary" data-testid="multi-add-bundle" disabled={picked.length < 2} onClick={addBundle}><Plus size={16} aria-hidden="true" />{tr('加入捆綁', 'Add bundle')}</button><span className="multi-muted">{tr(`已勾選 ${picked.length} 個（按加入才生效）`, `${picked.length} checked (apply with Add bundle)`)}</span></div>
    <div className="multi-rule-list">{bundles.map((bundle, index) => <div className="multi-added-rule" key={bundle.id}>
      <div><strong>{tr(`捆綁 ${index + 1}`, `Bundle ${index + 1}`)}</strong><div className="multi-token-row">{bundle.itemIds.map(id => identity(id))}</div></div>
      <button type="button" className="multi-delete" aria-label={tr(`移除捆綁 ${index + 1}`, `Remove bundle ${index + 1}`)} onClick={() => { resetOutput(); setBundles(previous => previous.filter(value => value.id !== bundle.id)); }}><Trash2 size={16} aria-hidden="true" />{tr('移除', 'Remove')}</button>
    </div>)}</div>
  </section>;

  return <section className="multi-wizard" data-testid="multi-wizard" aria-label={tr('多類別排列組合故事精靈', 'Multi-category permutation and combination story wizard')}>
    <header className="multi-intro"><div><p className="multi-eyebrow">{tr('故事解題室 · 相異身份精確計數', 'STORY WORKSPACE · EXACT DISTINCT-IDENTITY COUNTING')}</p><h2>{tr('讓每個身份，都有自己的位置。', 'Every identity has a part to play.')}</h2><p>{tr('不限 A、B 兩類：把你的情境、身份和條件，逐步變成可理解的算式。', 'Go beyond two categories: turn your story, identities and restrictions into reasoning you can follow.')}</p></div><span className="multi-capacity"><Users size={16} aria-hidden="true" />{tr('1–8 類 · 最多 16 個', '1–8 groups · up to 16 items')}</span></header>
    <nav className="multi-progress" aria-label={tr('五步解題導覽', 'Five-step problem navigation')}>
      <ol>{steps.map((label, index) => { const number = index + 1; const blocked = number > reached || (number >= 3 && !!categoryError) || (number >= 4 && !!selectionError) || (number >= 5 && !!quotaError); return <li key={number}><button type="button" data-testid={`multi-nav-step-${number}`} className={`multi-progress-button ${step === number ? 'multi-current' : ''} ${number < step ? 'multi-done' : ''}`} aria-current={step === number ? 'step' : undefined} disabled={blocked} onClick={() => goTo(number)}><span className="multi-progress-number">{number < step ? <Check size={15} aria-hidden="true" /> : number}</span><span>{text(label)}</span></button></li>; })}</ol>
    </nav>
    {notice && <div className="multi-notice" role="status"><span>{text(notice)}</span><button type="button" onClick={() => setNotice(null)} aria-label={tr('關閉更新提示', 'Dismiss update notice')}>×</button></div>}
    <div className="multi-body" data-testid={`multi-step-${step}`}>
      <div className="multi-section-heading"><span className="multi-section-index">0{step}</span><div><h2 ref={headingRef} tabIndex={-1}>{text(stepTitles[step - 1])}</h2><p>{step === 1 ? tr('沿用熟悉情境，再自由增加類別。', 'A familiar starting point, with room for more categories.') : `${text(story.name)} · ${tr('每個圖示都是一個相異身份', 'Each icon represents a distinct identity')}`}</p></div></div>
      {step === 1 && <div className="multi-story-grid">{(Object.keys(STORIES) as StoryKey[]).map(key => <button type="button" className={`multi-story-card ${storyKey === key ? 'multi-selected' : ''}`} key={key} aria-pressed={storyKey === key} data-testid={`multi-story-${key}`} onClick={() => chooseStory(key)}><span className="multi-story-emojis" aria-hidden="true">{STORIES[key].categories.map(category => category.emoji).join(' ')}</span><strong>{text(STORIES[key].name)}</strong><span className="multi-story-description">{text(STORIES[key].description)}</span><span className="multi-story-selection">{storyKey === key ? <><Check size={14} aria-hidden="true" />{tr('已選情境', 'Selected story')}</> : tr('選用此情境', 'Choose this story')}</span></button>)}</div>}
      {step === 2 && <>
        <div className="multi-section-tools"><p className="multi-muted">{tr('名稱可自訂（編輯會同步兩種語言），圖示及數量亦可修改。', 'Customize names (edits update both languages), icons and counts.')}</p><span className={`multi-total ${categoryError ? 'multi-total-invalid' : ''}`}>{tr('總數', 'Total')} <strong>{Number.isFinite(total) ? total : '—'}</strong> / 16</span></div>
        <div className="multi-group-list">{groups.map(group => <div className="multi-group" data-testid={`multi-group-${group.id}`} key={group.id}>
          <div className="multi-group-id"><code>{group.id}</code></div>
          <label className="multi-field multi-icon-field"><span>{tr('圖示', 'Icon')}</span><input type="text" className="multi-input" aria-label={tr(`${text(group.label)}圖示`, `${text(group.label)} icon`)} value={group.emoji} maxLength={24} onChange={event => changeGroups(groups.map(value => value.id === group.id ? { ...value, emoji: event.target.value } : value))} /></label>
          <label className="multi-field multi-name-field"><span>{tr('類別名稱', 'Category name')}</span><input type="text" className="multi-input" data-testid={`multi-group-name-${group.id}`} value={text(group.label)} maxLength={60} onChange={event => changeGroups(groups.map(value => value.id === group.id ? { ...value, label: copy(event.target.value, event.target.value) } : value))} /></label>
          <label className="multi-field multi-count-field"><span>{tr('數量', 'Count')}</span><input type="number" className="multi-input" data-testid={`multi-group-count-${group.id}`} min={0} max={16} step={1} value={Number.isFinite(group.count) ? group.count : ''} aria-invalid={!validCount(group.count)} onChange={event => changeGroups(groups.map(value => value.id === group.id ? { ...value, count: event.target.value === '' ? 0 : Number(event.target.value) } : value))} /></label>
          <button type="button" className="multi-delete multi-group-delete" disabled={groups.length <= 1} aria-label={tr(`刪除類別 ${text(group.label)}`, `Delete category ${text(group.label)}`)} onClick={() => changeGroups(groups.filter(value => value.id !== group.id))}><Trash2 size={17} aria-hidden="true" /><span>{tr('刪除', 'Delete')}</span></button>
        </div>)}</div>
        <div className="multi-inline-actions"><button type="button" className="btn-secondary" data-testid="multi-add-group" disabled={groups.length >= MULTI_MAX_GROUPS} onClick={() => { const id = `g${nextGroup.current++}`; changeGroups([...groups, { id, label: copy(`新類別 ${id}`, `New category ${id}`), emoji: '🙋', count: total < 16 ? 1 : 0 }]); }}><Plus size={16} aria-hidden="true" />{tr('新增類別', 'Add category')}</button><span className="multi-muted">{groups.length} / 8 {tr('類別', 'categories')}</span></div>
        {categoryError && <p className="multi-error" role="alert">{text(categoryError)}</p>}
        <section className="multi-preview"><h3>{tr('全部相異身份 · 即時預覽', 'All distinct identities · live preview')}</h3><p className="multi-muted">{tr('同類別也不是相同物件。編號固定；刪除類別不會重新編號其他類別。', 'Members of the same category are still distinct. IDs stay stable; deleting a category does not renumber the others.')}</p><div className="multi-token-row">{items.map(item => identity(item.id))}</div>{!items.length && <p className="multi-muted">{tr('請加入至少一個身份。', 'Add at least one identity.')}</p>}</section>
      </>}
      {step === 3 && <>
        <div className="multi-mode-grid">{(['line', 'select', 'selectArrange', 'circle'] as MultiMode[]).map(value => <button type="button" className={`multi-mode-card ${mode === value ? 'multi-selected' : ''}`} data-testid={`multi-mode-${value}`} key={value} aria-pressed={mode === value} onClick={() => chooseMode(value)}><span className="multi-mode-symbol">{value === 'line' ? 'P' : value === 'select' ? 'C' : value === 'selectArrange' ? 'C × P' : '↻ P'}</span><strong>{text(modeName[value])}</strong><span>{value === 'line' ? tr('全部入列，次序不同就算不同。', 'Everyone is included; order matters.') : value === 'select' ? tr('選 r 個；同一組成員只算一次。', 'Choose r; each member set counts once.') : value === 'selectArrange' ? tr('先選 r 個，再排這 r 個的次序。', 'Choose r, then order those r identities.') : tr('全部圍坐；旋轉相同，鏡像不同。', 'Everyone sits around; rotations match, reflections differ.')}</span></button>)}</div>
        <div className="multi-mode-explanation"><KatexRenderer display latex={mode === 'line' ? `${total}!` : mode === 'circle' ? `(${total}-1)!` : mode === 'select' ? `\\binom{${total}}{r}` : `\\binom{${total}}{r}\\times r!`} /><p>{tr('上式是沒有附加條件的基本模型；下一步加入條件後，須按條件推導。', 'This is the unrestricted base model. Added rules in the next step require adjusted reasoning.')}</p>{mode === 'circle' && <p className="multi-circle-note">{tr('圓桌沒有編號座位：固定一個身份作參考，只是消除旋轉重複。順時針與逆時針的鏡像不合併，不再除以 2。', 'The circle has no numbered seats. Anchor one identity only to remove rotational duplicates. A reflected order is not merged with the original; do not divide by 2.')}</p>}</div>
        {isSelection && <label className="multi-field multi-select-size"><span>{tr(`選取數量 r（0–${total}）`, `Selection size r (0–${total})`)}</span><input type="number" className="multi-input" min={0} max={total} step={1} data-testid="multi-select-count" value={Number.isFinite(selectCount) ? selectCount : ''} aria-invalid={!!selectionError} onChange={event => { resetOutput(); setSelectCount(event.target.value === '' ? 0 : Number(event.target.value)); }} /></label>}
        {selectionError && <p className="multi-error" role="alert">{text(selectionError)}</p>}
      </>}
      {step === 4 && <>
        {!isSelection && bundleBuilder()}
        {mode === 'line' && <section className="multi-rule-card" aria-labelledby={`${uid}-fixed`}><h3 id={`${uid}-fixed`}><LockKeyhole size={18} aria-hidden="true" />{tr('指定個別身份的位置', 'Fix an individual identity to a position')}</h3><p className="multi-muted">{tr('選一個確實身份，而不是整個類別。可以加入多個定點；所有定點及捆綁須同時成立。', 'Choose a specific identity, not a whole category. Add multiple fixed rules; all fixed rules and bundles must hold simultaneously.')}</p>
          <div className="multi-fixed-fields"><label className="multi-field multi-fixed-person-field"><span>{tr('哪個身份？', 'Which identity?')}</span><select className="multi-input" data-testid="multi-fixed-person" value={fixedPerson} onChange={event => { resetOutput(); setFixedPerson(event.target.value); }}><option value="">{tr('選擇身份', 'Choose an identity')}</option>{items.map(item => <option key={item.id} value={item.id} disabled={fixedPeople.has(item.id)}>{item.emoji} {text(item.label)} · {item.id}{fixedPeople.has(item.id) ? tr('（已有定點）', ' (already fixed)') : ''}</option>)}</select></label>
          <label className="multi-field"><span>{tr('位置類型', 'Position type')}</span><select className="multi-input" data-testid="multi-fixed-kind" value={fixedKind} onChange={event => { resetOutput(); setFixedKind(event.target.value as FixedKind); }}><option value="head">{tr('隊頭（第一位）', 'First position')}</option><option value="tail">{tr('隊尾（最後一位）', 'Last position')}</option><option value="position">{tr('指定第 k 位', 'Arbitrary place k')}</option></select></label>
          {fixedKind === 'position' && <label className="multi-field multi-position-field"><span>{tr(`第 k 位（1–${total}）`, `Place k (1–${total})`)}</span><input className="multi-input" type="number" data-testid="multi-fixed-position" min={1} max={total} step={1} value={Number.isFinite(fixedPosition) ? fixedPosition : ''} onChange={event => { resetOutput(); setFixedPosition(event.target.value === '' ? 0 : Number(event.target.value)); }} /></label>}</div>
          <button type="button" className="btn-secondary" data-testid="multi-add-fixed" disabled={!fixedPerson} onClick={addFixed}><Plus size={16} aria-hidden="true" />{tr('加入定點', 'Add fixed position')}</button>
          <div className="multi-rule-list">{fixedRules.map(rule => <div className="multi-added-rule" key={rule.itemId}><div className="multi-fixed-rule-label">{identity(rule.itemId)}<strong>→ {rule.kind === 'head' ? tr('隊頭 · 第 1 位', 'First · place 1') : rule.kind === 'tail' ? tr(`隊尾 · 第 ${total} 位`, `Last · place ${total}`) : tr(`第 ${rule.position} 位`, `Place ${rule.position}`)}</strong></div><button type="button" className="multi-delete" aria-label={tr(`移除 ${rule.itemId} 的定點`, `Remove fixed position for ${rule.itemId}`)} onClick={() => { resetOutput(); setFixedRules(previous => previous.filter(value => value.itemId !== rule.itemId)); }}><Trash2 size={16} aria-hidden="true" />{tr('移除', 'Remove')}</button></div>)}</div>
        </section>}
        {mode === 'circle' && <div className="multi-circle-note"><LockKeyhole size={17} aria-hidden="true" /><p>{tr('沒有首位或尾位（隊頭／隊尾）：無編號圓桌不提供定點控制。捆綁表示沿圓周連續相鄰，可以跨過示例圖的起點；旋轉視為相同，鏡像仍不同。', 'No first or last place: an unnumbered circle has no fixed-position controls. Bundles are consecutive around the circle and may cross the example’s starting point. Rotations count as the same; reflections remain different.')}</p></div>}
        {isSelection && <section className="multi-rule-card"><h3><Users size={18} aria-hidden="true" />{tr('每個類別的選取配額', 'Selection quotas for every category')}</h3><p className="multi-muted">{tr(`合共選 ${selectCount} 個；各類別條件同時成立。無共同選法時答案為 0，不代表算式出錯。`, `Choose ${selectCount} altogether; every category rule must hold at once. If no profile satisfies all rules, the answer is 0, not a calculation error.`)}</p>
          <div className="multi-quota-list">{groups.map(group => { const q = editorFor(group); return <div className="multi-quota-row" key={group.id}><div className="multi-quota-name"><span aria-hidden="true">{group.emoji}</span><strong>{text(group.label)}</strong><small>{tr(`可用 ${group.count} 個`, `${group.count} available`)} · <code>{group.id}</code></small></div><label className="multi-field"><span>{tr('選取條件', 'Selection rule')}</span><select className="multi-input" data-testid={`multi-quota-${group.id}`} value={q.kind} onChange={event => updateQuota(group, { kind: event.target.value as QuotaKind })}><option value="any">{tr('不限', 'Unrestricted')}</option><option value="exactly">{tr('恰好', 'Exactly')}</option><option value="min">{tr('至少', 'At least')}</option><option value="max">{tr('至多', 'At most')}</option><option value="range">{tr('自訂上下限', 'Custom min–max')}</option></select></label>
          {q.kind !== 'any' && q.kind !== 'range' && <label className="multi-field multi-quota-value"><span>{tr('數量', 'Value')}</span><input type="number" className="multi-input" data-testid={`multi-quota-value-${group.id}`} min={0} max={group.count} step={1} value={Number.isFinite(q.value) ? q.value : ''} onChange={event => updateQuota(group, { value: event.target.value === '' ? 0 : Number(event.target.value) })} /></label>}
          {q.kind === 'range' && <div className="multi-quota-range"><label className="multi-field"><span>{tr('下限', 'Min')}</span><input type="number" className="multi-input" data-testid={`multi-quota-min-${group.id}`} min={0} max={group.count} step={1} value={Number.isFinite(q.min) ? q.min : ''} onChange={event => updateQuota(group, { min: event.target.value === '' ? 0 : Number(event.target.value) })} /></label><span aria-hidden="true">–</span><label className="multi-field"><span>{tr('上限', 'Max')}</span><input type="number" className="multi-input" data-testid={`multi-quota-max-${group.id}`} min={0} max={group.count} step={1} value={Number.isFinite(q.max) ? q.max : ''} onChange={event => updateQuota(group, { max: event.target.value === '' ? 0 : Number(event.target.value) })} /></label></div>}</div>; })}</div>
          {quotaError && <p className="multi-error" role="alert">{text(quotaError)}</p>}
        </section>}
        {summary()}
      </>}
      {step === 5 && <>
        {summary()}
        <div className="multi-calculate-row"><button type="button" className="btn-primary" data-testid="multi-calculate" disabled={!!validation} onClick={calculate}>{tr('計算並查看推導', 'Calculate & explain')}<ChevronRight size={17} aria-hidden="true" /></button><p className="multi-muted">{tr('使用 BigInt 精確整數，不以浮點數近似。', 'Exact BigInt integers, not floating-point approximations.')}</p></div>
        {validation && <p className="multi-error" role="alert">{text(validation)}</p>}
        {result && !result.valid && <p className="multi-error" role="alert">{result.error ? text(result.error) : tr('題目設定無效，請返回檢查條件。', 'Invalid problem settings. Go back and check the rules.')}</p>}
        {result?.valid && <div className="multi-result" aria-live="polite">
          <div className="multi-answer-card"><p className="multi-eyebrow">{tr('符合全部條件的方法數', 'OUTCOMES SATISFYING EVERY RULE')}</p><output data-testid="multi-answer" className="multi-answer" aria-label={tr('精確答案', 'Exact answer')}>{result.count.toString()}</output><p>{tr('種方法', 'distinct outcomes')}</p></div>
          {result.count === 0n && <div className="multi-zero" role="status"><strong>{tr('有效題目，答案為 0。', 'Valid problem, zero outcomes.')}</strong><p>{tr('沒有安排或選法能同時滿足全部條件。這不是輸入錯誤，也不能展示不存在的「合法示例」。下方推導會解釋為何沒有共同可行的情況。', 'No arrangement or selection satisfies every rule simultaneously. This is not an input error, and there is no legal example to display. The reasoning below explains the empty set of feasible outcomes.')}</p></div>}
          <section className="multi-working" aria-label={tr('逐步推導及易錯提醒', 'Step-by-step reasoning and pitfalls')}>{result.steps.map((solution, index) => <article className="multi-solution-step" key={index}><span className="multi-solution-number">{index + 1}</span><div><h3>{text(solution.title)}</h3><p>{text(solution.reason)}</p><div className="multi-formula"><KatexRenderer display latex={solution.latex} /></div><p className="multi-pitfall"><strong>{tr('易錯提醒：', 'Watch out: ')}</strong>{text(solution.pitfall)}</p></div></article>)}</section>
          {isSelection && result.profiles.length > 0 && <section className="multi-profile-working" data-testid="multi-profiles">
            <h3>{tr('分類計算：每類選幾個？', 'Case-by-case calculation: how many from each category?')}</h3>
            <p className="multi-muted">{tr(`共有 ${result.profiles.length} 種合法分配。每種先乘各類組合數，再把不同分配相加；全部分配均已計入答案。`, `There are ${result.profiles.length} legal category profiles. Multiply binomial counts within a profile, then add the profiles. Every profile is included in the answer.`)}</p>
            {result.profiles.slice(0, profileLimit).map((profile, index) => <article className="multi-profile" key={index}>
              <p><strong>{tr(`分配 ${index + 1}`, `Profile ${index + 1}`)}</strong> · {groups.map((group, i) => `${text(group.label)} ${profile.counts[i]}`).join(' + ')}</p>
              <div className="multi-formula"><KatexRenderer display latex={`${groups.map((group, i) => `\\binom{${group.count}}{${profile.counts[i]}}`).join('\\times ')}=${profile.ways}`} /></div>
            </article>)}
            {profileLimit < result.profiles.length && <div className="multi-inline-actions"><button type="button" className="btn-secondary" onClick={() => setProfileLimit(previous => previous + 8)}>{tr('再顯示 8 個分配', 'Show 8 more profiles')}</button><span className="multi-muted">{tr(`已展示 ${Math.min(profileLimit, result.profiles.length)} / ${result.profiles.length}；未展示的亦已計入。`, `Showing ${Math.min(profileLimit, result.profiles.length)} of ${result.profiles.length}; hidden profiles are also counted.`)}</span></div>}
            <div className="multi-formula"><KatexRenderer display latex={`S=${result.profiles.length <= 8 ? `${result.profiles.map(profile => profile.ways.toString()).join('+')}=` : ''}${result.profiles.reduce((sum, profile) => sum + profile.ways, 0n)}`} /></div>
            {mode === 'selectArrange' && <p className="multi-muted">{tr('這裡的 S 是選取方法數；先選後排的答案再乘 r!，如上方推導所示。', 'Here S counts selections. The select-then-arrange answer multiplies S by r!, as shown above.')}</p>}
          </section>}
          {result.count > 0n && <section className="multi-preview multi-example" data-testid="multi-example">
            <h3>{tr('一個符合全部條件的完整示例', 'One complete example satisfying every rule')}</h3>
            <p className="multi-muted">{mode === 'select' ? tr('只展示入選集合，不計圖示排列次序。', 'This is the selected set; the display order does not count.') : mode === 'circle' ? tr('按順時針讀取；第一個圖示只是閱讀起點，不是固定座位。', 'Read clockwise; the first icon is just a reading anchor, not a fixed seat.') : tr('由左至右依次排列；編號是相異身份。', 'Read the full order from left to right; IDs mark distinct identities.')}</p>
            {mode === 'circle' ? <div className={`multi-circle ${result.example.length > 10 ? 'multi-circle-dense' : ''}`} role="group" aria-label={tr('順時針圓形排列示例', 'Clockwise circular arrangement example')}>
              {result.example.map((id, index) => { const angle = 2 * Math.PI * index / Math.max(1, result.example.length) - Math.PI / 2; return <div className="multi-circle-position" key={id} style={{ left: `${50 + 38 * Math.cos(angle)}%`, top: `${50 + 38 * Math.sin(angle)}%` }}>{identity(id)}</div>; })}
              <span className="multi-circle-center">{tr('旋轉相同，鏡像不同', 'Rotations match; reflections differ')}</span>
            </div> : <div className="multi-token-row">{result.example.map((id, index) => identity(id, mode === 'line' || mode === 'selectArrange' ? index + 1 : undefined))}</div>}
            {!result.example.length && <p>{tr('空集合 ∅：選取 0 個的合法示例。', 'The empty set ∅ is a legal example of choosing 0 items.')}</p>}
            <p className="multi-muted">{tr('圖像只展示其中一種方法，並非用圖示數量當答案。', 'The picture shows one outcome, not the total number of outcomes.')}</p>
          </section>}
          <button type="button" className="btn-secondary multi-animation-button" data-testid="multi-show-animation" aria-expanded={!!animation} aria-controls={`${uid}-animation`} onClick={showAnimation}><Play size={17} aria-hidden="true" />{animation ? tr('收起本題動畫', 'Hide this problem’s animation') : tr('本題動畫', 'Animate this problem')}</button>
          {animation && <div id={`${uid}-animation`} className="multi-animation"><ContextAnimation model={animation} /></div>}
        </div>}
      </>}
      {actionError && <p className="multi-error" role="alert">{text(actionError)}</p>}
      <nav className="multi-step-navigation" aria-label={tr('步驟控制', 'Step controls')}><button type="button" className="btn-secondary" data-testid="multi-back" onClick={() => goTo(step - 1)} disabled={step === 1}><ChevronLeft size={16} aria-hidden="true" />{tr('上一步', 'Back')}</button><span className="multi-muted">{tr(`第 ${step} / 5 步`, `Step ${step} of 5`)}</span>{step < 5 ? <button type="button" className="btn-primary" data-testid="multi-next" disabled={(step === 2 && !!categoryError) || (step === 3 && !!(categoryError || selectionError)) || (step === 4 && !!validation)} onClick={() => goTo(step + 1)}>{step === 4 ? tr('核對題目', 'Review problem') : tr('下一步', 'Next')}<ChevronRight size={16} aria-hidden="true" /></button> : <button type="button" className="btn-secondary" onClick={() => goTo(1)}>{tr('返回情境', 'Back to story')}</button>}</nav>
    </div>
  </section>;
}
