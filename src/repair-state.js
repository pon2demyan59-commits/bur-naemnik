import { CELL } from './base-state.js';
export const REPAIRMAN_SITE={x:36,y:39};
export const REPAIR_KIT_SITE={x:18,y:34};
export const REPAIR_BODY={x:6*CELL,y:30*CELL,width:320,height:192};
export const REPAIR_DECK={x:7*CELL,y:33*CELL,width:192,height:128};
export const REPAIR_BLOCKS=[{x:7,y:34},{x:8,y:34},{x:9,y:34}];
export const REPAIR_STORIES=['repairBrief','repairman','repairReturn','repairReady','waveBrief','waveComplete'];
export const DRILL_MAX_HP=20; // Temporary prototype balance; not a new canon rule.
export function restoreRepair(v={}) {
 if(!v||typeof v!=='object')v={};
 return {briefed:v.briefed===true,kit:v.kit===true,rescued:v.rescued===true,returnBriefed:v.returnBriefed===true,ready:v.ready===true,
 serviceRemaining:v.ready===true&&Number.isFinite(v.serviceRemaining)?Math.max(0,Math.min(4000,v.serviceRemaining)):null,
 wave:v.wave==='active'||v.wave==='done'?v.wave:'idle',
 dialogue:REPAIR_STORIES.includes(v.dialogue)?v.dialogue:null,
 dialoguePage:Number.isInteger(v.dialoguePage)?Math.max(0,Math.min(4,v.dialoguePage)):0};
}
export function repairBlockCount(world){return REPAIR_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length;}
export function canRestoreRepair(q,world){return q.kit&&q.rescued&&q.returnBriefed&&repairBlockCount(world)===0;}
export function onRepairDeck(rig){const d=REPAIR_DECK;return rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;}
export function restoreHull(value){return Number.isFinite(value)?Math.max(0,Math.min(DRILL_MAX_HP,value)):DRILL_MAX_HP;}
export function repairPrice(hp){return Math.ceil((DRILL_MAX_HP-restoreHull(hp))*2);}
export function buyRepair(q,hp,credits){
 const price=repairPrice(hp);
 if(!q.ready||q.serviceRemaining!=null||price<=0||credits<price)return {bought:false,hp,credits};
 q.serviceRemaining=4000;
 return {bought:true,hp:DRILL_MAX_HP,credits:credits-price};
}
