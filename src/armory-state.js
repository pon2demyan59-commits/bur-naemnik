import { CELL } from './base-state.js';
import { WORKSHOP_SERVICE_MS } from './workshop-state.js';
export const ARMORER_SITE={x:17,y:27};
export const BLUEPRINT_SITE={x:36,y:35};
export const ARMORY_BODY={x:39*CELL,y:29*CELL,width:320,height:192};
export const ARMORY_DECK={x:40*CELL,y:32*CELL,width:192,height:128};
export const ARMORY_BLOCKS=[{x:40,y:33},{x:41,y:33},{x:42,y:33}];
export const ARMORY_STORIES=['armoryBrief','armorer','armoryReturn','armoryReady'];
export function restoreArmory(v={}) {
 if(!v||typeof v!=='object')v={};
 return {briefed:v.briefed===true,rescued:v.rescued===true,blueprint:v.blueprint===true,returnBriefed:v.returnBriefed===true,ready:v.ready===true,
 gifted:v.gifted===true,installed:v.installed===true&&v.gifted===true,
 weaponLevel:Number.isInteger(v.weaponLevel)?Math.max(0,Math.min(100,v.weaponLevel)):0,
 serviceRemaining:v.ready===true&&v.installed===true&&Number.isFinite(v.serviceRemaining)?Math.max(0,Math.min(WORKSHOP_SERVICE_MS,v.serviceRemaining)):null,
 dialogue:ARMORY_STORIES.includes(v.dialogue)?v.dialogue:null,dialoguePage:Number.isInteger(v.dialoguePage)?Math.max(0,Math.min(4,v.dialoguePage)):0};
}
export function armoryBlockCount(world){return ARMORY_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length;}
export function onArmoryDeck(rig,d=ARMORY_DECK){return rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;}
export function canRestoreArmory(q,world){return q.rescued&&q.blueprint&&q.returnBriefed&&armoryBlockCount(world)===0;}
export function weaponUpgradePrice(q){return Math.ceil(100*Math.pow(1.25,q.weaponLevel));}
export function installWeapon(q){if(!q.ready||!q.gifted||q.installed||q.serviceRemaining!=null)return false;q.installed=true;q.serviceRemaining=WORKSHOP_SERVICE_MS;return true;}
export function buyWeaponUpgrade(q,credits,allowDuringService=false){const price=weaponUpgradePrice(q);if(!q.ready||!q.installed||(!allowDuringService&&q.serviceRemaining!=null)||q.weaponLevel>=100||credits<price)return {bought:false,credits};q.weaponLevel++;q.serviceRemaining=WORKSHOP_SERVICE_MS;return {bought:true,credits:credits-price};}

