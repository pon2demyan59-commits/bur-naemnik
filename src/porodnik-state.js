import { restoreCargo, cargoCount, quoteCargo } from './cargo-state.js';
import { CELL } from './base-state.js';
export const PORODNIK = { x:16, y:29, width:5, machineRows:4, deckRows:3 };
export const PORODNIK_BLOCKS = Array.from({length:5},(_,i)=>({x:16+i,y:33}));
export function porodnikArea(x,y) { return x>=15&&x<=21&&y>=28&&y<=36; }
export function porodnikFrameCell(x,y) { return x>=16&&x<=20&&y>=29&&y<=32; }
export function porodnikBlockCount(world) { return PORODNIK_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length; }
// Sprite frames and interaction use the same bounds, with no hidden inset.
export const PORODNIK_MACHINE={x:16*CELL,y:29*CELL,width:320,height:217.5};
export const PORODNIK_DECK={x:18.5*CELL-40,y:29*CELL+217.5,width:80,height:96};
export const PORODNIK_COLLIDER={x:PORODNIK_MACHINE.x+4,y:PORODNIK_MACHINE.y+4,width:312,height:PORODNIK_MACHINE.height-4};
export function onPorodnikDeck(rig,d=PORODNIK_DECK) {
  return rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;
}

export const PORODNIK_CYCLE_MS=3000;
export function restorePorodnikJob(value,capacity=200,saleBonus=0) {
  if(!value||!Number.isInteger(value.amount)||value.amount<=0||value.amount>capacity||!Number.isFinite(value.remaining)||value.remaining<0||value.remaining>10000)return null;
  if(value.sale){
    const sale=restoreCargo(value.sale,0,capacity),amount=cargoCount(sale);
    if(amount!==value.amount)return null;
    const bonus=Number.isFinite(value.saleBonus)&&value.saleBonus>=0&&value.saleBonus<=saleBonus?value.saleBonus:0;return {...quoteCargo(sale,sale,bonus),...(bonus?{saleBonus:bonus}:{}),remaining:Math.min(value.remaining,PORODNIK_CYCLE_MS)};
  }
  // A cycle started before typed cargo keeps its already-promised old payout.
  return {amount:value.amount,remaining:Math.min(value.remaining,PORODNIK_CYCLE_MS)};
}
export function stepPorodnikJob(job,delta) {
  if(!job)return 0;
  job.remaining=Math.max(0,job.remaining-Math.max(0,delta));
  return job.remaining===0?(job.payout??job.amount):0;
}

