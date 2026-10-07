import { FLOOR_LIFT } from './lift-state.js';
import { BUILDER_SITE, BUILDER_ENTRANCE, BUILDER_STORIES, CONSTRUCTION_DESK, WAREHOUSE_PLOTS, WAREHOUSE_RECIPE, WAREHOUSE_MS, WAREHOUSE_CAPACITY, warehouseBody, warehouseDeck, plotBlocked, builderEntranceLeft, canRescueBuilder, beginWarehouse, stepConstruction, transferWarehouse, stockCount } from './construction-state.js';
import { CELL } from './base-state.js';
import { nearWorkshopItem, objectiveBearing } from './workshop-state.js';
import { makePerson, updatePerson } from './people-view.js';
import { showBuildingMenu } from './game-menus.js';
import { MATERIALS } from './materials.js';
import { cargoCount } from './cargo-state.js';
const inDeck=(rig,d)=>rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;
export const constructionMethods={
 makeConstructionObjects(){
  const q=this.constructionQuest;
  if(this.floorNumber===4){
   this.builderPerson=makePerson(this,(BUILDER_SITE.x+.5)*CELL,(BUILDER_SITE.y+.5)*CELL,'serega').setVisible(!q.rescued);
   this.builderPerson.workerArt.setTint(0xa7cde9);this.builderPerson.workerPrevious.setTint(0xa7cde9);
   const plan=this.add.graphics();plan.fillStyle(0xe8d7a2);plan.fillRect(8,0,23,17);plan.lineStyle(1,0x325776);plan.strokeRect(11,3,15,11);plan.lineBetween(18,3,18,14);this.builderPerson.add(plan);
   this.builderBeacon=this.add.text(this.builderPerson.x,this.builderPerson.y-62,'… ТУК-ТУК',{fontFamily:'Arial',fontSize:'14px',color:'#ffe39b',backgroundColor:'#18382e',padding:{x:7,y:4}}).setOrigin(.5).setDepth(11).setVisible(false);
  }else if(!this.floorNumber){
   this.constructionArt=this.add.graphics().setDepth(5);
   const d=CONSTRUCTION_DESK,x=(d.x+.5)*CELL,y=(d.y+.5)*CELL;
   this.builderAtBase=makePerson(this,x+45,y-42,'serega').setVisible(q.unlocked);this.builderAtBase.workerArt.setTint(0xa7cde9);this.builderAtBase.workerPrevious.setTint(0xa7cde9);
   this.builderSerega=makePerson(this,x-45,y-42,'serega').setVisible(q.unlocked);
   this.constructionTable=this.add.graphics().setDepth(9).setVisible(q.unlocked);const g=this.constructionTable;
   g.fillStyle(0x443d2c);g.fillRect(x-36,y+8,8,19);g.fillRect(x+28,y+8,8,19);g.fillStyle(0x9a7451);g.fillRoundedRect(x-44,y-17,88,35,5);g.lineStyle(3,0x423629);g.strokeRoundedRect(x-44,y-17,88,35,5);g.fillStyle(0xb0cbd0);g.fillRect(x-32,y-12,52,23);g.lineStyle(1,0x416477);g.strokeRect(x-26,y-8,34,15);g.lineBetween(x-10,y-8,x-10,y+7);
   this.warehouseSign=this.add.text(0,0,'СКЛАД',{fontFamily:'Arial',fontSize:'18px',fontStyle:'bold',color:'#ffdfa0',backgroundColor:'#29433b',padding:{x:12,y:3}}).setOrigin(.5).setDepth(7).setVisible(false);
   this.renderConstruction();
  }
 },
 constructionAction(){
  const q=this.constructionQuest;if(!q)return null;
  if(this.floorNumber===4&&q.briefed&&!q.rescued&&nearWorkshopItem(this.rig,BUILDER_SITE))return canRescueBuilder(q,this.world,this.spiders||[])?'builder':'builderBlocked';
  if(this.floorNumber)return null;
  if(q.warehouse&&inDeck(this.rig,warehouseDeck(q)))return 'warehouse';
  if(q.unlocked&&nearWorkshopItem(this.rig,CONSTRUCTION_DESK))return 'construction';return null;
 },
 interactConstruction(){
  const action=this.constructionAction();
  if(action==='builder'){this.constructionQuest.rescued=true;this.builderPassenger?.setVisible(true);this.builderPerson.setVisible(false);this.builderBeacon.setVisible(false);this.persist();this.startStory('builderRescue');return true;}
  if(action==='builderBlocked'){this.notify('Расчисти три блока у входа и уничтожь пауков у комнаты.');return true;}
  if(action==='construction'){this.openConstruction();return true;}
  if(action==='warehouse'){this.openWarehouse();return true;}return false;
 },
 checkConstruction(){
  const q=this.constructionQuest;
  if(this.busy||this.storyActive||document.querySelector('#dialog').open||this.world.dialogue||this.workshopQuest.dialogue||this.armoryQuest.dialogue||this.repairQuest.dialogue)return;
  if(q.dialogue){this.startStory(q.dialogue);return;}
  if(!this.floorNumber&&this.repairQuest.wave==='done'&&!q.briefed){this.startStory('builderBrief');return;}
  if(this.floorNumber===4&&q.briefed&&!q.signalHeard&&!q.rescued&&Math.hypot(this.rig.x-(BUILDER_SITE.x+.5)*CELL,this.rig.y-(BUILDER_SITE.y+.5)*CELL)<10*CELL){this.startStory('builderSignal');return;}
  if(!this.floorNumber&&q.rescued&&!q.unlocked){this.startStory('builderReturn');return;}
 },
 updateConstruction(delta){
  const q=this.constructionQuest;if(!q)return;
  if(this.floorNumber===4){
   updatePerson(this.builderPerson,delta,this.rig);
   this.builderBeacon?.setVisible(!q.rescued&&Math.hypot(this.rig.x-this.builderPerson.x,this.rig.y-this.builderPerson.y)<10*CELL);
   if(this.builderBeacon)this.builderBeacon.setAlpha(.65+.35*Math.sin(this.time.now*.004));
  }else if(!this.floorNumber){
   updatePerson(this.builderAtBase,delta,this.rig);updatePerson(this.builderSerega,delta,this.rig);
   if(stepConstruction(q,delta)){this.renderConstruction();this.refreshHUD();this.persist();this.startStory('warehouseReady');}
   else if(q.remaining!=null)this.renderConstruction();
  }
 },
 renderConstruction(){
  const g=this.constructionArt,q=this.constructionQuest;if(!g)return;g.clear();
  this.builderAtBase?.setVisible(q.unlocked);this.builderSerega?.setVisible(q.unlocked);this.constructionTable?.setVisible(q.unlocked);
  this.warehouseSign?.setVisible(q.warehouse);if(!q.unlocked)return;
  const b=warehouseBody(q),progress=q.warehouse?1:q.remaining!=null?1-q.remaining/WAREHOUSE_MS:0;
  g.fillStyle(0x87c5aa,.12);g.fillRect(b.x,b.y,b.width,b.height+CELL);g.lineStyle(3,q.warehouse?0x6a8276:0xeec874,.8);g.strokeRect(b.x,b.y,b.width,b.height);
  if(!q.warehouse&&q.remaining==null)return;
  g.fillStyle(0x68776c);g.fillRect(b.x,b.y+b.height,b.width,10);
  // Construction progresses from corner supports to walls and the roof.
  g.lineStyle(8,0x806b49);for(const x of [b.x+8,b.x+b.width-8])g.lineBetween(x,b.y+10,x,b.y+b.height);
  if(progress>.25){g.fillStyle(0x546958);g.fillRoundedRect(b.x+6,b.y+14,b.width-12,b.height-20,7);g.lineStyle(2,0x2d493f);for(let x=b.x+18;x<b.x+b.width-10;x+=18)g.lineBetween(x,b.y+18,x,b.y+b.height-8);}
  if(progress>.65){g.fillStyle(0x8b927a);g.fillRoundedRect(b.x-8,b.y-8,b.width+16,45,7);g.lineStyle(3,0x46594b);for(let y=b.y;y<b.y+30;y+=9)g.lineBetween(b.x-3,y,b.x+b.width+3,y);}
  if(q.warehouse){g.fillStyle(0x243a31);g.fillRect(b.x+60,b.y+48,72,74);g.lineStyle(2,0x9ba990);for(let y=b.y+53;y<b.y+120;y+=10)g.lineBetween(b.x+63,y,b.x+129,y);g.fillStyle(0xe7ba64);g.fillCircle(b.x+122,b.y+93,3);this.warehouseSign.setPosition(b.x+b.width/2,b.y+23);}
  else {g.fillStyle(0x183a31);g.fillRect(b.x+10,b.y+b.height+18,b.width-20,8);g.fillStyle(0xffd078);g.fillRect(b.x+10,b.y+b.height+18,(b.width-20)*progress,8);}
 },
 openConstruction(){
  const q=this.constructionQuest;if(!q.unlocked||this.floorNumber)return;this.dialogClosed();this.persist();
  const panel=document.createElement('div');panel.className='lift-console construction-controls';
  const title=document.createElement('p');title.className='service-readout';title.textContent='ПЕРВЫЙ ЧЕРТЁЖ · СКЛАД\nЗапас на '+WAREHOUSE_CAPACITY+' единиц';panel.append(title);
  const selection=document.createElement('p'),cost=document.createElement('p'),status=document.createElement('p');status.className='service-status';status.setAttribute('role','status');
  const buttons=document.createElement('div');buttons.className='construction-plot-buttons';
  const prev=document.createElement('button'),next=document.createElement('button'),build=document.createElement('button');prev.className=next.className='floor-button';build.className='metal-button';prev.textContent='← МЕСТО';next.textContent='МЕСТО →';
  const render=()=>{const plot=WAREHOUSE_PLOTS[q.plot];selection.textContent='Площадка: '+plot.name+' · '+objectiveBearing(this.rig,{x:plot.x+1,y:plot.y+2});cost.textContent=Object.entries(WAREHOUSE_RECIPE).map(([id,n])=>MATERIALS.find(m=>m.id===id).name+': '+((this.cargoHold[id]||0)+(q.stock[id]||0))+'/'+n).join(' · ');const blocked=plotBlocked(q,this.world);status.textContent=q.warehouse?'Склад готов. Подъезжай к воротам, чтобы хранить и забирать материалы.':q.remaining!=null?'Стройка началась. Можно ехать по своим делам.':'Расчисти площадку 3×3: осталось '+blocked+' блоков. Разметка показана на базе.';prev.disabled=next.disabled=q.warehouse||q.remaining!=null;build.textContent=q.warehouse?'СКЛАД ПОСТРОЕН':q.remaining!=null?'СТРОИТЕЛЬСТВО…':'ПОСТРОИТЬ · 10 СЕКУНД';build.disabled=q.warehouse||q.remaining!=null||blocked>0||Object.entries(WAREHOUSE_RECIPE).some(([id,n])=>(this.cargoHold[id]||0)+(q.stock[id]||0)<n);};
  const choose=step=>{if(q.warehouse||q.remaining!=null)return;q.plot=(q.plot+step+WAREHOUSE_PLOTS.length)%WAREHOUSE_PLOTS.length;this.renderConstruction();render();this.refreshHUD();this.persist();};prev.addEventListener('click',()=>choose(-1));next.addEventListener('click',()=>choose(1));
  build.addEventListener('click',()=>{if(!beginWarehouse(q,this.world,this.cargoHold,this.rig)){status.textContent='Не хватает материалов, площадка занята или бур стоит на месте стройки.';return;}this.cargo=cargoCount(this.cargoHold);this.renderConstruction();this.refreshHUD();this.persist();document.querySelector('#dialog').close();this.notify('СТРОЙКА НАЧАЛАСЬ · СЕРЁГА И МАСТЕР СОБИРАЮТ СКЛАД');});
  buttons.append(prev,next);panel.append(selection,cost,status,buttons,build);
  const locked=document.createElement('p');locked.className='terminal-note';locked.textContent='Следующие чертежи: преграда → башня. Их предстоит получить в следующих заданиях.';panel.append(locked);render();showBuildingMenu('construction',panel);
 },
 openWarehouse(){
  const q=this.constructionQuest;if(!q.warehouse||this.floorNumber||!inDeck(this.rig,warehouseDeck(q)))return;this.dialogClosed();
  const panel=document.createElement('div');panel.className='lift-console warehouse-controls';
  const summary=document.createElement('p');summary.className='service-readout';panel.append(summary);
  const render=()=>{const close=panel.querySelector('.close-dialog');panel.replaceChildren();summary.textContent='Склад '+stockCount(q.stock)+'/'+WAREHOUSE_CAPACITY+' · Бур '+cargoCount(this.cargoHold)+'/200';if(!summary.isConnected)panel.append(summary);
   for(const m of MATERIALS){if(!this.cargoHold[m.id]&&!q.stock[m.id])continue;const row=document.createElement('div');row.className='warehouse-row';const name=document.createElement('strong');name.textContent=m.name+' · бур '+(this.cargoHold[m.id]||0)+' / склад '+(q.stock[m.id]||0);const amount=document.createElement('input');amount.type='number';amount.min='1';amount.max=String(WAREHOUSE_CAPACITY);amount.value=String(Math.max(this.cargoHold[m.id]||0,q.stock[m.id]||0));amount.setAttribute('aria-label','Количество: '+m.name);row.append(name,amount);
    for(const [deposit,label] of [[true,'СЛОЖИТЬ'],[false,'ЗАБРАТЬ']]){const button=document.createElement('button');button.className='floor-button';button.textContent=label;button.disabled=deposit?!this.cargoHold[m.id]||stockCount(q.stock)>=WAREHOUSE_CAPACITY:!q.stock[m.id]||cargoCount(this.cargoHold)>=200;button.addEventListener('click',()=>{transferWarehouse(q,this.cargoHold,m.id,Number(amount.value),deposit);this.cargo=cargoCount(this.cargoHold);this.refreshHUD();this.persist();render();});row.append(button);}panel.append(row);}
   if(!stockCount(q.stock)&&!cargoCount(this.cargoHold)){const p=document.createElement('p');p.textContent='Пока пусто. Привези породу в грузовом отсеке.';panel.append(p);}
   if(close)panel.append(close);
  };render();showBuildingMenu('warehouse',panel);
 },
 refreshConstructionHUD(){
  const q=this.constructionQuest;if(!q?.briefed)return;
  const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');
  if(this.floorNumber===4){name.textContent='Есть кому строить';radio.textContent=q.rescued?'Мастер на борту. Вернись на базу через лифт.':q.signalHeard?'Слышны удары по трубе. Расчисти вход и убей пауков у комнаты.':'Ищи строительного мастера по слабому сигналу.';const distance=Math.hypot(this.rig.x-(BUILDER_SITE.x+.5)*CELL,this.rig.y-(BUILDER_SITE.y+.5)*CELL)/CELL;status.textContent=q.rescued?'Лифт: '+objectiveBearing(this.rig,FLOOR_LIFT):'Сигнал: '+(distance>18?'слабый':distance>10?'средний':'сильный')+' · '+objectiveBearing(this.rig,BUILDER_SITE)+' · Вход: '+(3-builderEntranceLeft(this.world))+'/3 · Пауки: '+(this.spiders?.filter(s=>s.hp<=0).length||0)+'/3';return;}
  if(this.floorNumber)return;
  name.textContent=q.unlocked?'Первый склад':'Есть кому строить';radio.textContent=q.unlocked?'Стол с чертежами рядом с Серёгой. Выбери площадку, собери материалы и построй склад.':q.rescued?'Мастер спасён. Он готов открыть строительство на базе.':'Серёга выдал карту четвёртого этажа. Найди мастера за завалом.';
  status.textContent=q.warehouse?'Склад готов · '+stockCount(q.stock)+'/'+WAREHOUSE_CAPACITY+' · '+objectiveBearing(this.rig,{x:WAREHOUSE_PLOTS[q.plot].x+1,y:WAREHOUSE_PLOTS[q.plot].y+2}):q.remaining!=null?'Строительство: '+Math.ceil(q.remaining/1000)+' с':q.unlocked?'Площадка: '+objectiveBearing(this.rig,{x:WAREHOUSE_PLOTS[q.plot].x+1,y:WAREHOUSE_PLOTS[q.plot].y+2})+' · Завал: '+plotBlocked(q,this.world)+' · Земля '+(this.cargoHold.earth||0)+'/80 · Камень '+(this.cargoHold.stone||0)+'/20':'Карта задания: этаж 4';
 }
};
