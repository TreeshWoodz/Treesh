import fs from 'fs';
const W = await import('/app/tools/words_test.mjs');
W.configureWords({ fetcher: async (u, o) => u.startsWith('http') ? fetch(u, o) : { ok: true, json: async () => JSON.parse(fs.readFileSync('/app/frontend/public/data/chainz-bank.json')) } });
const t0 = Date.now(); const B = await W.loadBank('bank'); console.log('bank loaded', Date.now()-t0, 'ms; prompts', B.prompts.length, 'orig', B.orig.length, 'compPrompts', B.compPrompts.length);
const cases = [
 ['assoc','fire','truck',true],['assoc','fire','alarm',true],['assoc','fire','water',true],['assoc','ocean','wave',true],['assoc','play','ground',true],
 ['assoc','fire','banana',false],['assoc','fire','fires',false],['assoc','music','guitar',true],['assoc','coffee','mug',true],['assoc','dog','leash',true],
 ['letter','apple','egg',true],['letter','apple','zebra',false],['letter','apple','eqxzv',false],
 ['compound','fire','place',true],['compound','snow','ball',true],['compound','ball','foot',true],['compound','fire','banana',false],['compound','rain','bow',true],
];
let pass=0;
for (const [m,p,a,exp] of cases){ const r = await W.validate(m,p,a,{used:new Set(),minLen:2}); const ok = r.ok===exp; pass+=ok; console.log(ok?'PASS':'FAIL', m, p, '->', a, JSON.stringify(r)); }
// offline check
W.configureWords({useOnline:false});
const off = await W.validate('assoc','fire','truck',{used:new Set()}); console.log('offline fire->truck', off.ok ? 'PASS':'FAIL', off.source); pass+=off.ok;
W.configureWords({useOnline:true});
// chain simulation
const rnd=Math.random; const up=new Set(), uw=new Set(); let p=W.startWord('assoc',rnd); const seq=[p];
for(let i=0;i<12;i++){ const ans=W.answersFor('assoc',p,uw); if(!ans.length){console.log('NO ANSWERS for',p);break;} const a=ans[0]; uw.add(a); up.add(p); p=W.nextPrompt('assoc',a,up,uw,rnd); seq.push(a+'=>'+p); }
console.log('chain:', seq.join(' | '));
let cp=W.startWord('compound',rnd); console.log('compound start', cp, W.answersFor('compound',cp).slice(0,8));
console.log('decoys', W.decoys('assoc','fire',2,rnd));
console.log(`RESULT ${pass}/${cases.length+1}`);
