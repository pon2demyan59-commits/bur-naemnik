import { buildingGeometry, buildingDriveway, buildingPerimeterColliders, BUILDING_LABELS, buildingClearance, validateBuildingMove } from './building-layout-state.js';
import { CELL } from './base-state.js';
import { writeSave } from './storage.js';
import { gameplayZoom } from './viewport-sync.js';
export const buildingLayoutMethods={
 buildingGeom(key){return buildingGeometry(this.buildingLayout||{},key,this.constructionQuest,this.demyanQuest);},
 buildingDeck(key){return this.buildingGeom(key).deck;},
 buildingPoint(key){const d=this.buildingDeck(key);return {x:(d.x+d.width/2)/CELL-.5,y:(d.y+d.height/2)/CELL-.5};},
 occupiedBuildingGeometries(except){return this.existingBuildings().filter(k=>k!==except).map(k=>({...this.buildingGeom(k),kind:k}));},
 existingBuildings(){return Object.keys(BUILDING_LABELS).filter(k=>k==='warehouse'?this.constructionQuest?.warehouse||this.constructionQuest?.remaining!=null:k==='architect'?this.constructionQuest?.unlocked:k==='hq'?!!this.demyanQuest?.plot:['lift','porodnik','workshop','armory','repair'].includes(k)||!!this.buildingLayout?.[k]);},
 movableBuildings(){return this.existingBuildings().filter(k=>k!=='hq'||this.demyanQuest.hq);},
 questWorld(key){const o=this.buildingLayout?.[key]||{};return {blocked:(x,y)=>this.world.blocked(x+(o.dx||0),y+(o.dy||0))};},
 foundationGeometries(){return this.existingBuildings().filter(key=>key!=='hq'||this.demyanQuest?.hq||this.demyanQuest?.remaining!=null).map(key=>this.buildingGeom(key));},
 buildingFoundationSolids(){return this.floorNumber?[]:this.foundationGeometries().flatMap(geometry=>buildingPerimeterColliders(geometry));},
 makeBuildingFoundations(){
  if(this.floorNumber)return;const geometries=this.foundationGeometries(),signature=JSON.stringify(geometries);if(signature===this.foundationSignature&&this.buildingFoundations?.scene)return;this.buildingFoundations?.destroy();this.foundationSignature=signature;const g=this.add.graphics().setDepth(1.8);
  for(const geometry of geometries){const f=geometry.footprint,d=buildingDriveway(geometry);
   // Weathered poured concrete, flush with the bunker floor rather than a floating platform.
   g.fillStyle(0x74786e);g.fillRect(f.x,f.y,f.width,f.height);
   for(let y=0;y<f.height;y+=CELL)for(let x=0;x<f.width;x+=CELL){const seed=(Math.floor(x/CELL)*17+Math.floor(y/CELL)*31)%11,w=Math.min(CELL,f.width-x),h=Math.min(CELL,f.height-y);
    g.fillStyle(seed%2?0x96988b:0x555e58,.12);g.fillRect(f.x+x+2,f.y+y+2,Math.max(0,w-4),Math.max(0,h-4));
    for(let i=0;i<10;i++){const px=(seed*13+i*17)%Math.max(1,w-8),py=(seed*7+i*23)%Math.max(1,h-8);g.fillStyle(0xd1c9ae,.12);g.fillCircle(f.x+x+4+px,f.y+y+4+py,i%3?1:2);}
    if(seed===3||seed===7){g.lineStyle(1,0x35413d,.24);g.lineBetween(f.x+x+11,f.y+y+19,f.x+x+24,f.y+y+23);g.lineBetween(f.x+x+24,f.y+y+23,f.x+x+29,f.y+y+35);}
   }
   g.lineStyle(1,0x394540,.5);for(let x=f.x+2*CELL;x<f.x+f.width;x+=2*CELL)g.lineBetween(x,f.y+4,x,f.y+f.height-4);for(let y=f.y+2*CELL;y<f.y+f.height;y+=2*CELL)g.lineBetween(f.x+4,y,f.x+f.width-4,y);
   g.fillStyle(0x394741,.28);g.fillRect(d.x,d.y,d.width,d.height);
   g.lineStyle(5,0x424e47);g.lineBetween(f.x+3,f.y+3,f.x+f.width-3,f.y+3);g.lineBetween(f.x+3,f.y+3,f.x+3,f.y+f.height-3);g.lineBetween(f.x+f.width-3,f.y+3,f.x+f.width-3,f.y+f.height-3);
   g.lineStyle(2,0xb7b49a,.7);g.lineBetween(f.x+7,f.y+7,f.x+f.width-7,f.y+7);g.lineBetween(f.x+7,f.y+7,f.x+7,f.y+f.height-7);g.lineBetween(f.x+f.width-7,f.y+7,f.x+f.width-7,f.y+f.height-7);
   g.lineStyle(5,0x424e47);if(d.x>f.x)g.lineBetween(f.x+3,f.y+f.height-3,d.x,f.y+f.height-3);if(d.x+d.width<f.x+f.width)g.lineBetween(d.x+d.width,f.y+f.height-3,f.x+f.width-3,f.y+f.height-3);
   g.lineStyle(3,0xbbaa76,.7);for(let y=d.y+8;y<d.y+d.height-6;y+=26){g.lineBetween(d.x+5,y,d.x+5,Math.min(y+12,d.y+d.height-6));g.lineBetween(d.x+d.width-5,y,d.x+d.width-5,Math.min(y+12,d.y+d.height-6));}
  }this.buildingFoundations=g;
 },
 makeBuildingEditor(){
  this.layoutGhostKey=null;this.layoutPointer=null;this.layoutSelected=null;this.layoutCandidate=null;
  this.layoutPreview=this.add.graphics().setDepth(40);this.layoutGhost=this.add.container(0,0).setDepth(40.5).setAlpha(.8).setVisible(false);this.layoutLabel=this.add.text(0,0,'',{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#fff1b1',backgroundColor:'#18362d',padding:{x:9,y:6}}).setOrigin(.5).setDepth(41).setVisible(false);
  const strip=document.createElement('div');strip.className='building-editor-strip';strip.hidden=true;
  const note=document.createElement('span');note.className='building-editor-note';note.setAttribute('role','status');note.textContent='Потяни здание. Между постройками — минимум одна свободная клетка.';
  const save=document.createElement('button'),cancel=document.createElement('button');save.className=cancel.className='hud-button';save.textContent='ПОДТВЕРДИТЬ';cancel.textContent='ОТМЕНА';save.disabled=true;const exit=document.createElement('button');exit.className='hud-button';exit.textContent='ГОТОВО';exit.addEventListener('click',()=>this.toggleBuildingEditor());strip.append(note,save,cancel,exit);document.querySelector('.base-hud').append(strip);this.layoutStrip=strip;this.layoutNote=note;this.layoutConfirm=save;
  save.addEventListener('click',()=>this.confirmBuildingMove());cancel.addEventListener('click',()=>this.cancelBuildingMove());
  const down=p=>{if(!this.layoutEditing||this.floorNumber||this.layoutPointer!=null)return;this.layoutPointer=p.id;const world=this.cameras.main.getWorldPoint(p.x,p.y);this.layoutStart={x:world.x,y:world.y,screenX:p.x,screenY:p.y,scrollX:this.cameras.main.scrollX,scrollY:this.cameras.main.scrollY};
   const key=this.movableBuildings().reverse().find(k=>{const f=this.buildingGeom(k).footprint;return world.x>=f.x&&world.x<=f.x+f.width&&world.y>=f.y&&world.y<=f.y+f.height;});
   if(key){this.layoutSelected=key;this.layoutOriginal=key==='warehouse'?{...(this.constructionQuest.offset||{dx:0,dy:0})}:key==='hq'?{dx:0,dy:0}:{...(this.buildingLayout[key]||{dx:0,dy:0})};this.layoutCandidate={...this.layoutOriginal};this.drawBuildingCandidate();}
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
  if(this.floorNumber||this.busy||this.storyActive||document.querySelector('#dialog').open||this.repairQuest.wave==='active'||this.repairQuest.serviceRemaining!=null||this.armoryQuest.serviceRemaining!=null||this.workshopQuest.serviceRemaining!=null||this.porodnikJob||this.constructionQuest.remaining!=null||this.demyanQuest.remaining!=null){this.notify('Перенос доступен на базе после завершения работ и боя.');return;}
  if(!this.movableBuildings().length){this.notify('Сначала восстанови постройку.');return;}
  this.dialogClosed();this.persist();this.layoutEditing=true;this.layoutStrip.hidden=false;document.querySelector('.base-hud').classList.add('layout-open');document.querySelector('#base-buildings').textContent='ВЫЙТИ';this.cameras.main.stopFollow();this.cameras.main.setZoom(Math.min(.72,this.cameras.main.zoom));
 },
 candidateGeometry(){const key=this.layoutSelected;if(!key)return null;return key==='warehouse'?buildingGeometry(this.buildingLayout,key,{...this.constructionQuest,offset:this.layoutCandidate}):buildingGeometry({...this.buildingLayout,[key]:this.layoutCandidate},key,this.constructionQuest,this.demyanQuest);},
 drawBuildingCandidate(){
  const geometry=this.candidateGeometry();if(!geometry)return;const key=this.layoutSelected,g=this.layoutPreview,f=geometry.footprint;
  const error=validateBuildingMove(key,geometry,this.world,this.occupiedBuildingGeometries(key),this.rig);this.layoutError=error;this.layoutConfirm.disabled=!!error;this.layoutNote.textContent=error||'Место свободно. Подтверди перенос или потяни ещё.';
  g.clear();g.fillStyle(error?0xc75146:0x89c59b,.33);g.fillRoundedRect(f.x,f.y,f.width,f.height,10);g.lineStyle(4,error?0xff8667:0xd7ef9a);g.strokeRoundedRect(f.x,f.y,f.width,f.height,10);
  for(let x=f.x+CELL;x<f.x+f.width;x+=CELL){g.lineStyle(1,0xf3dc9c,.45);g.lineBetween(x,f.y,x,f.y+f.height);}for(let y=f.y+CELL;y<f.y+f.height;y+=CELL)g.lineBetween(f.x,y,f.x+f.width,y);
  const b=geometry.body;g.fillStyle(0x516e60,.8);g.fillRoundedRect(b.x+7,b.y+7,b.width-14,b.height-14,12);g.lineStyle(4,0xd7bc76);g.strokeRoundedRect(b.x+7,b.y+7,b.width-14,b.height-14,12);
  if(this.layoutGhostKey!==key){this.layoutGhost.removeAll(true);this.layoutGhostKey=key;const image=(texture,frame,x,y,w,h)=>{const art=this.add.image(x,y,texture,frame).setOrigin(0).setDisplaySize(w,h);this.layoutGhost.add(art);};
   if(['workshop','armory','repair'].includes(key)){const texture=key==='repair'?'repair-shop':key;image(texture,'roof',0,0,b.width,b.height);const d=geometry.deck;image(texture,'bay',d.x-b.x,d.y-b.y,d.width,d.height);}
   if(['warehouse','architect','hq'].includes(key)){const texture={warehouse:'warehouse-house',architect:'architect-house',hq:'headquarters'}[key];image(texture,undefined,0,0,b.width,key==='hq'?b.height+CELL:f.height);}
   if(key==='porodnik'){image('porodnik','machine',0,0,b.width,b.height);const d=geometry.deck;image('porodnik','parking',d.x-b.x,d.y-b.y,d.width,d.height);}
   if(key==='lift')for(const art of [this.lift.platform,this.lift.ramp,...this.lift.parts])image('freight-lift',art.frame.name,art.x-b.x,art.y-b.y,art.displayWidth,art.displayHeight);
  }this.layoutGhost.setPosition(b.x,b.y).setVisible(true);this.layoutGhost.list.forEach(art=>art.setTint(error?0xffa59a:0xffffff));
  this.layoutLabel.setPosition(f.x+f.width/2,f.y-18).setText(BUILDING_LABELS[key]).setVisible(true);
 },
 cancelBuildingMove(){this.layoutSelected=null;this.layoutCandidate=null;this.layoutPointer=null;this.layoutPreview?.clear();this.layoutGhost?.setVisible(false);this.layoutLabel?.setVisible(false);if(this.layoutConfirm)this.layoutConfirm.disabled=true;if(this.layoutNote)this.layoutNote.textContent='Потяни здание. Между постройками — минимум одна свободная клетка.';},
 confirmBuildingMove(){
  if(!this.layoutEditing||!this.layoutSelected||!this.layoutCandidate)return;const key=this.layoutSelected,geom=this.candidateGeometry();const error=validateBuildingMove(key,geom,this.world,this.occupiedBuildingGeometries(key),this.rig);if(error){this.layoutNote.textContent=error;return;}
  const campaign=this.snapshotCampaign();if(key==='warehouse')campaign.constructionQuest.offset={...this.layoutCandidate};else if(key==='hq'){campaign.demyanQuest.plot={x:this.demyanQuest.plot.x+this.layoutCandidate.dx,y:this.demyanQuest.plot.y+this.layoutCandidate.dy};delete campaign.buildingLayout.hq;}else campaign.buildingLayout={...campaign.buildingLayout,[key]:{...this.layoutCandidate}};
  campaign.cleared ||= [];
  const area=buildingClearance(geom.footprint);for(let y=Math.floor(area.y/CELL);y<Math.ceil((area.y+area.height)/CELL);y++)for(let x=Math.floor(area.x/CELL);x<Math.ceil((area.x+area.width)/CELL);x++)if(x>=2&&y>=2&&x<48&&y<48&&!campaign.cleared.includes(y*50+x))campaign.cleared.push(y*50+x);
  if(!writeSave(campaign)){this.layoutNote.textContent='Не удалось сохранить. Постройка осталась на прежнем месте.';return;}
  this.leaving=true;this.scene.restart({save:{version:1,progress:campaign},layoutReturn:true});
 }
};
