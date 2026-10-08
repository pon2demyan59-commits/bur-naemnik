import { demyanGeometry } from './demyan-state.js';
import { buildingGeometry, BUILDING_LABELS, validateBuildingMove } from './building-layout-state.js';
import { CELL } from './base-state.js';
import { writeSave } from './storage.js';
import { gameplayZoom } from './viewport-sync.js';
export const buildingLayoutMethods={
 buildingGeom(key){return buildingGeometry(this.buildingLayout||{},key,this.constructionQuest);},
 buildingDeck(key){return this.buildingGeom(key).deck;},
 buildingPoint(key){const d=this.buildingDeck(key);return {x:(d.x+d.width/2)/CELL-.5,y:(d.y+d.height/2)/CELL-.5};},
 occupiedBuildingGeometries(except){return ['lift','porodnik','workshop','armory','repair',...(this.constructionQuest?.warehouse||this.constructionQuest?.remaining!=null?['warehouse']:[])].filter(k=>k!==except).map(k=>this.buildingGeom(k)).concat(this.demyanQuest?.plot?[{...demyanGeometry(this.demyanQuest),kind:'hq'}]:[]);},
 movableBuildings(){return Object.entries({lift:this.liftReady(),porodnik:this.world.porodnikPowered,workshop:this.workshopQuest.ready,armory:this.armoryQuest.ready,repair:this.repairQuest.ready,warehouse:this.constructionQuest?.warehouse}).filter(([,ready])=>ready).map(([key])=>key);},
 makeBuildingEditor(){
  this.layoutGhostKey=null;this.layoutPointer=null;this.layoutSelected=null;this.layoutCandidate=null;
  this.layoutPreview=this.add.graphics().setDepth(40);this.layoutGhost=this.add.container(0,0).setDepth(40.5).setAlpha(.8).setVisible(false);this.layoutLabel=this.add.text(0,0,'',{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#fff1b1',backgroundColor:'#18362d',padding:{x:9,y:6}}).setOrigin(.5).setDepth(41).setVisible(false);
  const strip=document.createElement('div');strip.className='building-editor-strip';strip.hidden=true;
  const note=document.createElement('span');note.className='building-editor-note';note.setAttribute('role','status');note.textContent='Потяни здание. Пустое место — перемещение камеры.';
  const save=document.createElement('button'),cancel=document.createElement('button');save.className=cancel.className='hud-button';save.textContent='ПОДТВЕРДИТЬ';cancel.textContent='ОТМЕНА';save.disabled=true;const exit=document.createElement('button');exit.className='hud-button';exit.textContent='ГОТОВО';exit.addEventListener('click',()=>this.toggleBuildingEditor());strip.append(note,save,cancel,exit);document.querySelector('.base-hud').append(strip);this.layoutStrip=strip;this.layoutNote=note;this.layoutConfirm=save;
  save.addEventListener('click',()=>this.confirmBuildingMove());cancel.addEventListener('click',()=>this.cancelBuildingMove());
  const down=p=>{if(!this.layoutEditing||this.floorNumber||this.layoutPointer!=null)return;this.layoutPointer=p.id;const world=this.cameras.main.getWorldPoint(p.x,p.y);this.layoutStart={x:world.x,y:world.y,screenX:p.x,screenY:p.y,scrollX:this.cameras.main.scrollX,scrollY:this.cameras.main.scrollY};
   const key=this.movableBuildings().reverse().find(k=>{const f=this.buildingGeom(k).footprint;return world.x>=f.x&&world.x<=f.x+f.width&&world.y>=f.y&&world.y<=f.y+f.height;});
   if(key){this.layoutSelected=key;this.layoutOriginal=key==='warehouse'?{...(this.constructionQuest.offset||{dx:0,dy:0})}:{...(this.buildingLayout[key]||{dx:0,dy:0})};this.layoutCandidate={...this.layoutOriginal};this.drawBuildingCandidate();}
   else this.layoutSelected=null;
  };
  const move=p=>{if(!this.layoutEditing||p.id!==this.layoutPointer||!p.isDown)return;if(!this.layoutSelected){this.cameras.main.setScroll(this.layoutStart.scrollX-(p.x-this.layoutStart.screenX)/this.cameras.main.zoom,this.layoutStart.scrollY-(p.y-this.layoutStart.screenY)/this.cameras.main.zoom);return;}
   const world=this.cameras.main.getWorldPoint(p.x,p.y);this.layoutCandidate={dx:this.layoutOriginal.dx+Math.round((world.x-this.layoutStart.x)/CELL),dy:this.layoutOriginal.dy+Math.round((world.y-this.layoutStart.y)/CELL)};this.drawBuildingCandidate();};
  const up=p=>{if(p.id===this.layoutPointer)this.layoutPointer=null;};
  this.input.on('pointerdown',down);this.input.on('pointermove',move);this.input.on('pointerup',up);this.input.on('pointerupoutside',up);
  this.events.once('shutdown',()=>{this.input.off('pointerdown',down);this.input.off('pointermove',move);this.input.off('pointerup',up);this.input.off('pointerupoutside',up);this.layoutEditing=false;});
 },
 toggleBuildingEditor(){
  if(this.hqSelecting){this.finishHeadquartersPlacement();return;}
  if(this.layoutEditing){this.cancelBuildingMove();this.layoutEditing=false;this.layoutStrip.hidden=true;document.querySelector('.base-hud').classList.remove('layout-open');document.querySelector('#base-buildings').textContent='ПОСТРОЙКИ';this.cameras.main.startFollow(this.rig,true,.1,.1).setZoom(gameplayZoom(this.scale.width,this.scale.height));this.dialogClosed();return;}
  if(this.floorNumber||this.busy||this.storyActive||document.querySelector('#dialog').open||this.repairQuest.wave==='active'||this.repairQuest.serviceRemaining!=null||this.armoryQuest.serviceRemaining!=null||this.workshopQuest.serviceRemaining!=null||this.porodnikJob||this.constructionQuest.remaining!=null){this.notify('Перенос доступен на базе после завершения работ и боя.');return;}
  if(!this.movableBuildings().length){this.notify('Сначала восстанови постройку.');return;}
  this.dialogClosed();this.persist();this.layoutEditing=true;this.layoutStrip.hidden=false;document.querySelector('.base-hud').classList.add('layout-open');document.querySelector('#base-buildings').textContent='ВЫЙТИ';this.cameras.main.stopFollow();this.cameras.main.setZoom(Math.min(.72,this.cameras.main.zoom));
 },
 candidateGeometry(){const key=this.layoutSelected;if(!key)return null;return key==='warehouse'?buildingGeometry(this.buildingLayout,key,{...this.constructionQuest,offset:this.layoutCandidate}):buildingGeometry({...this.buildingLayout,[key]:this.layoutCandidate},key,this.constructionQuest);},
 drawBuildingCandidate(){
  const geometry=this.candidateGeometry();if(!geometry)return;const key=this.layoutSelected,g=this.layoutPreview,f=geometry.footprint;
  const error=validateBuildingMove(key,geometry,this.world,this.occupiedBuildingGeometries(key),this.rig);this.layoutError=error;this.layoutConfirm.disabled=!!error;this.layoutNote.textContent=error||'Место свободно. Подтверди перенос или потяни ещё.';
  g.clear();g.fillStyle(error?0xc75146:0x89c59b,.33);g.fillRoundedRect(f.x,f.y,f.width,f.height,10);g.lineStyle(4,error?0xff8667:0xd7ef9a);g.strokeRoundedRect(f.x,f.y,f.width,f.height,10);
  for(let x=f.x+CELL;x<f.x+f.width;x+=CELL){g.lineStyle(1,0xf3dc9c,.45);g.lineBetween(x,f.y,x,f.y+f.height);}for(let y=f.y+CELL;y<f.y+f.height;y+=CELL)g.lineBetween(f.x,y,f.x+f.width,y);
  const b=geometry.body;g.fillStyle(0x516e60,.8);g.fillRoundedRect(b.x+7,b.y+7,b.width-14,b.height-14,12);g.lineStyle(4,0xd7bc76);g.strokeRoundedRect(b.x+7,b.y+7,b.width-14,b.height-14,12);
  if(this.layoutGhostKey!==key){this.layoutGhost.removeAll(true);this.layoutGhostKey=key;const image=(texture,frame,x,y,w,h)=>{const art=this.add.image(x,y,texture,frame).setOrigin(0).setDisplaySize(w,h);this.layoutGhost.add(art);};
   if(['workshop','armory','repair'].includes(key)){const texture=key==='repair'?'repair-shop':key;image(texture,'roof',0,0,b.width,b.height);const d=geometry.deck;image(texture,'bay',d.x-b.x,d.y-b.y,d.width,d.height);}
   if(key==='porodnik'){image('porodnik','machine',0,0,b.width,b.height);const d=geometry.deck;image('porodnik','parking',d.x-b.x,d.y-b.y,d.width,d.height);}
   if(key==='lift')for(const art of [this.lift.platform,this.lift.ramp,...this.lift.parts])image('freight-lift',art.frame.name,art.x-b.x,art.y-b.y,art.displayWidth,art.displayHeight);
  }this.layoutGhost.setPosition(b.x,b.y).setVisible(true);this.layoutGhost.list.forEach(art=>art.setTint(error?0xffa59a:0xffffff));
  this.layoutLabel.setPosition(f.x+f.width/2,f.y-18).setText(BUILDING_LABELS[key]).setVisible(true);
 },
 cancelBuildingMove(){this.layoutSelected=null;this.layoutCandidate=null;this.layoutPointer=null;this.layoutPreview?.clear();this.layoutGhost?.setVisible(false);this.layoutLabel?.setVisible(false);if(this.layoutConfirm)this.layoutConfirm.disabled=true;if(this.layoutNote)this.layoutNote.textContent='Потяни здание. Пустое место — перемещение камеры.';},
 confirmBuildingMove(){
  if(!this.layoutEditing||!this.layoutSelected||!this.layoutCandidate)return;const key=this.layoutSelected,geom=this.candidateGeometry();const error=validateBuildingMove(key,geom,this.world,this.occupiedBuildingGeometries(key),this.rig);if(error){this.layoutNote.textContent=error;return;}
  const campaign=this.snapshotCampaign();if(key==='warehouse')campaign.constructionQuest.offset={...this.layoutCandidate};else campaign.buildingLayout={...campaign.buildingLayout,[key]:{...this.layoutCandidate}};
  if(!writeSave(campaign)){this.layoutNote.textContent='Не удалось сохранить. Постройка осталась на прежнем месте.';return;}
  this.leaving=true;this.scene.restart({save:{version:1,progress:campaign},layoutReturn:true});
 }
};
