import test from 'node:test';
import assert from 'node:assert/strict';
import { cargoCount } from '../src/cargo-state.js';
import { LiftView } from '../src/lift-view.js';
import { LIFT } from '../src/lift-state.js';
globalThis.Phaser={Scene:class{}};
const {Base}=await import('../src/base-scene.js');
test('driveable lift ramp stays below the drill while powered housing stays above it',()=>{
 const frames=new Map();
 const texture={has:key=>frames.has(key),add:(key,...rect)=>frames.set(key,rect)};
 const object=()=>({
  depth:0,setOrigin(){return this;},setScale(){return this;},setDepth(value){this.depth=value;return this;},
  setDisplaySize(){return this;},setMask(){return this;},setFillStyle(){return this;},
  fillRect(){return this;},createGeometryMask(){return {destroy(){}};}
 });
 const scene={textures:{get:()=>texture},add:{image:object,rectangle:object,circle:object,graphics:object},make:{graphics:object},events:{once(){}}};
 const lift=new LiftView(scene,LIFT);lift.powered(true);
 assert.ok(lift.ramp.depth<20);assert.ok(lift.parts.every(p=>p.depth>20));
 assert.deepEqual(frames.get('ramp'),[0,418,885,497,218]);
 assert.equal(frames.get('bottomLeft')[1]+frames.get('bottomLeft')[3],418);
 assert.equal(frames.get('ramp')[1]+frames.get('ramp')[3],915);
 lift.powered(false);assert.ok(lift.ramp.depth<20);
});
test('broken block reports its original material only when it fits in cargo; repeated drilling cannot duplicate it',()=>{
 const s=new Base(),blocks=new Set([24,25]),popups=[];
 s.world={x:23,y:26,heard:true,damage:new Map(),inside:()=>true,
  blocked:x=>blocks.has(x),material:x=>blocks.has(x)?x===24?'gold':'iron':'earth',
  drill(x){blocks.delete(x);return true;}
 };
 s.rig={x:23.5*64,y:26.5*64,angle:0,setPosition(x,y){this.x=x;this.y=y;return this;},setAngle(a){this.angle=a;return this;}};
 s.floorNumber=1;s.speed=0;s.workshopQuest={upgrades:0};s.cargoHold={earth:199};s.cargo=199;
 s.driveSolids=()=>()=>false;
 const noop=()=>{};
 s.drillBar={clear:noop,fillStyle:noop,fillRoundedRect:noop};
 s.terrain={paintCell:noop,refreshAround:noop};s.dustEmitter=s.chipEmitter=s.sparkEmitter={emitParticleAt:noop};
 s.refreshHUD=s.checkLift=s.checkPorodnik=s.persist=noop;s.showCargoPickup=(...args)=>popups.push(args);
 s.advanceVehicle(0,.05,'right');assert.equal(s.cargoHold.gold,1);assert.equal(s.cargo,200);
 assert.equal(popups[0][0],'gold');assert.equal(popups[0][3],true);
 s.advanceVehicle(50,.05,'right');assert.equal(popups.length,1);
 s.world.x=24;s.rig.x=24.5*64;
 s.advanceVehicle(100,.05,'right');assert.equal(popups[1][0],'iron');assert.equal(popups[1][3],false);
 assert.equal(s.cargoHold.iron,undefined);assert.equal(cargoCount(s.cargoHold),200);
});


test('diagonal joystick pressure turns to the block face and collects ore through normal drilling',()=>{
 const s=new Base(),blocks=new Set([24]);let pickups=0;
 s.world={x:23,y:26,heard:true,damage:new Map(),inside:()=>true,blocked:x=>blocks.has(x),material:()=> 'stone',drill(x){blocks.delete(x);return true;}};
 s.rig={x:23.5*64,y:26.5*64,angle:45,setPosition(x,y){this.x=x;this.y=y;return this;},setAngle(a){this.angle=a;return this;}};
 s.floorNumber=1;s.speed=0;s.workshopQuest={upgrades:0};s.cargoHold={};s.cargo=0;
 s.driveSolids=()=>x=>blocks.has(x);
 const noop=()=>{};s.drillBar={clear:noop,fillStyle:noop,fillRoundedRect:noop};s.terrain={paintCell:noop,refreshAround:noop};s.dustEmitter=s.chipEmitter=s.sparkEmitter={emitParticleAt:noop};
 s.refreshHUD=s.checkLift=s.checkPorodnik=s.persist=noop;s.showCargoPickup=()=>pickups++;
 for(let i=0;i<10&&!pickups;i++)s.advanceVehicle(i*50,.05,{x:1,y:.7,strength:1});
 assert.equal(pickups,1);assert.equal(s.cargoHold.stone,1);assert.ok(Math.abs(s.rig.angle)<20);
});
