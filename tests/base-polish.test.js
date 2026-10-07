import test from 'node:test';import assert from 'node:assert/strict';
import { buildingGeometry, restoreBuildingLayout, validateBuildingMove } from '../src/building-layout-state.js';
import { restoreConstruction, warehouseBody, warehouseDeck } from '../src/construction-state.js';
import { restoreArmory, buyWeaponUpgrade, installWeapon, onArmoryDeck } from '../src/armory-state.js';
import { stepWorkshopService } from '../src/workshop-state.js';
import { QUEST_REWARDS, restoreRewards, claimQuestReward } from '../src/quest-rewards.js';
import { driveFits } from '../src/drive-controller.js';
globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');
test('every movable building shifts its body and service deck together; original constants stay unchanged',()=>{
 for(const key of ['lift','porodnik','workshop','armory','repair']){const old=buildingGeometry({},key),moved=buildingGeometry({[key]:{dx:3,dy:-2}},key);for(const part of ['body','deck','footprint']){assert.equal(moved[part].x,old[part].x+192);assert.equal(moved[part].y,old[part].y-128);}assert.deepEqual(buildingGeometry({},key),old);}
 const lift=buildingGeometry({lift:{dx:3,dy:2}},'lift');assert.equal(lift.center.x,36);assert.equal(lift.center.y,23);
});
test('placement rejects rubble, machine bays, the drill, walls and fixed story areas',()=>{
 const g=buildingGeometry({workshop:{dx:-18,dy:-13}},'workshop'),clear={blocked:()=>false};assert.equal(validateBuildingMove('workshop',g,clear,[],{x:1000,y:1800}),null);
 assert.match(validateBuildingMove('workshop',g,{blocked:()=>true},[],null),/расчисти/);
 assert.match(validateBuildingMove('workshop',g,clear,[g],null),/площадка/);
 assert.match(validateBuildingMove('workshop',g,clear,[],{x:g.body.x+20,y:g.body.y+20}),/Бур/);
 assert.match(validateBuildingMove('workshop',buildingGeometry({workshop:{dx:-30,dy:0}},'workshop'),clear,[],null),/стене/);
 assert.match(validateBuildingMove('workshop',buildingGeometry({workshop:{dx:-9,dy:-23}},'workshop'),clear,[],null),/вход/);
});
test('layout and warehouse offsets survive reload independently of stock and recipes',()=>{
 const q=restoreConstruction({rescued:true,unlocked:true,warehouse:true,offset:{dx:2,dy:3},stock:{earth:40}});const restored=restoreConstruction(JSON.parse(JSON.stringify(q)));assert.deepEqual(warehouseBody(restored),warehouseBody(q));assert.deepEqual(warehouseDeck(restored),warehouseDeck(q));assert.deepEqual(restored.stock,{earth:40});
 assert.deepEqual(restoreBuildingLayout({armory:{dx:1,dy:2},lift:{dx:Infinity,dy:2},unknown:{dx:1,dy:1}}),{armory:{dx:1,dy:2}});
});
test('moved workshop collides at the new body and leaves its old position free; servicing uses moved deck',()=>{
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{buildingLayout:{workshop:{dx:-18,dy:-13}},base:{rescued:true}}}});s.world.blocked=()=>false;s.world.inside=()=>true;s.lift={colliders:[]};
 const old=buildingGeometry({},'workshop'),m=s.buildingGeom('workshop');assert.equal(driveFits(old.body.x+160,old.body.y+80,s.driveSolids()),true);assert.equal(driveFits(m.body.x+160,m.body.y+80,s.driveSolids()),false);
 s.rig={x:1000,y:1800,angle:0};const deck=s.buildingDeck('armory');assert.equal(onArmoryDeck({x:deck.x+50,y:deck.y+50},deck),true);assert.deepEqual(s.snapshotCampaign().buildingLayout,{workshop:{dx:-18,dy:-13}});
});
test('paid upgrades can be chained through a service session, charge escalating prices and never move the drill',()=>{
 const q=restoreArmory({ready:true,gifted:true});assert.equal(installWeapon(q),true);let credits=1000;for(let i=0;i<3;i++){const r=buyWeaponUpgrade(q,credits,true);assert.equal(r.bought,true);credits=r.credits;}assert.equal(credits,618);assert.equal(q.weaponLevel,3);
 const rig={x:2400,y:2100,angle:0};for(let i=0;i<80;i++){const n=stepWorkshopService(q,rig,.05,()=>false,buildingGeometry({},'armory').deck,true);assert.deepEqual([n.x,n.y,n.angle],[rig.x,rig.y,rig.angle]);}assert.equal(q.serviceRemaining,null);assert.equal(buyWeaponUpgrade(q,0,true).bought,false);
});
test('quest payouts are granted once and remain consumed across reloads',()=>{
 let ids=[],credits=10;let r=claimQuestReward(ids,'builderRescue',credits);assert.equal(r.amount,QUEST_REWARDS.builderRescue);credits=r.credits;ids=restoreRewards({questRewards:JSON.parse(JSON.stringify(ids))});r=claimQuestReward(ids,'builderRescue',credits);assert.equal(r.amount,0);assert.equal(r.credits,credits);
 assert.equal(claimQuestReward(ids,'builderSignal',credits).amount,0);
});
test('old completed quests do not pay retroactively; unfinished saved dialogue still receives its reward',()=>{
 const p={base:{rescued:true,dialogue:'rescue'},workshopQuest:{ready:true},repairQuest:{wave:'done'}};const ids=restoreRewards(p);assert.ok(ids.includes('workshopReady'));assert.ok(ids.includes('waveComplete'));assert.ok(!ids.includes('rescue'));
 assert.equal(claimQuestReward(ids,'workshopReady',10).amount,0);assert.equal(claimQuestReward(ids,'rescue',10).amount,40);
});
test('building edit confirmation is atomic when save storage is unavailable',()=>{
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{base:{rescued:true},workshopQuest:{ready:true}}}});s.layoutEditing=true;s.layoutSelected='workshop';s.layoutCandidate={dx:-18,dy:-13};s.world.blocked=()=>false;s.rig={x:1000,y:1800,angle:0};s.layoutNote={};s.snapshotCampaign=()=>({buildingLayout:{},constructionQuest:{}});let restarted=false;s.scene={restart:()=>restarted=true};globalThis.localStorage={setItem(){throw Error('blocked');}};s.confirmBuildingMove();assert.equal(restarted,false);assert.deepEqual(s.buildingLayout,{});assert.match(s.layoutNote.textContent,/сохранить/);
});
