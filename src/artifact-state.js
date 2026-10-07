import { ARTIFACTS } from './artifact-catalog.js';
export const ARTIFACT_DROP_FLOORS=[1,25,50,75,100];
// Approved 2026-10-08. Percent per player-destroyed block, for a whole rarity.
export const ARTIFACT_DROP_BASE_PERCENT=[.1,.01,.005,.002,.001,.0005,.0002,.0001,.00005,.00001];
const names=new Set(ARTIFACTS.map(a=>a.id));
export function restoreArtifacts(value={}){const result={};for(const [id,n] of Object.entries(value||{}))if(names.has(id)&&Number.isSafeInteger(n)&&n>0)result[id]=n;return result;}
export function artifactRarity(id){const index=ARTIFACTS.findIndex(a=>a.id===id);return index<0?0:Math.floor(index/20)+1;}
export function artifactDropChance(rarity,floor){
 if(!Number.isInteger(rarity)||rarity<1||rarity>10||!Number.isFinite(floor)||floor<1)return 0;
 const f=Math.min(100,floor);let factor=1;
 for(let i=1;i<ARTIFACT_DROP_FLOORS.length;i++)if(f<=ARTIFACT_DROP_FLOORS[i]){factor=i+(f-ARTIFACT_DROP_FLOORS[i-1])/(ARTIFACT_DROP_FLOORS[i]-ARTIFACT_DROP_FLOORS[i-1]);break;}
 return ARTIFACT_DROP_BASE_PERCENT[rarity-1]*(rarity===1?1:factor);
}
export function rollArtifactDrop(floor,random=Math.random){
 if(!Number.isFinite(floor)||floor<1)return null;
 const roll=random();if(!Number.isFinite(roll)||roll<0||roll>=1)return null;
 let threshold=0;
 for(let rarity=1;rarity<=10;rarity++){
  threshold+=artifactDropChance(rarity,floor)/100;
  if(roll<threshold){const itemRoll=random();if(!Number.isFinite(itemRoll)||itemRoll<0||itemRoll>=1)return null;return ARTIFACTS[(rarity-1)*20+Math.floor(itemRoll*20)];}
 }
 return null;
}
export function awardArtifactDrop(collection,floor,random=Math.random){const artifact=rollArtifactDrop(floor,random);if(artifact)collection[artifact.id]=(collection[artifact.id]||0)+1;return artifact;}
