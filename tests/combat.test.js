import test from 'node:test';
import assert from 'node:assert/strict';
import { createFloorSpiders,nearestTarget,clearShot,stepSpider,hitSpider,spiderSnapshot,findPath,WEAPON_RANGE } from '../src/combat-state.js';
import { FloorWorld,liftDestinations } from '../src/lift-state.js';
import { BaseWorld } from '../src/base-state.js';
import { restoreRepair,restoreHull,canRestoreRepair,REPAIR_BLOCKS,REPAIR_KIT_SITE,REPAIRMAN_SITE,buyRepair,DRILL_MAX_HP } from '../src/repair-state.js';
import { combatMethods } from '../src/combat-scene.js';
const open=(x,y)=>x<2||x>=48||y<2||y>=48;
test('third floor has exactly five spider rooms and reachable mission objects; ore save is separate',()=>{
 const floor=new FloorWorld({},3);assert.equal(floor.floor,3);
 const enemies=createFloorSpiders();
 assert.equal(enemies.length,5);
 for(const s of enemies)assert.equal(floor.blocked(Math.floor(s.x/64),Math.floor(s.y/64)),false);
 for(const p of [REPAIR_KIT_SITE,REPAIRMAN_SITE])assert.equal(floor.blocked(p.x,p.y),false);
 const reload=new FloorWorld(floor.snapshot(),3);assert.equal(reload.materialSeed,floor.materialSeed);
 const destinations=liftDestinations({base:{rescued:true},highestFloor:2,keycards:[1,2,3]});
 assert.equal(destinations.find(x=>x.floor===3).enabled,true);assert.equal(liftDestinations({highestFloor:2,keycards:[1,2]}).find(x=>x.floor===3).enabled,false);
});
test('cannon respects range, line of sight and nearest live target, and takes three basic hits',()=>{
 const rig={x:500,y:500},spiders=[{x:600,y:500,hp:3},{x:540,y:500,hp:3},{x:530,y:500,hp:0}];
 assert.equal(nearestTarget(rig,spiders,WEAPON_RANGE,open),spiders[1]);
 assert.equal(nearestTarget(rig,[{x:629,y:500,hp:3}],WEAPON_RANGE,open),null);
 const wall=(x,y)=>open(x,y)||(x===8&&y===7);
 assert.equal(clearShot(rig,spiders[0],wall),false);
 const spider=spiders[1];assert.equal(hitSpider(spider,1),false);assert.equal(hitSpider(spider,1),false);assert.equal(hitSpider(spider,1),true);
 assert.equal(hitSpider(spider,1),false);assert.equal(spider.respawn,15000);
});
test('spiders attack at most once a second, cannot bite through walls, and resume a saved respawn',()=>{
 const s=createFloorSpiders()[0],rig={x:s.x+40,y:s.y};
 assert.equal(stepSpider(s,rig,50,open),1);
 for(let i=0;i<19;i++)assert.equal(stepSpider(s,rig,50,open),0);
 assert.equal(stepSpider(s,rig,50,open),1);
 const wall=(x,y)=>open(x,y)||(x===26&&y===12);
 assert.equal(stepSpider({...s,bite:0},{x:26*64+5,y:s.y},50,wall),0);
 hitSpider(s,3);for(let i=0;i<100;i++)stepSpider(s,{x:1000,y:1000},50,open);
 const restored=createFloorSpiders(spiderSnapshot([s]))[0];assert.equal(restored.respawn,10000);
 for(let i=0;i<199;i++)stepSpider(restored,{x:1000,y:1000},50,open);
 assert.equal(restored.hp,0);stepSpider(restored,{x:1000,y:1000},50,open);assert.equal(restored.hp,3);
 const tutorial={...s,hp:0,respawn:1};stepSpider(tutorial,rig,50,open,{tutorial:true});assert.equal(tutorial.hp,0);
});
test('pathfinding goes around rubble and machine rectangles instead of crossing walls',()=>{
 const solid=(x,y)=>open(x,y)||(x===10&&y>=5&&y<12);
 solid.rectangles=[{x:700,y:400,width:100,height:100}];
 const path=findPath({x:9.5*64,y:7.5*64},{x:13.5*64,y:7.5*64},solid);
 assert.ok(path.length>3);for(const p of path)assert.equal(solid(Math.floor(p.x/64),Math.floor(p.y/64)),false);
});
test('repair needs both mission items and all entrance blocks, charges once and persists its service cycle',()=>{
 const world=new BaseWorld(),q=restoreRepair({kit:true,rescued:true,returnBriefed:true});
 assert.equal(canRestoreRepair(q,world),false);
 REPAIR_BLOCKS.forEach(p=>world.drill(p.x,p.y,1));assert.equal(canRestoreRepair(q,world),true);
 q.ready=true;assert.equal(buyRepair(q,10,19).bought,false);
 assert.deepEqual(buyRepair(q,10,20),{bought:true,hp:DRILL_MAX_HP,credits:0});
 assert.equal(buyRepair(q,10,100).bought,false);
 assert.equal(restoreRepair(JSON.parse(JSON.stringify(q))).serviceRemaining,4000);
 assert.equal(restoreHull(undefined),DRILL_MAX_HP);assert.equal(restoreHull(-3),0);
});
test('tutorial allies finish all twenty spiders without player firing; casualties cannot destroy the drill',()=>{
 globalThis.document={querySelector:()=>null};
 const root=()=>({x:0,y:0,setPosition(x,y){this.x=x;this.y=y;return this;},destroy(){}});
 const scene={
  floorNumber:0,repairQuest:{wave:'active'},hull:2,rig:{x:1000,y:1000},armoryQuest:{installed:false},weaponCooldown:0,
  combatTime:0,spiders:Array.from({length:20},(_,i)=>({id:i,x:900+i%5*40,y:800+Math.floor(i/5)*40,hp:3,bite:0,respawn:15000})),
  allies:Array.from({length:4},(_,i)=>({x:1000+i*10,y:1000,cooldown:0,pathTime:0,path:[],root:root(),gun:{}})),
  combatShots:[],inventory:{fiber:0,heads:0},time:{now:0,delayedCall(){}},lastSave:0,
  lift:{contains:()=>false},driveSolids:()=>open,refreshHUD(){},persist(){},renderCombat(){},
  startStory(kind){this.story=kind;},fireAt:combatMethods.fireAt
 };
 for(let i=0;i<4000&&scene.repairQuest.wave==='active';i++){scene.time.now+=50;combatMethods.updateCombat.call(scene,50);}
 assert.equal(scene.repairQuest.wave,'done');assert.equal(scene.spiders.filter(s=>s.hp===0).length,20);
 assert.equal(scene.inventory.fiber,20);assert.equal(scene.story,'waveComplete');assert.ok(scene.hull>=1);
});
test('third-floor rescue, typed unsold cargo, wounds and killed spiders survive campaign reload and evacuation',async()=>{
 globalThis.Phaser={Scene:class{}};
 const { Base }=await import('../src/base-scene.js');
 const scene=new Base();scene.sys={settings:{key:'Floor'}};
 scene.init({save:{progress:{floor:3,location:'floor',base:{rescued:true},highestFloor:2,keycards:[1,2],cargoHold:{earth:4,gold:2},hull:13,repairQuest:{briefed:true,rescued:true,kit:true}}}});
 scene.rig={x:25.5*64,y:7.5*64,angle:0};
 scene.spiders=createFloorSpiders();hitSpider(scene.spiders[2],3);scene.combatReady=true;scene.weaponCooldown=600;
 const snapshot=scene.snapshotCampaign();
 const reloaded=new Base();reloaded.sys={settings:{key:'Floor'}};reloaded.init({save:{progress:JSON.parse(JSON.stringify(snapshot))}});
 assert.equal(reloaded.floorNumber,3);assert.equal(reloaded.hull,13);assert.deepEqual(reloaded.cargoHold,{earth:4,gold:2});
 assert.equal(reloaded.repairQuest.rescued,true);assert.ok(snapshot.keycards.includes(3));
 assert.equal(createFloorSpiders(snapshot.combat.floor3)[2].hp,0);
 scene.inventory={fiber:7,heads:1};scene.carriedLoot={fiber:3,heads:0};
 scene.scene={start(key,data){scene.destination={key,data};}};
 scene.emergencyReturn();const p=scene.destination.data.save.progress;
 assert.equal(scene.destination.key,'Base');assert.equal(p.location,'base');assert.equal(p.hull,DRILL_MAX_HP);
 assert.equal(p.cargo,0);assert.deepEqual(p.cargoHold,{});assert.deepEqual(p.carriedLoot,{fiber:0,heads:0});
 assert.equal(p.inventory.fiber,7);assert.equal(p.repairQuest.kit,true);assert.equal(p.combat.floor3[2].hp,0);
});
