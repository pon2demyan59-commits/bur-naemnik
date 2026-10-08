import test from 'node:test';
import assert from 'node:assert/strict';
import { FloorWorld } from '../src/lift-state.js';
import { CELL } from '../src/base-state.js';
import { DEMYAN_GUARDS, DEMYAN_ENTRANCE, demyanWall, restoreDemyan, canEvacuateDemyan } from '../src/demyan-state.js';
import { restoreSpider, stepSpider, findPath } from '../src/combat-state.js';
import { spiderHardSolids } from '../src/tunnel-path.js';
const point=(x,y)=>({x:(x+.5)*CELL,y:(y+.5)*CELL});
test('reinforced rescue enclosure has only three drillable west gates, even after a legacy clear',()=>{
 const world=new FloorWorld({},5),solid=(x,y)=>!world.inside(x,y)||world.blocked(x,y),inside=point(35,31),outside=point(31,30);
 assert.deepEqual(findPath(outside,inside,solid),[]);let gates=0;
 for(let y=27;y<=34;y++)for(let x=32;x<=38;x++)if(x===32||x===38||y===27||y===34){
  if(demyanWall(x,y)){world.cleared.add(y*50+x);assert.equal(world.drill(x,y,100000),false);assert.equal(world.blocked(x,y),true);assert.equal(spiderHardSolids(world,solid)(x,y),true);}
  else{gates++;assert.equal(DEMYAN_ENTRANCE.some(p=>p.x===x&&p.y===y),true);assert.equal(world.drill(x,y,100),true);}
 }
 assert.equal(gates,3);assert.ok(findPath(outside,inside,solid).length);
 const restored=new FloorWorld(world.snapshot(),5);assert.equal(restored.blocked(38,30),true);assert.equal(restored.blocked(32,30),false);
});
test('ten finite spiders patrol outside the enclosure; evacuation requires every kill',()=>{
 const world=new FloorWorld({},5),solid=(x,y)=>!world.inside(x,y)||world.blocked(x,y),rig=point(25,7),spiders=DEMYAN_GUARDS.map((p,id)=>restoreSpider(null,p,id));
 assert.equal(spiders.length,10);
 for(const s of spiders){const start={x:s.x,y:s.y};for(let i=0;i<40;i++)stepSpider(s,rig,50,solid,{world,finite:true,patrol:DEMYAN_GUARDS});assert.ok(Math.hypot(s.x-start.x,s.y-start.y)>20);assert.equal(world.blocked(Math.floor(s.x/CELL),Math.floor(s.y/CELL)),false);}
 DEMYAN_ENTRANCE.forEach(p=>world.drill(p.x,p.y,100));const q=restoreDemyan({contact:true});spiders.forEach((s,i)=>s.hp=i===9?3:0);assert.equal(canEvacuateDemyan(q,world,spiders),false);spiders[9].hp=0;assert.equal(canEvacuateDemyan(q,world,spiders),true);
 for(let i=0;i<400;i++)stepSpider(spiders[0],rig,50,solid,{world,finite:true,patrol:DEMYAN_GUARDS});assert.equal(spiders[0].hp,0);
});
