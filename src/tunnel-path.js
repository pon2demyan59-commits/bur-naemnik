import { CELL, BASE_SIZE } from './base-state.js';
import { driveFits } from './drive-controller.js';
export const SPIDER_DIG_POWER=.5; // Temporary digging balance: soil takes two seconds.
const SPIDER_WALK_COST=CELL/75;
export function spiderHardSolids(world,solid) {
 const hard=(x,y)=>solid(x,y)&&(!world.blocked(x,y)||!Number.isFinite(world.hardness?.(x,y)??1));
 hard.rectangles=solid.rectangles||[];return hard;
}
class TunnelHeap {
 constructor(){this.items=[];}
 push(value){
  const items=this.items;items.push(value);let at=items.length-1;
  while(at>0){const parent=(at-1)>>1;if(items[parent].rank<=value.rank)break;items[at]=items[parent];at=parent;}
  items[at]=value;
 }
 pop(){
  const items=this.items,first=items[0],last=items.pop();if(!items.length)return first;
  let at=0;
  while(at*2+1<items.length){
   let next=at*2+1;if(next+1<items.length&&items[next+1].rank<items[next].rank)next++;
   if(items[next].rank>=last.rank)break;items[at]=items[next];at=next;
  }
  items[at]=last;return first;
 }
}
// Minimize travel plus the time required to break the remaining block, not just cell count.
export function findTunnelPath(from,to,world,solid) {
 const sx=Math.floor(from.x/CELL),sy=Math.floor(from.y/CELL),tx=Math.floor(to.x/CELL),ty=Math.floor(to.y/CELL);
 const start=sy*BASE_SIZE+sx,goal=ty*BASE_SIZE+tx;
 if(start===goal)return [];
 const hard=spiderHardSolids(world,solid),costs=new Float64Array(BASE_SIZE*BASE_SIZE);costs.fill(Infinity);
 const previous=new Int32Array(BASE_SIZE*BASE_SIZE);previous.fill(-1);
 const heap=new TunnelHeap();costs[start]=0;heap.push({key:start,cost:0,rank:0});
 while(heap.items.length){
  const node=heap.pop();if(node.cost!==costs[node.key])continue;
  if(node.key===goal){
   const path=[];let key=goal;
   while(key!==start){const x=key%BASE_SIZE,y=Math.floor(key/BASE_SIZE);path.push(key===goal?{x:to.x,y:to.y}:{x:(x+.5)*CELL,y:(y+.5)*CELL});key=previous[key];}
   return path.reverse();
  }
  const x=node.key%BASE_SIZE,y=Math.floor(node.key/BASE_SIZE);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const cx=x+dx,cy=y+dy,key=cy*BASE_SIZE+cx;
   if(cx<2||cy<2||cx>=BASE_SIZE-2||cy>=BASE_SIZE-2)continue;
   const point=key===goal?to:{x:(cx+.5)*CELL,y:(cy+.5)*CELL};
   if(!driveFits(point.x,point.y,hard,12))continue;
   let cost=SPIDER_WALK_COST;
   if(world.blocked(cx,cy)){
    const strength=world.hardness?.(cx,cy)??1;if(!Number.isFinite(strength)||strength<=0)continue;
    const damage=Math.max(0,Math.min(1,world.damage?.get(key)||0));
    cost+=strength*(1-damage)/SPIDER_DIG_POWER;
   }
   const total=node.cost+cost;if(total>=costs[key])continue;
   costs[key]=total;previous[key]=node.key;
   heap.push({key,cost:total,rank:total+(Math.abs(tx-cx)+Math.abs(ty-cy))*SPIDER_WALK_COST});
  }
 }
 return [];
}
