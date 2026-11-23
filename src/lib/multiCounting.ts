import { MULTI_MAX_GROUPS, MULTI_MAX_ITEMS } from './multiTypes';
import type { MultiProblem, MultiProfile, MultiResult, MultiSolutionStep } from './multiTypes';

// No conversion of a count to Number: even profile weights and DP edges are exact.
const FACTORIAL: bigint[] = [1n];
for (let i = 1; i <= MULTI_MAX_ITEMS; i++) FACTORIAL.push(FACTORIAL[i - 1] * BigInt(i));
const choose = (n: number, k: number): bigint => FACTORIAL[n] / (FACTORIAL[k] * FACTORIAL[n - k]);
const copy = (zh: string, en: string) => ({ zh, en });
const isId = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const inRange = (value: number, min: number, max: number) => Number.isInteger(value) && value >= min && value <= max;
const fail = (zh: string, en: string): MultiResult => ({
  valid: false, error: copy(zh, en), count: 0n, example: [], steps: [], profiles: [],
});
const step = (titleZh: string, titleEn: string, reasonZh: string, reasonEn: string,
  pitfallZh: string, pitfallEn: string, latex: string): MultiSolutionStep => ({
  title: copy(titleZh, titleEn), reason: copy(reasonZh, reasonEn),
  pitfall: copy(pitfallZh, pitfallEn), latex,
});

interface Unit { ids: string[]; pins: { id: string; position: number }[] }

/**
 * Identities follow buildMultiItems: `${group.id}-${index + 1}`. Groups may have
 * zero items, but their total must be 1..16. All input objects remain untouched.
 * Exact duplicate fixed/quota rules are idempotent; duplicate bundle IDs,
 * repeated bundle members and overlapping bundles are errors (never merged).
 * selectCount is applicable only to select/selectArrange, not line/circle.
 */
export function calculateMulti(problem: MultiProblem): MultiResult {
  if (!problem || !Array.isArray(problem.groups) || !Array.isArray(problem.bundles)
    || !Array.isArray(problem.fixed) || !Array.isArray(problem.quotas)) {
    return fail('需要完整的類別及限制清單。', 'Provide complete group and constraint arrays.');
  }
  if (!['line', 'circle', 'select', 'selectArrange'].includes(problem.mode)) {
    return fail('未知的計數模式。', 'Unknown counting mode.');
  }
  if (!inRange(problem.groups.length, 1, MULTI_MAX_GROUPS)) {
    return fail(`類別數目必須是 1 至 ${MULTI_MAX_GROUPS}。`, `Use 1 to ${MULTI_MAX_GROUPS} groups.`);
  }
  const groupIndex = new Map<string, number>();
  const ids: string[] = [];
  const groupItems: string[][] = [];
  for (const [index, group] of problem.groups.entries()) {
    if (!group || !isId(group.id)) return fail('每個類別都需要非空識別碼。', 'Every group needs a non-empty ID.');
    if (groupIndex.has(group.id)) return fail('類別識別碼不可重複。', 'Group IDs must be unique.');
    if (!inRange(group.count, 0, MULTI_MAX_ITEMS)) {
      return fail(`每類數量必須是 0 至 ${MULTI_MAX_ITEMS} 的整數。`, `Each group count must be an integer from 0 to ${MULTI_MAX_ITEMS}.`);
    }
    groupIndex.set(group.id, index);
    const members = Array.from({ length: group.count }, (_, i) => `${group.id}-${i + 1}`);
    groupItems.push(members);
    ids.push(...members);
  }
  const n = ids.length;
  if (!inRange(n, 1, MULTI_MAX_ITEMS)) {
    return fail(`總數必須是 1 至 ${MULTI_MAX_ITEMS}。`, `Total items must be from 1 to ${MULTI_MAX_ITEMS}.`);
  }
  const selecting = problem.mode === 'select' || problem.mode === 'selectArrange';
  if (selecting && (problem.bundles.length || problem.fixed.length)) {
    return fail('選取模式不支援相鄰組塊或指定位置；請移除排位限制。', 'Selection modes do not support adjacency bundles or fixed positions; remove arrangement constraints.');
  }
  if (!selecting && problem.quotas.length) {
    return fail('直線及圓形排列不支援選取配額；請移除配額。', 'Line and circle arrangements do not support selection quotas; remove quotas.');
  }
  if (problem.mode === 'circle' && problem.fixed.length) {
    return fail('圓形排列的位置沒有編號，不能指定個別位置。', 'Circle positions are unnumbered; fixed individual positions are not supported.');
  }

  const steps: MultiSolutionStep[] = [step(
    '辨認不同個體', 'Identify distinct individuals',
    `共有 ${problem.groups.length} 類、${n} 個不同個體；同類個體仍有不同識別碼。`,
    `There are ${problem.groups.length} groups and ${n} distinct individuals; members of the same group still have different IDs.`,
    '不要把同類個體當成相同物件而除以類別階乘。',
    'Do not divide by group factorials: individuals within a group are distinct.',
    `n=${problem.groups.map(group => group.count).join('+')}=${n}`,
  )];

  if (selecting) {
    const r = problem.selectCount;
    if (!inRange(r, 0, n)) return fail('選取總數必須是 0 至總數的整數。', 'The selection size must be an integer from 0 to the total.');
    const lower = problem.groups.map(() => 0);
    const upper = problem.groups.map(group => group.count);
    const seenQuotas = new Map<string, { min: number; max: number }>();
    for (const quota of problem.quotas) {
      if (!quota || !isId(quota.groupId) || !groupIndex.has(quota.groupId)) {
        return fail('配額引用了不存在的類別。', 'A quota refers to a missing group.');
      }
      const index = groupIndex.get(quota.groupId)!;
      const groupCount = problem.groups[index].count;
      if (!inRange(quota.min, 0, groupCount) || !inRange(quota.max, 0, groupCount) || quota.min > quota.max) {
        return fail('配額上下限必須是 0 至該類數量的整數，且下限不能大於上限。', 'Quota bounds must be integers from 0 to the group count, with min no greater than max.');
      }
      const previous = seenQuotas.get(quota.groupId);
      if (previous && (previous.min !== quota.min || previous.max !== quota.max)) {
        return fail('同一類別有不同的重複配額；請只保留一組上下限。', 'Different duplicate quotas target the same group; keep one min/max rule.');
      }
      seenQuotas.set(quota.groupId, quota);
      lower[index] = quota.min;
      upper[index] = quota.max;
    }
    const g = problem.groups.length;
    const suffixMin = Array<number>(g + 1).fill(0);
    const suffixMax = Array<number>(g + 1).fill(0);
    for (let i = g - 1; i >= 0; i--) {
      suffixMin[i] = lower[i] + suffixMin[i + 1];
      suffixMax[i] = upper[i] + suffixMax[i + 1];
    }
    const profiles: MultiProfile[] = [];
    const counts = Array<number>(g).fill(0);
    const enumerate = (index: number, remaining: number, ways: bigint): void => {
      if (remaining < suffixMin[index] || remaining > suffixMax[index]) return;
      if (index === g) {
        profiles.push({ counts: [...counts], ways });
        return;
      }
      const min = Math.max(lower[index], remaining - suffixMax[index + 1]);
      const max = Math.min(upper[index], remaining - suffixMin[index + 1]);
      for (let k = min; k <= max; k++) {
        counts[index] = k;
        enumerate(index + 1, remaining - k, ways * choose(problem.groups[index].count, k));
      }
    };
    enumerate(0, r, 1n);
    const selections = profiles.reduce((sum, profile) => sum + profile.ways, 0n);
    const arranged = problem.mode === 'selectArrange';
    const count = selections * (arranged ? FACTORIAL[r] : 1n);
    const example = profiles.length ? groupItems.flatMap((members, index) => members.slice(0, profiles[0].counts[index])) : [];
    steps.push(step(
      '列出所有合法類別分配', 'Enumerate every legal group profile',
      `各類選取數必須同時符合配額，合計 ${r}。共有 ${profiles.length} 個合法分配；每個分配的選法為各類組合數的乘積，再把所有分配相加。未設定配額的類別使用 0 至該類總數。`,
      `Every group count must satisfy its quota simultaneously and sum to ${r}. There are ${profiles.length} legal profiles. Multiply group binomial coefficients within each profile, then sum over all profiles. Unspecified quotas default to 0 through the group count.`,
      '不能只計第一個合法分配，也不能先選每類後忽略總數限制。',
      'Do not count only the first profile or ignore the total-size constraint.',
      `\\mathbf{n}=(${problem.groups.map(group => group.count).join(',')}),\\quad \\mathbf{L}=(${lower.join(',')}),\\quad \\mathbf{U}=(${upper.join(',')});\\quad S=\\sum_{\\substack{k_1+\\cdots+k_${g}=${r}\\\\L_i\\le k_i\\le U_i\\ (1\\le i\\le ${g})}}\\prod_{i=1}^{${g}}\\binom{n_i}{k_i}=${selections}`,
    ));
    if (arranged) steps.push(step(
      '選取後排列', 'Arrange after selecting',
      `每個合法的 ${r} 人集合有 ${r}! 個直線排列。分配表的 ways 保留乘階乘前的選法。`,
      `Each legal set of ${r} distinct individuals has ${r}! line orders. Profile ways remain selection counts before this multiplier.`,
      '每類已用組合數選人，不要再乘每類人數的階乘。',
      'Group binomial coefficients already select individuals; do not multiply by group factorials.',
      `N=S\\times ${r}!=${selections}\\times ${FACTORIAL[r]}=${count}`,
    ));
    else steps.push(step('選取總數', 'Total selections', '選取不分先後。', 'The order of selection does not matter.',
      '選取模式不乘 r!。', 'Do not multiply by r! in selection mode.', `N=S=${count}`));
    if (!count) steps.push(noSolution('配額與選取總數不能同時滿足。', 'The quotas and selection size cannot be satisfied simultaneously.'));
    return { valid: true, count, example, steps, profiles };
  }

  const known = new Set(ids);
  const bundled = new Set<string>();
  const bundleIds = new Set<string>();
  const units: Unit[] = [];
  for (const bundle of problem.bundles) {
    if (!bundle || !isId(bundle.id) || !Array.isArray(bundle.itemIds) || !bundle.itemIds.length) {
      return fail('每個組塊需要非空識別碼及至少一個個體。', 'Every bundle needs a non-empty ID and at least one identity.');
    }
    if (bundleIds.has(bundle.id)) return fail('組塊識別碼重複；請移除重複規則。', 'Duplicate bundle ID; remove the duplicate rule.');
    bundleIds.add(bundle.id);
    const local = new Set<string>();
    for (const id of bundle.itemIds) {
      if (!isId(id) || !known.has(id)) return fail('組塊引用了不存在的個體。', 'A bundle refers to a missing identity.');
      if (local.has(id)) return fail('同一組塊內不能重複列出同一個體。', 'An identity is repeated within a bundle.');
      if (bundled.has(id)) return fail('組塊重疊：同一個體不能屬於多個組塊；不會自動合併。', 'Overlapping bundles: an identity cannot belong to multiple bundles; bundles are not merged.');
      local.add(id);
    }
    for (const id of local) bundled.add(id);
    units.push({ ids: [...bundle.itemIds], pins: [] });
  }
  for (const id of ids) if (!bundled.has(id)) units.push({ ids: [id], pins: [] });
  const m = units.length;
  const unitOf = new Map<string, number>();
  units.forEach((unit, index) => unit.ids.forEach(id => unitOf.set(id, index)));
  const fixedById = new Map<string, number>();
  const fixedByPosition = new Map<number, string>();
  for (const fixed of problem.fixed) {
    if (!fixed || !isId(fixed.itemId) || !known.has(fixed.itemId)) return fail('指定位置引用了不存在的個體。', 'A fixed-position rule refers to a missing identity.');
    if (!inRange(fixed.position, 1, n)) return fail(`位置必須是 1 至 ${n} 的整數。`, `Positions must be integers from 1 to ${n}.`);
    if (fixedById.has(fixed.itemId) && fixedById.get(fixed.itemId) !== fixed.position) {
      return fail('同一個體被指定到不同位置。', 'The same individual is assigned different positions.');
    }
    if (fixedByPosition.has(fixed.position) && fixedByPosition.get(fixed.position) !== fixed.itemId) {
      return fail('兩個不同個體被指定到同一位置。', 'Two different individuals are assigned the same position.');
    }
    if (!fixedById.has(fixed.itemId)) units[unitOf.get(fixed.itemId)!].pins.push({ id: fixed.itemId, position: fixed.position });
    fixedById.set(fixed.itemId, fixed.position);
    fixedByPosition.set(fixed.position, fixed.itemId);
  }
  const internalWays = units.reduce((product, unit) => product * FACTORIAL[unit.ids.length], 1n);
  const internalFormula = units.map(unit => `${unit.ids.length}!`).join('\\times ');
  if (problem.mode === 'circle') {
    // If there is only one unit, its internal rotations must also be identified.
    const count = m === 1 ? FACTORIAL[n - 1] : FACTORIAL[m - 1] * internalWays;
    const example = units.flatMap(unit => unit.ids);
    const anchor = example.indexOf(ids[0]);
    const cyclicExample = [...example.slice(anchor), ...example.slice(0, anchor)];
    steps.push(step(
      '圓形排列及旋轉等價', 'Circular arrangements modulo rotation',
      m === 1
        ? `全部 ${n} 個個體在唯一組塊內，相鄰條件自動滿足；固定一個個體作旋轉參考，排列其餘 ${n - 1} 個。`
        : `把各相鄰組塊收縮為一個單位，連同單獨個體共 ${m} 個單位；圓周排列單位後，再排列各組塊內部。`,
      m === 1
        ? `All ${n} identities form the only unit, so adjacency is automatic. Anchor one identity to remove rotations and arrange the other ${n - 1}.`
        : `Contract each adjacency bundle to a unit; including singletons there are ${m} units. Arrange the units around the circle, then order each bundle internally.`,
      '旋轉視為相同，鏡像視為不同；相鄰組塊可跨越例子的首尾。只有一個組塊時不能使用 0! 乘 n!。',
      'Rotations are identical, reflections are different, and a bundle may wrap across the example boundary. A single all-item bundle is not counted as 0! times n!.',
      m === 1 || !problem.bundles.length
        ? `N=(${n}-1)!=${n - 1}!=${count}`
        : `N=(${m}-1)!\\prod_{j=1}^{${m}}b_j!=${m - 1}!\\times ${internalFormula}=${count}`,
    ));
    return { valid: true, count, example: cyclicExample, steps, profiles: [], unitCount: m };
  }
  if (!fixedById.size) {
    const count = FACTORIAL[m] * internalWays;
    steps.push(problem.bundles.length ? step(
      '相鄰組塊法', 'Adjacent-bundle method',
      `各組塊內部順序不限。收縮後共有 ${m} 個不同單位，先排列單位，再乘各組塊內部階乘。`,
      `Internal bundle order is unrestricted. After contraction there are ${m} distinct units; arrange the units and multiply their internal factorials.`,
      '多個組塊必須分開計算；同類個體仍然不同。',
      'Keep disjoint bundles separate; individuals in the same group are still distinct.',
      `N=${m}!\\prod_{j=1}^{${m}}b_j!=${m}!\\times ${internalFormula}=${count}`,
    ) : step(
      '無限制直線排列', 'Unrestricted line permutations',
      `將 ${n} 個不同個體排成一排。`, `Arrange all ${n} distinct identities in a line.`,
      '這裏使用全部個體，不是從中選取。', 'This arranges every identity, not a selection.', `N=${n}!=${count}`,
    ));
    return { valid: true, count, example: units.flatMap(unit => unit.ids), steps, profiles: [], unitCount: m };
  }

  if (units.every(unit => unit.ids.length === 1)) {
    const k = fixedById.size;
    const count = FACTORIAL[n - k];
    const free = ids.filter(id => !fixedById.has(id));
    let next = 0;
    const example = Array.from({ length: n }, (_, index) => fixedByPosition.get(index + 1) ?? free[next++]);
    steps.push(step(
      '先固定個體，再排列餘下個體', 'Pin individuals, then arrange the rest',
      `已將 ${k} 個不同個體固定在不同位置；餘下 ${n - k} 個不同個體可任意填入空位。單一個體的組塊不增加限制。`,
      `${k} distinct individuals occupy distinct fixed positions. Freely arrange the other ${n - k} individuals in the remaining slots. Singleton bundles add no restriction.`,
      '重複的相同指定規則只算一次；不能再排列已指定的個體。',
      'Identical duplicate fixed rules count only once; pinned individuals are not rearranged.',
      `N=(${n}-${k})!=${n - k}!=${count}`,
    ));
    return { valid: true, count, example, steps, profiles: [], unitCount: m };
  }

  // A unit beginning at 1-based s owns [s, s+b-1]. All its pins must be
  // inside, and no pin belonging to an outside unit may lie inside that range.
  // Distinct-pin collision checks above guarantee all internal offsets differ.
  const ownerAtPosition = Array<number>(n).fill(-1);
  for (const [position, id] of fixedByPosition) ownerAtPosition[position - 1] = unitOf.get(id)!;
  const weights = units.map((unit, index) => Array.from({ length: n - unit.ids.length + 1 }, (_, start) => {
    const end = start + unit.ids.length;
    if (unit.pins.some(pin => pin.position <= start || pin.position > end)) return 0n;
    for (let position = start; position < end; position++) {
      if (ownerAtPosition[position] !== -1 && ownerAtPosition[position] !== index) return 0n;
    }
    return FACTORIAL[unit.ids.length - unit.pins.length];
  }));
  const size = 1 << m;
  const occupied = new Uint8Array(size);
  for (let mask = 1; mask < size; mask++) {
    const bit = mask & -mask;
    occupied[mask] = occupied[mask ^ bit] + units[31 - Math.clz32(bit)].ids.length;
  }
  const dp: bigint[] = Array<bigint>(size).fill(0n);
  dp[0] = 1n;
  for (let mask = 0; mask < size; mask++) {
    if (!dp[mask]) continue;
    for (let j = 0; j < m; j++) {
      const bit = 1 << j;
      if (mask & bit) continue;
      const weight = weights[j][occupied[mask]];
      if (weight) dp[mask | bit] += dp[mask] * weight;
    }
  }
  const count = dp[size - 1];
  const example: string[] = [];
  if (count) {
    // Reverse only positive incoming transitions: each chosen predecessor is
    // reachable from the empty set, so the reversed path is a legal full order.
    const reverseUnits: number[] = [];
    let mask = size - 1;
    while (mask) {
      for (let j = 0; j < m; j++) {
        const bit = 1 << j;
        if (!(mask & bit)) continue;
        const previous = mask ^ bit;
        if (dp[previous] && weights[j][occupied[previous]]) {
          reverseUnits.push(j);
          mask = previous;
          break;
        }
      }
    }
    for (const j of reverseUnits.reverse()) {
      const unit = units[j];
      const slots: (string | undefined)[] = Array(unit.ids.length).fill(undefined);
      for (const pin of unit.pins) slots[pin.position - example.length - 1] = pin.id;
      const free = unit.ids.filter(id => !fixedById.has(id));
      let next = 0;
      for (const slot of slots) example.push(slot ?? free[next++]);
    }
  }
  steps.push(step(
    '收縮並檢查單位位置', 'Contract units and check their positions',
    `共有 ${m} 個可變長度單位。單位 j 在位置 s 開始時，它的所有指定個體必須落在內部不同位置，且不能覆蓋其他單位個體的指定位置。合法時只排列未指定的 f_j 個個體。`,
    `There are ${m} variable-length units. A unit j beginning at s must contain every one of its pinned identities at distinct internal offsets, and must not cover a pinned position owned by another unit. When compatible, only its f_j unpinned members are freely ordered.`,
    '不能只檢查組塊自己的指定位置；也要避免佔用外部個體的位置。',
    'Checking only the bundle’s own pins is insufficient: outside pinned positions must also be excluded.',
    'w_j(s)=\\begin{cases}f_j!&\\text{all own pins in }[s,s+b_j-1]\\text{ and no outside pin there}\\\\0&\\text{otherwise}\\end{cases}',
  ), step(
    '子集動態規劃', 'Weighted subset dynamic programming',
    'D(A) 計算已放好單位集合 A 的合法前綴數。下一個起點由已放單位的長度總和決定；對每個未放單位累加前綴數乘合法內部排法。從正數轉移回溯並填入指定位置，得到一個完整例子。',
    'D(A) counts legal prefixes using exactly the placed-unit set A. The next start is determined by their total length. For each unused unit, add the prefix count times its compatible internal weight. Backtrack positive transitions and fill pinned slots to construct a full example.',
    '指定位置與可變組塊長度互相影響，不能假裝使用單一階乘公式。',
    'Fixed positions interact with variable bundle lengths; a simple factorial shortcut is not valid.',
    `D(\\varnothing)=1,\\quad s(A)=1+\\sum_{i\\in A}b_i;\\quad D(A\\cup\\{j\\})\\mathrel{+}=D(A)w_j(s(A))\\ (j\\notin A);\\quad N=D(\\{1,\\ldots,${m}\\})=${count}`,
  ));
  if (!count) steps.push(noSolution('相鄰組塊與指定位置不能同時滿足；沒有通往完整集合的合法轉移。', 'Adjacency bundles and fixed positions cannot be satisfied together; no compatible path reaches the full set.'));
  return { valid: true, count, example, steps, profiles: [], unitCount: m };
}

function noSolution(zh: string, en: string): MultiSolutionStep {
  return step('沒有解', 'No solution', zh, en,
    '規則本身有效，但彼此無法同時滿足；這不是輸入錯誤。',
    'The rules are well-formed but mutually incompatible; this is not an input error.', 'N=0');
}
