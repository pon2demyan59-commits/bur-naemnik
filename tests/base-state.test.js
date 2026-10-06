import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BaseWorld, RESCUE } from '../src/base-state.js';
test('drilling damage survives a save and remains until the rubble breaks',()=>{
 const first=new BaseWorld();assert.equal(first.drill(24,26,.4),false);
 const restored=new BaseWorld(JSON.parse(JSON.stringify(first.snapshot())));
 assert.equal(restored.drill(24,26,.6),true);assert.equal(restored.blocked(24,26),false);
 assert.equal(new BaseWorld(restored.snapshot()).blocked(24,26),false);
});
test('rescue requires reaching the person and cannot repeat',()=>{
 const world=new BaseWorld();assert.equal(world.canRescue(),false);
 world.x=RESCUE.x-1;world.y=RESCUE.y;assert.equal(world.canRescue(),true);
 world.rescued=true;assert.equal(new BaseWorld(world.snapshot()).canRescue(),false);
});
test('invalid saved positions and damaged records do not break the base',()=>{
 const world=new BaseWorld({x:-1,y:Infinity,cleared:[-1,9999,null],damage:[[1,-1],null,[2,Infinity]]});
 assert.equal(world.x,22);assert.equal(world.y,26);assert.equal(world.cleared.size,0);assert.equal(world.damage.size,0);
});
