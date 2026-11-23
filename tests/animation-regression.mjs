import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import ts from 'typescript';
const cache = new Map();
function moduleURL(file) {
  file = resolve(file);
  if (cache.has(file)) return cache.get(file);
  let js = ts.transpileModule(readFileSync(file, 'utf8'), {compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText;
  js = js.replace(/from ['"](\.[^'"]+)['"]/g, (_, name) => `from '${moduleURL(resolve(dirname(file), /\.ts$/.test(name) ? name : name + '.ts'))}'`);
  const url = `data:text/javascript;base64,${Buffer.from(js).toString('base64')}`;
  cache.set(file, url); return url;
}
const { factorial, evalTermListExact, flexibleProbability } = await import(moduleURL('src/lib/mathEngine.ts'));
const { generateDSEQuestions, generateDSEVariant } = await import(moduleURL('src/lib/dseQuestions.ts'));
const { buildDSEAnimation } = await import(moduleURL('src/lib/dseAnimation.ts'));
const { buildPCAnimation, findCategoryExample } = await import(moduleURL('src/lib/pcAnimation.ts'));
const { buildProbabilityAnimation, probabilityPresetTerms } = await import(moduleURL('src/lib/probabilityAnimation.ts'));
let checks = 0;
const same = (a,b,label) => {assert.deepEqual(a,b,label);checks++;};
function validate(model) {
  const ids = new Set(model.items.map(item => item.id));
  same(ids.size, model.items.length, 'Unique original identities');
  for (const step of model.steps) {
    same(/[\t\f\r\n]/.test(step.latex), false, 'No damaged LaTeX escape characters');
    for (const row of step.rows) for (const id of row.ids) {assert(!id || ids.has(id), `Known identity: ${id}`);checks++;}
  }
}
const source = readFileSync('src/pages/PCPage.tsx','utf8');
const segment = source.slice(source.indexOf('// ── Types'),source.indexOf('// ── Emoji Stage Component'));
const pure = ts.transpileModule(segment,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText;
const calculate = new Function('factorial',`${pure}; return calculate;`)(factorial);
const scenario = {nameZh:'影畢業相',nameEn:'Graduation Photo',typeAZh:'老師',typeAEn:'Teacher',typeBZh:'學生',typeBEn:'Student',emojiA:'👨‍🏫',emojiB:'🧑‍🎓'};
const constraintNames = ['adjacent','non_adjacent','fixed_ends','fixed_head','fixed_tail'];
for(let a=0;a<=4;a++)for(let b=0;b<=4;b++){
  if(!a&&!b)continue;
  for(let mask=0;mask<32;mask++){
    const names=constraintNames.filter((_,i)=>mask&(1<<i));
    if(names.includes('adjacent')&&names.includes('non_adjacent'))continue;
    const constraints=names.map(type=>({type}));
    const result=calculate('P',a,b,3,constraints,false,scenario);
    const pattern=findCategoryExample(a,b,constraints);
    if(result.error) continue;
    same(Boolean(pattern), result.answer>0, 'Valid layout exists iff count positive');
    const model=buildPCAnimation({scenarioKey:'school',scenario,countA:a,countB:b,action:'P',selectCount:3,constraints,circular:false,result});
    same(model.items.length,a+b); validate(model);
    if(pattern){
      same(pattern.filter(x=>x==='A').length,a);same(pattern.filter(x=>x==='B').length,b);
      const positions=pattern.flatMap((x,i)=>x==='A'?[i]:[]);
      if(names.includes('adjacent')&&a>1)same(positions.at(-1)-positions[0],a-1);
      if(names.includes('non_adjacent'))same(positions.every((x,i)=>!i||x-positions[i-1]>1),true);
      if(names.includes('fixed_head')||names.includes('fixed_ends'))same(pattern[0],'A');
      if(names.includes('fixed_tail')||names.includes('fixed_ends'))same(pattern.at(-1),'A');
    }
    same(model.steps.at(-1).latex,`N=${result.answer}`);
  }
}
for(const constraints of [[],[{type:'exactly',value:2}],[{type:'at_least',value:1},{type:'at_most',value:2}]]){
  const result=calculate('C',5,4,3,constraints,false,scenario);
  const model=buildPCAnimation({scenarioKey:'school',scenario,countA:5,countB:4,action:'C',selectCount:3,constraints,circular:false,result});
  validate(model);same(model.items.length,9);
  for(const step of model.steps)for(const row of step.rows.filter(row=>row.style==='team')){
    same(row.ids.length,3);
    const a=row.ids.filter(id=>id.startsWith('A')).length;
    if(constraints[0]?.type==='exactly')same(a,2);
    if(constraints.length===2)assert(a>=1&&a<=2);
  }
}
for(let round=0;round<20;round++)for(const question of generateDSEQuestions()){
  const model=buildDSEAnimation(question);validate(model);
  same(model.question,question.problem);same(model.steps.map(step=>step.latex),question.steps.map(step=>step.formula));
  same(model.key.includes(question.variantKey),true);
  same(buildDSEAnimation(generateDSEVariant(question)).key===model.key,false);
  if(question.id==='restaurant-selection'){
    const p=question.parameters;same(model.items.length,p.mains+p.drinks);
    const selected=model.steps.at(-1).rows.find(row=>row.style==='team');same(selected.ids.length,p.r);
    same(selected.ids.filter(id=>id.startsWith('main-')).length,p.k);
  }
}
for(const preset of ['choose','order','mixed']){
  const model=buildProbabilityAnimation('school',scenario,preset);validate(model);same(model.items.length,10);
  const terms=probabilityPresetTerms(preset);
  const actual=flexibleProbability(terms.numerator,terms.denominator);
  same(actual.exactFraction,preset==='order'?{num:'1',den:'12'}:{num:'5',den:'12'});
  same(model.steps.at(-1).latex.includes(evalTermListExact(terms.denominator).toString()),true);
  same(buildProbabilityAnimation('family',{...scenario,nameZh:'家庭',nameEn:'Family',typeAZh:'成人',typeAEn:'Adult'},preset).key===model.key,false);
}
console.log(`PASS: ${checks} animation assertions — exact current parameters, identity references, legal combined conditions, original DSE variants and consistent probability models.`);
