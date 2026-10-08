import { CELL } from './base-state.js';
import { WORKSHOP_SERVICE_MS } from './workshop-state.js';
import { WEAPON_CATALOG, WEAPON_COMPONENTS } from './weapon-catalog.js';
export const ARMORER_SITE={x:17,y:27};
export const BLUEPRINT_SITE={x:36,y:35};
export const ARMORY_BODY={x:39*CELL,y:29*CELL,width:320,height:192};
export const ARMORY_DECK={x:40*CELL,y:32*CELL,width:192,height:128};
export const ARMORY_BLOCKS=[{x:40,y:33},{x:41,y:33},{x:42,y:33}];
export const ARMORY_STORIES=['armoryBrief','armorer','armoryReturn','armoryReady'];
export function restoreArmory(v={}) {
 if(!v||typeof v!=='object')v={};
 const catalog=restoreWeaponCatalog(v);
 return {...catalog,briefed:v.briefed===true,rescued:v.rescued===true,blueprint:v.blueprint===true,returnBriefed:v.returnBriefed===true,ready:v.ready===true,
 gifted:v.gifted===true,installed:v.installed===true&&(catalog.weapons[catalog.equippedWeapon]||0)>0,
 weaponLevel:catalog.weaponLevels[catalog.equippedWeapon]||0,
 serviceRemaining:v.ready===true&&(v.installed===true||Object.values(catalog.weapons).some(n=>n>0))&&Number.isFinite(v.serviceRemaining)?Math.max(0,Math.min(WORKSHOP_SERVICE_MS,v.serviceRemaining)):null,
 dialogue:ARMORY_STORIES.includes(v.dialogue)?v.dialogue:null,dialoguePage:Number.isInteger(v.dialoguePage)?Math.max(0,Math.min(4,v.dialoguePage)):0};
}
export function armoryBlockCount(world){return ARMORY_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length;}
export function onArmoryDeck(rig,d=ARMORY_DECK){return rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;}
export function canRestoreArmory(q,world){return q.rescued&&q.blueprint&&q.returnBriefed&&armoryBlockCount(world)===0;}
export function weaponUpgradePrice(q){return Math.ceil(100*Math.pow(1.25,q.weaponLevel));}
export function installWeapon(q){if(!q.ready||!q.gifted||q.installed||q.serviceRemaining!=null)return false;q.weapons.basic=Math.max(1,q.weapons.basic||0);q.equippedWeapon='basic';q.weaponLevel=q.weaponLevels.basic||0;q.installed=true;q.serviceRemaining=WORKSHOP_SERVICE_MS;return true;}
export function buyWeaponUpgrade(q,credits,allowDuringService=false){const price=weaponUpgradePrice(q);if(!q.ready||!q.installed||(!allowDuringService&&q.serviceRemaining!=null)||q.weaponLevel>=100||!Number.isFinite(credits)||credits<price)return {bought:false,credits};q.weaponLevel++;q.weaponLevels[q.equippedWeapon||'basic']=q.weaponLevel;q.serviceRemaining=WORKSHOP_SERVICE_MS;return {bought:true,credits:credits-price};}

const weaponNatural=n=>Number.isSafeInteger(n)&&n>0?Math.min(100000,n):0;
export function restoreWeaponCatalog(v){
 const weapons={},weaponLevels={},components={};
 for(const w of WEAPON_CATALOG){const n=weaponNatural(v.weapons?.[w.id]);if(n)weapons[w.id]=n;weaponLevels[w.id]=Math.min(100,weaponNatural(v.weaponLevels?.[w.id]));}
 if(v.gifted===true)weapons.basic=Math.max(1,weapons.basic||0);
 if(!v.weaponLevels)weaponLevels.basic=Math.min(100,weaponNatural(v.weaponLevel));
 for(const p of WEAPON_COMPONENTS){const n=weaponNatural(v.components?.[p.id]);if(n)components[p.id]=n;}
 const blueprints=WEAPON_CATALOG.filter(w=>(Array.isArray(v.blueprints)&&v.blueprints.includes(w.id))||(w.id==='basic'&&v.blueprint===true)).map(w=>w.id);
 const equippedWeapon=WEAPON_CATALOG.some(w=>w.id===v.equippedWeapon&&(weapons[w.id]||0)>0)?v.equippedWeapon:'basic';
 return {weapons,weaponLevels,components,blueprints,equippedWeapon};
}
export function hasWeaponBlueprint(q,id){return q.blueprints.includes(id)||(id==='basic'&&q.blueprint);}
export function buyWeaponBlueprint(q,id,credits){const w=WEAPON_CATALOG.find(w=>w.id===id);if(!q.ready||q.serviceRemaining!=null||!w||id==='basic'||hasWeaponBlueprint(q,id)||!Number.isFinite(credits)||credits<w.blueprintPrice)return {bought:false,credits};q.blueprints.push(id);return {bought:true,credits:credits-w.blueprintPrice};}
export function weaponMissingParts(q,id){const w=WEAPON_CATALOG.find(w=>w.id===id);return w?Object.entries(w.recipe).filter(([key,n])=>(q.components[key]||0)<n).map(([key,n])=>({id:key,count:n-(q.components[key]||0)})):[];}
export function weaponPartsPrice(q,id){return weaponMissingParts(q,id).reduce((sum,p)=>sum+p.count*WEAPON_COMPONENTS.find(c=>c.id===p.id).price,0);}
export function buyWeaponParts(q,id,credits){const w=WEAPON_CATALOG.find(w=>w.id===id),price=weaponPartsPrice(q,id);if(!q.ready||q.serviceRemaining!=null||!w||!hasWeaponBlueprint(q,id)||!price||!Number.isFinite(credits)||credits<price)return {bought:false,credits};for(const p of weaponMissingParts(q,id))q.components[p.id]=(q.components[p.id]||0)+p.count;return {bought:true,credits:credits-price};}
export function craftWeapon(q,id){const w=WEAPON_CATALOG.find(w=>w.id===id);if(!q.ready||q.serviceRemaining!=null||!w||!hasWeaponBlueprint(q,id)||weaponMissingParts(q,id).length||(q.weapons[id]||0)>=100000)return false;for(const [key,n] of Object.entries(w.recipe)){q.components[key]-=n;if(!q.components[key])delete q.components[key];}q.weapons[id]=(q.weapons[id]||0)+1;q.serviceRemaining=WORKSHOP_SERVICE_MS;return true;}
export function equipCraftedWeapon(q,id){if(!q.ready||q.serviceRemaining!=null||!WEAPON_CATALOG.some(w=>w.id===id)||!q.weapons[id]||(q.installed&&q.equippedWeapon===id))return false;q.installed=true;q.equippedWeapon=id;q.weaponLevel=q.weaponLevels[id]||0;q.serviceRemaining=WORKSHOP_SERVICE_MS;return true;}

