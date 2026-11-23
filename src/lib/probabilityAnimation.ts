import {
  animationCopy as copy,
  animationItems,
  type ContextAnimationModel,
  type ContextRow,
  type ContextStep,
} from './contextAnimation';
import {
  evalTermListExact,
  flexibleProbability,
  termListToLatex,
  type ExprTerm,
} from './mathEngine';

export type ProbabilityPreset = 'choose' | 'order' | 'mixed';

/** Labels and identities come from the current page, not a separate demo story. */
export interface ProbabilityAnimationScenario {
  nameZh: string;
  nameEn: string;
  emojiA: string;
  emojiB: string;
  typeAZh: string;
  typeAEn: string;
  typeBZh: string;
  typeBEn: string;
}

/** The page's three stories each have five distinct A, five distinct B and three draws. */
export function probabilityPresetTerms(preset: ProbabilityPreset): {
  numerator: ExprTerm[];
  denominator: ExprTerm[];
} {
  return {
    numerator: preset === 'order'
      ? [{ type: 'permutation', n: 5, r: 3 }]
      : [
          { type: 'combination', n: 5, r: 2 },
          { type: 'combination', n: 5, r: 1 },
          ...(preset === 'mixed' ? [{ type: 'factorial' as const, n: 3 }] : []),
        ],
    denominator: [{ type: preset === 'choose' ? 'combination' : 'permutation', n: 10, r: 3 }],
  };
}

export function buildProbabilityAnimation(
  scenarioKey: string,
  scenario: ProbabilityAnimationScenario,
  preset: ProbabilityPreset,
): ContextAnimationModel {
  const aLabel = copy(scenario.typeAZh, scenario.typeAEn);
  const bLabel = copy(scenario.typeBZh, scenario.typeBEn);
  const items = [
    ...animationItems('A', 5, aLabel, scenario.emojiA, 'A'),
    ...animationItems('B', 5, bLabel, scenario.emojiB, 'B'),
  ];
  const aIds = items.filter(item => item.category === 'A').map(item => item.id);
  const bIds = items.filter(item => item.category === 'B').map(item => item.id);
  const selected = ['A1', 'A2', 'B1'];
  const positions = [1, 2, 3].map(i => copy(`第 ${i} 個位置`, `Position ${i}`));
  const orderedRow = (ids: string[], label: ContextRow['label']): ContextRow => ({
    label, ids, style: 'line', roles: positions,
  });
  const pools = (selectedA: string[] = [], selectedB: string[] = []): ContextRow[] => {
    const remainingA = aIds.filter(id => !selectedA.includes(id));
    const remainingB = bIds.filter(id => !selectedB.includes(id));
    const hasSelection = selectedA.length + selectedB.length > 0;
    return [
      { label: copy(`${hasSelection ? '尚未選取：' : ''}${remainingA.length} 個相異${aLabel.zh}`, `${hasSelection ? 'Not selected: ' : ''}${remainingA.length} distinct ${aLabel.en} items`), ids: remainingA, style: 'pool' },
      { label: copy(`${hasSelection ? '尚未選取：' : ''}${remainingB.length} 個相異${bLabel.zh}`, `${hasSelection ? 'Not selected: ' : ''}${remainingB.length} distinct ${bLabel.en} items`), ids: remainingB, style: 'pool' },
    ];
  };
  const terms = probabilityPresetTerms(preset);
  const numerator = evalTermListExact(terms.numerator);
  const denominator = evalTermListExact(terms.denominator);
  const result = flexibleProbability(terms.numerator, terms.denominator);
  const steps: ContextStep[] = [{
    title: copy('先看本題的完整來源', 'Start with this question’s full pool'),
    reason: copy(
      `本題有 5 個相異${aLabel.zh}和 5 個相異${bLabel.zh}，共 10 個；不放回地選 3 個。卡片上的編號只用來區分相異人物／物件。`,
      `There are 5 distinct ${aLabel.en} and 5 distinct ${bLabel.en} items: 10 in total, with 3 chosen without replacement. Card numbers identify distinct people/items only.`,
    ),
    pitfall: copy('不是「5 選 3」的另一道示例；分母必須從全部 10 個出發。', 'This is not a separate 5-choose-3 demo. The denominator uses all 10 items.'),
    latex: '\\displaystyle n_A=5,\\quad n_B=5,\\quad n=10,\\quad r=3',
    rows: pools(),
  }];

  if (preset === 'choose') {
    steps.push({
      title: copy('樣本空間：不計次序的三個一組', 'Sample space: unordered groups of three'),
      reason: copy(
        '每個三個一組的選法等可能。下方兩列的成員完全相同，所以是同一個結果；120 是所有不同小組的總數。',
        'Every group of three is equally likely. Both rows below contain exactly the same members, so they are one outcome. There are 120 different groups in total.',
      ),
      pitfall: copy('改變列出成員的次序不會產生新小組，不能乘 3!。', 'Changing the display order does not create a new group: do not multiply by 3!.'),
      latex: `\\displaystyle N(\\Omega)=${termListToLatex(terms.denominator)}=\\frac{10\\times9\\times8}{3!}=${denominator}`,
      rows: [
        { label: copy('比較圖 1：其中一個小組', 'Comparison 1: one group'), ids: selected, style: 'team' },
        { label: copy('比較圖 2：同一批身份，是同一小組', 'Comparison 2: the same identities form the same group'), ids: ['B1', 'A2', 'A1'], style: 'team' },
      ],
    });
  } else {
    steps.push({
      title: copy('樣本空間：第一、第二、第三個位置', 'Sample space: positions 1, 2 and 3'),
      reason: copy(
        '第一個位置有 10 個選擇，第二個剩 9 個，第三個剩 8 個。下方交換兩張卡片後，位置不同，便是不同的有序結果。',
        'Position 1 has 10 choices, position 2 has 9 remaining, and position 3 has 8. Swapping two cards changes their positions and creates a different ordered outcome.',
      ),
      pitfall: copy('只使用題目原有的編號位置，不額外設定職位；不放回，所以不能計 10³。', 'Use only the numbered positions in the story, not invented roles. Without replacement, the count is not 10³.'),
      latex: `\\displaystyle N(\\Omega)=${termListToLatex(terms.denominator)}=10\\times9\\times8=${denominator}`,
      rows: [
        orderedRow(selected, copy('比較圖 1：一個有序結果', 'Comparison 1: one ordered outcome')),
        orderedRow(['B1', 'A2', 'A1'], copy('比較圖 2：同一批身份交換位置，是不同結果', 'Comparison 2: same identities, swapped positions, different outcome')),
      ],
    });
  }

  if (preset === 'order') {
    for (let count = 1; count <= 3; count++) {
      const ids = aIds.slice(0, count);
      steps.push({
        title: copy(`有利結果：填入第 ${count} 個位置`, `Favourable outcomes: fill position ${count}`),
        reason: copy(
          `三個位置都必須是${aLabel.zh}。第 ${count} 個位置有 ${6 - count} 個尚未使用的${aLabel.zh}可選。圖中只展示一條符合條件的安排，不是列出全部有利結果。`,
          `All three positions must contain ${aLabel.en}. Position ${count} has ${6 - count} unused ${aLabel.en} choices. This illustrates one favourable arrangement, not all favourable outcomes.`,
        ),
        pitfall: copy(`不能選${bLabel.zh}，也不能重複選已用的${aLabel.zh}。`, `Do not choose ${bLabel.en} or reuse a selected ${aLabel.en}.`),
        latex: count === 3
          ? `\\displaystyle N(E)=${termListToLatex(terms.numerator)}=5\\times4\\times3=${numerator}`
          : `\\displaystyle ${Array.from({ length: count }, (_, i) => String(5 - i)).join('\\times')}=${evalTermListExact([{ type: 'permutation', n: 5, r: count }])}`,
        rows: [
          ...pools(ids),
          { label: copy('同一個示例安排，逐個位置填入', 'Fill the same example arrangement one position at a time'), ids, style: 'line', roles: positions.slice(0, count) },
        ],
      });
    }
  } else {
    steps.push({
      title: copy(`有利成員：從 5 個${aLabel.zh}選 2 個`, `Favourable members: choose 2 of the 5 ${aLabel.en} items`),
      reason: copy(
        `要恰好 2 個${aLabel.zh}，先從它們的 5 個相異成員中選 2 個。圖中把其中一對移到已選小組，來源池剩 3 個；共有 10 對可選。這一階段只選成員，不安排位置。`,
        `For exactly 2 ${aLabel.en}, choose 2 of their 5 distinct members. One pair moves into the selected group, leaving 3 in its source pool; there are 10 possible pairs. At this stage, select members without assigning positions.`,
      ),
      pitfall: copy('這一對不分先後，不能用 P(5,2)。', 'The pair is unordered: do not use P(5,2).'),
      latex: '\\displaystyle C^5_2=\\frac{5\\times4}{2!}=10',
      rows: [...pools(['A1', 'A2']), { label: copy('其中一對相異成員', 'One distinct pair'), ids: ['A1', 'A2'], style: 'team' }],
    }, {
      title: copy(`有利成員：再從 5 個${bLabel.zh}選 1 個`, `Favourable members: also choose 1 of the 5 ${bLabel.en} items`),
      reason: copy(
        `每一對${aLabel.zh}都可配 5 個不同${bLabel.zh}之一，所以恰好 2 個${aLabel.zh}和 1 個${bLabel.zh}有 10 × 5 = 50 個不同小組。下方是其中一組。`,
        `Each ${aLabel.en} pair can be paired with any of the 5 ${bLabel.en} items. Thus exactly 2 ${aLabel.en} and 1 ${bLabel.en} gives 10 × 5 = 50 distinct groups. One is shown below.`,
      ),
      pitfall: copy('兩類來源互不重疊；這裡相乘的是「選一對」與「選一個」，不是任意重用同一來源。', 'The two category pools are disjoint. Multiply the pair choice and the single choice, without reusing an item.'),
      latex: '\\displaystyle N(E_{\\mathrm{group}})=C^5_2\\times C^5_1=10\\times5=50',
      rows: [...pools(['A1', 'A2'], ['B1']), { label: copy('其中一個符合 2 + 1 的小組', 'One favourable 2 + 1 group'), ids: selected, style: 'team' }],
    });
    if (preset === 'mixed') {
      const arrangements = [
        ['A1', 'A2', 'B1'], ['A1', 'B1', 'A2'],
        ['A2', 'A1', 'B1'], ['A2', 'B1', 'A1'],
        ['B1', 'A1', 'A2'], ['B1', 'A2', 'A1'],
      ];
      steps.push({
        title: copy('先選後排：每個小組有 3! 種安排', 'Choose then arrange: 3! assignments per group'),
        reason: copy(
          `剛才選出的 3 個相異成員，可安排到題目的三個不同位置。下方完整展示同一小組的 6 種安排；50 個有利小組各有 6 種，共 300 個有利有序結果。${bLabel.zh}可在任一位置。`,
          `The three distinct selected members occupy three distinct positions. All 6 assignments of the same group are shown below. Each of 50 favourable groups has 6 assignments, giving 300 favourable ordered outcomes. The ${bLabel.en} can occupy any position.`,
        ),
        pitfall: copy(`兩個${aLabel.zh}仍是相異成員，交換它們會產生新安排；不可再除以 2!。`, `The two ${aLabel.en} members are distinct. Swapping them gives a new assignment: do not divide by 2! again.`),
        latex: `\\displaystyle N(E)=${termListToLatex(terms.numerator)}=50\\times6=${numerator}`,
        rows: arrangements.map((ids, i) => orderedRow(ids, copy(`同一小組的安排 ${i + 1} / 6`, `Assignment ${i + 1} / 6 of the same group`))),
      });
    }
  }

  steps.push({
    title: copy('最後：有利結果 ÷ 全部等可能結果', 'Finally: favourable ÷ all equally likely outcomes'),
    reason: copy(
      preset === 'choose'
        ? `分子是 50 個恰好有 2 個${aLabel.zh}和 1 個${bLabel.zh}的小組，分母是全部 120 個小組；本題概率為 5/12。圖中仍只示出其中一個有利小組。`
        : preset === 'order'
          ? `分子是 60 個三個位置都是${aLabel.zh}的有序安排，分母是全部 720 個有序安排；本題概率為 1/12。圖中只示出其中一個有利安排。`
          : `分子是 300 個恰好有 2 個${aLabel.zh}和 1 個${bLabel.zh}的有序安排，分母是全部 720 個有序安排。兩者都計位置，因此本題概率為 5/12，與只選成員的概率相同。`,
      preset === 'choose'
        ? `The numerator is 50 groups with exactly 2 ${aLabel.en} and 1 ${bLabel.en}, and the denominator is all 120 groups: probability 5/12. The picture still shows just one favourable group.`
        : preset === 'order'
          ? `The numerator is 60 ordered outcomes with all three positions occupied by ${aLabel.en}, and the denominator is all 720 ordered outcomes: probability 1/12. One favourable assignment is illustrated.`
          : `The numerator is 300 assignments with exactly 2 ${aLabel.en} and 1 ${bLabel.en}, and the denominator is all 720 assignments. Both count positions, so the probability is 5/12, the same as choosing members only.`,
    ),
    pitfall: copy('分子和分母必須同時不計次序，或同時計次序；不可混用兩種樣本空間。', 'Numerator and denominator must both be unordered or both ordered. Do not mix sample spaces.'),
    latex: `\\displaystyle P(E)=\\frac{${termListToLatex(terms.numerator)}}{${termListToLatex(terms.denominator)}}=\\frac{${numerator}}{${denominator}}=${result.latex.replace(/^P = /, '')}`,
    rows: [
      ...pools(preset === 'order' ? ['A1', 'A2', 'A3'] : ['A1', 'A2'], preset === 'order' ? [] : ['B1']),
      preset === 'choose'
        ? { label: copy('其中一個有利小組（不計次序）', 'One favourable group (unordered)'), ids: selected, style: 'team' }
        : orderedRow(preset === 'order' ? ['A1', 'A2', 'A3'] : selected, copy('其中一個有利結果（計位置）', 'One favourable outcome (ordered)')),
    ],
  });

  return {
    key: `probability:${scenarioKey}:${preset}:${JSON.stringify(scenario)}`,
    title: copy(`${scenario.nameZh}：本題概率動畫`, `${scenario.nameEn}: this question’s probability animation`),
    question: copy(
      preset === 'order'
        ? `5 個相異${aLabel.zh}和 5 個相異${bLabel.zh}，不放回地依次選 3 個放到第一、第二、第三個位置。所有有序結果等可能，求三個位置都是${aLabel.zh}的概率。`
        : `5 個相異${aLabel.zh}和 5 個相異${bLabel.zh}，不放回地選 3 個。${preset === 'mixed' ? '再安排到三個不同位置，所有有序安排等可能；位置不限。' : '每個小組等可能，不計選取次序。'}求恰好 2 個${aLabel.zh}和 1 個${bLabel.zh}的概率。`,
      preset === 'order'
        ? `Draw 3 without replacement from 5 distinct ${aLabel.en} and 5 distinct ${bLabel.en} items for positions 1, 2 and 3. All ordered outcomes are equally likely. Find the probability that all three are ${aLabel.en}.`
        : `Choose 3 without replacement from 5 distinct ${aLabel.en} and 5 distinct ${bLabel.en} items. ${preset === 'mixed' ? 'Then assign them to three distinct positions; all ordered arrangements are equally likely, with no position restriction.' : 'Every group is equally likely; selection order is ignored.'} Find the probability of exactly 2 ${aLabel.en} and 1 ${bLabel.en}.`,
    ),
    items,
    steps,
  };
}
