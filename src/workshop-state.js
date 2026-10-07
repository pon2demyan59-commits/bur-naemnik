import { CELL } from './base-state.js';
export const TOOLS_SITE={x:18,y:20};
export const MECHANIC_SITE={x:32,y:29};
export const WORKSHOP_BLOCKS=[{x:31,y:34},{x:32,y:34},{x:33,y:34}];
export const WORKSHOP_BODY={x:30*CELL,y:30*CELL,width:320,height:192};
export const WORKSHOP_DECK={x:31*CELL,y:33*CELL,width:192,height:128};
export function restoreWorkshop(value={}) {
 if(!value||typeof value!=='object')value={};
 const kinds=['workshop','mechanic','workshopReturn','workshopReady'];
 return {briefed:value.briefed===true,tools:value.tools===true,mechanic:value.mechanic===true,
 returnBriefed:value.returnBriefed===true,ready:value.ready===true,
 upgrades:Number.isInteger(value.upgrades)?Math.max(0,Math.min(100,value.upgrades)):0,
 dialogue:kinds.includes(value.dialogue)?value.dialogue:null,
 dialoguePage:Number.isInteger(value.dialoguePage)?Math.max(0,Math.min(4,value.dialoguePage)):0};
}
export function nearWorkshopItem(rig,site) {return Math.hypot(rig.x-(site.x+.5)*CELL,rig.y-(site.y+.5)*CELL)<=58;}
export function onWorkshopDeck(rig) {const d=WORKSHOP_DECK;return rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;}
export function workshopBlockCount(world) {return WORKSHOP_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length;}
export function canRestoreWorkshop(q,world) {return q.tools&&q.mechanic&&q.returnBriefed&&workshopBlockCount(world)===0;}
export function workshopPrice(q) {return Math.ceil(100*Math.pow(1.25,q.upgrades));}
export function buyWorkshopUpgrade(q,credits) {
 const price=workshopPrice(q);
 if(!q.ready||q.upgrades>=100||credits<price)return {bought:false,credits};
 q.upgrades++;return {bought:true,credits:credits-price};
}
export function objectiveBearing(rig,site) {
 const dx=(site.x+.5)*CELL-rig.x,dy=(site.y+.5)*CELL-rig.y;
 const arrows=['→','↘','↓','↙','←','↖','↑','↗'];
 return `${arrows[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8]} ${Math.round(Math.hypot(dx,dy)/CELL)} м`;
}
