import { CELL } from './base-state.js';
import { MATERIALS } from './materials.js';
// Approved new story; recipe, capacity and duration are prototype balance.
export const BUILDER_SITE={x:35,y:30};
export const BUILDER_ENTRANCE=[{x:34,y:28},{x:35,y:28},{x:36,y:28}];
export const BUILDER_GUARDS=[{x:34,y:30},{x:36,y:30},{x:35,y:32}];
export const BUILDER_STORIES=['builderBrief','builderSignal','builderRescue','builderReturn','warehouseReady'];
export const CONSTRUCTION_DESK={x:22,y:24};
export const ARCHITECT_BODY={x:21*CELL,y:23*CELL,width:3*CELL,height:1.5*CELL};
export const ARCHITECT_DECK={x:21*CELL,y:24.5*CELL,width:3*CELL,height:.5*CELL};
export const ARCHITECT_FOOTPRINT={x:21*CELL,y:23*CELL,width:3*CELL,height:2*CELL};
export const WAREHOUSE_PLOTS=[{x:24,y:18,name:'У лифта'},{x:13,y:23,name:'Западная площадка'},{x:24,y:37,name:'Южная площадка'},{x:39,y:18,name:'Восточная площадка'}];
export const WAREHOUSE_RECIPE={earth:80,stone:20};
export const WAREHOUSE_MS=10000,WAREHOUSE_CAPACITY=100;
const natural=n=>Number.isSafeInteger(n)&&n>0?n:0;
export function stockCount(stock={}){return MATERIALS.reduce((n,m)=>n+natural(stock[m.id]),0);}
export function restoreConstruction(v={}){
 if(!v||typeof v!=='object')v={};
 const stock={};
 for(const m of MATERIALS){const n=natural(v.stock?.[m.id]);if(n)stock[m.id]=n;}
 const rescued=v.rescued===true,unlocked=rescued&&v.unlocked===true;
 return {briefed:v.briefed===true,signalHeard:v.signalHeard===true,rescued,unlocked,
 offset:{dx:Number.isInteger(v.offset?.dx)&&Math.abs(v.offset.dx)<=45?v.offset.dx:0,dy:Number.isInteger(v.offset?.dy)&&Math.abs(v.offset.dy)<=45?v.offset.dy:0},
 plot:Number.isInteger(v.plot)&&v.plot>=0&&v.plot<WAREHOUSE_PLOTS.length?v.plot:0,
 warehouseLevel:Number.isInteger(v.warehouseLevel)?Math.max(1,Math.min(100,v.warehouseLevel)):1,
 warehouse:unlocked&&v.warehouse===true,remaining:unlocked&&!v.warehouse&&Number.isFinite(v.remaining)?Math.max(0,Math.min(WAREHOUSE_MS,v.remaining)):null,stock,
 dialogue:BUILDER_STORIES.includes(v.dialogue)?v.dialogue:null,dialoguePage:Number.isInteger(v.dialoguePage)?Math.max(0,Math.min(3,v.dialoguePage)):0};
}
export function warehouseBody(q){const p=WAREHOUSE_PLOTS[q.plot];return {x:(p.x+(q.offset?.dx||0))*CELL,y:(p.y+(q.offset?.dy||0))*CELL,width:3*CELL,height:2*CELL};}
export function warehouseDeck(q){const b=warehouseBody(q);return {x:b.x,y:b.y+b.height,width:b.width,height:CELL};}
export function plotBlocked(q,world){const p=WAREHOUSE_PLOTS[q.plot];let n=0;for(let y=p.y;y<p.y+3;y++)for(let x=p.x;x<p.x+3;x++)if(world.blocked(x,y))n++;return n;}
export function builderEntranceLeft(world){return BUILDER_ENTRANCE.filter(p=>world.blocked(p.x,p.y)).length;}
export function canRescueBuilder(q,world,spiders){return q.briefed&&!q.rescued&&builderEntranceLeft(world)===0&&spiders.length===BUILDER_GUARDS.length&&spiders.every(s=>s.hp<=0);}
export function beginWarehouse(q,world,cargo,rig){
 if(!q.unlocked||q.warehouse||q.remaining!=null||plotBlocked(q,world))return false;
 const b=warehouseBody(q);if(rig&&rig.x>b.x-32&&rig.x<b.x+b.width+32&&rig.y>b.y-32&&rig.y<b.y+b.height+32)return false;
 for(const [id,n] of Object.entries(WAREHOUSE_RECIPE))if(natural(cargo[id])+natural(q.stock[id])<n)return false;
 for(const [id,n] of Object.entries(WAREHOUSE_RECIPE)){const carried=Math.min(n,natural(cargo[id]));cargo[id]=natural(cargo[id])-carried;q.stock[id]=natural(q.stock[id])-(n-carried);if(!cargo[id])delete cargo[id];if(!q.stock[id])delete q.stock[id];}
 q.remaining=WAREHOUSE_MS;return true;
}
export function stepConstruction(q,delta){if(q.remaining==null)return false;q.remaining=Math.max(0,q.remaining-Math.max(0,Math.min(delta,50)));if(q.remaining>0)return false;q.remaining=null;q.warehouse=true;return true;}
export function transferWarehouse(q,cargo,id,count,deposit,cargoCapacity=200){
 if(!q.warehouse||!MATERIALS.some(m=>m.id===id)||!Number.isSafeInteger(count)||count<=0)return 0;
 const source=deposit?cargo:q.stock,target=deposit?q.stock:cargo;
 const free=deposit?warehouseCapacity(q)-natural(target[id]):cargoCapacity-stockCount(target);
 const n=Math.min(count,natural(source[id]),Math.max(0,free));
 if(!n)return 0;source[id]-=n;if(!source[id])delete source[id];target[id]=natural(target[id])+n;return n;
}

export function warehouseCapacity(q={}){return WAREHOUSE_CAPACITY*(Number.isInteger(q.warehouseLevel)?Math.max(1,Math.min(100,q.warehouseLevel)):1);}
// Temporary upgrade price; +100 of every material per level.
export function warehouseUpgradePrice(q){return Math.ceil(200*Math.pow(1.25,warehouseCapacity(q)/100-1));}
export function upgradeWarehouse(q,credits){const price=warehouseUpgradePrice(q);if(!q.warehouse||warehouseCapacity(q)>=10000||!Number.isSafeInteger(credits)||credits<price)return {bought:false,credits};q.warehouseLevel=warehouseCapacity(q)/100+1;return {bought:true,credits:credits-price};}
