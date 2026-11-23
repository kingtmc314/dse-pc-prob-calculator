import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cache = new Map();
function moduleURL(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file);
  let js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext },
  }).outputText;
  js = js.replace(/from ['"](\.[^'"]+)['"]/g, (_, name) =>
    `from '${moduleURL(resolve(dirname(file), /\.ts$/.test(name) ? name : name + '.ts'))}'`);
  const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
  cache.set(file, url);
  return url;
}
const { calculateMulti } = await import(moduleURL(resolve(root, 'src/lib/multiCounting.ts')));
const { buildMultiItems } = await import(moduleURL(resolve(root, 'src/lib/multiTypes.ts')));
const group = (id, count) => ({ id, count, label: { zh: id, en: id }, emoji: '*' });
const make = (sizes, mode = 'line', extra = {}) => ({
  groups: sizes.map((size, i) => group(`G${i + 1}`, size)), mode,
  selectCount: 0, bundles: [], fixed: [], quotas: [], ...extra,
});
const identities = problem => buildMultiItems(problem.groups).map(item => item.id);
const bundle = (id, itemIds) => ({ id, itemIds });
const fixed = (itemId, position) => ({ itemId, position });
const quota = (groupId, min, max) => ({ groupId, min, max });
const factorial = n => { let value = 1n; for (let i = 2; i <= n; i++) value *= BigInt(i); return value; };
let assertions = 0;
let bruteCases = 0;
let permutationVisits = 0;
let subsetVisits = 0;
const same = (actual, expected, label = '') => { assert.deepEqual(actual, expected, label); assertions++; };
const check = (condition, label = '') => { assert(condition, label); assertions++; };

function validateSteps(result) {
  check(result.steps.length > 0, 'Valid calculations explain their reasoning');
  for (const step of result.steps) {
    for (const field of ['title', 'reason', 'pitfall']) {
      check(typeof step[field].zh === 'string' && step[field].zh.length > 0, `${field} in Chinese`);
      check(typeof step[field].en === 'string' && step[field].en.length > 0, `${field} in English`);
    }
    check(typeof step.latex === 'string' && step.latex.length > 0, 'Displayed formula exists');
    same(/[\t\f\r\n\u0000-\u0008]/.test(step.latex), false, 'LaTeX escapes are not control characters');
  }
  check(result.steps.at(-1).latex.includes(String(result.count)), 'Final formula includes exact total');
}
function adjacent(order, members, circle) {
  if (members.length === order.length) return true;
  const selected = new Set(members);
  if (!circle) {
    const positions = order.flatMap((id, index) => selected.has(id) ? [index] : []);
    return positions.at(-1) - positions[0] + 1 === members.length;
  }
  // Exactly one run of selected members around the full cycle, including wrap.
  return order.filter((id, i) => selected.has(id) && !selected.has(order[(i + order.length - 1) % order.length])).length === 1;
}
function arrangementLegal(order, problem) {
  return problem.fixed.every(rule => order[rule.position - 1] === rule.itemId)
    && problem.bundles.every(rule => adjacent(order, rule.itemIds, problem.mode === 'circle'));
}
function selectionLegal(selected, problem) {
  if (selected.length !== problem.selectCount) return false;
  const counts = problem.groups.map(group => selected.filter(id => id.startsWith(`${group.id}-`)).length);
  return problem.quotas.every(rule => {
    const index = problem.groups.findIndex(group => group.id === rule.groupId);
    return counts[index] >= rule.min && counts[index] <= rule.max;
  });
}
function validateResult(problem, result) {
  same(result.valid, true, 'Well-formed problem is valid');
  same(result.error, undefined);
  same(typeof result.count, 'bigint');
  check(result.count >= 0n);
  validateSteps(result);
  const ids = identities(problem);
  const selecting = problem.mode === 'select' || problem.mode === 'selectArrange';
  same(new Set(result.example).size, result.example.length, 'Example identities are distinct');
  check(result.example.every(id => ids.includes(id)), 'Example only uses known identities');
  if (result.count > 0n) {
    same(result.example.length, selecting ? problem.selectCount : ids.length);
    check(selecting ? selectionLegal(result.example, problem) : arrangementLegal(result.example, problem), 'Example obeys all rules');
  } else {
    same(result.example, []);
    check(result.steps.some(step => /no solution/i.test(step.title.en)), 'Well-formed incompatibility is explained');
  }
  if (selecting) {
    same(result.unitCount, undefined);
    const seen = new Set();
    let selections = 0n;
    for (const profile of result.profiles) {
      same(profile.counts.length, problem.groups.length);
      same(profile.counts.reduce((a, b) => a + b, 0), problem.selectCount);
      check(!seen.has(profile.counts.join(',')), 'No duplicate profiles');
      seen.add(profile.counts.join(','));
      same(typeof profile.ways, 'bigint');
      check(profile.ways > 0n);
      selections += profile.ways;
    }
    same(result.count, selections * (problem.mode === 'selectArrange' ? factorial(problem.selectCount) : 1n));
  } else {
    same(result.profiles, []);
    same(result.unitCount, problem.bundles.length + ids.length - problem.bundles.reduce((sum, rule) => sum + rule.itemIds.length, 0));
  }
}
function* permutations(values) {
  if (!values.length) { yield []; return; }
  for (let i = 0; i < values.length; i++) {
    for (const suffix of permutations([...values.slice(0, i), ...values.slice(i + 1)])) yield [values[i], ...suffix];
  }
}
function brute(problem) {
  bruteCases++;
  const ids = identities(problem);
  check(ids.length <= 7, 'Brute-force cases stay small');
  const result = calculateMulti(problem);
  validateResult(problem, result);
  if (problem.mode === 'select' || problem.mode === 'selectArrange') {
    let selections = 0n;
    const profiles = new Map();
    for (let mask = 0; mask < 1 << ids.length; mask++) {
      subsetVisits++;
      const selected = ids.filter((_, i) => mask & 1 << i);
      if (!selectionLegal(selected, problem)) continue;
      selections++;
      const counts = problem.groups.map(group => selected.filter(id => id.startsWith(`${group.id}-`)).length);
      const key = counts.join(',');
      profiles.set(key, (profiles.get(key) ?? 0n) + 1n);
    }
    same(result.count, selections * (problem.mode === 'selectArrange' ? factorial(problem.selectCount) : 1n), 'Selection count equals exhaustive identity subsets');
    same(result.profiles.map(profile => [profile.counts.join(','), profile.ways]).sort(), [...profiles.entries()].sort(), 'ALL profile weights equal brute force before r!');
    if (result.profiles.length) {
      const first = problem.groups.flatMap((group, i) =>
        Array.from({ length: result.profiles[0].counts[i] }, (_, j) => `${group.id}-${j + 1}`));
      same(result.example, first, 'Selection example uses the first matching profile');
    }
  } else {
    let count = 0n;
    // Canonical circular representatives anchor the first distinct identity.
    const anchor = problem.mode === 'circle' ? [ids[0]] : [];
    for (const tail of permutations(anchor.length ? ids.slice(1) : ids)) {
      permutationVisits++;
      if (arrangementLegal([...anchor, ...tail], problem)) count++;
    }
    same(result.count, count, 'Count equals exhaustive legal identity permutations');
  }
  return result;
}
function expect(problem, count, label) {
  const result = calculateMulti(problem);
  validateResult(problem, result);
  same(result.count, count, label);
  return result;
}
function invalid(problem, pattern, label) {
  const result = calculateMulti(problem);
  same(result.valid, false, label);
  same(result.count, 0n);
  same(result.example, []);
  same(result.steps, []);
  same(result.profiles, []);
  check(result.error && result.error.zh.length > 0 && result.error.en.length > 0, 'Clear bilingual error');
  check(pattern.test(result.error.en), `Error explains ${pattern}: ${result.error.en}`);
}

// Basic factorial paths, every permitted size, cross-category blocks, and circles.
for (let n = 1; n <= 16; n++) {
  expect(make([n]), factorial(n), `Unrestricted ${n}!`);
  expect(make([n], 'circle'), factorial(n - 1), `Circle ${n - 1}!`);
  expect(make([n], 'circle', { bundles: [bundle('all', identities(make([n]))) ] }), factorial(n - 1), 'All-item circle special case');
  expect(make([n], 'select', { selectCount: Math.floor(n / 2) }), factorial(n) / (factorial(Math.floor(n / 2)) * factorial(n - Math.floor(n / 2))), 'Unrestricted combinations');
  expect(make([n], 'selectArrange', { selectCount: n }), factorial(n), 'Full selection then arrangement');
}
const cross = make([2, 2, 2], 'line', {
  bundles: [bundle('mixed-one', ['G1-1', 'G2-2', 'G3-1']), bundle('mixed-two', ['G1-2', 'G3-2'])],
});
same(brute(cross).count, 72n);
same(brute({ ...cross, mode: 'circle' }).count, 24n);
brute({ ...cross, fixed: [fixed('G2-2', 2), fixed('G1-2', 6)] });
brute({ ...cross, fixed: [fixed('G2-1', 3)] });
const impossible = make([4], 'line', { bundles: [bundle('pair', ['G1-1', 'G1-2'])], fixed: [fixed('G1-1', 1), fixed('G1-2', 4)] });
same(brute(impossible).count, 0n);
const outsideBlocked = make([3], 'line', { bundles: [bundle('pair', ['G1-1', 'G1-2'])], fixed: [fixed('G1-3', 2)] });
same(brute(outsideBlocked).count, 0n);
same(brute(make([3], 'line', { bundles: [bundle('all', ['G1-3', 'G1-1', 'G1-2'])], fixed: [fixed('G1-3', 1)] })).count, 2n);
const duplicateFixed = make([4], 'line', { fixed: [fixed('G1-2', 3), fixed('G1-2', 3)] });
same(brute(duplicateFixed).count, 6n, 'Exact duplicate fixed positions are idempotent');
brute(make([2, 0, 3], 'line'));
brute(make([2, 0, 3], 'select', { selectCount: 3, quotas: [quota('G2', 0, 0), quota('G1', 1, 2)] }));
brute(make([2, 2, 2], 'selectArrange', { selectCount: 4, quotas: [quota('G1', 1, 1), quota('G2', 1, 2), quota('G3', 1, 2)] }));
same(brute(make([2, 3], 'select', { selectCount: 1, quotas: [quota('G1', 2, 2), quota('G2', 1, 3)] })).count, 0n);
same(brute(make([2, 3], 'select', { selectCount: 5, quotas: [quota('G1', 0, 1)] })).count, 0n);
same(brute(make([2, 3], 'select', { selectCount: 0 })).count, 1n);
same(brute(make([2, 3], 'selectArrange', { selectCount: 0 })).count, 1n);
same(brute(make([2, 2], 'select', { selectCount: 2, quotas: [quota('G1', 1, 1), quota('G1', 1, 1)] })).count, 4n);

// Systematically exercise all lengths, internal pinned offsets, outside pins,
// multiple disjoint blocks, and adjacency across the circular boundary.
for (let n = 1; n <= 7; n++) {
  const base = make([n]);
  const ids = identities(base);
  brute(base);
  for (let b = 1; b <= n; b++) {
    const bundles = [bundle('block', ids.slice(0, b))];
    brute({ ...base, bundles });
    brute({ ...base, bundles, mode: 'circle' });
    for (let position = 1; position <= n; position++) {
      brute({ ...base, bundles, fixed: [fixed(ids[0], position)] });
      if (b < n) brute({ ...base, bundles, fixed: [fixed(ids[b], position)] });
    }
    for (let second = 1; second <= n - b; second++) {
      const pair = [...bundles, bundle('block-two', ids.slice(b, b + second))];
      brute({ ...base, bundles: pair });
      brute({ ...base, mode: 'circle', bundles: pair });
      brute({ ...base, bundles: pair, fixed: [fixed(ids[0], 1), fixed(ids[b], n)] });
    }
  }
}
const wrap = make([4], 'circle', { bundles: [bundle('wrap', ['G1-1', 'G1-4'])] });
const wrapResult = brute(wrap);
check(adjacent(['G1-1', 'G1-2', 'G1-3', 'G1-4'], wrap.bundles[0].itemIds, true), 'Independent circle checker accepts wrap adjacency');
same(wrapResult.count, 4n);
same(brute(make([3], 'circle')).count, 2n, 'Reflections remain distinct');

// A fixed seed makes random failures fully reproducible.
let seed = 0x5eedc0de;
const random = max => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
const shuffled = values => {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) { const j = random(i + 1); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
};
for (let trial = 0; trial < 360; trial++) {
  const n = 1 + random(7);
  const sizes = Array(1 + random(Math.min(8, n + 2))).fill(0);
  for (let i = 0; i < n; i++) sizes[random(sizes.length)]++;
  const base = make(sizes);
  const ids = shuffled(identities(base));
  const bundles = [];
  let cursor = 0;
  while (cursor < ids.length) {
    const length = 1 + random(Math.min(4, ids.length - cursor));
    const members = ids.slice(cursor, cursor + length);
    if (random(3) !== 0) bundles.push(bundle(`B${bundles.length}`, members));
    cursor += length;
  }
  const pinIds = shuffled(ids).slice(0, random(n + 1));
  const pinPositions = shuffled(Array.from({ length: n }, (_, i) => i + 1));
  const fixedRules = pinIds.map((id, i) => fixed(id, pinPositions[i]));
  brute({ ...base, bundles, fixed: fixedRules });
  brute({ ...base, bundles, mode: 'circle' });
  const quotas = base.groups.flatMap(group => {
    if (random(3) === 0) return [];
    const min = random(group.count + 1);
    const max = min + random(group.count - min + 1);
    return [quota(group.id, min, max)];
  });
  const selectCount = random(n + 1);
  const selected = brute({ ...base, mode: 'select', selectCount, quotas });
  const arranged = brute({ ...base, mode: 'selectArrange', selectCount, quotas });
  same(arranged.profiles, selected.profiles, 'Profile ways do not include r!');
}

// Eight categories, maximum total, every legal profile (no arbitrary truncation).
const many = make(Array(8).fill(2), 'select', { selectCount: 8 });
const manyResult = expect(many, 12870n);
same(manyResult.profiles.length, 1107, 'All 1107 legal eight-group profiles are retained');
const manyArranged = expect({ ...many, mode: 'selectArrange' }, 12870n * factorial(8));
same(manyArranged.profiles, manyResult.profiles);
const exactlyOne = many.groups.map(group => quota(group.id, 1, 1));
same(expect({ ...many, quotas: exactlyOne }, 256n).profiles, [{ counts: Array(8).fill(1), ways: 256n }]);
const sixteen = make(Array(8).fill(2));
const sixteenIds = identities(sixteen);
expect(sixteen, 20922789888000n, 'Exact maximum factorial, always BigInt');
expect({ ...sixteen, fixed: [fixed(sixteenIds[0], 8)] }, factorial(15), 'Maximum fixed-position factorial fast path');
expect({ ...sixteen, bundles: [bundle('pinned-pair', sixteenIds.slice(0, 2))], fixed: [fixed(sixteenIds[0], 1)] }, factorial(14), 'Maximum-total weighted DP with a non-singleton bundle');
expect({ ...sixteen, fixed: sixteenIds.map((id, i) => fixed(id, 16 - i)) }, 1n, 'All 16 identities pinned');
const fullBundle = [bundle('all', sixteenIds)];
expect({ ...sixteen, bundles: fullBundle, fixed: [fixed(sixteenIds[0], 4), fixed(sixteenIds[1], 11)] }, factorial(14), 'Maximum all-item block with two pinned members');
const eightPairs = Array.from({ length: 8 }, (_, i) => bundle(`pair-${i}`, [sixteenIds[i], sixteenIds[15 - i]]));
expect({ ...sixteen, bundles: eightPairs }, factorial(8) * 256n);
expect({ ...sixteen, mode: 'circle', bundles: eightPairs }, factorial(7) * 256n);
// n<=16 implies every answer <=16!<MAX_SAFE_INTEGER, so actual Number overflow
// is impossible within the contract. Exercise BigInt paths at the exact boundary
// and reject out-of-contract sizes (including unsafe enormous input counts).
check(factorial(16) < BigInt(Number.MAX_SAFE_INTEGER), 'No representable valid scenario can overflow a safe integer');
check(factorial(19) > BigInt(Number.MAX_SAFE_INTEGER), 'Overflow-sized factorial lies outside the allowed input range');

// Input errors are not zero-solution calculations and are never silently ignored.
invalid(make([17]), /count|total/i);
invalid(make([8, 9]), /total/i);
invalid(make([19]), /count|total/i);
invalid(make([Number.MAX_SAFE_INTEGER + 1]), /count/i);
invalid(make([Infinity]), /count/i);
invalid(make([NaN]), /count/i);
invalid(make([-1, 2]), /count/i);
invalid(make([1.5]), /integer/i);
invalid(make([0, 0]), /total/i);
invalid(make([]), /groups/i);
invalid(make(Array(9).fill(1)), /groups/i);
invalid(make([1, 1], 'line', { groups: [group('same', 1), group('same', 1)] }), /unique/i);
invalid(make([1], 'line', { groups: [group('', 1)] }), /ID/i);
invalid(make([1], 'unknown'), /mode/i);
invalid(null, /complete/i);
invalid({ ...make([1]), bundles: undefined }, /arrays/i);
invalid(make([3], 'select', { selectCount: -1 }), /selection size/i);
invalid(make([3], 'select', { selectCount: 4 }), /selection size/i);
invalid(make([3], 'selectArrange', { selectCount: 1.5 }), /integer/i);
invalid(make([3], 'select', { selectCount: NaN }), /integer/i);
invalid(make([3], 'select', { selectCount: 2, bundles: [bundle('b', ['G1-1'])] }), /arrangement constraints/i);
invalid(make([3], 'selectArrange', { selectCount: 2, fixed: [fixed('G1-1', 1)] }), /arrangement constraints/i);
invalid(make([3], 'line', { quotas: [quota('G1', 1, 2)] }), /quotas/i);
invalid(make([3], 'circle', { quotas: [quota('G1', 1, 2)] }), /quotas/i);
invalid(make([3], 'circle', { fixed: [fixed('G1-1', 1)] }), /unnumbered/i);
invalid(make([3], 'line', { bundles: [bundle('missing', ['unknown-1'])] }), /missing identity/i);
invalid(make([3], 'line', { fixed: [fixed('unknown-1', 1)] }), /missing identity/i);
invalid(make([3], 'select', { quotas: [quota('unknown', 0, 1)] }), /missing group/i);
invalid(make([3], 'line', { bundles: [bundle('a', ['G1-1', 'G1-2']), bundle('b', ['G1-2', 'G1-3'])] }), /overlapping.*not merged/i);
invalid(make([3], 'line', { bundles: [bundle('a', ['G1-1']), bundle('b', ['G1-1'])] }), /overlapping/i);
invalid(make([3], 'line', { bundles: [bundle('a', ['G1-1']), bundle('a', ['G1-2'])] }), /duplicate bundle ID/i);
invalid(make([3], 'line', { bundles: [bundle('a', ['G1-1', 'G1-1'])] }), /repeated within/i);
invalid(make([3], 'line', { bundles: [bundle('a', [])] }), /at least one/i);
invalid(make([3], 'line', { bundles: [bundle('', ['G1-1'])] }), /ID/i);
invalid(make([3], 'line', { fixed: [fixed('G1-1', 1), fixed('G1-2', 1)] }), /different individuals.*same position/i);
invalid(make([3], 'line', { fixed: [fixed('G1-1', 1), fixed('G1-1', 2)] }), /same individual.*different positions/i);
for (const position of [0, 4, -1, 1.1, NaN, Infinity]) invalid(make([3], 'line', { fixed: [fixed('G1-1', position)] }), /Positions.*integers/i);
for (const [min, max] of [[-1, 1], [0, 4], [2, 1], [1.2, 2], [0, Infinity], [NaN, 2]]) {
  invalid(make([3], 'select', { selectCount: 2, quotas: [quota('G1', min, max)] }), /Quota bounds/i);
}
invalid(make([3], 'select', { selectCount: 2, quotas: [quota('G1', 0, 3), quota('G1', 1, 2)] }), /duplicate quotas/i);
invalid(make([3], 'select', { selectCount: 2, quotas: [quota('G1', 1, 2), quota('G1', 0, 3)] }), /duplicate quotas/i);

// Inputs are read-only even during example reconstruction or normalization.
function deepFreeze(value) {
  if (value && typeof value === 'object') { Object.freeze(value); for (const part of Object.values(value)) deepFreeze(part); }
  return value;
}
const frozen = deepFreeze({ ...cross, fixed: [fixed('G2-2', 2), fixed('G2-2', 2)] });
const snapshot = JSON.stringify(frozen);
brute(frozen);
same(JSON.stringify(frozen), snapshot, 'Engine does not mutate caller inputs');
const dpResult = calculateMulti({ ...cross, fixed: [fixed('G2-2', 2)] });
check(dpResult.steps.some(step => step.latex.includes('D(A') && step.latex.includes('w_j')), 'Pinned-block explanation shows actual subset recurrence');
check(dpResult.steps.some(step => step.latex.includes('f_j!') && step.latex.includes('outside pin')), 'Transition formula includes outside-position exclusion');
check(manyResult.steps.some(step => step.latex.includes('\\sum') && step.latex.includes('\\binom')), 'Selection formula shows sum of products');
check(calculateMulti(make([16], 'circle', { bundles: [bundle('all', identities(make([16])))] })).steps.at(-1).latex.includes('(16-1)!'), 'All-bundle circle uses the special displayed formula');
const fixedEnds = make([2, 2], 'line', { fixed: [fixed('G1-2', 1), fixed('G2-1', 4)] });
const fixedEndsResult = brute(fixedEnds);
same(fixedEndsResult.steps.at(-1).latex, 'N=(4-2)!=2!=2', 'Simple fixed positions use a precise factorial formula');
same(fixedEndsResult.example, ['G1-2', 'G1-1', 'G2-2', 'G2-1'], 'Pinned witness fills remaining slots with free identities');
const singletonResult = brute({ ...fixedEnds, bundles: identities(fixedEnds).map((id, i) => bundle(`singleton-${i}`, [id])) });
same(singletonResult.steps.at(-1).latex, fixedEndsResult.steps.at(-1).latex, 'Singleton bundles do not require DP');
console.log(`PASS: ${assertions} assertions; ${bruteCases} brute-force problems; ${permutationVisits} permutation representatives and ${subsetVisits} identity subsets visited. Exact BigInt counts, all quota profiles, legal examples, disjoint cross-category bundles, pinned-position DP, circular wrap/rotation semantics, and bilingual validation verified.`);
