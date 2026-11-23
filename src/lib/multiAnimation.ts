import { animationCopy as copy, type AnimationCopy, type ContextAnimationModel, type ContextRow, type ContextStep } from './contextAnimation';
import { buildMultiItems, type MultiProblem, type MultiResult } from './multiTypes';

/** Same identities, rules, exact engine steps and legal witness as the current wizard. */
export function buildMultiAnimation(problem: MultiProblem, result: MultiResult, story: AnimationCopy): ContextAnimationModel {
  const source = buildMultiItems(problem.groups);
  const names = new Map(source.map(item => [item.id, item.label]));
  const selection = problem.mode === 'select' || problem.mode === 'selectArrange';
  const circle = problem.mode === 'circle';
  const bundles = problem.bundles.map((bundle, index) => ({ id: bundle.id, ids: bundle.itemIds,
    label: copy(`綑綁 ${index + 1}`, `Bundle ${index + 1}`),
  }));
  const summary = (lang: 'zh' | 'en') => {
    const groupText = problem.groups.map(group => `${group.count} ${group.label[lang]}`).join(lang === 'zh' ? '、' : ', ');
    const modeText = lang === 'zh' ? (selection ? `選 ${problem.selectCount} 個${problem.mode === 'selectArrange' ? '後排次序' : '（不計次序）'}` : circle ? '圓形排列，旋轉視作相同' : '全體排成一行') :
      (selection ? `select ${problem.selectCount}${problem.mode === 'selectArrange' ? ' then arrange' : ' without order'}` : circle ? 'arrange around an unnumbered circle; rotations are identical' : 'arrange everyone in one line');
    const rules = selection ? problem.quotas.map(quota => {
      const group = problem.groups.find(value => value.id === quota.groupId);
      return `${group?.label[lang] ?? quota.groupId}: ${quota.min}–${quota.max}`;
    }) : [
      ...problem.bundles.map((bundle, index) => `${lang === 'zh' ? '綑綁' : 'Bundle'} ${index + 1}: ${bundle.itemIds.map(id => names.get(id)?.[lang] ?? id).join(' + ')}`),
      ...problem.fixed.map(fixed => `${names.get(fixed.itemId)?.[lang] ?? fixed.itemId} → ${lang === 'zh' ? `第 ${fixed.position} 位` : `place ${fixed.position}`}`),
    ];
    return `${story[lang]} · ${groupText}；${modeText}${rules.length ? `。${rules.join('；')}` : ''}`;
  };
  const pool: ContextRow = { label: copy('本題完整候選身份（同類仍各自不同）', 'All original identities (distinct even within one category)'), ids: source.map(item => item.id), style: 'pool' };
  const fixedIds = new Set(problem.fixed.map(fixed => fixed.itemId));
  const roles = source.map((_, index) => copy(`第 ${index + 1} 位${problem.fixed.some(fixed => fixed.position === index + 1) ? ' · 固定' : ''}`, `Place ${index + 1}${problem.fixed.some(fixed => fixed.position === index + 1) ? ' · fixed' : ''}`));
  const legal: ContextRow = {
    label: result.count > 0n ? copy(selection ? '符合所有類別條件的一個選取示例' : '同時符合所有條件的一個完整安排', selection ? 'One selection satisfying every category quota' : 'One complete arrangement satisfying every rule') : copy('所有條件不能同時成立：沒有合法示例', 'No legal example: these rules cannot hold together'),
    ids: result.example,
    style: circle ? 'circle' : problem.mode === 'select' ? 'team' : 'line',
    bundleGroups: selection ? undefined : bundles,
    highlightIds: selection ? undefined : [...fixedIds],
    roles: !selection && !circle ? roles : undefined,
  };
  const remaining: ContextRow = { label: copy('尚未選中的身份', 'Identities not selected'), style: 'pool', ids: source.filter(item => !result.example.includes(item.id)).map(item => item.id) };
  const finalRows = selection && result.count > 0n ? [legal, remaining] : [legal];
  const constraintRows: ContextRow[] = [];
  if (!selection && bundles.length) {
    // A contraction diagram, not a claim that this intermediate order satisfies pins.
    const bundledIds = new Set(bundles.flatMap(bundle => bundle.ids));
    const contracted = [...bundles.flatMap(bundle => bundle.ids), ...source.filter(item => !bundledIds.has(item.id)).map(item => item.id)];
    constraintRows.push({ label: copy('只展示綑綁單元；位置條件下一步才一起核對', 'Contract bundles first; position rules are checked jointly later'), style: 'bundle', ids: contracted, bundleGroups: bundles });
  }
  if (!selection && !circle && problem.fixed.length) {
    const slots = source.map(() => '');
    problem.fixed.forEach(fixed => { if (fixed.position >= 1 && fixed.position <= slots.length) slots[fixed.position - 1] = fixed.itemId; });
    constraintRows.push({ label: copy('指定身份的固定位置（? 尚未填入）', 'Pinned identities in their exact places (? means unfilled)'), ids: slots, style: 'line', highlightIds: [...fixedIds], roles });
  }
  if (!constraintRows.length) constraintRows.push(selection && result.count > 0n ? legal : pool);
  const intro: ContextStep = {
    title: copy('先讀本題的身份、數量與動作', 'Read the identities, counts and action'),
    reason: copy(`共有 ${source.length} 個相異身份。${selection ? `每次選 ${problem.selectCount} 個；每類條件必須同時成立。` : '即使圖案一樣，身份標籤不同，仍是不同人物／物件。'}`, `There are ${source.length} distinct identities. ${selection ? `Choose ${problem.selectCount}; every category quota must hold together.` : 'Matching icons do not mean identical objects: each identity is distinct.'}`),
    pitfall: copy('不可把所有角色硬分成 A/B，亦不可把同類身份當成相同物件。', 'Do not force every story into A/B or treat distinct identities as identical objects.'),
    latex: `n=${source.length}${selection ? `,\\quad r=${problem.selectCount}` : ''}`,
    rows: [pool],
  };
  const steps: ContextStep[] = [intro, ...result.steps.map((step, index) => ({ ...step, rows: index === 0 ? constraintRows : finalRows }))];
  steps.push({
    title: copy(result.count > 0n ? '核對合法示例與精確總數' : '條件交集為空', result.count > 0n ? 'Verify the legal witness and exact total' : 'The intersection of the rules is empty'),
    reason: copy(result.count > 0n ? '畫面只是引擎找出的一個合法結果。算式已計算所有符合條件的方法，而不是只計畫面。' : '引擎已把所有條件一起核對，結果是 0；不會虛構一個違反條件的安排。', result.count > 0n ? 'The picture is one legal witness found by the engine. The calculation counts every valid outcome, not only the pictured one.' : 'Checking every rule together gives zero. No arrangement violating a rule is fabricated.'),
    pitfall: copy(circle ? '整體旋轉不另計；鏡像仍另計。圓桌沒有首位或尾位。' : selection ? '不同類別分配是互斥情況，先相加；只有先選後排才再乘 r!。' : '不能分開計每條限制再相乘；綑綁和固定位置可能互相影響。', circle ? 'Whole-table rotations are identical; reflections remain distinct. An unnumbered circle has no first or last place.' : selection ? 'Category profiles are disjoint cases, so add them. Multiply by r! only when arranging after selection.' : 'Do not multiply separate rule counts: bundles and fixed positions can interact.'),
    latex: `N=${result.count.toString()}`,
    rows: finalRows,
  });
  return {
    key: `multi-${JSON.stringify(problem)}-${story.zh}-${story.en}`,
    title: copy(`${story.zh} · 多類身份推導`, `${story.en} · multi-category reasoning`),
    question: copy(summary('zh'), summary('en')),
    items: source.map(item => ({ id: item.id, label: item.label, emoji: item.emoji, category: 'generic', colorIndex: problem.groups.findIndex(group => group.id === item.groupId), shortLabel: item.id.toUpperCase() })),
    steps,
  };
}
