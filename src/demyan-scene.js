import { readSettings } from './storage.js';
import { ARCHITECT_FOOTPRINT } from './construction-state.js';
import { DEMYAN_SITE, DEMYAN_ENTRANCE, DEMYAN_GUARDS, HQ_RECIPE, demyanGeometry, canEvacuateDemyan, beginHeadquarters, stepHeadquarters } from './demyan-state.js';
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
export const demyanMethods={
 makeDemyan(){
  this.hqSelecting=false;this.demyanArt=this.add.graphics().setDepth(6);this.hqPreview=this.add.graphics().setDepth(8);this.demyanCooldown=0;this.evacPathTime=0;
  const q=this.demyanQuest;
  if(this.floorNumber===5){
   const x=(DEMYAN_SITE.x+.5)*CELL,y=(DEMYAN_SITE.y+.5)*CELL,g=this.demyanArt;
   g.fillStyle(0x243c3b);g.fillRoundedRect(33*CELL,28*CELL,5*CELL,6*CELL,10);g.lineStyle(3,0x526860);g.strokeRect(33*CELL+8,28*CELL+8,5*CELL-16,6*CELL-16);
   // The west side is the cleared-by-player rescue route; ruins are visual, not invisible walls.
   for(let i=0;i<7;i++){g.fillStyle(i%2?0x735746:0x8b7757);g.fillRoundedRect(33*CELL+16+i*37,32*CELL+28+(i%2)*8,32,26,4);}
   for(let i=0;i<35;i++){g.fillStyle(0xc39b50);g.fillRect(x-90+(i*47)%180,y-20+(i*29)%65,6,3);}
   g.fillStyle(0x19302e);g.fillRoundedRect(35*CELL,28*CELL+12,110,48,6);g.fillStyle(0x81b989);g.fillRect(35*CELL+14,28*CELL+22,70,22);
   this.postLabel=this.add.text(x,28*CELL-12,'КОМАНДНЫЙ ПОСТ · ПОСЛЕДНИЙ РУБЕЖ',{fontFamily:'Arial',fontSize:'16px',color:'#f4c77b',backgroundColor:'#20302c',padding:{x:8,y:5}}).setOrigin(.5).setDepth(9);
   this.demyanPerson=makePerson(this,x,y,'armorer').setVisible(!q.rescued);this.demyanPerson.workerArt.setTint(0xb1b99d);this.demyanPerson.workerPrevious.setTint(0xb1b99d);
   this.demyanGun=this.add.graphics();this.demyanGun.fillStyle(0x152423);this.demyanGun.fillRoundedRect(-8,-5,36,9,2);this.demyanGun.fillStyle(0x859485);this.demyanGun.fillRect(22,-3,18,4);this.demyanPerson.add(this.demyanGun);
   this.evacuees=Array.from({length:3},(_,i)=>{const p={x:(34.5+i)*CELL,y:29.5*CELL,root:makePerson(this,(34.5+i)*CELL,29.5*CELL,i===2?'ilya':'serega'),path:[]};p.root.setVisible(i>=q.evacuated&&!q.rescued);return p;});
  }else if(!this.floorNumber){
   this.demyanPerson=makePerson(this,23.5*CELL,30.5*CELL,'armorer').setVisible(q.returned);this.demyanPerson.workerArt.setTint(0xb1b99d);this.demyanPerson.workerPrevious.setTint(0xb1b99d);
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
  if(!this.floorNumber&&q.rescued&&!q.returned)this.startStory('demyanReturn');
 },
 finishDemyanStory(kind){
  const q=this.demyanQuest;
  if(kind==='demyanBrief'){q.briefed=true;this.notify('КЛЮЧ-КАРТА · ЭТАЖ 5\nНОВОЕ ЗАДАНИЕ · ПОСЛЕДНИЙ РУБЕЖ');}
  if(kind==='demyanContact')q.contact=true;
  if(kind==='demyanEvac')q.evacuating=true;
  if(kind==='demyanReturn'){q.returned=true;this.demyanPassenger?.setVisible(false);this.demyanPerson?.setVisible(true);this.renderHeadquarters();this.notify('ГЛОБАЛЬНАЯ МИССИЯ · ВЫХОД НА ПОВЕРХНОСТЬ\nПОЛУЧЕН ЧЕРТЁЖ ШТАБА · ДОМ АРХИТЕКТОРА');}
 },
 demyanAction(){
  const q=this.demyanQuest;if(!q)return null;
  if(this.floorNumber===5&&near(this.rig,DEMYAN_SITE,5)&&canEvacuateDemyan(q,this.world,this.spiders||[]))return 'evac';
  if(!this.floorNumber&&q.returned&&q.hq){const d=demyanGeometry(q).deck;if(this.rig.x>=d.x&&this.rig.x<=d.x+d.width&&this.rig.y>=d.y&&this.rig.y<=d.y+d.height)return 'hq';}
  return null;
 },
 interactDemyan(){const a=this.demyanAction();if(a==='evac'){this.startStory('demyanEvac');return true;}if(a==='hq'){this.openHeadquarters();return true;}return false;},
 updateDemyan(ms){
  const q=this.demyanQuest;updatePerson(this.demyanPerson,ms,this.rig);
  if(!this.floorNumber){
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
  const q=this.demyanQuest;if(!q?.briefed||this.floorNumber&&this.floorNumber!==5)return;
  const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');
  name.textContent=q.returned?(q.hq?'Выход на поверхность':'Построить штаб'):'Последний рубеж';
  if(this.floorNumber===5){radio.textContent=q.rescued?'Демьян и люди на борту. Вернись на базу.':q.evacuating?'Сначала люди. Демьян отходит последним. Подожди рядом с проходом.':'Демьян удерживает командный пост. Пробей боковой проход и уничтожь нападающих.';status.textContent=q.rescued?'Лифт · '+objectiveBearing(this.rig,FLOOR_LIFT):'Проход '+DEMYAN_ENTRANCE.filter(p=>!this.world.blocked(p.x,p.y)).length+'/3 · Пауки '+(this.spiders||[]).filter(s=>s.hp<=0).length+'/'+DEMYAN_GUARDS.length+' · Люди '+q.evacuated+'/3 · '+objectiveBearing(this.rig,DEMYAN_SITE);}
  else{radio.textContent=q.returned?'Демьян П.: '+(q.hq?'Готовим экспедицию к верхним воротам. Сведения о поверхности ещё предстоит проверить.':'Нужен штаб. Получи чертёж у архитектора, выбери и расчисти площадку 5×5.'): 'Один человек несколько часов удерживает командный пост на пятом этаже. Серёга узнал Демьяна.';status.textContent=q.remaining!=null?'Строительство штаба · '+Math.ceil(q.remaining/1000)+' с':q.hq?'Штаб работает · Руководитель: Демьян П. · Спасены 3 человека':q.returned?'Дом архитектора · Штаб 5×5 · '+Object.entries(HQ_RECIPE).map(([id,n])=>(MATERIALS.find(m=>m.id===id)?.name||id)+' '+n).join(' · '):'Получена карта пятого этажа';}
 },
 headquartersError(q=this.demyanQuest){const geom=demyanGeometry(q);if(!geom)return 'Выбери место для штаба';const others=this.occupiedBuildingGeometries().filter(g=>g.kind!=='hq');const error=validateBuildingMove('hq',geom,this.world,others,this.rig);if(error)return error;const f=geom.footprint,buffer={x:f.x-2*CELL,y:f.y-2*CELL,width:f.width+4*CELL,height:f.height+4*CELL};if([...others.map(g=>g.footprint),ARCHITECT_FOOTPRINT].some(f=>rectanglesOverlap(buffer,f)))return 'Оставь проход шириной две клетки между зданиями';return null;},
 startHeadquartersPlacement(){
  document.querySelector('#dialog').close();this.dialogClosed();this.hqSelecting=true;document.querySelector('.base-hud').classList.add('layout-open');this.cameras.main.stopFollow();this.cameras.main.setZoom(.55);
  const strip=document.createElement('div');strip.className='building-editor-strip';const note=document.createElement('span');note.textContent='Нажми на место для штаба 5×5. Потяни карту, чтобы осмотреть базу.';note.className='building-editor-note';const done=document.createElement('button');done.className='hud-button';done.textContent='ГОТОВО';strip.append(note,done);document.querySelector('.base-hud').append(strip);this.hqPlacementStrip=strip;
  const down=p=>{this.hqPointer={x:p.x,y:p.y,scrollX:this.cameras.main.scrollX,scrollY:this.cameras.main.scrollY,id:p.id};};
  const move=p=>{const a=this.hqPointer;if(!a||p.id!==a.id||!p.isDown)return;this.cameras.main.setScroll(a.scrollX-(p.x-a.x)/this.cameras.main.zoom,a.scrollY-(p.y-a.y)/this.cameras.main.zoom);};
  const up=p=>{const a=this.hqPointer;this.hqPointer=null;if(!a||p.id!==a.id||Math.hypot(p.x-a.x,p.y-a.y)>12)return;const point=this.cameras.main.getWorldPoint(p.x,p.y),x=Math.floor(point.x/CELL),y=Math.floor(point.y/CELL);if(x<2||y<2||x>43||y>43){note.textContent='Площадка должна целиком помещаться внутри базы';return;}this.demyanQuest.plot={x,y};this.renderHeadquarters();this.persist();note.textContent=this.headquartersError()||'Площадка выбрана. Вернись в меню и начни строительство.';};
  this.input.on('pointerdown',down);this.input.on('pointermove',move);this.input.on('pointerup',up);this.hqPlacementCleanup=()=>{this.input.off('pointerdown',down);this.input.off('pointermove',move);this.input.off('pointerup',up);strip.remove();};this.events.once('shutdown',()=>this.hqPlacementCleanup?.());done.addEventListener('click',()=>this.finishHeadquartersPlacement());
 },
 finishHeadquartersPlacement(){this.hqPlacementCleanup?.();this.hqPlacementCleanup=null;this.hqSelecting=false;document.querySelector('.base-hud').classList.remove('layout-open');this.cameras.main.startFollow(this.rig,true,.1,.1);this.fit({width:this.scale.width,height:this.scale.height});this.openHeadquartersBuild();},
 openHeadquartersBuild(){
  this.dialogClosed();const q=this.demyanQuest,panel=document.createElement('div');panel.className='lift-console construction-controls';
  const title=document.createElement('p');title.className='service-readout';title.textContent='ШТАБ · 5×5 КЛЕТОК · ДЕМЬЯН П.';
  const note=document.createElement('p');note.className='terminal-note';note.textContent='Выбери площадку на карте. Расчисти все 25 клеток, оставь подход к входу снизу и проходы между зданиями. Строительство — 15 секунд. Материалы берутся из груза и склада.';
  const set=document.createElement('button');set.className='metal-button';set.textContent='ВЫБРАТЬ МЕСТО НА КАРТЕ';const status=document.createElement('p');status.className='terminal-note';
  const build=document.createElement('button');build.className='metal-button';build.textContent='ПОСТРОИТЬ ШТАБ';
  const render=()=>{const err=this.headquartersError();status.textContent=q.remaining!=null?'Строительство началось. Закрой меню, чтобы продолжить.':(err||'Площадка готова')+' · '+Object.entries(HQ_RECIPE).map(([id,n])=>(MATERIALS.find(m=>m.id===id)?.name||id)+' '+((this.cargoHold[id]||0)+(this.constructionQuest.stock[id]||0))+'/'+n).join(' · ');build.disabled=!!err||q.remaining!=null||Object.entries(HQ_RECIPE).some(([id,n])=>(this.cargoHold[id]||0)+(this.constructionQuest.stock[id]||0)<n);set.disabled=q.remaining!=null;};
  set.addEventListener('click',()=>this.startHeadquartersPlacement());
  build.addEventListener('click',()=>{if(this.headquartersError()||!beginHeadquarters(q,this.cargoHold,this.constructionQuest.stock)){render();return;}this.cargo=cargoCount(this.cargoHold);this.renderHeadquarters();this.persist();this.refreshHUD();render();});
  panel.append(title,note,set,status,build);render();showBuildingMenu('construction',panel);
 },
 renderHeadquarters(){
  if(this.floorNumber||!this.demyanArt)return;const q=this.demyanQuest,g=this.demyanArt,preview=this.hqPreview;g.clear();preview.clear();this.hqLabel?.setVisible(!!q.plot);if(!q.plot)return;
  const geom=demyanGeometry(q),b=geom.body,f=geom.footprint;
  preview.lineStyle(3,0xd7bc79,.8);preview.strokeRect(f.x,f.y,f.width,f.height);for(let i=1;i<5;i++){preview.lineStyle(1,0xd7bc79,.4);preview.lineBetween(f.x+i*CELL,f.y,f.x+i*CELL,f.y+f.height);preview.lineBetween(f.x,f.y+i*CELL,f.x+f.width,f.y+i*CELL);}
  this.hqLabel?.setPosition(b.x+b.width/2,b.y-12).setText(q.hq?'ШТАБ · ДЕМЬЯН П.':q.remaining!=null?'ШТАБ · СТРОИТЕЛЬСТВО':'ПЛОЩАДКА ШТАБА · 5×5');
  if(!q.hq&&q.remaining==null)return;
  g.fillStyle(0x7d8065);g.fillRect(geom.deck.x,geom.deck.y,geom.deck.width,geom.deck.height);g.fillStyle(0x182c2b,.5);g.fillRoundedRect(b.x+7,b.y+10,b.width,b.height,12);g.fillStyle(0x51695d);g.fillRoundedRect(b.x,b.y,b.width,b.height,12);
  g.fillStyle(0x2c443e);g.fillRoundedRect(b.x-4,b.y-4,b.width+8,80,10);g.lineStyle(3,0x8a9980);for(let i=0;i<6;i++)g.lineBetween(b.x+i*55,b.y,b.x+i*55,b.y+75);
  g.fillStyle(0x1b2b2a);g.fillRect(b.x+125,b.y+150,70,106);g.fillStyle(0xd7b56c);g.fillRect(b.x+140,b.y+170,40,30);
  for(const dx of [28,225]){g.fillStyle(0x253c34);g.fillRect(b.x+dx,b.y+105,65,60);g.fillStyle(0xbad18c);g.fillRect(b.x+dx+7,b.y+113,50,40);g.lineStyle(4,0x435848);g.lineBetween(b.x+dx+32,b.y+113,b.x+dx+32,b.y+153);}
  g.lineStyle(4,0x9aab97);g.lineBetween(b.x+265,b.y+5,b.x+265,b.y-55);g.lineBetween(b.x+245,b.y-45,b.x+285,b.y-45);g.fillStyle(0xd0a35f);g.fillTriangle(b.x+80,b.y+90,b.x+92,b.y+110,b.x+68,b.y+110);
  if(q.hq)this.demyanPerson?.setPosition(b.x+95,geom.deck.y+32).setVisible(true);
  else{g.fillStyle(0x1d322c);g.fillRect(b.x+12,geom.deck.y+24,296,12);g.fillStyle(0xddbd72);g.fillRect(b.x+12,geom.deck.y+24,296*(1-q.remaining/15000),12);}
 },
 openHeadquarters(){const panel=document.createElement('div');panel.className='lift-console';const title=document.createElement('p');title.className='service-readout';title.textContent='ДЕМЬЯН П. · НАЧАЛЬНИК ШТАБА';const note=document.createElement('p');note.className='terminal-note';note.textContent='Глобальная миссия: выйти на поверхность. Показания наружных датчиков дают надежду, но безопасность ещё не подтверждена. Для открытия верхних ворот потребуется собрать предметы — состав определим по ходу сюжета. Спасены трое выживших; следующая задача — подготовить жильё. Новые сюжетные поручения будут появляться здесь.';panel.append(title,note);showBuildingMenu('hq',panel);}
};
