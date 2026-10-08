import test from 'node:test';import assert from 'node:assert/strict';
import {COLLECTIONS} from '../src/collection-catalog.js';
import {collectionProgress,prepareCollectionClose,collectionBuffTotals,restoreClosedCollections,collectionCargoCapacity} from '../src/collection-state.js';
import {collectionMethods} from '../src/collection-page.js';
import {quoteCargo,takeCargoSale,restoreCargo,addCargo} from '../src/cargo-state.js';
import {restorePorodnikJob} from '../src/porodnik-state.js';
import {transferWarehouse,restoreConstruction} from '../src/construction-state.js';
import {driveStep} from '../src/drive-controller.js';
globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');
test('1000 distinct approved recipes retain sizes, grades and supported bonuses',()=>{
 assert.equal(COLLECTIONS.length,1000);const keys=COLLECTIONS.map(c=>[...c.artifacts].sort().join(','));assert.equal(new Set(keys).size,1000);
 for(let t=1;t<=10;t++){const rows=COLLECTIONS.filter(c=>c.tier===t);assert.equal(rows.length,100);for(let n=1;n<=5;n++)assert.equal(rows.filter(c=>c.artifacts.length===n).length,20);}assert.ok(COLLECTIONS.every(c=>['drill','weapon','speed','defense','cargo','sale'].includes(c.effect)));
});
test('two of three grant zero and consume nothing; full close consumes exactly once',()=>{
 const c=COLLECTIONS.find(c=>c.artifacts.length===3),artifacts=Object.fromEntries(c.artifacts.slice(0,2).map(id=>[id,1]));assert.equal(collectionProgress(c,artifacts).ready,false);assert.equal(prepareCollectionClose(c.id,artifacts,[]),null);assert.equal(Object.keys(artifacts).length,2);assert.ok(Object.values(collectionBuffTotals([])).every(n=>n===0));
 artifacts[c.artifacts[2]]=2;const next=prepareCollectionClose(c.id,artifacts,[]);assert.equal(next.artifacts[c.artifacts[2]],1);assert.ok(!next.artifacts[c.artifacts[0]]);assert.equal(collectionBuffTotals(next.closedCollections)[c.effect],c.buff);assert.equal(prepareCollectionClose(c.id,artifacts,next.closedCollections),null);
});
test('same copies close either two simple collections or one pair, never both',()=>{
 const pair=COLLECTIONS.find(c=>c.artifacts.length===2),singles=pair.artifacts.map(id=>COLLECTIONS.find(c=>c.artifacts.length===1&&c.artifacts[0]===id));let state={artifacts:Object.fromEntries(pair.artifacts.map(id=>[id,1])),closedCollections:[]};state=prepareCollectionClose(singles[0].id,state.artifacts,state.closedCollections);state=prepareCollectionClose(singles[1].id,state.artifacts,state.closedCollections);assert.equal(prepareCollectionClose(pair.id,state.artifacts,state.closedCollections),null);
 for(const id of pair.artifacts)state.artifacts[id]=1;assert.ok(prepareCollectionClose(pair.id,state.artifacts,state.closedCollections));
});
test('failed saving leaves originals untouched; saved closure survives scene reload and death snapshot',()=>{
 const c=COLLECTIONS[0],s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{artifacts:{[c.artifacts[0]]:1}}}});s.rig={x:1408,y:1696,angle:0};s.refreshHUD=()=>{};globalThis.localStorage={setItem(){throw Error('blocked');}};assert.equal(s.closeCollection(c.id),false);assert.equal(s.artifacts[c.artifacts[0]],1);assert.deepEqual(s.closedCollections,[]);
 let saved;globalThis.localStorage={setItem:(k,v)=>saved=JSON.parse(v)};assert.equal(s.closeCollection(c.id),true);assert.equal(s.artifacts[c.artifacts[0]],undefined);const reload=new Base();reload.sys=s.sys;reload.init({save:saved});assert.equal(reload.collectionBuffs.drill,c.buff);assert.deepEqual(reload.closedCollections,[c.id]);assert.equal(reload.closeCollection(c.id),false);
});
test('capacity applies to pickup, warehouse withdrawal and cargo restoration',()=>{
 const closed=COLLECTIONS.filter(c=>c.effect==='cargo').map(c=>c.id),capacity=collectionCargoCapacity(closed);assert.ok(capacity>200);const hold=restoreCargo({earth:capacity},0,capacity);assert.equal(hold.earth,capacity);assert.equal(addCargo(hold,'earth',capacity),false);delete hold.earth;
 const q=restoreConstruction({rescued:true,unlocked:true,warehouse:true,stock:{earth:1000}});assert.equal(transferWarehouse(q,hold,'earth',1000,false,capacity),capacity);assert.equal(restoreCargo(hold,0,capacity).earth,capacity);
 const s=new Base();s.sys={settings:{key:'Floor'}};s.init({save:{progress:{floor:1,closedCollections:closed,cargoHold:{earth:capacity}}}});assert.equal(s.cargo,capacity);
});
test('boosted sale preserves promised payout across reload and stays exactly ten seconds',()=>{
 const closed=COLLECTIONS.filter(c=>c.effect==='sale').map(c=>c.id),bonus=collectionBuffTotals(closed).sale,hold={earth:250};const job=takeCargoSale(hold,{earth:250},bonus);assert.equal(job.payout,Math.round(500*(1+bonus)));assert.equal(job.remaining,3000);assert.equal(restorePorodnikJob(job,300,bonus).payout,job.payout);assert.equal(quoteCargo({earth:1},{earth:1}).payout,2);
});
test('movement bonus changes speed without crossing collisions; closed IDs are sanitized',()=>{
 const solid=()=>false,state={x:800,y:800,angle:0,speed:0};let normal=state,boosted=state;for(let i=0;i<80;i++){normal=driveStep(normal,'right',.05,solid);boosted=driveStep(boosted,'right',.05,solid,350);}assert.ok(boosted.x>normal.x);assert.deepEqual(restoreClosedCollections([1,1,1000,-1,1001,'2']),[1,1000]);const totals=collectionBuffTotals(COLLECTIONS.map(c=>c.id));assert.ok(totals.defense<1);
});
test('actual drilling uses the collection bonus alongside workshop upgrades',()=>{
 const s=new Base();s.collectionBuffs=collectionBuffTotals(COLLECTIONS.map(c=>c.id));s.floorNumber=1;s.workshopQuest={upgrades:2};s.speed=0;s.lastSave=0;s.driveSolids=()=>()=>false;s.rig={x:23.5*64,y:26.5*64,angle:0,setPosition(x,y){this.x=x;this.y=y;return this;},setAngle(a){this.angle=a;return this;}};let power=0;s.world={x:23,y:26,heard:true,inside:()=>true,blocked:()=>true,damage:new Map(),drill:(x,y,n)=>{power=n;return false;}};s.terrain={paintCell(){}};s.drillBar={clear(){},fillStyle(){},fillRoundedRect(){}};s.advanceVehicle(0,.01,'right');assert.ok(Math.abs(power-.01*(Math.pow(1.05,2)+s.collectionBuffs.drill))<1e-12);
});
test('actual spider combat applies defense and cannon damage bonuses',async()=>{
 const {combatMethods}=await import('../src/combat-scene.js'),{restoreSpider}=await import('../src/combat-state.js');globalThis.document={querySelector:()=>null};const buffs=collectionBuffTotals(COLLECTIONS.map(c=>c.id));let shot;
 const s={collectionBuffs:buffs,floorNumber:3,combatTime:0,weaponCooldown:0,hull:20,repairQuest:{wave:'done'},armoryQuest:{installed:true,weaponLevel:2},rig:{x:500,y:500,rotation:0},spiders:[restoreSpider({x:500,y:500,bite:0},{x:7,y:7},0)],driveSolids:()=>()=>false,lift:{contains:()=>false},time:{now:0,delayedCall(){}},lastSave:0,fireAt:(from,target,damage)=>shot=damage,renderCombat(){},persist(){},emergencyReturn(){throw Error('unexpected death');}};
 combatMethods.updateCombat.call(s,50);assert.ok(Math.abs(shot-(1.04+buffs.weapon))<1e-12);assert.ok(Math.abs(s.hull-(20-(1-buffs.defense)))<1e-12);
});
