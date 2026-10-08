import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BaseWorld, CELL } from '../src/base-state.js';
import { PORODNIK_BLOCKS, PORODNIK_DECK, PORODNIK_COLLIDER, porodnikFrameCell, porodnikBlockCount, onPorodnikDeck, restorePorodnikJob, stepPorodnikJob } from '../src/porodnik-state.js';
import { driveFits } from '../src/drive-controller.js';
globalThis.Phaser={Scene:class {}};
const { Base }=await import('../src/base-scene.js');
test('receiver obstruction survives partial clearing and reload; only the machine is solid after clearing',()=>{
  const w=new BaseWorld();assert.equal(porodnikBlockCount(w),5);
  const p=PORODNIK_BLOCKS[0];w.drill(p.x,p.y,.4);
  const restored=new BaseWorld(w.snapshot());assert.equal(restored.drill(p.x,p.y,.6),true);
  for(const block of PORODNIK_BLOCKS.slice(1))restored.drill(block.x,block.y,1);
  assert.equal(porodnikBlockCount(restored),0);
  const solid=(x,y)=>restored.blocked(x,y)||!restored.inside(x,y);solid.rectangles=[PORODNIK_COLLIDER];
  for(let y=PORODNIK_DECK.y+22;y<PORODNIK_DECK.y+PORODNIK_DECK.height;y+=2)assert.equal(driveFits(18.5*CELL,y,solid),true);
  assert.equal(driveFits(18.5*CELL,31.5*CELL,solid),false);
  assert.equal(onPorodnikDeck({x:18.5*CELL,y:PORODNIK_DECK.y+PORODNIK_DECK.height/2}),true);
  assert.equal(onPorodnikDeck({x:18.5*CELL,y:36.5*CELL}),false);
  restored.porodnikPowered=true;assert.equal(new BaseWorld(restored.snapshot()).porodnikPowered,true);
});
test('power waits for Serёga briefing and clearing; unloading runs once inside the deck and keeps shared cargo in saves',()=>{
  const scene=new Base();scene.floorNumber=0;scene.world=new BaseWorld();scene.cargo=15;scene.cargoHold={earth:15};scene.credits=7;
  scene.refreshHUD=()=>{};scene.persist=()=>{};scene.notify=()=>{};scene.dialogClosed=()=>{};scene.openPorodnik=()=>scene.sellCargo({earth:15});
  scene.checkPorodnik();assert.equal(scene.world.porodnikPowered,false);
  for(const p of PORODNIK_BLOCKS)scene.world.drill(p.x,p.y,1);
  scene.checkPorodnik();assert.equal(scene.world.porodnikPowered,false);
  scene.world.porodnikBriefed=true;scene.checkPorodnik();assert.equal(scene.world.porodnikPowered,true);
  scene.rig={x:18.5*CELL,y:36.5*CELL,angle:-90};scene.unloadPorodnik();assert.equal(scene.cargo,15);
  scene.rig.y=PORODNIK_DECK.y+PORODNIK_DECK.height/2;scene.unloadPorodnik();assert.equal(scene.cargo,0);assert.equal(scene.credits,67);
  assert.equal(scene.porodnikJob.amount,15);
  scene.cargo=4;scene.unloadPorodnik();assert.equal(scene.cargo,4);
  scene.updatePorodnikCycle(2999);assert.equal(scene.credits,67);
  scene.updatePorodnikCycle(1);assert.equal(scene.credits,97);assert.equal(scene.porodnikJob,null);
  scene.updatePorodnikCycle(10000);assert.equal(scene.credits,97);scene.cargo=0;
  scene.campaign={};const save=scene.snapshotCampaign();assert.equal(save.cargo,0);assert.equal(save.credits,97);
  assert.equal(save.base.porodnikPowered,true);
  scene.floorNumber=1;scene.world=new BaseWorld();scene.campaign=save;scene.cargo=12;
  const floorSave=scene.snapshotCampaign();assert.equal(floorSave.cargo,12);assert.equal(floorSave.base.porodnikPowered,true);
});

test('all four visible parking edges activate unloading without a hidden margin',()=>{
 const d=PORODNIK_DECK;
 for(const [x,y] of [[d.x,d.y],[d.x+d.width,d.y],[d.x,d.y+d.height],[d.x+d.width,d.y+d.height],[d.x+d.width/2,d.y+d.height/2]])assert.equal(onPorodnikDeck({x,y}),true);
 assert.equal(onPorodnikDeck({x:d.x-1,y:d.y+50}),false);
 assert.equal(onPorodnikDeck({x:d.x+50,y:d.y+d.height+1}),false);
 assert.ok(d.width<=100&&d.height<=120);
});

test('legacy ten-second cycle migrates to three seconds and survives reload and floor travel without losing cargo or paying twice',()=>{
 const scene=new Base();scene.world=new BaseWorld({porodnikPowered:true});scene.floorNumber=0;
 scene.campaign={};scene.cargo=0;scene.credits=10;scene.porodnikJob={amount:25,remaining:10000};
 scene.rig={x:18.5*CELL,y:PORODNIK_DECK.y+50,angle:-90};
 stepPorodnikJob(scene.porodnikJob,1200);
 const save=JSON.parse(JSON.stringify(scene.snapshotCampaign()));assert.equal(save.porodnikJob.remaining,8800);
 const restored=new Base();restored.floorNumber=1;restored.world=new BaseWorld();restored.campaign=save;
 restored.porodnikJob=restorePorodnikJob(save.porodnikJob);restored.cargo=8;restored.credits=save.credits;restored.rig=scene.rig;
 restored.refreshHUD=()=>{};restored.persist=()=>{};restored.notify=()=>{};
 restored.updatePorodnikCycle(2999);assert.equal(restored.credits,10);
 restored.updatePorodnikCycle(1);assert.equal(restored.credits,35);assert.equal(restored.cargo,8);
 restored.updatePorodnikCycle(100);assert.equal(restored.credits,35);
 assert.equal(restored.snapshotCampaign().porodnikJob,null);
 for(const bad of [{amount:-1,remaining:10000},{amount:1,remaining:Infinity},{amount:201,remaining:5},{amount:1,remaining:-1}])assert.equal(restorePorodnikJob(bad),null);
});

