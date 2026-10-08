import test from 'node:test';
import assert from 'node:assert/strict';
import { BONUS_LOOT_POOL, BONUS_CACHE_CHANCE, rollBonusCache, restoreBonusCaches, collectBonusCache } from '../src/bonus-cache-state.js';
import { bonusCacheMethods } from '../src/bonus-cache-scene.js';
import { cargoCount } from '../src/cargo-state.js';
globalThis.Phaser={Scene:class{}};
const {Base}=await import('../src/base-scene.js');
const randomSequence=(...values)=>()=>values.shift()??.999999;
const state=()=>({floorNumber:1,cargoHold:{},cargoCapacity:()=>200,credits:0,artifacts:{},carriedLoot:{fiber:0,heads:0},inventory:{fiber:0,heads:0}});
test('cache roll is floor-only, has an exact per-block boundary and merges three draws',()=>{
 assert.equal(rollBonusCache(0,25,12,()=>0),null);assert.equal(rollBonusCache(1,25,12,()=>BONUS_CACHE_CHANCE),null);assert.equal(rollBonusCache(1,25,12,()=>NaN),null);
 const box=rollBonusCache(1,25,12,randomSequence(0,0,0,0,0,0,0));assert.deepEqual(box,{x:25,y:12,items:[{kind:'credits',id:'credits',count:60}]});
 assert.equal(rollBonusCache(1,1,12,()=>0),null);
});
test('rare materials and artifact tiers have lower weights and smaller quantities',()=>{
 const common=BONUS_LOOT_POOL.find(a=>a.id==='iron'),rare=BONUS_LOOT_POOL.find(a=>a.id==='xenorite');assert.ok(rare.weight<common.weight);assert.ok(rare.max<common.max);
 const tier1=BONUS_LOOT_POOL.filter(a=>a.kind==='artifact'&&a.rarity===1).reduce((n,a)=>n+a.weight,0),tier10=BONUS_LOOT_POOL.filter(a=>a.kind==='artifact'&&a.rarity===10).reduce((n,a)=>n+a.weight,0);assert.ok(tier10<tier1/1000);assert.equal(BONUS_LOOT_POOL.some(a=>a.id==='asterion'),false);
});
test('full hold retains material overflow while credits, ingredients and artifacts are awarded once',()=>{
 const s=state();s.cargoHold={earth:199};const cache={x:25,y:12,items:[{kind:'material',id:'gold',count:4},{kind:'credits',id:'credits',count:40},{kind:'fiber',id:'fiber',count:2},{kind:'artifact',id:'artifact-1-1',count:1}]};
 const awarded=collectBonusCache(cache,s);assert.equal(s.credits,40);assert.equal(s.artifacts['artifact-1-1'],1);assert.equal(s.carriedLoot.fiber,2);assert.equal(cargoCount(s.cargoHold),200);assert.equal(s.cargoHold.gold,1);assert.deepEqual(cache.items,[{kind:'material',id:'gold',count:3}]);assert.equal(awarded.length,4);
 assert.deepEqual(collectBonusCache(cache,s),[]);assert.equal(s.credits,40);s.cargoHold={};const restored=restoreBonusCaches(JSON.parse(JSON.stringify([cache])))[0];assert.equal(collectBonusCache(restored,s)[0].count,3);assert.deepEqual(restored.items,[]);assert.equal(s.cargoHold.gold,3);
});
test('pending cache survives floor travel and death without regenerating its reward',()=>{
 const s=new Base();s.sys={settings:{key:'Floor'}};s.init({save:{progress:{location:'floor',floor:1,base:{rescued:true},floors:{1:{cleared:[625],bonusCaches:[{x:25,y:12,items:[{id:'gold',kind:'material',count:3}]}]}},cargoHold:{earth:200}}}});s.rig={x:25.5*64,y:7.5*64,angle:0};
 const save=s.snapshotCampaign();assert.equal(save.floors[1].bonusCaches[0].items[0].count,3);let evacuated;s.scene={start:(key,args)=>evacuated=args.save.progress};s.emergencyReturn();assert.equal(evacuated.cargo,0);assert.deepEqual(evacuated.floors[1].bonusCaches,save.floors[1].bonusCaches);
 s.sys.settings.key='Floor';s.init({save:{progress:{...evacuated,location:'floor',floor:1}}});assert.equal(s.bonusCaches[0].items[0].count,3);
});
test('opening a remaining cache only works nearby, and never repeats a fully collected reward',()=>{
 const s={...state(),...bonusCacheMethods,bonusCaches:[{x:25,y:12,items:[{id:'gold',kind:'material',count:3}]}],rig:{x:25.5*64,y:12.5*64},renderBonusCaches(){},refreshHUD(){},persist(){},notify(){},showBonusBoxDiscovery(){this.banners=(this.banners||0)+1;}};
 assert.equal(s.interactBonusCache(),true);assert.equal(s.cargoHold.gold,3);assert.equal(s.banners,1);assert.equal(s.interactBonusCache(),false);assert.equal(s.cargoHold.gold,3);
});
test('restore rejects invalid positions and unknown loot, normalizes kind and merges duplicate IDs',()=>{
 const boxes=restoreBonusCaches([{x:1,y:2,items:[{id:'gold',count:1}]},{x:25,y:12,items:[{id:'gold',kind:'credits',count:2},{id:'gold',count:3},{id:'fake',count:9}]},{x:25,y:12,items:[{id:'gold',count:200}]}]);assert.deepEqual(boxes,[{x:25,y:12,items:[{id:'gold',kind:'material',count:5}]}]);
});
test('real player drilling discovers a bonus once per destroyed block',()=>{
 const s=new Base(),blocks=new Set([24]);s.world={x:23,y:26,heard:true,damage:new Map(),inside:()=>true,blocked:x=>blocks.has(x),material:()=> 'earth',drill(x){blocks.delete(x);return true;}};
 s.rig={x:23.5*64,y:26.5*64,angle:0,setPosition(x,y){this.x=x;this.y=y;return this;},setAngle(a){this.angle=a;return this;}};
 Object.assign(s,state(),{speed:0,workshopQuest:{upgrades:0},bonusCaches:[],cargo:0,driveSolids:()=>()=>false,findArtifactInBrokenBlock:()=>null,findRecipeInBrokenBlock:()=>null});const noop=()=>{};
 s.drillBar={clear:noop,fillStyle:noop,fillRoundedRect:noop};s.terrain={paintCell:noop,refreshAround:noop};s.dustEmitter=s.chipEmitter=s.sparkEmitter={emitParticleAt:noop};s.refreshHUD=s.checkLift=s.checkPorodnik=s.persist=s.showCargoPickup=noop;s.showBonusBoxDiscovery=()=>s.banners=(s.banners||0)+1;
 const old=Math.random;Math.random=()=>0;try{s.advanceVehicle(0,.05,'right');s.advanceVehicle(50,.05,'right');assert.equal(s.credits,60);assert.equal(s.banners,1);assert.equal(s.cargoHold.earth,1);}finally{Math.random=old;}
});
