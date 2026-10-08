import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreDemyan, SENSOR_SITE, SENSOR_GUARDS, canCollectSensor } from '../src/demyan-state.js';
import { FloorWorld, ownedKeycards, questKeycard, liftDestinations } from '../src/lift-state.js';
import { restoreSpider } from '../src/combat-state.js';
import { claimQuestReward } from '../src/quest-rewards.js';
import { discoveryDetails } from '../src/discovery-banner.js';
globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');
const progress=()=>({base:{rescued:true},highestFloor:5,demyanQuest:{briefed:true,rescued:true,returned:true,hq:true,plot:{x:28,y:23},settlementBriefed:true,settlementDone:true,sensorBriefed:true}});
const scene=(key='Floor',p={...progress(),floor:6})=>{const s=new Base();s.sys={settings:{key}};s.init({save:{progress:p}});s.rig={x:(SENSOR_SITE.x+.5)*64,y:(SENSOR_SITE.y+.5)*64,angle:0};s.notify=s.persist=s.refreshHUD=()=>{};return s;};
test('sixth floor unlocks only after its briefing; reload preserves its map and guards',()=>{
 const p=progress();p.demyanQuest.sensorBriefed=false;assert.ok(!ownedKeycards(p).includes(6));assert.equal(liftDestinations(p).find(e=>e.floor===6).enabled,false);
 p.demyanQuest.sensorBriefed=true;assert.ok(ownedKeycards(p).includes(6));assert.equal(questKeycard(p),6);
 const s=scene('Floor',{...p,floor:6});assert.equal(s.floorNumber,6);assert.equal(s.world.floor,6);
 for(const site of [SENSOR_SITE,...SENSOR_GUARDS])assert.equal(s.world.blocked(site.x,site.y),false);
 s.world.drill(12,22,100);const w=new FloorWorld(s.world.snapshot(),6);assert.equal(w.floor,6);assert.equal(w.blocked(12,22),false);
 const guards=SENSOR_GUARDS.map((site,id)=>restoreSpider({hp:id===0?0:3},site,id));s.spiders=guards;s.combatReady=true;s.weaponCooldown=0;const saved=s.snapshotCampaign();assert.equal(saved.combat.floor6[0].hp,0);assert.equal(saved.floors[6].floor,6);
});
test('recorder needs all six guards defeated, is collected once, survives reload and delivers at moved HQ',()=>{
 const s=scene();s.spiders=SENSOR_GUARDS.map(()=>({hp:0}));s.spiders[0].hp=1;assert.equal(s.demyanAction(),null);s.spiders[0].hp=0;assert.equal(s.demyanAction(),'sensor');
 let found=0;s.showDiscovery=item=>{assert.equal(item.kind,'sensor');found++;};assert.equal(s.interactDemyan(),true);assert.equal(s.interactDemyan(),false);assert.equal(found,1);assert.equal(s.cargo,0);
 const p=s.snapshotCampaign();p.buildingLayout.hq={dx:-10,dy:0};const b=scene('Base',p),deck=b.buildingDeck('hq');b.rig={x:deck.x+deck.width/2,y:deck.y+deck.height/2};let story;b.startStory=k=>story=k;assert.equal(b.interactDemyan(),true);assert.equal(story,'sensorReturn');
 b.finishDemyanStory(story);const ids=[];assert.equal(claimQuestReward(ids,story,0).credits,10000);assert.equal(claimQuestReward(ids,story,10000).amount,0);assert.equal(restoreDemyan(b.demyanQuest).sensorReturned,true);
 assert.match(discoveryDetails({kind:'sensor'}).note,/Не занимает грузовой отсек/);
});
test('actual lift travel saves sixth-floor access and arrives without falling back to floor one',async()=>{
 const s=scene('Base',progress());s.liftReady=()=>true;s.lift={contains:()=>true,depart:async()=>{}};s.dialogClosed=()=>{};let saved,started;
 globalThis.localStorage={setItem:(key,value)=>saved=JSON.parse(value)};s.scene={start:(key,data)=>started={key,data}};
 await s.travelTo(7);assert.equal(started,undefined);
 await s.travelTo(6);assert.equal(started.key,'Floor');assert.equal(saved.progress.floor,6);assert.equal(saved.progress.highestFloor,6);
 const restored=scene('Floor',started.data.save.progress);assert.equal(restored.world.floor,6);assert.ok(ownedKeycards(saved.progress).includes(6));
});
