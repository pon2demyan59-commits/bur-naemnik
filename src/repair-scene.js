import { REPAIR_BODY, REPAIR_DECK, REPAIR_KIT_SITE, REPAIRMAN_SITE, repairBlockCount, canRestoreRepair, onRepairDeck, buyRepair, repairPrice, DRILL_MAX_HP } from './repair-state.js';
import { nearWorkshopItem, objectiveBearing } from './workshop-state.js';
import { WorkshopView } from './workshop-view.js';
import { makePerson } from './people-view.js';
import { CELL } from './base-state.js';
import { FLOOR_LIFT } from './lift-state.js';
export const repairMethods={
 makeRepairObjects(){
  const q=this.repairQuest;
  if(!this.floorNumber){this.repairShop=new WorkshopView(this,{body:REPAIR_BODY,deck:REPAIR_DECK,key:'repair-shop',sign:'РЕМОНТНЫЙ ЦЕХ'});this.repairShop.powered(q.ready);
  }
  if(this.floorNumber!==3)return;
  this.repairman=makePerson(this,(REPAIRMAN_SITE.x+.5)*CELL,(REPAIRMAN_SITE.y+.5)*CELL,'ilya').setVisible(!q.rescued);
  this.repairKitArt=this.add.container((REPAIR_KIT_SITE.x+.5)*CELL,(REPAIR_KIT_SITE.y+.5)*CELL).setDepth(10).setVisible(!q.kit);
  const g=this.add.graphics();g.fillStyle(0x234645);g.fillRoundedRect(-22,-15,44,32,4);g.lineStyle(3,0xf4c77b);g.strokeRoundedRect(-22,-15,44,32,4);
  g.lineStyle(4,0xd9bd83);g.lineBetween(-8,-15,-8,-22);g.lineBetween(-8,-22,8,-22);g.lineBetween(8,-22,8,-15);
  g.fillStyle(0xb9eee1);g.fillRect(-3,-8,6,20);g.fillRect(-10,-1,20,6);this.repairKitArt.add(g);
 },
 repairFloorAction(){
  if(this.floorNumber!==3||!this.repairQuest.briefed)return null;
  if(!this.repairQuest.rescued&&nearWorkshopItem(this.rig,REPAIRMAN_SITE))return 'repairman';
  if(!this.repairQuest.kit&&nearWorkshopItem(this.rig,REPAIR_KIT_SITE))return 'repairKit';
  return null;
 },
 collectRepairItem(kind){
  const q=this.repairQuest;
  if(kind==='repairKit'&&!q.kit){q.kit=true;this.repairKitArt.setVisible(false);this.notify('РЕМОНТНЫЙ КОМПЛЕКТ НА БОРТУ');}
  if(kind==='repairman'&&!q.rescued){q.rescued=true;this.repairman.setVisible(false);this.repairPassenger.setVisible(true);this.startStory('repairman');}
  this.refreshHUD();this.persist();
 },
 checkRepair(){
  const q=this.repairQuest;
  if(this.busy||this.storyActive||document.querySelector('#dialog').open||this.world.dialogue||this.workshopQuest.dialogue||this.armoryQuest.dialogue||this.armoryQuest.serviceRemaining!=null||this.workshopQuest.serviceRemaining!=null||q.serviceRemaining!=null)return;
  if(q.dialogue){if(q.dialogue==='repairBrief'&&this.floorNumber)return;this.startStory(q.dialogue);return;}
  if(this.floorNumber)return;
  if(!q.briefed&&this.armoryQuest.installed){this.startStory('repairBrief');return;}
  if(q.kit&&q.rescued&&!q.returnBriefed){this.startStory('repairReturn');return;}
  if(!q.ready&&canRestoreRepair(q,this.world)){
   q.ready=true;this.repairShop.powered(true);this.repairPassenger.setVisible(false);this.persist();this.startStory('repairReady');return;
  }
  if(q.ready&&q.wave==='idle')this.startStory('waveBrief');
 },
 openRepair(){
  const q=this.repairQuest;
  if(!q.ready||q.serviceRemaining!=null||!onRepairDeck(this.rig)||q.wave==='active')return;
  this.dialogClosed();this.persist();
  const panel=document.createElement('div');panel.className='lift-console';
  const text=document.createElement('p');text.textContent='Илья К · Прочность: '+Math.ceil(this.hull)+'/'+DRILL_MAX_HP+' · Кредиты: '+this.credits;
  const button=document.createElement('button');button.className='metal-button';button.textContent='ВОССТАНОВИТЬ БУР · '+repairPrice(this.hull)+' КРЕДИТОВ';
  button.disabled=this.hull>=DRILL_MAX_HP||this.credits<repairPrice(this.hull);
  button.addEventListener('click',()=>{
   const result=buyRepair(q,this.hull,this.credits);if(!result.bought)return;
   this.hull=result.hp;this.credits=result.credits;document.querySelector('#dialog').close();this.dialogClosed();this.refreshHUD();this.persist();
  });
  panel.append(text,button);document.querySelector('#dialog-title').textContent='РЕМОНТНЫЙ ЦЕХ';document.querySelector('#dialog-body').replaceChildren(panel);document.querySelector('#dialog').showModal();
 },
 refreshRepairHUD(){
  const q=this.repairQuest;if(!q.briefed)return;
  const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');
  if(q.wave==='active'&&!this.floorNumber){
   name.textContent='Защитить бункер №72';radio.textContent='Союзники прикрывают тебя. Пушка стреляет автоматически — держи пауков в радиусе двух клеток.';
   status.textContent='Отбито: '+(this.spiders?.filter(s=>s.hp<=0).length||0)+'/20 · Союзники на позиции';return;
  }
  if(this.floorNumber===3){
   name.textContent='Ремонтный комплект';radio.textContent=q.kit&&q.rescued?'Илья и комплект на борту. Возвращайся на базу.':'Пауки рядом. Найди ремонтный комплект и спаси Илью К.';
   status.textContent=q.kit&&q.rescued?'Лифт: '+objectiveBearing(this.rig,FLOOR_LIFT):'Комплект: '+(q.kit?'✓':objectiveBearing(this.rig,REPAIR_KIT_SITE))+' · Илья: '+(q.rescued?'✓':objectiveBearing(this.rig,REPAIRMAN_SITE));return;
  }
  if(this.floorNumber)return;
  if(q.ready){name.textContent=q.wave==='done'?'База выстояла':'Ремонтный цех работает';radio.textContent=q.wave==='done'?'Первая атака отбита. Дальше нужно укреплять периметр и строить оборону. Илья чинит бур в ремонтном цехе.':'Илья запустил оборудование. Заезжай в цех, чтобы восстановить прочность.';status.textContent='Цех: '+objectiveBearing(this.rig,{x:8,y:34})+' · Прочность: '+Math.ceil(this.hull)+'/'+DRILL_MAX_HP;}
  else if(q.kit&&q.rescued){name.textContent='Восстановить ремонтный цех';radio.textContent='Илья и комплект доставлены. Расчисти ворота цеха слева от «Породника».';status.textContent='Ворота: '+(3-repairBlockCount(this.world))+'/3 · Цех: '+objectiveBearing(this.rig,{x:8,y:34});}
  else{name.textContent='Третий этаж: первый бой';radio.textContent='Константину нужен ремонтный комплект. На третьем этаже остался ремонтник Илья К. Пушка установлена — можно спускаться.';status.textContent='Получена ключ-карта третьего этажа';}
 }
};
