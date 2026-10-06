import test from 'node:test';
import assert from 'node:assert/strict';
import { BaseWorld } from '../src/base-state.js';
import { LIFT_BLOCKS, liftBlockCount, liftDestinations, liftFrameCell, FloorWorld } from '../src/lift-state.js';
test('three jammed blocks survive partial drilling and reload until all are excavated',()=>{
 let w=new BaseWorld({rescued:true});assert.equal(liftBlockCount(w),3);
 w.drill(32,24,.4);w=new BaseWorld(w.snapshot());assert.equal(liftBlockCount(w),3);
 assert.equal(w.drill(32,24,.6),true);assert.equal(liftBlockCount(w),2);
 LIFT_BLOCKS.slice(1).forEach(p=>w.drill(p.x,p.y,1));
 assert.equal(liftBlockCount(new BaseWorld(w.snapshot())),0);
 assert.equal(liftFrameCell(33,24),false);assert.equal(liftFrameCell(31,21),true);
});
test('selector shows opened floors and exactly one next stop gated by its card',()=>{
 assert.deepEqual(liftDestinations({}),[{floor:0,enabled:true},{floor:1,enabled:false}]);
 assert.deepEqual(liftDestinations({base:{rescued:true}}),[{floor:0,enabled:true},{floor:1,enabled:true}]);
 const stops=liftDestinations({highestFloor:7,keycards:[8]});assert.equal(stops.length,9);assert.ok(stops.every(s=>s.enabled));
 assert.equal(liftDestinations({highestFloor:7}).at(-1).enabled,false);
 assert.equal(liftDestinations({highestFloor:100}).length,101);
});
test('mine excavation and partial damage restore independently of the base and lift frame',()=>{
 const floor=new FloorWorld();assert.equal(floor.blocked(25,12),true);floor.drill(25,12,.5);
 const restored=new FloorWorld(floor.snapshot());assert.equal(restored.drill(25,12,.5),true);
 assert.equal(restored.blocked(25,12),false);assert.equal(new FloorWorld().blocked(25,12),true);
 const invalid=new FloorWorld({x:999,y:-2});assert.equal(invalid.x,25);assert.equal(invalid.y,7);
});
