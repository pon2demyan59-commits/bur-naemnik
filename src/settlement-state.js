import { CELL } from './base-state.js';
// Initial testing balance; two parallel projects unlock after HQ briefing.
export const SETTLEMENT_PROJECTS={
 housing:{name:'Жилой комплекс',leader:'Нина С.',role:'Комендант',width:5,height:5,plot:{x:8,y:15},recipe:{earth:200,stone:80,iron:20},duration:20000,description:'Жильё на 10 человек. Первые трое эвакуированных получат собственный дом.'},
 power:{name:'Электростанция',leader:'Денис Г.',role:'Электрик',width:4,height:4,plot:{x:40,y:38},recipe:{stone:120,iron:30,copper:10},duration:25000,description:'Электричество для будущих производств базы.'}
};
export function restoreSettlement(value={}){
 const out={};for(const [key,spec] of Object.entries(SETTLEMENT_PROJECTS)){const v=value?.[key]||{},p=v.plot,valid=p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=2&&p.y>=2&&p.x+spec.width<=48&&p.y+spec.height<=48;
 out[key]={plot:valid?{x:p.x,y:p.y}:null,built:!!valid&&v.built===true,remaining:valid&&v.built!==true&&Number.isFinite(v.remaining)?Math.max(0,Math.min(spec.duration,v.remaining)):null};}return out;
}
export function settlementGeometry(key,projects={},offset={}){const spec=SETTLEMENT_PROJECTS[key],p=projects[key]?.plot||spec.plot,x=(p.x+(offset.dx||0))*CELL,y=(p.y+(offset.dy||0))*CELL;return {body:{x,y,width:spec.width*CELL,height:(spec.height-1)*CELL},deck:{x:x+CELL,y:y+(spec.height-1)*CELL,width:(spec.width-2)*CELL,height:CELL},footprint:{x,y,width:spec.width*CELL,height:spec.height*CELL}};}
export function settlementObjectives(projects,construction){return [
 {key:'housing',name:'Построить жилой комплекс',done:projects.housing.built},
 {key:'power',name:'Построить электростанцию',done:projects.power.built},
 {key:'warehouse',name:'Улучшить склад до уровня 2',done:(construction.warehouseLevel||1)>=2}
];}
export function beginSettlementProject(projects,key,unlocked,cargo,stock){
 const q=projects[key],spec=SETTLEMENT_PROJECTS[key];if(!spec||!q||!unlocked||!q.plot||q.built||q.remaining!=null)return false;
 for(const [id,n] of Object.entries(spec.recipe))if((cargo[id]||0)+(stock[id]||0)<n)return false;
 for(const [id,n] of Object.entries(spec.recipe)){const used=Math.min(n,cargo[id]||0);cargo[id]=(cargo[id]||0)-used;stock[id]=(stock[id]||0)-(n-used);if(!cargo[id])delete cargo[id];if(!stock[id])delete stock[id];}
 q.remaining=spec.duration;return true;
}
export function stepSettlementProjects(projects,ms){const completed=[];for(const [key,q] of Object.entries(projects)){if(q.remaining==null)continue;q.remaining=Math.max(0,q.remaining-Math.max(0,Math.min(ms,50)));if(q.remaining===0){q.remaining=null;q.built=true;completed.push(key);}}return completed;}
export function snapshotSettlement(projects={}){return Object.fromEntries(Object.entries(projects).map(([key,q])=>[key,{...q,plot:q.plot?{...q.plot}:null}]));}
