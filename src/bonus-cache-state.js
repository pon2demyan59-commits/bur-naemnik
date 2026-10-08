import { MATERIALS } from './materials.js';
import { ARTIFACTS } from './artifact-catalog.js';
import { ARTIFACT_DROP_BASE_PERCENT } from './artifact-state.js';
import { cargoCount } from './cargo-state.js';
// Prototype balance: one cache per 500 player-broken floor blocks, three draws.
export const BONUS_CACHE_CHANCE=.002;
export const BONUS_CACHE_SLOTS=3;
export const BONUS_LOOT_POOL=[
 {kind:'credits',id:'credits',name:'Кредиты',weight:60,min:20,max:60},
 ...MATERIALS.map((m,i)=>({...m,kind:'material',weight:[25,18,10,7,4,3,2,1,.5,.2,.08,.05,.0001][i],min:i<2?5:1,max:[16,10,6,4,3,3,2,2,1,1,1,1,1][i]})),
 {kind:'fiber',id:'fiber',name:'Паучье волокно',weight:5,min:1,max:3},
 {kind:'heads',id:'heads',name:'Трофей: голова паука',weight:.001,min:1,max:1},
 ...ARTIFACTS.map((a,i)=>({...a,kind:'artifact',rarity:Math.floor(i/20)+1,weight:ARTIFACT_DROP_BASE_PERCENT[Math.floor(i/20)]/20,min:1,max:1}))
];
const lootById=new Map(BONUS_LOOT_POOL.map(a=>[a.id,a]));
const unit=(random)=>{const n=random();return Number.isFinite(n)&&n>=0&&n<1?n:null;};
export function rollBonusCache(floor,x,y,random=Math.random){
 if(!Number.isInteger(floor)||floor<1||floor>100||!Number.isInteger(x)||!Number.isInteger(y)||x<2||y<2||x>=48||y>=48)return null;
 const chance=unit(random);if(chance==null||chance>=BONUS_CACHE_CHANCE)return null;
 const total=BONUS_LOOT_POOL.reduce((n,a)=>n+a.weight,0),items=[];
 for(let slot=0;slot<BONUS_CACHE_SLOTS;slot++){
  const r=unit(random),q=unit(random);if(r==null||q==null)return null;let threshold=0;
  const item=BONUS_LOOT_POOL.find(a=>{threshold+=a.weight;return r*total<threshold;})||BONUS_LOOT_POOL.at(-1);
  const count=item.min+Math.floor(q*(item.max-item.min+1)),existing=items.find(a=>a.id===item.id);
  if(existing)existing.count+=count;else items.push({id:item.id,kind:item.kind,count});
 }
 return {x,y,items};
}
export function restoreBonusCaches(value){
 const out=[],seen=new Set();if(!Array.isArray(value))return out;
 for(const cache of value){if(!cache||!Number.isInteger(cache.x)||!Number.isInteger(cache.y)||cache.x<2||cache.y<2||cache.x>=48||cache.y>=48||!Array.isArray(cache.items))continue;const key=cache.y*50+cache.x;if(seen.has(key))continue;
  const items=[];for(const a of cache.items){const definition=lootById.get(a?.id);if(!definition||!Number.isSafeInteger(a.count)||a.count<=0)continue;const existing=items.find(i=>i.id===a.id);const count=Math.min(100000,a.count);if(existing)existing.count=Math.min(100000,existing.count+count);else items.push({id:a.id,kind:definition.kind,count});}
  if(items.length){out.push({x:cache.x,y:cache.y,items});seen.add(key);}
 }return out;
}
// Credits and collectible drops do not occupy the drill's cargo. Cargo overflow stays in the cache.
export function collectBonusCache(cache,scene){
 const received=[];let free=Math.max(0,scene.cargoCapacity()-cargoCount(scene.cargoHold));
 for(const a of cache.items){const definition=lootById.get(a.id);if(!definition)continue;const count=a.kind==='material'?Math.min(a.count,free):a.count;if(!count)continue;
  if(a.kind==='material'){scene.cargoHold[a.id]=(scene.cargoHold[a.id]||0)+count;free-=count;}
  else if(a.kind==='credits')scene.credits+=count;
  else if(a.kind==='artifact')scene.artifacts[a.id]=(scene.artifacts[a.id]||0)+count;
  else{const bag=scene.floorNumber?scene.carriedLoot:scene.inventory;bag[a.kind]=(bag[a.kind]||0)+count;}
  a.count-=count;received.push({...definition,count});
 }
 cache.items=cache.items.filter(a=>a.count>0);scene.cargo=cargoCount(scene.cargoHold);return received;
}
export function formatBonusLoot(items){return items.map(a=>(lootById.get(a.id)?.name||a.id)+' ×'+a.count).join(' · ');}
