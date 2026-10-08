import test from 'node:test';
import assert from 'node:assert/strict';
import { MATERIALS } from '../src/materials.js';
import { DRILL_HEADS, restoreWorkshop, buyDrillHead, workshopDrillPower, buyWorkshopUpgrade, workshopPrice } from '../src/workshop-state.js';
test('every mined material has a permanent head; prices jump tenfold after stone and keep growing',()=>{
 assert.deepEqual(DRILL_HEADS.map(h=>h.id),MATERIALS.map(m=>m.id));assert.equal(DRILL_HEADS[0].price,5000);assert.equal(DRILL_HEADS[1].price,15000);assert.ok(DRILL_HEADS[2].price>=10*DRILL_HEADS[1].price);
 for(let i=1;i<DRILL_HEADS.length;i++)assert.ok(DRILL_HEADS[i].price>DRILL_HEADS[i-1].price);
 const q=restoreWorkshop({ready:true});let spent=0;for(let i=0;i<20;i++){spent+=workshopPrice(q);assert.equal(buyWorkshopUpgrade(q,100000,true).bought,true);}assert.ok(spent<DRILL_HEADS[2].price);assert.ok(workshopDrillPower(q,'iron')>1);
});
test('heads charge once, keep four-second service and preserve all other material speeds and power upgrades',()=>{
 for(const head of DRILL_HEADS){const q=restoreWorkshop({ready:true,upgrades:20});assert.equal(buyDrillHead(q,head.price-1,head.id).bought,false);const result=buyDrillHead(q,head.price+1,head.id);assert.deepEqual(result,{bought:true,credits:1});assert.equal(q.serviceRemaining,4000);
  const restored=restoreWorkshop(JSON.parse(JSON.stringify(q)));assert.ok(restored.drillHeads.includes(head.id));assert.equal(restored.serviceRemaining,4000);assert.equal(buyDrillHead(restored,head.price,head.id).bought,false);
  assert.equal(workshopDrillPower(restored,head.id,.1),(Math.pow(1.05,20)+.1)*12.5);for(const other of MATERIALS.filter(m=>m.id!==head.id))assert.equal(workshopDrillPower(restored,other.id,.1),Math.pow(1.05,20)+.1);
  restored.serviceRemaining=null;const before=workshopDrillPower(restored,head.id);buyWorkshopUpgrade(restored,100000);assert.ok(workshopDrillPower(restored,head.id)>before);
 }
});
test('old earth-head saves migrate without losing their purchase and invalid heads are discarded',()=>{
 const q=restoreWorkshop({ready:true,earthHead:true,drillHeads:['stone','stone','fake'],serviceRemaining:2000});assert.deepEqual(q.drillHeads,['earth','stone']);assert.equal(q.earthHead,true);assert.equal(q.serviceRemaining,2000);
 assert.equal(buyDrillHead(q,999999,'iron').bought,false);assert.equal(buyDrillHead(restoreWorkshop(),999999,'iron').bought,false);assert.equal(buyDrillHead(restoreWorkshop({ready:true}),999999,'fake').bought,false);
});
