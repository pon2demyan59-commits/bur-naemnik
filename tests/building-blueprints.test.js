import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_BLUEPRINTS, restoreBuildingBlueprints, buyBuildingBlueprint } from '../src/building-blueprints.js';
import { restoreSettlement, beginSettlementProject } from '../src/settlement-state.js';
import { restoreConstruction, upgradeWarehouse } from '../src/construction-state.js';
import { restoreDemyan, beginHeadquarters } from '../src/demyan-state.js';
const construction=()=>restoreConstruction({rescued:true,unlocked:true,warehouse:true});
const demyan=()=>restoreDemyan({rescued:true,returned:true,hq:true,settlementBriefed:true,plot:{x:28,y:23}});
test('architect sells only implemented projects and purchases charge once without spending materials',()=>{
 const c=construction(),d=demyan(),known=[];let credits=2000;
 for(const b of BUILDING_BLUEPRINTS){const before=JSON.stringify([c,d]);assert.equal(buyBuildingBlueprint(known,b.id,b.price-1,c,d).bought,false);const result=buyBuildingBlueprint(known,b.id,credits,c,d);assert.equal(result.bought,true);credits=result.credits;assert.equal(JSON.stringify([c,d]),before);assert.equal(buyBuildingBlueprint(known,b.id,2000,c,d).bought,false);}
 assert.equal(credits,100);assert.deepEqual(restoreBuildingBlueprints(known),known);
});
test('purchasing a blueprint cannot bypass story access',()=>{
 const known=[],c=construction();assert.equal(buyBuildingBlueprint(known,'hq',10000,c,{}).bought,false);assert.equal(buyBuildingBlueprint(known,'housing',10000,c,{hq:true}).bought,false);assert.equal(buyBuildingBlueprint(known,'power',10000,{unlocked:false},demyan()).bought,false);assert.equal(buyBuildingBlueprint(known,'smelter',10000,c,demyan()).bought,false);assert.deepEqual(known,[]);
});
test('construction and upgrades reject missing blueprints without consuming resources',()=>{
 const projects=restoreSettlement({housing:{plot:{x:8,y:15}}}),cargo={earth:200,stone:80,iron:20},stock={},q=restoreDemyan({rescued:true,returned:true,plot:{x:28,y:23}}),c=construction();
 const before=JSON.stringify([projects,cargo,stock,q,c]);assert.equal(beginSettlementProject(projects,'housing',true,cargo,stock),false);assert.equal(beginHeadquarters(q,cargo,stock),false);assert.deepEqual(upgradeWarehouse(c,10000),{bought:false,credits:10000});assert.equal(JSON.stringify([projects,cargo,stock,q,c]),before);
 assert.equal(beginSettlementProject(projects,'housing',true,cargo,stock,['housing']),true);assert.deepEqual(upgradeWarehouse(c,200,['warehouse-upgrade']),{bought:true,credits:0});assert.equal(upgradeWarehouse(c,250,['warehouse-upgrade']).bought,true);
});
test('legacy built and paid projects retain access while unbuilt projects remain for sale',()=>{
 assert.deepEqual(restoreBuildingBlueprints(undefined,{warehouseLevel:2},{remaining:1500},{housing:{built:true},power:{remaining:500}}),['hq','housing','power','warehouse-upgrade']);assert.deepEqual(restoreBuildingBlueprints(undefined,construction(),{},restoreSettlement()),[]);assert.deepEqual(restoreBuildingBlueprints(['evil','housing','housing']),['housing']);
});
test('purchased blueprints survive scene saves and cannot be lost by snapshot mutation',async()=>{
 globalThis.Phaser={Scene:class{}};const {Base}=await import('../src/base-scene.js');const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{buildingBlueprints:['housing','warehouse-upgrade'],constructionQuest:{rescued:true,unlocked:true,warehouse:true},demyanQuest:{rescued:true,returned:true,hq:true,plot:{x:28,y:23}}}}});s.rig={x:1600,y:800,angle:0};const save=s.snapshotCampaign();save.buildingBlueprints.push('power');assert.equal(s.knowsBuildingBlueprint('power'),false);const reload=new Base();reload.sys=s.sys;reload.init({save:{progress:JSON.parse(JSON.stringify(s.snapshotCampaign()))}});assert.equal(reload.knowsBuildingBlueprint('housing'),true);assert.equal(reload.knowsBuildingBlueprint('hq'),true);assert.equal(reload.knowsBuildingBlueprint('warehouse-upgrade'),true);
});
