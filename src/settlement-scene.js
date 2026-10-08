import { clampEditorZoom } from './editor-camera.js';
import { SETTLEMENT_PROJECTS, settlementObjectives, beginSettlementProject, stepSettlementProjects } from './settlement-state.js';
import { validateBuildingMove } from './building-layout-state.js';
import { CELL } from './base-state.js';
import { MATERIALS } from './materials.js';
import { cargoCount } from './cargo-state.js';
import { showGamePanel, showBuildingMenu } from './game-menus.js';
import { gameplayZoom } from './viewport-sync.js';
const materialName=id=>MATERIALS.find(m=>m.id===id)?.name||id;
export const settlementMethods={
 settlementUnlocked(){return !!this.demyanQuest?.hq&&!!this.demyanQuest?.settlementBriefed;},
 settlementTasks(){return settlementObjectives(this.baseProjects,this.constructionQuest);},
 makeSettlementProjects(){
  this.projectSelecting=null;if(this.floorNumber)return;
  this.projectArt=this.add.graphics().setDepth(2.5);this.projectPreview=this.add.graphics().setDepth(8);this.projectSigns={};
  for(const key of Object.keys(SETTLEMENT_PROJECTS))this.projectSigns[key]=this.add.text(0,0,key==='housing'?'ЖИЛОЙ КОМПЛЕКС':'ЭЛЕКТРОСТАНЦИЯ',{fontFamily:'Arial',fontSize:'14px',fontStyle:'bold',color:'#f5db91',backgroundColor:'#243b36',padding:{x:6,y:4}}).setOrigin(.5).setDepth(2.6).setVisible(false);
  this.renderSettlementProjects();
 },
 renderSettlementProjects(){
  if(!this.projectArt)return;const g=this.projectArt,p=this.projectPreview;g.clear();p.clear();
  for(const [key,q] of Object.entries(this.baseProjects)){const spec=SETTLEMENT_PROJECTS[key],geom=this.buildingGeom(key),b=geom.body,f=geom.footprint,d=geom.deck,sign=this.projectSigns[key];sign.setVisible(q.built);
   if(!q.plot)continue;
   if(!q.built&&q.remaining==null){p.lineStyle(2,0xd3bd79,.65);p.strokeRect(f.x,f.y,f.width,f.height);continue;}
   if(!q.built){g.fillStyle(0x59655b);g.fillRect(b.x+8,b.y+8,b.width-16,b.height-16);g.lineStyle(7,0xb6a477);g.strokeRect(b.x+12,b.y+12,b.width-24,b.height-24);for(let x=b.x+32;x<b.x+b.width;x+=48)g.lineBetween(x,b.y+16,x,b.y+b.height-16);g.fillStyle(0x1b302b);g.fillRect(d.x+8,d.y+23,d.width-16,12);g.fillStyle(0xd4b770);g.fillRect(d.x+8,d.y+23,(d.width-16)*(1-q.remaining/spec.duration),12);continue;}
   g.fillStyle(0x172d2b,.45);g.fillRoundedRect(b.x+8,b.y+12,b.width-10,b.height-8,12);g.fillStyle(key==='housing'?0x566e68:0x696b51);g.fillRoundedRect(b.x+4,b.y+6,b.width-8,b.height-15,10);g.lineStyle(4,0x273f3c);g.strokeRoundedRect(b.x+4,b.y+6,b.width-8,b.height-15,10);
   g.fillStyle(0x89988a);g.fillRoundedRect(b.x+8,b.y+6,b.width-16,40,7);g.lineStyle(2,0x455d56);for(let x=b.x+20;x<b.x+b.width-12;x+=28)g.lineBetween(x,b.y+12,x+8,b.y+39);
   if(key==='housing'){
    for(let row=0;row<3;row++)for(let col=0;col<5;col++){const x=b.x+24+col*55,y=b.y+63+row*49;g.fillStyle(0x233e3b);g.fillRoundedRect(x-4,y-4,38,32,4);g.fillStyle((col+row)%3?0xd8ad61:0x697f76);g.fillRect(x,y,30,24);g.lineStyle(3,0x50615a);g.lineBetween(x+15,y,x+15,y+24);g.lineBetween(x,y+12,x+30,y+12);}
    g.fillStyle(0x263d39);g.fillRoundedRect(b.x+b.width/2-32,b.y+b.height-52,64,45,5);g.fillStyle(0xb1ab83);g.fillRect(b.x+b.width/2-26,b.y+b.height-45,52,34);
   }else{
    for(let i=0;i<3;i++){const x=b.x+25+i*72,y=b.y+73;g.fillStyle(0x304a45);g.fillRoundedRect(x,y,60,82,12);g.fillStyle(0x9c9c76);g.fillEllipse(x+30,y+9,60,24);g.lineStyle(4,0x4f6253);g.strokeEllipse(x+30,y+9,48,16);g.fillStyle(0x182e2c);g.fillRoundedRect(x+11,y+33,38,29,4);g.fillStyle(0xd5bd74);g.fillRect(x+18,y+40,24,6);}
    g.fillStyle(0x233b35);g.fillRoundedRect(b.x+38,b.y+b.height-26,b.width-76,20,5);
   }
   for(const x of [b.x+11,b.x+b.width-20])for(let y=b.y+52;y<b.y+b.height-12;y+=48){g.fillStyle(0xb7a273);g.fillRoundedRect(x,y,9,21,2);}
   sign.setPosition(b.x+b.width/2,b.y+27);
  }this.makeBuildingFoundations();
 },
 updateSettlementProjects(ms){
  if(this.floorNumber)return;const working=Object.values(this.baseProjects).some(q=>q.remaining!=null),completed=stepSettlementProjects(this.baseProjects,ms);if(working)this.renderSettlementProjects();
  if(completed.length){for(const key of completed)this.notify(SETTLEMENT_PROJECTS[key].name.toUpperCase()+' · ГОТОВО');this.refreshHUD();this.persist();}
 },
 settlementAction(){if(this.floorNumber)return null;for(const [key,q] of Object.entries(this.baseProjects)){if(!q.built)continue;const d=this.buildingDeck(key);if(this.rig.x>=d.x&&this.rig.x<=d.x+d.width&&this.rig.y>=d.y&&this.rig.y<=d.y+d.height)return key;}return null;},
 interactSettlement(){const key=this.settlementAction();if(!key)return false;const spec=SETTLEMENT_PROJECTS[key],panel=document.createElement('div');panel.className='lift-console';const title=document.createElement('p');title.className='service-readout';title.textContent=spec.leader+' · '+spec.role;const note=document.createElement('p');note.className='terminal-note';note.textContent=key==='housing'?'Жилой комплекс готов. Вместимость — 10 человек. Размещены трое выживших, эвакуированных с Демьяном.':'Электростанция запущена. База готова подключать новые производства по мере открытия их чертежей.';panel.append(title,note);showGamePanel(spec.name.toUpperCase(),panel,key);return true;},
 addSettlementTaskList(panel){const list=document.createElement('div');list.className='settlement-task-list';for(const task of this.settlementTasks()){const p=document.createElement('p');p.className='settlement-task'+(task.done?' task-done':'');p.textContent=(task.done?'✓ ':'○ ')+task.name;list.append(p);}panel.append(list);},
 openSettlementConstruction(){
  this.dialogClosed();this.persist();const panel=document.createElement('div');panel.className='lift-console construction-controls';const title=document.createElement('p');title.className='service-readout';title.textContent='СТРОИТЕЛЬСТВО · '+this.credits+' КРЕДИТОВ';const note=document.createElement('p');note.className='terminal-note';note.textContent='Поручение «Обустроить убежище». Выбирай порядок сам. Материалы берём из груза и склада; для стройки расчисти площадку и проход минимум в одну клетку.';panel.append(title,note);this.addSettlementTaskList(panel);
  for(const [key,spec] of Object.entries(SETTLEMENT_PROJECTS)){const q=this.baseProjects[key],card=document.createElement('section');card.className='settlement-project-card';const heading=document.createElement('h3');heading.textContent=spec.name+' · '+spec.width+'×'+spec.height;const desc=document.createElement('p');desc.textContent=spec.description+' Руководитель: '+spec.leader;const cost=document.createElement('p');cost.className='terminal-note';cost.textContent=Object.entries(spec.recipe).map(([id,n])=>materialName(id)+' '+((this.cargoHold[id]||0)+(this.constructionQuest.stock[id]||0))+'/'+n).join(' · ');const status=document.createElement('p');status.className='service-status';status.textContent=q.built?'Построено':q.remaining!=null?'Строительство · '+Math.ceil(q.remaining/1000)+' с':this.settlementPlacementError(key)||'Площадка готова';const choose=document.createElement('button');choose.className='floor-button';choose.textContent='ВЫБРАТЬ МЕСТО';choose.disabled=!this.knowsBuildingBlueprint(key)||q.built||q.remaining!=null;choose.addEventListener('click',()=>this.startSettlementPlacement(key));const build=document.createElement('button');build.className='metal-button';build.textContent=q.built?'ГОТОВО':q.remaining!=null?'СТРОИТСЯ…':'ПОСТРОИТЬ · '+spec.duration/1000+' С';build.disabled=!this.knowsBuildingBlueprint(key)||q.built||q.remaining!=null||!!this.settlementPlacementError(key)||Object.entries(spec.recipe).some(([id,n])=>(this.cargoHold[id]||0)+(this.constructionQuest.stock[id]||0)<n);build.addEventListener('click',()=>this.buildSettlementProject(key));card.append(heading,desc,cost,status);this.addBuildingBlueprintPurchase(card,key,()=>this.openSettlementConstruction());card.append(choose,build);panel.append(card);}
  const warehouse=document.createElement('p');warehouse.className='terminal-note';warehouse.textContent='Склад улучшается у его ворот. Нужен уровень 2 или выше; повторное улучшение для задания не требуется.';panel.append(warehouse);showBuildingMenu('construction',panel);panel.parentElement.classList.add('settlement-layout');
 },
 settlementPlacementError(key){const q=this.baseProjects[key];if(!q.plot)return 'Выбери место на карте';return validateBuildingMove(key,this.buildingGeom(key),this.world,this.occupiedBuildingGeometries(key),this.rig);},
 buildSettlementProject(key){
  if(this.settlementPlacementError(key)||!beginSettlementProject(this.baseProjects,key,this.settlementUnlocked(),this.cargoHold,this.constructionQuest.stock,this.buildingBlueprints))return;
  this.cargo=cargoCount(this.cargoHold);this.renderSettlementProjects();this.refreshHUD();this.persist();document.querySelector('#dialog').close();this.notify('СТРОИТЕЛЬСТВО · '+SETTLEMENT_PROJECTS[key].name.toUpperCase());
 },
 startSettlementPlacement(key){
  if(!this.knowsBuildingBlueprint(key)||!this.settlementUnlocked()||this.baseProjects[key].built||this.baseProjects[key].remaining!=null)return;document.querySelector('#dialog').close();this.dialogClosed();this.projectSelecting=key;this.cameras.main.stopFollow().setZoom(clampEditorZoom(this.cameras.main,.55));document.querySelector('.base-hud').classList.add('layout-open');const strip=document.createElement('div');strip.className='building-editor-strip';const note=document.createElement('span');note.className='building-editor-note';note.textContent='Нажми на площадку для '+SETTLEMENT_PROJECTS[key].name+'. Потяни карту или используй WASD/стрелки · колёсико — масштаб.';const done=document.createElement('button');done.className='hud-button';done.textContent='ГОТОВО';strip.append(note,done);document.querySelector('.base-hud').append(strip);
  let pointer=null;const down=p=>{pointer=this.projectPanPointer={id:p.id,x:p.x,y:p.y,scrollX:this.cameras.main.scrollX,scrollY:this.cameras.main.scrollY};};const move=p=>{if(!pointer||p.id!==pointer.id||!p.isDown)return;this.cameras.main.setScroll(pointer.scrollX-(p.x-pointer.x)/this.cameras.main.zoom,pointer.scrollY-(p.y-pointer.y)/this.cameras.main.zoom);};const up=p=>{const a=pointer;pointer=this.projectPanPointer=null;if(!a||a.moved||p.id!==a.id||Math.hypot(p.x-a.x,p.y-a.y)>12)return;const point=this.cameras.main.getWorldPoint(p.x,p.y),x=Math.floor(point.x/CELL),y=Math.floor(point.y/CELL),spec=SETTLEMENT_PROJECTS[key];if(x<2||y<2||x+spec.width>48||y+spec.height>48){note.textContent='Площадка должна целиком помещаться внутри базы';return;}this.baseProjects[key].plot={x,y};delete this.buildingLayout[key];this.renderSettlementProjects();this.persist();note.textContent=this.settlementPlacementError(key)||'Место подходит. Вернись в меню для начала стройки.';};
  this.input.on('pointerdown',down);this.input.on('pointermove',move);this.input.on('pointerup',up);this.input.on('pointerupoutside',up);const cleanup=()=>{this.input.off('pointerdown',down);this.input.off('pointermove',move);this.input.off('pointerup',up);this.input.off('pointerupoutside',up);pointer=this.projectPanPointer=null;strip.remove();this.projectPlacementCleanup=null;};this.projectPlacementCleanup=cleanup;this.events.once('shutdown',cleanup);done.addEventListener('click',()=>this.finishSettlementPlacement());
 },
 finishSettlementPlacement(){this.projectPlacementCleanup?.();this.projectSelecting=null;document.querySelector('.base-hud').classList.remove('layout-open');this.cameras.main.startFollow(this.rig,true,.1,.1).setZoom(gameplayZoom(this.scale.width,this.scale.height));this.openSettlementConstruction();}
};
