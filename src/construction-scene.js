import { demyanGeometry } from './demyan-state.js';
import { buildingGeometry, buildingClearance, rectanglesOverlap } from './building-layout-state.js';
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
  this.migrateArchitectFootprint();
  const footprints=[buildingGeometry(this.buildingLayout||{},'architect').footprint,...((this.demyanQuest?.hq||this.demyanQuest?.remaining!=null)&&this.demyanQuest.plot?[demyanGeometry(this.demyanQuest).footprint]:[])];for(const f of footprints)for(let y=f.y/CELL;y<(f.y+f.height)/CELL;y++)for(let x=f.x/CELL;x<(f.x+f.width)/CELL;x++){const id=y*50+x;if(!this.world.cleared.has(id)){this.world.cleared.add(id);this.world.damage.delete(id);this.terrain?.paintCell(x,y);}}
 },
 grantStarterWarehouse(announce=true){
  const q=this.constructionQuest;if(this.floorNumber||!q?.unlocked||q.warehouse)return false;
  const others=['lift','porodnik','workshop','armory','repair'].map(key=>buildingGeometry(this.buildingLayout,key).footprint).concat(this.demyanQuest?.plot?[demyanGeometry(this.demyanQuest).footprint]:[]);
  const original={plot:q.plot,offset:q.offset};const candidates=[original,...WAREHOUSE_PLOTS.map((_,plot)=>({plot,offset:{dx:0,dy:0}}))];
  for(let y=12;y<=44;y++)for(let x=2;x<=44;x++)candidates.push({plot:0,offset:{dx:x-WAREHOUSE_PLOTS[0].x,dy:y-WAREHOUSE_PLOTS[0].y}});
  const position=candidates.find(c=>{const g=buildingGeometry({},'warehouse',{...q,...c});return !others.some(f=>rectanglesOverlap(buildingClearance(g.footprint),f))&&!rectanglesOverlap(buildingClearance(g.footprint),buildingGeometry(this.buildingLayout||{},'architect').footprint)&&!rectanglesOverlap(buildingClearance(g.footprint),{x:20*CELL,y:6*CELL,width:10*CELL,height:5*CELL})&&g.footprint.x>=2*CELL&&g.footprint.y>=2*CELL&&g.footprint.x+g.footprint.width<=48*CELL&&g.footprint.y+g.footprint.height<=48*CELL;});
  if(!position)return false;q.plot=position.plot;q.offset=position.offset;q.warehouse=true;q.remaining=null;
  const b=warehouseBody(q);for(let y=b.y/CELL;y<(b.y+b.height)/CELL+1;y++)for(let x=b.x/CELL;x<(b.x+b.width)/CELL;x++){this.world.cleared.add(y*50+x);this.world.damage.delete(y*50+x);this.terrain?.paintCell(x,y);}
  this.renderConstruction();
  if(announce&&this.rig)this.rewardQuest('warehouseReady');else{const reward=claimQuestReward(this.questRewards,'warehouseReady',this.credits);this.credits=reward.credits;}return true;
 },
 migrateArchitectFootprint(){
  if(this.floorNumber||!this.constructionQuest?.unlocked)return;
  const q=this.constructionQuest,head=this.demyanQuest,architect=buildingGeometry(this.buildingLayout||{},'architect').footprint;
  const keys=['lift','porodnik','workshop','armory','repair',...(q.warehouse||q.remaining!=null?['warehouse']:[]),...(head?.plot?['hq']:[]),...['housing','power'].filter(k=>this.baseProjects?.[k]?.built||this.baseProjects?.[k]?.remaining!=null)];
  const geometry=key=>key==='hq'?demyanGeometry(head):this.buildingGeom(key);
  for(const key of keys){
   const original=geometry(key);const bounds=original.footprint;const conflict=keys.filter(k=>k!==key).some(k=>rectanglesOverlap(buildingClearance(bounds),geometry(k).footprint))||bounds.x+bounds.width>48*CELL||bounds.y+bounds.height>48*CELL;if(!conflict&&!rectanglesOverlap(buildingClearance(bounds),architect))continue;
   const others=keys.filter(k=>k!==key).map(k=>geometry(k).footprint),f=original.footprint,w=Math.ceil(f.width/CELL),h=Math.ceil(f.height/CELL),choices=[];
   for(let y=2;y<=48-h;y++)for(let x=2;x<=48-w;x++){const candidate={x:x*CELL,y:y*CELL,width:f.width,height:f.height};const passage=buildingClearance(candidate);if(rectanglesOverlap(passage,architect)||rectanglesOverlap(passage,{x:20*CELL,y:6*CELL,width:10*CELL,height:5*CELL})||others.some(o=>rectanglesOverlap(passage,o)))continue;let rubble=0;for(let cy=y;cy<y+h;cy++)for(let cx=x;cx<x+w;cx++)if(this.world.blocked(cx,cy))rubble++;choices.push({x,y,score:rubble*1000+(candidate.x-f.x)**2/CELL**2+(candidate.y-f.y)**2/CELL**2});}
   const position=choices.sort((a,b)=>a.score-b.score)[0];if(!position)continue;
   const dx=position.x-f.x/CELL,dy=position.y-f.y/CELL;
   if(key==='hq')head.plot={x:head.plot.x+dx,y:head.plot.y+dy};
   else if(key==='warehouse')q.offset={dx:(q.offset?.dx||0)+dx,dy:(q.offset?.dy||0)+dy};
   else this.buildingLayout[key]={dx:(this.buildingLayout[key]?.dx||0)+dx,dy:(this.buildingLayout[key]?.dy||0)+dy};
   for(let cy=Math.max(2,position.y-1);cy<Math.min(48,position.y+h+1);cy++)for(let cx=Math.max(2,position.x-1);cx<Math.min(48,position.x+w+1);cx++){this.world.cleared.add(cy*50+cx);this.world.damage.delete(cy*50+cx);}
  }
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
   const deck=buildingGeometry(this.buildingLayout||{},'architect').deck,x=deck.x+deck.width/2,y=deck.y+deck.height/2;
   this.builderAtBase=makePerson(this,x+76,y,'serega').setVisible(q.unlocked);this.builderAtBase.workerArt.setTint(0xa7cde9);this.builderAtBase.workerPrevious.setTint(0xa7cde9);
   this.builderSerega=makePerson(this,x-76,y,'serega').setVisible(q.unlocked);
   this.architectHouse=this.add.image(buildingGeometry(this.buildingLayout||{},'architect').footprint.x,buildingGeometry(this.buildingLayout||{},'architect').footprint.y,'architect-house').setOrigin(0).setDisplaySize(buildingGeometry(this.buildingLayout||{},'architect').footprint.width,buildingGeometry(this.buildingLayout||{},'architect').footprint.height).setDepth(5).setVisible(q.unlocked);
   this.warehouseHouse=this.add.image(0,0,'warehouse-house').setOrigin(0).setDisplaySize(3*CELL,3*CELL).setDepth(5).setVisible(false);
   this.renderConstruction();
  }
 },
 constructionAction(){
  const q=this.constructionQuest;if(!q)return null;
  if(this.floorNumber===4&&q.briefed&&!q.rescued&&nearWorkshopItem(this.rig,BUILDER_SITE))return canRescueBuilder(q,this.world,this.spiders||[])?'builder':'builderBlocked';
  if(this.floorNumber)return null;
  if(this.settlementAction?.())return 'settlement';
  if(q.warehouse&&inDeck(this.rig,warehouseDeck(q)))return 'warehouse';
  if(q.unlocked&&inDeck(this.rig,buildingGeometry(this.buildingLayout||{},'architect').deck))return 'construction';return null;
 },
 interactConstruction(){
  const action=this.constructionAction();if(action==='settlement')return this.interactSettlement();
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
  this.prepareArchitectHouse();const g=this.constructionArt,q=this.constructionQuest;if(!g)return;this.makeBuildingFoundations?.();g.clear();
  this.builderAtBase?.setVisible(q.unlocked);this.builderSerega?.setVisible(q.unlocked);this.architectHouse?.setVisible(q.unlocked);
  this.warehouseHouse?.setVisible(q.warehouse);if(!q.unlocked)return;
  const b=warehouseBody(q),progress=q.warehouse?1:q.remaining!=null?1-q.remaining/WAREHOUSE_MS:0;
  if(q.warehouse){this.warehouseHouse?.setPosition(b.x,b.y);return;}
  g.fillStyle(0x87c5aa,.12);g.fillRect(b.x,b.y,b.width,b.height+CELL);g.lineStyle(3,q.warehouse?0x6a8276:0xeec874,.8);g.strokeRect(b.x,b.y,b.width,b.height);
  if(!q.warehouse&&q.remaining==null)return;
  g.fillStyle(0x182d2b,.45);g.fillRoundedRect(b.x-5,b.y+8,b.width+12,b.height+4,9);
  g.fillStyle(0x897b61);g.fillRect(b.x,b.y+b.height,b.width,CELL);
  g.lineStyle(2,0xbaa477);for(let x=b.x+10;x<b.x+b.width;x+=24)g.lineBetween(x,b.y+b.height+8,x+12,b.y+b.height+20);
  g.lineStyle(8,0x65533e);for(const x of [b.x+8,b.x+b.width-8])g.lineBetween(x,b.y+10,x,b.y+b.height);
  if(progress>.25){g.fillStyle(0x607e76);g.fillRoundedRect(b.x+4,b.y+12,b.width-8,b.height-14,7);g.lineStyle(2,0x354c48);for(let x=b.x+18;x<b.x+b.width-10;x+=18)g.lineBetween(x,b.y+18,x,b.y+b.height-8);}
  if(progress>.65){g.fillStyle(0x304d4c);g.fillRoundedRect(b.x-6,b.y-6,b.width+12,45,8);g.fillStyle(0x77908a);g.fillRoundedRect(b.x-6,b.y-10,b.width+12,34,8);g.lineStyle(2,0x4b6662);for(let x=b.x+8;x<b.x+b.width;x+=20)g.lineBetween(x,b.y-6,x,b.y+19);}
  g.fillStyle(0x183a31);g.fillRect(b.x+10,b.y+b.height+18,b.width-20,8);g.fillStyle(0xffd078);g.fillRect(b.x+10,b.y+b.height+18,(b.width-20)*progress,8);
 },
 openConstruction(){
  this.openBuildingBlueprints();
 },
 openWarehouse(){
  const q=this.constructionQuest;if(!q.warehouse||this.floorNumber||!inDeck(this.rig,warehouseDeck(q)))return;this.dialogClosed();
  const panel=document.createElement('div');panel.className='lift-console warehouse-controls';
  const summary=document.createElement('p');summary.className='service-readout';panel.append(summary);
  const render=()=>{const close=panel.querySelector('.close-dialog');panel.replaceChildren();summary.textContent='Склад · уровень '+(q.warehouseLevel||1)+' · до '+warehouseCapacity(q)+' каждого материала · Бур '+cargoCount(this.cargoHold)+'/'+this.cargoCapacity();if(!summary.isConnected)panel.append(summary);
   for(const m of MATERIALS){if(!this.cargoHold[m.id]&&!q.stock[m.id])continue;const row=document.createElement('div');row.className='warehouse-row';const name=document.createElement('strong');name.textContent=m.name+' · бур '+(this.cargoHold[m.id]||0)+' / склад '+(q.stock[m.id]||0)+' из '+warehouseCapacity(q);const amount=document.createElement('input');amount.type='number';amount.min='1';amount.max=String(Math.max(warehouseCapacity(q),this.cargoHold[m.id]||0,q.stock[m.id]||0));amount.value=String(Math.max(this.cargoHold[m.id]||0,q.stock[m.id]||0));amount.setAttribute('aria-label','Количество: '+m.name);row.append(name,amount);
    for(const [deposit,label] of [[true,'СЛОЖИТЬ'],[false,'ЗАБРАТЬ']]){const button=document.createElement('button');button.className='floor-button';button.textContent=label;button.disabled=deposit?!this.cargoHold[m.id]||(q.stock[m.id]||0)>=warehouseCapacity(q):!q.stock[m.id]||cargoCount(this.cargoHold)>=this.cargoCapacity();button.addEventListener('click',()=>{transferWarehouse(q,this.cargoHold,m.id,Number(amount.value),deposit,this.cargoCapacity());this.cargo=cargoCount(this.cargoHold);this.refreshHUD();this.persist();render();});row.append(button);}panel.append(row);}
   if(!stockCount(q.stock)&&!cargoCount(this.cargoHold)){const p=document.createElement('p');p.textContent='Пока пусто. Привези породу в грузовом отсеке.';panel.append(p);}
   const upgrade=document.createElement('button');upgrade.className='metal-button';upgrade.textContent=warehouseCapacity(q)>=10000?'СКЛАД УЛУЧШЕН ДО МАКСИМУМА':'УЛУЧШИТЬ · ДО '+(warehouseCapacity(q)+100)+' КАЖДОГО · '+warehouseUpgradePrice(q)+' КРЕДИТОВ';upgrade.disabled=!this.knowsBuildingBlueprint('warehouse-upgrade')||warehouseCapacity(q)>=10000||this.credits<warehouseUpgradePrice(q);upgrade.addEventListener('click',()=>{const result=upgradeWarehouse(q,this.credits,this.buildingBlueprints);if(!result.bought)return;this.credits=result.credits;this.renderConstruction();this.refreshHUD();this.persist();render();});panel.append(upgrade);if(!this.knowsBuildingBlueprint('warehouse-upgrade')){const blueprint=document.createElement('button');blueprint.className='floor-button';blueprint.textContent='НУЖЕН ЧЕРТЁЖ · ДОМ АРХИТЕКТОРА';blueprint.addEventListener('click',()=>this.openBuildingBlueprints());panel.append(blueprint);}
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
