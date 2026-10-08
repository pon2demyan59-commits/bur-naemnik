import { CELL } from './base-state.js';
import { collectGroundCargo, leaveGroundCargo } from './ground-cargo-state.js';
import { cargoCount } from './cargo-state.js';
const pileColors={earth:0xb17c4c,stone:0xabb1a7,iron:0xb37d66,copper:0xe09b5d,bauxite:0xc5bb9b,tin:0xafc6c7,zinc:0x83b6b9,nickel:0x9bb382,chromium:0x9dbaac,titanium:0x8ba6cc,tungsten:0x85869b,gold:0xf6cf67,xenorite:0xba8ee9};
export const groundCargoMethods={
 makeGroundCargo(){this.groundCargoViews=new Map();this.groundCargoIndex=new Map();this.renderGroundCargo();},
 renderGroundCargo(){
  if(!this.groundCargoViews)return;this.groundCargoIndex=new Map((this.groundCargo||[]).map(p=>[p.y*50+p.x,p]));
  for(const [key,view] of this.groundCargoViews)if(!this.groundCargoIndex.has(key)){view.destroy();this.groundCargoViews.delete(key);}
  for(const [key,p] of this.groundCargoIndex){if(this.groundCargoViews.has(key))continue;const g=this.add.graphics().setPosition((p.x+.5)*CELL,(p.y+.5)*CELL).setDepth(12);g.fillStyle(0x0a1b1a,.32);g.fillEllipse(0,7,42,24);
   for(let i=0;i<5;i++){const x=[-15,9,-3,15,-7][i],y=[2,5,-9,-4,11][i];g.fillStyle(pileColors[p.material]||0xb17c4c);g.fillTriangle(x-9,y+7,x+8,y+5,x+2,y-9);g.lineStyle(2,0xffedb0,.4);g.lineBetween(x-9,y+7,x+2,y-9);}this.groundCargoViews.set(key,g);
  }
 },
 leaveBrokenMaterial(x,y,material){this.groundCargo||=[];leaveGroundCargo(this.groundCargo,x,y,material);this.renderGroundCargo();},
 collectNearbyGroundCargo(){
  if(!this.groundCargoIndex?.size||this.cargo>=this.cargoCapacity())return;const cx=Math.floor(this.rig.x/CELL),cy=Math.floor(this.rig.y/CELL);let changed=false;
  for(let y=cy-1;y<=cy+1;y++)for(let x=cx-1;x<=cx+1;x++){const p=this.groundCargoIndex.get(y*50+x);if(!p||Math.hypot(this.rig.x-(x+.5)*CELL,this.rig.y-(y+.5)*CELL)>CELL*.85)continue;const n=collectGroundCargo(p,this.cargoHold,this.cargoCapacity());if(n){changed=true;this.showCargoPickup(p.material,(x+.5)*CELL,(y+.5)*CELL,true,n);}}
  if(changed){this.groundCargo=this.groundCargo.filter(p=>p.count);this.cargo=cargoCount(this.cargoHold);this.renderGroundCargo();this.refreshHUD();this.persist();}
 }
};
