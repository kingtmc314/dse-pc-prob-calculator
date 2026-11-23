import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
const cache = new Map();
function moduleURL(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file);
  let js = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext } }).outputText;
  js = js.replace(/from ['"](\.[^'"]+)['"]/g, (_, name) => `from '${moduleURL(resolve(dirname(file), /\.ts$/.test(name) ? name : name + '.ts'))}'`);
  const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
  cache.set(file, url); return url;
}
const { calculateMulti } = await import(moduleURL('src/lib/multiCounting.ts'));
const { buildMultiAnimation } = await import(moduleURL('src/lib/multiAnimation.ts'));
const { buildMultiItems } = await import(moduleURL('src/lib/multiTypes.ts'));
let checks = 0;
const same = (a, b, label) => { assert.deepEqual(a, b, label); checks++; };
const groups = [2, 3, 1, 1].map((count, i) => ({ id: `g${i + 1}`, count, emoji: ['👨‍🏫', '🧑‍🎓', '🙋', '📷'][i], label: { zh: ['老師', '學生', '嘉賓', '攝影師'][i], en: ['Teacher', 'Student', 'Guest', 'Photographer'][i] } }));
const story = { zh: '影畢業相', en: 'Graduation Photo' };
const base = { groups, mode: 'line', selectCount: 4, bundles: [], fixed: [], quotas: [] };
const cases = [
  base,
  { ...base, bundles: [{ id: 'b1', itemIds: ['g1-1', 'g2-2', 'g3-1'] }, { id: 'b2', itemIds: ['g1-2', 'g2-1'] }], fixed: [{ itemId: 'g4-1', position: 1 }] },
  { ...base, bundles: [{ id: 'b1', itemIds: ['g1-1', 'g2-2'] }], fixed: [{ itemId: 'g1-1', position: 3 }, { itemId: 'g2-2', position: 4 }] },
  { ...base, bundles: [{ id: 'b1', itemIds: ['g1-1', 'g2-2'] }], fixed: [{ itemId: 'g1-1', position: 1 }, { itemId: 'g2-2', position: 7 }] },
  { ...base, mode: 'circle' },
  { ...base, mode: 'circle', bundles: [{ id: 'b1', itemIds: ['g1-1', 'g2-2', 'g3-1'] }, { id: 'b2', itemIds: ['g1-2', 'g2-1'] }] },
  { ...base, mode: 'circle', bundles: [{ id: 'b1', itemIds: buildMultiItems(groups).map(item => item.id) }] },
  { ...base, mode: 'select', quotas: [{ groupId: 'g1', min: 1, max: 1 }, { groupId: 'g2', min: 1, max: 2 }, { groupId: 'g3', min: 1, max: 1 }] },
  { ...base, mode: 'selectArrange', quotas: [{ groupId: 'g1', min: 1, max: 1 }, { groupId: 'g2', min: 1, max: 2 }, { groupId: 'g3', min: 1, max: 1 }] },
  { ...base, mode: 'select', quotas: groups.map(group => ({ groupId: group.id, min: group.count, max: group.count })) },
];
for (const problem of cases) {
  const result = calculateMulti(problem);
  same(result.valid, true, 'Well-formed animation problem');
  const model = buildMultiAnimation(problem, result, story);
  const known = new Set(model.items.map(item => item.id));
  same(known.size, 7, 'All four categories preserve all seven distinct identities');
  same(model.steps.slice(1, -1).map(step => step.latex), result.steps.map(step => step.latex), 'Animation uses engine formulas verbatim');
  same(model.steps.at(-1).latex, `N=${result.count}`, 'Exact final count');
  same(model.steps.at(-1).rows[0].ids, result.example, 'Final picture uses actual legal witness');
  same(model.steps.at(-1).rows[0].style, problem.mode === 'circle' ? 'circle' : problem.mode === 'select' ? 'team' : 'line');
  same(new Set(model.items.map(item => item.colorIndex)).size, 4, 'Each category distinguishable');
  for (const step of model.steps) {
    same(/[\t\f\r\n]/.test(step.latex), false, 'No damaged LaTeX escapes');
    for (const row of step.rows) {
      const present = row.ids.filter(Boolean);
      same(new Set(present).size, present.length, 'No duplicate identity within one row');
      for (const id of present) { assert(known.has(id), `Known identity ${id}`); checks++; }
      for (const bundle of row.bundleGroups ?? []) for (const id of bundle.ids) { assert(known.has(id)); checks++; }
    }
  }
  if (result.count === 0n) same(model.steps.at(-1).rows[0].ids.length, 0, 'No fabricated witness for zero');
  if (problem.mode === 'line' && result.count > 0n) {
    const line = model.steps.at(-1).rows[0];
    for (const fixed of problem.fixed) same(line.ids[fixed.position - 1], fixed.itemId, 'Exact specified identity and place');
    same(line.bundleGroups.length, problem.bundles.length, 'Every independent bundle represented');
  }
  const changed = { ...problem, selectCount: 3 };
  same(buildMultiAnimation(changed, result, story).key === model.key, false, 'Parameter change resets model key');
  same(buildMultiAnimation(problem, result, { zh: '新故事', en: 'New story' }).key === model.key, false, 'Story change resets model');
}
console.log(`PASS: ${checks} multi-category animation assertions — complete identities, multiple bundles, exact pins, circular groups, simultaneous quotas and zero outcomes.`);
