import test from 'node:test';
import assert from 'node:assert/strict';
import {FloorWorld} from '../src/lift-state.js';
import {BaseWorld} from '../src/base-state.js';
import {depositWeights,depositMaterial} from '../src/deposits.js';
test('seeded deposits survive travel and reload while different floors and new seeds differ',()=>{
 const w=new FloorWorld({materialSeed:12345},1),reloaded=new FloorWorld(JSON.parse(JSON.stringify(w.snapshot())),1);let floorChanges=0,seedChanges=0;
 for(let y=2;y<48;y++)for(let x=2;x<48;x++){assert.equal(w.material(x,y),reloaded.material(x,y));floorChanges+=w.material(x,y)!==depositMaterial(12345,2,x,y);seedChanges+=w.material(x,y)!==depositMaterial(54321,1,x,y);}
 assert.ok(floorChanges>500);assert.ok(seedChanges>500);assert.equal(depositWeights(1).reduce((sum,[,w])=>sum+w,0),100);
});
test('old save migration keeps partially drilled material, fraction of damage and cleared cells',()=>{
 for(const floor of [1,2]){const x=25,y=12,key=y*50+x,damage=.4;const old={cleared:[651],damage:[[key,damage]]};const w=new FloorWorld(old,floor);
 const expected=floor===2&&((x*31+y*17+x*y)%100)<38?'stone':'earth';assert.equal(w.material(x,y),expected);assert.equal(w.damage.get(key),damage);assert.ok(w.cleared.has(651));
 const restored=new FloorWorld(JSON.parse(JSON.stringify(w.snapshot())),floor);assert.equal(restored.material(x,y),expected);assert.equal(restored.drill(x,y,restored.hardness(x,y)*.6),true);assert.equal(restored.blocked(x,y),false);
 }
});
test('random deposits never replace base soil or obstruct the lift and mission item cells',()=>{
 for(const floor of [1,2]){const w=new FloorWorld({materialSeed:77},floor);for(let y=4;y<=11;y++)for(let x=22;x<=28;x++)assert.equal(w.blocked(x,y),false);for(const [x,y] of floor===1?[[18,20],[32,29]]:[[17,27],[36,35]])assert.equal(w.blocked(x,y),false);}
 const base=new BaseWorld();for(let y=2;y<48;y++)for(let x=2;x<48;x++)assert.equal(base.material(x,y),'earth');
});

test('ore probabilities and growth match every row of the uploaded project table',async()=>{
 const {readFileSync}=await import('node:fs');const {ORE_RULES,oreChance}=await import('../src/deposits.js');const {MATERIALS}=await import('../src/materials.js');
 const source=readFileSync(new URL('../docs/canon-miro.txt',import.meta.url),'utf8');
 const rows=source.split('Руды — шансы на 100 этажах и прочность\n')[1].split('Крафт обороны')[0].trim().split('\n').filter(x=>!x.startsWith('Астерион')).map(x=>x.split('\t'));
 assert.equal(rows.length,ORE_RULES.length);
 for(let i=0;i<rows.length;i++){const [name,hardness,start,middle,end,stepFirst,stepLast]=rows[i],rule=ORE_RULES[i];assert.equal(MATERIALS.find(m=>m.id===rule.id).name,name);assert.equal(rule.hardness,Number(hardness));assert.equal(oreChance(rule.id,1),Number(start));assert.equal(oreChance(rule.id,50),Number(middle));assert.equal(oreChance(rule.id,100),Number(end));assert.ok(Math.abs((oreChance(rule.id,2)-Number(start))-Number(stepFirst))<1e-12);assert.ok(Math.abs((oreChance(rule.id,51)-Number(middle))-Number(stepLast))<1e-12);assert.ok(oreChance(rule.id,1)>0);assert.equal(oreChance(rule.id,0),0);}
 for(let floor=1;floor<=100;floor++){const weights=depositWeights(floor);assert.ok(weights.every(([,weight])=>weight>=0));assert.ok(Math.abs(weights.reduce((n,[,w])=>n+w,0)-100)<1e-10);}
});
test('preview generation migrates a partly drilled ore without rerolling its type or losing excavation',async()=>{
 const {legacyDepositMaterial}=await import('../src/deposits.js');const seed=12345,x=10,y=12,key=y*50+x;
 const world=new FloorWorld({materialSeed:seed,damage:[[key,.3]],cleared:[555]},1);assert.equal(world.material(x,y),legacyDepositMaterial(seed,1,x,y));const snapshot=world.snapshot();assert.equal(snapshot.materialGeneration,2);assert.ok(snapshot.cleared.includes(555));const reload=new FloorWorld(snapshot,1);assert.equal(reload.material(x,y),world.material(x,y));assert.equal(reload.damage.get(key),.3);
});
