import test from 'node:test';
import assert from 'node:assert/strict';
import { queueRepairBrief,restoreRepair } from '../src/repair-state.js';
import { ARMORY_DECK } from '../src/armory-state.js';
import { liftDestinations } from '../src/lift-state.js';
globalThis.Phaser={Scene:class{}};
const {Base}=await import('../src/base-scene.js');
test('installation queues the next conversation once and preserves it through service and reload',()=>{
 const q=restoreRepair();
 assert.equal(queueRepairBrief(q,{installed:false}),false);
 assert.equal(queueRepairBrief(q,{installed:true}),true);
 q.dialoguePage=2;
 assert.equal(queueRepairBrief(q,{installed:true}),false);
 const restored=restoreRepair(JSON.parse(JSON.stringify(q)));assert.equal(restored.dialogue,'repairBrief');assert.equal(restored.dialoguePage,2);
 restored.dialogue=null;restored.briefed=true;assert.equal(queueRepairBrief(restored,{installed:true}),false);
});
test('an already installed weapon queues the missing base briefing on old saves, but does not grant the card before the conversation',()=>{
 globalThis.document={querySelector:()=>({open:false})};
 const scene=new Base();scene.sys={settings:{key:'Base'}};
 scene.init({save:{progress:{base:{rescued:true,heard:true},highestFloor:1,armoryQuest:{installed:true,gifted:true,ready:true},workshopQuest:{ready:true}}}});
 assert.equal(scene.repairQuest.dialogue,'repairBrief');
 scene.rig={x:1400,y:1700,angle:0};
 assert.equal(scene.snapshotCampaign().keycards.includes(3),false);
 let kind;scene.startStory=k=>kind=k;scene.checkRepair();assert.equal(kind,'repairBrief');
 scene.repairQuest.dialogue=null;scene.repairQuest.briefed=true;
 const save=scene.snapshotCampaign();assert.equal(liftDestinations(save).find(s=>s.floor===3).enabled,true);
});
test('the final armory exit directly launches the pending briefing instead of waiting for the next combat update',()=>{
 globalThis.document={querySelector:()=>({open:false})};
 const s=new Base();s.sys={settings:{key:'Base'}};
 s.init({save:{progress:{base:{rescued:true,heard:true},armoryQuest:{installed:true,gifted:true,ready:true,serviceRemaining:0}}}});
 s.rig={x:ARMORY_DECK.x+96,y:ARMORY_DECK.y+ARMORY_DECK.height+28,angle:90,
 setPosition(x,y){this.x=x;this.y=y;return this;},setAngle(a){this.angle=a;return this;}};
 s.driveSolids=()=>()=>false;s.drillBar={clear(){}};s.dialogClosed=s.refreshMountedWeapon=s.refreshHUD=s.persist=s.animateVehicle=()=>{};
 let kind;s.startStory=k=>kind=k;
 s.updateWorkshopService(1000,.016,s.armoryQuest,ARMORY_DECK);
 assert.equal(s.armoryQuest.serviceRemaining,null);assert.equal(kind,'repairBrief');
});
