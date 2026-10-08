import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WEAPON_CATALOG, WEAPON_COMPONENTS, weaponStats, weaponFullCost, weaponPurchaseBudget } from '../src/weapon-catalog.js';
import { restoreArmory, buyWeaponBlueprint, buyWeaponParts, weaponPartsPrice, craftWeapon, equipCraftedWeapon, buyWeaponUpgrade } from '../src/armory-state.js';
const ready=()=>restoreArmory({ready:true,gifted:true,blueprint:true,installed:true,weaponLevel:4});
test('complete weapon purchase budgets follow ten then five-step drill milestones',()=>{
 const q=ready();assert.equal(q.weapons.basic,1);
 for(let i=1;i<WEAPON_CATALOG.length;i++){const w=WEAPON_CATALOG[i],n=10+5*(i-1),budget=50*n*(n+1);assert.equal(weaponPurchaseBudget(i),budget);assert.equal(w.blueprintPrice,budget*.2);assert.ok(Math.abs(weaponFullCost(w)-budget)<=70);if(i>1)assert.ok(weaponFullCost(w)>weaponFullCost(WEAPON_CATALOG[i-1]));}
});
test('all ten drill weapon recipes match the agreed canon exactly',()=>{
 const rows=readFileSync(new URL('../docs/canon-miro.txt',import.meta.url),'utf8').split('\n').filter(l=>l.includes('\tОружие для бура\t')).map(l=>l.split('\t'));
 assert.equal(WEAPON_CATALOG.length,10);
 WEAPON_CATALOG.forEach((w,i)=>{assert.equal(w.name,rows[i][0]);assert.equal(Object.entries(w.recipe).map(([id,n])=>WEAPON_COMPONENTS.find(p=>p.id===id).name+' ×'+n).join(' + '),rows[i][2]);});
});
test('legacy saves preserve the gifted cannon and its upgrades without adding extra gifts',()=>{
 let q=ready();assert.equal(q.weapons.basic,1);assert.equal(q.equippedWeapon,'basic');assert.equal(q.weaponLevel,4);assert.deepEqual(q.blueprints,['basic']);
 for(let i=0;i<3;i++)q=restoreArmory(JSON.parse(JSON.stringify(q)));assert.equal(q.weapons.basic,1);assert.equal(q.weaponLevels.basic,4);
 const invalid=restoreArmory({ready:true,installed:true,weapons:{constructor:1,basic:-2},equippedWeapon:'constructor',blueprints:'machinegun',weaponLevels:{plasma:Infinity},components:{part01:-2,part02:1.5,evil:20}});assert.equal(invalid.installed,false);assert.equal(invalid.equippedWeapon,'basic');assert.deepEqual(invalid.components,{});assert.deepEqual(invalid.blueprints,[]);
});
test('blueprints are purchased once and insufficient credits change nothing',()=>{
 const q=ready(),before=JSON.stringify(q);assert.equal(buyWeaponBlueprint(q,'machinegun',1099).bought,false);assert.equal(JSON.stringify(q),before);assert.deepEqual(buyWeaponBlueprint(q,'machinegun',2000),{bought:true,credits:900});assert.equal(buyWeaponBlueprint(q,'machinegun',1000).bought,false);assert.equal(buyWeaponParts(q,'plasma',1e6).bought,false);assert.equal(buyWeaponBlueprint(q,'basic',1e6).bought,false);
});
test('crafting atomically spends the canonical recipe and grants one saved item per service',()=>{
 const q=ready();buyWeaponBlueprint(q,'machinegun',2000);q.components.part04=2;const price=weaponPartsPrice(q,'machinegun'),before=JSON.stringify(q);
 assert.equal(craftWeapon(q,'machinegun'),false);assert.equal(buyWeaponParts(q,'machinegun',price-1).bought,false);assert.equal(JSON.stringify(q),before);
 assert.deepEqual(buyWeaponParts(q,'machinegun',price),{bought:true,credits:0});assert.equal(craftWeapon(q,'machinegun'),true);assert.equal(q.weapons.machinegun,1);assert.equal(q.serviceRemaining,4000);assert.deepEqual(q.components,{});assert.equal(craftWeapon(q,'machinegun'),false);assert.equal(equipCraftedWeapon(q,'machinegun'),false);
 const reload=restoreArmory(JSON.parse(JSON.stringify(q)));assert.equal(reload.weapons.machinegun,1);assert.equal(reload.serviceRemaining,4000);reload.serviceRemaining=null;assert.equal(equipCraftedWeapon(reload,'machinegun'),true);assert.equal(reload.equippedWeapon,'machinegun');assert.equal(reload.weaponLevel,0);
});
test('switching weapons preserves independent upgrades and affects actual combat parameters',()=>{
 const q=ready();q.weapons.heavy=1;assert.equal(equipCraftedWeapon(q,'heavy'),true);q.serviceRemaining=null;assert.equal(buyWeaponUpgrade(q,100).bought,true);q.serviceRemaining=null;assert.equal(weaponStats(q,.1).damage,3.5*1.12);assert.equal(weaponStats(q).interval,2200);assert.equal(weaponStats(q).range,192);
 assert.equal(equipCraftedWeapon(q,'basic'),true);assert.equal(q.weaponLevel,4);q.serviceRemaining=null;assert.equal(equipCraftedWeapon(q,'heavy'),true);assert.equal(q.weaponLevel,1);const reload=restoreArmory(q);assert.equal(reload.weaponLevel,1);assert.equal(reload.weaponLevels.basic,4);
});
test('every catalog recipe can be fabricated through the supplier without bypassing its blueprint',()=>{
 for(const w of WEAPON_CATALOG){const q=ready();if(w.id!=='basic')assert.equal(buyWeaponBlueprint(q,w.id,1e6).bought,true);assert.equal(buyWeaponParts(q,w.id,1e6).bought,true);assert.equal(craftWeapon(q,w.id),true);assert.equal(q.weapons[w.id],w.id==='basic'?2:1);q.serviceRemaining=null;if(w.id!=='basic')assert.equal(equipCraftedWeapon(q,w.id),true);assert.equal(restoreArmory(q).weapons[w.id],q.weapons[w.id]);}
});
