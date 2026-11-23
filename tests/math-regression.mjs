import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import ts from 'typescript';
import { factorial, evalTermExact, flexibleCount, flexibleProbability, bayesTheorem } from '../src/lib/mathEngine.ts';

let checks=0;
const same=(a,b,message)=>{assert.deepEqual(a,b,message);checks++;};
function fact(n){let x=1n;for(let i=2;i<=n;i++)x*=BigInt(i);return x;}
for(let n=0;n<=20;n++)for(let r=0;r<=n;r++){
  same(evalTermExact({type:'factorial',n}),fact(n));
  same(evalTermExact({type:'permutation',n,r}),fact(n)/fact(n-r));
  same(evalTermExact({type:'combination',n,r}),fact(n)/(fact(r)*fact(n-r)));
}
same(flexibleCount([{type:'factorial',n:20}],[]).exactValue,'2432902008176640000');
same(flexibleCount([{type:'combination',n:5,r:3},{type:'factorial',n:3}],[]).exactValue,'60');
same(flexibleCount([{type:'combination',n:3,r:1}],[{type:'factorial',n:2}]).exactValue,'3/2');
same(flexibleProbability([{type:'combination',n:5,r:2},{type:'combination',n:5,r:1}],[{type:'combination',n:10,r:3}]).exactFraction,{num:'5',den:'12'});
same(flexibleProbability([{type:'factorial',n:20}],[{type:'factorial',n:20}]).decimal,'1');
same(flexibleProbability(Array(40).fill({type:'factorial',n:19}),Array(40).fill({type:'factorial',n:20})).decimal,'0');
for(const bad of [{type:'factorial',n:-1},{type:'factorial',n:2.5},{type:'permutation',n:5,r:6},{type:'combination',n:3,r:-1}]){assert.throws(()=>evalTermExact(bad));checks++;}
assert.throws(()=>flexibleProbability([{type:'factorial',n:5}],[{type:'factorial',n:3}]));checks++;
assert.throws(()=>bayesTheorem([1,2],[3,2],[1,2]));checks++;
same(bayesTheorem([1,10],[9,10],[2,10]).pAgivenB,{num:1,den:3});

// Transpile only the pure story counting portion; do not duplicate its implementation.
const pc=readFileSync(new URL('../src/pages/PCPage.tsx',import.meta.url),'utf8');
const segment=pc.slice(pc.indexOf('// ── Types'),pc.indexOf('// ── Emoji Stage Component'));
const pure=ts.transpileModule(segment,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText;
const calculate=new Function('factorial',`${pure}; return calculate;`)(factorial);
const scenario={typeAZh:'成人',typeAEn:'adult',typeBZh:'兒童',typeBEn:'child'};
function permutations(items){if(items.length===0)return [[]];return items.flatMap((item,i)=>permutations(items.filter((_,j)=>i!==j)).map(rest=>[item,...rest]));}
const constraintNames=['adjacent','non_adjacent','fixed_ends','fixed_head','fixed_tail'];
for(let a=0;a<=3;a++)for(let b=0;b<=3;b++){
  if(!a&&!b)continue;
  const arrangements=permutations([...Array.from({length:a},(_,i)=>`A${i}`),...Array.from({length:b},(_,i)=>`B${i}`)]);
  for(let mask=0;mask<32;mask++){
    const types=constraintNames.filter((_,i)=>mask&(1<<i));
    if(types.includes('adjacent')&&types.includes('non_adjacent'))continue;
    const expected=arrangements.filter(row=>{
      const positions=row.map((id,i)=>id.startsWith('A')?i:-1).filter(i=>i>=0);
      return (!types.includes('fixed_ends') || row.length>=2) && (!types.includes('adjacent')||positions.length<2||positions.at(-1)-positions[0]===a-1)
        &&(!types.includes('non_adjacent')||positions.every((p,i)=>i===0||p-positions[i-1]>1))
        &&(!(types.includes('fixed_head')||types.includes('fixed_ends'))||row[0].startsWith('A'))
        &&(!(types.includes('fixed_tail')||types.includes('fixed_ends'))||row.at(-1).startsWith('A'));
    }).length;
    const actual=calculate('P',a,b,3,types.map(type=>({type})),false,scenario);
    same(actual.answer,expected,`Story P A=${a},B=${b},${types}`);
    if(!actual.error)for(const step of actual.steps){assert.ok(step.latex.startsWith('\\displaystyle'));checks++;}
  }
}
for(let a=1;a<=4;a++)for(let b=1;b<=4;b++)for(let r=1;r<=a+b;r++){
  const min=1,max=2;
  const expected=Array.from({length:a+1},(_,k)=>k>=min&&k<=max&&r-k>=0&&r-k<=b?Number(evalTermExact({type:'combination',n:a,r:k})*evalTermExact({type:'combination',n:b,r:r-k})):0).reduce((x,y)=>x+y,0);
  same(calculate('C',a,b,r,[{type:'at_least',value:min},{type:'at_most',value:max}],false,scenario).answer,expected);
}

const dataSource=readFileSync(new URL('../src/lib/dseQuestions.ts',import.meta.url),'utf8');
const dataJS=ts.transpileModule(dataSource,{compilerOptions:{target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext}}).outputText.replace(/from ['"]\.\/mathEngine['"]/,`from '${pathToFileURL(resolve('src/lib/mathEngine.ts')).href}'`);
const {generateDSEQuestions,generateDSEVariant,parseDSEAnswer,checkDSEAnswer}=await import(`data:text/javascript;base64,${Buffer.from(dataJS).toString('base64')}`);
for(const bad of ['3abc','1/0','10%','2+2','1,23','NaN','Infinity','0.4junk'])same(parseDSEAnswer(bad),null);
for(let round=0;round<100;round++)for(const q of generateDSEQuestions()){
  const p=q.parameters;
  let expected;
  if(q.id==='office-roles')expected=Number(fact(p.n)/fact(p.n-p.r));
  else if(q.id==='restaurant-selection')expected=Number(fact(p.mains)/(fact(p.k)*fact(p.mains-p.k))*fact(p.drinks)/(fact(p.r-p.k)*fact(p.drinks-p.r+p.k)));
  else if(q.id==='school-roles')expected=p.teachers*p.students*(p.students-1)*3;
  else expected=Number(fact(p.children+1)*fact(p.adults))/Number(fact(p.adults+p.children));
  if(q.answer.kind==='count'){
    same(q.answer.value,expected);
    same(checkDSEAnswer(q,String(expected)).status,'correct');
    same(checkDSEAnswer(q,String(expected+0.1)).status,'incorrect');
  }else{
    same(q.answer.fraction.num/q.answer.fraction.den,expected);
    same(checkDSEAnswer(q,`${q.answer.fraction.num}/${q.answer.fraction.den}`).status,'correct');
    same(checkDSEAnswer(q,expected.toFixed(4)).status,'correct');
    same(checkDSEAnswer(q,'2').status,'incorrect');
  }
  assert.notEqual(generateDSEVariant(q).variantKey,q.variantKey);checks++;
}
console.log(`PASS: ${checks} assertions — exact expressions, combined constraints, original question variants and strict answer parsing.`);
