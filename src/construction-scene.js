import { buildingGeometry, rectanglesOverlap } from './building-layout-state.js';
import { claimQuestReward } from './quest-rewards.js';
import { FLOOR_LIFT } from './lift-state.js';
import { BUILDER_SITE, BUILDER_ENTRANCE, BUILDER_STORIES, CONSTRUCTION_DESK, ARCHITECT_BODY, ARCHITECT_DECK, ARCHITECT_FOOTPRINT, WAREHOUSE_PLOTS, WAREHOUSE_RECIPE, WAREHOUSE_MS, WAREHOUSE_CAPACITY, warehouseCapacity, warehouseUpgradePrice, upgradeWarehouse, warehouseBody, warehouseDeck, plotBlocked, builderEntranceLeft, canRescueBuilder, beginWarehouse, stepConstruction, transferWarehouse, stockCount } from './construction-state.js';
import { CELL } from './base-state.js';
import { nearWorkshopItem, objectiveBearing } from './workshop-state.js';
import { makePerson, updatePerson } from './people-view.js';
import { showBuildingMenu } from './game-menus.js';
import { MATERIALS } from './materials.js';
import { cargoCount } from './cargo-state.js';
const inDeck=(rig,d)=>rig.x>=d.x&&rig.x<=d.x+d.width&&rig.y>=d.y&&rig.y<=d.y+d.height;
export const constructionMethods={
 prepareArchitectHouse(){
  if(this.floorNumber||!this.constructionQuest?.unlocked)return;
  const f=ARCHITECT_FOOTPRINT;for(let y=f.y/CELL;y<(f.y+f.height)/CELL;y++)for(let x=f.x/CELL;x<(f.x+f.width)/CELL;x++){const id=y*50+x;if(!this.world.cleared.has(id)){this.world.cleared.add(id);this.world.damage.delete(id);this.terrain?.paintCell(x,y);}}
 },
 grantStarterWarehouse(announce=true){
  const q=this.constructionQuest;if(this.floorNumber||!q?.unlocked||q.warehouse)return false;
  const others=['lift','porodnik','workshop','armory','repair'].map(key=>buildingGeometry(this.buildingLayout,key).footprint);
  const original={plot:q.plot,offset:q.offset};const candidates=[original,...WAREHOUSE_PLOTS.map((_,plot)=>({plot,offset:{dx:0,dy:0}}))];
  for(let y=12;y<=44;y++)for(let x=2;x<=44;x++)candidates.push({plot:0,offset:{dx:x-WAREHOUSE_PLOTS[0].x,dy:y-WAREHOUSE_PLOTS[0].y}});
  const position=candidates.find(c=>{const g=buildingGeometry({},'warehouse',{...q,...c});return !others.some(f=>rectanglesOverlap(g.footprint,f))&&!rectanglesOverlap(g.footprint,ARCHITECT_FOOTPRINT)&&!rectanglesOverlap(g.footprint,{x:20*CELL,y:6*CELL,width:10*CELL,height:5*CELL})&&g.footprint.x>=2*CELL&&g.footprint.y>=2*CELL&&g.footprint.x+g.footprint.width<=48*CELL&&g.footprint.y+g.footprint.height<=48*CELL;});
  if(!position)return false;q.plot=position.plot;q.offset=position.offset;q.warehouse=true;q.remaining=null;
  const b=warehouseBody(q);for(let y=b.y/CELL;y<(b.y+b.height)/CELL+1;y++)for(let x=b.x/CELL;x<(b.x+b.width)/CELL;x++){this.world.cleared.add(y*50+x);this.world.damage.delete(y*50+x);this.terrain?.paintCell(x,y);}
  this.renderConstruction();
  if(announce&&this.rig)this.rewardQuest('warehouseReady');else{const reward=claimQuestReward(this.questRewards,'warehouseReady',this.credits);this.credits=reward.credits;}return true;
 },
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
   this.builderAtBase=makePerson(this,x+76,y+32,'serega').setVisible(q.unlocked);this.builderAtBase.workerArt.setTint(0xa7cde9);this.builderAtBase.workerPrevious.setTint(0xa7cde9);
   this.builderSerega=makePerson(this,x-76,y+32,'serega').setVisible(q.unlocked);
   this.architectHouse=this.add.image(ARCHITECT_FOOTPRINT.x,ARCHITECT_FOOTPRINT.y,'architect-house').setOrigin(0).setDisplaySize(ARCHITECT_FOOTPRINT.width,ARCHITECT_FOOTPRINT.height).setDepth(5).setVisible(q.unlocked);
   this.architectSign=this.add.text(x,ARCHITECT_BODY.y-10,'ДОМ АРХИТЕКТОРА',{fontFamily:'Arial',fontSize:'13px',fontStyle:'bold',color:'#ffe2a1',backgroundColor:'#203e36',padding:{x:5,y:3}}).setOrigin(.5).setDepth(8).setVisible(q.unlocked);
   this.warehouseSign=this.add.text(0,0,'СКЛАД',{fontFamily:'Arial',fontSize:'18px',fontStyle:'bold',color:'#ffdfa0',backgroundColor:'#29433b',padding:{x:12,y:3}}).setOrigin(.5).setDepth(7).setVisible(false);
   this.renderConstruction();
  }
 },
 constructionAction(){
  const q=this.constructionQuest;if(!q)return null;
  if(this.floorNumber===4&&q.briefed&&!q.rescued&&nearWorkshopItem(this.rig,BUILDER_SITE))return canRescueBuilder(q,this.world,this.spiders||[])?'builder':'builderBlocked';
  if(this.floorNumber)return null;
  if(q.warehouse&&inDeck(this.rig,warehouseDeck(q)))return 'warehouse';
  if(q.unlocked&&inDeck(this.rig,ARCHITECT_DECK))return 'construction';return null;
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
  if(this.layoutEditing||this.busy||this.storyActive||document.querySelector('#dialog').open||this.world.dialogue||this.workshopQuest.dialogue||this.armoryQuest.dialogue||this.repairQuest.dialogue)return;
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
  this.prepareArchitectHouse();const g=this.constructionArt,q=this.constructionQuest;if(!g)return;g.clear();
  this.builderAtBase?.setVisible(q.unlocked);this.builderSerega?.setVisible(q.unlocked);this.architectHouse?.setVisible(q.unlocked);this.architectSign?.setVisible(q.unlocked);
  this.warehouseSign?.setVisible(q.warehouse);if(!q.unlocked)return;
  const b=warehouseBody(q),progress=q.warehouse?1:q.remaining!=null?1-q.remaining/WAREHOUSE_MS:0;
  g.fillStyle(0x87c5aa,.12);g.fillRect(b.x,b.y,b.width,b.height+CELL);g.lineStyle(3,q.warehouse?0x6a8276:0xeec874,.8);g.strokeRect(b.x,b.y,b.width,b.height);
  if(!q.warehouse&&q.remaining==null)return;
  g.fillStyle(0x182d2b,.45);g.fillRoundedRect(b.x-5,b.y+8,b.width+12,b.height+4,9);
  g.fillStyle(0x897b61);g.fillRect(b.x,b.y+b.height,b.width,CELL);
  g.lineStyle(2,0xbaa477);for(let x=b.x+10;x<b.x+b.width;x+=24)g.lineBetween(x,b.y+b.height+8,x+12,b.y+b.height+20);
  g.lineStyle(8,0x65533e);for(const x of [b.x+8,b.x+b.width-8])g.lineBetween(x,b.y+10,x,b.y+b.height);
  if(progress>.25){g.fillStyle(0x607e76);g.fillRoundedRect(b.x+4,b.y+12,b.width-8,b.height-14,7);g.lineStyle(2,0x354c48);for(let x=b.x+18;x<b.x+b.width-10;x+=18)g.lineBetween(x,b.y+18,x,b.y+b.height-8);}
  if(progress>.65){g.fillStyle(0x304d4c);g.fillRoundedRect(b.x-6,b.y-6,b.width+12,45,8);g.fillStyle(0x77908a);g.fillRoundedRect(b.x-6,b.y-10,b.width+12,34,8);g.lineStyle(2,0x4b6662);for(let x=b.x+8;x<b.x+b.width;x+=20)g.lineBetween(x,b.y-6,x,b.y+19);}
  if(q.warehouse){
   g.fillStyle(0x203834);g.fillRoundedRect(b.x+55,b.y+43,82,83,4);g.fillStyle(0x928a6a);g.fillRect(b.x+59,b.y+46,74,18);g.lineStyle(2,0x484e40);for(let y=b.y+50;y<b.y+65;y+=5)g.lineBetween(b.x+60,y,b.x+132,y);
   for(const [dx,dy] of [[13,85],[30,98],[148,92]]){g.fillStyle(0xb58b4e);g.fillRoundedRect(b.x+dx,b.y+dy,26,25,3);g.lineStyle(2,0x705532);g.strokeRect(b.x+dx+3,b.y+dy+3,20,19);g.lineBetween(b.x+dx+4,b.y+dy+4,b.x+dx+22,b.y+dy+21);}
   g.fillStyle(0xffd578);g.fillCircle(b.x+48,b.y+57,4);g.fillCircle(b.x+144,b.y+57,4);this.warehouseSign.setText('СКЛАД · '+(q.warehouseLevel||1)).setPosition(b.x+b.width/2,b.y+28);
  }
  else {g.fillStyle(0x183a31);g.fillRect(b.x+10,b.y+b.height+18,b.width-20,8);g.fillStyle(0xffd078);g.fillRect(b.x+10,b.y+b.height+18,(b.width-20)*progress,8);}
 },
 openConstruction(){
  const q=this.constructionQuest;if(!q.unlocked||this.floorNumber)return;this.dialogClosed();this.persist();
  if(q.warehouse){const panel=document.createElement('div');panel.className='lift-console construction-controls';const text=document.createElement('p');text.className='service-readout';text.textContent='ПЕРВЫЙ СКЛАД ГОТОВ · БЕСПЛАТНО';const note=document.createElement('p');note.className='terminal-note';note.textContent='Подъезжай к воротам склада для хранения материалов. Следующие чертежи: преграда → башня. Их предстоит получить в следующих заданиях.';panel.append(text,note);showBuildingMenu('construction',panel);return;}
  const panel=document.createElement('div');panel.className='lift-console construction-controls';
  const title=document.createElement('p');title.className='service-readout';title.textContent='ПЕРВЫЙ ЧЕРТЁЖ · СКЛАД\nЗапас на '+WAREHOUSE_CAPACITY+' каждого материала';panel.append(title);
  const selection=document.createElement('p'),cost=document.createElement('p'),status=document.createElement('p');status.className='service-status';status.setAttribute('role','status');
  const buttons=document.createElement('div');buttons.className='construction-plot-buttons';
  const prev=document.createElement('button'),next=document.createElement('button'),build=document.createElement('button');prev.className=next.className='floor-button';build.className='metal-button';prev.textContent='← МЕСТО';next.textContent='МЕСТО →';
  const render=()=>{const plot=WAREHOUSE_PLOTS[q.plot];selection.textContent='Площадка: '+plot.name+' · '+objectiveBearing(this.rig,{x:plot.x+1,y:plot.y+2});cost.textContent=Object.entries(WAREHOUSE_RECIPE).map(([id,n])=>MATERIALS.find(m=>m.id===id).name+': '+((this.cargoHold[id]||0)+(q.stock[id]||0))+'/'+n).join(' · ');const blocked=plotBlocked(q,this.world);status.textContent=q.warehouse?'Склад готов. Подъезжай к воротам, чтобы хранить и забирать материалы.':q.remaining!=null?'Стройка началась. Можно ехать по своим делам.':'Расчисти площадку 3×3: осталось '+blocked+' блоков. Разметка показана на базе.';prev.disabled=next.disabled=q.warehouse||q.remaining!=null;build.textContent=q.warehouse?'СКЛАД ПОСТРОЕН':q.remaining!=null?'СТРОИТЕЛЬСТВО…':'ПОСТРОИТЬ · 10 СЕКУНД';build.disabled=q.warehouse||q.remaining!=null||blocked>0||Object.entries(WAREHOUSE_RECIPE).some(([id,n])=>(this.cargoHold[id]||0)+(q.stock[id]||0)<n);};
  const choose=step=>{if(q.warehouse||q.remaining!=null)return;q.plot=(q.plot+step+WAREHOUSE_PLOTS.length)%WAREHOUSE_PLOTS.length;q.offset={dx:0,dy:0};this.renderConstruction();render();this.refreshHUD();this.persist();};prev.addEventListener('click',()=>choose(-1));next.addEventListener('click',()=>choose(1));
  build.addEventListener('click',()=>{if(!beginWarehouse(q,this.world,this.cargoHold,this.rig)){status.textContent='Не хватает материалов, площадка занята или бур стоит на месте стройки.';return;}this.cargo=cargoCount(this.cargoHold);this.renderConstruction();this.refreshHUD();this.persist();document.querySelector('#dialog').close();this.notify('СТРОЙКА НАЧАЛАСЬ · СЕРЁГА И МАСТЕР СОБИРАЮТ СКЛАД');});
  buttons.append(prev,next);panel.append(selection,cost,status,buttons,build);
  const locked=document.createElement('p');locked.className='terminal-note';locked.textContent='Следующие чертежи: преграда → башня. Их предстоит получить в следующих заданиях.';panel.append(locked);render();showBuildingMenu('construction',panel);
 },
 openWarehouse(){
  const q=this.constructionQuest;if(!q.warehouse||this.floorNumber||!inDeck(this.rig,warehouseDeck(q)))return;this.dialogClosed();
  const panel=document.createElement('div');panel.className='lift-console warehouse-controls';
  const summary=document.createElement('p');summary.className='service-readout';panel.append(summary);
  const render=()=>{const close=panel.querySelector('.close-dialog');panel.replaceChildren();summary.textContent='Склад · уровень '+(q.warehouseLevel||1)+' · до '+warehouseCapacity(q)+' каждого материала · Бур '+cargoCount(this.cargoHold)+'/'+this.cargoCapacity();if(!summary.isConnected)panel.append(summary);
   for(const m of MATERIALS){if(!this.cargoHold[m.id]&&!q.stock[m.id])continue;const row=document.createElement('div');row.className='warehouse-row';const name=document.createElement('strong');name.textContent=m.name+' · бур '+(this.cargoHold[m.id]||0)+' / склад '+(q.stock[m.id]||0)+' из '+warehouseCapacity(q);const amount=document.createElement('input');amount.type='number';amount.min='1';amount.max=String(Math.max(warehouseCapacity(q),this.cargoHold[m.id]||0,q.stock[m.id]||0));amount.value=String(Math.max(this.cargoHold[m.id]||0,q.stock[m.id]||0));amount.setAttribute('aria-label','Количество: '+m.name);row.append(name,amount);
    for(const [deposit,label] of [[true,'СЛОЖИТЬ'],[false,'ЗАБРАТЬ']]){const button=document.createElement('button');button.className='floor-button';button.textContent=label;button.disabled=deposit?!this.cargoHold[m.id]||(q.stock[m.id]||0)>=warehouseCapacity(q):!q.stock[m.id]||cargoCount(this.cargoHold)>=this.cargoCapacity();button.addEventListener('click',()=>{transferWarehouse(q,this.cargoHold,m.id,Number(amount.value),deposit,this.cargoCapacity());this.cargo=cargoCount(this.cargoHold);this.refreshHUD();this.persist();render();});row.append(button);}panel.append(row);}
   if(!stockCount(q.stock)&&!cargoCount(this.cargoHold)){const p=document.createElement('p');p.textContent='Пока пусто. Привези породу в грузовом отсеке.';panel.append(p);}
   const upgrade=document.createElement('button');upgrade.className='metal-button';upgrade.textContent=warehouseCapacity(q)>=10000?'СКЛАД УЛУЧШЕН ДО МАКСИМУМА':'УЛУЧШИТЬ · ДО '+(warehouseCapacity(q)+100)+' КАЖДОГО · '+warehouseUpgradePrice(q)+' КРЕДИТОВ';upgrade.disabled=warehouseCapacity(q)>=10000||this.credits<warehouseUpgradePrice(q);upgrade.addEventListener('click',()=>{const result=upgradeWarehouse(q,this.credits);if(!result.bought)return;this.credits=result.credits;this.renderConstruction();this.refreshHUD();this.persist();render();});panel.append(upgrade);
   const note=document.createElement('p');note.className='terminal-note';note.textContent='Каждый материал занимает собственную секцию. Старые запасы сверх лимита сохранены: их можно забрать, но пополнить секцию получится после освобождения места или улучшения.';panel.append(note);
   if(close)panel.append(close);
  };render();showBuildingMenu('warehouse',panel);
 },
 refreshConstructionHUD(){
  const q=this.constructionQuest;if(!q?.briefed)return;
  const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');
  if(this.floorNumber===4){name.textContent='Есть кому строить';radio.textContent=q.rescued?'Мастер на борту. Вернись на базу через лифт.':q.signalHeard?'Слышны удары по трубе. Расчисти вход и убей пауков у комнаты.':'Ищи строительного мастера по слабому сигналу.';const distance=Math.hypot(this.rig.x-(BUILDER_SITE.x+.5)*CELL,this.rig.y-(BUILDER_SITE.y+.5)*CELL)/CELL;status.textContent=q.rescued?'Лифт: '+objectiveBearing(this.rig,FLOOR_LIFT):'Сигнал: '+(distance>18?'слабый':distance>10?'средний':'сильный')+' · '+objectiveBearing(this.rig,BUILDER_SITE)+' · Вход: '+(3-builderEntranceLeft(this.world))+'/3 · Пауки: '+(this.spiders?.filter(s=>s.hp<=0).length||0)+'/3';return;}
  if(this.floorNumber)return;
  name.textContent=q.unlocked?'Первый склад':'Есть кому строить';radio.textContent=q.unlocked?'Первый склад уже готов. Подъезжай к воротам, чтобы оставить материалы или забрать запас.':q.rescued?'Мастер спасён. Он готов открыть строительство на базе.':'Серёга выдал карту четвёртого этажа. Найди мастера за завалом.';
  status.textContent=q.warehouse?'Склад готов · '+stockCount(q.stock)+' ед. · до '+warehouseCapacity(q)+' каждого'+' · '+objectiveBearing(this.rig,this.buildingPoint('warehouse')):q.remaining!=null?'Строительство: '+Math.ceil(q.remaining/1000)+' с':q.unlocked?'Площадка: '+objectiveBearing(this.rig,this.buildingPoint('warehouse'))+' · Завал: '+plotBlocked(q,this.world)+' · Земля '+(this.cargoHold.earth||0)+'/80 · Камень '+(this.cargoHold.stone||0)+'/20':'Карта задания: этаж 4';
 }
};
