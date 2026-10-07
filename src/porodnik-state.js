import { CELL } from './base-state.js';
export const PORODNIK = { x:16, y:29, width:5, machineRows:4, deckRows:3 };
export const PORODNIK_BLOCKS = Array.from({length:5},(_,i)=>({x:16+i,y:33}));
export function porodnikArea(x,y) { return x>=15&&x<=21&&y>=28&&y<=36; }
export function porodnikFrameCell(x,y) { return x>=16&&x<=20&&y>=29&&y<=32; }
export function porodnikBlockCount(world) { return PORODNIK_BLOCKS.filter(p=>world.blocked(p.x,p.y)).length; }
export function onPorodnikDeck(rig) {
  return rig.x>16*CELL+28&&rig.x<21*CELL-28&&rig.y>33*CELL+28&&rig.y<36*CELL-28;
}
