import { MATERIALS } from './materials.js';
import { cargoCount } from './cargo-state.js';
const groundMaterialIds=new Set(MATERIALS.map(m=>m.id));
export function restoreGroundCargo(value){
 const cells=new Map();if(!Array.isArray(value))return [];
 for(const p of value){if(!Number.isInteger(p?.x)||!Number.isInteger(p?.y)||p.x<2||p.y<2||p.x>=48||p.y>=48||!groundMaterialIds.has(p.material)||!Number.isSafeInteger(p.count)||p.count<1)continue;const key=p.y*50+p.x;const old=cells.get(key);if(old&&old.material!==p.material)continue;cells.set(key,{x:p.x,y:p.y,material:p.material,count:Math.min(100000,(old?.count||0)+p.count)});}
 return [...cells.values()];
}
export function leaveGroundCargo(piles,x,y,material){
 if(!groundMaterialIds.has(material))return false;const pile=piles.find(p=>p.x===x&&p.y===y);if(pile){if(pile.material!==material)return false;pile.count++;}else piles.push({x,y,material,count:1});return true;
}
export function collectGroundCargo(pile,hold,capacity){
 const count=Math.min(pile.count,Math.max(0,capacity-cargoCount(hold)));if(!count)return 0;hold[pile.material]=(hold[pile.material]||0)+count;pile.count-=count;return count;
}
