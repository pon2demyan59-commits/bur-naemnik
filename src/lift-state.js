import { createMaterialSeed, validMaterialSeed, depositMaterial, legacyDepositMaterial, restoreMaterialOverrides } from './deposits.js';
import { circleHitsRect } from './drive-controller.js';
import { BASE_SIZE, CELL } from './base-state.js';
export const LIFT = {x:33,y:21};
export const LIFT_BLOCKS = [{x:32,y:24},{x:33,y:24},{x:34,y:24}];
export const FLOOR_LIFT = {x:25,y:7};
export function liftBlockCount(world) { return LIFT_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length; }
export function liftFrameCell(x,y,center=LIFT) {
  const dx=x-center.x,dy=y-center.y;
  return Math.abs(dx)<=3&&dy>=-3&&dy<=3&&!(Math.abs(dx)<=1&&dy>=-1);
}
// Match the cropped sprite in LiftView instead of blocking a seven-cell square.
export function liftGeometry(center=LIFT) {
  const scale=384/1077,x=(center.x+.5)*CELL-192,y=(center.y+.5)*CELL-1063*scale/2;
  const rect=(sx,sy,w,h)=>({x:x+(sx-127)*scale,y:y+(sy-40)*scale,width:w*scale,height:h*scale});
  return {deck:rect(333,320,665,565),colliders:[
    rect(127,40,1077,280),rect(127,320,206,565),rect(998,320,206,565),
    rect(127,885,291,160),rect(915,885,289,160)
  ]};
}
export function liftDestinations(progress) {
  const base=progress.base||progress,highest=Math.min(100,Math.max(0,Math.floor(progress.highestFloor||0)));
  const cards=new Set([...(Array.isArray(progress.keycards)?progress.keycards:[]),...(base.rescued?[1]:[])].filter(n=>Number.isInteger(n)&&n>=1&&n<=100));
  const last=Math.min(100,Math.max(highest+1,...cards));
  return [{floor:0,enabled:true},...Array.from({length:last},(_,i)=>({floor:i+1,enabled:i+1<=highest||cards.has(i+1)}))];
}
// Separate mine state: the lift never swaps the base's excavated cells with a floor.
export class FloorWorld {
  constructor(progress={},floor=1) {
    this.floor=[1,2,3].includes(floor)?floor:1;this.x=Number.isInteger(progress.x)?progress.x:FLOOR_LIFT.x;
    this.y=Number.isInteger(progress.y)?progress.y:FLOOR_LIFT.y;
    this.cleared=new Set(Array.isArray(progress.cleared)?progress.cleared.filter(n=>Number.isInteger(n)&&n>=0&&n<BASE_SIZE*BASE_SIZE):[]);
    this.damage=new Map(Array.isArray(progress.damage)?progress.damage.filter(v=>Array.isArray(v)&&Number.isInteger(v[0])&&v[0]>=0&&v[0]<BASE_SIZE*BASE_SIZE&&Number.isFinite(v[1])&&v[1]>0&&v[1]<1):[]);
    this.materialSeed=validMaterialSeed(progress.materialSeed)?progress.materialSeed:createMaterialSeed();
    this.materialOverrides=restoreMaterialOverrides(progress.materialOverrides);
    // Keep the material of partially drilled old blocks during migration.
    if(!validMaterialSeed(progress.materialSeed))for(const key of this.damage.keys()) {
      const x=key%BASE_SIZE,y=Math.floor(key/BASE_SIZE);
      this.materialOverrides.set(key,this.floor===2&&((x*31+y*17+x*y)%100)<38?'stone':'earth');
    }
    if(validMaterialSeed(progress.materialSeed)&&progress.materialGeneration!==2)for(const key of this.damage.keys()) {
      if(!this.materialOverrides.has(key))this.materialOverrides.set(key,legacyDepositMaterial(this.materialSeed,this.floor,key%BASE_SIZE,Math.floor(key/BASE_SIZE)));
    }
    this.rescued=true;this.heard=true;
    const parked=progress.drive;
    const hasParked=parked&&Number.isFinite(parked.x)&&Number.isFinite(parked.y)&&Math.floor(parked.x/CELL)===this.x&&Math.floor(parked.y/CELL)===this.y;
    const px=hasParked?parked.x:(this.x+.5)*CELL,py=hasParked?parked.y:(this.y+.5)*CELL;
    if(!this.inside(this.x,this.y)||this.blocked(this.x,this.y)||liftGeometry(FLOOR_LIFT).colliders.some(rect=>circleHitsRect(px,py,rect))){this.x=25;this.y=7;}
  }
  inside(x,y){return x>=2&&y>=2&&x<48&&y<48;}
  blocked(x,y){const item=this.floor===3?((x===18&&y===34)||(x===36&&y===39)||[{x:25,y:12},{x:13,y:24},{x:38,y:24},{x:19,y:33},{x:35,y:38}].some(p=>Math.abs(x-p.x)<=1&&Math.abs(y-p.y)<=1)):this.floor===2?((x===17&&y===27)||(x===36&&y===35)):((x===18&&y===20)||(x===32&&y===29));return this.inside(x,y)&&!item&&!(x>=22&&x<=28&&y>=4&&y<=11)&&!this.cleared.has(y*BASE_SIZE+x);}
  material(x,y){return this.materialOverrides.get(y*BASE_SIZE+x)||depositMaterial(this.materialSeed,this.floor,x,y);}
  hardness(x,y){return this.material(x,y)==='earth'?1:2.5;}
  drill(x,y,amount){if(!this.blocked(x,y))return false;const key=y*BASE_SIZE+x,next=(this.damage.get(key)||0)+amount/this.hardness(x,y);if(next>=1){this.cleared.add(key);this.damage.delete(key);return true;}this.damage.set(key,next);return false;}
  canRescue(){return false;}
  snapshot(){return {location:'floor',floor:this.floor,materialSeed:this.materialSeed,materialGeneration:2,materialOverrides:[...this.materialOverrides],x:this.x,y:this.y,cleared:[...this.cleared],damage:[...this.damage]};}
}

