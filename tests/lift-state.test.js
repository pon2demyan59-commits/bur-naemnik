import test from 'node:test';
import assert from 'node:assert/strict';
import { BaseWorld } from '../src/base-state.js';
import { LIFT_BLOCKS, liftBlockCount, liftDestinations, liftFrameCell, liftGeometry, LIFT, FLOOR_LIFT, FloorWorld } from '../src/lift-state.js';
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


import { driveFits, driveStep } from '../src/drive-controller.js';
test('pixel lift frame leaves cleared side approaches and front ramp open on both stops',()=>{
 for(const center of [LIFT,FLOOR_LIFT]) {
  const {deck,colliders}=liftGeometry(center),solid=()=>false;solid.rectangles=colliders;
  const mid=deck.x+deck.width/2;
  // The old cell-sized wall rejected this visible floor alongside the housing.
  assert.equal(driveFits((center.x-2.9)*64,(center.y+.5)*64,solid),true);
  // Both sides can move across the clear floor below the lamp feet.
  for(const side of [-1,1]) {
   let state={x:mid+side*230,y:deck.y+deck.height+100,angle:side<0?0:180,speed:0};
   for(let i=0;i<200&&Math.abs(state.x-mid)>10;i++)state=driveStep(state,side<0?'right':'left',1/60,solid);
   assert.ok(Math.abs(state.x-mid)<10);
   for(let i=0;i<250&&state.y>deck.y+deck.height/2+10;i++)state=driveStep(state,'up',1/60,solid);
   assert.ok(state.y<deck.y+deck.height/2+10,'front ramp remains driveable');
  }
  // Actual side rails and the upper machine remain solid.
  const rail=colliders[1];assert.equal(driveFits(rail.x+rail.width/2,rail.y+rail.height/2,solid),false);
  const top=colliders[0];assert.equal(driveFits(mid,top.y+top.height/2,solid),false);
 }
});

test('a saved off-center drill beside the visible lift keeps its position on reload',()=>{
 const floor=new FloorWorld({x:22,y:7,drive:{x:22.1*64,y:7.5*64,angle:90}});
 assert.equal(floor.x,22);assert.equal(floor.y,7);
});
