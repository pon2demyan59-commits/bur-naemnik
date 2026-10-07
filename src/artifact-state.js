import { ARTIFACTS } from './artifact-catalog.js';
export const ARTIFACT_RESET_MS=24*60*60*1000;
const names=new Set(ARTIFACTS.map(a=>a.id));
export function restoreArtifacts(value={}){const result={};for(const [id,n] of Object.entries(value||{}))if(names.has(id)&&Number.isSafeInteger(n)&&n>0)result[id]=n;return result;}
// Seeded positions persist across reloads; refresh only when entering a floor after 24h.
export function restoreHiddenArtifacts(value,world,now=Date.now()){
 const catalog=ARTIFACTS.filter(a=>a.floor===world.floor);
 const saved=value&&Number.isFinite(value.created)&&value.created<=now&&now-value.created<ARTIFACT_RESET_MS&&Array.isArray(value.items)&&value.items.length===catalog.length&&catalog.every(a=>value.items.some(i=>i.id===a.id&&Number.isInteger(i.cell)&&i.cell>=0&&i.cell<2500&&typeof i.found==='boolean'));
 if(saved)return {created:value.created,items:value.items.map(i=>({...i}))};
 const candidates=[];for(let y=2;y<48;y++)for(let x=2;x<48;x++)if(world.blocked(x,y))candidates.push(y*50+x);
 // Exhausted old floors still need two hidden blocks for this feature. Reserve only
 // the missing artifact cells, away from the parked drill and quest/lift chambers.
 if(candidates.length<catalog.length){const cleared=world.cleared;world.cleared=new Set();for(let y=2;y<48;y++)for(let x=2;x<48;x++){const cell=y*50+x;if(world.blocked(x,y)&&!candidates.includes(cell)&&Math.abs(x-world.x)+Math.abs(y-world.y)>3)candidates.push(cell);}world.cleared=cleared;}
 let seed=(world.materialSeed^Math.floor(now/ARTIFACT_RESET_MS)^world.floor)>>>0;
 const items=catalog.map(a=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;const index=seed%candidates.length;const cell=candidates.length?candidates.splice(index,1)[0]:-1;if(cell>=0){world.cleared.delete(cell);world.damage.delete(cell);}return {id:a.id,cell,found:false};});
 return {created:now,items};
}
export function collectArtifact(hidden,collection,cell){const item=hidden?.items.find(i=>i.cell===cell&&!i.found);if(!item)return null;item.found=true;collection[item.id]=(collection[item.id]||0)+1;return ARTIFACTS.find(a=>a.id===item.id);}
