import { findTunnelPath, spiderHardSolids, SPIDER_DIG_POWER } from './tunnel-path.js';
import { CELL, BASE_SIZE } from './base-state.js';
import { driveFits } from './drive-controller.js';
export const SPIDER_HP=3,SPIDER_AGGRO=4*CELL,WEAPON_RANGE=2*CELL;
export const SPIDER_SITES=[{x:25,y:12},{x:13,y:24},{x:38,y:24},{x:19,y:33},{x:35,y:38}];
const center=site=>({x:(site.x+.5)*CELL,y:(site.y+.5)*CELL});
export function restoreSpider(saved,site,id) {
 const home=center(site),v=saved&&typeof saved==='object'?saved:{};
 return {id,homeX:home.x,homeY:home.y,
 x:Number.isFinite(v.x)&&v.x>=128&&v.x<3072?v.x:home.x,
 y:Number.isFinite(v.y)&&v.y>=128&&v.y<3072?v.y:home.y,
 hp:Number.isFinite(v.hp)?Math.max(0,Math.min(SPIDER_HP,v.hp)):SPIDER_HP,
 respawn: Number.isFinite(v.respawn)?Math.max(0,Math.min(15000,v.respawn)):15000,
 bite:Number.isFinite(v.bite)?Math.max(0,Math.min(1000,v.bite)):0,
 angle:Number.isFinite(v.angle)?v.angle:0};
}
export function createFloorSpiders(saved=[]) {return SPIDER_SITES.map((site,i)=>restoreSpider(Array.isArray(saved)?saved.find(s=>s?.id===i):null,site,i));}
function traceClear(from,to,solid,radius) {
 const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance/8));
 for(let i=1;i<=steps;i++)if(!driveFits(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps,solid,radius))return false;
 return true;
}
export function clearShot(from,to,solid){return traceClear(from,to,solid,2);}
export function clearWalk(from,to,solid){return traceClear(from,to,solid,12);}
export function nearestTarget(from,spiders,range,solid) {
 return spiders.filter(s=>s.hp>0&&Math.hypot(s.x-from.x,s.y-from.y)<=range&&clearShot(from,s,solid))
 .sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y))[0]||null;
}
// Four-way navigation uses the same terrain and machine collision geometry as the drill.
export function findPath(from,to,solid,radius=12) {
 const sx=Math.floor(from.x/CELL),sy=Math.floor(from.y/CELL),tx=Math.floor(to.x/CELL),ty=Math.floor(to.y/CELL);
 const start=sy*BASE_SIZE+sx,target=ty*BASE_SIZE+tx;
 if(start===target)return [];
 const parents=new Map([[start,null]]),queue=[start];
 for(let n=0;n<queue.length;n++) {
  const key=queue[n],x=key%BASE_SIZE,y=Math.floor(key/BASE_SIZE);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
   const cx=x+dx,cy=y+dy,k=cy*BASE_SIZE+cx;
   if(cx<2||cy<2||cx>=48||cy>=48||parents.has(k)||!driveFits((cx+.5)*CELL,(cy+.5)*CELL,solid,radius))continue;
   parents.set(k,key);queue.push(k);
   if(k===target){
    const path=[];let at=k;
    while(at!==start){path.push(center({x:at%BASE_SIZE,y:Math.floor(at/BASE_SIZE)}));at=parents.get(at);}
    return path.reverse();
   }
  }
 }
 return [];
}
export function moveEnemy(spider,target,dt,solid,speed=75) {
 const distance=Math.hypot(target.x-spider.x,target.y-spider.y);
 if(distance<.1)return;
 const step=Math.min(distance,speed*dt),dx=(target.x-spider.x)/distance*step,dy=(target.y-spider.y)/distance*step;
 if(driveFits(spider.x+dx,spider.y+dy,solid,12)){spider.x+=dx;spider.y+=dy;}
 else {
  if(driveFits(spider.x+dx,spider.y,solid,12))spider.x+=dx;
  if(driveFits(spider.x,spider.y+dy,solid,12))spider.y+=dy;
 }
 spider.angle=Math.atan2(dy,dx)*180/Math.PI+90;
}
export function stepSpider(spider,rig,delta,solid,{tutorial=false,safe=false,world=null,onDig=null}={}) {
 const ms=Math.max(0,Math.min(delta,50)),dt=ms/1000;spider.digging=false;
 if(spider.hp<=0){
  if(tutorial)return 0;
  spider.respawn=Math.max(0,spider.respawn-ms);
  if(spider.respawn===0&&Math.hypot(rig.x-spider.homeX,rig.y-spider.homeY)>96&&driveFits(spider.homeX,spider.homeY,solid,12)){
   spider.hp=SPIDER_HP;spider.x=spider.homeX;spider.y=spider.homeY;spider.bite=1000;spider.path=[];
  }
  return 0;
 }
 spider.bite=Math.max(0,spider.bite-ms);
 const distance=Math.hypot(rig.x-spider.x,rig.y-spider.y);
 if(!tutorial&&distance>SPIDER_AGGRO)return 0;
 if(safe)return 0;
 if(distance<=48&&clearShot(spider,rig,solid)){
  if(spider.bite===0){spider.bite=1000;return 1;}
  return 0;
 }
 if(clearWalk(spider,rig,solid))moveEnemy(spider,rig,dt,solid);
 else{
  spider.pathTime=(spider.pathTime||0)-ms;
  if(spider.pathTime<=0){spider.path=world?findTunnelPath(spider,rig,world,solid):findPath(spider,rig,solid);spider.pathTime=600;}
  while(spider.path?.length&&Math.hypot(spider.path[0].x-spider.x,spider.path[0].y-spider.y)<5)spider.path.shift();
  if(spider.path?.length){
   const next=spider.path[0],x=Math.floor(next.x/CELL),y=Math.floor(next.y/CELL);
   if(world?.blocked(x,y)&&driveFits(next.x,next.y,spiderHardSolids(world,solid),12)&&Math.hypot(next.x-spider.x,next.y-spider.y)<=CELL/2+24){
    spider.digging=true;spider.angle=Math.atan2(next.y-spider.y,next.x-spider.x)*180/Math.PI+90;
    const broken=world.drill(x,y,SPIDER_DIG_POWER*dt);
    spider.digEffect=(spider.digEffect||0)-ms;
    if(broken||spider.digEffect<=0){onDig?.(x,y,broken,spider);spider.digEffect=250;}
    if(broken){spider.path=[];spider.pathTime=0;}
   }else moveEnemy(spider,next,dt,solid);
  }
 }
 return 0;
}
export function hitSpider(spider,damage){
 if(spider.hp<=0)return false;
 spider.hp=Math.max(0,spider.hp-damage);
 if(spider.hp===0){spider.respawn=15000;return true;}
 return false;
}
export function spiderSnapshot(spiders){return spiders.map(({id,x,y,hp,respawn,bite,angle})=>({id,x,y,hp,respawn,bite,angle}));}
