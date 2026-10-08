import test from 'node:test';
import assert from 'node:assert/strict';
import { DRILL_MATERIAL_ORDER, drillUpgradePower } from '../src/drill-balance.js';
import { MATERIALS } from '../src/materials.js';
import { FloorWorld } from '../src/lift-state.js';
import { BaseWorld } from '../src/base-state.js';
import { restoreWorkshop, workshopPrice, buyWorkshopUpgrade, workshopDrillPower } from '../src/workshop-state.js';
const approvedTotals=[0,5500,21000,46500,82000,127500,183000,248500,324000,409500,505000,610500,726000];
test('all approved tier milestones charge the exact cumulative total and work at ten-level intervals',()=>{
 const q=restoreWorkshop({ready:true});let spent=0;
 for(let tier=0;tier<DRILL_MATERIAL_ORDER.length;tier++){
  const id=DRILL_MATERIAL_ORDER[tier],material=MATERIALS.find(m=>m.id===id),target=tier*10;
  while(q.upgrades<target){const price=workshopPrice(q);const result=buyWorkshopUpgrade(q,price,true);assert.equal(result.bought,true);assert.equal(result.credits,0);spent+=price;}
  assert.equal(spent,approvedTotals[tier]);assert.equal(material.upgradeTarget,target);assert.equal(material.canonicalHardness,workshopDrillPower(q,id));
  if(target)assert.ok(workshopDrillPower({upgrades:target-1},id)<material.canonicalHardness);
 }
 assert.equal(q.upgrades,120);assert.equal(buyWorkshopUpgrade(q,1000000,true).bought,false);
});
test('real floor drilling requires one second at the tier target, but more at the preceding upgrade',()=>{
 for(const id of DRILL_MATERIAL_ORDER){const material=MATERIALS.find(m=>m.id===id),target=material.upgradeTarget,key=12*50+25;
  const world=()=>new FloorWorld({materialSeed:123,materialOverrides:[[key,id]]},1);
  const w=world();assert.equal(w.material(25,12),id);assert.equal(w.hardness(25,12),material.canonicalHardness);
  const power=workshopDrillPower({upgrades:target},id);for(let frame=0;frame<19;frame++)assert.equal(w.drill(25,12,power*.05),false);assert.equal(w.drill(25,12,power*.05),true);
  if(target){const slower=world();assert.equal(slower.drill(25,12,workshopDrillPower({upgrades:target-1},id)),false);}
 }
 const base=new BaseWorld();for(let i=0;i<19;i++)assert.equal(base.drill(24,26,.05),false);assert.equal(base.drill(24,26,.05),true);
});
test('save reload retains paid levels, attachment ownership, service timer and partial block progress',()=>{
 const q=restoreWorkshop({ready:true,upgrades:110,earthHead:true,serviceRemaining:1234});const restored=restoreWorkshop(JSON.parse(JSON.stringify(q)));assert.equal(restored.upgrades,110);assert.equal(restored.serviceRemaining,1234);assert.equal(restored.earthHead,true);assert.equal(workshopPrice(restored),11100);assert.equal(workshopDrillPower(restored,'stone'),drillUpgradePower(110));
 const w=new FloorWorld({materialSeed:123,materialOverrides:[[625,'gold']],damage:[[625,.4]]},1);const reload=new FloorWorld(JSON.parse(JSON.stringify(w.snapshot())),1);assert.equal(reload.damage.get(625),.4);assert.equal(reload.drill(25,12,reload.hardness(25,12)*.6),true);
 assert.equal(restoreWorkshop({upgrades:999}).upgrades,120);
});
