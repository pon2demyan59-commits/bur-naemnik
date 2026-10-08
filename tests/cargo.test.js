import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreCargo,cargoCount,addCargo,MATERIAL_PRICES,takeCargoSale,quoteCargo } from '../src/cargo-state.js';
import { restorePorodnikJob,stepPorodnikJob } from '../src/porodnik-state.js';
test('typed cargo keeps old cargo, has a shared capacity and rejects unknown resources',()=>{
 assert.deepEqual(restoreCargo(undefined,17),{earth:17});
 const hold=restoreCargo({earth:198,stone:100,iron:4,bogus:3});
 assert.equal(cargoCount(hold),200);assert.equal(hold.stone,2);assert.equal(hold.iron,0);
 assert.equal(addCargo(hold,'gold'),false);assert.equal(addCargo({},'bogus'),false);
 assert.deepEqual(restoreCargo({earth:-1,stone:NaN,gold:1.2}),{});
});
test('selling selected quantities keeps other ore and pays quoted prices only after processing',()=>{
 const hold={earth:10,stone:4,gold:2,iron:3};
 assert.equal(MATERIAL_PRICES.earth,2);assert.equal(MATERIAL_PRICES.stone,5);
 const job=takeCargoSale(hold,{earth:6,stone:2,gold:0});
 assert.deepEqual(hold,{earth:4,stone:2,gold:2,iron:3});
 assert.equal(job.amount,8);assert.equal(job.payout,22);
 const restored=restorePorodnikJob(JSON.parse(JSON.stringify(job)));
 assert.equal(stepPorodnikJob(restored,2999),0);assert.equal(stepPorodnikJob(restored,1),22);
 assert.deepEqual(quoteCargo(hold,{gold:Infinity,stone:-1}),{sale:{},amount:0,payout:0});
 assert.equal(takeCargoSale(hold,{}),null);
});
test('saved sale quantity is validated, and legacy pending cycles retain their old promised price',()=>{
 assert.equal(restorePorodnikJob({amount:2,sale:{earth:1},remaining:1000}),null);
 assert.equal(stepPorodnikJob(restorePorodnikJob({amount:4,remaining:100}),100),4);
});
