import { BASE_SIZE, CELL } from './base-state.js';
export const LIFT = {x:33,y:21};
export const LIFT_BLOCKS = [{x:32,y:24},{x:33,y:24},{x:34,y:24}];
export const FLOOR_LIFT = {x:25,y:7};
export function liftBlockCount(world) { return LIFT_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length; }
export function liftFrameCell(x,y,center=LIFT) {
  const dx=x-center.x,dy=y-center.y;
  return Math.abs(dx)<=3&&dy>=-3&&dy<=3&&!(Math.abs(dx)<=1&&dy>=-1);
}
export function liftDestinations(progress) {
  const base=progress.base||progress,highest=Math.min(100,Math.max(0,Math.floor(progress.highestFloor||0)));
  const cards=new Set([...(Array.isArray(progress.keycards)?progress.keycards:[]),...(base.rescued?[1]:[])]);
  return [{floor:0,enabled:true},...Array.from({length:Math.min(100,highest+1)},(_,i)=>({floor:i+1,enabled:i+1<=highest||cards.has(i+1)}))];
}
// Separate mine state: the lift never swaps the base's excavated cells with a floor.
export class FloorWorld {
  constructor(progress={}) {
    this.floor=1;this.x=Number.isInteger(progress.x)?progress.x:FLOOR_LIFT.x;
    this.y=Number.isInteger(progress.y)?progress.y:FLOOR_LIFT.y;
    this.cleared=new Set(Array.isArray(progress.cleared)?progress.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<BASE_SIZE*BASE_SIZE):[]);
    this.damage=new Map(Array.isArray(progress.damage)?progress.damage.filter(v=>Array.isArray(v)&&Number.isInteger(v[0])&&v[0]>=0&&v[0]<BASE_SIZE*BASE_SIZE&&Number.isFinite(v[1])&&v[1]>0&&v[1]<1):[]);
    this.rescued=true;this.heard=true;
    if(!this.inside(this.x,this.y)||this.blocked(this.x,this.y)||liftFrameCell(this.x,this.y,FLOOR_LIFT)){this.x=25;this.y=7;}
  }
  inside(x,y){return x>=2&&y>=2&&x<48&&y<48;}
  blocked(x,y){return this.inside(x,y)&&!(x>=22&&x<=28&&y>=4&&y<=11)&&!this.cleared.has(y*BASE_SIZE+x);}
  drill(x,y,amount){if(!this.blocked(x,y))return false;const key=y*BASE_SIZE+x,next=(this.damage.get(key)||0)+amount;if(next>=1){this.cleared.add(key);this.damage.delete(key);return true;}this.damage.set(key,next);return false;}
  canRescue(){return false;}
  snapshot(){return {location:'floor',floor:1,x:this.x,y:this.y,cleared:[...this.cleared],damage:[...this.damage]};}
}
