import { MATERIALS } from './materials.js';
// docs/canon-miro.txt: hardness, chance on floors 1 / 50 / 100 (percent).
export const ORE_RULES=[
 {id:'iron',hardness:3,chances:[3,8,12]},
 {id:'copper',hardness:4,chances:[1.5,5,8]},
 {id:'bauxite',hardness:5,chances:[.8,3,5]},
 {id:'tin',hardness:6,chances:[.5,2,3]},
 {id:'zinc',hardness:8,chances:[.2,1.5,2.5]},
 {id:'nickel',hardness:12,chances:[.1,1,2]},
 {id:'chromium',hardness:16,chances:[.05,.8,1.5]},
 {id:'titanium',hardness:24,chances:[.02,.4,1]},
 {id:'tungsten',hardness:40,chances:[.01,.2,.5]},
 {id:'gold',hardness:30,chances:[.01,.15,.4]},
 {id:'xenorite',hardness:100,chances:[.0001,.001,.005]}
];
export function oreChance(id,floor){const rule=ORE_RULES.find(r=>r.id===id);if(!rule||floor<1)return 0;const f=Math.min(100,Math.max(1,floor)),[start,middle,end]=rule.chances;return f<=50?start+(middle-start)*(f-1)/49:middle+(end-middle)*(f-50)/50;}
const depositWeightCache=new Map();
export function depositWeights(floor){if(floor<1)return [['earth',100]];floor=Math.min(100,Math.max(1,floor));if(depositWeightCache.has(floor))return depositWeightCache.get(floor);const ores=ORE_RULES.map(r=>[r.id,oreChance(r.id,floor)]),total=ores.reduce((sum,[,weight])=>sum+weight,0);const weights=[...ores,['stone',25],['earth',75-total]];depositWeightCache.set(floor,weights);return weights;}
export function validMaterialSeed(seed){return Number.isInteger(seed)&&seed>=0&&seed<=0xffffffff;}
export function createMaterialSeed(){return Math.floor(Math.random()*0x100000000)>>>0;}
function depositRoll(seed,floor,x,y){let n=(seed^Math.imul(x+1,73856093)^Math.imul(y+1,19349663)^Math.imul(floor,83492791))>>>0;n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/0x100000000*100;}
function weightedMaterial(roll,weights){let sum=0;for(const [id,weight] of weights){sum+=weight;if(roll<sum)return id;}return 'earth';}
export function depositMaterial(seed,floor,x,y){return weightedMaterial(depositRoll(seed,floor,x,y),depositWeights(floor));}
// Preserve a partly drilled block when upgrading from the short-lived all-ores preview.
export function legacyDepositMaterial(seed,floor,x,y){return weightedMaterial(depositRoll(seed,floor,x,y),[['earth',50],['stone',25],['iron',5],['copper',4],['bauxite',3],['tin',2],['zinc',2],['nickel',2],['chromium',2],['titanium',2],['tungsten',1],['gold',1.5],['xenorite',.5]]);}
export function restoreMaterialOverrides(value){return new Map(Array.isArray(value)?value.filter(v=>Array.isArray(v)&&Number.isInteger(v[0])&&v[0]>=0&&v[0]<2500&&MATERIALS.some(m=>m.id===v[1])):[]);}
