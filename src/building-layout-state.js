import { CELL } from './base-state.js';
import { LIFT, liftGeometry } from './lift-state.js';
import { PORODNIK_MACHINE, PORODNIK_DECK, PORODNIK_COLLIDER } from './porodnik-state.js';
import { WORKSHOP_BODY, WORKSHOP_DECK } from './workshop-state.js';
import { ARMORY_BODY, ARMORY_DECK } from './armory-state.js';
import { REPAIR_BODY, REPAIR_DECK } from './repair-state.js';
import { warehouseBody, warehouseDeck } from './construction-state.js';
export const BUILDING_LABELS={lift:'Лифт',porodnik:'Породник',workshop:'Мастерская',armory:'Оружейная',repair:'Ремонтный цех',warehouse:'Склад'};
export function restoreBuildingLayout(value={}){const out={};for(const key of ['lift','porodnik','workshop','armory','repair']){const p=value?.[key];if(p&&Number.isInteger(p.dx)&&Number.isInteger(p.dy)&&Math.abs(p.dx)<=45&&Math.abs(p.dy)<=45)out[key]={dx:p.dx,dy:p.dy};}return out;}
const shifted=(rect,dx,dy)=>({...rect,x:rect.x+dx*CELL,y:rect.y+dy*CELL});
export function buildingGeometry(layout={},key,construction={plot:0}){
 const o=key==='warehouse'?(construction.offset||{}):(layout[key]||{}),dx=o.dx||0,dy=o.dy||0;
 if(key==='lift'){const center={x:LIFT.x+dx,y:LIFT.y+dy},g=liftGeometry(center);return {center,body:{x:(center.x-3)*CELL,y:(center.y-3)*CELL,width:7*CELL,height:7*CELL},deck:g.deck,colliders:g.colliders,footprint:{x:(center.x-3)*CELL,y:(center.y-3)*CELL,width:7*CELL,height:7*CELL}};}
 let body,deck,collider;
 if(key==='warehouse'){body=warehouseBody(construction);deck=warehouseDeck(construction);collider=body;}
 else{const specs={porodnik:[PORODNIK_MACHINE,PORODNIK_DECK,PORODNIK_COLLIDER],workshop:[WORKSHOP_BODY,WORKSHOP_DECK],armory:[ARMORY_BODY,ARMORY_DECK],repair:[REPAIR_BODY,REPAIR_DECK]};const spec=specs[key];if(!spec)throw Error('Unknown building');body=shifted(spec[0],dx,dy);deck=shifted(spec[1],dx,dy);collider=shifted(spec[2]||spec[0],dx,dy);}
 const x=Math.min(body.x,deck.x),y=Math.min(body.y,deck.y),right=Math.max(body.x+body.width,deck.x+deck.width),bottom=Math.max(body.y+body.height,deck.y+deck.height);
 return {body,deck,collider,footprint:{x,y,width:right-x,height:bottom-y}};
}
export const rectanglesOverlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export function validateBuildingMove(key,geometry,world,others,rig){
 const f=geometry.footprint;
 if(f.x<2*CELL||f.y<2*CELL||f.x+f.width>48*CELL||f.y+f.height>48*CELL)return 'Слишком близко к стене бункера';
 for(let y=Math.floor(f.y/CELL);y<Math.ceil((f.y+f.height)/CELL);y++)for(let x=Math.floor(f.x/CELL);x<Math.ceil((f.x+f.width)/CELL);x++)if(world.blocked(x,y))return 'Сначала расчисти место буром';
 if(others.some(g=>rectanglesOverlap(f,g.footprint)))return 'Здесь другая постройка или её площадка';
 const fixed=[{x:20*CELL,y:6*CELL,width:10*CELL,height:5*CELL},{x:21*CELL,y:23*CELL,width:3*CELL,height:2*CELL}];
 if(fixed.some(r=>rectanglesOverlap(f,r)))return 'Оставь свободным вход и стол с чертежами';
 if(rig&&rectanglesOverlap(key==='lift'?f:geometry.body,{x:rig.x-30,y:rig.y-30,width:60,height:60}))return 'Бур стоит на месте постройки';
 return null;
}
