import { factorial } from './mathEngine';
import { animationCopy as c, animationItems, type ContextAnimationModel, type ContextRow, type ContextStep } from './contextAnimation';
export interface PCAnimationConstraint { type: string; value?: number }
interface PCScenario { nameZh: string; nameEn: string; typeAZh: string; typeAEn: string; typeBZh: string; typeBEn: string; emojiA: string; emojiB: string }
interface PCAnimationInput { scenarioKey: string; scenario: PCScenario; countA: number; countB: number; action: 'P' | 'C'; selectCount: number; constraints: PCAnimationConstraint[]; circular: boolean; result: { answer: number; methodZh: string; methodEn: string; steps: { latex: string; noteZh: string; noteEn: string }[] } }
const choose = (n: number, r: number) => r < 0 || r > n ? 0 : factorial(n) / (factorial(r) * factorial(n - r));

/** Find a legal category layout without enumerating identity permutations. */
export function findCategoryExample(a: number, b: number, constraints: PCAnimationConstraint[]): string[] | null {
  const has = (type: string) => constraints.some(item => item.type === type);
  if (has('fixed_ends') && a < 2) return null;
  const total = a + b;
  const failed = new Set<string>();
  function visit(leftA: number, leftB: number, lastA: boolean, phase: number): string[] | null {
    if (!leftA && !leftB) return (has('fixed_tail') || has('fixed_ends')) && !lastA ? null : [];
    const key = `${leftA},${leftB},${lastA},${phase}`;
    if (failed.has(key)) return null;
    const first = leftA + leftB === total;
    if (leftA && !(has('non_adjacent') && lastA) && !(has('adjacent') && phase === 2)) {
      const tail = visit(leftA - 1, leftB, true, 1);
      if (tail) return ['A', ...tail];
    }
    if (leftB && !(first && (has('fixed_head') || has('fixed_ends')))) {
      const tail = visit(leftA, leftB - 1, false, phase === 1 ? 2 : phase);
      if (tail) return ['B', ...tail];
    }
    failed.add(key); return null;
  }
  return visit(a, b, false, 0);
}

export function buildPCAnimation(input: PCAnimationInput): ContextAnimationModel {
  const { scenario: sc, countA: a, countB: b, action, selectCount: r, constraints, circular, result } = input;
  const groupA = animationItems('A', a, c(sc.typeAZh, sc.typeAEn), sc.emojiA, 'A');
  const groupB = animationItems('B', b, c(sc.typeBZh, sc.typeBEn), sc.emojiB, 'B');
  const items = [...groupA, ...groupB], all = items.map(item => item.id), A = groupA.map(item => item.id), B = groupB.map(item => item.id), n = a + b;
  const has = (type: string) => constraints.some(item => item.type === type);
  const names: Record<string, ReturnType<typeof c>> = {
    adjacent: c(`全部${sc.typeAZh}相鄰`, `All ${sc.typeAEn} objects together`),
    non_adjacent: c(`${sc.typeAZh}互不相鄰`, `No two ${sc.typeAEn} objects adjacent`),
    fixed_head: c(`首位是${sc.typeAZh}`, `First place is ${sc.typeAEn}`),
    fixed_tail: c(`尾位是${sc.typeAZh}`, `Last place is ${sc.typeAEn}`),
    fixed_ends: c(`兩端都是${sc.typeAZh}`, `Both ends are ${sc.typeAEn}`),
  };
  const conditionText = constraints.map(item => names[item.type] ?? c(`${item.type === 'exactly' ? '恰好' : item.type === 'at_least' ? '至少' : '至多'} ${item.value ?? 1} 個${sc.typeAZh}`, `${item.type === 'exactly' ? 'Exactly' : item.type === 'at_least' ? 'At least' : 'At most'} ${item.value ?? 1} ${sc.typeAEn}`));
  const question = c(`${sc.nameZh}：${a} 個相異${sc.typeAZh}及 ${b} 個相異${sc.typeBZh}。${action === 'C' ? `選 ${r} 個，不計次序` : circular ? '全部圍坐，旋轉視為相同' : '全部排成直線，位置有分別'}。${conditionText.map(x => x.zh).join('；') || '沒有額外限制'}。`, `${sc.nameEn}: ${a} distinct ${sc.typeAEn} and ${b} distinct ${sc.typeBEn}. ${action === 'C' ? `Choose ${r}, ignoring order` : circular ? 'Arrange all in a circle, identifying rotations' : 'Arrange all in a line with distinct places'}. ${conditionText.map(x => x.en).join('; ') || 'No extra restrictions'}.`);
  const pitfall = c('圖中身份都不同；不能把同類物件當成相同，亦不能重複使用同一身份。', 'Every pictured identity is distinct. Objects of the same class are not identical, and an identity cannot be reused.');
  const pool: ContextRow = { label: c(`本題全部 ${n} 個候選物件`, `All ${n} candidates in this problem`), ids: all, style: 'pool' };
  const steps: ContextStep[] = [{ title: c('先看本題的數量與條件', 'Start with this problem’s counts and conditions'), reason: question, pitfall, latex: String.raw`${a}+${b}=${n}`, rows: [pool] }];
  const selectedRows = (selected: string[]): ContextRow[] => [{ label: c(`選取示例：${selected.length} 個，不分次序`, `Example set: ${selected.length} selected, without order`), ids: selected, style: 'team' }, { label: c('未入選', 'Not selected'), ids: all.filter(id => !selected.includes(id)), style: 'pool' }];
  if (action === 'C') {
    if (!constraints.length) {
      const chosen = all.slice(0, r);
      steps.push({ title: c(`從 ${n} 個選 ${r} 個`, `Choose ${r} from ${n}`), reason: c('從候選池移入一組身份；左右書寫位置並不代表職位。', 'Move identities from the candidate pool into a set; their written positions do not assign roles.'), pitfall, latex: String.raw`C(${n},${r})`, rows: selectedRows(chosen) });
      steps.push({ title: c('交換書寫位置，仍是同一組', 'A written swap is still the same set'), reason: c(`每個 ${r} 個身份的集合，若用排列會重複計 ${r}! 次，所以除去這個因子。`, `Permutation counting writes each set of ${r} identities in ${r}! orders, so divide out this factor.`), pitfall: c('只選成員時，不可把交換左右視為另一個結果。', 'When only membership matters, swapping written positions is not another outcome.'), latex: String.raw`C(${n},${r})=\frac{P(${n},${r})}{${r}!}=${result.answer}`, rows: selectedRows([...chosen].reverse()) });
    } else {
      let low = Math.max(0, r - b), high = Math.min(a, r);
      for (const item of constraints) {
        if (item.type === 'at_least') low = Math.max(low, item.value ?? 1);
        if (item.type === 'at_most') high = Math.min(high, item.value ?? 1);
        if (item.type === 'exactly') { low = Math.max(low, item.value ?? 1); high = Math.min(high, item.value ?? 1); }
      }
      for (let k = low; k <= high; k++) {
        const other = r - k, selected = [...A.slice(0, k), ...B.slice(0, other)];
        const ways = Math.round(choose(a, k) * choose(b, other));
        steps.push({ title: c(`情況：${k} 個${sc.typeAZh}＋${other} 個${sc.typeBZh}`, `Case: ${k} ${sc.typeAEn} + ${other} ${sc.typeBEn}`), reason: c(`固定兩類各選多少個。每組${sc.typeAZh}可配每組${sc.typeBZh}，用乘法原理；這個情況同時符合全部所選限制。`, `Fix the count from each class. Each ${sc.typeAEn} set pairs with each ${sc.typeBEn} set, so multiply. This case satisfies all selected restrictions.`), pitfall: c('「恰好／至少／至多」必須同時符合；不同 A 類數目的情況不重疊。', 'Exactly / at least / at most restrictions must all hold. Cases with different A counts do not overlap.'), latex: String.raw`C(${a},${k})\times C(${b},${other})=${ways}`, rows: selectedRows(selected) });
      }
      steps.push({ title: c('把符合條件的情況相加', 'Add the valid disjoint cases'), reason: c('動畫直接列出符合條件的類別人數；上方餘事法／分類法數的是同一批結果。', 'The animation lists valid class counts directly. The complementary or case method above counts the same outcomes.'), pitfall: c('不同情況相加；同一情況內兩類的選法相乘。', 'Add different cases; multiply the two class choices within one case.'), latex: String.raw`N=${result.answer}`, rows: [] });
    }
  } else {
    const pattern = findCategoryExample(a, b, constraints);
    let ai = 0, bi = 0;
    const line = pattern?.map(category => category === 'A' ? A[ai++] : B[bi++]) ?? [];
    const lineRow: ContextRow = { label: c('本題一個合法的完整排列', 'One legal complete arrangement for this problem'), ids: line, style: circular ? 'circle' : has('adjacent') && a ? 'bundle' : 'line', highlightIds: has('adjacent') ? A : [] };
    if (!constraints.length && !circular) {
      for (let placed = 1; placed <= n; placed++) steps.push({ title: c(`填入第 ${placed} 位：${n - placed + 1} 個選擇`, `Fill place ${placed}: ${n - placed + 1} choices`), reason: c('每用過一個身份，下一格可用數便少一；各格選擇用乘法原理相乘。', 'Once an identity is used, one fewer remains for the next place. Multiply the successive choice counts.'), pitfall, latex: String.raw`P(${n},${placed})=${factorial(n) / factorial(n - placed)}`, rows: [{ label: c('依次填入本題的位置', 'Fill this problem’s positions in order'), ids: [...line.slice(0, placed), ...Array(n - placed).fill('')], style: 'line' }, { label: c('尚未使用', 'Still unused'), ids: line.slice(placed), style: 'pool' }] });
    } else {
      result.steps.forEach((calculation, index) => {
        let rows: ContextRow[] = line.length ? [lineRow] : [];
        if (has('non_adjacent') && !has('adjacent') && index < 2) rows = [{ label: c(`${b} 個${sc.typeBZh}形成 ${b + 1} 個空隙（包含兩端）`, `${b} ${sc.typeBEn} form ${b + 1} gaps, including both ends`), ids: B, style: 'gaps', gapIndices: index ? pattern?.reduce<number[]>((out, category, p) => { if (category === 'A') out.push(pattern.slice(0, p).filter(v => v === 'B').length); return out; }, []) : [] }, { label: c(`等候插入的 ${a} 個${sc.typeAZh}`, `${a} ${sc.typeAEn} waiting to be inserted`), ids: A, style: 'pool' }];
        steps.push({ title: c(`${result.methodZh} · 第 ${index + 1} 步`, `${result.methodEn} · step ${index + 1}`), reason: c(calculation.noteZh, calculation.noteEn), pitfall, latex: calculation.latex, rows });
      });
    }
    steps.push({ title: c('本題的全部方法數', 'Total count for this problem'), reason: c('算式涵蓋所有合法身份分配，圖中只是其中一個；所有所選限制均保留。', 'The formula covers all legal identity assignments; the picture is one example. Every selected restriction is retained.'), pitfall, latex: String.raw`N=${result.answer}`, rows: line.length ? [lineRow] : [] });
  }
  return { key: JSON.stringify([input.scenarioKey, a, b, action, r, constraints, circular, result.answer]), title: c(`${sc.nameZh}：${result.methodZh}`, `${sc.nameEn}: ${result.methodEn}`), question, items, steps };
}
