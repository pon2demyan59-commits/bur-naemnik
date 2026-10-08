import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreWorkshop, buyEarthHead, workshopDrillPower, buyWorkshopUpgrade } from '../src/workshop-state.js';
test('earth head costs exactly 5000 once, cannot buy without funds or during service, persists installation',()=>{
 const q=restoreWorkshop({ready:true});assert.equal(buyEarthHead(q,4999).bought,false);assert.equal(q.earthHead,false);
 const result=buyEarthHead(q,6000);assert.equal(result.credits,1000);assert.equal(q.serviceRemaining,4000);assert.equal(buyEarthHead(q,6000).bought,false);
 const restored=restoreWorkshop(JSON.parse(JSON.stringify(q)));assert.equal(restored.earthHead,true);assert.equal(restored.serviceRemaining,4000);assert.equal(restoreWorkshop({earthHead:'true'}).earthHead,false);
 assert.equal(buyEarthHead(restoreWorkshop({ready:true,upgrades:1,serviceRemaining:2000}),5000).bought,false);
 assert.equal(buyEarthHead(restoreWorkshop(),5000).bought,false);
});
test('earth attachment destroys soil in about 0.08s while normal upgrades still strengthen other materials',()=>{
 const q=restoreWorkshop({ready:true,earthHead:true,upgrades:10}),plain=restoreWorkshop({ready:true,upgrades:10});
 assert.ok(1/workshopDrillPower(q,'earth')<=.08);for(const material of ['stone','iron','gold'])assert.equal(workshopDrillPower(q,material,.1),workshopDrillPower(plain,material,.1));
 const before=workshopDrillPower(q,'stone');assert.equal(buyWorkshopUpgrade(q,10000).bought,true);assert.ok(workshopDrillPower(q,'stone')>before);assert.equal(q.earthHead,true);
});
