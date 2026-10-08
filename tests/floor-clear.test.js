import test from 'node:test';
import assert from 'node:assert/strict';
import { BaseWorld } from '../src/base-state.js';
import { FloorWorld } from '../src/lift-state.js';
import { remainingFloorBlocks, claimFloorClear, floorClearReward, floorCanCollapse, restoreClearedFloors } from '../src/floor-clear-state.js';
const clearAll=world=>{for(let y=2;y<48;y++)for(let x=2;x<48;x++)if(world.blocked(x,y)&&Number.isFinite(world.hardness?.(x,y)??1))world.drill(x,y,1000);};
test('clearance rewards rise from 5000 by 2500 per floor, require the last block and pay once',()=>{
 const s={credits:15,clearedFloors:[]};const base=new BaseWorld();assert.equal(claimFloorClear(s,base,0),0);clearAll(base);assert.equal(remainingFloorBlocks(base),0);assert.equal(claimFloorClear(s,base,0),5000);assert.equal(s.credits,5015);assert.equal(claimFloorClear(s,base,0),0);
 for(let f=1;f<=5;f++){const w=new FloorWorld({},f);const before=remainingFloorBlocks(w);w.drill(3,3,.5);assert.equal(remainingFloorBlocks(w),before);clearAll(w);assert.equal(claimFloorClear(s,w,f),5000+2500*f);}
 assert.deepEqual(s.clearedFloors,[0,1,2,3,4,5]);assert.equal(floorClearReward(100),255000);
});
test('indestructible command post walls do not prevent full floor clearance',()=>{
 const w=new FloorWorld({},5);clearAll(w);assert.equal(w.blocked(32,27),true);assert.equal(w.hardness(32,27),Infinity);assert.equal(remainingFloorBlocks(w),0);const restored=new FloorWorld(JSON.parse(JSON.stringify(w.snapshot())),5);assert.equal(remainingFloorBlocks(restored),0);
});
test('reward flag is saved before the banner, survives reload and permanently disables collapse',async()=>{
 globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');const s=new Base();s.sys={settings:{key:'Floor'}};s.init({floor:1,save:{progress:{location:'floor',floor:1,credits:100}}});clearAll(s.world);s.rig={x:25.5*64,y:7.5*64,angle:0};s.renderFloorClearProgress=()=>{};s.refreshHUD=()=>{};let saved,banners=0;s.persist=()=>saved=JSON.parse(JSON.stringify(s.snapshotCampaign()));s.showDiscovery=()=>{assert.ok(saved.clearedFloors.includes(1));banners++;};s.checkFloorClear();assert.equal(s.credits,7600);assert.equal(banners,1);
 const reload=new Base();reload.sys=s.sys;reload.init({floor:1,save:{progress:saved}});assert.equal(floorCanCollapse(saved,1),false);assert.equal(floorCanCollapse(saved,2),true);assert.equal(claimFloorClear(reload,reload.world,1),0);assert.equal(reload.credits,7600);assert.deepEqual(restoreClearedFloors([1,1,-1,101,'2']),[1]);
});
