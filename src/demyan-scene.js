import { clampEditorZoom } from './editor-camera.js';
import { readSettings } from './storage.js';
import { ARCHITECT_FOOTPRINT } from './construction-state.js';
import { DEMYAN_SITE, DEMYAN_ENTRANCE, DEMYAN_GUARDS, SENSOR_SITE, canCollectSensor, demyanWall, HQ_RECIPE, HQ_WIDTH, HQ_HEIGHT, demyanGeometry, canEvacuateDemyan, beginHeadquarters, stepHeadquarters } from './demyan-state.js';
import { CELL } from './base-state.js';
import { makePerson, updatePerson } from './people-view.js';
import { nearestTarget, findPath, moveEnemy } from './combat-state.js';
import { validateBuildingMove, rectanglesOverlap } from './building-layout-state.js';
import { cargoCount } from './cargo-state.js';
import { MATERIALS } from './materials.js';
import { showBuildingMenu } from './game-menus.js';
import { objectiveBearing } from './workshop-state.js';
import { FLOOR_LIFT } from './lift-state.js';
const near=(rig,p,n=3)=>Math.hypot(rig.x-(p.x+.5)*CELL,rig.y-(p.y+.5)*CELL)<n*CELL;
function makeOfficer(scene,x,y){
 const person=scene.add.container(x,y).setDepth(10);person.militaryArt=scene.add.image(0,23,'military-guard').setOrigin(.5,1).setDisplaySize(43,70);person.add(person.militaryArt);return person;
}
export const demyanMethods={
 makeDemyan(){
  this.commandPost=null;this.commandPostGlow=null;this.hqSelecting=false;this.demyanArt=this.add.graphics().setDepth(6);this.hqPreview=this.add.graphics().setDepth(8);this.demyanCooldown=0;this.evacPathTime=0;
  const q=this.demyanQuest;
  if(this.floorNumber===6){const x=(SENSOR_SITE.x+.5)*CELL,y=(SENSOR_SITE.y+.5)*CELL,g=this.demyanArt;g.setVisible(!q.sensorCollected);g.fillStyle(0x183e38);g.fillRoundedRect(x-56,y-50,112,100,12);g.lineStyle(5,0xbdb587);g.strokeRoundedRect(x-56,y-50,112,100,12);g.fillStyle(0x82c997);g.fillRoundedRect(x-39,y-32,78,42,5);g.lineStyle(3,0x214c3a);for(let i=0;i<4;i++)g.lineBetween(x-30,y-23+i*8,x+20-i*8,y-23+i*8);g.fillStyle(0xe7bb61);for(let i=0;i<3;i++)g.fillCircle(x-24+i*24,y+30,6);this.sensorLabel=this.add.text(x,y-80,'АРХИВ ДАТЧИКОВ',{fontFamily:'Arial',fontSize:'16px',color:'#ffe7a4',backgroundColor:'#183e38',padding:{x:8,y:6}}).setOrigin(.5).setDepth(7).setVisible(!q.sensorCollected);}
  if(this.floorNumber===5){
   const x=(DEMYAN_SITE.x+.5)*CELL,y=(DEMYAN_SITE.y+.5)*CELL,g=this.demyanArt;
   this.commandPost=this.add.image(33*CELL,28*CELL,'command-post').setOrigin(0).setDisplaySize(5*CELL,6*CELL).setDepth(5);
   this.commandPostGlow=this.add.circle(35.5*CELL,28.7*CELL,6,0xb9ed89,.8).setDepth(7);
   // Reinforced enclosure is actual indestructible terrain, with one three-block west entrance.
   for(let cy=27;cy<=34;cy++)for(let cx=32;cx<=38;cx++)if(demyanWall(cx,cy)){const bx=cx*CELL,by=cy*CELL;g.fillStyle(0x202e31);g.fillRect(bx,by,CELL,CELL);g.fillStyle(0x6b7775);g.fillRoundedRect(bx+3,by+3,CELL-6,CELL-9,4);g.lineStyle(3,0x9aa79e);g.strokeRect(bx+5,by+5,CELL-10,CELL-13);g.lineStyle(5,0x394b4e);g.lineBetween(bx+10,by+12,bx+CELL-10,by+CELL-15);g.lineBetween(bx+CELL-10,by+12,bx+10,by+CELL-15);}
   this.postLabel=this.add.text(x,28*CELL-12,'КОМАНДНЫЙ ПОСТ · ПОСЛЕДНИЙ РУБЕЖ',{fontFamily:'Arial',fontSize:'16px',color:'#f4c77b',backgroundColor:'#20302c',padding:{x:8,y:5}}).setOrigin(.5).setDepth(9);
   this.demyanPerson=makeOfficer(this,x,y).setVisible(!q.rescued);
   this.demyanGun=this.add.graphics();this.demyanGun.fillStyle(0x152423);this.demyanGun.fillRoundedRect(-8,-5,36,9,2);this.demyanGun.fillStyle(0x859485);this.demyanGun.fillRect(22,-3,18,4);this.demyanPerson.add(this.demyanGun);
   this.evacuees=Array.from({length:3},(_,i)=>{const p={x:(34.5+i)*CELL,y:29.5*CELL,root:makePerson(this,(34.5+i)*CELL,29.5*CELL,i===2?'ilya':'serega'),path:[]};p.root.setVisible(i>=q.evacuated&&!q.rescued);return p;});
  }else if(!this.floorNumber){
   this.demyanPerson=makeOfficer(this,23.5*CELL,30.5*CELL).setVisible(q.returned);
   this.headquartersHouse=this.add.image(0,0,'headquarters').setOrigin(0).setDepth(6).setVisible(false);
   this.hqSentries=Array.from({length:8},()=>this.add.image(0,0,'military-guard').setDisplaySize(32,52).setOrigin(.5,1).setDepth(10).setVisible(false));
   this.hqLabel=this.add.text(0,0,'',{fontFamily:'Arial',fontSize:'17px',fontStyle:'bold',color:'#ffe3a6',backgroundColor:'#223b35',padding:{x:8,y:5}}).setOrigin(.5).setDepth(9);this.renderHeadquarters();
  }
  this.demyanPassenger=this.add.image(-6,-13,'people','armorer-0').setDisplaySize(17,17).setTint(0xb1b99d).setVisible(q.rescued&&!q.returned);this.rig.add(this.demyanPassenger);
 },
 checkDemyan(){
  if(!this.demyanPerson&&this.floorNumber===5)return;
  if(this.busy||this.storyActive||this.layoutEditing||this.hqSelecting||document.querySelector('#dialog').open)return;
  const q=this.demyanQuest;
  if(q.dialogue){this.startStory(q.dialogue);return;}
  if(!this.floorNumber&&this.constructionQuest.warehouse&&!q.briefed){this.startStory('demyanBrief');return;}
  if(this.floorNumber===5&&q.briefed&&!q.contact&&near(this.rig,DEMYAN_SITE,11)){this.startStory('demyanContact');return;}
  if(!this.floorNumber&&q.rescued&&!q.returned){this.startStory('demyanReturn');return;}
  if(!this.floorNumber&&q.hq&&!q.settlementBriefed){this.startStory('settlementBrief');return;}
  if(!this.floorNumber&&q.settlementDone&&!q.sensorBriefed){this.startStory('sensorBrief');return;}
  if(!this.floorNumber&&q.settlementBriefed&&!q.settlementDone&&this.settlementTasks().every(task=>task.done))this.startStory('settlementReady');
 },
 finishDemyanStory(kind){
  const q=this.demyanQuest;
  if(kind==='hqReady'||kind==='settlementBrief'){q.settlementBriefed=true;this.notify('ОБУСТРОИТЬ УБЕЖИЩЕ · ТРИ ЦЕЛИ В ЛЮБОМ ПОРЯДКЕ');}
  if(kind==='settlementReady')q.settlementDone=true;
  if(kind==='sensorBrief'){q.sensorBriefed=true;this.notify('КЛЮЧ-КАРТА · ЭТАЖ 6\nЗАДАНИЕ · АРХИВ НАРУЖНЫХ ДАТЧИКОВ');}
  if(kind==='sensorReturn')q.sensorReturned=true;
  if(kind==='demyanBrief'){q.briefed=true;this.notify('КЛЮЧ-КАРТА · ЭТАЖ 5\nНОВОЕ ЗАДАНИЕ · ПОСЛЕДНИЙ РУБЕЖ');}
  if(kind==='demyanContact')q.contact=true;
  if(kind==='demyanEvac')q.evacuating=true;
  if(kind==='demyanReturn'){q.returned=true;this.demyanPassenger?.setVisible(false);this.demyanPerson?.setVisible(true);this.renderHeadquarters();this.notify('ГЛОБАЛЬНАЯ МИССИЯ · ВЫХОД НА ПОВЕРХНОСТЬ\nЧЕРТЁЖ ШТАБА ПРОДАЁТСЯ · ДОМ АРХИТЕКТОРА');}
 },
 demyanAction(){
  const q=this.demyanQuest;if(!q)return null;
  if(this.floorNumber===6&&canCollectSensor(q,this.rig,this.spiders))return 'sensor';
  if(this.floorNumber===5&&near(this.rig,DEMYAN_SITE,5)&&canEvacuateDemyan(q,this.world,this.spiders||[]))return 'evac';
  if(!this.floorNumber&&q.returned&&q.hq){const d=this.buildingDeck?this.buildingDeck('hq'):demyanGeometry(q).deck;if(this.rig.x>=d.x&&this.rig.x<=d.x+d.width&&this.rig.y>=d.y&&this.rig.y<=d.y+d.height)return 'hq';}
  return null;
 },
 interactDemyan(){const a=this.demyanAction();if(a==='sensor'){this.demyanQuest.sensorCollected=true;this.demyanArt?.setVisible(false);this.sensorLabel?.setVisible(false);this.persist();this.refreshHUD();this.showDiscovery({kind:'sensor'});return true;}if(a==='evac'){this.startStory('demyanEvac');return true;}if(a==='hq'){if(this.demyanQuest.sensorCollected&&!this.demyanQuest.sensorReturned)this.startStory('sensorReturn');else this.openHeadquarters();return true;}return false;},
 updateDemyan(ms){
  const q=this.demyanQuest;if(this.commandPostGlow)this.commandPostGlow.setAlpha(.55+.2*Math.sin(this.time.now*.004));if(this.demyanPerson?.militaryArt)this.demyanPerson.militaryArt.setDisplaySize(43,70*(1+.008*Math.sin(this.time.now*.002)));else updatePerson(this.demyanPerson,ms,this.rig);
  if(!this.floorNumber){
   this.updateHeadquartersSentries();
   if(stepHeadquarters(q,ms)){this.renderHeadquarters();this.persist();this.startStory('hqReady');}else if(q.remaining!=null)this.renderHeadquarters();return;
  }
  if(this.floorNumber!==5||q.rescued)return;
  this.demyanCooldown=Math.max(0,this.demyanCooldown-ms);
  const from={x:this.demyanPerson.x,y:this.demyanPerson.y},solid=this.driveSolids();
  const target=nearestTarget(from,this.spiders,6*CELL,solid);
  if(target){this.demyanGun.rotation=Math.atan2(target.y-from.y,target.x-from.x);if(!this.demyanCooldown){this.demyanCooldown=1500;this.fireAt(from,target,1);this.playDemyanShot();}}
  else if(!q.contact&&!this.demyanCooldown){this.demyanCooldown=1800;this.combatShots.push({x:from.x,y:from.y,tx:from.x-90,ty:from.y+18,remaining:150});this.playDemyanShot();}
  this.evacuees.forEach(p=>updatePerson(p.root,ms,this.rig));
  if(!q.evacuating)return;
  const p=q.evacuated<3?this.evacuees[q.evacuated]:this.demyanEscort||(this.demyanEscort={...from,root:this.demyanPerson,path:[]});
  this.evacPathTime-=ms;if(this.evacPathTime<=0){p.path=findPath(p,this.rig,solid);this.evacPathTime=400;}
  while(p.path.length&&Math.hypot(p.path[0].x-p.x,p.path[0].y-p.y)<7)p.path.shift();
  moveEnemy(p,p.path[0]||this.rig,ms/1000,solid,q.evacuated<3?100:120);p.root.setPosition(p.x,p.y);
  if(Math.hypot(p.x-this.rig.x,p.y-this.rig.y)<48){p.root.setVisible(false);this.evacPathTime=0;
   if(q.evacuated<3){q.evacuated++;this.notify('ЛЮДИ НА БОРТУ · '+q.evacuated+'/3');}
   else{q.rescued=true;q.evacuating=false;this.demyanPassenger.setVisible(true);this.startStory('demyanRescue');}
   this.persist();this.refreshHUD();
  }
 },
 playDemyanShot(){
  if(!readSettings().sound||!this.demyanPerson||Math.hypot(this.rig.x-this.demyanPerson.x,this.rig.y-this.demyanPerson.y)>16*CELL)return;
  const ctx=this.sound?.context;if(!ctx||ctx.state!=='running')return;const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sawtooth';osc.frequency.setValueAtTime(130,ctx.currentTime);osc.frequency.exponentialRampToValueAtTime(35,ctx.currentTime+.09);gain.gain.setValueAtTime(.025,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.1);osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start();osc.stop(ctx.currentTime+.11);
 },
 refreshDemyanHUD(){
  const q=this.demyanQuest;if(!q?.briefed||this.floorNumber&&![5,6].includes(this.floorNumber))return;
  const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');
  if(q.sensorBriefed&&(!this.floorNumber||this.floorNumber===6)){name.textContent=q.sensorReturned?'Исследовать этаж':'Архив наружных датчиков';radio.textContent=q.sensorReturned?'Архив доставлен. Демьян изучает записи. Продолжай добычу и поиск артефактов.':q.sensorCollected?'Регистратор на борту. Вернись на базу и передай его Демьяну в штабе.':'На шестом этаже зачисти станцию от шести пауков и забери регистратор.';status.textContent=q.sensorReturned?'Задание завершено':q.sensorCollected?(this.floorNumber?'Лифт · '+objectiveBearing(this.rig,FLOOR_LIFT):'Штаб · '+objectiveBearing(this.rig,this.buildingPoint('hq'))):this.floorNumber?'Пауки '+(this.spiders||[]).filter(s=>s.hp<=0).length+'/6 · Станция '+objectiveBearing(this.rig,SENSOR_SITE):'Ключ-карта · этаж 6';return;}
  if(q.hq&&q.settlementBriefed&&!q.settlementDone&&!this.floorNumber){const tasks=this.settlementTasks();name.textContent='Обустроить убежище';radio.textContent='Демьян П.: Людям — жильё, производству — электричество, нам — запас материалов. С чего начать — решай сам. Чертежи у архитектора.';status.textContent=tasks.map(t=>(t.done?'✓ ':'○ ')+t.name).join(' · ');return;}
  name.textContent=q.returned?(q.hq?'Выход на поверхность':'Построить штаб'):'Последний рубеж';
  if(this.floorNumber===5&&q.returned){name.textContent='Исследовать этаж';radio.textContent='Спасательная миссия завершена. Демьян и люди уже на базе. Продолжай добычу и поиск артефактов.';status.textContent='Этаж 5 · Свободное исследование';return;}
  if(this.floorNumber===5){radio.textContent=q.rescued?'Демьян и люди на борту. Вернись на базу.':q.evacuating?'Сначала люди. Демьян отходит последним. Подожди рядом с проходом.':'Демьян удерживает командный пост. Разбей 3 подсвеченных блока слева и уничтожь всех 10 патрулирующих пауков.';status.textContent=q.rescued?'Лифт · '+objectiveBearing(this.rig,FLOOR_LIFT):'Проход '+DEMYAN_ENTRANCE.filter(p=>!this.world.blocked(p.x,p.y)).length+'/3 · Пауки '+(this.spiders||[]).filter(s=>s.hp<=0).length+'/'+DEMYAN_GUARDS.length+' · Люди '+q.evacuated+'/3 · '+objectiveBearing(this.rig,DEMYAN_SITE);}
  else{radio.textContent=q.returned?'Демьян П.: '+(q.hq?'Готовим экспедицию к верхним воротам. Сведения о поверхности ещё предстоит проверить.':'Нужен штаб. Купи чертёж у архитектора, выбери и расчисти площадку 9×8.'): 'Один человек несколько часов удерживает командный пост на пятом этаже. Серёга узнал Демьяна.';status.textContent=q.remaining!=null?'Строительство штаба · '+Math.ceil(q.remaining/1000)+' с':q.hq?'Штаб работает · Руководитель: Демьян П. · Спасены 3 человека':q.returned?'Дом архитектора · Штаб 9×8 · '+Object.entries(HQ_RECIPE).map(([id,n])=>(MATERIALS.find(m=>m.id===id)?.name||id)+' '+n).join(' · '):'Получена карта пятого этажа';}
 },
 headquartersError(q=this.demyanQuest){const geom=demyanGeometry(q);if(!geom)return 'Выбери место для штаба';return validateBuildingMove('hq',geom,this.world,this.occupiedBuildingGeometries('hq').filter(g=>g.kind!=='hq'),this.rig);},
 startHeadquartersPlacement(){
  document.querySelector('#dialog').close();this.dialogClosed();this.hqSelecting=true;document.querySelector('.base-hud').classList.add('layout-open');this.cameras.main.stopFollow();this.cameras.main.setZoom(clampEditorZoom(this.cameras.main,.55));
  const strip=document.createElement('div');strip.className='building-editor-strip';const note=document.createElement('span');note.textContent='Нажми на место для штаба 9×8. Потяни карту или используй WASD/стрелки · колёсико — масштаб.';note.className='building-editor-note';const done=document.createElement('button');done.className='hud-button';done.textContent='ГОТОВО';strip.append(note,done);document.querySelector('.base-hud').append(strip);this.hqPlacementStrip=strip;
  const down=p=>{this.hqPointer={x:p.x,y:p.y,scrollX:this.cameras.main.scrollX,scrollY:this.cameras.main.scrollY,id:p.id};};
  const move=p=>{const a=this.hqPointer;if(!a||p.id!==a.id||!p.isDown)return;this.cameras.main.setScroll(a.scrollX-(p.x-a.x)/this.cameras.main.zoom,a.scrollY-(p.y-a.y)/this.cameras.main.zoom);};
  const up=p=>{const a=this.hqPointer;this.hqPointer=null;if(!a||a.moved||p.id!==a.id||Math.hypot(p.x-a.x,p.y-a.y)>12)return;const point=this.cameras.main.getWorldPoint(p.x,p.y),x=Math.floor(point.x/CELL),y=Math.floor(point.y/CELL);if(x<2||y<2||x>48-HQ_WIDTH||y>48-HQ_HEIGHT){note.textContent='Площадка должна целиком помещаться внутри базы';return;}this.demyanQuest.plot={x,y};this.renderHeadquarters();this.persist();note.textContent=this.headquartersError()||'Площадка выбрана. Вернись в меню и начни строительство.';};
  this.input.on('pointerdown',down);this.input.on('pointermove',move);this.input.on('pointerup',up);this.input.on('pointerupoutside',up);this.hqPlacementCleanup=()=>{this.input.off('pointerdown',down);this.input.off('pointermove',move);this.input.off('pointerup',up);this.input.off('pointerupoutside',up);this.hqPointer=null;strip.remove();};this.events.once('shutdown',()=>this.hqPlacementCleanup?.());done.addEventListener('click',()=>this.finishHeadquartersPlacement());
 },
 finishHeadquartersPlacement(){this.hqPlacementCleanup?.();this.hqPlacementCleanup=null;this.hqSelecting=false;document.querySelector('.base-hud').classList.remove('layout-open');this.cameras.main.startFollow(this.rig,true,.1,.1);this.fit({width:this.scale.width,height:this.scale.height});this.openHeadquartersBuild();},
 openHeadquartersBuild(){
  this.dialogClosed();const q=this.demyanQuest,panel=document.createElement('div');panel.className='lift-console construction-controls';
  const title=document.createElement('p');title.className='service-readout';title.textContent='ШТАБ · 9×8 КЛЕТОК · ДЕМЬЯН П. · '+this.credits+' КРЕДИТОВ';
  const note=document.createElement('p');note.className='terminal-note';note.textContent='Выбери площадку на карте. Расчисти все 72 клетки, оставь подход к входу снизу и проход минимум в одну клетку между зданиями. Строительство — 15 секунд. Материалы берутся из груза и склада.';
  const set=document.createElement('button');set.className='metal-button';set.textContent='ВЫБРАТЬ МЕСТО НА КАРТЕ';const status=document.createElement('p');status.className='terminal-note';
  const build=document.createElement('button');build.className='metal-button';build.textContent='ПОСТРОИТЬ ШТАБ';
  const render=()=>{const err=this.headquartersError();status.textContent=q.remaining!=null?'Строительство началось. Закрой меню, чтобы продолжить.':(err||'Площадка готова')+' · '+Object.entries(HQ_RECIPE).map(([id,n])=>(MATERIALS.find(m=>m.id===id)?.name||id)+' '+((this.cargoHold[id]||0)+(this.constructionQuest.stock[id]||0))+'/'+n).join(' · ');build.disabled=!this.knowsBuildingBlueprint('hq')||!!err||q.remaining!=null||Object.entries(HQ_RECIPE).some(([id,n])=>(this.cargoHold[id]||0)+(this.constructionQuest.stock[id]||0)<n);set.disabled=q.remaining!=null;};
  set.addEventListener('click',()=>this.startHeadquartersPlacement());
  build.addEventListener('click',()=>{if(this.headquartersError()||!beginHeadquarters(q,this.cargoHold,this.constructionQuest.stock,this.buildingBlueprints)){render();return;}this.cargo=cargoCount(this.cargoHold);this.renderHeadquarters();this.persist();this.refreshHUD();render();});
  panel.append(title,note);this.addBuildingBlueprintPurchase(panel,'hq',()=>this.openHeadquartersBuild());panel.append(set,status,build);render();showBuildingMenu('construction',panel);
 },
 renderHeadquarters(){
  if(this.floorNumber||!this.demyanArt)return;this.makeBuildingFoundations?.();const q=this.demyanQuest,g=this.demyanArt,preview=this.hqPreview;g.clear();preview.clear();this.hqLabel?.setVisible(!!q.plot&&!q.hq);this.headquartersHouse?.setVisible(!!q.hq&&!!q.plot);this.hqSentries?.forEach(p=>p.setVisible(!!q.hq&&!!q.plot));if(!q.plot)return;
  const geom=demyanGeometry(q),b=geom.body,f=geom.footprint;
  if(!q.hq){preview.lineStyle(3,0xd7bc79,.8);preview.strokeRect(f.x,f.y,f.width,f.height);preview.lineStyle(1,0xd7bc79,.4);for(let i=1;i<HQ_WIDTH;i++)preview.lineBetween(f.x+i*CELL,f.y,f.x+i*CELL,f.y+f.height);for(let i=1;i<HQ_HEIGHT;i++)preview.lineBetween(f.x,f.y+i*CELL,f.x+f.width,f.y+i*CELL);}
  this.hqLabel?.setPosition(b.x+b.width/2,f.y-12).setText(q.hq?'ШТАБ · ДЕМЬЯН П.':q.remaining!=null?'ШТАБ · СТРОИТЕЛЬСТВО':'ПЛОЩАДКА ШТАБА · 9×8');
  if(q.hq){
   this.headquartersHouse?.setPosition(b.x,b.y).setDisplaySize(b.width,b.height+CELL);
   const posts=[[1.5,.5],[7.5,.5],[.5,3],[8.5,3],[.5,6],[8.5,6],[1.5,7.5],[7.5,7.5]];
   this.hqSentries?.forEach((p,i)=>{p.setPosition(f.x+posts[i][0]*CELL,f.y+posts[i][1]*CELL+22).setFlipX(i%2===1);p.sentryHome={x:p.x,y:p.y,vertical:i>=2&&i<=5};p.setDisplaySize(32,52);p.sentryScaleX=p.scaleX;p.sentryScaleY=p.scaleY;});
   this.demyanPerson?.setPosition(b.x+b.width/2-70,geom.deck.y+32).setVisible(true);return;
  }
  if(q.remaining==null)return;
  g.fillStyle(0x435449);g.fillRect(f.x,f.y,f.width,f.height);g.lineStyle(6,0xb19b68);g.strokeRect(b.x,b.y,b.width,b.height);
  for(let x=b.x+CELL/2;x<b.x+b.width;x+=CELL){g.lineStyle(4,0x687c6c);g.lineBetween(x,b.y,x,b.y+b.height);}
  const progress=1-q.remaining/15000;g.fillStyle(0x1d322c);g.fillRect(b.x+12,geom.deck.y+24,b.width-24,12);g.fillStyle(0xddbd72);g.fillRect(b.x+12,geom.deck.y+24,(b.width-24)*progress,12);

 },
 updateHeadquartersSentries(){
  this.hqSentries?.forEach((guard,i)=>{
   if(!guard.visible||!guard.sentryHome)return;
   const t=(this.time.now/1000+i*1.47)%12,walking=t>=2&&t<5||t>=8&&t<11;
   const offset=t<2?-18:t<5?-18+(t-2)*12:t<8?18:t<11?18-(t-8)*12:-18;
   const home=guard.sentryHome,bob=walking?Math.sin(t*13+i)*1.2:0;
   guard.setPosition(home.x+(home.vertical?0:offset),home.y+(home.vertical?offset:0)+bob);
   guard.setFlipX(t>=5&&t<11);guard.setRotation(walking?Math.sin(t*13+i)*.018:Math.sin(t*1.5+i)*.007);
   guard.setScale(guard.sentryScaleX,guard.sentryScaleY*(1+.008*Math.sin(t*2+i)));
  });
 },
 openHeadquarters(){const panel=document.createElement('div');panel.className='lift-console';const title=document.createElement('p');title.className='service-readout';title.textContent='ДЕМЬЯН П. · НАЧАЛЬНИК ШТАБА';const note=document.createElement('p');note.className='terminal-note';note.textContent=this.demyanQuest.sensorReturned?'Архив наружных датчиков доставлен. Демьян изучает замеры для следующей вылазки.':this.demyanQuest.sensorBriefed?'Шестой этаж: зачисти станцию от шести пауков, забери регистратор наружных датчиков и доставь его сюда. Награда — 10 000 кредитов.':this.demyanQuest.settlementDone?'Убежище обустроено: жилой комплекс и электростанция готовы, склад расширен. Глобальная миссия — выйти на поверхность. Следующее сюжетное поручение появится здесь.':'Глобальная миссия: выйти на поверхность. Показания наружных датчиков дают надежду, но безопасность ещё не подтверждена. Для открытия верхних ворот потребуется собрать предметы — состав определим по ходу сюжета. Следующий шаг — обустроить убежище. Жильё, электростанция и склад развиваются в любом порядке.';panel.append(title,note);if(this.settlementUnlocked()){this.addSettlementTaskList(panel);const button=document.createElement('button');button.className='metal-button';button.textContent='ЧЕРТЕЖИ · ДОМ АРХИТЕКТОРА';button.addEventListener('click',()=>this.openSettlementConstruction());panel.append(button);}showBuildingMenu('hq',panel);}
};
