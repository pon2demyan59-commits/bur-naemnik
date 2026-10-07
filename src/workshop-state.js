import { driveFits } from './drive-controller.js';
import { smoothHeading, wrapDegrees } from './drill-motion.js';
import { CELL } from './base-state.js';
export const WORKSHOP_SERVICE_MS=4000;
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
 serviceRemaining:value.ready===true&&value.upgrades>0&&Number.isFinite(value.serviceRemaining)?Math.max(0,Math.min(WORKSHOP_SERVICE_MS,value.serviceRemaining)):null,
 upgrades:Number.isInteger(value.upgrades)?Math.max(0,Math.min(100,value.upgrades)):0,
 dialogue:kinds.includes(value.dialogue)?value.dialogue:null,
 dialoguePage:Number.isInteger(value.dialoguePage)?Math.max(0,Math.min(4,value.dialoguePage)):0};
}
export function nearWorkshopItem(rig,site) {return Math.hypot(rig.x-(site.x+.5)*CELL,rig.y-(site.y+.5)*CELL)<=58;}
export function onWorkshopDeck(rig) {const d=WORKSHOP_DECK;return rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;}
export function workshopBlockCount(world) {return WORKSHOP_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length;}
export function canRestoreWorkshop(q,world) {return q.tools&&q.mechanic&&q.returnBriefed&&workshopBlockCount(world)===0;}
export function workshopPrice(q) {return Math.ceil(100*Math.pow(1.25,q.upgrades));}
export function buyWorkshopUpgrade(q,credits,allowDuringService=false) {
 const price=workshopPrice(q);
 if(!q.ready||(!allowDuringService&&q.serviceRemaining!=null)||q.upgrades>=100||credits<price)return {bought:false,credits};
 q.upgrades++;q.serviceRemaining=WORKSHOP_SERVICE_MS;return {bought:true,credits:credits-price};
}
export function objectiveBearing(rig,site) {
 const dx=(site.x+.5)*CELL-rig.x,dy=(site.y+.5)*CELL-rig.y;
 const arrows=['→','↘','↓','↙','←','↖','↑','↗'];
 return `${arrows[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8]} ${Math.round(Math.hypot(dx,dy)/CELL)} м`;
}

// The purchase is already paid and saved. This only runs its presentation and safe exit.
export function stepWorkshopService(q,rig,dt,solid,deck=WORKSHOP_DECK,stay=false) {
 const next={...rig,speed:0,moving:false};dt=Math.max(0,Math.min(.05,dt));
 if(q.serviceRemaining==null)return next;
 if(q.serviceRemaining>0){q.serviceRemaining=Math.max(0,q.serviceRemaining-dt*1000);if(stay&&q.serviceRemaining===0)q.serviceRemaining=null;return next;}
 if(stay){q.serviceRemaining=null;return next;}
 next.angle=smoothHeading(rig.angle,90,dt,240,10);
 if(Math.abs(wrapDegrees(90-next.angle))>4)return next;
 const exitY=deck.y+deck.height+28;
 const y=Math.min(exitY,rig.y+80*dt);
 if(rig.y>=exitY||!driveFits(rig.x,y,solid)){q.serviceRemaining=null;return next;}
 next.y=y;next.speed=80;next.moving=true;
 if(y>=exitY)q.serviceRemaining=null;
 return next;
}
