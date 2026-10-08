import test from 'node:test';
import assert from 'node:assert/strict';
import { discoveryMethods, discoveryDetails, DISCOVERY_COLORS } from '../src/discovery-banner.js';
import { constructionMethods } from '../src/construction-scene.js';
import { restoreConstruction, ARCHITECT_FOOTPRINT } from '../src/construction-state.js';
import { demyanGeometry, restoreDemyan } from '../src/demyan-state.js';
import { buildingGeometry, rectanglesOverlap } from '../src/building-layout-state.js';
import { BaseWorld } from '../src/base-state.js';
function bannerScene(){
 const nodes=[];function node(tag){const n={tag,children:[],dataset:{},listeners:{},style:{setProperty(){}},append(...v){this.children.push(...v);},setAttribute(){},addEventListener(k,f){this.listeners[k]=f;},removeEventListener(k){delete this.listeners[k];},showModal(){this.open=true;},focus(){},remove(){this.removed=true;}};nodes.push(n);return n;}
 const ui=node('ui'),doc={activeElement:null,createElement:node,querySelector:()=>ui,addEventListener(){},removeEventListener(){}};globalThis.document=doc;
 const events=new Map();const s={...discoveryMethods,discoveryQueue:[],discoveryCards:[],input:{enabled:true},events:{once:(k,f)=>events.set(k,f),off:()=>events.clear()},pauseCount:0,resumeCount:0,scene:{pause(){s.pauseCount++;},resume(){s.resumeCount++;}},dialogClosed(){},persist(){},playDiscoveryFanfare(){}};return {s,nodes,events};
}
test('queued discoveries freeze gameplay until all are acknowledged, then resume once',()=>{
 const {s,nodes}=bannerScene();s.showDiscovery({kind:'artifact',name:'Последняя искра',rarity:1});assert.equal(s.input.enabled,false);assert.equal(s.pauseCount,1);assert.equal(s.discoveryActive,true);
 s.showKeycardDiscovery(5);s.showBonusBoxDiscovery('Тайник','Получено 10 кредитов');assert.equal(nodes.filter(n=>n.tag==='dialog').length,1);
 const next=()=>nodes.filter(n=>n.tag==='button').at(-1).listeners.click();next();assert.equal(s.resumeCount,0);assert.equal(s.input.enabled,false);assert.equal(s.discoveryActive,true);next();assert.equal(s.resumeCount,0);next();assert.equal(s.resumeCount,1);assert.equal(s.input.enabled,true);assert.equal(s.discoveryActive,false);next();assert.equal(s.resumeCount,1);
 assert.equal(s.showKeycardDiscovery(5),false);assert.equal(s.resumeCount,1);
});
test('shutdown removes active discovery without resuming a scene that is going away',()=>{
 const {s,nodes,events}=bannerScene();s.showDiscovery({kind:'crate',name:'Комплект'});events.get('shutdown')();assert.equal(s.resumeCount,0);assert.equal(s.discoveryActive,false);assert.equal(nodes.find(n=>n.tag==='dialog').removed,true);
});
test('ten artifact rarity tiers and keycard floor labels are preserved in banners',()=>{
 assert.equal(new Set(DISCOVERY_COLORS).size,10);for(let r=1;r<=10;r++){const d=discoveryDetails({kind:'artifact',name:'Артефакт',rarity:r});assert.ok(d.description.includes(r+'/10'));assert.equal(d.color,DISCOVERY_COLORS[r-1]);}
 assert.equal(discoveryDetails({kind:'keycard',floor:5}).name,'Карта 5-го этажа');assert.equal(discoveryDetails({kind:'crate'}).name,'Бонусный ящик');
});
test('expanded architect footprint migrates overlapping warehouse and HQ without losing stock or timer',()=>{
 const q=restoreConstruction({rescued:true,unlocked:true,warehouse:true,plot:0,offset:{dx:0,dy:6},stock:{earth:73,iron:8},warehouseLevel:4}),head=restoreDemyan({rescued:true,returned:true,plot:{x:25,y:25},remaining:8000}),world=new BaseWorld();
 const s={floorNumber:0,constructionQuest:q,demyanQuest:head,buildingLayout:{},world,buildingGeom(key){return buildingGeometry(this.buildingLayout,key,q);}};
 constructionMethods.migrateArchitectFootprint.call(s);assert.equal(rectanglesOverlap(s.buildingGeom('warehouse').footprint,ARCHITECT_FOOTPRINT),false);assert.equal(rectanglesOverlap(demyanGeometry(head).footprint,ARCHITECT_FOOTPRINT),false);assert.deepEqual(q.stock,{earth:73,iron:8});assert.equal(q.warehouseLevel,4);assert.equal(head.remaining,8000);const before=JSON.stringify({plot:head.plot,offset:q.offset});constructionMethods.migrateArchitectFootprint.call(s);assert.equal(JSON.stringify({plot:head.plot,offset:q.offset}),before);
});
