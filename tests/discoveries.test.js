import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTIFACTS} from '../src/artifact-catalog.js';
import {restoreHiddenArtifacts,collectArtifact,restoreArtifacts,ARTIFACT_RESET_MS} from '../src/artifact-state.js';
import {FloorWorld} from '../src/lift-state.js';
import {restoreConstruction} from '../src/construction-state.js';
import {constructionMethods} from '../src/construction-scene.js';
import {readSettings,writeSettings} from '../src/storage.js';
test('approved catalog has two unique named artifacts per floor, without invented effects',()=>{
 assert.equal(ARTIFACTS.length,200);assert.equal(new Set(ARTIFACTS.map(a=>a.id)).size,200);for(let f=1;f<=100;f++)assert.equal(ARTIFACTS.filter(a=>a.floor===f).length,2);
 assert.deepEqual(ARTIFACTS.slice(0,2).map(a=>a.name),['Последняя искра','Шёпот убежища']);assert.ok(ARTIFACTS.every(a=>!a.effect));
});
test('all playable floors hide two artifacts in distinct solid blocks and preserve discoveries on reload',()=>{
 for(let f=1;f<=4;f++){const world=new FloorWorld({materialSeed:12345},f),hidden=world.hiddenArtifacts;assert.equal(hidden.items.length,2);assert.notEqual(hidden.items[0].cell,hidden.items[1].cell);for(const item of hidden.items)assert.ok(world.blocked(item.cell%50,Math.floor(item.cell/50)));
 const collection={};const item=hidden.items[0];assert.equal(collectArtifact(hidden,collection,item.cell).id,item.id);assert.equal(collectArtifact(hidden,collection,item.cell),null);const restored=new FloorWorld(JSON.parse(JSON.stringify(world.snapshot())),f);assert.deepEqual(restored.hiddenArtifacts,hidden);assert.deepEqual(restoreArtifacts(collection),collection);}
});
test('daily artifact refresh waits for a floor entry and duplicate copies accumulate',()=>{
 const world=new FloorWorld({materialSeed:12345},1),collection={},first=restoreHiddenArtifacts(null,world,100000);const artifact=first.items[0];collectArtifact(first,collection,artifact.cell);
 assert.deepEqual(restoreHiddenArtifacts(first,world,100001),first);const second=restoreHiddenArtifacts(first,world,100000+ARTIFACT_RESET_MS);assert.ok(second.items.every(i=>!i.found));collectArtifact(second,collection,second.items[0].cell);assert.equal(collection[artifact.id],2);
});
test('starter warehouse arrives free, clears its footprint and awards only once',()=>{
 const s={floorNumber:0,constructionQuest:restoreConstruction({rescued:true,unlocked:true}),world:{cleared:new Set(),damage:new Map()},buildingLayout:{},questRewards:[],credits:0,cargoHold:{earth:90,stone:40},renderConstruction(){}};
 assert.equal(constructionMethods.grantStarterWarehouse.call(s),true);assert.equal(s.constructionQuest.warehouse,true);assert.equal(s.constructionQuest.remaining,null);assert.deepEqual(s.cargoHold,{earth:90,stone:40});assert.equal(s.world.cleared.size,9);assert.equal(s.credits,150);assert.equal(constructionMethods.grantStarterWarehouse.call(s),false);assert.equal(s.credits,150);
});
test('starter warehouse avoids relocated buildings and cannot arrive before master returns',()=>{
 const s={floorNumber:0,constructionQuest:restoreConstruction(),world:{cleared:new Set(),damage:new Map()},buildingLayout:{},questRewards:[],credits:0,renderConstruction(){}};assert.equal(constructionMethods.grantStarterWarehouse.call(s),false);
 s.constructionQuest=restoreConstruction({rescued:true,unlocked:true});s.buildingLayout.workshop={dx:-8,dy:-14};assert.equal(constructionMethods.grantStarterWarehouse.call(s),true);assert.notEqual(s.constructionQuest.plot,0);
});
test('radio setting defaults to HUD and persists across reloads',()=>{
 const data={};globalThis.localStorage={getItem:k=>data[k],setItem:(k,v)=>data[k]=v};assert.equal(readSettings().radioInInventory,false);assert.ok(writeSettings({...readSettings(),radioInInventory:true}));assert.equal(readSettings().radioInInventory,true);
});

test('fully excavated old floors receive two hidden blocks without resetting other terrain',()=>{
 const world=new FloorWorld({materialSeed:12345,cleared:Array.from({length:2500},(_,i)=>i)},1);assert.equal(world.hiddenArtifacts.items.length,2);for(const item of world.hiddenArtifacts.items)assert.ok(world.blocked(item.cell%50,Math.floor(item.cell/50)));assert.equal(world.cleared.size,2498);
});
