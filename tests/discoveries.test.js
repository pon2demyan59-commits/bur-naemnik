import test from 'node:test';
import assert from 'node:assert/strict';
import {ARTIFACTS} from '../src/artifact-catalog.js';
import {restoreArtifacts} from '../src/artifact-state.js';
import {FloorWorld} from '../src/lift-state.js';
import {restoreConstruction} from '../src/construction-state.js';
import {constructionMethods} from '../src/construction-scene.js';
import {readSettings,writeSettings} from '../src/storage.js';
test('approved catalog has two unique named artifacts per floor, without invented effects',()=>{
 assert.equal(ARTIFACTS.length,200);assert.equal(new Set(ARTIFACTS.map(a=>a.id)).size,200);for(let f=1;f<=100;f++)assert.equal(ARTIFACTS.filter(a=>a.floor===f).length,2);
 assert.deepEqual(ARTIFACTS.slice(0,2).map(a=>a.name),['Последняя искра','Шёпот убежища']);assert.ok(ARTIFACTS.every(a=>!a.effect));
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

test('old hidden artifact save does not respawn blocks or lose owned copies',()=>{
 const cleared=Array.from({length:2500},(_,i)=>i),world=new FloorWorld({materialSeed:12345,cleared,hiddenArtifacts:{created:1,items:[{id:'artifact-1-1',cell:101,found:false}]}},1);assert.equal(world.cleared.size,2500);assert.ok(!('hiddenArtifacts' in world.snapshot()));assert.deepEqual(restoreArtifacts({'artifact-1-1':3}),{'artifact-1-1':3});
});
