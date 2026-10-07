import { COLLECTIONS } from './collection-catalog.js';
import { restoreArtifacts } from './artifact-state.js';
export function restoreClosedCollections(value){return [...new Set((Array.isArray(value)?value:[]).filter(id=>Number.isInteger(id)&&id>=1&&id<=COLLECTIONS.length))].sort((a,b)=>a-b);}
export function collectionBuffTotals(closed){const ids=new Set(restoreClosedCollections(closed)),totals={drill:0,weapon:0,speed:0,defense:0,cargo:0,sale:0};for(const c of COLLECTIONS)if(ids.has(c.id))totals[c.effect]+=c.buff;return totals;}
export function collectionCargoCapacity(closed){return Math.floor(200*(1+collectionBuffTotals(closed).cargo)+1e-8);}
export function collectionProgress(c,artifacts,closed=[]){const done=closed.includes(c.id),found=c.artifacts.filter(id=>(artifacts[id]||0)>0).length;return {done,found,total:c.artifacts.length,ready:!done&&found===c.artifacts.length};}
export function prepareCollectionClose(id,artifacts,closed){const c=COLLECTIONS.find(c=>c.id===id);if(!c)return null;const owned=restoreArtifacts(artifacts),completed=restoreClosedCollections(closed);if(!collectionProgress(c,owned,completed).ready)return null;for(const key of c.artifacts){owned[key]--;if(!owned[key])delete owned[key];}return {artifacts:owned,closedCollections:restoreClosedCollections([...completed,id]),collection:c};}
