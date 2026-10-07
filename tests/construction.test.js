import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreConstruction, beginWarehouse, stepConstruction, transferWarehouse, BUILDER_SITE, BUILDER_ENTRANCE, BUILDER_GUARDS, canRescueBuilder, WAREHOUSE_PLOTS } from '../src/construction-state.js';
import { FloorWorld, ownedKeycards, questKeycard, liftDestinations } from '../src/lift-state.js';
import { BaseWorld } from '../src/base-state.js';
import { restoreSpider, stepSpider } from '../src/combat-state.js';
import { STORY_LINES, storyPresentation } from '../src/story-content.js';
globalThis.Phaser={Scene:class{}};
const {Base}=await import('../src/base-scene.js');
test('fourth-floor card arrives after briefing and permanent floor access survives rescue',()=>{
 assert.ok(!ownedKeycards({repairQuest:{wave:'done'}}).includes(4));
 const p={constructionQuest:{briefed:true},highestFloor:3};assert.equal(questKeycard(p),4);assert.equal(liftDestinations(p).find(e=>e.floor===4).enabled,true);
 p.highestFloor=4;p.constructionQuest.rescued=true;assert.equal(questKeycard(p),null);assert.ok(ownedKeycards(p).includes(4));
});
test('room rescue requires the entrance cleared and all three guards defeated',()=>{
 const world=new FloorWorld({},4),q=restoreConstruction({briefed:true});assert.equal(world.floor,4);assert.equal(world.blocked(BUILDER_SITE.x,BUILDER_SITE.y),false);
 const spiders=BUILDER_GUARDS.map((site,id)=>restoreSpider(null,site,id));assert.equal(canRescueBuilder(q,world,spiders),false);
 for(const p of BUILDER_ENTRANCE)world.drill(p.x,p.y,10);
 assert.equal(canRescueBuilder(q,world,spiders),false);spiders.forEach(s=>s.hp=0);assert.equal(canRescueBuilder(q,world,spiders),true);
 q.rescued=true;assert.equal(canRescueBuilder(q,world,spiders),false);
});
test('room guards never respawn but normal floor spiders still do',()=>{
 const s=restoreSpider({hp:0,respawn:0},BUILDER_GUARDS[0],0);stepSpider(s,{x:0,y:0},50,()=>false,{finite:true});assert.equal(s.hp,0);
 stepSpider(s,{x:0,y:0},50,()=>false);assert.equal(s.hp,3);
});
test('construction rejects locked, obstructed, occupied or underfunded plots without consuming materials',()=>{
 const q=restoreConstruction({rescued:true,unlocked:true}),world=new BaseWorld(),cargo={earth:80,stone:20};
 assert.equal(beginWarehouse(q,world,cargo),false);assert.deepEqual(cargo,{earth:80,stone:20});
 const p=WAREHOUSE_PLOTS[q.plot];for(let y=p.y;y<p.y+3;y++)for(let x=p.x;x<p.x+3;x++)world.cleared.add(y*50+x);
 assert.equal(beginWarehouse(q,world,cargo,{x:(p.x+1)*64,y:(p.y+1)*64}),false);
 cargo.stone=19;assert.equal(beginWarehouse(q,world,cargo),false);assert.deepEqual(cargo,{earth:80,stone:19});
 q.unlocked=false;assert.equal(beginWarehouse(q,world,{earth:80,stone:20}),false);
});
test('paid construction survives reload, completes once, and cannot be bought twice',()=>{
 const q=restoreConstruction({rescued:true,unlocked:true}),cargo={earth:90,stone:20};
 assert.equal(beginWarehouse(q,{blocked:()=>false},cargo),true);assert.deepEqual(cargo,{earth:10});
 for(let i=0;i<100;i++)stepConstruction(q,50);const restored=restoreConstruction(JSON.parse(JSON.stringify(q)));assert.equal(restored.remaining,5000);
 assert.equal(beginWarehouse(restored,{blocked:()=>false},{earth:80,stone:20}),false);
 let completed=0;for(let i=0;i<110;i++)if(stepConstruction(restored,50))completed++;assert.equal(completed,1);assert.equal(restored.warehouse,true);assert.equal(restored.remaining,null);
});
test('warehouse respects both capacities, invalid inputs and saved stock',()=>{
 const q=restoreConstruction({rescued:true,unlocked:true,warehouse:true,stock:{earth:990}}),cargo={stone:20};
 assert.equal(transferWarehouse(q,cargo,'stone',20,true),10);assert.equal(q.stock.stone,10);assert.equal(cargo.stone,10);
 assert.equal(transferWarehouse(q,cargo,'earth',10000,false),190);assert.equal(cargo.earth,190);
 assert.equal(transferWarehouse(q,cargo,'earth',1,false),0);assert.equal(transferWarehouse(q,cargo,'earth',-3,false),0);
 assert.equal(transferWarehouse(q,cargo,'invalid',1,true),0);assert.deepEqual(restoreConstruction(JSON.parse(JSON.stringify(q))).stock,q.stock);
 assert.deepEqual(restoreConstruction().stock,{});
});
test('finished-wave old saves receive briefing; rescued master opens construction only on base',()=>{
 globalThis.document={querySelector:()=>({open:false})};const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{repairQuest:{wave:'done'},base:{rescued:true}}}});
 let kind;s.startStory=k=>kind=k;s.checkConstruction();assert.equal(kind,'builderBrief');
 s.constructionQuest.briefed=true;s.constructionQuest.rescued=true;s.floorNumber=4;kind=null;s.checkConstruction();assert.equal(kind,null);s.floorNumber=0;s.checkConstruction();assert.equal(kind,'builderReturn');
});
test('construction dialogue resumes and builder has a separate identity',()=>{
 const q=restoreConstruction({dialogue:'builderReturn',dialoguePage:2,rescued:true});assert.equal(q.dialoguePage,2);assert.equal(q.dialogue,'builderReturn');assert.equal(q.unlocked,false);
 assert.equal(storyPresentation('builderRescue',0).portrait,'builder-portrait.svg');assert.ok(STORY_LINES.builderBrief.some(l=>l.text.includes('карту четвёртого')));
});
test('death loses carried materials but preserves warehouse stock and construction progress',()=>{
 const s=new Base();s.sys={settings:{key:'Floor'}};s.init({save:{progress:{location:'floor',floor:4,base:{rescued:true},cargoHold:{earth:20},constructionQuest:{briefed:true,rescued:true,unlocked:true,warehouse:true,stock:{stone:40}}}}});
 s.rig={x:25.5*64,y:7.5*64,angle:0};let evacuation;s.scene={start:(name,args)=>{evacuation=args.save.progress;}};s.emergencyReturn();assert.equal(evacuation.cargo,0);assert.deepEqual(evacuation.cargoHold,{});assert.deepEqual(evacuation.constructionQuest.stock,{stone:40});assert.equal(evacuation.constructionQuest.warehouse,true);
});
