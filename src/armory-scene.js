import { queueRepairBrief } from './repair-state.js';
import { makePerson } from './people-view.js';
import { ARMORY_BODY, ARMORY_DECK, ARMORY_BLOCKS, ARMORER_SITE, BLUEPRINT_SITE, armoryBlockCount, canRestoreArmory, onArmoryDeck, installWeapon, buyWeaponUpgrade, weaponUpgradePrice } from './armory-state.js';
import { nearWorkshopItem, objectiveBearing } from './workshop-state.js';
import { WorkshopView } from './workshop-view.js';
import { FLOOR_LIFT } from './lift-state.js';
import { CELL } from './base-state.js';
export const armoryMethods={
 makeArmoryObjects() {
  const q=this.armoryQuest;
  if(!this.floorNumber){this.armory=new WorkshopView(this,{body:ARMORY_BODY,deck:ARMORY_DECK,key:'armory'});this.armory.powered(q.ready);}
  if(this.floorNumber!==2)return;
  const label=(site,text)=>this.add.text((site.x+.5)*CELL,(site.y+.5)*CELL-55,text,{fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:'#173c3c',backgroundColor:'#ffd372',padding:{x:7,y:4}}).setOrigin(.5).setDepth(11);
  this.armorer=makePerson(this,(ARMORER_SITE.x+.5)*CELL,(ARMORER_SITE.y+.5)*CELL,'armorer').setVisible(!q.rescued);
  this.armorerMarker=label(ARMORER_SITE,'! ОРУЖЕЙНИК').setVisible(!q.rescued);
  this.blueprintArt=this.add.container((BLUEPRINT_SITE.x+.5)*CELL,(BLUEPRINT_SITE.y+.5)*CELL).setDepth(10).setVisible(q.rescued&&!q.blueprint);
  const g=this.add.graphics();g.fillStyle(0x283b42);g.fillRoundedRect(-23,-25,46,50,3);g.lineStyle(3,0xaec0b8);g.strokeRect(-22,-24,44,48);g.fillStyle(0x377d95);g.fillRect(-16,-18,32,33);g.lineStyle(2,0xc1e9ee);g.lineBetween(-10,0,12,0);g.strokeCircle(-7,0,4);g.lineBetween(-2,-7,8,-7);g.lineBetween(-2,7,8,7);this.blueprintArt.add(g);
  this.blueprintMarker=label(BLUEPRINT_SITE,'! ЧЕРТЁЖ ПУШКИ').setVisible(q.rescued&&!q.blueprint);
 },
 armoryFloorAction() {
  if(this.floorNumber!==2||!this.armoryQuest.briefed)return null;
  const q=this.armoryQuest;
  if(!q.rescued&&nearWorkshopItem(this.rig,ARMORER_SITE))return 'armorer';
  if(q.rescued&&!q.blueprint&&nearWorkshopItem(this.rig,BLUEPRINT_SITE))return 'blueprint';
  return null;
 },
 collectArmoryItem(kind) {
  const q=this.armoryQuest;
  if(kind==='armorer'&&!q.rescued){q.rescued=true;q.gifted=true;this.armorer.setVisible(false);this.armorerMarker.setVisible(false);this.blueprintArt.setVisible(true);this.blueprintMarker.setVisible(true);this.armorerPassenger?.setVisible(true);this.startStory('armorer');}
  if(kind==='blueprint'&&q.rescued&&!q.blueprint){q.blueprint=true;this.blueprintArt.setVisible(false);this.blueprintMarker.setVisible(false);this.notify('НАЙДЕН ЧЕРТЁЖ · ПЕРВАЯ ПУШКА');}
  this.refreshHUD();this.persist();
 },
 checkArmory() {
  const q=this.armoryQuest;if(!q||this.busy||this.storyActive||this.world.dialogue||this.workshopQuest.dialogue||this.workshopQuest.serviceRemaining!=null||q.serviceRemaining!=null||document.querySelector('#dialog').open)return;
  if(q.dialogue){this.startStory(q.dialogue);return;}
  if(this.floorNumber)return;
  if(!q.briefed&&this.workshopQuest.upgrades>0&&this.workshopQuest.ready){this.startStory('armoryBrief');return;}
  if(q.rescued&&q.blueprint&&!q.returnBriefed){this.startStory('armoryReturn');return;}
  if(!q.ready&&canRestoreArmory(q,this.world)){q.ready=true;this.armory.powered(true);this.armorerPassenger?.setVisible(false);this.persist();this.startStory('armoryReady');}
 },
 openArmory() {
  const q=this.armoryQuest;if(!q.ready||q.serviceRemaining!=null||!onArmoryDeck(this.rig))return;
  this.dialogClosed();this.persist();const panel=document.createElement('div');panel.className='lift-console';
  const text=document.createElement('p');text.textContent=`Оружейник · Первая пушка: ${q.installed?'установлена':'подарок, готова к установке'} · Мощность: ${100+q.weaponLevel*2}% · Кредиты: ${this.credits}`;
  const blueprint=document.createElement('p');blueprint.textContent='Чертёж первой пушки сохранён.';
  const button=document.createElement('button');button.className='metal-button';
  button.textContent=q.installed?`МОДЕРНИЗИРОВАТЬ ПУШКУ +2% · ${weaponUpgradePrice(q)} КРЕДИТОВ`:'УСТАНОВИТЬ ПОДАРЕННУЮ ПУШКУ · БЕСПЛАТНО';button.disabled=q.installed?(q.weaponLevel>=100||this.credits<weaponUpgradePrice(q)):!q.gifted;
  button.addEventListener('click',()=>{let changed;if(q.installed){const result=buyWeaponUpgrade(q,this.credits);changed=result.bought;if(changed)this.credits=result.credits;}else changed=installWeapon(q);if(!changed)return;queueRepairBrief(this.repairQuest,q);document.querySelector('#dialog').close();this.dialogClosed();this.refreshHUD();this.persist();});
  panel.append(text,blueprint,button);document.querySelector('#dialog-title').textContent='ОРУЖЕЙНАЯ';document.querySelector('#dialog-body').replaceChildren(panel);document.querySelector('#dialog').showModal();
 },
 makeMountedWeapon(){this.weaponArt=this.add.graphics();this.rig.add(this.weaponArt);this.refreshMountedWeapon();},
 refreshMountedWeapon(){const g=this.weaponArt;if(!g)return;g.clear();const q=this.armoryQuest;if(!q.installed)return;g.fillStyle(0x18282c);g.fillRoundedRect(-13,-18,26,20,4);g.lineStyle(2,0xaf9a65);g.strokeRoundedRect(-13,-18,26,20,4);g.fillStyle(0x708384);g.fillRect(-2,-15,29,5);g.fillRect(-2,-7,29,5);g.fillStyle(0x263436);g.fillRect(23,-16,6,7);g.fillRect(23,-8,6,7);g.fillStyle(q.weaponLevel?0xe1af5b:0x8b9a89);g.fillCircle(-4,-8,5);},
 refreshArmoryHUD() {
  const q=this.armoryQuest;if(!q.briefed||this.floorNumber===1)return;
  const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');if(!name)return;
  if(this.floorNumber===2){name.textContent='За оборванной связью';radio.textContent=q.rescued&&q.blueprint?'Оружейник и чертёж на борту. Возвращайся на базу через лифт.':q.rescued?'Оружейник спасён. Найди чертёж в заваленном шкафу и возвращайся на базу.':'Константин потерял связь с товарищем. Найди оружейника на втором этаже.';status.textContent=q.rescued&&q.blueprint?`Лифт: ${objectiveBearing(this.rig,FLOOR_LIFT)}`:`Оружейник: ${q.rescued?'✓':objectiveBearing(this.rig,ARMORER_SITE)} · Чертёж: ${q.blueprint?'✓':q.rescued?objectiveBearing(this.rig,BLUEPRINT_SITE):'место неизвестно'}`;}
  else if(q.ready){name.textContent=q.installed?'Бур вооружён':'Первая пушка';radio.textContent=q.installed?'Оружейная работает. Следующий этап — ремонтный комплект и спасение ремонтника на третьем этаже.':'Заезжай в оружейную. Установи подаренную пушку на бур.';status.textContent=`Пушка: ${q.installed?'установлена':'в грузовом креплении'} · Мощность: ${100+q.weaponLevel*2}% · Кредиты: ${this.credits}`;}
  else if(q.rescued&&q.blueprint){name.textContent='Восстановить оружейную';radio.textContent='Оружейник и чертёж на базе. Расчисти ворота — Серёга восстановит помещение.';status.textContent=`Ворота: ${3-armoryBlockCount(this.world)}/3 · Оружейная: ${objectiveBearing(this.rig,{x:41,y:33})}`;}
  else{name.textContent='За оборванной связью';radio.textContent='Спустись на второй этаж. Найди товарища Константина и чертёж первой пушки.';status.textContent='Получена ключ-карта второго этажа';}
 }
};
