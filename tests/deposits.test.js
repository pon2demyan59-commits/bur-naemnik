import test from 'node:test';
import assert from 'node:assert/strict';
import {FloorWorld} from '../src/lift-state.js';
import {BaseWorld} from '../src/base-state.js';
import {DEPOSIT_WEIGHTS,depositMaterial} from '../src/deposits.js';
test('seeded deposits survive travel and reload while different floors and new seeds differ',()=>{
 const w=new FloorWorld({materialSeed:12345},1),reloaded=new FloorWorld(JSON.parse(JSON.stringify(w.snapshot())),1);let floorChanges=0,seedChanges=0;
 for(let y=2;y<48;y++)for(let x=2;x<48;x++){assert.equal(w.material(x,y),reloaded.material(x,y));floorChanges+=w.material(x,y)!==depositMaterial(12345,2,x,y);seedChanges+=w.material(x,y)!==depositMaterial(54321,1,x,y);}
 assert.ok(floorChanges>500);assert.ok(seedChanges>500);assert.equal(DEPOSIT_WEIGHTS.reduce((sum,[,w])=>sum+w,0),100);
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
