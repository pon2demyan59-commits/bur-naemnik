import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreGroundCargo, leaveGroundCargo, collectGroundCargo } from '../src/ground-cargo-state.js';
import { cargoCount } from '../src/cargo-state.js';
import { CELL } from '../src/base-state.js';
globalThis.Phaser={Scene:class{}};
const {Base}=await import('../src/base-scene.js');
test('full cargo leaves a real material pile; collection takes only available space and removes no overflow',()=>{
 const piles=[],hold={earth:200};assert.equal(leaveGroundCargo(piles,24,26,'iron'),true);leaveGroundCargo(piles,24,26,'iron');assert.equal(collectGroundCargo(piles[0],hold,200),0);assert.equal(piles[0].count,2);
 hold.earth=199;assert.equal(collectGroundCargo(piles[0],hold,200),1);assert.equal(cargoCount(hold),200);assert.equal(hold.iron,1);assert.equal(piles[0].count,1);
 hold.earth=198;assert.equal(collectGroundCargo(piles[0],hold,200),1);assert.equal(piles[0].count,0);
});
test('piles persist on their own floor across travel and death, separately from lost cargo',()=>{
 const s=new Base();s.sys={settings:{key:'Floor'}};s.init({floor:1,save:{progress:{location:'floor',floor:1,floors:{1:{groundCargo:[{x:25,y:12,material:'gold',count:3}]}},cargoHold:{earth:200}}}});s.rig={x:25.5*CELL,y:7.5*CELL,angle:0};const save=JSON.parse(JSON.stringify(s.snapshotCampaign()));let death;s.scene={start:(key,args)=>death=args.save.progress};s.emergencyReturn();assert.deepEqual(death.floors[1].groundCargo,save.floors[1].groundCargo);assert.equal(death.cargo,0);
 const base=new Base();base.sys={settings:{key:'Base'}};base.init({save:{progress:death}});assert.deepEqual(base.groundCargo,[]);base.rig=s.rig;const reload=new Base();reload.sys=s.sys;reload.init({floor:1,save:{progress:base.snapshotCampaign()}});assert.equal(reload.groundCargo[0].count,3);
});
test('automatic collection is nearby only, respects capacity and saves exactly the remaining pieces',()=>{
 const s=new Base();s.groundCargo=[{x:25,y:12,material:'gold',count:3},{x:30,y:12,material:'iron',count:2}];s.groundCargoIndex=new Map(s.groundCargo.map(p=>[p.y*50+p.x,p]));s.rig={x:25.5*CELL,y:12.5*CELL};s.cargoHold={earth:199};s.cargo=199;let saves=0,awarded=0;s.renderGroundCargo=()=>{};s.refreshHUD=()=>{};s.persist=()=>saves++;s.showCargoPickup=(m,x,y,ok,n)=>awarded+=n;
 s.collectNearbyGroundCargo();assert.equal(saves,1);assert.equal(awarded,1);assert.equal(s.groundCargo[0].count,2);assert.equal(s.groundCargo[1].count,2);s.collectNearbyGroundCargo();assert.equal(saves,1);
});
test('ground restore ignores invalid positions/materials and merges repeated valid piles',()=>{
 assert.deepEqual(restoreGroundCargo([{x:25,y:12,material:'iron',count:2},{x:25,y:12,material:'iron',count:3},{x:25,y:12,material:'gold',count:9},{x:1,y:2,material:'earth',count:1},{x:24,y:12,material:'fake',count:1},{x:24,y:12,material:'earth',count:-1}]),[{x:25,y:12,material:'iron',count:5}]);
});
test('real drilling keeps overflow on the destroyed cell and never creates a pile on partial damage',()=>{
 const s=new Base(),noop=()=>{},blocks=new Set([24]);let hits=0;s.world={x:23,y:26,heard:true,damage:new Map(),inside:()=>true,blocked:x=>blocks.has(x),material:()=> 'iron',drill(x){if(++hits<2)return false;blocks.delete(x);return true;}};s.rig={x:23.5*CELL,y:26.5*CELL,angle:0,setPosition(x,y){this.x=x;this.y=y;return this;},setAngle(a){this.angle=a;return this;}};
 Object.assign(s,{floorNumber:1,speed:0,workshopQuest:{upgrades:0},cargoHold:{earth:200},cargo:200,groundCargo:[],driveSolids:()=>()=>false,findArtifactInBrokenBlock:noop,findRecipeInBrokenBlock:noop,findBonusCacheInBrokenBlock:noop});s.drillBar={clear:noop,fillStyle:noop,fillRoundedRect:noop};s.terrain={paintCell:noop,refreshAround:noop};s.dustEmitter=s.chipEmitter=s.sparkEmitter={emitParticleAt:noop};s.refreshHUD=s.checkLift=s.checkPorodnik=s.persist=s.showCargoPickup=noop;
 s.advanceVehicle(0,.05,'right');assert.deepEqual(s.groundCargo,[]);s.advanceVehicle(50,.05,'right');assert.deepEqual(s.groundCargo,[{x:24,y:26,material:'iron',count:1}]);assert.deepEqual(s.cargoHold,{earth:200});s.advanceVehicle(100,.05,'right');assert.equal(s.groundCargo[0].count,1);
});
