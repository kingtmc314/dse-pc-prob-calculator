import { combination, factorial, fracToLatex, permutation, simpleProbability, type Fraction } from './mathEngine';

export interface DSEText { zh: string; en: string }
export type DSETopic = 'permutation' | 'combination' | 'probability' | 'mixed';
export const DSE_QUESTION_IDS = ['office-roles', 'restaurant-selection', 'family-adjacent', 'school-roles'] as const;
export type DSEQuestionId = typeof DSE_QUESTION_IDS[number];
export const DSE_TOPICS: Record<DSETopic, DSEText> = {
  permutation: { zh: '不同職位排列', en: 'Distinct-role permutation' },
  combination: { zh: '分類組合', en: 'Restricted selection' },
  probability: { zh: '相鄰與概率', en: 'Adjacency & probability' },
  mixed: { zh: '先選後排', en: 'Select, then assign' },
};
export const DSE_DIFFICULTIES = {
  foundation: { zh: '基礎', en: 'Foundation' },
  standard: { zh: '進階', en: 'Standard' },
  challenge: { zh: '挑戰', en: 'Challenge' },
} satisfies Record<string, DSEText>;
export const DSE_REFERENCES = {
  curriculum: 'https://www.edb.gov.hk/attachment/en/curriculum-development/kla/ma/curr/CA_2017_e.pdf',
  assessment: 'https://www.hkeaa.edu.hk/en/hkdse/assessment/subject_information/category_a_subjects/math/',
};
export const DSE_ORIGINAL_NOTICE: DSEText = {
  zh: '原創 HKDSE 風格練習，並非香港考評局（HKEAA）歷屆試題。建議分數及解題指引只供自學，並非官方評分準則。',
  en: 'Original HKDSE-style practice, not HKEAA past-paper questions. Suggested marks and solution guidance are for self-study, not official marking schemes.',
};

export interface DSEStep {
  title: DSEText;
  formula: string;
  explanation: DSEText;
  commonMistake: DSEText;
}
export interface DSEStrategy {
  id: string;
  label: DSEText;
  correct: boolean;
  feedback: DSEText;
}
export interface DSEQuestion {
  id: DSEQuestionId;
  variantKey: string;
  parameters: Record<string, number>;
  title: DSEText;
  storyEmoji: string;
  topic: DSETopic;
  difficulty: keyof typeof DSE_DIFFICULTIES;
  suggestedMarks: number;
  problem: DSEText;
  sampleSpace: DSEText;
  hint: DSEText;
  hintFormula: string;
  strategies: DSEStrategy[];
  answer: { kind: 'count'; value: number } | { kind: 'probability'; fraction: Fraction; decimalPlaces: 4 };
  answerLatex: string;
  steps: DSEStep[];
  animationKind: 'order' | 'choose' | 'bundle' | 'mixed';
  scenario: 'office' | 'restaurant' | 'family' | 'school';
}
const text = (zh: string, en: string): DSEText => ({ zh, en });
const step = (title: DSEText, formula: string, explanation: DSEText, commonMistake: DSEText): DSEStep =>
  ({ title, formula, explanation, commonMistake });
const option = (id: string, label: DSEText, correct: boolean, feedback: DSEText): DSEStrategy =>
  ({ id, label, correct, feedback });
const choose = (n: number, r: number) => combination(n, r).value;
const rand = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

function office(n: number, r: number): DSEQuestion {
  const answer = permutation(n, r).value;
  const roles = r === 2 ? text('主席及秘書', 'chairperson and secretary') : text('主席、秘書及司庫', 'chairperson, secretary and treasurer');
  const groupCount = choose(n, r);
  const roleCount = factorial(r);
  return {
    id: 'office-roles', variantKey: `office-${n}-${r}`, parameters: { n, r },
    title: text('辦公室：誰擔任哪個職位？', 'Office: who takes which role?'), storyEmoji: '💼',
    topic: 'permutation', difficulty: 'foundation', suggestedMarks: 3, scenario: 'office', animationKind: 'order',
    problem: text(
      `一間辦公室有 ${n} 位不同的員工。現選出 ${r} 人，分別擔任${roles.zh}，每個職位恰由一人擔任。每人最多擔任一個職位，所有員工均可擔任任何職位，選取不重複。共有多少種不同的職位分配方法？`,
      `An office has ${n} distinct employees. Select ${r} of them to fill the distinct roles of ${roles.en}, one employee per role. Each employee may hold at most one role, everyone is eligible for every role, and nobody is selected twice. How many different role assignments are possible?`,
    ),
    sampleSpace: text('一個結果是完整的「職位 → 員工」分配；同一組員工交換職位會產生不同結果。本題求方法數，並非概率。', 'One outcome is a complete role-to-employee assignment. Swapping roles within the same group gives a different outcome. This asks for a count, not a probability.'),
    hint: text('職位不同，所以先後選人的順序有意義。每填好一個職位，可用的人數便少一。', 'The roles are distinct, so the order of selecting people matters. One fewer person is available after each role is filled.'),
    hintFormula: 'P(n,r)=\\frac{n!}{(n-r)!}',
    strategies: [
      option('unordered', text('只選出一組員工：C(n,r)', 'Choose only a group: C(n,r)'), false, text('組合只記錄選了誰，沒有記錄誰擔任哪個職位；還須分配職位。', 'A combination records who is selected, but not which role each person holds. You must also assign roles.')),
      option('ordered', text('按不同職位依次選人：P(n,r)', 'Fill the distinct roles in order: P(n,r)'), true, text('正確。職位有區別，而且選人不重複，所以使用排列。C(n,r) × r! 亦是等價方法。', 'Correct. Roles are distinguishable and selection is without replacement, so use a permutation. C(n,r) × r! is equivalent.')),
      option('replacement', text('每個職位都有 n 個選擇：nʳ', 'Use n choices for every role: nʳ'), false, text('nʳ 容許同一人擔任多個職位，違反每人最多一個職位的限制。', 'nʳ allows the same employee to hold several roles, contrary to the one-role-per-person restriction.')),
    ],
    answer: { kind: 'count', value: answer }, answerLatex: `P(${n},${r})=${answer}`,
    steps: [
      step(text('辨認結果：職位有區別', 'Identify the outcome: roles differ'), `N=C(${n},${r})\\times ${r}!`, text('先選一組人，再把他們分配到不同職位。換職位便是另一個結果。', 'Select a group, then assign its members to distinct roles. A role swap creates another outcome.'), text('只用組合，漏算同一組人的不同職位分配。', 'Using a combination alone misses different role assignments for the same group.')),
      step(text('不重複地填好職位', 'Fill roles without replacement'), `P(${n},${r})=\\frac{${n}!}{(${n}-${r})!}`, text(`第一個職位有 ${n} 個選擇，第二個有 ${n - 1} 個；如此類推。`, `There are ${n} choices for the first role, ${n - 1} for the second, and so on.`), text('每次仍用相同人數，等於容許重複選人。', 'Keeping the number of choices constant permits repeated selection.')),
      step(text('以乘法原理計算', 'Apply the multiplication principle'), `${Array.from({ length: r }, (_, i) => n - i).join('\\times')}=${answer}`, text(`把 ${r} 個職位的選擇數相乘，得到 ${answer} 種分配。`, `Multiply the numbers of choices for the ${r} roles to obtain ${answer} assignments.`), text('把各階段選擇數相加，而不是相乘。', 'Adding the stage counts instead of multiplying them.')),
      step(text('用先選後排核對', 'Cross-check by selecting then assigning'), `C(${n},${r})\\times ${r}!=${groupCount}\\times ${roleCount}=${answer}`, text('兩種方法數的是同一批職位分配；答案是方法數，不須除以總結果數。', 'Both methods count the same role assignments. The answer is a count; no sample-space division is needed.'), text('已用 P(n,r) 後再乘 r!，會重複計算職位順序。', 'Multiplying P(n,r) by r! counts the role ordering twice.')),
    ],
  };
}

function restaurant(mains: number, drinks: number, r: number, k: number): DSEQuestion {
  const d = r - k;
  const a = choose(mains, k);
  const b = choose(drinks, d);
  const answer = a * b;
  const total = choose(mains + drinks, r);
  return {
    id: 'restaurant-selection', variantKey: `restaurant-${mains}-${drinks}-${r}-${k}`, parameters: { mains, drinks, r, k },
    title: text('茶餐廳：恰好幾款主食？', 'Restaurant: exactly how many mains?'), storyEmoji: '🍽️',
    topic: 'combination', difficulty: 'standard', suggestedMarks: 4, scenario: 'restaurant', animationKind: 'choose',
    problem: text(
      `一間茶餐廳提供 ${mains} 款不同主食及 ${drinks} 款不同飲品，兩類並不重疊。客人要選 ${r} 款不同項目，其中恰好 ${k} 款為主食。每款最多選一次，不計點餐順序。共有多少種不同選法？`,
      `A restaurant offers ${mains} distinct main dishes and ${drinks} distinct drinks; the two classes do not overlap. A customer selects ${r} different menu items, exactly ${k} of which must be mains. Each item can be selected at most once and order does not matter. How many different selections are possible?`,
    ),
    sampleSpace: text(`一個結果是一組不計順序的 ${r} 款項目。不限制類別時有 C(${mains + drinks},${r}) = ${total} 組；本題只數符合條件的組別，不是求概率。`, `One outcome is an unordered set of ${r} items. Without the class restriction there are C(${mains + drinks},${r}) = ${total} sets. Count the valid sets; this is not a probability question.`),
    hint: text(`恰好 ${k} 款主食，即剩下 ${d} 款必須全部是飲品。兩類分別用組合。`, `Exactly ${k} mains means the other ${d} items must all be drinks. Use a combination for each class.`),
    hintFormula: `C(${mains},${k})\\times C(${drinks},${d})`,
    strategies: [
      option('all', text('從所有項目選 r 款：C(m+d,r)', 'Choose r from all items: C(m+d,r)'), false, text('這數了所有組別，沒有保證恰好 k 款主食。須固定兩類各選多少款。', 'This counts every set, without enforcing exactly k mains. Fix how many items come from each class.')),
      option('class-order', text('兩類都使用排列，然後相乘', 'Multiply permutations for the two classes'), false, text('點餐顺序不計，使用排列會把相同的一組重複計算。', 'Order does not matter, so permutations count the same selection repeatedly.')),
      option('class-choose', text('分別選兩類，組合數相乘', 'Choose within each class and multiply'), true, text('正確。主食選 k 款，飲品選 r−k 款；每個主食組別可配搭每個飲品組別。', 'Correct. Choose k mains and r−k drinks. Each mains set can be paired with each drinks set.')),
    ],
    answer: { kind: 'count', value: answer }, answerLatex: `C(${mains},${k})C(${drinks},${d})=${answer}`,
    steps: [
      step(text('把「恰好」轉為兩類數量', 'Translate “exactly” into class counts'), `${r}=${k}+${d}`, text(`要選 ${k} 款主食及 ${d} 款飲品；各項目不同，不重複選取。`, `Select ${k} mains and ${d} drinks. All items are distinct and selection is without replacement.`), text('把「恰好」誤解為「至少」，加入其他主食數量。', 'Treating “exactly” as “at least” and including other numbers of mains.')),
      step(text('不計順序地選主食', 'Choose mains without ordering'), `C(${mains},${k})=\\frac{${mains}!}{${k}!(${mains}-${k})!}=${a}`, text(`從 ${mains} 款主食選 ${k} 款，只看選了哪些款式。`, `Choose ${k} of the ${mains} mains, recording only which dishes are selected.`), text('使用 P 而非 C，把主食次序當成不同選法。', 'Using P rather than C treats the mains order as a different selection.')),
      step(text('不計順序地選飲品', 'Choose drinks without ordering'), `C(${drinks},${d})=\\frac{${drinks}!}{${d}!(${drinks}-${d})!}=${b}`, text(`飲品數量是 ${r}−${k} = ${d}，並非再選 ${r} 款。`, `The drinks count is ${r}−${k} = ${d}, not another ${r} items.`), text('飲品也選 r 款，令總數超出要求。', 'Selecting r drinks as well exceeds the required total.')),
      step(text('配搭兩類選法', 'Combine the two class selections'), `N=${a}\\times ${b}=${answer}`, text(`每個主食組別配每個飲品組別，得到 ${answer} 種。本題求方法數，毋須除以 ${total}。`, `Pair each mains set with each drinks set to obtain ${answer} selections. This asks for a count, so do not divide by ${total}.`), text('相加會漏算配搭；除以總組合数則變成另一個概率問題。', 'Adding misses pairings; dividing by all combinations answers a different probability question.')),
    ],
  };
}

function family(adults: number, children: number): DSEQuestion {
  const n = adults + children;
  const outer = factorial(children + 1);
  const inner = factorial(adults);
  const favourable = outer * inner;
  const total = factorial(n);
  const result = simpleProbability(favourable, total);
  return {
    id: 'family-adjacent', variantKey: `family-${adults}-${children}`, parameters: { adults, children },
    title: text('家庭合照：成人排在一起', 'Family photo: adults together'), storyEmoji: '👨‍👩‍👧‍👦',
    topic: 'probability', difficulty: 'challenge', suggestedMarks: 5, scenario: 'family', animationKind: 'bundle',
    problem: text(
      `一家 ${adults} 位不同成人及 ${children} 位不同兒童要站成一條直線拍照。所有人各出現一次，且每一個完整排列均有相同機會被選中。求所有成人連續站在一起（中間沒有兒童）的概率。隊列有固定的左、右兩端，反轉次序視為不同排列，並非圓形排列。`,
      `${adults} distinct adults and ${children} distinct children stand in a straight line for a family photo. Everyone appears exactly once, and every complete arrangement is equally likely. Find the probability that all adults occupy consecutive positions, with no child between them. The line has fixed left and right ends; reversal gives a different arrangement. This is not a circular arrangement.`,
    ),
    sampleSpace: text(`樣本空間是全部 ${n}! = ${total} 個等可能的完整直線排列；有利結果亦須是完整排列，不能把「成人位置組合」與「人員排列」混用。`, `The sample space consists of all ${n}! = ${total} equally likely complete linear arrangements. Favourable outcomes must also be complete arrangements; do not mix position subsets with person arrangements.`),
    hint: text('把所有成人視為一個區塊。先排區塊與兒童，再排區塊內不同成人，最後除以全部完整排列數。', 'Treat all adults as one block. Arrange the block with the children, arrange the distinct adults inside it, then divide by all complete arrangements.'),
    hintFormula: `\\frac{(${children}+1)!\\times ${adults}!}{${n}!}`,
    strategies: [
      option('bundle-ratio', text('成人捆綁，計完整排列比率', 'Bundle adults, then take a ratio of full arrangements'), true, text('正確。外部排列乘成人內部排列，才是有利完整排列數；分母用所有人的直線全排列。', 'Correct. Outer arrangements times internal adult arrangements gives favourable complete arrangements. The denominator is all linear arrangements of everyone.')),
      option('bundle-only', text('只排區塊，忽略成人內部次序', 'Arrange the block only; ignore the adult order'), false, text('成人都不同，同一區塊內仍有 a! 種次序；忽略這個因子會少算。', 'The adults are distinct, so each block has a! internal orders. Omitting this factor undercounts.')),
      option('circle', text('固定一人，以 (n−1)! 作分母', 'Fix one person and use (n−1)! in the denominator'), false, text('這是有固定左右兩端的直線排列，不可消除旋轉。分母應為 n!。', 'This is a line with fixed ends, not a circle. Rotations are not identified, so the denominator is n!.')),
    ],
    answer: { kind: 'probability', fraction: result.fraction, decimalPlaces: 4 }, answerLatex: result.latex,
    steps: [
      step(text('先固定等可能的樣本空間', 'Fix the equally likely sample space'), `|\\Omega|=${n}!=${total}`, text(`將 ${n} 位不同家人各用一次，全排成直線。每個排列的機會相同。`, `Arrange all ${n} distinct family members once each in a line. Every complete arrangement has the same probability.`), text('把直線當成圓形，或把不同成人當成相同。', 'Treating the line as a circle or treating distinct adults as identical.')),
      step(text('將成人捆綁成一個單元', 'Bundle the adults into one unit'), `N_{\\mathrm{outer}}=(${children}+1)!=${outer}`, text(`${children} 位兒童與一個成人區塊，共 ${children + 1} 個不同單元；排成直線。`, `${children} children and one adult block make ${children + 1} distinguishable units to arrange in a line.`), text('捆綁後仍把成人逐位計為外部單元。', 'Still counting each adult as a separate outer unit after bundling.')),
      step(text('還原區塊內的不同成人', 'Restore the adult orders inside the block'), `|A|=${outer}\\times ${adults}!=${outer}\\times ${inner}=${favourable}`, text(`每個外部排列都有 ${adults}! 種成人內部次序。每個有利完整排列恰好數一次。`, `Each outer arrangement has ${adults}! internal adult orders. Every favourable complete arrangement is counted exactly once.`), text('漏乘成人內部的階乘，或再乘兒童階乘（兒童已在外部排好）。', 'Omitting the adult factorial, or multiplying again by a child factorial when the children are already arranged.')),
      step(text('用同類結果數求概率', 'Divide counts of the same type of outcome'), `P(A)=\\frac{${favourable}}{${total}}=${fracToLatex(result.fraction)}`, text('分子和分母都是完整排列數。以有利結果數除以等可能總結果數，再約分。', 'Both numerator and denominator count complete arrangements. Divide favourable outcomes by the equally likely total and simplify.'), text('只交有利排列數，未除以總排列數，並不是概率。', 'Giving only the favourable count without dividing by the total is not a probability.')),
    ],
  };
}

function school(teachers: number, students: number): DSEQuestion {
  const teacherWays = choose(teachers, 1);
  const studentWays = choose(students, 2);
  const committees = teacherWays * studentWays;
  const roleWays = factorial(3);
  const answer = committees * roleWays;
  return {
    id: 'school-roles', variantKey: `school-${teachers}-${students}`, parameters: { teachers, students },
    title: text('學校活動：先選人，再分工', 'School event: select, then assign'), storyEmoji: '🏫',
    topic: 'mixed', difficulty: 'standard', suggestedMarks: 4, scenario: 'school', animationKind: 'mixed',
    problem: text(
      `學校有 ${teachers} 位不同老師及 ${students} 位不同學生，兩類並不重疊。要選出恰好 1 位老師及 2 位學生組成三人活動小組，再分別委任一人為主持、一人為記錄員、一人為時間管理員。每人只擔任一個職位，三名入選者均可擔任任何職位（老師不必是主持），選人不重複。共有多少種不同的選人及職位分配方案？`,
      `A school has ${teachers} distinct teachers and ${students} distinct students; the two classes do not overlap. Select exactly one teacher and two students to form a three-person event team, then assign the distinct roles of presenter, recorder and timekeeper, one per member. Every selected person is eligible for any role (the teacher need not be the presenter), and nobody is selected twice. How many different selection-and-role-assignment plans are possible?`,
    ),
    sampleSpace: text('一個結果同時記錄入選者及各人的職位。先選人時不計順序；之後分配不同職位時須計順序。本題求方案數，並非概率。', 'One outcome records both the selected members and their roles. The initial selection is unordered; assigning distinct roles is ordered. This is a count, not a probability.'),
    hint: text('先分別選 1 位老師及 2 位學生。每個符合條件的三人組，仍可分配到 3 個不同職位。', 'First choose one teacher and two students. Each valid three-person team can then be assigned to three distinct roles.'),
    hintFormula: `C(${teachers},1)\\times C(${students},2)\\times 3!`,
    strategies: [
      option('committee-only', text('只計 C(t,1) × C(s,2)', 'Count only C(t,1) × C(s,2)'), false, text('這只數三人組，未計每組的不同分工；还须乘 3!。', 'This counts teams, not their different role assignments. Multiply by 3! as well.')),
      option('fixed-teacher', text('固定老師當主持，只交換學生職位', 'Fix the teacher as presenter and swap student roles'), false, text('題目沒有指定老師的職位。老師可擔任三個職位中的任何一個，不能只算主持。', 'The teacher’s role is not fixed. A teacher may occupy any of the three roles, not only presenter.')),
      option('choose-assign', text('按類別選人，再乘 3! 分配職位', 'Choose by class, then multiply by 3! for roles'), true, text('正確。先用組合控制小組成員類別，再用排列分配職位，不漏算也不重複。', 'Correct. Combinations enforce the team composition; a permutation assigns the roles without omissions or double counting.')),
    ],
    answer: { kind: 'count', value: answer }, answerLatex: `C(${teachers},1)C(${students},2)\\times 3!=${answer}`,
    steps: [
      step(text('恰好選一位老師', 'Select exactly one teacher'), `C(${teachers},1)=${teacherWays}`, text(`從 ${teachers} 位不同老師中選一位，暫不指定職位。`, `Choose one of the ${teachers} distinct teachers without assigning a role yet.`), text('未經題目要求便固定老師擔任主持。', 'Fixing the teacher as presenter when the problem does not require it.')),
      step(text('不計順序地選兩位學生', 'Select two students without ordering'), `C(${students},2)=\\frac{${students}(${students}-1)}{2}=${studentWays}`, text('兩位學生只組成一組，選取次序不會改變小組。', 'The two students form an unordered pair. Their selection order does not change the team.'), text('用 P(s,2)，把同一學生組的選取順序重複計算。', 'Using P(s,2) counts each student pair twice at the selection stage.')),
      step(text('為每個小組分配不同職位', 'Assign distinct roles within each team'), `N_{\\mathrm{team}}=${teacherWays}\\times ${studentWays}=${committees},\\qquad N_{\\mathrm{roles}}=3!=${roleWays}`, text('每個三人組有三個不同職位。老師與學生都能擔任任何職位，所以有 3! 種。', 'Each three-person team fills three distinct roles. Teachers and students are eligible for all roles, giving 3! assignments.'), text('只乘 2!，漏算老師也可更換職位；或把職位當成相同。', 'Multiplying only by 2! misses the teacher’s role choices, or treats distinct roles as identical.')),
      step(text('把選人及分工兩階段相乘', 'Multiply selection and assignment stages'), `N=${committees}\\times ${roleWays}=${answer}`, text(`每個有效小組配每種分工，合共 ${answer} 個方案。每個方案可唯一還原其小組和分工。`, `Pair each valid team with each role assignment to obtain ${answer} plans. Every plan uniquely identifies its team and assignment.`), text('把兩階段相加，或在已分配所有職位後額外乘學生的 2!。', 'Adding the two stage counts, or multiplying by an extra student 2! after all roles have already been assigned.')),
    ],
  };
}

/** Four original templates; every call uses small, independently random parameters. */
export function generateDSEQuestions(): DSEQuestion[] {
  const r = rand(3, 4);
  return [office(rand(5, 8), rand(2, 3)), restaurant(rand(4, 7), rand(3, 6), r, rand(1, r - 1)), family(rand(2, 3), rand(2, 4)), school(rand(2, 4), rand(4, 7))];
}

/** Keep the template but guarantee a different parameter variant, even with a constant RNG. */
export function generateDSEVariant(current: DSEQuestion): DSEQuestion {
  for (let attempt = 0; attempt < 8; attempt++) {
    const candidate = generateDSEQuestions().find(q => q.id === current.id)!;
    if (candidate.variantKey !== current.variantKey) return candidate;
  }
  const p = current.parameters;
  switch (current.id) {
    case 'office-roles': return office(p.n === 8 ? 5 : p.n + 1, p.r);
    case 'restaurant-selection': return restaurant(p.mains === 7 ? 4 : p.mains + 1, p.drinks, p.r, p.k);
    case 'family-adjacent': return family(p.adults === 3 ? 2 : 3, p.children);
    case 'school-roles': return school(p.teachers === 4 ? 2 : p.teachers + 1, p.students);
  }
}

export interface DSEParsedAnswer {
  numerator: bigint;
  denominator: bigint;
  syntax: 'integer' | 'fraction' | 'decimal';
  decimalDigits: number;
}

/** Strict, full-string numeric parsing. Never use parseFloat: trailing junk is not an answer. */
export function parseDSEAnswer(raw: string): DSEParsedAnswer | null {
  const input = raw.trim().replace(/−/g, '-');
  if (!input || input.length > 160) return null;
  const integer = '[+-]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)';
  const fraction = input.match(new RegExp(`^(${integer})\\s*/\\s*(${integer})$`));
  try {
    if (fraction) {
      let numerator = BigInt(fraction[1].replace(/,/g, ''));
      let denominator = BigInt(fraction[2].replace(/,/g, ''));
      if (denominator === 0n) return null;
      if (denominator < 0n) { numerator = -numerator; denominator = -denominator; }
      return { numerator, denominator, syntax: 'fraction', decimalDigits: 0 };
    }
    if (new RegExp(`^${integer}$`).test(input)) {
      return { numerator: BigInt(input.replace(/,/g, '')), denominator: 1n, syntax: 'integer', decimalDigits: 0 };
    }
    const decimal = input.match(/^([+-]?)(?:(\d{1,3}(?:,\d{3})+|\d+)\.(\d*)|\.(\d+))$/);
    if (!decimal) return null;
    const digits = decimal[3] ?? decimal[4];
    const whole = (decimal[2] ?? '0').replace(/,/g, '');
    const denominator = 10n ** BigInt(digits.length);
    const numerator = BigInt(whole + digits) * (decimal[1] === '-' ? -1n : 1n);
    return { numerator, denominator, syntax: 'decimal', decimalDigits: digits.length };
  } catch {
    return null;
  }
}

export interface DSEAnswerCheck {
  status: 'correct' | 'incorrect' | 'invalid' | 'precision';
  feedback: DSEText;
}

/** Counts and fractions are exact; only probability decimal answers allow an explicit 4-d.p. error. */
export function checkDSEAnswer(question: DSEQuestion, raw: string): DSEAnswerCheck {
  const input = parseDSEAnswer(raw);
  if (!input) return { status: 'invalid', feedback: text('請輸入完整的整數、分數或小數（例如 120、3/7、0.4286）；分母不能是 0。不接受算式、百分號或尾隨文字。', 'Enter a complete integer, fraction or decimal (e.g. 120, 3/7, 0.4286). The denominator cannot be zero. Expressions, percentages and trailing text are not accepted.') };
  const target = question.answer.kind === 'count' ? { num: question.answer.value, den: 1 } : question.answer.fraction;
  const targetNum = BigInt(target.num);
  const targetDen = BigInt(target.den);
  const delta = input.numerator * targetDen - targetNum * input.denominator;
  if (delta === 0n) return { status: 'correct', feedback: text('正確！你的答案與精確結果相等。此題型已記錄為完成。', 'Correct! Your answer equals the exact result. This template is recorded as complete.') };
  if (question.answer.kind === 'probability' && (input.numerator < 0n || input.numerator > input.denominator)) {
    return { status: 'incorrect', feedback: text('概率必須在 0 與 1 之間（包括 0 和 1）。檢查有利結果數和總結果數是否用同類結果計算。', 'A probability must lie between 0 and 1 inclusive. Check that favourable and total counts use the same type of outcome.') };
  }
  if (question.answer.kind === 'probability' && input.syntax === 'decimal') {
    if (input.decimalDigits < question.answer.decimalPlaces) return { status: 'precision', feedback: text('若不是精確小數，請至少輸入小數點後 4 位，或改用精確分數。', 'For a non-exact decimal, enter at least four digits after the decimal point, or use an exact fraction.') };
    // |input - target| <= 0.00005 = 1/20000, compared with integers, without floating-point drift.
    const absoluteDelta = delta < 0n ? -delta : delta;
    if (absoluteDelta * 20000n <= input.denominator * targetDen) return { status: 'correct', feedback: text('正確！小數符合 4 位小數的精度要求（絕對誤差不大於 0.00005）。此題型已記錄為完成。', 'Correct! Your decimal meets the four-place precision requirement (absolute error at most 0.00005). This template is recorded as complete.') };
  }
  return { status: 'incorrect', feedback: question.answer.kind === 'count'
    ? text('還未正確。方法數須完全相等，不設四捨五入容差。先檢查順序是否重要，以及有沒有重複計算。', 'Not yet. Counts must match exactly, with no rounding tolerance. Check whether order matters and whether any outcomes were counted twice.')
    : text('還未正確。分數須精確相等；小數須符合標示的精度。先檢查區塊內排列，以及分子和分母是否都數完整排列。', 'Not yet. Fractions must match exactly; decimals must meet the stated precision. Check internal block orders and that both counts are complete arrangements.') };
}
