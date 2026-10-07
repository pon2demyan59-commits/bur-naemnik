import { MATERIALS } from './materials.js';
// User-requested preview distribution: every drawn material is available from floor 1.
export const DEPOSIT_WEIGHTS=[['earth',50],['stone',25],['iron',5],['copper',4],['bauxite',3],['tin',2],['zinc',2],['nickel',2],['chromium',2],['titanium',2],['tungsten',1],['gold',1.5],['xenorite',.5]];
export function validMaterialSeed(seed){return Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff;}
export function createMaterialSeed(){return Math.floor(Math.random()*0x100000000)>>>0;}
export function depositMaterial(seed,floor,x,y) {
 let n=(seed^Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^Math.imul(floor,83492791))>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);n=(n^(n>>>16))>>>0;
 const roll=n/0x100000000*100;let sum=0;
 for(const [id,weight] of DEPOSIT_WEIGHTS){sum+=weight;if(roll<sum)return id;}
 return 'earth';
}
export function restoreMaterialOverrides(value){return new Map(Array.isArray(value)?value.filter(v=>Array.isArray(v)&&Number.isInteger(v[0])&&v[0]>=0&&v[0]<2500&&MATERIALS.some(m=>m.id===v[1])):[]);}
