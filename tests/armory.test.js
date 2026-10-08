import test from 'node:test';
import assert from 'node:assert/strict';
import { BaseWorld, CELL } from '../src/base-state.js';
import { FloorWorld, liftDestinations } from '../src/lift-state.js';
import { restoreWorkshop, stepWorkshopService } from '../src/workshop-state.js';
import { restoreArmory, ARMORY_BODY, ARMORY_DECK, ARMORY_BLOCKS, ARMORER_SITE, BLUEPRINT_SITE, canRestoreArmory, installWeapon, buyWeaponUpgrade } from '../src/armory-state.js';
import { driveFits } from '../src/drive-controller.js';
import { storyPresentation } from '../src/story-content.js';
globalThis.Phaser={Scene:class{}};
const {Base}=await import('../src/base-scene.js');
test('second floor uses harder stone with saved partial damage and separate floor storage',()=>{
 const world=new FloorWorld({},2);assert.equal(world.floor,2);
 let stone,earth;for(let y=12;y<20;y++)for(let x=5;x<20;x++){if(world.material(x,y)==='stone')stone={x,y};else if(world.material(x,y)==='earth')earth={x,y};}
 assert.equal(world.drill(earth.x,earth.y,1),true);assert.equal(world.drill(stone.x,stone.y,1),false);
 const reload=new FloorWorld(world.snapshot(),2);assert.equal(reload.drill(stone.x,stone.y,1.5),true);
 const scene=new Base();scene.floorNumber=2;scene.world=reload;scene.rig={x:1600,y:800,angle:90};scene.campaign={base:{rescued:true},floors:{1:{cleared:[123]}},highestFloor:1};scene.armoryQuest=restoreArmory({briefed:true});scene.workshopQuest=restoreWorkshop({ready:true,upgrades:1});
 const save=scene.snapshotCampaign();assert.deepEqual(save.floors[1].cleared,[123]);assert.equal(save.floors[2].floor,2);assert.ok(save.keycards.includes(2));assert.ok(liftDestinations(save).find(x=>x.floor===2).enabled);
 for(const p of [ARMORER_SITE,BLUEPRINT_SITE])assert.equal(world.blocked(p.x,p.y),false);
});
test('armory quest starts after workshop cycle and requires rescued gunsmith, blueprint and cleared entrance',()=>{
 globalThis.document={querySelector:()=>({open:false})};
 const scene=new Base();scene.floorNumber=0;scene.world=new BaseWorld({rescued:true});scene.workshopQuest=restoreWorkshop({ready:true,upgrades:1,serviceRemaining:1000});scene.armoryQuest=restoreArmory();let story;scene.startStory=k=>story=k;scene.checkArmory();assert.equal(story,undefined);
 scene.workshopQuest.serviceRemaining=null;scene.checkArmory();assert.equal(story,'armoryBrief');
 const q=restoreArmory({briefed:true,rescued:true,blueprint:true,returnBriefed:true});assert.equal(canRestoreArmory(q,scene.world),false);ARMORY_BLOCKS.forEach(p=>scene.world.drill(p.x,p.y,1));assert.equal(canRestoreArmory(q,scene.world),true);
 q.blueprint=false;assert.equal(canRestoreArmory(q,scene.world),false);
 const solid=(x,y)=>scene.world.blocked(x,y);solid.rectangles=[ARMORY_BODY];assert.equal(driveFits(ARMORY_BODY.x+160,ARMORY_BODY.y+80,solid),false);assert.equal(driveFits(ARMORY_DECK.x+96,ARMORY_DECK.y+64,solid),true);
});
test('gunsmith rescue gifts only once, reveals blueprint and persists both across travel',()=>{
 const scene=new Base();scene.floorNumber=2;scene.world=new FloorWorld({},2);scene.workshopQuest=restoreWorkshop({ready:true,upgrades:1});scene.armoryQuest=restoreArmory({briefed:true});scene.campaign={};scene.rig={x:1000,y:1000,angle:90};
 const sprite={setVisible(){}};for(const k of ['armorer','armorerMarker','blueprintArt','blueprintMarker','armorerPassenger'])scene[k]=sprite;scene.refreshHUD=()=>{};scene.persist=()=>{};scene.showDiscovery=()=>{};scene.notify=()=>{};let stories=0;scene.startStory=()=>stories++;
 scene.collectArmoryItem('blueprint');assert.equal(scene.armoryQuest.blueprint,false);scene.collectArmoryItem('armorer');scene.collectArmoryItem('armorer');assert.equal(stories,1);scene.collectArmoryItem('blueprint');
 const q=restoreArmory(JSON.parse(JSON.stringify(scene.snapshotCampaign())).armoryQuest);assert.equal(q.gifted,true);assert.equal(q.rescued,true);assert.equal(q.blueprint,true);assert.equal(storyPresentation('armorer',0).portrait,'armorer-portrait.webp');
});
test('free installation and paid weapon upgrade use four-second saved cycle and the armory exit',()=>{
 let q=restoreArmory({ready:true,gifted:true});assert.equal(installWeapon(q),true);assert.equal(installWeapon(q),false);assert.equal(q.serviceRemaining,4000);assert.equal(buyWeaponUpgrade(q,500).bought,false);
 const rig={x:ARMORY_DECK.x+96,y:ARMORY_DECK.y+64,angle:90};for(let i=0;i<80;i++)stepWorkshopService(q,rig,.05,()=>false,ARMORY_DECK);let next=rig;for(let i=0;i<100&&q.serviceRemaining!=null;i++)next=stepWorkshopService(q,next,.05,()=>false,ARMORY_DECK);assert.equal(next.y,ARMORY_DECK.y+ARMORY_DECK.height+28);
 assert.deepEqual(buyWeaponUpgrade(q,99),{bought:false,credits:99});assert.deepEqual(buyWeaponUpgrade(q,100),{bought:true,credits:0});assert.equal(q.weaponLevel,1);q=restoreArmory(JSON.parse(JSON.stringify(q)));assert.equal(q.serviceRemaining,4000);assert.equal(q.installed,true);assert.equal(q.weaponLevel,1);
});
test('processing earnings are displayed once for the amount actually paid',()=>{
 const scene=new Base();scene.credits=8;scene.porodnikJob={amount:53,remaining:100};scene.refreshHUD=()=>{};scene.persist=()=>{};const receipts=[];scene.showPorodnikEarnings=n=>receipts.push(n);
 scene.updatePorodnikCycle(99);assert.deepEqual(receipts,[]);scene.updatePorodnikCycle(1);scene.updatePorodnikCycle(1000);assert.equal(scene.credits,61);assert.deepEqual(receipts,[53]);
});
