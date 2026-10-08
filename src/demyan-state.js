import { knowsBuildingBlueprint } from './building-blueprints.js';
import { CELL } from './base-state.js';
export const DEMYAN_SITE={x:35,y:31};
export const DEMYAN_ENTRANCE=[{x:32,y:29},{x:32,y:30},{x:32,y:31}];
export const DEMYAN_GUARDS=[{x:30,y:25},{x:34,y:25},{x:38,y:25},{x:40,y:27},{x:40,y:31},{x:40,y:36},{x:36,y:36},{x:32,y:36},{x:30,y:33},{x:30,y:29}];
export function demyanWall(x,y){return x>=32&&x<=38&&y>=27&&y<=34&&(x===32||x===38||y===27||y===34)&&!DEMYAN_ENTRANCE.some(p=>p.x===x&&p.y===y);}
export function demyanOpenCell(x,y){return (x>=33&&x<=37&&y>=28&&y<=33)||(x>=30&&x<=40&&y>=25&&y<=36&&(x<32||x>38||y<27||y>34));}
export const SENSOR_SITE={x:36,y:32};
export const SENSOR_GUARDS=[{x:32,y:28},{x:36,y:28},{x:40,y:28},{x:32,y:36},{x:36,y:36},{x:40,y:36}];
export function sensorOpenCell(x,y){return Math.abs(x-SENSOR_SITE.x)<=1&&Math.abs(y-SENSOR_SITE.y)<=1||SENSOR_GUARDS.some(p=>Math.abs(x-p.x)<=1&&Math.abs(y-p.y)<=1);}
export function canCollectSensor(q,rig,spiders=[]){return q.sensorBriefed&&!q.sensorCollected&&Math.hypot(rig.x-(SENSOR_SITE.x+.5)*CELL,rig.y-(SENSOR_SITE.y+.5)*CELL)<=90&&spiders.length===SENSOR_GUARDS.length&&spiders.every(s=>s.hp<=0);}
export const DEMYAN_STORIES=['demyanBrief','demyanContact','demyanEvac','demyanRescue','demyanReturn','hqReady','settlementBrief','settlementReady','sensorBrief','sensorReturn'];
export const HQ_RECIPE={earth:100,stone:60,iron:10};
export const HQ_MS=15000;
export const HQ_WIDTH=9,HQ_HEIGHT=8;
export function restoreDemyan(v={}){
 if(!v||typeof v!=='object')v={};
 const rescued=v.rescued===true,returned=rescued&&v.returned===true;
 const dialogue=DEMYAN_STORIES.includes(v.dialogue)&&!(returned&&['demyanBrief','demyanContact','demyanEvac','demyanRescue','demyanReturn'].includes(v.dialogue))?v.dialogue:null;
 return {briefed:v.briefed===true,contact:v.contact===true,evacuating:v.evacuating===true,
 evacuated:Number.isInteger(v.evacuated)?Math.max(0,Math.min(3,v.evacuated)):0,rescued,returned,
 settlementBriefed:returned&&v.hq===true&&v.settlementBriefed===true,settlementDone:returned&&v.hq===true&&v.settlementDone===true,
 sensorBriefed:returned&&v.settlementDone===true&&v.sensorBriefed===true,sensorCollected:returned&&v.sensorBriefed===true&&v.sensorCollected===true,sensorReturned:returned&&v.sensorCollected===true&&v.sensorReturned===true,
 hq:returned&&v.hq===true,plot:v.plot&&Number.isInteger(v.plot.x)&&Number.isInteger(v.plot.y)&&v.plot.x>=2&&v.plot.y>=2&&v.plot.x<=43&&v.plot.y<=43?{x:Math.min(48-HQ_WIDTH,v.plot.x),y:Math.min(48-HQ_HEIGHT,v.plot.y)}:null,
 remaining:returned&&!v.hq&&Number.isFinite(v.remaining)?Math.max(0,Math.min(HQ_MS,v.remaining)):null,
 dialogue,dialoguePage:dialogue&&Number.isInteger(v.dialoguePage)?Math.max(0,v.dialoguePage):0};
}
export function demyanGeometry(q){if(!q?.plot)return null;const {x,y}=q.plot;return {body:{x:(x+1)*CELL,y:(y+1)*CELL,width:7*CELL,height:6*CELL},deck:{x:(x+1)*CELL,y:(y+7)*CELL,width:7*CELL,height:CELL},footprint:{x:x*CELL,y:y*CELL,width:HQ_WIDTH*CELL,height:HQ_HEIGHT*CELL}};}
export function canEvacuateDemyan(q,world,spiders){return q.contact&&!q.rescued&&!q.evacuating&&DEMYAN_ENTRANCE.every(p=>!world.blocked(p.x,p.y))&&spiders.length===DEMYAN_GUARDS.length&&spiders.every(s=>s.hp<=0);}
export function beginHeadquarters(q,cargo,stock,blueprints=[]){
 if(!knowsBuildingBlueprint(blueprints,'hq')||!q.returned||q.hq||q.remaining!=null||!q.plot)return false;
 for(const [id,n] of Object.entries(HQ_RECIPE))if((cargo[id]||0)+(stock[id]||0)<n)return false;
 for(const [id,n] of Object.entries(HQ_RECIPE)){const used=Math.min(n,cargo[id]||0);cargo[id]=(cargo[id]||0)-used;stock[id]=(stock[id]||0)-(n-used);if(!cargo[id])delete cargo[id];if(!stock[id])delete stock[id];}
 q.remaining=HQ_MS;return true;
}
export function stepHeadquarters(q,ms){if(q.remaining==null)return false;q.remaining=Math.max(0,q.remaining-Math.max(0,Math.min(ms,50)));if(q.remaining)return false;q.remaining=null;q.hq=true;return true;}
