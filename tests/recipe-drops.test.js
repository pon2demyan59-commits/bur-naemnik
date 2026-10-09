import test from 'node:test';
import assert from 'node:assert/strict';
import { RECIPE_DROP_CHANCE, RECIPE_DROP_POOL, awardRecipeDrop, restoreRecipeKnowledge, recipeIsLearned, restoreRecipeAccess } from '../src/recipe-drop-state.js';
import { buyBuildingBlueprint } from '../src/building-blueprints.js';
import { buyWeaponBlueprint } from '../src/armory-state.js';
const state=()=>({learnedRecipes:[],buildingBlueprints:[],armoryQuest:{blueprints:[]}});
const rng=(...values)=>()=>values.shift();
test('removed obstacle and trap recipes are discarded from old saves and never drop',()=>{
 const removed=['defense-11','defense-12','defense-14','defense-15','defense-16','defense-17','defense-20','defense-21','defense-22','defense-25','defense-26','defense-27','defense-29','defense-30'];
 assert.deepEqual(restoreRecipeKnowledge([...removed,'defense-13','defense-24']),['defense-13','defense-24']);
 for(const id of removed)assert.equal(RECIPE_DROP_POOL.some(r=>r.id===id),false);
});
test('recipe chance is exactly two percent per player-broken floor block with no depth or rarity penalty',()=>{
 assert.equal(RECIPE_DROP_CHANCE,.02);for(const floor of [1,5,100]){assert.equal(awardRecipeDrop(state(),floor,rng(.02)),null);assert.ok(awardRecipeDrop(state(),floor,rng(.019999,0)));}
 for(const floor of [0,-1,101,NaN])assert.equal(awardRecipeDrop(state(),floor,()=>{throw Error('Base must not roll');}),null);
 let drops=0;for(let i=0;i<10000;i++)if(awardRecipeDrop(state(),1,rng(i/10000,0)))drops++;assert.equal(drops,200);
});
test('all buildings, defenses, upgrades and nine non-story weapons can drop, uniformly and without duplicates',()=>{
 assert.equal(RECIPE_DROP_POOL.length,51);assert.equal(RECIPE_DROP_POOL.some(r=>r.id==='weapon-basic'),false);
 for(let i=0;i<RECIPE_DROP_POOL.length;i++){const s=state();assert.equal(awardRecipeDrop(s,1,rng(0,(i+.5)/RECIPE_DROP_POOL.length)).id,RECIPE_DROP_POOL[i].id);}
 const s=state();for(let i=0;i<RECIPE_DROP_POOL.length;i++)assert.ok(awardRecipeDrop(s,1,rng(0,0)));assert.equal(new Set(s.learnedRecipes).size,RECIPE_DROP_POOL.length);assert.equal(awardRecipeDrop(s,1,()=>{throw Error('Empty pool must not roll');}),null);
});
test('found blueprints unlock real crafting and building access without charging or bypassing story',()=>{
 const s=state();awardRecipeDrop(s,1,rng(0,0));assert.ok(s.buildingBlueprints.includes('hq'));assert.equal(buyBuildingBlueprint(s.buildingBlueprints,'hq',1000,{unlocked:true},{returned:true}).bought,false);
 const index=RECIPE_DROP_POOL.findIndex(r=>r.id==='weapon-machinegun'),weapon=awardRecipeDrop(state(),1,rng(0,(index+.5)/RECIPE_DROP_POOL.length));const gun=state();gun.learnedRecipes=[weapon.id];restoreRecipeAccess(gun);gun.armoryQuest.ready=true;assert.ok(gun.armoryQuest.blueprints.includes('machinegun'));assert.equal(buyWeaponBlueprint(gun.armoryQuest,'machinegun',1000).bought,false);
});
test('knowledge survives scene saves, reconciles purchased recipes and ignores damaged IDs',async()=>{
 globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');const s=new Base();s.sys={settings:{key:'Floor'}};s.init({save:{progress:{floor:1,learnedRecipes:['hq','defense-40','weapon-plasma','evil','hq'],armoryQuest:{blueprint:true},buildingBlueprints:['housing']}}});s.rig={x:1500,y:800,angle:0};assert.equal(recipeIsLearned(s,'weapon-basic'),true);assert.ok(s.armoryQuest.blueprints.includes('plasma'));assert.ok(s.buildingBlueprints.includes('hq'));
 const save=s.snapshotCampaign();assert.equal(save.learnedRecipes.includes('evil'),false);save.learnedRecipes.push('power');assert.equal(s.learnedRecipes.includes('power'),false);const reload=new Base();reload.sys=s.sys;reload.init({save:{progress:s.snapshotCampaign()}});assert.equal(recipeIsLearned(reload,'defense-40'),true);assert.equal(recipeIsLearned(reload,'housing'),true);
 assert.deepEqual(restoreRecipeKnowledge(null),[]);
});
test('actual drilling awards recipes once on destruction, never on a partial hit or a cleared block',async()=>{
 globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');const s=new Base(),noop=()=>{},blocks=new Set([24]);let hits=0,banners=0;
 s.world={x:23,y:26,heard:true,damage:new Map(),inside:()=>true,blocked:x=>blocks.has(x),material:()=> 'earth',drill(x){if(++hits<2)return false;blocks.delete(x);return true;}};s.rig={x:23.5*64,y:26.5*64,angle:0,setPosition(x,y){this.x=x;this.y=y;return this;},setAngle(a){this.angle=a;return this;}};
 Object.assign(s,state(),{floorNumber:1,speed:0,workshopQuest:{upgrades:0},cargoHold:{},cargo:0,driveSolids:()=>()=>false,findArtifactInBrokenBlock:noop,findBonusCacheInBrokenBlock:noop});s.drillBar={clear:noop,fillStyle:noop,fillRoundedRect:noop};s.terrain={paintCell:noop,refreshAround:noop};s.dustEmitter=s.chipEmitter=s.sparkEmitter={emitParticleAt:noop};s.refreshHUD=s.checkLift=s.checkPorodnik=s.persist=s.showCargoPickup=noop;s.showDiscovery=()=>banners++;
 const old=Math.random;Math.random=()=>0;try{s.advanceVehicle(0,.05,'right');assert.equal(banners,0);s.advanceVehicle(50,.05,'right');s.advanceVehicle(100,.05,'right');assert.equal(banners,1);assert.deepEqual(s.learnedRecipes,['hq']);}finally{Math.random=old;}
});
