import { drawRockFragment } from './rock-fragments.js';
import { CELL } from './base-state.js';
import { collectGroundCargo, leaveGroundCargo } from './ground-cargo-state.js';
import { cargoCount } from './cargo-state.js';
export const groundCargoMethods={
 makeGroundCargo(){this.groundCargoViews=new Map();this.groundCargoIndex=new Map();this.renderGroundCargo();},
 renderGroundCargo(){
  if(!this.groundCargoViews)return;this.groundCargoIndex=new Map((this.groundCargo||[]).map(p=>[p.y*50+p.x,p]));
  for(const [key,view] of this.groundCargoViews)if(!this.groundCargoIndex.has(key)){view.destroy();this.groundCargoViews.delete(key);}
  for(const [key,p] of this.groundCargoIndex){if(this.groundCargoViews.has(key))continue;const g=this.add.graphics().setPosition((p.x+.5)*CELL,(p.y+.5)*CELL).setDepth(12);g.fillStyle(0x081d1b,.28);g.fillEllipse(0,9,49,17);
   // Separated faceted chunks, with pale broken edges and coloured ore inclusions.
   for(const [i,chunk] of [[-17,3,9],[12,-2,10],[-3,-12,8],[-2,12,7],[20,11,6]].entries())drawRockFragment(g,p.material,...chunk,i);
   g.fillStyle(0xd9c9a0,.7);for(const [x,y] of [[-23,12],[23,-8],[6,19]])g.fillRect(x,y,2,2);
   this.groundCargoViews.set(key,g);
  }
 },
 leaveBrokenMaterial(x,y,material){this.groundCargo||=[];leaveGroundCargo(this.groundCargo,x,y,material);this.renderGroundCargo();},
 collectNearbyGroundCargo(){
  if(!this.groundCargoIndex?.size||this.cargo>=this.cargoCapacity())return;const cx=Math.floor(this.rig.x/CELL),cy=Math.floor(this.rig.y/CELL);let changed=false;
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){const p=this.groundCargoIndex.get(y*50+x);if(!p||Math.hypot(this.rig.x-(x+.5)*CELL,this.rig.y-(y+.5)*CELL)>CELL*.85)continue;const n=collectGroundCargo(p,this.cargoHold,this.cargoCapacity());if(n){changed=true;this.showCargoPickup(p.material,(x+.5)*CELL,(y+.5)*CELL,true,n);}}
  if(changed){this.groundCargo=this.groundCargo.filter(p=>p.count);this.cargo=cargoCount(this.cargoHold);this.renderGroundCargo();this.refreshHUD();this.persist();}
 }
};
