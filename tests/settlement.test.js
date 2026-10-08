import test from 'node:test';import assert from 'node:assert/strict';
import { SETTLEMENT_PROJECTS,restoreSettlement,settlementObjectives,beginSettlementProject,stepSettlementProjects,snapshotSettlement } from '../src/settlement-state.js';
import { buildingGeometry,validateBuildingMove } from '../src/building-layout-state.js';
import { restoreDemyan } from '../src/demyan-state.js';
import { demyanMethods } from '../src/demyan-scene.js';
import { STORY_LINES } from '../src/story-content.js';
globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');
test('old HQ receives its new briefing once, and already upgraded storage counts immediately',()=>{
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{constructionQuest:{rescued:true,unlocked:true,warehouse:true,warehouseLevel:3},demyanQuest:{briefed:true,rescued:true,returned:true,hq:true,plot:{x:28,y:23}}}}});globalThis.document={querySelector:()=>({open:false})};let story;s.startStory=k=>story=k;s.checkDemyan();assert.equal(story,'settlementBrief');s.notify=()=>{};s.finishDemyanStory(story);assert.equal(s.settlementUnlocked(),true);assert.equal(s.settlementTasks()[2].done,true);story=null;s.checkDemyan();assert.equal(story,null);assert.ok(STORY_LINES.hqReady.at(-1).text.includes('С чего начать — решай сам'));
});
test('both construction orders work independently and consume combined materials exactly once',()=>{
 for(const order of [['housing','power'],['power','housing']]){const projects=restoreSettlement({housing:{plot:{x:8,y:15}},power:{plot:{x:40,y:38}}}),cargo={earth:200,stone:80,iron:20},stock={stone:120,iron:30,copper:10};for(const key of order){assert.equal(beginSettlementProject(projects,key,false,cargo,stock,['housing','power']),false);assert.equal(beginSettlementProject(projects,key,true,cargo,stock,['housing','power']),true);assert.equal(beginSettlementProject(projects,key,true,cargo,stock,['housing','power']),false);}assert.deepEqual(cargo,{});assert.deepEqual(stock,{});for(let i=0;i<500;i++)stepSettlementProjects(projects,50);assert.ok(settlementObjectives(projects,{warehouseLevel:2}).every(t=>t.done));assert.deepEqual(stepSettlementProjects(projects,50),[]);}
});
test('insufficient materials do not consume anything; timers and completion survive save and floor travel',()=>{
 const projects=restoreSettlement({housing:{plot:{x:8,y:15}}}),cargo={earth:200,stone:80,iron:19},stock={};assert.equal(beginSettlementProject(projects,'housing',true,cargo,stock,['housing']),false);assert.equal(cargo.earth,200);stock.iron=1;assert.equal(beginSettlementProject(projects,'housing',true,cargo,stock,['housing']),true);for(let i=0;i<100;i++)stepSettlementProjects(projects,50);const saved=snapshotSettlement(projects);assert.equal(saved.housing.remaining,15000);saved.housing.plot.x=9;assert.equal(projects.housing.plot.x,8);
 const s=new Base();s.sys={settings:{key:'Floor'}};s.init({save:{progress:{floor:1,base:{rescued:true},baseProjects:projects,demyanQuest:{rescued:true,returned:true,hq:true,settlementBriefed:true,plot:{x:28,y:23}}}}});s.rig={x:25.5*64,y:7.5*64,angle:0};const p=s.snapshotCampaign();assert.equal(p.baseProjects.housing.remaining,15000);assert.equal(p.demyanQuest.settlementBriefed,true);
});
test('new buildings share movable geometry, clearance, concrete foundation collision and saved layouts',()=>{
 const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{baseProjects:{housing:{plot:{x:8,y:15},built:true},power:{plot:{x:40,y:38},built:true}},buildingLayout:{housing:{dx:2,dy:1}}}}});assert.ok(s.movableBuildings().includes('housing'));assert.ok(s.movableBuildings().includes('power'));const g=s.buildingGeom('housing');assert.equal(g.footprint.x,10*64);assert.equal(g.deck.y,20*64);assert.ok(s.buildingFoundationSolids().some(r=>r.x===10*64&&r.y===16*64));assert.match(validateBuildingMove('power',g,{blocked:()=>false},[g],null),/площадка/);
});
test('invalid project saves cannot create built buildings or arbitrary timers outside the base',()=>{
 const q=restoreSettlement({housing:{plot:{x:47,y:47},built:true,remaining:Infinity},power:{plot:{x:2,y:2},remaining:-1}});assert.equal(q.housing.built,false);assert.equal(q.housing.plot,null);assert.equal(q.housing.remaining,null);assert.equal(q.power.remaining,0);assert.equal(restoreDemyan({settlementBriefed:true}).settlementBriefed,false);
});
test('completion dialogue waits for all three objectives and is marked once',()=>{
 const s={floorNumber:0,demyanQuest:{briefed:true,hq:true,settlementBriefed:true,settlementDone:false},constructionQuest:{warehouse:true},settlementTasks:()=>[{done:true},{done:false},{done:true}],startStory:k=>s.story=k,notify(){}};globalThis.document={querySelector:()=>({open:false})};demyanMethods.checkDemyan.call(s);assert.equal(s.story,undefined);s.settlementTasks=()=>[{done:true},{done:true},{done:true}];demyanMethods.checkDemyan.call(s);assert.equal(s.story,'settlementReady');demyanMethods.finishDemyanStory.call(s,s.story);s.story=null;demyanMethods.checkDemyan.call(s);assert.equal(s.story,null);
});
