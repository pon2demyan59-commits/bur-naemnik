import { armoryMethods } from './armory-scene.js';
import { restoreArmory, ARMORY_BODY, ARMORY_DECK, ARMORY_BLOCKS, ARMORER_SITE, ARMORY_STORIES, onArmoryDeck } from './armory-state.js';
import { stepWorkshopService, restoreWorkshop, TOOLS_SITE, MECHANIC_SITE, WORKSHOP_BLOCKS, WORKSHOP_BODY, WORKSHOP_DECK, nearWorkshopItem, onWorkshopDeck, workshopBlockCount, canRestoreWorkshop, workshopPrice, buyWorkshopUpgrade, objectiveBearing } from './workshop-state.js';
import { WorkshopView } from './workshop-view.js';
import { PORODNIK_CYCLE_MS, restorePorodnikJob, stepPorodnikJob, PORODNIK, PORODNIK_MACHINE, PORODNIK_DECK, PORODNIK_COLLIDER, PORODNIK_BLOCKS, porodnikFrameCell, porodnikBlockCount, onPorodnikDeck } from './porodnik-state.js';
import { WorldTerrain, bunkerFloorTexture } from './terrain.js';
import { BaseWorld, BASE_SIZE, CELL, RESCUE } from './base-state.js';
import { STORY_LINES } from './story-content.js';
import { showStoryDialogue } from './story-dialogue.js';
import { LiftView } from './lift-view.js';
import { LIFT, LIFT_BLOCKS, FLOOR_LIFT, liftBlockCount, liftFrameCell, liftDestinations, FloorWorld } from './lift-state.js';
import { writeSave } from './storage.js';
import { driveStep, driveFits, circleHitsRect } from './drive-controller.js';
import { wrapDegrees, updateHeat } from './drill-motion.js';
const middle = n => n * CELL + CELL / 2;
const heading = {left:180,right:0,up:-90,down:90};
export class Base extends globalThis.Phaser.Scene {
  constructor(key='Base') { super(key); }
  init({save,arrival=false} = {}) {
    const p=save?.progress||{};this.campaign=p;this.armoryQuest=restoreArmory(p.armoryQuest);this.workshopQuest=restoreWorkshop(p.workshopQuest);this.porodnikJob=restorePorodnikJob(p.porodnikJob);this.cargo=Number.isInteger(p.cargo)?Math.max(0,Math.min(200,p.cargo)):0;this.credits=Number.isSafeInteger(p.credits)?Math.max(0,p.credits):0;
    this.floorNumber=this.sys.settings.key==='Floor'?(p.floor===2?2:1):0;
    const local=this.floorNumber?(p.floors?.[this.floorNumber]||{}):(p.base||p);
    this.world=this.floorNumber?new FloorWorld(local,this.floorNumber):new BaseWorld(local);
    // Old saves may park inside the newly installed machine.
    if(!this.floorNumber&&porodnikFrameCell(this.world.x,this.world.y)&&!onPorodnikDeck({x:middle(this.world.x),y:middle(this.world.y)})){this.world.x=18;this.world.y=35;}
    if(!this.floorNumber&&circleHitsRect(middle(this.world.x),middle(this.world.y),WORKSHOP_BODY)){this.world.x=32;this.world.y=35;}
    if(this.floorNumber===1&&!this.workshopQuest.mechanic&&this.world.x===MECHANIC_SITE.x&&this.world.y===MECHANIC_SITE.y){this.world.x=FLOOR_LIFT.x;this.world.y=FLOOR_LIFT.y;}
    if(!this.floorNumber&&circleHitsRect(middle(this.world.x),middle(this.world.y),ARMORY_BODY)){this.world.x=41;this.world.y=34;}
    if(this.floorNumber===2&&!this.armoryQuest.rescued&&this.world.x===ARMORER_SITE.x&&this.world.y===ARMORER_SITE.y){this.world.x=FLOOR_LIFT.x;this.world.y=FLOOR_LIFT.y;}
    this.parked=arrival?null:local.drive;this.arrival=arrival;this.busy=arrival;this.storyActive=false;this.leaving=false;
    this.liftCenter=this.floorNumber?FLOOR_LIFT:LIFT;
    if(arrival){this.world.x=this.liftCenter.x;this.world.y=this.liftCenter.y;}
    this.touchDirections=new Map();this.moving=false;this.hold=null;this.lastSave=0;
    this.dustTime=0;this.trackDustTime=0;this.sparkTime=0;this.speed=0;this.heat=0;this.beltPhases=[0,0];this.turnVelocity=0;this.cutting=false;
  }
  create() {
    this.makeTextures();
    this.makeMap();
    this.makeHUD();
    this.rig = this.add.container(middle(this.world.x),middle(this.world.y)).setDepth(20);
    const parked=this.parked;
    if(parked&&[parked.x,parked.y,parked.angle].every(Number.isFinite)&&Math.floor(parked.x/CELL)===this.world.x&&Math.floor(parked.y/CELL)===this.world.y&&driveFits(parked.x,parked.y,this.driveSolids())) {
      this.rig.setPosition(parked.x,parked.y).setAngle(wrapDegrees(parked.angle));
    }
    // Rotate around the chassis, not the center of a square image with a long nose.
    this.drillSprite = this.add.image(0,0,'drill').setOrigin(.39,.5).setDisplaySize(96,96);
    this.headHeat = this.add.graphics();
    this.trackMotion = this.add.graphics();
    this.visual = this.add.container(0,0,[this.drillSprite,this.trackMotion,this.headHeat]).setScale(.82,1);
    this.rig.add(this.visual);
    this.shadow = this.add.ellipse(this.rig.x,this.rig.y+7,68,52,0x071919,.35).setDepth(19);
    this.makeEffects();
    this.cameras.main.setBounds(0,0,BASE_SIZE*CELL,BASE_SIZE*CELL).startFollow(this.rig,true,.10,.10);
    this.cameras.main.setZoom(this.scale.width < 600 ? .82 : 1.12);
    this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC');
    this.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    this.input.keyboard.on('keydown-ESC',this.goMenu,this);
    this.input.keyboard.on('keydown-E',this.interact,this);
    this.input.keyboard.on('keydown-SPACE',this.interact,this);
    this.clearInput = () => { this.hold=null; this.touchDirections.clear(); this.speed=0; this.input.keyboard.resetKeys(); this.persist(); };
    window.addEventListener('blur',this.clearInput);
    document.addEventListener('visibilitychange',this.clearInput);
    this.fit = size => { this.cameras.main.setSize(size.width,size.height); this.cameras.main.setZoom(size.width < 600 ? .82 : 1.12); };
    this.scale.on('resize',this.fit);
    this.events.once('shutdown',()=>{
      if(!this.leaving)this.persist(); this.hold=null;
      window.removeEventListener('blur',this.clearInput); document.removeEventListener('visibilitychange',this.clearInput);
      this.scale.off('resize',this.fit);
      this.input.keyboard.removeCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    });
    this.passenger=this.add.image(-7,0,'serega').setScale(.32).setVisible(this.floorNumber?!!this.campaign.base?.rescued:this.world.rescued);this.rig.add(this.passenger);
    this.dialogClosed=()=>{this.hold=null;this.touchDirections.clear();this.input.keyboard.resetKeys();this.speed=0;};
    document.querySelector('#dialog').addEventListener('close',this.dialogClosed);
    this.events.once('shutdown',()=>document.querySelector('#dialog').removeEventListener('close',this.dialogClosed));
    this.refreshHUD();this.persist();this.checkLift();this.checkPorodnik();
    if(this.arrival)this.lift.arrive(this.rig,this.shadow).then(()=>{this.busy=false;this.world.x=Math.floor(this.rig.x/CELL);this.world.y=Math.floor(this.rig.y/CELL);this.dialogClosed();this.refreshHUD();this.persist();this.checkWorkshop();this.checkArmory();});
    this.mechanicPassenger=this.add.image(-7,10,'mechanic').setScale(.32).setVisible(this.workshopQuest.mechanic&&!this.workshopQuest.ready);this.rig.add(this.mechanicPassenger);
    this.armorerPassenger=this.add.image(-7,-8,'armorer').setScale(.32).setVisible(this.armoryQuest.rescued&&!this.armoryQuest.ready);this.rig.add(this.armorerPassenger);this.makeMountedWeapon();
    this.cameras.main.fadeIn(300,12,26,27);
    if(!this.arrival)this.time.delayedCall(350,()=>{
      if(this.armoryQuest.dialogue)this.startStory(this.armoryQuest.dialogue);
      else if(this.workshopQuest.dialogue)this.startStory(this.workshopQuest.dialogue);
      else if(this.world.dialogue)this.startStory(this.world.dialogue);
      else if(!this.world.heard)this.playRadio();
      else {this.checkWorkshop();this.checkArmory();}
    });
  }
  makeTextures() {
    if(this.textures.exists('serega')) return;
    const g=this.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xffd477);g.fillCircle(5,5,5);g.generateTexture('dust',10,10);g.clear();
    g.fillStyle(0x081e1d,.5);g.fillEllipse(16,34,25,9);
    g.fillStyle(0x234e55);g.fillRoundedRect(7,16,19,15,5);
    g.fillStyle(0xe3ad73);g.fillCircle(16,15,9);
    g.fillStyle(0xeeb348);g.fillEllipse(16,9,27,12);
    g.fillStyle(0xffd57c);g.fillRoundedRect(5,6,22,7,3);
    g.fillStyle(0x422e21);g.fillCircle(13,16,1.5);g.fillCircle(20,16,1.5);
    g.generateTexture('serega',32,40);g.clear();
    g.fillStyle(0x102627,.5);g.fillEllipse(16,34,25,9);g.fillStyle(0x3b5747);g.fillRoundedRect(7,16,19,15,5);g.fillStyle(0xe3ad73);g.fillCircle(16,15,8);g.fillStyle(0x6e7851);g.fillEllipse(16,8,22,10);g.fillStyle(0xb4b5a0);g.fillRoundedRect(8,7,7,4,2);g.fillRoundedRect(17,7,7,4,2);g.fillStyle(0x565c52);g.fillEllipse(16,21,12,6);g.fillStyle(0x422e21);g.fillCircle(13,16,1.5);g.fillCircle(20,16,1.5);g.generateTexture('mechanic',32,40);g.destroy();
  }
  makeMap() {
    const floor=this.add.tileSprite(0,0,BASE_SIZE*CELL,BASE_SIZE*CELL,bunkerFloorTexture(this)).setOrigin(0).setDepth(0);

    const border=this.add.graphics().setDepth(1);
    border.fillStyle(0x203b3c);border.fillRect(0,0,3200,128);border.fillRect(0,3072,3200,128);border.fillRect(0,0,128,3200);border.fillRect(3072,0,128,3200);
    border.lineStyle(8,0x809187);border.strokeRect(128,128,2944,2944);
    this.terrain=new WorldTerrain(this,this.world);
    this.lift=new LiftView(this,this.liftCenter);
    this.blockGlow=this.add.graphics().setDepth(4);
    if(!this.floorNumber) {
      const bx=middle(25),by=middle(8),doorTexture=this.textures.get('bunker-door');
      if(!doorTexture.has('entrance'))doorTexture.add('entrance',0,117,65,1711,704);
      this.bunkerDoor=this.add.image(bx,by-14,'bunker-door','entrance').setDisplaySize(530,530*704/1711).setDepth(2);
      const texture=this.textures.get('porodnik');
      if(!texture.has('machine'))texture.add('machine',0,0,0,640,435);
      if(!texture.has('parking'))texture.add('parking',0,58,435,525,403);
      const m=PORODNIK_MACHINE,d=PORODNIK_DECK;
      this.porodnik=this.add.image(m.x,m.y,'porodnik','machine').setOrigin(0).setDisplaySize(m.width,m.height).setDepth(2.4);
      this.porodnikDeck=this.add.image(d.x,d.y,'porodnik','parking').setOrigin(0).setDisplaySize(d.width,d.height).setDepth(2.4);
      this.porodnikMotion=this.add.graphics().setDepth(5);
      this.porodnikLed=this.add.circle(20.1*CELL,30.95*CELL,4,0xffac46).setDepth(5);
      this.person=this.add.image(middle(RESCUE.x),middle(RESCUE.y),'serega').setDepth(10).setVisible(!this.world.rescued);
      this.marker=this.add.text(this.person.x,this.person.y-44,'! СЕРЁГА Т',{fontFamily:'Arial',fontSize:'16px',fontStyle:'bold',color:'#163d3b',backgroundColor:'#ffd372',padding:{x:9,y:5}}).setOrigin(.5).setDepth(11).setVisible(!this.world.rescued);
      this.tweens.add({targets:this.marker,y:this.marker.y-6,duration:800,yoyo:true,repeat:-1});
    }
    this.makeWorkshopObjects();this.makeArmoryObjects();
    this.drillBar=this.add.graphics().setDepth(30);
  }
  makeWorkshopObjects() {
    const q=this.workshopQuest;
    const label=(x,y,text)=>this.add.text(middle(x),middle(y)-40,text,{fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:'#173c3c',backgroundColor:'#ffd372',padding:{x:7,y:4}}).setOrigin(.5).setDepth(11);
    if(this.floorNumber===1) {
      this.toolsArt=this.add.container(middle(TOOLS_SITE.x),middle(TOOLS_SITE.y)).setDepth(10).setVisible(!q.tools);
      const box=this.add.graphics();box.fillStyle(0x182c30);box.fillRoundedRect(-24,-16,48,34,4);box.lineStyle(3,0xd9b36b);box.strokeRoundedRect(-23,-15,46,32,4);box.lineStyle(4,0xd9b36b);box.lineBetween(-9,-16,-9,-22);box.lineBetween(-9,-22,9,-22);box.lineBetween(9,-22,9,-16);box.lineStyle(5,0xb7c9c5);box.lineBetween(-11,9,9,-6);box.strokeCircle(12,-8,6);this.toolsArt.add(box);
      this.toolsMarker=label(TOOLS_SITE.x,TOOLS_SITE.y,'! ИНСТРУМЕНТЫ').setVisible(!q.tools);
      this.mechanic=this.add.image(middle(MECHANIC_SITE.x),middle(MECHANIC_SITE.y),'mechanic').setDisplaySize(40,50).setDepth(10).setVisible(!q.mechanic);
      this.mechanicMarker=label(MECHANIC_SITE.x,MECHANIC_SITE.y,'! КОНСТАНТИН Б').setVisible(!q.mechanic);
    }else if(!this.floorNumber){
      this.workshop=new WorkshopView(this);this.workshop.powered(q.ready);
      // Konstantin works inside; his portrait remains in workshop dialogue.
    }
  }
  workshopFloorAction() {
    const q=this.workshopQuest;
    if(this.floorNumber!==1||!q.briefed)return null;
    if(!q.tools&&nearWorkshopItem(this.rig,TOOLS_SITE))return 'tools';
    if(!q.mechanic&&nearWorkshopItem(this.rig,MECHANIC_SITE))return 'mechanic';
    return null;
  }
  collectWorkshopItem(kind) {
    const q=this.workshopQuest;
    if(kind==='tools'&&!q.tools){q.tools=true;this.toolsArt.setVisible(false);this.toolsMarker.setVisible(false);this.notify('ЯЩИК С ИНСТРУМЕНТАМИ ПОЛУЧЕН');}
    if(kind==='mechanic'&&!q.mechanic){q.mechanic=true;this.mechanic.setVisible(false);this.mechanicMarker.setVisible(false);this.mechanicPassenger.setVisible(true);this.startStory('mechanic');}
    this.refreshHUD();this.persist();
  }
  checkWorkshop() {
    const q=this.workshopQuest;if(!q||this.busy||this.storyActive||this.world.dialogue||document.querySelector('#dialog').open)return;
    if(q.dialogue){this.startStory(q.dialogue);return;}
    if(this.floorNumber)return;
    if(!this.world.porodnikPowered)return;
    if(!q.briefed){this.startStory('workshop');return;}
    if(q.tools&&q.mechanic&&!q.returnBriefed){this.startStory('workshopReturn');return;}
    if(!q.ready&&canRestoreWorkshop(q,this.world)){
      q.ready=true;this.workshop.powered(true);this.mechanicPassenger.setVisible(false);
      this.persist();this.startStory('workshopReady');
    }
  }
  openWorkshop() {
    if(!this.workshopQuest.ready||this.workshopQuest.serviceRemaining!=null||!onWorkshopDeck(this.rig))return;
    this.dialogClosed();this.persist();const q=this.workshopQuest;
    const panel=document.createElement('div');panel.className='lift-console';
    const text=document.createElement('p'),buy=document.createElement('button');buy.className='metal-button';
    const render=()=>{text.textContent=`Механик: Константин Б · Мощность: ${100+q.upgrades*2}% · Кредиты: ${this.credits}`;buy.textContent=`УЛУЧШИТЬ МОЩНОСТЬ +2% · ${workshopPrice(q)} КРЕДИТОВ`;buy.disabled=q.upgrades>=100||this.credits<workshopPrice(q);};
    buy.addEventListener('click',()=>{const result=buyWorkshopUpgrade(q,this.credits);if(!result.bought)return;this.credits=result.credits;document.querySelector('#dialog').close();this.dialogClosed();this.refreshHUD();this.persist();});render();panel.append(text,buy);
    document.querySelector('#dialog-title').textContent='МАСТЕРСКАЯ';document.querySelector('#dialog-body').replaceChildren(panel);document.querySelector('#dialog').showModal();
  }
  makeHUD() {
    const ui=document.querySelector('#ui');ui.replaceChildren();ui.dataset.screen='base';
    const hud=document.createElement('section');hud.className='base-hud';hud.innerHTML=`
      <header class="base-top"><div class="base-location">БУНКЕР №72 <span>База · 50 × 50</span></div><button class="hud-button" id="base-menu">☰ МЕНЮ</button></header>
      <aside class="radio-card"><div class="radio-title"><span class="radio-led"></span> РАЦИЯ · БАЗА</div><strong id="quest-name"></strong><p id="radio-text"></p><div class="quest-track" id="quest-status"></div></aside>
      <footer class="base-bottom"><div class="base-tip">WASD / стрелки — движение и бурение<br>E / пробел — взаимодействовать</div><div id="base-save" role="status"></div><button class="hud-button rescue-button" id="rescue-action">СПАСТИ СЕРЁГУ</button></footer>
      <div class="touch-pad" aria-label="Управление буром"><button data-dir="up" aria-label="Вверх">▲</button><button data-dir="left" aria-label="Влево">◀</button><button data-dir="down" aria-label="Вниз">▼</button><button data-dir="right" aria-label="Вправо">▶</button></div>`;
    ui.append(hud);
    hud.querySelector('#base-menu').addEventListener('click',()=>this.goMenu());
    hud.querySelector('#rescue-action').addEventListener('click',()=>this.interact());
    for(const button of hud.querySelectorAll('[data-dir]')) {
      button.addEventListener('pointerdown',event=> { event.preventDefault();button.setPointerCapture(event.pointerId);this.touchDirections.delete(event.pointerId);this.touchDirections.set(event.pointerId,button.dataset.dir);this.hold=button.dataset.dir; });
      const stop=event=>{this.touchDirections.delete(event.pointerId);this.hold=[...this.touchDirections.values()].at(-1)||null;};
      button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
    }
  }
  liftReady() {return this.floorNumber?true:this.world.rescued&&liftBlockCount(this.world)===0;}
  syncAction() {
    const action=document.querySelector('#rescue-action');if(!action||!this.rig)return;
    const saving=!this.floorNumber&&!this.world.rescued;
    const unloading=!this.floorNumber&&this.world.porodnikPowered&&onPorodnikDeck(this.rig);
    const armoryItem=this.armoryFloorAction(),atArmory=!this.floorNumber&&this.armoryQuest.ready&&onArmoryDeck(this.rig);
    const questItem=this.workshopFloorAction(),atWorkshop=!this.floorNumber&&this.workshopQuest.ready&&onWorkshopDeck(this.rig);
    const label=armoryItem==='armorer'?'СПАСТИ ОРУЖЕЙНИКА':armoryItem==='blueprint'?'ЗАБРАТЬ ЧЕРТЁЖ':atArmory?'ОРУЖЕЙНАЯ':questItem==='tools'?'ЗАБРАТЬ ИНСТРУМЕНТЫ':questItem==='mechanic'?'СПАСТИ МЕХАНИКА':atWorkshop?'МАСТЕРСКАЯ':saving?'СПАСТИ СЕРЁГУ':unloading?(this.porodnikJob?'ПЕРЕРАБОТКА…':'ВЫГРУЗИТЬ ПОРОДУ'):'ПУЛЬТ ЛИФТА';if(action.textContent!==label)action.textContent=label;
    action.hidden=false;action.disabled=this.armoryQuest.serviceRemaining!=null||!!this.armoryQuest.dialogue||this.workshopQuest.serviceRemaining!=null||this.busy||this.storyActive||!!this.world.dialogue||!!this.workshopQuest.dialogue||(armoryItem||atArmory||questItem||atWorkshop?false:unloading?!!this.porodnikJob||this.cargo===0:saving?!this.world.canRescue(this.rig.x,this.rig.y):!this.liftReady()||!this.lift.contains(this.rig));
  }
  refreshHUD() {
    const w=this.world,ready=this.liftReady();
    document.querySelector('.base-location').innerHTML=this.floorNumber?`ЭТАЖ ${this.floorNumber} <span>Шахта · грузовой лифт</span>`:'БУНКЕР №72 <span>База · 50 × 50</span>';
    document.querySelector('.radio-title').lastChild.textContent=this.floorNumber?` РАЦИЯ · ЭТАЖ ${this.floorNumber}`:' РАЦИЯ · БАЗА';
    document.querySelector('#quest-name').textContent=this.floorNumber?'Первый спуск':!w.rescued?'Голос за завалом':ready?'Расчистить «Породник»':'Расчистить лифт';
    document.querySelector('#radio-text').textContent=this.floorNumber?'Первый этаж. Вернуться на базу можно через грузовой лифт.':!w.rescued?(w.heard?STORY_LINES.radio[0]:'Ты очнулся один. Бур завёлся. Рация оживает.'):ready?'Лифт освобождён. Следующее задание: расчистить «Породник».':STORY_LINES.rescue[3];
    document.querySelector('#quest-status').textContent=this.floorNumber?'Карта 1-го этажа использована для доступа · База доступна':!w.rescued?`Расчищено: ${w.cleared.size} · Подъедь к Серёге вплотную`:ready?'Расчисти завал у приёмника · Серёга восстановит питание':`Расчистить лифт: ${3-liftBlockCount(w)}/3 · Ключ-карта 1-го этажа получена`;
    if(!this.floorNumber&&w.porodnikPowered){
      document.querySelector('#quest-name').textContent='«Породник» работает';
      document.querySelector('#radio-text').textContent='Заезжай на площадку и выгружай породу. Лифт готов к спуску.';
      document.querySelector('#quest-status').textContent=`Груз: ${this.cargo}/200 · Кредиты: ${this.credits}`;
    }else if(!this.floorNumber&&ready){document.querySelector('#quest-status').textContent=`Приёмник: ${5-porodnikBlockCount(w)}/5 · Груз: ${this.cargo}/200`;}
    if(this.porodnikLed)this.porodnikLed.setFillStyle(w.porodnikPowered?0x74ee87:0xffac46);
    const q=this.workshopQuest;
    if(q?.briefed) {
      const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');
      if(this.floorNumber){
        name.textContent='Инструменты для мастерской';radio.textContent=q.tools&&q.mechanic?'Инструменты и механик на борту. Возвращайся на базу через лифт.':'Найди ящик с инструментами и спаси Константина Б.';
        status.textContent=q.tools&&q.mechanic?`Лифт: ${objectiveBearing(this.rig,FLOOR_LIFT)}`:`Инструменты: ${q.tools?'✓':objectiveBearing(this.rig,TOOLS_SITE)} · Константин: ${q.mechanic?'✓':objectiveBearing(this.rig,MECHANIC_SITE)}`;
      }else if(q.ready){name.textContent=q.upgrades?'Бур готов к следующему спуску':'Первое улучшение бура';radio.textContent=q.upgrades?'Константин улучшил бур. Следующая история — спасение оружейника на втором этаже.':'Заезжай в мастерскую. Константин улучшит мощность за кредиты.';status.textContent=`Мощность: ${100+q.upgrades*2}% · Груз: ${this.cargo}/200 · Кредиты: ${this.credits}`;
      }else if(q.tools&&q.mechanic){name.textContent='Расчистить мастерскую';radio.textContent='Инструменты и механик доставлены. Серёга ждёт у мастерской.';status.textContent=`Ворота: ${3-workshopBlockCount(w)}/3 · Мастерская: ${objectiveBearing(this.rig,{x:32,y:34})}`;
      }else{name.textContent='Инструменты для мастерской';radio.textContent='На первом этаже нужны инструменты. Там остался механик Константин Б.';status.textContent=`Инструменты: ${q.tools?'✓':'не найдены'} · Механик: ${q.mechanic?'спасён':'не найден'} · Лифт: ${objectiveBearing(this.rig,LIFT)}`;}
    }
    this.refreshArmoryHUD();this.lift.powered(ready);this.syncAction();
  }
  snapshotCampaign() {
    const local={...this.world.snapshot(),drive:{x:this.rig.x,y:this.rig.y,angle:this.rig.angle}};
    const base=this.floorNumber?(this.campaign.base||{}):local;
    const floors={...(this.campaign.floors||{})};if(this.floorNumber)floors[this.floorNumber]=local;
    const keycards=[...new Set([...(Array.isArray(this.campaign.keycards)?this.campaign.keycards:[]),...(base.rescued?[1]:[]),...(this.armoryQuest?.briefed?[2]:[])])];
    return {...base,armoryQuest:{...this.armoryQuest},workshopQuest:{...this.workshopQuest},porodnikJob:this.porodnikJob?{...this.porodnikJob}:null,cargo:this.cargo,credits:this.credits,location:this.floorNumber?'floor':'base',floor:this.floorNumber,base,floors,keycards,highestFloor:this.campaign.highestFloor||0};
  }
  persist() {
    if(this.leaving||!this.rig)return;
    this.campaign=this.snapshotCampaign();const saved=writeSave(this.campaign);
    const status=document.querySelector('#base-save');if(status)status.textContent=saved?'Прогресс сохранён':'Сохранение недоступно в этом браузере';this.lastSave=this.time.now;
  }
  goMenu() {if(this.busy||this.storyActive||document.querySelector('#dialog').open)return;this.persist();this.scene.start('Menu');}
  interact() {
    if(this.armoryQuest.serviceRemaining!=null||this.armoryQuest.dialogue||this.workshopQuest.serviceRemaining!=null||this.workshopQuest.dialogue||this.world.dialogue||this.busy||this.storyActive||document.querySelector('#dialog').open)return;
    const armoryItem=this.armoryFloorAction();
    if(armoryItem){this.collectArmoryItem(armoryItem);return;}
    if(!this.floorNumber&&this.armoryQuest.ready&&onArmoryDeck(this.rig)){this.openArmory();return;}
    const item=this.workshopFloorAction();
    if(item)this.collectWorkshopItem(item);
    else if(!this.floorNumber&&this.workshopQuest.ready&&onWorkshopDeck(this.rig))this.openWorkshop();
    else if(!this.floorNumber&&!this.world.rescued)this.rescue();
    else if(!this.floorNumber&&this.world.porodnikPowered&&onPorodnikDeck(this.rig))this.unloadPorodnik();
    else if(this.liftReady()&&this.lift.contains(this.rig))this.openLift();
  }
  unloadPorodnik() {
    if(this.porodnikJob||!this.world.porodnikPowered||!onPorodnikDeck(this.rig)||!this.cargo)return;
    this.porodnikJob={amount:this.cargo,remaining:PORODNIK_CYCLE_MS};this.cargo=0;
    this.speed=0;this.dialogClosed();this.refreshHUD();this.persist();
  }
  updatePorodnikCycle(delta) {
    const amount=stepPorodnikJob(this.porodnikJob,delta);
    if(!amount)return;
    this.porodnikJob=null;this.credits+=amount;this.refreshHUD();this.persist();this.showPorodnikEarnings(amount);
  }
  showPorodnikEarnings(amount) {
    if(typeof document==='undefined')return;
    const hud=document.querySelector('.base-hud');if(!hud?.append)return;
    const text=document.createElement('div');text.className='credit-receipt';text.setAttribute('role','status');text.textContent=`+${amount} кредитов`;
    hud.append(text);this.time.delayedCall(2800,()=>text.remove());
  }
  animatePorodnik(time) {
    if(!this.porodnik)return;
    const m=PORODNIK_MACHINE,g=this.porodnikMotion,job=this.porodnikJob;
    g.clear();
    const working=!!job&&this.world.porodnikPowered;
    const powered=this.world.porodnikPowered;
    // The housing stays still; only its conveyor, hopper and control lights move.
    this.porodnik.setPosition(m.x,m.y);g.setPosition(0,0);
    this.porodnikLed.setFillStyle(working?(Math.sin(time*.023)>0?0xffd065:0xff9b35):this.world.porodnikPowered?0x74ee87:0xffac46);
    this.porodnikLed.setAlpha(working?1:this.world.porodnikPowered ? .75+.25*Math.sin(time*.003) : 1);
    if(powered) {
      const t=time/1000;
      // Warm instrument screen and slowly cycling piston on the side of the intake.
      g.fillStyle(0xffbd5e,.12+.06*Math.sin(t*2));g.fillRoundedRect(m.x+253,m.y+116,26,11,2);
      const stroke=(.5+.5*Math.sin(t*(working?2.2:.75)))*(working?10:5);
      g.lineStyle(3,0x253b3e,.8);g.lineBetween(m.x+244,m.y+180,m.x+244,m.y+198);
      g.lineStyle(2,0xa6b1a2,.9);g.lineBetween(m.x+244,m.y+180,m.x+244,m.y+186+stroke);
      g.fillStyle(0xb8944c);g.fillCircle(m.x+244,m.y+187+stroke,3);
      // Tiny intermittent contact sparks; the whole machine never jolts.
      const period=working?1.2:4.5,burst=working ? .35:.22,phase=t%period;
      if(phase<burst) {
        const x=m.x+239,y=m.y+188+stroke;
        g.fillStyle(0xffdf9a,(1-phase/burst)*.7);g.fillCircle(x,y,2);
        for(let i=0;i<(working?7:4);i++) {
          const age=(phase+i*.035)%burst,a=i*2.399;
          const sx=x+Math.cos(a)*age*32,sy=y+Math.sin(a)*age*22+age*age*20;
          g.lineStyle(1,0xffc668,1-age/burst);g.lineBetween(sx,sy,sx+Math.cos(a)*2,sy+Math.sin(a)*2);
        }
      }
      for(let i=0;i<2;i++) {
        const age=(t*(working ? .55:.2)+i/2)%1;
        g.fillStyle(0xc8b795,(1-age)*(working ? .13:.06));g.fillEllipse(m.x+46+Math.sin(age*4+i)*3,m.y+51-age*19,5+age*9,4+age*9);
      }
    }
    if(powered&&!working) {
      const bx=m.x+115,by=m.y+178,phase=time*.006%8;
      g.fillStyle(0x182329,.55);g.fillRect(bx,by,91,29);
      for(let y=by-phase;y<by+29;y+=8){const top=Math.max(by,y),h=Math.min(by+29,y+2)-top;if(h>0){g.fillStyle(0x81908c,.42);g.fillRect(bx+3,top,85,h);}}
      const puff=time*.00018%1;g.fillStyle(0xd4c29b,(1-puff)*.055);g.fillCircle(m.x+145,m.y+151-puff*13,2+puff*4);
    }
    if(!working)return;
    const elapsed=PORODNIK_CYCLE_MS-job.remaining,bx=m.x+115,by=m.y+178,bw=91,bh=29;
    // Moving belt bars stay inside the actual intake opening.
    g.fillStyle(0x182329,.85);g.fillRect(bx,by,bw,bh);
    const phase=elapsed*.055%8;
    for(let y=by-phase;y<by+bh;y+=8) {
      const top=Math.max(by,y),height=Math.min(by+bh,y+3)-top;
      if(height>0){g.fillStyle(0x81908c,.85);g.fillRect(bx+3,top,bw-6,height);}
    }
    // Rock chips feed from the deck into the hopper, without shaking the parked rig.
    for(let i=0;i<6;i++) {
      const travel=(elapsed/620+i/6)%1;
      const x=m.x+160+Math.sin(i*7)*15,y=m.y+204-travel*58;
      g.fillStyle(i%2?0x897a64:0xbaa080,.95);g.fillTriangle(x-4,y+3,x+5,y+1,x,y-5);
      g.lineStyle(1,0x443d32,.8);g.lineBetween(x-4,y+3,x,y-5);
      const puff=(elapsed/950+i/6)%1;
      g.fillStyle(0xd4c29b,(1-puff)*.24);g.fillCircle(m.x+143+Math.sin(i*4)*25,m.y+151-puff*23,2+puff*7);
    }
    g.fillStyle(0x132525,.9);g.fillRoundedRect(m.x+116,m.y+209,88,5,2);
    g.fillStyle(0xffcb65);g.fillRoundedRect(m.x+116,m.y+209,88*elapsed/PORODNIK_CYCLE_MS,5,2);
    const status=document.querySelector('#quest-status');
    const text=`Переработка: ${(job.remaining/1000).toFixed(1)} с · Груз: ${this.cargo}/200 · Кредиты: ${this.credits}`;
    if(status&&status.textContent!==text)status.textContent=text;
  }
  checkPorodnik() {
    if(this.floorNumber||this.world.porodnikPowered||!this.world.porodnikBriefed||porodnikBlockCount(this.world)>0)return;
    this.world.porodnikPowered=true;this.refreshHUD();this.persist();
    this.notify('СЕРЁГА ВОССТАНОВИЛ ПИТАНИЕ · «ПОРОДНИК» РАБОТАЕТ');
  }
  rescue() {
    if(this.busy||this.storyActive||!this.world.canRescue(this.rig.x,this.rig.y)||document.querySelector('#dialog').open)return;
    this.busy=true;this.speed=0;this.dialogClosed();this.world.rescued=true;this.world.heard=true;this.world.dialogue='rescue';this.world.dialoguePage=0;
    this.marker.setVisible(false);this.persist();
    this.tweens.add({targets:this.person,x:this.rig.x,y:this.rig.y,scale:.4,alpha:0,duration:550,ease:'Sine.InOut',onComplete:()=>{
      this.person.setVisible(false);this.passenger.setVisible(true);this.busy=false;this.refreshHUD();this.persist();this.checkLift();this.checkPorodnik();
      this.startStory('rescue');
    }});
  }
  playRadio() {
    if(this.floorNumber||this.world.heard||this.storyActive||this.busy)return;
    this.world.heard=true;this.world.dialogue='radio';this.world.dialoguePage=0;this.refreshHUD();this.startStory('radio');
  }
  startStory(kind) {
    if(this.busy||this.storyActive||!STORY_LINES[kind])return;
    const holder=ARMORY_STORIES.includes(kind)?this.armoryQuest:['workshop','mechanic','workshopReturn','workshopReady'].includes(kind)?this.workshopQuest:this.world;
    this.storyActive=true;this.speed=0;this.dialogClosed();holder.dialogue=kind;this.persist();
    showStoryDialogue(this,{kind,lines:STORY_LINES[kind],page:holder.dialoguePage,
      onPage:page=>{holder.dialoguePage=page;this.persist();},
      onFinish:()=>{
        holder.dialogue=null;holder.dialoguePage=0;if(kind==='armoryBrief')this.armoryQuest.briefed=true;if(kind==='armoryReturn')this.armoryQuest.returnBriefed=true;if(kind==='workshop')this.workshopQuest.briefed=true;if(kind==='workshopReturn')this.workshopQuest.returnBriefed=true;if(kind==='porodnik')this.world.porodnikBriefed=true;this.storyActive=false;this.dialogClosed();this.refreshHUD();this.persist();
        if(kind==='workshop')this.notify('НОВОЕ ЗАДАНИЕ · ИНСТРУМЕНТЫ ДЛЯ МАСТЕРСКОЙ');
        if(kind==='workshopReady')this.notify('МАСТЕРСКАЯ ВОССТАНОВЛЕНА · МЕХАНИК КОНСТАНТИН Б');
        if(kind==='porodnik')this.notify('НОВОЕ ЗАДАНИЕ · «РАСЧИСТИТЬ ПОРОДНИК»');
        if(kind==='rescue')this.notify('ПОЛУЧЕНА КЛЮЧ-КАРТА · ЭТАЖ 1\nНОВОЕ ЗАДАНИЕ · «РАСЧИСТИТЬ ЛИФТ»');
        this.checkLift();this.checkPorodnik();
      }
    });
  }
  notify(text) {
    const toast=document.createElement('div');toast.className='quest-toast';toast.setAttribute('role','status');toast.textContent=text;document.querySelector('.base-hud').append(toast);this.time.delayedCall(4200,()=>toast.remove());
  }
  checkLift() {
    if(this.floorNumber||!this.liftReady())return;
    if(!this.world.liftAnnounced) {
      this.world.liftAnnounced=true;this.refreshHUD();this.persist();this.cameras.main.shake(160,.001);this.lift.motor(.35);
      this.notify('ЛИФТ ЗАРАБОТАЛ — доступен 1-й этаж');
    }
    if(this.world.porodnikBriefed||this.world.dialogue||this.storyActive)return;
    // Persist the pending conversation before its short delay, including old saves.
    this.world.dialogue='porodnik';this.world.dialoguePage=0;this.persist();
    this.time.delayedCall(1400,()=>{if(this.world.dialogue==='porodnik'&&!this.world.porodnikBriefed&&!this.busy&&!this.storyActive&&!document.querySelector('#dialog').open)this.startStory('porodnik');});
  }
  openLift() {
    this.dialogClosed();this.persist();
    const panel=document.createElement('div');panel.className='lift-console';
    const display=document.createElement('div');display.className='lift-display';display.textContent=this.floorNumber?`ЭТАЖ ${this.floorNumber}`:'БАЗА · №72';panel.append(display);
    const status=document.createElement('p');status.className='lift-status';panel.append(status);
    let selected=this.floorNumber;const buttons=[];
    const travel=document.createElement('button');travel.className='metal-button';travel.textContent='ЕХАТЬ';travel.disabled=true;
    for(const entry of liftDestinations(this.campaign)) {
      const button=document.createElement('button');button.className='floor-button';button.dataset.floor=entry.floor;
      button.textContent=entry.floor===0?'БАЗА · БУНКЕР №72':`ЭТАЖ ${entry.floor}${entry.enabled?'':' · НУЖНА КЛЮЧ-КАРТА'}`;
      button.disabled=!entry.enabled;button.classList.toggle('selected',entry.floor===selected);
      button.addEventListener('click',()=>{selected=entry.floor;buttons.forEach(b=>b.classList.toggle('selected',Number(b.dataset.floor)===selected));display.textContent=selected===0?'БАЗА · №72':`ЭТАЖ ${selected}`;travel.disabled=selected===this.floorNumber;status.textContent=selected===this.floorNumber?'Ты уже на этой остановке.':'Платформа готова к отправлению.';});
      buttons.push(button);panel.append(button);
    }
    status.textContent='Выбери остановку. Следующий этаж требует ключ-карту.';
    travel.addEventListener('click',()=>{document.querySelector('#dialog').close();this.travelTo(selected);});panel.append(travel);
    document.querySelector('#dialog-title').textContent='ПУЛЬТ ГРУЗОВОГО ЛИФТА';document.querySelector('#dialog-body').replaceChildren(panel);document.querySelector('#dialog').showModal();
  }
  async travelTo(target) {
    if(this.busy||this.storyActive||target===this.floorNumber||![0,1,2].includes(target)||!this.liftReady()||!this.lift.contains(this.rig)||!liftDestinations(this.campaign).some(e=>e.floor===target&&e.enabled))return;
    this.busy=true;this.speed=0;this.dialogClosed();this.persist();
    await this.lift.depart(this.rig,this.shadow,target);
    this.campaign=this.snapshotCampaign();this.campaign.location=target===0?'base':'floor';this.campaign.floor=target;
    this.campaign.highestFloor=Math.max(this.campaign.highestFloor,target);
    if(!writeSave(this.campaign)){this.notifySaveFailure();return;}
    this.leaving=true;this.scene.start(target===0?'Base':'Floor',{save:{version:1,progress:this.campaign},arrival:true});
  }
  notifySaveFailure() {
    this.cameras.main.fadeIn(200);this.lift.arrive(this.rig,this.shadow).then(()=>{this.busy=false;this.refreshHUD();});
    const d=document.querySelector('#dialog');document.querySelector('#dialog-title').textContent='СОХРАНЕНИЕ НЕДОСТУПНО';const p=document.createElement('p');p.textContent='Браузер не разрешил сохранить поездку. Разреши локальное хранение данных и попробуй ещё раз.';document.querySelector('#dialog-body').replaceChildren(p);d.showModal();
  }
  makeEffects() {
    const g=this.make.graphics({x:0,y:0,add:false});
    // Native graphics render the same in Canvas (direct file launch) and WebGL.
    if(!this.textures.exists('fx-dust')) {
      for(let r=15;r>=3;r-=3) {g.fillStyle(r>9?0xae9878:0xd5bd93,.12);g.fillCircle(16,16,r);}
      g.generateTexture('fx-dust',32,32);g.clear();
      g.fillStyle(0xeaac4d,.22);g.fillRoundedRect(0,1,18,6,3);
      g.fillStyle(0xffc34f,.95);g.fillRoundedRect(2,2,14,4,2);
      g.fillStyle(0xfff8ce);g.fillRoundedRect(5,3,9,2,1);
      g.generateTexture('fx-spark',18,8);g.clear();
      g.fillStyle(0xcea679);g.fillTriangle(0,0,7,1,4,7);
      g.generateTexture('fx-chip',8,8);
    }
    g.destroy();
    this.dustEmitter=this.add.particles(0,0,'fx-dust',{
      emitting:false, lifespan:{min:550,max:1000}, speed:{min:18,max:65},
      scale:{start:.4,end:1.5}, alpha:{start:.65,end:0}, rotate:{min:0,max:360},
      maxParticles:120,maxAliveParticles:96
    }).setDepth(21);
    this.sparkEmitter=this.add.particles(0,0,'fx-spark',{
      emitting:false, lifespan:{min:120,max:320}, speed:{min:130,max:300},
      scale:{start:.65,end:.1}, alpha:{start:1,end:0}, rotate:{min:0,max:360},
      maxParticles:100,maxAliveParticles:80, blendMode:'ADD'
    }).setDepth(24);
    this.chipEmitter=this.add.particles(0,0,'fx-chip',{
      emitting:false,lifespan:{min:250,max:550},speed:{min:45,max:115},
      scale:{start:1,end:.3},alpha:{start:.9,end:0},rotate:{min:0,max:360},
      maxParticles:60,maxAliveParticles:48
    }).setDepth(22);
  }
  localPoint(x,y=0) {
    x*=.82;
    const a=this.rig.rotation,c=Math.cos(a),s=Math.sin(a);
    return {x:this.rig.x+x*c-y*s,y:this.rig.y+x*s+y*c};
  }
  update(time,delta) {
    if(!this.keys||document.hidden)return;
    this.syncAction();this.drawLiftGlow(time);this.lift.update(Math.min(delta,50));
    if(this.busy||this.storyActive||document.querySelector('#dialog').open)return;
    this.updatePorodnikCycle(Math.min(delta,50));this.animatePorodnik(time);
    this.workshop?.update(Math.min(delta,50),this.workshopQuest.serviceRemaining>0);
    this.armory?.update(Math.min(delta,50),this.armoryQuest.serviceRemaining>0);
    if(!this.floorNumber&&this.armoryQuest.serviceRemaining!=null){this.updateWorkshopService(time,Math.min(delta,50)/1000,this.armoryQuest,ARMORY_DECK);return;}
    if(!this.floorNumber&&this.workshopQuest.serviceRemaining!=null){this.updateWorkshopService(time,Math.min(delta,50)/1000);return;}
    const dt=Math.min(delta,50)/1000,k=this.keys;
    // The last pressed direction wins, even when the previous key is still held.
    const pressed=[['left',k.LEFT],['left',k.A],['right',k.RIGHT],['right',k.D],['up',k.UP],['up',k.W],['down',k.DOWN],['down',k.S]].filter(([,key])=>key.isDown).sort((a,b)=>b[1].timeDown-a[1].timeDown);
    const direction=this.hold || pressed[0]?.[0] || null;
    this.cutting=false;
    this.advanceVehicle(time,dt,direction);
    this.animateVehicle(time,dt);this.checkWorkshop();this.checkArmory();
  }
  updateWorkshopService(time,dt,q=this.workshopQuest,deck=WORKSHOP_DECK) {
    const next=stepWorkshopService(q,{x:this.rig.x,y:this.rig.y,angle:this.rig.angle},dt,this.driveSolids(),deck);
    this.turnVelocity=wrapDegrees(next.angle-this.rig.angle)/Math.max(dt,.001);
    this.rig.setPosition(next.x,next.y).setAngle(next.angle);this.speed=next.speed;this.moving=next.moving;this.cutting=false;this.drillBar.clear();
    this.world.x=Math.floor(next.x/CELL);this.world.y=Math.floor(next.y/CELL);this.animateVehicle(time,dt);
    if(q.serviceRemaining==null){this.dialogClosed();this.refreshMountedWeapon();this.refreshHUD();this.persist();return;}
    const status=document.querySelector('#quest-status');
    if(status)status.textContent=q.serviceRemaining>0?`Модернизация: ${(q.serviceRemaining/1000).toFixed(1)} с`:'Модернизация завершена · Выезд с площадки';
    if(time-this.lastSave>1000)this.persist();
  }
  drawLiftGlow(time) {
    this.blockGlow.clear();if(this.floorNumber||!this.world.rescued)return;
    const blocks=this.armoryQuest?.returnBriefed&&!this.armoryQuest.ready?ARMORY_BLOCKS:this.workshopQuest?.returnBriefed&&!this.workshopQuest.ready?WORKSHOP_BLOCKS:this.liftReady()?(this.world.porodnikBriefed&&!this.world.porodnikPowered?PORODNIK_BLOCKS:[]):LIFT_BLOCKS;
    const pulse=.35+.15*Math.sin(time*.0035);
    for(const p of blocks)if(this.world.blocked(p.x,p.y)) {
      this.blockGlow.fillStyle(0xffcc6c,pulse*.22);this.blockGlow.fillRoundedRect(p.x*CELL+3,p.y*CELL+3,58,58,8);
      this.blockGlow.lineStyle(3,0xffd078,pulse+.2);this.blockGlow.strokeRoundedRect(p.x*CELL+4,p.y*CELL+4,56,56,8);
    }
  }
  solidCell(x,y) { return (this.floorNumber===2&&!this.armoryQuest.rescued&&x===ARMORER_SITE.x&&y===ARMORER_SITE.y)||(this.floorNumber===1&&!this.workshopQuest.mechanic&&x===MECHANIC_SITE.x&&y===MECHANIC_SITE.y)||!this.world.inside(x,y)||this.world.blocked(x,y)||(!this.floorNumber&&x===RESCUE.x&&y===RESCUE.y&&!this.world.rescued); }
  driveSolids() {
    const solid=(x,y)=>this.solidCell(x,y);
    solid.rectangles=[...this.lift.colliders,...(this.floorNumber?[]:[PORODNIK_COLLIDER,WORKSHOP_BODY,ARMORY_BODY])];
    return solid;
  }
  advanceVehicle(time,dt,direction) {
    const solid=this.driveSolids();
    const next=driveStep({x:this.rig.x,y:this.rig.y,angle:this.rig.angle,speed:this.speed},direction,dt,solid);
    this.turnVelocity=wrapDegrees(next.angle-this.rig.angle)/Math.max(dt,.001);
    this.rig.setPosition(next.x,next.y).setAngle(next.angle);
    this.speed=next.speed;this.moving=next.moving;
    const cx=Math.floor(next.x/CELL),cy=Math.floor(next.y/CELL);
    if(cx!==this.world.x||cy!==this.world.y) {
      this.world.x=cx;this.world.y=cy;this.refreshHUD();this.persist();
    }
    this.drillBar.clear();
    if(!direction)return;
    if(!this.world.heard&&!this.floorNumber){this.playRadio();return;}
    const [dx,dy]={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[direction];
    const x=this.world.x+dx,y=this.world.y+dy;
    // Cut only the block directly ahead once the chassis has turned toward it.
    if(Math.abs(wrapDegrees(heading[direction]-this.rig.angle))>20||!this.world.inside(x,y))return;
    if(!this.floorNumber&&x===RESCUE.x&&y===RESCUE.y&&!this.world.rescued){this.refreshHUD();return;}
    if(this.world.blocked(x,y)) {
      this.cutting=true;
      const key=y*BASE_SIZE+x;
      const broken=this.world.drill(x,y,dt*(1+this.workshopQuest.upgrades*.02));
      this.terrain.paintCell(x,y);
      this.drillBar.clear();this.drillBar.fillStyle(0x112d2b,.85);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48,6,3);
      this.drillBar.fillStyle(0xffcd6a);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48*(this.world.damage.get(key)||1),6,3);
      if(broken) {
        this.cargo=Math.min(200,this.cargo+1);
        this.terrain.refreshAround(x,y);this.drillBar.clear();
        this.dustEmitter.emitParticleAt(middle(x),middle(y),12);
        this.chipEmitter.emitParticleAt(middle(x),middle(y),10);
        this.sparkEmitter.emitParticleAt(middle(x),middle(y),14);
        this.refreshHUD();this.checkLift();this.checkPorodnik();this.persist();
      } else if(time-this.lastSave>300)this.persist();
      return;
    }

  }
  animateVehicle(time,dt) {
    this.heat=updateHeat(this.heat,this.cutting,dt);
    const moving=this.moving && this.speed>20;
    const vibration = this.cutting ? 1.1 : moving ? .45 : 0;
    this.drillSprite.setPosition(Math.sin(time*.11)*vibration*.4,Math.sin(time*.065)*vibration);
    this.headHeat.setPosition(this.drillSprite.x,this.drillSprite.y);
    this.trackMotion.setPosition(this.drillSprite.x,this.drillSprite.y);
    this.shadow.setPosition(this.rig.x,this.rig.y+7).setAngle(this.rig.angle);
    // Broad plates move slowly enough to read on a small screen rather than flicker.
    const beltSpeed = this.cutting ? 34 : moving ? this.speed*.14 : 0;
    this.trackMotion.clear();
    for(const [side,y] of [[0,-24],[1,24]]) {
      const speed=beltSpeed+this.turnVelocity*.055*(side===0?1:-1);
      this.beltPhases[side]=((this.beltPhases[side]+speed*dt)%7+7)%7;
      this.trackMotion.fillStyle(0x17282c,1);
      this.trackMotion.fillRoundedRect(-32,y-4.5,65,9,2);
      for(let x=-39-this.beltPhases[side];x<33;x+=7) {
        const left=Math.max(-31,x),right=Math.min(32,x+5.5);
        if(right<=left)continue;
        this.trackMotion.fillStyle(0x697780,1);
        this.trackMotion.fillRect(left,y-3.5,right-left,7);
        this.trackMotion.lineStyle(1,0xc3d0cd,.95);
        this.trackMotion.lineBetween(left,y-3,right,y-3);
        this.trackMotion.lineStyle(1,0x26393e,1);
        this.trackMotion.lineBetween(left,y+3,right,y+3);
      }
    }
    this.headHeat.clear();
    if(this.heat>.01) {
      const color=(255<<16)|(Math.round(125*(1-this.heat)+18)<<8)|8;
      // Color only the cone. Preserve its original metal detail beneath the glow.
      this.headHeat.fillStyle(color,this.heat*.55);
      this.headHeat.fillTriangle(31,-13,57,0,31,13);
      this.headHeat.fillStyle(0xff6a15,this.heat*.12);
      this.headHeat.fillEllipse(39,0,35,28);
      this.headHeat.lineStyle(1.3,0xffaa3c,this.heat*.65);
      for(let x=34;x<53;x+=5) {
        const h=12*(57-x)/26;
        const wave=this.cutting?Math.sin(time*.06+(x-34))*.7:0;
        this.headHeat.lineBetween(x,-h+wave,x+3,h+wave);
      }
    }
    if(moving&&time-this.trackDustTime>65) {
      this.trackDustTime=time;
      this.dustEmitter.setEmitterAngle({min:this.rig.angle+130,max:this.rig.angle+230});
      for(const y of [-24,24]) {const p=this.localPoint(-31,y);this.dustEmitter.emitParticleAt(p.x,p.y,2);}
    }
    if(this.cutting) {
      const p=this.localPoint(55);
      if(time-this.dustTime>65) {
        this.dustTime=time;
        this.dustEmitter.setEmitterAngle({min:this.rig.angle+70,max:this.rig.angle+290});
        this.dustEmitter.emitParticleAt(p.x,p.y,3);
        this.chipEmitter.emitParticleAt(p.x,p.y,2);
      }
      if(time-this.sparkTime>40) {
        this.sparkTime=time;
        this.sparkEmitter.setEmitterAngle({min:this.rig.angle+65,max:this.rig.angle+295});
        this.sparkEmitter.emitParticleAt(p.x,p.y,5);
      }
      this.headHeat.fillStyle(0xffe6a1,.45+Math.sin(time*.12)*.15);
      this.headHeat.fillCircle(55,0,2.2);
    }
  }
}


Object.assign(Base.prototype,armoryMethods);
