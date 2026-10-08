import test from 'node:test';import assert from 'node:assert/strict';
import { buildingGeometry, restoreBuildingLayout, registerBuildingType, buildingDriveway, buildingPerimeterColliders, validateBuildingMove } from '../src/building-layout-state.js';
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
test('moved service buildings show and activate their button only at the saved new entrance',()=>{
 const action={},dialog={open:false};globalThis.document={querySelector:id=>id==='#rescue-action'?action:dialog};
 const center=d=>({x:d.x+d.width/2,y:d.y+d.height/2});
 for(const [key,quest,method,label] of [['workshop','workshopQuest','openWorkshop','МАСТЕРСКАЯ'],['armory','armoryQuest','openArmory','ОРУЖЕЙНАЯ'],['repair','repairQuest','openRepair','РЕМОНТНЫЙ ЦЕХ'],['porodnik',null,'unloadPorodnik','ПРОДАТЬ ПОРОДУ']]){
  const progress={base:{rescued:true,porodnikPowered:key==='porodnik'},buildingLayout:{[key]:{dx:-12,dy:-10}}};if(quest)progress[quest]={ready:true};
  const first=new Base();first.sys={settings:{key:'Base'}};first.init({save:{progress}});first.rig=center(first.buildingDeck(key));
  const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:JSON.parse(JSON.stringify(first.snapshotCampaign()))}});
  s.cargo=1;s.liftReady=()=>false;
  for(const name of ['repairFloorAction','armoryFloorAction','workshopFloorAction','bonusCacheAction','demyanAction','constructionAction'])s[name]=()=>null;
  for(const name of ['interactBonusCache','interactConstruction','interactDemyan'])s[name]=()=>false;
  let opened=0;s[method]=()=>opened++;
  s.rig=center(buildingGeometry({},key).deck);s.syncAction();assert.equal(action.hidden,true,key+' old button hidden');s.interact();assert.equal(opened,0,key+' old entrance inactive');
  s.rig=center(s.buildingDeck(key));s.syncAction();assert.equal(action.hidden,false,key+' new button visible');assert.equal(action.disabled,false);assert.equal(action.textContent,label);s.interact();assert.equal(opened,1,key+' new entrance active');
 }
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
test('architect and HQ move with their service entrances and survive restoration',()=>{
 const a=buildingGeometry({architect:{dx:-15,dy:-8}},'architect');assert.equal(a.body.x,6*64);assert.equal(a.deck.y,18*64);
 assert.deepEqual(restoreBuildingLayout({architect:{dx:-15,dy:-8},hq:{dx:2,dy:3}}),{architect:{dx:-15,dy:-8},hq:{dx:2,dy:3}});
 const q={hq:true,plot:{x:28,y:23}},old=buildingGeometry({},'hq',{},q),m=buildingGeometry({hq:{dx:-16,dy:14}},'hq',{},q);
 for(const part of ['body','deck','footprint']){assert.equal(m[part].x,old[part].x-16*64);assert.equal(m[part].y,old[part].y+14*64);}assert.deepEqual(q.plot,{x:28,y:23});
});
test('placement allows exactly one clear cell, rejects touching buildings and obstructed passages',()=>{
 const f={x:8*64,y:15*64,width:3*64,height:3*64},g={body:f,deck:f,footprint:f},clear={blocked:()=>false};
 assert.match(validateBuildingMove('warehouse',g,clear,[{footprint:{...f,x:11*64}}],null),/одну клетку/);
 assert.equal(validateBuildingMove('warehouse',g,clear,[{footprint:{...f,x:12*64}}],null),null);
 assert.match(validateBuildingMove('warehouse',g,{blocked:(x,y)=>x===7&&y===16},[],null),/проход/);
});
test('all eight existing structures are movable; unresolved base quests follow moved gates',()=>{
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{constructionQuest:{rescued:true,unlocked:true,warehouse:true},demyanQuest:{briefed:true,contact:true,rescued:true,returned:true,hq:true,plot:{x:28,y:23}},buildingLayout:{workshop:{dx:2,dy:3}}}}});
 assert.deepEqual(new Set(s.movableBuildings()),new Set(['lift','porodnik','workshop','armory','repair','warehouse','architect','hq']));
 s.world.blocked=(x,y)=>x===35&&y===37;assert.equal(s.questWorld('workshop').blocked(33,34),true);assert.equal(s.questWorld('workshop').blocked(35,37),false);
});
test('HQ confirmation persists its plot and preserves warehouse stock and upgrades across reload',()=>{
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{constructionQuest:{rescued:true,unlocked:true,warehouse:true,warehouseLevel:3,stock:{iron:73}},demyanQuest:{briefed:true,contact:true,rescued:true,returned:true,hq:true,plot:{x:28,y:23}},workshopQuest:{ready:true,upgrades:4}}}});
 s.layoutEditing=true;s.layoutSelected='hq';s.layoutCandidate={dx:-16,dy:14};s.world.blocked=()=>false;s.rig={x:1000,y:500,angle:0};s.layoutNote={};let data;
 globalThis.localStorage={setItem(){}};s.scene={restart:value=>data=value};s.confirmBuildingMove();assert.ok(data);assert.deepEqual(data.save.progress.demyanQuest.plot,{x:12,y:37});assert.equal(data.save.progress.constructionQuest.warehouseLevel,3);assert.equal(data.save.progress.constructionQuest.stock.iron,73);assert.equal(data.save.progress.workshopQuest.upgrades,4);
 const restored=new Base();restored.sys={settings:{key:'Base'}};restored.init(data);assert.equal(restored.buildingGeom('hq').footprint.x,12*64);assert.equal(restored.buildingGeom('hq').footprint.y,37*64);
});

test('registered future buildings share movement geometry, save restoration and placement rules',()=>{
 registerBuildingType('futurePower','Электростанция',({offset,CELL})=>{const body={x:(8+offset.dx)*CELL,y:(15+offset.dy)*CELL,width:3*CELL,height:2*CELL},deck={...body,y:body.y+body.height,height:CELL};return {body,deck,footprint:{...body,height:3*CELL}};});
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{buildingLayout:{futurePower:{dx:4,dy:2}}}}});s.rig={x:1000,y:500,angle:0};assert.ok(s.movableBuildings().includes('futurePower'));assert.equal(s.buildingGeom('futurePower').body.x,12*64);assert.deepEqual(s.snapshotCampaign().buildingLayout.futurePower,{dx:4,dy:2});
});

test('concrete perimeters block the drill while every loading lane remains reachable from the south',()=>{
 for(const key of ['lift','porodnik','workshop','armory','repair','warehouse','architect','hq']){
  const g=buildingGeometry({},key,{plot:0},{plot:{x:28,y:23}}),d=buildingDriveway(g),f=g.footprint;
  const solid=()=>false;solid.rectangles=[...buildingPerimeterColliders(g),...(g.colliders||[g.collider||g.body])];
  assert.equal(driveFits(f.x+21,f.y+21,solid),false,key+' closed rear');
  const x=d.x+d.width/2;for(let y=f.y+f.height+32;y>=g.deck.y+g.deck.height/2;y-=8)assert.equal(driveFits(x,y,solid),true,key+' open loading approach '+y);
 }
});
test('the one-cell passage between reserved concrete foundations stays driveable',()=>{
 const g=buildingGeometry({architect:{dx:-13,dy:-8}},'architect'),h=buildingGeometry({architect:{dx:-8,dy:-8}},'architect'),solid=()=>false;
 solid.rectangles=[...buildingPerimeterColliders(g),...buildingPerimeterColliders(h)];
 const x=g.footprint.x+g.footprint.width+32;for(let y=g.footprint.y-32;y<g.footprint.y+g.footprint.height+32;y+=8)assert.equal(driveFits(x,y,solid),true);
});
test('placement cannot cover the drill with the concrete perimeter of HQ',()=>{
 const g=buildingGeometry({},'hq',{}, {plot:{x:12,y:37}});assert.match(validateBuildingMove('hq',g,{blocked:()=>false},[],{x:g.footprint.x+32,y:g.footprint.y+32}),/Бур/);
});
test('a drill saved on a newly reserved concrete edge moves to free floor without losing cargo',()=>{
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{cargoHold:{iron:17},base:{rescued:true},demyanQuest:{briefed:true,contact:true,rescued:true,returned:true,hq:true,plot:{x:28,y:23}}}}});s.world.blocked=()=>false;s.world.inside=()=>true;s.lift={colliders:[]};s.parked={x:28.5*64,y:23.5*64,angle:0};s.world.x=28;s.world.y=23;s.relocateFromFoundation();assert.equal(s.parked,null);assert.ok(driveFits((s.world.x+.5)*64,(s.world.y+.5)*64,s.driveSolids()));assert.equal(s.cargoHold.iron,17);
});
