// ============================================================
// PCPage.tsx – DSE P&C Calculator
// Design: Premium Dark Glassmorphism | 5-Step Guided Wizard
// Features:
//   • 4 Scenario Templates (Office/School/Restaurant/Family)
//   • Dynamic Emoji Visualization
//   • Constraint Checklist (Bundling/Separation/Fixed/Complementary)
//   • Smart Conflict Detection & Error Messages
//   • Random DSE Practice Questions
//   • Full KaTeX displaystyle step-by-step solutions
// ============================================================

import { useState, useCallback, useEffect } from 'react';
import { useLang } from '../contexts/LangContext';
import KatexRenderer from '../components/KatexRenderer';
import {
  factorial,
  generateQuestion,
  flexibleCount,
  evalTerm,
  termToLatex,
  evalTermList,
  type PracticeQuestion,
  type QuestionType,
  type ExprTerm,
  type TermType,
} from '../lib/mathEngine';

// ── Types ──────────────────────────────────────────────────
type Action = 'P' | 'C';
type ConstraintType = 'adjacent' | 'non_adjacent' | 'fixed_ends' | 'fixed_head' | 'fixed_tail' | 'at_least' | 'at_most' | 'exactly';
type ScenarioKey = 'office' | 'school' | 'restaurant' | 'family';

interface Scenario {
  nameZh: string; nameEn: string;
  typeAZh: string; typeAEn: string; emojiA: string;
  typeBZh: string; typeBEn: string; emojiB: string;
  descZh: string; descEn: string;
  bgColor: string;
}

interface Constraint { type: ConstraintType; value?: number; }

interface StepResult {
  latex: string;
  noteZh: string;
  noteEn: string;
}

interface CalcResult {
  answer: number;
  methodZh: string;
  methodEn: string;
  steps: StepResult[];
  complementary?: number;
  totalForComp?: number;
  error?: string;
  errorZh?: string;
}

// ── Scenario Database ──────────────────────────────────────
const SCENARIOS: Record<ScenarioKey, Scenario> = {
  office: {
    nameZh: '辦公室選拔', nameEn: 'Office Selection',
    typeAZh: '經理', typeAEn: 'Manager', emojiA: '👔',
    typeBZh: '員工', typeBEn: 'Staff', emojiB: '💼',
    descZh: '從經理和員工中選出委員會或排隊',
    descEn: 'Select a committee or line up managers and staff',
    bgColor: 'rgba(212,168,67,0.06)',
  },
  school: {
    nameZh: '影畢業相', nameEn: 'Graduation Photo',
    typeAZh: '老師', typeAEn: 'Teacher', emojiA: '👨‍🏫',
    typeBZh: '學生', typeBEn: 'Student', emojiB: '🧑‍🎓',
    descZh: '老師和學生排隊影相',
    descEn: 'Teachers and students line up for a photo',
    bgColor: 'rgba(107,155,210,0.06)',
  },
  restaurant: {
    nameZh: '茶餐廳點菜', nameEn: 'Cha Chaan Teng',
    typeAZh: '主食', typeAEn: 'Main Dish', emojiA: '🍛',
    typeBZh: '飲品', typeBEn: 'Drink', emojiB: '🥤',
    descZh: '從不同菜式和飲品中選擇',
    descEn: 'Choose from different dishes and drinks',
    bgColor: 'rgba(126,200,164,0.06)',
  },
  family: {
    nameZh: '家庭聚餐', nameEn: 'Family Gathering',
    typeAZh: '成人', typeAEn: 'Adult', emojiA: '👨',
    typeBZh: '兒童', typeBEn: 'Child', emojiB: '👦',
    descZh: '成人和兒童圍坐或排隊',
    descEn: 'Adults and children sit around or line up',
    bgColor: 'rgba(224,112,112,0.06)',
  },
};

// ── Math Helpers ───────────────────────────────────────────
function perm(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  return factorial(n) / factorial(n - r);
}
function comb(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}
function fmt(n: number): string { return n.toLocaleString(); }

// ── Calculation Engine ─────────────────────────────────────
function calculate(
  action: Action,
  countA: number,
  countB: number,
  selectCount: number,
  constraints: Constraint[],
  circular: boolean,
  scenario: Scenario,
): CalcResult {
  const total = countA + countB;
  const hasAdj = constraints.some(c => c.type === 'adjacent');
  const hasNonAdj = constraints.some(c => c.type === 'non_adjacent');
  const hasFixedEnds = constraints.some(c => c.type === 'fixed_ends');
  const hasFixedHead = constraints.some(c => c.type === 'fixed_head');
  const hasFixedTail = constraints.some(c => c.type === 'fixed_tail');
  const atLeastC = constraints.find(c => c.type === 'at_least');
  const atMostC = constraints.find(c => c.type === 'at_most');
  const exactlyC = constraints.find(c => c.type === 'exactly');

  // ── Conflict detection ──
  if (hasAdj && hasNonAdj) {
    return {
      answer: 0, methodZh: '', methodEn: '', steps: [],
      error: `Conflict detected! ${scenario.typeAEn}s cannot be both adjacent AND non-adjacent at the same time. Please remove one constraint. 😅`,
      errorZh: `條件衝突！${scenario.typeAZh}們表示很傲嬌，他們不能同時黏在一起又分開坐喔！請取消其中一個條件。😅`,
    };
  }

  // ── Physical limit checks ──
  if (action === 'C') {
    if (selectCount > total) {
      return {
        answer: 0, methodZh: '', methodEn: '', steps: [],
        error: `Total is only ${total} but you want to select ${selectCount}. Not enough people! Please fix the numbers.`,
        errorZh: `共有 ${total} 位${scenario.typeAZh}和${scenario.typeBZh}，但你想選 ${selectCount} 人。我們沒有足夠的人！請修正數字。`,
      };
    }
    if (selectCount <= 0) {
      return {
        answer: 0, methodZh: '', methodEn: '', steps: [],
        error: 'Selection count must be at least 1.',
        errorZh: '選取數量至少要有 1 個。',
      };
    }
  }

  if (action === 'P' && hasNonAdj && countA > countB + 1) {
    return {
      answer: 0, methodZh: '', methodEn: '', steps: [],
      error: `Cannot separate ${countA} ${scenario.typeAEn}s among ${countB} ${scenario.typeBEn}s — there are only ${countB + 1} gaps but ${countA} items to insert!`,
      errorZh: `無法將 ${countA} 個${scenario.typeAZh}插入 ${countB} 個${scenario.typeBZh}之間，只有 ${countB + 1} 個空位但需要插入 ${countA} 個！`,
    };
  }

  // ── Circular Permutation ──
  if (circular && action === 'P') {
    const ans = factorial(total - 1);
    return {
      answer: ans, methodZh: '圓形排列', methodEn: 'Circular Permutation',
      steps: [
        {
          latex: `\\displaystyle \\text{固定一人，消除旋轉重複}`,
          noteZh: `圓形排列中，固定 1 人，其餘 ${total - 1} 人全排。`,
          noteEn: `Fix 1 person to eliminate rotational duplicates. Arrange the remaining ${total - 1}.`,
        },
        {
          latex: `\\displaystyle (${total} - 1)! = ${total - 1}! = ${fmt(ans)}`,
          noteZh: `圓形排列總數 = ${fmt(ans)}`,
          noteEn: `Total circular arrangements = ${fmt(ans)}`,
        },
      ],
    };
  }

  // ── P: Bundling (Adjacent) ──
  if (action === 'P' && hasAdj) {
    const units = countB + 1;
    const outer = factorial(units);
    const inner = factorial(countA);
    const ans = outer * inner;
    return {
      answer: ans, methodZh: '捆綁法（必須相鄰）', methodEn: 'Bundling Method (Must be Adjacent)',
      steps: [
        {
          latex: `\\displaystyle \\text{將 } ${countA} \\text{ 個${scenario.typeAZh}捆綁為一個整體}`,
          noteZh: `把 ${countA} 個${scenario.typeAZh}視為一個「超級單元」。`,
          noteEn: `Treat all ${countA} ${scenario.typeAEn}s as one "super unit".`,
        },
        {
          latex: `\\displaystyle \\text{單元總數} = ${countB} + 1 = ${units}`,
          noteZh: `${countB} 個${scenario.typeBZh} + 1 個捆綁 = ${units} 個單元。`,
          noteEn: `${countB} ${scenario.typeBEn}s + 1 bundle = ${units} units.`,
        },
        {
          latex: `\\displaystyle \\text{排列 } ${units} \\text{ 個單元} = ${units}! = ${fmt(outer)}`,
          noteZh: `將 ${units} 個單元排成一列。`,
          noteEn: `Arrange ${units} units in a row.`,
        },
        {
          latex: `\\displaystyle \\text{捆綁內部排列} = ${countA}! = ${fmt(inner)}`,
          noteZh: `捆綁內的 ${countA} 個${scenario.typeAZh}本身也可以重新排列。`,
          noteEn: `The ${countA} ${scenario.typeAEn}s inside the bundle can also be rearranged.`,
        },
        {
          latex: `\\displaystyle \\text{答案} = ${units}! \\times ${countA}! = ${fmt(outer)} \\times ${fmt(inner)} = ${fmt(ans)}`,
          noteZh: `外部排列 × 內部排列 = 最終答案。`,
          noteEn: `Outer × inner = final answer.`,
        },
      ],
    };
  }

  // ── P: Separation (Non-Adjacent) ──
  if (action === 'P' && hasNonAdj) {
    const bPerm = factorial(countB);
    const gaps = countB + 1;
    const insertP = perm(gaps, countA);
    const ans = bPerm * insertP;
    return {
      answer: ans, methodZh: '插空法（不能相鄰）', methodEn: 'Separation Method (Cannot be Adjacent)',
      steps: [
        {
          latex: `\\displaystyle \\text{先排 } ${countB} \\text{ 個${scenario.typeBZh}} = ${countB}! = ${fmt(bPerm)}`,
          noteZh: `先將 ${countB} 個${scenario.typeBZh}排成一列，共 ${fmt(bPerm)} 種。`,
          noteEn: `First arrange the ${countB} ${scenario.typeBEn}s in a row.`,
        },
        {
          latex: `\\displaystyle \\text{可用空位} = ${countB} + 1 = ${gaps} \\text{ 個}`,
          noteZh: `${countB} 個${scenario.typeBZh}之間及兩端共有 ${gaps} 個空位（↑）。`,
          noteEn: `There are ${gaps} gaps (between and at ends) for the ${scenario.typeAEn}s.`,
        },
        {
          latex: `\\displaystyle P_{${countA}}^{${gaps}} = \\dfrac{${gaps}!}{(${gaps}-${countA})!} = ${fmt(insertP)}`,
          noteZh: `從 ${gaps} 個空位中選 ${countA} 個，有序插入${scenario.typeAZh}。`,
          noteEn: `Choose ${countA} of ${gaps} gaps and insert ${scenario.typeAEn}s in order.`,
        },
        {
          latex: `\\displaystyle \\text{答案} = ${countB}! \\times P_{${countA}}^{${gaps}} = ${fmt(bPerm)} \\times ${fmt(insertP)} = ${fmt(ans)}`,
          noteZh: `B 類排列 × 插入排列 = 最終答案。`,
          noteEn: `B arrangements × insertion = final answer.`,
        },
      ],
    };
  }

  // ── P: Fixed Ends ──
  if (action === 'P' && hasFixedEnds) {
    const endArr = perm(countA, 2);
    const midArr = factorial(total - 2);
    const ans = endArr * midArr;
    return {
      answer: ans, methodZh: '指定首尾（A類在兩端）', methodEn: 'Fixed Ends (A-type at both ends)',
      steps: [
        {
          latex: `\\displaystyle P_2^{${countA}} = \\dfrac{${countA}!}{(${countA}-2)!} = ${fmt(endArr)}`,
          noteZh: `從 ${countA} 個${scenario.typeAZh}中選 2 個分別放在首位和尾位。`,
          noteEn: `Choose 2 ${scenario.typeAEn}s for the two ends (order matters).`,
        },
        {
          latex: `\\displaystyle \\text{中間排列} = ${total - 2}! = ${fmt(midArr)}`,
          noteZh: `將剩餘 ${total - 2} 人排在中間位置。`,
          noteEn: `Arrange the remaining ${total - 2} people in the middle.`,
        },
        {
          latex: `\\displaystyle \\text{答案} = P_2^{${countA}} \\times ${total - 2}! = ${fmt(endArr)} \\times ${fmt(midArr)} = ${fmt(ans)}`,
          noteZh: `首尾排列 × 中間排列 = 最終答案。`,
          noteEn: `Ends × middle = final answer.`,
        },
      ],
    };
  }

  // ── P: Fixed Head ──
  if (action === 'P' && hasFixedHead) {
    const rem = factorial(total - 1);
    const ans = countA * rem;
    return {
      answer: ans, methodZh: '指定首位（A類在隊頭）', methodEn: 'Fixed Head (A-type at head)',
      steps: [
        {
          latex: `\\displaystyle \\text{首位選擇} = ${countA} \\text{ 種}`,
          noteZh: `${countA} 個${scenario.typeAZh}中任選 1 個放在首位。`,
          noteEn: `Any of the ${countA} ${scenario.typeAEn}s can be at the head.`,
        },
        {
          latex: `\\displaystyle \\text{剩餘排列} = ${total - 1}! = ${fmt(rem)}`,
          noteZh: `將剩餘 ${total - 1} 人排在其他位置。`,
          noteEn: `Arrange the remaining ${total - 1} people.`,
        },
        {
          latex: `\\displaystyle \\text{答案} = ${countA} \\times ${total - 1}! = ${countA} \\times ${fmt(rem)} = ${fmt(ans)}`,
          noteZh: `首位選擇 × 剩餘排列 = 最終答案。`,
          noteEn: `Head choices × remaining = final answer.`,
        },
      ],
    };
  }

  // ── P: Fixed Tail ──
  if (action === 'P' && hasFixedTail) {
    const rem = factorial(total - 1);
    const ans = countA * rem;
    return {
      answer: ans, methodZh: '指定尾位（A類在隊尾）', methodEn: 'Fixed Tail (A-type at tail)',
      steps: [
        {
          latex: `\\displaystyle \\text{尾位選擇} = ${countA} \\text{ 種}`,
          noteZh: `${countA} 個${scenario.typeAZh}中任選 1 個放在尾位。`,
          noteEn: `Any of the ${countA} ${scenario.typeAEn}s can be at the tail.`,
        },
        {
          latex: `\\displaystyle \\text{剩餘排列} = ${total - 1}! = ${fmt(rem)}`,
          noteZh: `將剩餘 ${total - 1} 人排在其他位置。`,
          noteEn: `Arrange the remaining ${total - 1} people.`,
        },
        {
          latex: `\\displaystyle \\text{答案} = ${countA} \\times ${total - 1}! = ${countA} \\times ${fmt(rem)} = ${fmt(ans)}`,
          noteZh: `尾位選擇 × 剩餘排列 = 最終答案。`,
          noteEn: `Tail choices × remaining = final answer.`,
        },
      ],
    };
  }

  // ── P: Plain Full Permutation ──
  if (action === 'P') {
    const ans = factorial(total);
    return {
      answer: ans, methodZh: '全排列', methodEn: 'Full Permutation',
      steps: [
        {
          latex: `\\displaystyle \\text{共 } ${total} \\text{ 個元素全排列}`,
          noteZh: `${countA} 個${scenario.typeAZh} + ${countB} 個${scenario.typeBZh} = ${total} 個元素。`,
          noteEn: `${countA} ${scenario.typeAEn}s + ${countB} ${scenario.typeBEn}s = ${total} elements.`,
        },
        {
          latex: `\\displaystyle ${total}! = ${fmt(ans)}`,
          noteZh: `全排列 = ${total}! = ${fmt(ans)}`,
          noteEn: `Full permutation = ${total}! = ${fmt(ans)}`,
        },
      ],
    };
  }

  // ── C: Exactly k of Type A ──
  if (exactlyC) {
    const k = exactlyC.value ?? 1;
    const b = selectCount - k;
    if (k > countA || b < 0 || b > countB) {
      return {
        answer: 0, methodZh: '', methodEn: '', steps: [],
        error: `Cannot select exactly ${k} ${scenario.typeAEn}(s) from ${countA} with ${selectCount} total — invalid combination.`,
        errorZh: `無法從 ${countA} 個${scenario.typeAZh}中恰好選 ${k} 個（選取總數 ${selectCount}，${scenario.typeBZh}需要 ${b} 個，但只有 ${countB} 個）。`,
      };
    }
    const cA = comb(countA, k);
    const cB = comb(countB, b);
    const ans = cA * cB;
    return {
      answer: ans,
      methodZh: `恰好 ${k} 個${scenario.typeAZh}（分類討論）`,
      methodEn: `Exactly ${k} ${scenario.typeAEn}(s) — Direct Calculation`,
      steps: [
        {
          latex: `\\displaystyle \\text{選 } ${k} \\text{ 個${scenario.typeAZh}，} ${b} \\text{ 個${scenario.typeBZh}}`,
          noteZh: `恰好 ${k} 個${scenario.typeAZh} + 恰好 ${b} 個${scenario.typeBZh} = ${selectCount} 人。`,
          noteEn: `Exactly ${k} ${scenario.typeAEn}(s) + exactly ${b} ${scenario.typeBEn}(s) = ${selectCount} people.`,
        },
        {
          latex: `\\displaystyle C_{${k}}^{${countA}} = \\dfrac{${countA}!}{${k}!\\,(${countA}-${k})!} = ${fmt(cA)}`,
          noteZh: `從 ${countA} 個${scenario.typeAZh}中選 ${k} 個（不計順序）。`,
          noteEn: `Choose ${k} from ${countA} ${scenario.typeAEn}s (order doesn't matter).`,
        },
        {
          latex: `\\displaystyle C_{${b}}^{${countB}} = \\dfrac{${countB}!}{${b}!\\,(${countB}-${b})!} = ${fmt(cB)}`,
          noteZh: `從 ${countB} 個${scenario.typeBZh}中選 ${b} 個（不計順序）。`,
          noteEn: `Choose ${b} from ${countB} ${scenario.typeBEn}s (order doesn't matter).`,
        },
        {
          latex: `\\displaystyle \\text{答案} = C_{${k}}^{${countA}} \\times C_{${b}}^{${countB}} = ${fmt(cA)} \\times ${fmt(cB)} = ${fmt(ans)}`,
          noteZh: `${scenario.typeAZh}選法 × ${scenario.typeBZh}選法 = 最終答案。`,
          noteEn: `${scenario.typeAEn} ways × ${scenario.typeBEn} ways = final answer.`,
        },
      ],
    };
  }

  // ── C: At Least (Complementary Method) ──
  if (atLeastC) {
    const minA = atLeastC.value ?? 1;
    const totalComb = comb(total, selectCount);
    let comp = 0;
    const compSteps: StepResult[] = [];
    for (let a = 0; a < minA; a++) {
      const b = selectCount - a;
      if (b < 0 || b > countB || a > countA) continue;
      const c = comb(countA, a) * comb(countB, b);
      comp += c;
      compSteps.push({
        latex: `\\displaystyle C_{${a}}^{${countA}} \\times C_{${b}}^{${countB}} = ${fmt(comb(countA, a))} \\times ${fmt(comb(countB, b))} = ${fmt(c)}`,
        noteZh: `${a} 個${scenario.typeAZh} + ${b} 個${scenario.typeBZh}`,
        noteEn: `${a} ${scenario.typeAEn}(s) + ${b} ${scenario.typeBEn}(s)`,
      });
    }
    const ans = totalComb - comp;
    return {
      answer: ans,
      complementary: comp,
      totalForComp: totalComb,
      methodZh: `至少 ${minA} 個${scenario.typeAZh}（餘事法）`,
      methodEn: `At Least ${minA} ${scenario.typeAEn}(s) — Complementary`,
      steps: [
        {
          latex: `\\displaystyle C_{${selectCount}}^{${total}} = ${fmt(totalComb)}`,
          noteZh: `從 ${total} 人中選 ${selectCount} 人的總組合數。`,
          noteEn: `Total combinations: choose ${selectCount} from ${total}.`,
        },
        {
          latex: `\\displaystyle \\text{反面：${scenario.typeAZh}人數 < } ${minA} \\text{ 的情況}`,
          noteZh: `計算不符合條件（${scenario.typeAZh}少於 ${minA} 個）的情況。`,
          noteEn: `Count "bad" cases where fewer than ${minA} ${scenario.typeAEn}(s) are selected.`,
        },
        ...compSteps,
        {
          latex: `\\displaystyle \\text{反面總數} = ${fmt(comp)}`,
          noteZh: `所有不符合條件的情況總和。`,
          noteEn: `Sum of all "bad" cases.`,
        },
        {
          latex: `\\displaystyle \\text{答案} = ${fmt(totalComb)} - ${fmt(comp)} = ${fmt(ans)}`,
          noteZh: `總數 − 反面 = 符合條件的答案。`,
          noteEn: `Total − complementary = answer.`,
        },
      ],
    };
  }

  // ── C: At Most (Case Analysis) ──
  if (atMostC) {
    const maxA = atMostC.value ?? 1;
    let ans = 0;
    const caseSteps: StepResult[] = [];
    for (let a = 0; a <= Math.min(maxA, countA, selectCount); a++) {
      const b = selectCount - a;
      if (b < 0 || b > countB) continue;
      const c = comb(countA, a) * comb(countB, b);
      ans += c;
      caseSteps.push({
        latex: `\\displaystyle C_{${a}}^{${countA}} \\times C_{${b}}^{${countB}} = ${fmt(comb(countA, a))} \\times ${fmt(comb(countB, b))} = ${fmt(c)}`,
        noteZh: `${a} 個${scenario.typeAZh} + ${b} 個${scenario.typeBZh}`,
        noteEn: `${a} ${scenario.typeAEn}(s) + ${b} ${scenario.typeBEn}(s)`,
      });
    }
    return {
      answer: ans,
      methodZh: `至多 ${maxA} 個${scenario.typeAZh}（分類討論）`,
      methodEn: `At Most ${maxA} ${scenario.typeAEn}(s) — Case Analysis`,
      steps: [
        {
          latex: `\\displaystyle \\text{分類討論：${scenario.typeAZh}人數從 0 到 } ${maxA}`,
          noteZh: `逐一列舉所有有效情況。`,
          noteEn: `Enumerate all valid cases.`,
        },
        ...caseSteps,
        {
          latex: `\\displaystyle \\text{答案} = ${fmt(ans)}`,
          noteZh: `所有有效情況的總和。`,
          noteEn: `Sum of all valid cases.`,
        },
      ],
    };
  }

  // ── C: Plain Combination ──
  const ans = comb(total, selectCount);
  return {
    answer: ans, methodZh: '組合', methodEn: 'Combination',
    steps: [
      {
        latex: `\\displaystyle C_{${selectCount}}^{${total}} = \\dfrac{${total}!}{${selectCount}!\\,(${total}-${selectCount})!} = ${fmt(ans)}`,
        noteZh: `從 ${total} 人中選取 ${selectCount} 人，不計順序。`,
        noteEn: `Choose ${selectCount} from ${total} without regard to order.`,
      },
    ],
  };
}

// ── Emoji Stage Component ──────────────────────────────────
function EmojiStage({
  scenario, countA, countB, action, constraints, circular,
}: {
  scenario: Scenario; countA: number; countB: number;
  action: Action; constraints: Constraint[]; circular: boolean;
}) {
  const hasAdj = constraints.some(c => c.type === 'adjacent');
  const hasNonAdj = constraints.some(c => c.type === 'non_adjacent');
  const hasFixedEnds = constraints.some(c => c.type === 'fixed_ends');
  const hasFixedHead = constraints.some(c => c.type === 'fixed_head');
  const hasFixedTail = constraints.some(c => c.type === 'fixed_tail');
  const total = countA + countB;
  const maxA = Math.min(countA, 8);
  const maxB = Math.min(countB, 8);

  const stageStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-lg)',
    padding: '1rem',
    minHeight: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: '0.4rem',
  };

  // Circular
  if (circular && action === 'P') {
    const items = [
      ...Array(maxA).fill(scenario.emojiA),
      ...Array(maxB).fill(scenario.emojiB),
    ];
    const n = items.length;
    const cx = 90, cy = 90, r = 68;
    return (
      <div style={stageStyle}>
        <svg width={180} height={180} viewBox="0 0 180 180">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(212,168,67,0.2)" strokeWidth="1.5" strokeDasharray="4 3" />
          {items.map((emoji, i) => {
            const angle = (2 * Math.PI * i) / n - Math.PI / 2;
            const x = cx + r * Math.cos(angle);
            const y = cy + r * Math.sin(angle);
            return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="18">{emoji}</text>;
          })}
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="rgba(212,168,67,0.7)">{`(${total}-1)!`}</text>
        </svg>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', width: '100%' }}>
          ⭕ 圓形排列 — 固定一人，其餘 {total - 1} 人全排
        </div>
      </div>
    );
  }

  // Bundling
  if (action === 'P' && hasAdj) {
    return (
      <div style={stageStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{
            display: 'flex', gap: '0.2rem', padding: '0.4rem 0.6rem',
            background: 'rgba(212,168,67,0.12)', border: '2px dashed rgba(212,168,67,0.5)',
            borderRadius: 'var(--r-md)', alignItems: 'center',
          }}>
            {Array(maxA).fill(0).map((_, i) => (
              <span key={i} style={{ fontSize: '1.4rem' }} className="animate-pop">{scenario.emojiA}</span>
            ))}
            <span style={{ fontSize: '0.65rem', color: 'var(--gold)', marginLeft: 4 }}>捆綁</span>
          </div>
          {Array(maxB).fill(0).map((_, i) => (
            <div key={i} className="emoji-slot filled animate-pop" style={{ animationDelay: `${i * 0.05}s` }}>
              {scenario.emojiB}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Separation
  if (action === 'P' && hasNonAdj) {
    const bItems = Array(maxB).fill(scenario.emojiB);
    return (
      <div style={{ ...stageStyle, flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--blue-bright)', opacity: 0.7 }}>↑</span>
          {bItems.map((emoji, i) => (
            <>
              <div key={i} className="emoji-slot filled animate-pop" style={{ animationDelay: `${i * 0.05}s` }}>{emoji}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--blue-bright)', opacity: 0.7 }}>↑</span>
            </>
          ))}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--blue-bright)' }}>
          ↑ = {maxB + 1} 個可用空位，插入 {scenario.emojiA} × {countA}
        </div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array(maxA).fill(0).map((_, i) => (
            <span key={i} className="animate-pop" style={{ fontSize: '1.4rem', animationDelay: `${i * 0.08}s` }}>{scenario.emojiA}</span>
          ))}
        </div>
      </div>
    );
  }

  // Fixed positions
  if (action === 'P' && (hasFixedEnds || hasFixedHead || hasFixedTail)) {
    const slots = Math.min(total, 8);
    return (
      <div style={stageStyle}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array(slots).fill(0).map((_, i) => {
            const isHead = (hasFixedHead || hasFixedEnds) && i === 0;
            const isTail = (hasFixedTail || hasFixedEnds) && i === slots - 1;
            const locked = isHead || isTail;
            return (
              <div key={i} className={`emoji-slot ${locked ? 'locked' : 'filled'} animate-pop`}
                style={{ animationDelay: `${i * 0.05}s`, position: 'relative' }}>
                {locked ? scenario.emojiA : (i < maxB ? scenario.emojiB : '?')}
                {locked && <span style={{ position: 'absolute', top: -8, right: -6, fontSize: '0.6rem' }}>🔒</span>}
                <span className="emoji-slot-label">{i + 1}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Combination
  if (action === 'C') {
    return (
      <div style={{ ...stageStyle, flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>🎒 全部可選 ({total} 個)</div>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array(maxA).fill(0).map((_, i) => (
            <span key={`a-${i}`} className="animate-pop" style={{ fontSize: '1.4rem', animationDelay: `${i * 0.04}s` }}>{scenario.emojiA}</span>
          ))}
          {Array(maxB).fill(0).map((_, i) => (
            <span key={`b-${i}`} className="animate-pop" style={{ fontSize: '1.4rem', animationDelay: `${(maxA + i) * 0.04}s` }}>{scenario.emojiB}</span>
          ))}
        </div>
      </div>
    );
  }

  // Default P: slots
  return (
    <div style={stageStyle}>
      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array(Math.min(total, 10)).fill(0).map((_, i) => {
          const emoji = i < maxA ? scenario.emojiA : (i < maxA + maxB ? scenario.emojiB : '?');
          return (
            <div key={i} className="emoji-slot filled animate-pop" style={{ animationDelay: `${i * 0.05}s`, position: 'relative' }}>
              {emoji}
              <span className="emoji-slot-label">{i + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Complementary Visualization ────────────────────────────
function ComplementaryViz({
  totalComb, comp, ans, lang,
}: {
  totalComb: number; comp: number; ans: number; lang: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap', padding: '0.75rem 0' }}>
      {[
        { val: totalComb, label: lang === 'zh' ? '總數' : 'Total', color: 'var(--blue)', dim: 'var(--blue-dim)', size: 80 },
        { val: null, label: '−', color: 'var(--text-muted)', dim: 'transparent', size: 0 },
        { val: comp, label: lang === 'zh' ? '不符合' : 'Bad', color: 'var(--red)', dim: 'var(--red-dim)', size: 64, strike: true },
        { val: null, label: '=', color: 'var(--text-muted)', dim: 'transparent', size: 0 },
        { val: ans, label: lang === 'zh' ? '答案' : 'Answer', color: 'var(--gold)', dim: 'var(--gold-dim)', size: 80 },
      ].map((item, i) => (
        item.val === null ? (
          <span key={i} style={{ fontSize: '1.5rem', color: item.color }}>{item.label}</span>
        ) : (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              width: item.size, height: item.size, borderRadius: '50%',
              border: `2px solid ${item.color}`, background: item.dim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column', margin: '0 auto',
              opacity: item.strike ? 0.65 : 1,
            }}>
              <span style={{
                fontSize: item.size === 80 ? '1.1rem' : '0.95rem', fontWeight: 700, color: item.color,
                textDecoration: item.strike ? 'line-through' : 'none',
              }}>{item.val.toLocaleString()}</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: item.color, marginTop: 4 }}>{item.label}</div>
          </div>
        )
      ))}
    </div>
  );
}

// ── Practice Mode ──────────────────────────────────────────
function PracticeMode({ lang }: { lang: string }) {
  const [question, setQuestion] = useState<PracticeQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [showSteps, setShowSteps] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const newQuestion = useCallback(() => {
    const types: QuestionType[] = ['permutation', 'combination', 'circular'];
    const t = types[Math.floor(Math.random() * types.length)];
    setQuestion(generateQuestion(t));
    setUserAnswer('');
    setChecked(false);
    setCorrect(null);
    setShowSteps(false);
    setShowHint(false);
  }, []);

  useEffect(() => { newQuestion(); }, [newQuestion]);

  const checkAnswer = () => {
    if (!question) return;
    const ans = typeof question.answer === 'number' ? question.answer : (question.answer.num / question.answer.den);
    const userNum = parseFloat(userAnswer.replace(/,/g, ''));
    setCorrect(Math.abs(userNum - ans) < 0.5);
    setChecked(true);
  };

  if (!question) return null;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: 'var(--gold-bright)', fontWeight: 600 }}>
          🎯 {lang === 'zh' ? '隨機練習題' : 'Random Practice'}
        </h3>
        <button className="btn-secondary" onClick={newQuestion} style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}>
          {lang === 'zh' ? '換一題 ↺' : 'New Question ↺'}
        </button>
      </div>

      <div className="blue-card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-primary)' }}>
          {lang === 'zh' ? question.textZh : question.textEn}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            {lang === 'zh' ? '你的答案' : 'Your Answer'}
          </label>
          <input
            type="number"
            className="input-field"
            placeholder="0"
            value={userAnswer}
            onChange={e => { setUserAnswer(e.target.value); setChecked(false); setCorrect(null); }}
            onKeyDown={e => e.key === 'Enter' && checkAnswer()}
            style={{ width: 160 }}
          />
        </div>
        <button className="btn-primary" onClick={checkAnswer} disabled={!userAnswer} style={{ marginBottom: 1 }}>
          {lang === 'zh' ? '核對答案' : 'Check Answer'}
        </button>
      </div>

      {checked && correct !== null && (
        <div className={`alert-box animate-pop ${correct ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '0.75rem' }}>
          <span>{correct ? '✅' : '❌'}</span>
          <span>
            {correct
              ? (lang === 'zh' ? '答對了！太厲害了！🎉' : 'Correct! Well done! 🎉')
              : (lang === 'zh'
                ? `答案是 ${typeof question.answer === 'number' ? question.answer.toLocaleString() : (question.answer.num + '/' + question.answer.den)}，再試試！`
                : `The answer is ${typeof question.answer === 'number' ? question.answer.toLocaleString() : (question.answer.num + '/' + question.answer.den)}. Try again!`)
            }
          </span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={() => setShowHint(!showHint)}>
          💡 {lang === 'zh' ? '提示' : 'Hint'}
        </button>
        <button className="btn-ghost" onClick={() => setShowSteps(!showSteps)}>
          📋 {showSteps ? (lang === 'zh' ? '隱藏步驟' : 'Hide Steps') : (lang === 'zh' ? '查看步驟' : 'Show Steps')}
        </button>
      </div>

      {showHint && (
        <div className="formula-box" style={{ marginTop: '0.75rem' }}>
          <KatexRenderer latex={question.hint} display />
        </div>
      )}

      {showSteps && (
        <div style={{ marginTop: '0.75rem' }}>
          {question.steps.map((s, i) => (
            <div key={i} className="step-item animate-slide-in" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="step-num">{i + 1}</div>
              <KatexRenderer latex={s} display />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Free Calc Mode ────────────────────────────────────────
function FreeCalcTermRow({
  term, index, onUpdate, onRemove, lang,
}: {
  term: ExprTerm; index: number;
  onUpdate: (i: number, t: ExprTerm) => void;
  onRemove: (i: number) => void;
  lang: string;
}) {
  const typeLabel: Record<TermType, string> = {
    factorial: 'n!',
    permutation: lang === 'zh' ? 'P(n,r) 排列' : 'P(n,r) Perm',
    combination: lang === 'zh' ? 'C(n,r) 組合' : 'C(n,r) Comb',
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-md)', padding: '0.5rem 0.65rem', flexWrap: 'wrap',
    }}>
      <select value={term.type}
        onChange={e => {
          const nt = e.target.value as TermType;
          onUpdate(index, { ...term, type: nt, r: nt === 'factorial' ? undefined : (term.r ?? 1) });
        }}
        style={{
          padding: '0.25rem 0.4rem', borderRadius: 'var(--r-sm)',
          border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)',
          color: 'var(--text-primary)', fontSize: '0.75rem', cursor: 'pointer',
        }}>
        {(['factorial', 'permutation', 'combination'] as TermType[]).map(t => (
          <option key={t} value={t}>{typeLabel[t]}</option>
        ))}
      </select>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>n=</span>
        <input type="number" min={0} max={20} value={term.n}
          onChange={e => onUpdate(index, { ...term, n: Math.max(0, Math.min(20, parseInt(e.target.value) || 0)) })}
          style={{
            width: 44, padding: '0.25rem 0.35rem', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)',
            color: 'var(--text-primary)', fontSize: '0.8rem', textAlign: 'center',
          }} />
      </div>
      {term.type !== 'factorial' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>r=</span>
          <input type="number" min={0} max={term.n} value={term.r ?? 0}
            onChange={e => onUpdate(index, { ...term, r: Math.max(0, Math.min(term.n, parseInt(e.target.value) || 0)) })}
            style={{
              width: 44, padding: '0.25rem 0.35rem', borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)',
              color: 'var(--text-primary)', fontSize: '0.8rem', textAlign: 'center',
            }} />
        </div>
      )}
      <div style={{
        flex: 1, minWidth: 60, padding: '0.2rem 0.4rem',
        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)',
        borderRadius: 'var(--r-sm)', overflow: 'hidden',
      }}>
        <KatexRenderer latex={`\\displaystyle ${termToLatex(term)}`} display={false} />
      </div>
      <div style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
        {(() => { try { return '= ' + evalTerm(term).toLocaleString(); } catch { return '—'; } })()}
      </div>
      <button onClick={() => onRemove(index)}
        style={{
          width: 22, height: 22, borderRadius: '50%',
          background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
          color: '#e74c3c', cursor: 'pointer', fontSize: '0.75rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>×</button>
    </div>
  );
}

function FreeCalcTermList({
  label, terms, onChange, lang, accentColor,
}: {
  label: string; terms: ExprTerm[];
  onChange: (t: ExprTerm[]) => void;
  lang: string; accentColor: string;
}) {
  const addTerm = (type: TermType) =>
    onChange([...terms, { type, n: 5, r: type === 'factorial' ? undefined : 2 }]);
  const updateTerm = (i: number, t: ExprTerm) => { const n = [...terms]; n[i] = t; onChange(n); };
  const removeTerm = (i: number) => onChange(terms.filter((_, idx) => idx !== i));
  let productVal = 1; let productErr = '';
  try { productVal = evalTermList(terms); } catch (e: unknown) { productErr = e instanceof Error ? e.message : 'Error'; }
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ width: 4, height: 16, background: accentColor, borderRadius: 2 }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gold-bright)' }}>{label}</span>
          {terms.length > 0 && !productErr && (
            <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600 }}>= {productVal.toLocaleString()}</span>
          )}
          {productErr && <span style={{ fontSize: '0.68rem', color: '#e74c3c' }}>⚠️ {productErr}</span>}
        </div>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {(['factorial', 'permutation', 'combination'] as TermType[]).map(t => (
            <button key={t} onClick={() => addTerm(t)}
              style={{
                padding: '0.2rem 0.5rem', borderRadius: 'var(--r-sm)',
                border: `1px solid ${accentColor}50`, background: `${accentColor}18`,
                color: accentColor, fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
              }}>
              + {t === 'factorial' ? 'n!' : t === 'permutation' ? 'P(n,r)' : 'C(n,r)'}
            </button>
          ))}
        </div>
      </div>
      {terms.length === 0 ? (
        <div style={{
          padding: '0.5rem 0.75rem', background: 'rgba(255,255,255,0.03)',
          border: '1px dashed var(--border)', borderRadius: 'var(--r-md)',
          fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center',
        }}>{lang === 'zh' ? '點擊上方按鈕加入項目' : 'Click buttons above to add terms'}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {terms.map((t, i) => (
            <FreeCalcTermRow key={i} term={t} index={i} onUpdate={updateTerm} onRemove={removeTerm} lang={lang} />
          ))}
          {terms.length > 1 && (
            <div style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-light)', borderRadius: 'var(--r-sm)', overflowX: 'auto' }}>
              <KatexRenderer display={false} latex={`\\displaystyle ${terms.map(t => termToLatex(t)).join(' \\times ')}`} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FreeCalcMode({ lang }: { lang: string }) {
  const zh = (z: string, e: string) => lang === 'zh' ? z : e;
  const [numTerms, setNumTerms] = useState<ExprTerm[]>([{ type: 'permutation', n: 5, r: 3 }]);
  const [denTerms, setDenTerms] = useState<ExprTerm[]>([]);
  const [result, setResult] = useState<{ value: number; latex: string; steps: string[] } | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    setError(''); setResult(null);
    if (numTerms.length === 0) { setError(zh('請在分子加入至少一個項目', 'Add at least one term to the numerator')); return; }
    try { setResult(flexibleCount(numTerms, denTerms)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
  };

  // Live formula preview
  const numL = numTerms.length > 0 ? numTerms.map(t => termToLatex(t)).join(' \\times ') : '?';
  const denL = denTerms.length > 0 ? denTerms.map(t => termToLatex(t)).join(' \\times ') : '';
  const previewLatex = denL ? `\\dfrac{${numL}}{${denL}}` : numL;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <div style={{ fontSize: '1.5rem' }}>🔢</div>
        <div>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1rem', color: 'var(--gold-bright)', fontWeight: 600 }}>
            {zh('自由計算模式', 'Free Calculation Mode')}
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            {zh('自由組合 n!、P(n,r)、C(n,r)，支援混合算式', 'Mix n!, P(n,r), C(n,r) freely — numerator ÷ denominator')}
          </p>
        </div>
      </div>

      {/* Live formula preview */}
      <div className="formula-box" style={{ marginBottom: '1rem' }}>
        <KatexRenderer display latex={`\\displaystyle ${previewLatex}`} />
      </div>

      {/* Tip */}
      <div style={{
        background: 'rgba(212,168,67,0.06)', border: '1px solid rgba(212,168,67,0.2)',
        borderLeft: '4px solid var(--gold)', borderRadius: 'var(--r-md)',
        padding: '0.6rem 0.85rem', marginBottom: '1rem',
        fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6,
      }}>
        {zh(
          '💡 例如：5! × C(4,2)　或　P(6,3) / 2!　或　C(5,2) × P(3,2) / C(8,4)',
          '💡 e.g. 5! × C(4,2)  or  P(6,3) / 2!  or  C(5,2) × P(3,2) / C(8,4)',
        )}
      </div>

      {/* Numerator */}
      <FreeCalcTermList
        label={zh('分子（Numerator）', 'Numerator')}
        terms={numTerms}
        onChange={t => { setNumTerms(t); setResult(null); setError(''); }}
        lang={lang}
        accentColor="var(--gold)"
      />

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0 0.85rem' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>÷ {zh('（選填）', '(optional)')}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      {/* Denominator */}
      <FreeCalcTermList
        label={zh('分母（Denominator，選填）', 'Denominator (optional)')}
        terms={denTerms}
        onChange={t => { setDenTerms(t); setResult(null); setError(''); }}
        lang={lang}
        accentColor="#7ec8a4"
      />

      <button className="btn-primary" onClick={calculate} style={{ marginTop: '0.5rem' }}>
        {zh('計算', 'Calculate')}
      </button>

      {error && (
        <div style={{
          marginTop: '0.75rem', padding: '0.6rem 0.85rem',
          background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.3)',
          borderLeft: '4px solid #e74c3c', borderRadius: 'var(--r-md)',
          fontSize: '0.8rem', color: '#e74c3c',
        }}>⚠️ {error}</div>
      )}

      {result && (
        <div style={{ marginTop: '1rem' }}>
          {/* Big answer */}
          <div className="result-box animate-pop" style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {zh('答案', 'Answer')}
            </div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.8rem', fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1 }}>
              {result.value.toLocaleString()}
            </div>
          </div>
          {/* Steps */}
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
              {zh('解題步驟', 'Step-by-Step Solution')}
            </h3>
            {result.steps.map((s, i) => (
              <div key={i} className="step-item animate-slide-in" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="step-num">{i + 1}</div>
                <div style={{ flex: 1 }}><KatexRenderer latex={s} display /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function PCPage() {
  const { lang } = useLang();
  const [step, setStep] = useState(1);
  const [scenarioKey, setScenarioKey] = useState<ScenarioKey>('school');
  const [countA, setCountA] = useState(3);
  const [countB, setCountB] = useState(5);
  const [action, setAction] = useState<Action>('P');
  const [circular, setCircular] = useState(false);
  const [selectCount, setSelectCount] = useState(4);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [atLeastVal, setAtLeastVal] = useState(1);
  const [atMostVal, setAtMostVal] = useState(1);
  const [exactlyVal, setExactlyVal] = useState(1);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [showPractice, setShowPractice] = useState(false);
  const [showFreeCalc, setShowFreeCalc] = useState(false);

  const scenario = SCENARIOS[scenarioKey];
  const zh = (zh: string, en: string) => lang === 'zh' ? zh : en;

  const toggleConstraint = (type: ConstraintType) => {
    setConstraints(prev => {
      const exists = prev.some(c => c.type === type);
      if (exists) return prev.filter(c => c.type !== type);
      return [...prev, { type }];
    });
  };
  const hasC = (type: ConstraintType) => constraints.some(c => c.type === type);

  const handleCalculate = () => {
    const updated = constraints.map(c => {
      if (c.type === 'at_least') return { ...c, value: atLeastVal };
      if (c.type === 'at_most') return { ...c, value: atMostVal };
      if (c.type === 'exactly') return { ...c, value: exactlyVal };
      return c;
    });
    const r = calculate(action, countA, countB, selectCount, updated, circular, scenario);
    setResult(r);
    setStep(5);
  };

  const stepLabels = [
    zh('選情境', 'Scenario'),
    zh('設數量', 'Counts'),
    zh('選動作', 'Action'),
    zh('加條件', 'Constraints'),
    zh('看結果', 'Results'),
  ];

  const conflictAdj = hasC('adjacent') && hasC('non_adjacent');

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 1rem 3rem' }}>

      {/* ── Step Wizard ── */}
      <div style={{ padding: '1.5rem 0 1.25rem' }}>
        <div className="step-wizard">
          {stepLabels.map((label, i) => {
            const num = i + 1;
            const isDone = step > num;
            const isActive = step === num;
            return (
              <div key={num} style={{ display: 'flex', alignItems: 'center' }}>
                <div className="step-dot" onClick={() => num < step && setStep(num)}
                  style={{ cursor: num < step ? 'pointer' : 'default' }}>
                  <div className={`step-dot-circle ${isDone ? 'done' : isActive ? 'active' : ''}`}>
                    {isDone ? '✓' : num}
                  </div>
                  <span className={`step-dot-label ${isDone ? 'done' : isActive ? 'active' : ''}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`step-connector ${isDone ? 'done' : ''}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 1: Scenario ── */}
      {step === 1 && (
        <div className="animate-fade-in-up">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            {zh('選擇故事背景', 'Choose a Scenario')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {zh('選一個你喜歡的情境，讓數學更有趣！', 'Pick a scenario to make maths more engaging!')}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))', gap: '0.85rem' }}>
            {(Object.entries(SCENARIOS) as [ScenarioKey, Scenario][]).map(([key, sc]) => (
              <div key={key}
                onClick={() => setScenarioKey(key)}
                style={{
                  padding: '1.25rem 1rem',
                  borderRadius: 'var(--r-lg)',
                  border: `2px solid ${scenarioKey === key ? 'rgba(212,168,67,0.6)' : 'var(--border)'}`,
                  background: scenarioKey === key ? 'rgba(212,168,67,0.07)' : sc.bgColor,
                  cursor: 'pointer',
                  transition: 'all 0.2s var(--ease-out)',
                  textAlign: 'center',
                }}>
                <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>{sc.emojiA}{sc.emojiB}</div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: scenarioKey === key ? 'var(--gold-bright)' : 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  {zh(sc.nameZh, sc.nameEn)}
                </div>
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  {zh(sc.descZh, sc.descEn)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-primary" onClick={() => setStep(2)}>
              {zh('下一步', 'Next')} →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Counts ── */}
      {step === 2 && (
        <div className="animate-fade-in-up">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            {zh('輸入基本數量', 'Set the Counts')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {zh(`情境：${scenario.nameZh}`, `Scenario: ${scenario.nameEn}`)}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                {scenario.emojiA} {zh(scenario.typeAZh, scenario.typeAEn)} {zh('人數', 'Count')}
              </label>
              <input type="number" className="input-field" min={0} max={15}
                value={countA} onChange={e => setCountA(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                {scenario.emojiB} {zh(scenario.typeBZh, scenario.typeBEn)} {zh('人數', 'Count')}
              </label>
              <input type="number" className="input-field" min={0} max={15}
                value={countB} onChange={e => setCountB(Math.max(0, parseInt(e.target.value) || 0))} />
            </div>
          </div>

          {/* Live emoji preview */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {zh('即時預覽', 'Live Preview')}
            </div>
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: '0.35rem', padding: '0.85rem 1rem',
              background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)', minHeight: 56,
            }}>
              {Array(Math.min(countA, 12)).fill(0).map((_, i) => (
                <span key={`a-${i}`} style={{ fontSize: '1.5rem' }} className="animate-pop">{scenario.emojiA}</span>
              ))}
              {Array(Math.min(countB, Math.max(0, 12 - countA))).fill(0).map((_, i) => (
                <span key={`b-${i}`} style={{ fontSize: '1.5rem' }} className="animate-pop">{scenario.emojiB}</span>
              ))}
              {(countA + countB > 12) && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'center' }}>
                  +{countA + countB - 12} {zh('更多', 'more')}
                </span>
              )}
              {(countA + countB === 0) && (
                <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  {zh('請輸入數量…', 'Enter counts above…')}
                </span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>← {zh('上一步', 'Back')}</button>
            <button className="btn-primary" onClick={() => setStep(3)} disabled={countA + countB === 0}>
              {zh('下一步', 'Next')} →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Action ── */}
      {step === 3 && (
        <div className="animate-fade-in-up">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            {zh('決定數學動作', 'Choose the Action')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {zh('排次序，還是抽人？', 'Arrange in order, or just select?')}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            {/* Permutation */}
            <div
              onClick={() => { setAction('P'); setCircular(false); }}
              style={{
                padding: '1.25rem', borderRadius: 'var(--r-lg)', cursor: 'pointer',
                border: `2px solid ${action === 'P' ? 'rgba(212,168,67,0.6)' : 'var(--border)'}`,
                background: action === 'P' ? 'rgba(212,168,67,0.07)' : 'var(--bg-card)',
                transition: 'all 0.2s var(--ease-out)',
              }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🅰️</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: action === 'P' ? 'var(--gold-bright)' : 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {zh('排次序 (P)', 'Permutation (P)')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                {zh('順序很重要！邊個坐邊度有分別。', 'Order matters! Position makes a difference.')}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span className="badge badge-gold">{zh('排座位', 'Seating')}</span>
                <span className="badge badge-gold">{zh('影相', 'Photo')}</span>
                <span className="badge badge-gold">{zh('選隊長', 'Captain')}</span>
              </div>
            </div>

            {/* Combination */}
            <div
              onClick={() => { setAction('C'); setCircular(false); }}
              style={{
                padding: '1.25rem', borderRadius: 'var(--r-lg)', cursor: 'pointer',
                border: `2px solid ${action === 'C' ? 'rgba(107,155,210,0.6)' : 'var(--border)'}`,
                background: action === 'C' ? 'rgba(107,155,210,0.07)' : 'var(--bg-card)',
                transition: 'all 0.2s var(--ease-out)',
              }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>🅱️</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: action === 'C' ? 'var(--blue-bright)' : 'var(--text-primary)', marginBottom: '0.4rem' }}>
                {zh('抽人 (C)', 'Combination (C)')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                {zh('順序不重要！只看誰被選中。', 'Order does not matter! Only who is selected.')}
              </div>
              <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                <span className="badge badge-blue">{zh('委員會', 'Committee')}</span>
                <span className="badge badge-blue">{zh('選菜', 'Menu')}</span>
                <span className="badge badge-blue">{zh('抽獎', 'Draw')}</span>
              </div>
            </div>
          </div>

          {/* Circular option */}
          {action === 'P' && (
            <div
              onClick={() => setCircular(!circular)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '1rem',
                borderRadius: 'var(--r-md)', cursor: 'pointer',
                border: `1.5px solid ${circular ? 'rgba(212,168,67,0.5)' : 'var(--border)'}`,
                background: circular ? 'rgba(212,168,67,0.06)' : 'var(--bg-card)',
                transition: 'all 0.2s', marginBottom: '1rem',
              }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border: `2px solid ${circular ? 'var(--gold)' : 'var(--border)'}`,
                background: circular ? 'var(--gold)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {circular && <span style={{ color: '#1A1000', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: circular ? 'var(--gold-bright)' : 'var(--text-primary)' }}>
                  ⭕ {zh('圓形排列 (Circular)', 'Circular Permutation')}
                </div>
                <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', marginTop: 3 }}>
                  {zh('圍坐圓桌，旋轉不算不同排法。公式：(n−1)!', 'Seated around a table. Rotations are identical. Formula: (n−1)!')}
                </div>
              </div>
            </div>
          )}

          {/* Select count for C */}
          {action === 'C' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                {zh('選取人數 r', 'Select Count r')}
              </label>
              <input type="number" className="input-field" min={1} max={countA + countB}
                value={selectCount}
                onChange={e => setSelectCount(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ maxWidth: 160 }} />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => setStep(2)}>← {zh('上一步', 'Back')}</button>
            <button className="btn-primary" onClick={() => setStep(4)}>{zh('下一步', 'Next')} →</button>
          </div>
        </div>
      )}

      {/* ── Step 4: Constraints ── */}
      {step === 4 && (
        <div className="animate-fade-in-up">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
            {zh('加入限制條件', 'Add Constraints')}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
            {zh('可選擇多個條件（如有衝突會自動提示）', 'Multiple constraints allowed — conflicts will be flagged')}
          </p>

          {conflictAdj && (
            <div className="alert-box alert-error animate-shake" style={{ marginBottom: '1rem' }}>
              ⚠️ {zh(
                `${scenario.typeAZh}們表示很傲嬌，他們不能同時黏在一起又分開坐喔！請取消其中一個條件。😅`,
                `Conflict! ${scenario.typeAEn}s cannot be both adjacent AND non-adjacent. Please remove one. 😅`
              )}
            </div>
          )}

          {action === 'P' && !circular && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {[
                {
                  type: 'adjacent' as ConstraintType,
                  icon: '🔗',
                  labelZh: `必須相鄰（捆綁法）`,
                  labelEn: 'Must be Adjacent (Bundling)',
                  descZh: `所有${scenario.typeAZh}必須緊靠在一起。公式：(B+1)! × A!`,
                  descEn: `All ${scenario.typeAEn}s must be together. Formula: (B+1)! × A!`,
                },
                {
                  type: 'non_adjacent' as ConstraintType,
                  icon: '↕️',
                  labelZh: `不能相鄰（插空法）`,
                  labelEn: 'Cannot be Adjacent (Separation)',
                  descZh: `${scenario.typeAZh}之間不能緊靠。公式：B! × P(B+1, A)`,
                  descEn: `No two ${scenario.typeAEn}s can be next to each other. Formula: B! × P(B+1, A)`,
                },
                {
                  type: 'fixed_ends' as ConstraintType,
                  icon: '🔒',
                  labelZh: `指定首尾（A類必須在兩端）`,
                  labelEn: 'Fixed Ends (A-type at both ends)',
                  descZh: `${scenario.typeAZh}必須排在隊頭和隊尾。公式：P(A,2) × (n−2)!`,
                  descEn: `${scenario.typeAEn}s must be at head and tail. Formula: P(A,2) × (n−2)!`,
                },
                {
                  type: 'fixed_head' as ConstraintType,
                  icon: '🥇',
                  labelZh: `指定首位（A類必須在隊頭）`,
                  labelEn: 'Fixed Head (A-type at head)',
                  descZh: `${scenario.typeAZh}必須排在第一位。公式：A × (n−1)!`,
                  descEn: `${scenario.typeAEn} must be at position 1. Formula: A × (n−1)!`,
                },
                {
                  type: 'fixed_tail' as ConstraintType,
                  icon: '🏁',
                  labelZh: `指定尾位（A類必須在隊尾）`,
                  labelEn: 'Fixed Tail (A-type at tail)',
                  descZh: `${scenario.typeAZh}必須排在最後一位。公式：A × (n−1)!`,
                  descEn: `${scenario.typeAEn} must be at the last position. Formula: A × (n−1)!`,
                },
              ].map(item => (
                <div key={item.type}
                  onClick={() => toggleConstraint(item.type)}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1rem',
                    borderRadius: 'var(--r-md)', cursor: 'pointer',
                    border: `1.5px solid ${hasC(item.type) ? 'rgba(212,168,67,0.5)' : 'var(--border)'}`,
                    background: hasC(item.type) ? 'rgba(212,168,67,0.06)' : 'var(--bg-card)',
                    transition: 'all 0.18s',
                  }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                    border: `2px solid ${hasC(item.type) ? 'var(--gold)' : 'var(--border)'}`,
                    background: hasC(item.type) ? 'var(--gold)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {hasC(item.type) && <span style={{ color: '#1A1000', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: hasC(item.type) ? 'var(--gold-bright)' : 'var(--text-primary)' }}>
                      {item.icon} {zh(item.labelZh, item.labelEn)}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
                      {zh(item.descZh, item.descEn)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {action === 'C' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.25rem' }}>
              {/* At Least */}
              <div
                onClick={() => toggleConstraint('at_least')}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1rem',
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  border: `1.5px solid ${hasC('at_least') ? 'rgba(212,168,67,0.5)' : 'var(--border)'}`,
                  background: hasC('at_least') ? 'rgba(212,168,67,0.06)' : 'var(--bg-card)',
                  transition: 'all 0.18s',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${hasC('at_least') ? 'var(--gold)' : 'var(--border)'}`,
                  background: hasC('at_least') ? 'var(--gold)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {hasC('at_least') && <span style={{ color: '#1A1000', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: hasC('at_least') ? 'var(--gold-bright)' : 'var(--text-primary)' }}>
                    ✂️ {zh(`至少（餘事法）`, 'At Least (Complementary)')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3, marginBottom: hasC('at_least') ? 8 : 0 }}>
                    {zh(`至少有多少個${scenario.typeAZh}被選中。用「總數 − 反面」計算。`, `At least how many ${scenario.typeAEn}s must be selected. Uses "Total − Complementary".`)}
                  </div>
                  {hasC('at_least') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{zh('至少', 'At least')}</span>
                      <input type="number" className="input-field" min={1} max={countA}
                        value={atLeastVal}
                        onChange={e => setAtLeastVal(Math.max(1, parseInt(e.target.value) || 1))}
                        style={{ width: 70 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{zh(`個${scenario.typeAZh}`, `${scenario.typeAEn}(s)`)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* At Most */}
              <div
                onClick={() => toggleConstraint('at_most')}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1rem',
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  border: `1.5px solid ${hasC('at_most') ? 'rgba(107,155,210,0.5)' : 'var(--border)'}`,
                  background: hasC('at_most') ? 'rgba(107,155,210,0.06)' : 'var(--bg-card)',
                  transition: 'all 0.18s',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${hasC('at_most') ? 'var(--blue)' : 'var(--border)'}`,
                  background: hasC('at_most') ? 'var(--blue)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {hasC('at_most') && <span style={{ color: '#0A1020', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: hasC('at_most') ? 'var(--blue-bright)' : 'var(--text-primary)' }}>
                    📊 {zh(`至多（分類討論）`, 'At Most (Case Analysis)')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3, marginBottom: hasC('at_most') ? 8 : 0 }}>
                    {zh(`最多有多少個${scenario.typeAZh}被選中。逐一列舉所有情況。`, `At most how many ${scenario.typeAEn}s can be selected. Enumerate all cases.`)}
                  </div>
                  {hasC('at_most') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{zh('至多', 'At most')}</span>
                      <input type="number" className="input-field" min={0} max={countA}
                        value={atMostVal}
                        onChange={e => setAtMostVal(Math.max(0, parseInt(e.target.value) || 0))}
                        style={{ width: 70 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{zh(`個${scenario.typeAZh}`, `${scenario.typeAEn}(s)`)}</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Exactly k */}
              <div
                onClick={() => toggleConstraint('exactly')}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.9rem 1rem',
                  borderRadius: 'var(--r-md)', cursor: 'pointer',
                  border: `1.5px solid ${hasC('exactly') ? 'rgba(126,200,164,0.5)' : 'var(--border)'}`,
                  background: hasC('exactly') ? 'rgba(126,200,164,0.06)' : 'var(--bg-card)',
                  transition: 'all 0.18s',
                }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1,
                  border: `2px solid ${hasC('exactly') ? 'var(--green)' : 'var(--border)'}`,
                  background: hasC('exactly') ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {hasC('exactly') && <span style={{ color: '#0A1A10', fontSize: '0.65rem', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: hasC('exactly') ? 'var(--green-bright, #2A7F6F)' : 'var(--text-primary)' }}>
                    🎯 {zh(`恰好（直接計算）`, 'Exactly k (Direct Calculation)')}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 3, marginBottom: hasC('exactly') ? 8 : 0 }}>
                    {zh(`恰好有多少個${scenario.typeAZh}被選中。公式：C(A,k) × C(B, r−k)`, `Exactly how many ${scenario.typeAEn}s must be selected. Formula: C(A,k) × C(B, r−k)`)}
                  </div>
                  {hasC('exactly') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                      onClick={e => e.stopPropagation()}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{zh('恰好', 'Exactly')}</span>
                      <input type="number" className="input-field" min={0} max={countA}
                        value={exactlyVal}
                        onChange={e => setExactlyVal(Math.max(0, parseInt(e.target.value) || 0))}
                        style={{ width: 70 }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{zh(`個${scenario.typeAZh}`, `${scenario.typeAEn}(s)`)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {circular && (
            <div className="alert-box alert-warning" style={{ marginBottom: '1rem' }}>
              ⭕ {zh('已選擇圓形排列，條件限制不適用。', 'Circular permutation selected — constraints are not applicable.')}
            </div>
          )}

          {constraints.length === 0 && !circular && (
            <div className="alert-box" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', marginBottom: '1rem', color: 'var(--text-muted)' }}>
              ℹ️ {zh('未選擇任何條件，將計算基本排列/組合。', 'No constraints selected — basic permutation/combination will be calculated.')}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={() => setStep(3)}>← {zh('上一步', 'Back')}</button>
            <button className="btn-primary" onClick={handleCalculate} disabled={conflictAdj}>
              🔮 {zh('觀看模擬與公式', 'Simulate & Calculate')}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Results ── */}
      {step === 5 && result && (
        <div className="animate-fade-in-up">
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>
            {zh('模擬結果', 'Simulation Results')}
          </h2>

          {/* Error */}
          {result.error && (
            <div className="alert-box alert-error animate-shake" style={{ marginBottom: '1.25rem' }}>
              <span>⚠️</span>
              <span>{lang === 'zh' ? result.errorZh : result.error}</span>
            </div>
          )}

          {!result.error && (
            <>
              {/* Method */}
              <div style={{ marginBottom: '1rem' }}>
                <span className="badge badge-gold" style={{ fontSize: '0.78rem' }}>
                  {zh(result.methodZh, result.methodEn)}
                </span>
              </div>

              {/* Emoji Visualization */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  {zh('視覺化', 'Visualization')}
                </div>
                <EmojiStage scenario={scenario} countA={countA} countB={countB}
                  action={action} constraints={constraints} circular={circular} />
              </div>

              {/* Complementary Viz */}
              {result.complementary !== undefined && result.totalForComp !== undefined && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {zh('餘事法視覺化', 'Complementary Visualization')}
                  </div>
                  <div className="glass-card" style={{ padding: '1rem' }}>
                    <ComplementaryViz
                      totalComb={result.totalForComp}
                      comp={result.complementary}
                      ans={result.answer}
                      lang={lang}
                    />
                  </div>
                </div>
              )}

              {/* Answer */}
              <div className="result-box animate-pop" style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--gold)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  {zh('答案', 'Answer')}
                </div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: '2.8rem', fontWeight: 700, color: 'var(--gold-bright)', lineHeight: 1 }}>
                  {result.answer.toLocaleString()}
                </div>
              </div>

              {/* Steps */}
              <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                  {zh('解題步驟', 'Step-by-Step Solution')}
                </h3>
                {result.steps.map((s, i) => (
                  <div key={i} className="step-item animate-slide-in" style={{ animationDelay: `${i * 0.06}s` }}>
                    <div className="step-num">{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <KatexRenderer latex={s.latex} display />
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                        {lang === 'zh' ? s.noteZh : s.noteEn}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn-secondary" onClick={() => { setStep(1); setResult(null); setConstraints([]); setCircular(false); }}>
              🔄 {zh('重新開始', 'Start Over')}
            </button>
            <button className="btn-secondary" onClick={() => setStep(4)}>
              ← {zh('修改條件', 'Edit Constraints')}
            </button>
                        <button className="btn-ghost" onClick={() => setShowPractice(!showPractice)}>
              🎯 {zh('隨機練習題', 'Practice Questions')}
            </button>
            <button className="btn-ghost" onClick={() => setShowFreeCalc(!showFreeCalc)}>
              🔢 {zh('自由計算', 'Free Calc')}
            </button>
          </div>
          {/* Free Calc Mode */}
          {showFreeCalc && <FreeCalcMode lang={lang} />}
          {/* Practice Mode */}
          {showPractice && <PracticeMode lang={lang} />}
        </div>
      )}
    </div>
  );
}
