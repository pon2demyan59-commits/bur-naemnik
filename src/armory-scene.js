import { createWeaponPanel } from './weapon-panel.js';
import { makeQuestItem } from './quest-item-view.js';
import { showBuildingMenu } from './game-menus.js';
import { queueRepairBrief } from './repair-state.js';
import { drawMountedTurret } from './mounted-weapon.js';
import { makePerson } from './people-view.js';
import { ARMORY_BODY, ARMORY_DECK, ARMORY_BLOCKS, ARMORER_SITE, BLUEPRINT_SITE, armoryBlockCount, canRestoreArmory, onArmoryDeck, installWeapon, buyWeaponUpgrade, weaponUpgradePrice } from './armory-state.js';
import { nearWorkshopItem, objectiveBearing } from './workshop-state.js';
import { WorkshopView } from './workshop-view.js';
import { FLOOR_LIFT } from './lift-state.js';
import { CELL } from './base-state.js';
export const armoryMethods={
 makeArmoryObjects() {
  const q=this.armoryQuest;
  if(!this.floorNumber){this.armory=new WorkshopView(this,{body:this.buildingGeom('armory').body,deck:this.buildingDeck('armory'),key:'armory'});this.armory.powered(q.ready);}
  if(this.floorNumber!==2)return;
  const label=(site,text)=>this.add.text((site.x+.5)*CELL,(site.y+.5)*CELL-55,text,{fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:'#173c3c',backgroundColor:'#ffd372',padding:{x:7,y:4}}).setOrigin(.5).setDepth(11);
  this.armorer=makePerson(this,(ARMORER_SITE.x+.5)*CELL,(ARMORER_SITE.y+.5)*CELL,'armorer').setVisible(!q.rescued);
  this.armorerMarker=label(ARMORER_SITE,'! ОРУЖЕЙНИК').setVisible(!q.rescued);
  this.blueprintArt=makeQuestItem(this,(BLUEPRINT_SITE.x+.5)*CELL,(BLUEPRINT_SITE.y+.5)*CELL,'blueprint').setVisible(q.rescued&&!q.blueprint);
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
  if(kind==='armorer'&&!q.rescued){q.rescued=true;q.gifted=true;q.weapons.basic=Math.max(1,q.weapons.basic||0);this.armorer.setVisible(false);this.armorerMarker.setVisible(false);this.blueprintArt.setVisible(true);this.blueprintMarker.setVisible(true);this.armorerPassenger?.setVisible(true);this.startStory('armorer');}
  if(kind==='blueprint'&&q.rescued&&!q.blueprint){q.blueprint=true;this.blueprintArt.setVisible(false);this.blueprintMarker.setVisible(false);this.showDiscovery({kind:'blueprint',name:'Первая пушка',description:'Чертёж оружия для бура',note:'Чертёж сохранён. Вернись на базу, чтобы восстановить оружейную.'});}
  this.refreshHUD();this.persist();
 },
 checkArmory() {
  const q=this.armoryQuest;if(!q||this.layoutEditing||this.busy||this.storyActive||this.world.dialogue||this.workshopQuest.dialogue||this.workshopQuest.serviceRemaining!=null||q.serviceRemaining!=null||document.querySelector('#dialog').open)return;
  if(q.dialogue){this.startStory(q.dialogue);return;}
  if(this.floorNumber)return;
  if(!q.briefed&&this.workshopQuest.upgrades>0&&this.workshopQuest.ready){this.startStory('armoryBrief');return;}
  if(q.rescued&&q.blueprint&&!q.returnBriefed){this.startStory('armoryReturn');return;}
  if(!q.ready&&canRestoreArmory(q,this.questWorld('armory'))){q.ready=true;this.armory.powered(true);this.armorerPassenger?.setVisible(false);this.persist();this.startStory('armoryReady');}
 },
 openArmory() {
  const q=this.armoryQuest;if(!q.ready||q.serviceRemaining!=null||!onArmoryDeck(this.rig,this.buildingDeck('armory')))return;
  this.dialogClosed();this.persist();
  const {panel,render}=createWeaponPanel(this,()=>{this.rewardQuest('weaponInstalled');queueRepairBrief(this.repairQuest,q);});
  this.armoryPanelRender=render;document.querySelector('#dialog').addEventListener('close',()=>{this.armoryPanelRender=null;},{once:true});
  showBuildingMenu('armory',panel);
 },
 makeMountedWeapon(){this.weaponArt=this.add.container(-5,-9);this.rig.add(this.weaponArt);this.refreshMountedWeapon();},
 refreshMountedWeapon(){
  const root=this.weaponArt;if(!root)return;
  if(this.weaponBarrel)this.tweens.killTweensOf(this.weaponBarrel);
  this.weaponFlashTimer?.remove();this.weaponFlashTimer=null;
  root.removeAll(true);root.setVisible(this.armoryQuest.installed);this.weaponBarrel=null;this.weaponFlash=null;
  if(!this.armoryQuest.installed)return;
  const parts=drawMountedTurret(this,root,this.armoryQuest.weaponLevel>0,this.armoryQuest.equippedWeapon);this.weaponBarrel=parts.barrel;this.weaponFlash=parts.flash;
 },
 animateWeaponShot(){
  if(!this.weaponBarrel)return;
  this.tweens.killTweensOf(this.weaponBarrel);this.weaponBarrel.x=-2;
  this.tweens.add({targets:this.weaponBarrel,x:0,duration:180,ease:'Cubic.Out'});
  this.weaponFlash.setVisible(true);this.weaponFlashTimer?.remove();
  this.weaponFlashTimer=this.time.delayedCall(75,()=>{this.weaponFlash?.setVisible(false);this.weaponFlashTimer=null;});
 },
 refreshArmoryHUD() {
  const q=this.armoryQuest;if(!q.briefed||this.floorNumber===1)return;
  const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');if(!name)return;
  if(this.floorNumber===2){name.textContent='За оборванной связью';radio.textContent=q.rescued&&q.blueprint?'Оружейник и чертёж на борту. Возвращайся на базу через лифт.':q.rescued?'Оружейник спасён. Найди чертёж в заваленном шкафу и возвращайся на базу.':'Константин потерял связь с товарищем. Найди оружейника на втором этаже.';status.textContent=q.rescued&&q.blueprint?`Лифт: ${objectiveBearing(this.rig,FLOOR_LIFT)}`:`Оружейник: ${q.rescued?'✓':objectiveBearing(this.rig,ARMORER_SITE)} · Чертёж: ${q.blueprint?'✓':q.rescued?objectiveBearing(this.rig,BLUEPRINT_SITE):'место неизвестно'}`;}
  else if(q.ready){name.textContent=q.installed?'Бур вооружён':'Первая пушка';radio.textContent=q.installed?'Оружейная работает. Следующий этап — ремонтный комплект и спасение ремонтника на третьем этаже.':'Заезжай в оружейную. Установи подаренную пушку на бур.';status.textContent=`Пушка: ${q.installed?'установлена':'в грузовом креплении'} · Мощность: ${Number((100+q.weaponLevel*2+(this.collectionBuffs?.weapon||0)*100).toFixed(3))}% · Кредиты: ${this.credits}`;}
  else if(q.rescued&&q.blueprint){name.textContent='Восстановить оружейную';radio.textContent='Оружейник и чертёж на базе. Расчисти ворота — Серёга восстановит помещение.';status.textContent=`Ворота: ${3-armoryBlockCount(this.questWorld('armory'))}/3 · Оружейная: ${objectiveBearing(this.rig,this.buildingPoint('armory'))}`;}
  else{name.textContent='За оборванной связью';radio.textContent='Спустись на второй этаж. Найди товарища Константина и чертёж первой пушки.';status.textContent='Получена ключ-карта второго этажа';}
 }
};
