import { useEffect, useId, useState } from 'react';
import { AnimatePresence, LayoutGroup, MotionConfig, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CircleAlert, Lightbulb, Pause, Play, RotateCcw } from 'lucide-react';
import { useLang } from '../contexts/LangContext';
import KatexRenderer from './KatexRenderer';
import './CountingAnimation.css';

export type AnimationKind = 'order' | 'choose' | 'bundle' | 'mixed' | 'gaps';
export type StoryKey = 'office' | 'school' | 'restaurant' | 'family';

export interface CountingAnimationProps {
  kind?: AnimationKind;
  scenario?: StoryKey;
  compact?: boolean;
}

type Copy = { zh: string; en: string };
type TeachingStep = { title: Copy; reason: Copy; pitfall: Copy; latex: string };
const copy = (zh: string, en: string): Copy => ({ zh, en });
const makeStep = (title: Copy, reason: Copy, pitfall: Copy, latex: string): TeachingStep => ({ title, reason, pitfall, latex });
const PEOPLE = ['A', 'B', 'C', 'D', 'E'];
const REORDERINGS = ['ABC', 'ACB', 'BAC', 'BCA', 'CAB', 'CBA'];
const TEAMS = ['ABC', 'ABD', 'ABE', 'ACD', 'ACE', 'ADE', 'BCD', 'BCE', 'BDE', 'CDE'];
const KINDS: AnimationKind[] = ['order', 'choose', 'bundle', 'mixed', 'gaps'];
const STORIES: StoryKey[] = ['office', 'school', 'restaurant', 'family'];
const TITLES: Record<AnimationKind, Copy> = {
  order: copy('排列：位置有分別', 'Permutation: places matter'),
  choose: copy('組合：只看成員', 'Combination: members matter'),
  bundle: copy('捆綁：相鄰成一組', 'Bundle: keep them together'),
  mixed: copy('先選後排：分配角色', 'Choose, then assign roles'),
  gaps: copy('插空：讓成人不相鄰', 'Gaps: keep adults apart'),
};
const SHORT_TITLES: Record<AnimationKind, Copy> = {
  order: copy('排列', 'Order'), choose: copy('組合', 'Choose'), bundle: copy('捆綁', 'Bundle'),
  mixed: copy('先選後排', 'Mixed'), gaps: copy('插空', 'Gaps'),
};
const STORY_COPY: Record<StoryKey, { title: Copy; emoji: string; roles: Copy[]; questions: Record<AnimationKind, Copy> }> = {
  office: {
    title: copy('辦公室', 'Office'), emoji: '💼',
    roles: [copy('統籌', 'Lead'), copy('記錄', 'Record'), copy('匯報', 'Present')],
    questions: {
      order: copy('五位員工 A–E，填入三個有編號的簡報次序位置。每人最多出現一次。', 'Five staff A–E fill three numbered presentation places. Each person is used at most once.'),
      choose: copy('從五位員工 A–E 選三人組成委員會，不分職位。', 'Choose a three-person committee from five staff A–E, with no distinct offices.'),
      bundle: copy('公司親子日：成人 A、B 與小孩 C、D、E 排成一列，兩位成人必須相鄰。', 'Office family day: adults A, B and children C, D, E form a straight line. The adults must be adjacent.'),
      mixed: copy('從五位員工 A–E 選三人，再分配統籌、記錄、匯報三個不同職位。', 'Choose three of five staff A–E, then assign the distinct lead, record and present roles.'),
      gaps: copy('公司親子日：成人 A、B 與小孩 C、D、E 排成一列，兩位成人不可相鄰。', 'Office family day: adults A, B and children C, D, E form a straight line. The adults must not be adjacent.'),
    },
  },
  school: {
    title: copy('學校', 'School'), emoji: '🎒',
    roles: [copy('隊長', 'Captain'), copy('秘書', 'Secretary'), copy('報告員', 'Speaker')],
    questions: {
      order: copy('五位學生 A–E，填入三個有編號的出場位置。每人最多出現一次。', 'Five students A–E fill three numbered performance places. Each person is used at most once.'),
      choose: copy('從五位學生 A–E 選三人組隊，只看隊員，不分職位。', 'Choose a team of three from five students A–E. Only membership matters; there are no roles.'),
      bundle: copy('學校開放日：成人 A、B 與小孩 C、D、E 排成一列，兩位成人必須相鄰。', 'School open day: adults A, B and children C, D, E form a straight line. The adults must be adjacent.'),
      mixed: copy('從五位學生 A–E 選三人，再分配隊長、秘書、報告員三個不同職位。', 'Choose three of five students A–E, then assign the distinct captain, secretary and speaker roles.'),
      gaps: copy('學校開放日：成人 A、B 與小孩 C、D、E 排成一列，兩位成人不可相鄰。', 'School open day: adults A, B and children C, D, E form a straight line. The adults must not be adjacent.'),
    },
  },
  restaurant: {
    title: copy('餐廳', 'Restaurant'), emoji: '🍽️',
    roles: [copy('座位 1', 'Seat 1'), copy('座位 2', 'Seat 2'), copy('座位 3', 'Seat 3')],
    questions: {
      order: copy('五位客人 A–E，填入三個有編號的用餐座位。每人最多出現一次；不是圓桌排列。', 'Five diners A–E fill three numbered dining seats. No person repeats; this is not circular seating.'),
      choose: copy('從五位客人 A–E 選三人參加試食，不指定座位。', 'Choose three of five diners A–E for a tasting, without assigning seats.'),
      bundle: copy('餐廳候位：成人 A、B 與小孩 C、D、E 排成一列，兩位成人必須相鄰。', 'Restaurant queue: adults A, B and children C, D, E form a straight line. The adults must be adjacent.'),
      mixed: copy('從五位客人 A–E 選三人，再安排到座位 1、2、3。座位有編號，所以次序重要。', 'Choose three of five diners A–E, then allocate seats 1, 2 and 3. The numbered seats are distinct.'),
      gaps: copy('餐廳候位：成人 A、B 與小孩 C、D、E 排成一列，兩位成人不可相鄰。', 'Restaurant queue: adults A, B and children C, D, E form a straight line. The adults must not be adjacent.'),
    },
  },
  family: {
    title: copy('家庭', 'Family'), emoji: '🏡',
    roles: [copy('策劃', 'Plan'), copy('採購', 'Shop'), copy('煮食', 'Cook')],
    questions: {
      order: copy('五位家人 A–E，填入三個有編號的合照位置。每人最多出現一次。', 'Five relatives A–E fill three numbered photo places. Each person is used at most once.'),
      choose: copy('從五位家人 A–E 選三人組成旅行小組，不分工作。', 'Choose a travel group of three from five relatives A–E, without assigning jobs.'),
      bundle: copy('家庭合照：成人 A、B 與小孩 C、D、E 排成一列，兩位成人必須相鄰。', 'Family photo: adults A, B and children C, D, E form a straight line. The adults must be adjacent.'),
      mixed: copy('從五位家人 A–E 選三人，再分配策劃、採購、煮食三項不同工作。', 'Choose three of five relatives A–E, then assign the distinct planning, shopping and cooking jobs.'),
      gaps: copy('家庭合照：成人 A、B 與小孩 C、D、E 排成一列，兩位成人不可相鄰。', 'Family photo: adults A, B and children C, D, E form a straight line. The adults must not be adjacent.'),
    },
  },
};

const LESSONS: Record<AnimationKind, TeachingStep[]> = {
  order: [
    makeStep(copy('先辨認三個不同位置', 'Identify three distinct places'), copy('A–E 是五位不同的人。第 1、2、3 位有分別，將逐格填入。', 'A–E are five distinct people. Places 1, 2 and 3 differ, so fill them one at a time.'), copy('同一人不能重複入選；這不是每格都有五個選擇。', 'A person cannot be reused. There will not be five choices at every place.'), String.raw`n=5,\quad r=3`),
    makeStep(copy('第一位：五個選擇', 'First place: five choices'), copy('示範先放 A。其餘 B、C、D、E 仍可填下一位；也可以由另外四人開始。', 'The example starts with A. B, C, D and E remain for the next place; any of the five could have started.'), copy('畫面只走一條示範路徑，並非只有 A 可以排第一。', 'This is one example path, not a restriction that A must be first.'), '5'),
    makeStep(copy('第二位：剩下四個選擇', 'Second place: four choices'), copy('現在放 B。A 已用過，不能再用；每個第一位選擇都有四個第二位選擇。', 'Now place B. A is already used; each first-place choice has four possible second-place choices.'), copy('使用乘法原理，不是把五個與四個選擇相加。', 'Use the multiplication principle, not addition of five and four.'), String.raw`5\times4=20`),
    makeStep(copy('第三位：剩下三個選擇', 'Third place: three choices'), copy('放 C 後得到 ABC。每個前兩位的安排，都有三人可填第三位。', 'Placing C gives ABC. Every arrangement of the first two places has three choices for the third.'), copy('D、E 留在候選池是正常的：只取三人，不是安排全部五人。', 'D and E remain unused because only three of the five people are placed.'), String.raw`5\times4\times3=60`),
    makeStep(copy('交換 A、B：結果改變', 'Swap A and B: a new outcome'), copy('ABC 變成 BAC。成員完全相同，但第一位與第二位的人不同，因此是兩個排列。', 'ABC becomes BAC. The members are identical, but the first and second places change, so these are different permutations.'), copy('位置有分別時，不可除以三的階乘；那會錯誤地合併不同排列。', 'Do not divide by three factorial when places differ; it would merge genuinely distinct outcomes.'), String.raw`\mathrm{ABC}\ne\mathrm{BAC}`),
    makeStep(copy('把所有路徑計算在內', 'Count all possible paths'), copy('五、四、三個選擇相乘，共有 60 個有次序的安排。畫面只示範其中兩個。', 'Multiplying five, four and three choices gives 60 ordered arrangements. Only two are illustrated here.'), copy('五的階乘會把未入選的 D、E 也排列，計算的不是本題。', 'Five factorial would also arrange the two unused people; that answers a different question.'), String.raw`P(5,3)=\frac{5!}{(5-3)!}=60`),
  ],
  choose: [
    makeStep(copy('只決定誰入隊', 'Decide who joins the team'), copy('從 A–E 選三人。隊內沒有第一、第二、第三位，亦沒有不同職位。', 'Choose three people from A–E. The team has no first, second or third place and no distinct roles.'), copy('先檢查題意是否真的不分次序；若有職位就不能只用組合。', 'Check that order truly does not matter. Distinct roles would require more than a combination.'), String.raw`n=5,\quad r=3`),
    makeStep(copy('選出示範隊伍 A、B、C', 'Select the example team A, B, C'), copy('這三人是一隊；D、E 沒有入選。字母只標示身份，排列方式不構成職位。', 'These three people form one team; D and E are not selected. The letters identify people, not team roles.'), copy('字母寫在左或右不代表地位。不要把隊伍當成三個有編號的座位。', 'Writing a letter on the left or right does not assign a role. This is not three numbered seats.'), String.raw`\{A,B,C\}`),
    makeStep(copy('同一隊可寫成六個次序', 'One team has six written orders'), copy('ABC、ACB、BAC、BCA、CAB、CBA 用的是相同三人。排列法會把這隊計算六次。', 'ABC, ACB, BAC, BCA, CAB and CBA use the same three people. Permutation counting counts this team six times.'), copy('不是只有交換一次的兩種次序；三位不同的人共有六個次序。', 'There are not just two orders from a single swap; three distinct people have six orders.'), String.raw`3!=3\times2\times1=6`),
    makeStep(copy('六個次序，合併成一隊', 'Collapse six orders into one team'), copy('六張次序卡收合為同一隊 ABC。每一個三人組合都恰好對應六個排列，所以除以六。', 'The six order cards collapse to the single team ABC. Every three-person team corresponds to exactly six permutations, so divide by six.'), copy('除以三的階乘是消除重複，不是把可選人數減少。', 'Dividing by three factorial removes duplicate counting; it does not reduce the candidate pool.'), String.raw`\frac{60}{3!}=10`),
    makeStep(copy('十隊：這裡列出全部組合', 'Ten teams: all combinations shown'), copy('下方列出全部十個不同三人隊伍。每隊只保留一個寫法，身份集合不同才算另一隊。', 'All ten distinct three-person teams are listed below. Each team has one canonical spelling; only different membership makes another team.'), copy('不能再乘以三的階乘，否則又把同一隊的六個次序重複計算。', 'Do not multiply by three factorial again; that would recount the six orders of each team.'), String.raw`\binom{5}{3}=\frac{5\times4\times3}{3!}=10`),
  ],
  bundle: [
    makeStep(copy('兩位成人必須相鄰', 'The two adults must be adjacent'), copy('A、B 是兩位不同成人，C、D、E 是三位不同小孩。五人排成一列，沒有固定位置。', 'A and B are distinct adults; C, D and E are distinct children. All five form a straight line with no fixed places.'), copy('成人相鄰不代表三位小孩也必須相鄰。', 'Adult adjacency does not require the three children to be adjacent.'), '2+3=5'),
    makeStep(copy('把 A、B 捆成一個單位', 'Bundle A and B into one unit'), copy('金色框把 AB 視為一個不能拆開的單位。連同 C、D、E，現在共有四個不同單位。', 'The gold frame treats AB as one inseparable unit. Together with C, D and E there are four distinct units.'), copy('只是暫時把兩人當一單位，並沒有把 A、B 變成同一人。', 'Treating two people as a unit does not make A and B identical.'), String.raw`(AB),\ C,\ D,\ E\quad\Rightarrow\quad4\text{ units}`),
    makeStep(copy('排列四個不同單位', 'Arrange the four distinct units'), copy('示範由 AB、C、D、E 變成 C、AB、D、E。四個單位可任意排列，共 24 種。', 'The example moves AB, C, D, E to C, AB, D, E. The four distinct units can be ordered in 24 ways.'), copy('不是五的階乘：任意排五人會把成人分開，違反相鄰條件。', 'Not five factorial: arbitrary five-person arrangements can separate the adults.'), '4!=24'),
    makeStep(copy('框內還有 AB 與 BA', 'Inside the bundle: AB or BA'), copy('成人在同一個框內交換，C、AB、D、E 變成 C、BA、D、E。每個單位排列都有兩個內部次序。', 'Swapping the adults inside the same frame changes C, AB, D, E to C, BA, D, E. Every unit arrangement has two internal orders.'), copy('忘記框內兩種次序會少算一半；不能把 A、B 當成相同的人。', 'Forgetting the two internal orders halves the answer; A and B are not identical.'), '2!=2'),
    makeStep(copy('外部排列乘內部排列', 'Multiply external and internal orders'), copy('四個單位的 24 種排列，各配上 AB 或 BA，得到 48 種合法直線排列。畫面是其中兩種。', 'Each of the 24 unit arrangements pairs with AB or BA, giving 48 valid straight-line arrangements. Two are illustrated.'), copy('兩個階段是乘法，不是 24 加 2；每種外部排列都配兩種內部排列。', 'Multiply, do not add 24 and 2: each external arrangement has two internal arrangements.'), String.raw`4!\times2!=24\times2=48`),
  ],
  mixed: [
    makeStep(copy('先選人，再分配不同角色', 'First choose, then assign distinct roles'), copy('從五人選三人，再讓每人取得一個不同角色或座位。先把兩個決定分開。', 'Choose three of five people, then give each a distinct role or seat. Separate these two decisions first.'), copy('只選三人尚未完成任務：不同角色由誰擔任也屬於結果。', 'Selecting three people is not enough: the assignment of the roles is part of the outcome.'), String.raw`\binom{5}{3}\times3!`),
    makeStep(copy('第一階段：選三人', 'Stage one: choose three people'), copy('先選示範成員 A、B、C，暫時不分角色。五人中有十個不同的三人組合。', 'Select the example members A, B and C without roles yet. There are ten distinct three-person groups from five.'), copy('此階段不看次序，不要先把 ABC 與 BAC 當成兩隊。', 'At this stage order does not matter; ABC and BAC are not two different groups.'), String.raw`\binom{5}{3}=10`),
    makeStep(copy('第二階段：填入不同角色', 'Stage two: fill distinct roles'), copy('A、B、C 分別進入三個有標籤的位置。同一個三人組合共有六種角色分配。', 'A, B and C enter the three labelled places. The same three-person group has six possible role assignments.'), copy('職位或座位必須真的不同；若沒有區別，就不需要這個排列階段。', 'The roles or seats must really be distinct. Without that distinction, this ordering stage is unnecessary.'), '3!=6'),
    makeStep(copy('交換角色：同隊，不同結果', 'Swap roles: same group, different outcome'), copy('A、B 交換角色後，成員仍是 A、B、C，但角色分配不同，應另計一次。', 'After A and B swap roles, the members are still A, B and C, but the role assignment differs and counts separately.'), copy('別把這六種分配收合成一隊；本題的角色正是需要保留的差別。', 'Do not collapse the six assignments into one team; these role differences must be retained.'), String.raw`\mathrm{ABC}\ne\mathrm{BAC}\quad\text{(roles)}`),
    makeStep(copy('十個組合，各有六種分配', 'Ten groups, each with six assignments'), copy('下方六張卡是 ABC 這一隊的全部角色次序。每個三人組合都有六種分配，所以共有 60 種。', 'The six cards below are all role orders for group ABC. Each of the ten groups has six assignments, giving 60 outcomes.'), copy('不要再乘排列 P(5,3)：那已包含選人與分配，會重複計算。', 'Do not multiply again by P(5,3); it already includes selection and assignment, causing double counting.'), String.raw`\binom{5}{3}\times3!=10\times6=60`),
  ],
  gaps: [
    makeStep(copy('成人不能相鄰', 'The adults must not be adjacent'), copy('A、B 是兩位不同成人，C、D、E 是三位不同小孩。先排小孩，成人稍後插入。', 'A and B are distinct adults; C, D and E are distinct children. Arrange the children first, then insert the adults.'), copy('只有兩位成人不可相鄰；小孩彼此可以相鄰。', 'Only the adults must be separated. Children may be adjacent to one another.'), '2+3=5'),
    makeStep(copy('先排三位小孩', 'Arrange the three children first'), copy('示範小孩次序 C、D、E。三位小孩各有身份，所以骨架共有六種排列。', 'The example child order is C, D, E. The three children have distinct identities, giving six possible skeleton orders.'), copy('若只固定 CDE 而忘記乘六，就漏掉另外五種小孩次序。', 'Fixing CDE without multiplying by six omits the five other child orders.'), '3!=6'),
    makeStep(copy('三位小孩形成四個空隙', 'Three children create four gaps'), copy('空隙在隊首、C 與 D 之間、D 與 E 之間、隊尾。虛線框逐一標出四個位置。', 'The gaps are before C, between C and D, between D and E, and after E. The dashed boxes mark all four.'), copy('兩端也是空隙；只數小孩之間會誤以為只有兩個空隙。', 'Both ends count as gaps. Counting only between children would give just two.'), String.raw`3+1=4\text{ gaps}`),
    makeStep(copy('四個空隙選兩個', 'Choose two of the four gaps'), copy('金色標示選第 1 與第 3 個空隙。先只選位置，不指定 A 或 B；四選二共有六種。', 'Gold marks gaps 1 and 3. First select positions without assigning A or B. Choosing two of four gives six possibilities.'), copy('每個空隙最多放一位成人，否則兩位成人會相鄰。', 'Put at most one adult in each gap, or the adults would be adjacent.'), String.raw`\binom{4}{2}=6`),
    makeStep(copy('把 A、B 放進所選空隙', 'Put A and B in the chosen gaps'), copy('A 進第 1 個空隙，B 進第 3 個，得到 A、C、D、B、E。每個空隙組合都有兩種成人分配。', 'A enters gap 1 and B gap 3, giving A, C, D, B, E. Every chosen pair of gaps has two adult assignments.'), copy('選空隙後仍要分配成人；成人有不同身份，不能省略二的階乘。', 'After choosing gaps, assign the adults. Their distinct identities require the two-factorial factor.'), '2!=2'),
    makeStep(copy('交換成人，仍然合法', 'Swap adults: still valid, but different'), copy('交換後得到 B、C、D、A、E。成人仍被小孩隔開，但每個成人的位置改變了。', 'Swapping gives B, C, D, A, E. Children still separate the adults, but the adults occupy different places.'), copy('不可讓 A、B 放進同一個空隙；那不是此方法允許的安排。', 'A and B must not occupy the same gap; that is not a valid arrangement in this method.'), String.raw`\mathrm{ACDBE}\ne\mathrm{BCDAE}`),
    makeStep(copy('三個階段相乘', 'Multiply the three stages'), copy('六種小孩次序，各有六種空隙選法，每種又有兩種成人分配，共 72 種。畫面示範其中兩種。', 'Six child orders, each with six gap choices and two adult assignments, give 72 arrangements. Two are illustrated here.'), copy('這是直線排列。若題目是圓桌，空隙及旋轉等價的計法都不同。', 'This is a straight line. Circular seating changes the gap count and the treatment of rotations.'), String.raw`3!\times\binom{4}{2}\times2!=6\times6\times2=72`),
  ],
};

/** A fixed-size teaching example, deliberately independent of calculator inputs. */
export default function CountingAnimation({ kind, scenario, compact = false }: CountingAnimationProps) {
  const { lang } = useLang();
  const text = (value: Copy) => value[lang === 'en' ? 'en' : 'zh'];
  const tr = (zh: string, en: string) => lang === 'en' ? en : zh;
  const [selectedKind, setSelectedKind] = useState<AnimationKind>('order');
  const [selectedStory, setSelectedStory] = useState<StoryKey>('school');
  const activeKind = kind ?? selectedKind;
  const activeStory = scenario ?? selectedStory;
  // Include controlled/uncontrolled boundaries, so removing a prop also resets playback.
  const lessonKey = `${activeKind}:${activeStory}:${kind === undefined}:${scenario === undefined}`;
  const [playback, setPlayback] = useState({ key: lessonKey, step: 0, playing: false });
  const [speed, setSpeed] = useState(1);
  const reducedMotion = useReducedMotion();
  const instanceId = useId();
  const steps = LESSONS[activeKind];
  const lastStep = steps.length - 1;
  // Derive a safe first frame before the effect commits a new lesson's state.
  const step = playback.key === lessonKey ? Math.min(playback.step, lastStep) : 0;
  const playing = playback.key === lessonKey && playback.playing;
  const current = steps[step];
  const story = STORY_COPY[activeStory];
  const constrained = activeKind === 'bundle' || activeKind === 'gaps';
  const duration = reducedMotion ? 0 : 0.24;

  useEffect(() => {
    if (playback.key === lessonKey) return;
    // Schedule, cancel on a rapid prop change/unmount, and never show stale steps.
    const frame = window.requestAnimationFrame(() => {
      setPlayback({ key: lessonKey, step: 0, playing: false });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lessonKey, playback.key]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setPlayback(previous => {
        if (previous.key !== lessonKey || !previous.playing) return previous;
        const next = Math.min(previous.step + 1, lastStep);
        return { ...previous, step: next, playing: next < lastStep };
      });
    }, 5500 / speed);
    return () => window.clearTimeout(timer);
  }, [playing, step, lessonKey, lastStep, speed]);

  const goTo = (next: number) => setPlayback({ key: lessonKey, step: Math.max(0, Math.min(next, lastStep)), playing: false });
  const togglePlay = () => setPlayback({ key: lessonKey, step: step === lastStep ? 0 : step, playing: !playing });
  const identityLabel = (id: string) => constrained
    ? `${id}: ${id === 'A' || id === 'B' ? tr('成人', 'adult') : tr('小孩', 'child')}`
    : tr(`人物 ${id}`, `Person ${id}`);

  const token = (id: string) => (
    <motion.span
      key={id}
      layout={!reducedMotion}
      layoutId={`${instanceId}-person-${id}`}
      transition={{ duration, ease: 'easeInOut' }}
      className={`ca-token ${constrained && (id === 'A' || id === 'B') ? 'ca-token-adult' : ''}`}
      aria-label={identityLabel(id)}
    >
      <span className="ca-token-letter" aria-hidden="true">{id}</span>
      <span className="ca-token-emoji" aria-hidden="true">{constrained ? (id === 'A' || id === 'B' ? '🧑' : '🧒') : story.emoji}</span>
    </motion.span>
  );
  const pool = (ids: string[], label = tr('尚可選的人', 'People still available')) => (
    <div className="ca-pool">
      <div className="ca-row-label">{label}<span className="ca-count">{ids.length}</span></div>
      <motion.div layout={!reducedMotion} className="ca-token-row" transition={{ duration }}>
        {ids.map(id => token(id))}
        {ids.length === 0 && <span className="ca-empty-note">{tr('五人已全部在隊列中', 'All five are now in the line')}</span>}
      </motion.div>
    </div>
  );
  const slots = (ids: string[], roles = false) => (
    <div className="ca-places">
      {[0, 1, 2].map(index => (
        <div className="ca-place" key={index}>
          <span className="ca-place-label">{roles ? text(story.roles[index]) : tr(`第 ${index + 1} 位`, `Place ${index + 1}`)}</span>
          <div className={`ca-slot ${ids[index] ? 'ca-slot-filled' : ''}`}>
            {ids[index] ? token(ids[index]) : <span className="ca-placeholder" aria-hidden="true">?</span>}
          </div>
          {!roles && <span className="ca-place-note">{tr(`${5 - index} 個選擇`, `${5 - index} choices`)}</span>}
        </div>
      ))}
    </div>
  );
  const team = (ids: string[]) => (
    <motion.div layout={!reducedMotion} transition={{ duration }} className="ca-team">
      <span className="ca-row-label">{tr('同一隊 · 不分次序', 'One team · no order')}</span>
      <div className="ca-token-row">{ids.length ? ids.map(id => token(id)) : <span className="ca-empty-note">{tr('從上方五人選三人', 'Select three of the five above')}</span>}</div>
    </motion.div>
  );
  const orderCards = (collapsed: boolean) => (
    <div className="ca-equivalence">
      <p className="ca-row-label">{collapsed ? tr('6 個次序 → 1 隊', '6 orders → 1 team') : tr('相同成員的全部 6 個次序', 'All 6 orders of the same members')}</p>
      <motion.div layout={!reducedMotion} transition={{ duration }} className={`ca-order-cards ${collapsed ? 'ca-order-cards-collapsed' : ''}`}>
        <AnimatePresence initial={false}>
          {(collapsed ? ['ABC'] : REORDERINGS).map(order => (
            <motion.div key={order} layout={!reducedMotion} transition={{ duration }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: reducedMotion ? 1 : 0.92 }} className="ca-order-card">
              <span className="ca-mini-letters">{order.split('').map((letter, index) => <span className="ca-mini-token" key={`${letter}-${index}`}>{letter}</span>)}</span>
              {collapsed && <span className="ca-card-caption">{tr('一個身份集合', 'one membership set')}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );

  const renderScene = () => {
    if (activeKind === 'order') {
      const placed = step === 0 ? [] : step === 1 ? ['A'] : step === 2 ? ['A', 'B'] : step === 3 ? ['A', 'B', 'C'] : ['B', 'A', 'C'];
      return <>{pool(PEOPLE.filter(id => !placed.includes(id)))}{slots(placed)}<p className="ca-stage-caption">{step >= 4 ? tr('ABC → BAC：交換位置，是另一個排列', 'ABC → BAC: swapping places gives another permutation') : tr('逐格填入；已用過的身份不會重複', 'Fill one place at a time; used identities cannot repeat')}</p></>;
    }
    if (activeKind === 'choose') {
      if (step === 4) return <div className="ca-all-teams"><p className="ca-row-label">{tr('全部 10 隊 · 每個集合只列一次', 'All 10 teams · each membership set listed once')}</p><div className="ca-teams-grid">{TEAMS.map(members => <motion.div layout={!reducedMotion} initial={{ opacity: reducedMotion ? 1 : 0 }} animate={{ opacity: 1 }} transition={{ duration }} className="ca-team-chip" key={members}><span aria-hidden="true">{'{'}</span>{members.split('').join(', ')}<span aria-hidden="true">{'}'}</span></motion.div>)}</div></div>;
      return <>{pool(step === 0 ? PEOPLE : ['D', 'E'], step === 0 ? undefined : tr('未入選的人', 'Not selected'))}{team(step === 0 ? [] : ['A', 'B', 'C'])}{step >= 2 && orderCards(step >= 3)}{step < 2 && <p className="ca-stage-caption">{tr('沒有編號位置，也沒有職位標籤', 'No numbered places and no role labels')}</p>}</>;
    }
    if (activeKind === 'bundle') {
      if (step === 0) return <>{pool(PEOPLE, tr('五位不同的人', 'Five distinct people'))}<p className="ca-stage-caption">{tr('金色 A、B：成人 · C、D、E：小孩', 'Gold A, B: adults · C, D, E: children')}</p></>;
      const units = step === 1 ? ['bundle', 'C', 'D', 'E'] : ['C', 'bundle', 'D', 'E'];
      return <><p className="ca-row-label">{tr('四個不同單位 · 金框不可拆開', 'Four distinct units · the gold frame stays together')}</p><motion.div layout={!reducedMotion} transition={{ duration }} className="ca-units">{units.map((unit, index) => <motion.div key={unit} layout={!reducedMotion} transition={{ duration }} className={`ca-unit ${unit === 'bundle' ? 'ca-unit-wide' : ''}`}><span className="ca-place-label">{tr(`單位 ${index + 1}`, `Unit ${index + 1}`)}</span>{unit === 'bundle' ? <motion.div layout={!reducedMotion} transition={{ duration }} className="ca-bundle">{(step >= 3 ? ['B', 'A'] : ['A', 'B']).map(id => token(id))}</motion.div> : token(unit)}</motion.div>)}</motion.div><p className="ca-stage-caption">{step >= 3 ? tr('AB → BA：金框內仍有兩個不同次序', 'AB → BA: the bundle has two distinct internal orders') : tr('框內兩人佔兩個位置，但對外視為一個單位', 'Two people occupy two places, but act as one external unit')}</p></>;
    }
    if (activeKind === 'mixed') {
      const placed = step < 2 ? [] : step === 2 ? ['A', 'B', 'C'] : ['B', 'A', 'C'];
      return <>{pool(step === 0 ? PEOPLE : ['D', 'E'], step === 0 ? undefined : tr('未入選的人', 'Not selected'))}{step < 2 ? team(step === 0 ? [] : ['A', 'B', 'C']) : slots(placed, true)}{step === 4 ? <><p className="ca-stage-caption">{tr('每張卡由左至右對應上方三個角色', 'Read each card left to right in the role order above')}</p>{orderCards(false)}</> : <p className="ca-stage-caption">{step < 2 ? tr('先只看身份集合；稍後才分配角色', 'First decide membership; assign roles afterwards') : tr('角色有分別：同隊也可以有不同分配', 'Roles differ: the same team can have different assignments')}</p>}</>;
    }
    if (step === 0) return <>{pool(PEOPLE, tr('五位不同的人', 'Five distinct people'))}<p className="ca-stage-caption">{tr('金色 A、B：成人 · 先排列 C、D、E', 'Gold A, B: adults · arrange C, D, E first')}</p></>;
    const showGaps = step >= 2;
    const selectedGaps = step >= 3;
    const filledGaps = step >= 4;
    const adultOrder = step >= 5 ? ['B', 'A'] : ['A', 'B'];
    return <>{pool(filledGaps ? [] : ['A', 'B'], tr('等候插入的成人', 'Adults waiting to be inserted'))}<p className="ca-row-label">{showGaps ? tr('四個空隙：包含隊首與隊尾', 'Four gaps: including both ends') : tr('先固定一個小孩次序作示範', 'One example order of the children')}</p><motion.div layout={!reducedMotion} transition={{ duration }} className={`ca-gap-line ${showGaps ? 'ca-gap-line-expanded' : ''}`}>{[0, 1, 2, 3].map(index => <div className="ca-gap-piece" key={index}>{showGaps && <div className={`ca-gap ${selectedGaps && (index === 0 || index === 2) ? 'ca-gap-selected' : ''}`}><span className="ca-gap-number" aria-label={tr(`空隙 ${index + 1}`, `Gap ${index + 1}`)}>{index + 1}</span>{filledGaps && (index === 0 || index === 2) ? token(adultOrder[index === 0 ? 0 : 1]) : <span className="ca-gap-mark" aria-hidden="true">{selectedGaps && (index === 0 || index === 2) ? '✓' : '·'}</span>}</div>}{index < 3 && token(['C', 'D', 'E'][index])}</div>)}</motion.div><p className="ca-stage-caption">{filledGaps ? tr('所選空隙各放一位成人，成人之間必有小孩', 'One adult per chosen gap guarantees a child between the adults') : selectedGaps ? tr('金色空隙 1、3 是六種選法中的一種', 'Gold gaps 1 and 3 are one of six possible gap selections') : tr('隊列是直線；左右兩端不是同一個位置', 'This is a straight line; its two ends are distinct')}</p></>;
  };

  return (
    <MotionConfig reducedMotion="user">
      <section className={`ca-module ${compact ? 'ca-compact' : ''}`} aria-labelledby={`${instanceId}-title`}>
        <header className="ca-header">
          <div><p className="ca-eyebrow">{tr('看得見的計數原理', 'COUNTING IN MOTION')}</p><h2 className="ca-heading" id={`${instanceId}-title`}>{text(TITLES[activeKind])}</h2></div>
          <span className="ca-demo-badge">{constrained ? tr('固定示範：2 成人 + 3 小孩', 'Fixed demo: 2 adults + 3 children') : tr('固定示範：5 人中取 3 人', 'Fixed demo: take 3 of 5 people')}</span>
        </header>
        {(kind === undefined || scenario === undefined) && <div className="ca-selectors">
          {kind === undefined && <fieldset className="ca-choice-group"><legend>{tr('教學場景', 'Teaching scene')}</legend><div className="ca-scene-buttons">{KINDS.map(value => <button type="button" key={value} className={`ca-scene-button ${activeKind === value ? 'ca-scene-button-active' : ''}`} aria-pressed={activeKind === value} onClick={() => { setSelectedKind(value); goTo(0); }}>{text(SHORT_TITLES[value])}</button>)}</div></fieldset>}
          {scenario === undefined && <label className="ca-story-label" htmlFor={`${instanceId}-story`}>{tr('生活故事', 'Story context')}<select className="ca-select" id={`${instanceId}-story`} value={activeStory} onChange={event => { setSelectedStory(event.target.value as StoryKey); goTo(0); }}>{STORIES.map(value => <option value={value} key={value}>{text(STORY_COPY[value].title)}</option>)}</select></label>}
        </div>}
        <div className="ca-question"><span aria-hidden="true" className="ca-story-icon">{story.emoji}</span><p>{text(story.questions[activeKind])}</p></div>
        <div className="ca-stage" role="group" aria-label={tr('固定小規模動畫示範', 'Fixed small-scale animated demonstration')}>
          <LayoutGroup id={instanceId}>{renderScene()}</LayoutGroup>
        </div>
        <div className="ca-progress" aria-hidden="true">{steps.map((_, index) => <span className={`ca-progress-segment ${index <= step ? 'ca-progress-segment-filled' : ''}`} key={index} />)}</div>
        <div className="ca-step-heading"><span className="ca-step-number">{tr(`步驟 ${step + 1} / ${steps.length}`, `Step ${step + 1} of ${steps.length}`)}</span><span className="ca-playback-status">{playing ? tr('播放中', 'Playing') : step === lastStep ? tr('已完成', 'Complete') : tr('已暫停', 'Paused')}</span></div>
        <div className="ca-explanation" aria-live="polite" aria-atomic="true">
          <h3 className="ca-step-title">{text(current.title)}</h3>
          <div className="ca-formula"><KatexRenderer latex={`\\displaystyle ${current.latex}`} display className="ca-katex" /></div>
          <div className="ca-reason"><Lightbulb className="ca-detail-icon" aria-hidden="true" /><div><h4>{tr('為甚麼？', 'Why?')}</h4><p>{text(current.reason)}</p></div></div>
          <div className="ca-pitfall"><CircleAlert className="ca-detail-icon" aria-hidden="true" /><div><h4>{tr('易錯提醒', 'Watch out')}</h4><p>{text(current.pitfall)}</p></div></div>
        </div>
        <nav className="ca-controls" aria-label={tr('動畫播放控制', 'Animation playback controls')}>
          <button type="button" className="ca-control" onClick={() => goTo(step - 1)} disabled={step === 0} aria-label={tr('上一步，並暫停', 'Previous step and pause')}><ChevronLeft className="ca-control-icon" aria-hidden="true" /><span>{tr('上一步', 'Previous')}</span></button>
          <button type="button" className="ca-control ca-control-primary" onClick={togglePlay} aria-label={playing ? tr('暫停動畫', 'Pause animation') : step === lastStep ? tr('重新開始播放', 'Play again from the beginning') : tr('播放動畫', 'Play animation')} aria-pressed={playing}>{playing ? <Pause className="ca-control-icon" aria-hidden="true" /> : <Play className="ca-control-icon" aria-hidden="true" />}<span>{playing ? tr('暫停', 'Pause') : tr('播放', 'Play')}</span></button>
          <button type="button" className="ca-control" onClick={() => goTo(step + 1)} disabled={step === lastStep} aria-label={tr('下一步，並暫停', 'Next step and pause')}><span>{tr('下一步', 'Next')}</span><ChevronRight className="ca-control-icon" aria-hidden="true" /></button>
          <button type="button" className="ca-control" onClick={() => setPlayback({ key: lessonKey, step: 0, playing: true })} aria-label={tr('從第一步重播', 'Replay from the first step')}><RotateCcw className="ca-control-icon" aria-hidden="true" /><span>{tr('重播', 'Replay')}</span></button>
        </nav>
        <footer className="ca-footer"><p>{reducedMotion ? tr('已減少動態效果；仍可逐步閱讀或播放。', 'Reduced motion is on; read step by step or play.') : tr('從暫停開始。可逐步閱讀，或播放固定示範。', 'Starts paused. Read step by step, or play the fixed demo.')}</p><label className="ca-speed-label" htmlFor={`${instanceId}-speed`}>{tr('速度', 'Speed')}<select className="ca-select ca-speed-select" id={`${instanceId}-speed`} value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value={0.75}>0.75×</option><option value={1}>1×</option><option value={1.5}>1.5×</option><option value={2}>2×</option></select></label></footer>
      </section>
    </MotionConfig>
  );
}
