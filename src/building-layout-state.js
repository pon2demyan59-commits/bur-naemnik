import { demyanGeometry } from './demyan-state.js';
import { CELL } from './base-state.js';
import { LIFT, liftGeometry } from './lift-state.js';
import { PORODNIK_MACHINE, PORODNIK_DECK, PORODNIK_COLLIDER } from './porodnik-state.js';
import { WORKSHOP_BODY, WORKSHOP_DECK } from './workshop-state.js';
import { ARMORY_BODY, ARMORY_DECK } from './armory-state.js';
import { REPAIR_BODY, REPAIR_DECK } from './repair-state.js';
import { warehouseBody, warehouseDeck, ARCHITECT_BODY, ARCHITECT_DECK } from './construction-state.js';
export const BUILDING_LABELS={lift:'Лифт',porodnik:'Породник',workshop:'Мастерская',armory:'Оружейная',repair:'Ремонтный цех',warehouse:'Склад',architect:'Дом архитектора',hq:'Штаб'};
export function restoreBuildingLayout(value={}){const out={};for(const key of Object.keys(BUILDING_LABELS)){const p=value?.[key];if(p&&Number.isInteger(p.dx)&&Number.isInteger(p.dy)&&Math.abs(p.dx)<=45&&Math.abs(p.dy)<=45)out[key]={dx:p.dx,dy:p.dy};}return out;}
export function registerBuildingType(key,label,geometry){BUILDING_LABELS[key]=label;BUILDING_GEOMETRIES[key]=geometry;}
const BUILDING_GEOMETRIES={};
const shifted=(rect,dx,dy)=>({...rect,x:rect.x+dx*CELL,y:rect.y+dy*CELL});
export function buildingGeometry(layout={},key,construction={plot:0},head={}){
 const o=key==='warehouse'?(construction.offset||{}):(layout[key]||{}),dx=o.dx||0,dy=o.dy||0;
 if(key==='hq')return demyanGeometry({...head,plot:head.plot?{x:head.plot.x+dx,y:head.plot.y+dy}:null});
 if(BUILDING_GEOMETRIES[key])return BUILDING_GEOMETRIES[key]({layout,construction,head,offset:{dx,dy},CELL});
 if(key==='lift'){const center={x:LIFT.x+dx,y:LIFT.y+dy},g=liftGeometry(center);return {center,body:{x:(center.x-3)*CELL,y:(center.y-3)*CELL,width:7*CELL,height:7*CELL},deck:g.deck,colliders:g.colliders,footprint:{x:(center.x-3)*CELL,y:(center.y-3)*CELL,width:7*CELL,height:7*CELL}};}
 let body,deck,collider;
 if(key==='warehouse'){body=warehouseBody(construction);deck=warehouseDeck(construction);collider=body;}
 else{const specs={porodnik:[PORODNIK_MACHINE,PORODNIK_DECK,PORODNIK_COLLIDER],workshop:[WORKSHOP_BODY,WORKSHOP_DECK],armory:[ARMORY_BODY,ARMORY_DECK],repair:[REPAIR_BODY,REPAIR_DECK],architect:[ARCHITECT_BODY,ARCHITECT_DECK]};const spec=specs[key];if(!spec)throw Error('Unknown building');body=shifted(spec[0],dx,dy);deck=shifted(spec[1],dx,dy);collider=shifted(spec[2]||spec[0],dx,dy);}
 const x=Math.min(body.x,deck.x),y=Math.min(body.y,deck.y),right=Math.max(body.x+body.width,deck.x+deck.width),bottom=Math.max(body.y+body.height,deck.y+deck.height);
 return {body,deck,collider,footprint:{x,y,width:right-x,height:bottom-y}};
}
// The loading lane reaches the south edge; all other foundation areas are reserved.
export function buildingDriveway(geometry){
 if(geometry.driveway)return geometry.driveway;
 const f=geometry.footprint,d=geometry.deck;
 return {x:d.x,y:d.y,width:d.width,height:Math.max(d.height,f.y+f.height-d.y)};
}
export function buildingPerimeterColliders(geometry){
 const f=geometry.footprint,d=buildingDriveway(geometry),left=Math.max(f.x,d.x),right=Math.min(f.x+f.width,d.x+d.width),top=Math.max(f.y,d.y),bottom=Math.min(f.y+f.height,d.y+d.height);
 return [
  {x:f.x,y:f.y,width:f.width,height:top-f.y},
  {x:f.x,y:top,width:left-f.x,height:bottom-top},
  {x:right,y:top,width:f.x+f.width-right,height:bottom-top},
  {x:f.x,y:bottom,width:f.width,height:f.y+f.height-bottom}
 ].filter(r=>r.width>0&&r.height>0);
}
export const rectanglesOverlap=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
export const buildingClearance=f=>({x:f.x-CELL,y:f.y-CELL,width:f.width+2*CELL,height:f.height+2*CELL});
export function validateBuildingMove(key,geometry,world,others,rig){
 const f=geometry.footprint;
 if(f.x<2*CELL||f.y<2*CELL||f.x+f.width>48*CELL||f.y+f.height>48*CELL)return 'Слишком близко к стене бункера';
 for(let y=Math.floor(f.y/CELL);y<Math.ceil((f.y+f.height)/CELL);y++)for(let x=Math.floor(f.x/CELL);x<Math.ceil((f.x+f.width)/CELL);x++)if(world.blocked(x,y))return 'Сначала расчисти место буром';
 if(others.some(g=>rectanglesOverlap(f,g.footprint)))return 'Здесь другая постройка или её площадка';
 const passage=buildingClearance(f);
 if(others.some(g=>rectanglesOverlap(passage,g.footprint)))return 'Оставь проход минимум в одну клетку между зданиями';
 const entrance={x:20*CELL,y:6*CELL,width:10*CELL,height:5*CELL};
 if(rectanglesOverlap(passage,entrance))return 'Оставь свободным вход в бункер';
 for(let y=Math.floor(passage.y/CELL);y<Math.ceil((passage.y+passage.height)/CELL);y++)for(let x=Math.floor(passage.x/CELL);x<Math.ceil((passage.x+passage.width)/CELL);x++)if(x>=2&&y>=2&&x<48&&y<48&&world.blocked(x,y))return 'Расчисти проход шириной одну клетку вокруг здания';
 if(rig&&[...(geometry.colliders||[geometry.collider||geometry.body]),...buildingPerimeterColliders(geometry)].some(rect=>rectanglesOverlap(rect,{x:rig.x-30,y:rig.y-30,width:60,height:60})))return 'Бур стоит на месте постройки';
 return null;
}
