import { collectionMethods } from './collection-page.js';
import { restoreClosedCollections, collectionBuffTotals } from './collection-state.js';
import { artifactSceneMethods } from './artifact-scene.js';
import { restoreArtifacts } from './artifact-state.js';
import { restoreBuildingLayout } from './building-layout-state.js';
import { buildingLayoutMethods } from './building-layout-scene.js';
import { makeQuestItem } from './quest-item-view.js';
import { restoreRewards, claimQuestReward } from './quest-rewards.js';
import { constructionMethods } from './construction-scene.js';
import { restoreConstruction, BUILDER_SITE, BUILDER_STORIES, warehouseBody } from './construction-state.js';
import { gameplayZoom } from './viewport-sync.js';
import { createTouchJoystick } from './touch-joystick.js';
import { showGamePanel, showBuildingMenu, openPauseMenu } from './game-menus.js';
import { materialDefinition } from './materials.js';
import { createInventoryPanel, createDrillPanel } from './interface-panels.js';
import { cargoMethods } from './cargo-scene.js';
import { restoreCargo, cargoCount, addCargo } from './cargo-state.js';
import { repairMethods } from './repair-scene.js';
import { combatMethods } from './combat-scene.js';
import { onRepairDeck, queueRepairBrief, restoreRepair, restoreHull, REPAIR_BODY, REPAIR_DECK, REPAIR_BLOCKS, REPAIRMAN_SITE, REPAIR_STORIES } from './repair-state.js';
import { preparePeopleFrames, makePerson, updatePerson } from './people-view.js';
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
import { LIFT, LIFT_BLOCKS, FLOOR_LIFT, liftBlockCount, liftFrameCell, liftDestinations, ownedKeycards, questKeycard, FloorWorld } from './lift-state.js';
import { writeSave, readSettings } from './storage.js';
import { driveStep, driveFits, circleHitsRect } from './drive-controller.js';
import { wrapDegrees, updateHeat } from './drill-motion.js';
const middle = n => n * CELL + CELL / 2;
const heading = {left:180,right:0,up:-90,down:90};
export class Base extends globalThis.Phaser.Scene {
  constructor(key='Base') { super(key); }
  init({save,arrival=false,emergency=false,layoutReturn=false} = {}) {
    const p=save?.progress||{};this.closedCollections=restoreClosedCollections(p.closedCollections);this.collectionBuffs=collectionBuffTotals(this.closedCollections);this.artifacts=restoreArtifacts(p.artifacts);this.questRewards=restoreRewards(p);this.buildingLayout=restoreBuildingLayout(p.buildingLayout);this.layoutEditing=false;this.layoutReturn=layoutReturn;this.constructionQuest=restoreConstruction(p.constructionQuest);this.emergency=emergency;this.combatReady=false;this.repairQuest=restoreRepair(p.repairQuest);this.hull=restoreHull(p.hull);
    const loot=v=>({fiber:Number.isSafeInteger(v?.fiber)?Math.max(0,v.fiber):0,heads:Number.isSafeInteger(v?.heads)?Math.max(0,v.heads):0});this.inventory=loot(p.inventory);this.carriedLoot=loot(p.carriedLoot);this.campaign=p;this.armoryQuest=restoreArmory(p.armoryQuest);this.workshopQuest=restoreWorkshop(p.workshopQuest);this.porodnikJob=restorePorodnikJob(p.porodnikJob,this.cargoCapacity(),this.collectionBuffs.sale);this.cargo=Number.isInteger(p.cargo)?Math.max(0,Math.min(this.cargoCapacity(),p.cargo)):0;this.credits=Number.isSafeInteger(p.credits)?Math.max(0,p.credits):0;this.cargoHold=restoreCargo(p.cargoHold,this.cargo,this.cargoCapacity());this.cargo=cargoCount(this.cargoHold);
    this.floorNumber=this.sys.settings.key==='Floor'?([1,2,3,4].includes(p.floor)?p.floor:1):0;
    if(!this.floorNumber)queueRepairBrief(this.repairQuest,this.armoryQuest);
    const local=this.floorNumber?(p.floors?.[this.floorNumber]||{}):(p.base||p);
    this.world=this.floorNumber?new FloorWorld(local,this.floorNumber):new BaseWorld(local);
    // Old saves may park inside the newly installed machine.
    if(!this.floorNumber&&circleHitsRect(middle(this.world.x),middle(this.world.y),this.buildingGeom('porodnik').collider)){this.world.x=18;this.world.y=35;}
    if(!this.floorNumber&&circleHitsRect(middle(this.world.x),middle(this.world.y),this.buildingGeom('workshop').body)){this.world.x=32;this.world.y=35;}
    if(this.floorNumber===1&&!this.workshopQuest.mechanic&&this.world.x===MECHANIC_SITE.x&&this.world.y===MECHANIC_SITE.y){this.world.x=FLOOR_LIFT.x;this.world.y=FLOOR_LIFT.y;}
    if(!this.floorNumber&&circleHitsRect(middle(this.world.x),middle(this.world.y),this.buildingGeom('armory').body)){this.world.x=41;this.world.y=34;}
    if(this.floorNumber===2&&!this.armoryQuest.rescued&&this.world.x===ARMORER_SITE.x&&this.world.y===ARMORER_SITE.y){this.world.x=FLOOR_LIFT.x;this.world.y=FLOOR_LIFT.y;}
    if(!this.floorNumber&&circleHitsRect(middle(this.world.x),middle(this.world.y),this.buildingGeom('repair').body)){this.world.x=8;this.world.y=35;}
    if(this.floorNumber===3&&!this.repairQuest.rescued&&this.world.x===REPAIRMAN_SITE.x&&this.world.y===REPAIRMAN_SITE.y){this.world.x=FLOOR_LIFT.x;this.world.y=FLOOR_LIFT.y;}
    if(!this.floorNumber){this.inventory.fiber+=this.carriedLoot.fiber;this.inventory.heads+=this.carriedLoot.heads;this.carriedLoot={fiber:0,heads:0};}
    this.parked=arrival?null:local.drive;this.arrival=arrival;this.busy=arrival;this.storyActive=false;this.leaving=false;
    this.liftCenter=this.floorNumber?FLOOR_LIFT:this.buildingGeom('lift').center;
    if(arrival){this.world.x=this.liftCenter.x;this.world.y=this.liftCenter.y;}
    this.touchStick=null;this.moving=false;this.hold=null;this.lastSave=0;
    this.dustTime=0;this.trackDustTime=0;this.sparkTime=0;this.speed=0;this.heat=0;this.beltPhases=[0,0];this.turnVelocity=0;this.cutting=false;
  }
  create() {
    this.makeTextures();
    this.grantStarterWarehouse(false);
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
    this.cameras.main.setZoom(gameplayZoom(this.scale.width,this.scale.height));
    this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC');
    this.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    this.input.keyboard.on('keydown-ESC',this.goMenu,this);
    this.input.keyboard.on('keydown-E',this.interact,this);
    this.input.keyboard.on('keydown-SPACE',this.interact,this);
    this.clearInput = () => { this.layoutPointer=null;this.joystick?.reset(); this.hold=null; this.touchStick=null; this.speed=0; this.input.keyboard.resetKeys(); this.persist(); };
    window.addEventListener('blur',this.clearInput);
    document.addEventListener('visibilitychange',this.clearInput);
    this.fit = size => { this.cameras.main.setViewport(0,0,size.width,size.height); this.cameras.main.setZoom(this.layoutEditing?Math.min(.72,gameplayZoom(size.width,size.height)):gameplayZoom(size.width,size.height)); };
    this.scale.on('resize',this.fit);
    this.events.once('shutdown',()=>{
      if(!this.leaving)this.persist(); this.joystick?.destroy();this.joystick=null;this.hold=null;this.touchStick=null;
      window.removeEventListener('blur',this.clearInput); document.removeEventListener('visibilitychange',this.clearInput);
      this.scale.off('resize',this.fit);
      this.input.keyboard.removeCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    });
    this.passenger=this.add.image(-7,0,'people','serega-0').setDisplaySize(16,16).setVisible(this.floorNumber?!!this.campaign.base?.rescued:this.world.rescued);this.passenger.setVisible(this.passenger.visible&&!this.constructionQuest.unlocked);this.rig.add(this.passenger);
    this.builderPassenger=this.add.image(-9,-14,'people','serega-0').setDisplaySize(16,16).setTint(0xa7cde9).setVisible(this.constructionQuest.rescued&&!this.constructionQuest.unlocked);this.rig.add(this.builderPassenger);
    this.dialogClosed=()=>{this.joystick?.reset();this.hold=null;this.touchStick=null;this.input.keyboard.resetKeys();this.speed=0;};
    document.querySelector('#dialog').addEventListener('close',this.dialogClosed);
    this.events.once('shutdown',()=>document.querySelector('#dialog').removeEventListener('close',this.dialogClosed));
    this.refreshHUD();this.persist();this.checkLift();this.checkPorodnik();
    if(this.arrival)this.lift.arrive(this.rig,this.shadow).then(()=>{this.busy=false;this.world.x=Math.floor(this.rig.x/CELL);this.world.y=Math.floor(this.rig.y/CELL);this.dialogClosed();this.refreshHUD();this.persist();this.checkWorkshop();this.checkArmory();this.checkRepair();this.checkConstruction();});
    this.mechanicPassenger=this.add.image(-7,10,'people','mechanic-0').setDisplaySize(16,16).setVisible(this.workshopQuest.mechanic&&!this.workshopQuest.ready);this.rig.add(this.mechanicPassenger);
    this.armorerPassenger=this.add.image(-7,-8,'people','armorer-0').setDisplaySize(16,16).setVisible(this.armoryQuest.rescued&&!this.armoryQuest.ready);this.rig.add(this.armorerPassenger);this.makeMountedWeapon();
    this.repairPassenger=this.add.image(-5,6,'ilya','ilya-0').setDisplaySize(16,16).setVisible(this.repairQuest.rescued&&!this.repairQuest.ready);this.rig.add(this.repairPassenger);this.makeCombat();this.makeBuildingEditor();
    this.cameras.main.fadeIn(300,12,26,27);
    if(this.layoutReturn)this.time.delayedCall(400,()=>{if(!this.storyActive)this.toggleBuildingEditor();});
    if(!this.arrival)this.time.delayedCall(350,()=>{
      if(this.emergency)this.notify('БУР ПОВРЕЖДЁН · ЭВАКУАЦИЯ НА БАЗУ\nГруз потерян. Бур снова готов к работе.');
      if(this.world.dialogue)this.startStory(this.world.dialogue);
      else if(this.workshopQuest.dialogue)this.startStory(this.workshopQuest.dialogue);
      else if(this.armoryQuest.dialogue)this.startStory(this.armoryQuest.dialogue);
      else if(this.repairQuest.dialogue)this.checkRepair();
      else if(this.constructionQuest.dialogue)this.checkConstruction();
      else if(!this.world.heard)this.playRadio();
      else {this.checkWorkshop();this.checkArmory();this.checkRepair();this.checkConstruction();}
    });
  }
  makeTextures() {
    preparePeopleFrames(this);
    if(this.textures.exists('dust'))return;
    const g=this.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0xffd477);g.fillCircle(5,5,5);g.generateTexture('dust',10,10);g.destroy();
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
      const m=this.buildingGeom('porodnik').body,d=this.buildingDeck('porodnik');
      this.porodnik=this.add.image(m.x,m.y,'porodnik','machine').setOrigin(0).setDisplaySize(m.width,m.height).setDepth(2.4);
      this.porodnikDeck=this.add.image(d.x,d.y,'porodnik','parking').setOrigin(0).setDisplaySize(d.width,d.height).setDepth(2.4);
      this.porodnikMotion=this.add.graphics().setDepth(5);
      this.porodnikLed=this.add.circle(m.x+4.1*CELL,m.y+1.95*CELL,4,0xffac46).setDepth(5);
      this.person=makePerson(this,middle(RESCUE.x),middle(RESCUE.y),'serega').setVisible(!this.world.rescued);
      this.marker=this.add.text(this.person.x,this.person.y-55,'! СЕРЁГА Т',{fontFamily:'Arial',fontSize:'16px',fontStyle:'bold',color:'#163d3b',backgroundColor:'#ffd372',padding:{x:9,y:5}}).setOrigin(.5).setDepth(11).setVisible(!this.world.rescued);
      this.tweens.add({targets:this.marker,y:this.marker.y-6,duration:800,yoyo:true,repeat:-1});
    }
    this.makeWorkshopObjects();this.makeArmoryObjects();this.makeRepairObjects();this.makeConstructionObjects();
    this.drillBar=this.add.graphics().setDepth(30);
  }
  makeWorkshopObjects() {
    const q=this.workshopQuest;
    const label=(x,y,text)=>this.add.text(middle(x),middle(y)-55,text,{fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:'#173c3c',backgroundColor:'#ffd372',padding:{x:7,y:4}}).setOrigin(.5).setDepth(11);
    if(this.floorNumber===1) {
      this.toolsArt=makeQuestItem(this,middle(TOOLS_SITE.x),middle(TOOLS_SITE.y),'tools').setVisible(!q.tools);
      this.toolsMarker=label(TOOLS_SITE.x,TOOLS_SITE.y,'! ИНСТРУМЕНТЫ').setVisible(!q.tools);
      this.mechanic=makePerson(this,middle(MECHANIC_SITE.x),middle(MECHANIC_SITE.y),'mechanic').setVisible(!q.mechanic);
      this.mechanicMarker=label(MECHANIC_SITE.x,MECHANIC_SITE.y,'! КОНСТАНТИН Б').setVisible(!q.mechanic);
    }else if(!this.floorNumber){
      this.workshop=new WorkshopView(this,{body:this.buildingGeom('workshop').body,deck:this.buildingDeck('workshop')});this.workshop.powered(q.ready);
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
    const q=this.workshopQuest;if(!q||this.layoutEditing||this.busy||this.storyActive||this.world.dialogue||document.querySelector('#dialog').open)return;
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
    if(!this.workshopQuest.ready||this.workshopQuest.serviceRemaining!=null||!onWorkshopDeck(this.rig,this.buildingDeck('workshop')))return;
    this.dialogClosed();this.persist();const q=this.workshopQuest;
    const panel=document.createElement('div');panel.className='lift-console';
    const text=document.createElement('p'),buy=document.createElement('button'),status=document.createElement('p'),exit=document.createElement('button');buy.className=exit.className='metal-button';
    exit.textContent='ГОТОВО';exit.className='floor-button';status.className='service-status';status.setAttribute?.('role','status');
    const render=()=>{text.className='service-readout';text.textContent=`Мощность  ${Number((100+q.upgrades*2+(this.collectionBuffs?.drill||0)*100).toFixed(3))}%\nКредиты  ${this.credits}`;buy.textContent=q.upgrades>=100?'МОЩНОСТЬ УЛУЧШЕНА ДО МАКСИМУМА':`УЛУЧШИТЬ МОЩНОСТЬ +2% · ${workshopPrice(q)} КРЕДИТОВ`;buy.disabled=q.upgrades>=100||this.credits<workshopPrice(q);status.textContent=q.serviceRemaining!=null?`Механик работает: ${(q.serviceRemaining/1000).toFixed(1)} с. Можно купить ещё улучшения.`:'Можно улучшить бур ещё раз или выйти из мастерской.';exit.disabled=q.serviceRemaining!=null;};
    this.workshopPanelRender=render;
    document.querySelector('#dialog').addEventListener('close',()=>{this.workshopPanelRender=null;},{once:true});
    buy.addEventListener('click',()=>{const result=buyWorkshopUpgrade(q,this.credits,true);if(!result.bought)return;this.credits=result.credits;if(q.upgrades===1)this.rewardQuest('firstUpgrade');render();this.refreshHUD();this.persist();});
    exit.addEventListener('click',()=>{if(q.serviceRemaining==null)document.querySelector('#dialog').close();});render();panel.append(text,buy,status,exit);
    showBuildingMenu('workshop',panel);
  }
  makeHUD() {
    const ui=document.querySelector('#ui');ui.replaceChildren();ui.dataset.screen='base';
    const hud=document.createElement('section');hud.className='base-hud';hud.innerHTML=`
      <header class="base-top"><div class="base-location">БУНКЕР №72 <span>База</span></div><div class="hud-actions"><button class="hud-button" id="base-inventory">ИНВЕНТАРЬ</button><button class="hud-button" id="base-menu">Ⅱ ПАУЗА</button></div></header>
      <aside class="radio-card"><button class="quest-toggle" type="button" aria-controls="quest-details" aria-expanded="true"></button><div id="quest-details"><div class="radio-title"><span class="radio-led"></span> РАЦИЯ · БАЗА</div><strong id="quest-name"></strong><p id="radio-text"></p><div class="quest-track" id="quest-status"></div><div id="keycard-info" class="keycard-info" aria-label="Ключ-карты лифта" hidden></div></div></aside>
      <footer class="base-bottom"><div class="combat-hud"><span id="combat-hull"></span><span id="hud-cargo"></span><span id="hud-credits"></span><span id="combat-tip" hidden></span><span id="combat-loot" hidden></span></div><div id="base-save" role="status" hidden></div><button class="hud-button rescue-button" id="rescue-action">СПАСТИ СЕРЁГУ</button></footer>
      <button class="hud-button building-mode-button" id="base-buildings" type="button">ПОСТРОЙКИ</button><div class="touch-pad"><div class="touch-joystick" role="group" aria-label="Джойстик: потяни в нужную сторону, отпусти для остановки"><span class="joystick-axis axis-horizontal"></span><span class="joystick-axis axis-vertical"></span><span class="joystick-knob"></span></div></div>`;
    ui.append(hud);
    const radio=hud.querySelector('.radio-card'),toggle=hud.querySelector('.quest-toggle');radio.classList.toggle('radio-in-inventory',readSettings().radioInInventory);
    this.questCollapsed ??= !!window.matchMedia?.('(max-height:420px) and (min-aspect-ratio:1/1)')?.matches;
    const renderQuest=()=>{radio.classList.toggle('quest-collapsed',this.questCollapsed);toggle.setAttribute('aria-expanded',String(!this.questCollapsed));toggle.textContent=this.questCollapsed?'ЗАДАНИЕ ▾':'СВЕРНУТЬ ЗАДАНИЕ ▲';toggle.setAttribute('aria-label',this.questCollapsed?'Развернуть задание':'Свернуть задание');};
    toggle.addEventListener('click',()=>{this.questCollapsed=!this.questCollapsed;this.joystick?.reset();renderQuest();});renderQuest();
    hud.querySelector('#base-buildings').hidden=!!this.floorNumber;hud.querySelector('#base-buildings').addEventListener('click',()=>this.toggleBuildingEditor());
    hud.querySelector('#base-menu').addEventListener('click',()=>this.goMenu());
    hud.querySelector('#base-inventory').addEventListener('click',()=>this.openInventory());
    hud.querySelector('#rescue-action').addEventListener('click',()=>this.interact());
    this.joystick?.destroy();
    this.joystick=createTouchJoystick(hud.querySelector('.touch-joystick'),value=>{this.touchStick=value;},
      ()=>!this.layoutEditing&&!this.busy&&!this.storyActive&&!document.querySelector('#dialog').open);

  }
  liftReady() {return this.floorNumber?true:this.world.rescued&&liftBlockCount(this.world)===0;}
  syncAction() {
    const action=document.querySelector('#rescue-action');if(!action||!this.rig)return;
    const repairItem=this.repairFloorAction(),atRepair=!this.floorNumber&&this.repairQuest.ready&&onRepairDeck(this.rig,this.buildingDeck('repair'));
    const saving=!this.floorNumber&&!this.world.rescued;
    const unloading=!this.floorNumber&&this.world.porodnikPowered&&onPorodnikDeck(this.rig,this.buildingDeck('porodnik'));
    const armoryItem=this.armoryFloorAction(),atArmory=!this.floorNumber&&this.armoryQuest.ready&&onArmoryDeck(this.rig,this.buildingDeck('armory'));
    const questItem=this.workshopFloorAction(),atWorkshop=!this.floorNumber&&this.workshopQuest.ready&&onWorkshopDeck(this.rig,this.buildingDeck('workshop'));
    const constructionAction=this.constructionAction();
    const label=constructionAction==='builder'?'СПАСТИ МАСТЕРА':constructionAction==='builderBlocked'?'ОСВОБОДИТЬ КОМНАТУ':constructionAction==='warehouse'?'СКЛАД':constructionAction==='construction'?'СТРОИТЕЛЬСТВО':repairItem==='repairman'?'СПАСТИ ИЛЬЮ':repairItem==='repairKit'?'ЗАБРАТЬ РЕМКОМПЛЕКТ':atRepair?'РЕМОНТНЫЙ ЦЕХ':armoryItem==='armorer'?'СПАСТИ ОРУЖЕЙНИКА':armoryItem==='blueprint'?'ЗАБРАТЬ ЧЕРТЁЖ':atArmory?'ОРУЖЕЙНАЯ':questItem==='tools'?'ЗАБРАТЬ ИНСТРУМЕНТЫ':questItem==='mechanic'?'СПАСТИ МЕХАНИКА':atWorkshop?'МАСТЕРСКАЯ':saving?'СПАСТИ СЕРЁГУ':unloading?(this.porodnikJob?'ПЕРЕРАБОТКА…':'ПРОДАТЬ ПОРОДУ'):'ПУЛЬТ ЛИФТА';if(action.textContent!==label)action.textContent=label;
    if(constructionAction){action.hidden=false;action.disabled=this.busy||this.storyActive||!!this.constructionQuest.dialogue||constructionAction==='builderBlocked';return;}
    action.hidden=!(repairItem||atRepair||armoryItem||atArmory||questItem||atWorkshop||unloading||(saving&&this.world.canRescue(this.rig.x,this.rig.y))||(this.liftReady()&&this.lift.contains(this.rig)));action.disabled=this.repairQuest.serviceRemaining!=null||!!this.repairQuest.dialogue||(atRepair&&this.repairQuest.wave==='active')||(!repairItem&&!atRepair&&!armoryItem&&!atArmory&&!questItem&&!atWorkshop&&!unloading&&this.repairQuest.wave==='active')||this.armoryQuest.serviceRemaining!=null||!!this.armoryQuest.dialogue||this.workshopQuest.serviceRemaining!=null||this.busy||this.storyActive||!!this.world.dialogue||!!this.workshopQuest.dialogue||(repairItem||atRepair||armoryItem||atArmory||questItem||atWorkshop?false:unloading?!!this.porodnikJob||this.cargo===0:saving?!this.world.canRescue(this.rig.x,this.rig.y):!this.liftReady()||!this.lift.contains(this.rig));
  }
  refreshHUD() {
    const w=this.world,ready=this.liftReady();
    document.querySelector('.base-location').innerHTML=this.floorNumber?`ЭТАЖ ${this.floorNumber} <span>Шахта</span>`:'БУНКЕР №72 <span>База</span>';
    document.querySelector('.radio-title').lastChild.textContent=this.floorNumber?` РАЦИЯ · ЭТАЖ ${this.floorNumber}`:' РАЦИЯ · БАЗА';
    document.querySelector('#quest-name').textContent=this.floorNumber?'Первый спуск':!w.rescued?'Голос за завалом':ready?'Расчистить «Породник»':'Расчистить лифт';
    document.querySelector('#radio-text').textContent=this.floorNumber?'Первый этаж. Вернуться на базу можно через грузовой лифт.':!w.rescued?(w.heard?STORY_LINES.radio[0]:'Ты очнулся один. Бур завёлся. Рация оживает.'):ready?'Лифт освобождён. Следующее задание: расчистить «Породник».':STORY_LINES.rescue[3];
    document.querySelector('#quest-status').textContent=this.floorNumber?'Карта 1-го этажа использована для доступа · База доступна':!w.rescued?`Расчищено: ${w.cleared.size} · Подъедь к Серёге вплотную`:ready?'Расчисти завал у приёмника · Серёга восстановит питание':`Расчистить лифт: ${3-liftBlockCount(w)}/3 · Ключ-карта 1-го этажа получена`;
    if(!this.floorNumber&&w.porodnikPowered){
      document.querySelector('#quest-name').textContent='«Породник» работает';
      document.querySelector('#radio-text').textContent='Заезжай на площадку и выгружай породу. Лифт готов к спуску.';
      document.querySelector('#quest-status').textContent='Приёмник готов к работе';
    }else if(!this.floorNumber&&ready){document.querySelector('#quest-status').textContent=`Приёмник: ${5-porodnikBlockCount(w)}/5`;}
    if(this.porodnikLed)this.porodnikLed.setFillStyle(w.porodnikPowered?0x74ee87:0xffac46);
    const q=this.workshopQuest;
    if(q?.briefed) {
      const name=document.querySelector('#quest-name'),radio=document.querySelector('#radio-text'),status=document.querySelector('#quest-status');
      if(this.floorNumber){
        name.textContent='Инструменты для мастерской';radio.textContent=q.tools&&q.mechanic?'Инструменты и механик на борту. Возвращайся на базу через лифт.':'Найди ящик с инструментами и спаси Константина Б.';
        status.textContent=q.tools&&q.mechanic?`Лифт: ${objectiveBearing(this.rig,FLOOR_LIFT)}`:`Инструменты: ${q.tools?'✓':objectiveBearing(this.rig,TOOLS_SITE)} · Константин: ${q.mechanic?'✓':objectiveBearing(this.rig,MECHANIC_SITE)}`;
      }else if(q.ready){name.textContent=q.upgrades?'Бур готов к следующему спуску':'Первое улучшение бура';radio.textContent=q.upgrades?'Константин улучшил бур. Следующая история — спасение оружейника на втором этаже.':'Заезжай в мастерскую. Константин улучшит мощность за кредиты.';status.textContent=`Мощность: ${Number((100+q.upgrades*2+(this.collectionBuffs?.drill||0)*100).toFixed(3))}% · Груз: ${this.cargo}/${this.cargoCapacity()} · Кредиты: ${this.credits}`;
      }else if(q.tools&&q.mechanic){name.textContent='Расчистить мастерскую';radio.textContent='Инструменты и механик доставлены. Серёга ждёт у мастерской.';status.textContent=`Ворота: ${3-workshopBlockCount(w)}/3 · Мастерская: ${objectiveBearing(this.rig,{x:32,y:34})}`;
      }else{name.textContent='Инструменты для мастерской';radio.textContent='На первом этаже нужны инструменты. Там остался механик Константин Б.';status.textContent=`Инструменты: ${q.tools?'✓':'не найдены'} · Механик: ${q.mechanic?'спасён':'не найден'} · Лифт: ${objectiveBearing(this.rig,this.buildingGeom('lift').center)}`;}
    }
    this.refreshArmoryHUD();this.refreshRepairHUD();this.refreshConstructionHUD();this.refreshKeycards();this.refreshCombatHUD();this.lift.powered(ready);this.syncAction();
  }
  refreshKeycards() {
    const info=document.querySelector('#keycard-info');if(!info)return;
    const floor=questKeycard({...this.campaign,floor:this.floorNumber,base:this.floorNumber?this.campaign.base:this.world,armoryQuest:this.armoryQuest,repairQuest:this.repairQuest,constructionQuest:this.constructionQuest});
    const signature=String(floor);if(info.dataset.cards===signature)return;
    info.dataset.cards=signature;info.hidden=floor==null;info.replaceChildren();
    if(floor==null)return;
    const title=document.createElement('span');title.className='keycard-caption';title.textContent='КАРТА ЗАДАНИЯ';info.append(title);
    const card=document.createElement('span');card.className='keycard-chip';card.textContent='Этаж '+floor;info.append(card);
  }
  snapshotCampaign() {
    const local={...this.world.snapshot(),drive:{x:this.rig.x,y:this.rig.y,angle:this.rig.angle}};
    const base=this.floorNumber?(this.campaign.base||{}):local;
    const floors={...(this.campaign.floors||{})};if(this.floorNumber)floors[this.floorNumber]=local;
    const keycards=ownedKeycards({...this.campaign,base,armoryQuest:this.armoryQuest,repairQuest:this.repairQuest,constructionQuest:this.constructionQuest});
    return {...base,artifacts:{...this.artifacts},closedCollections:[...(this.closedCollections||[])],buildingLayout:{...(this.buildingLayout||{})},questRewards:[...(this.questRewards||[])],constructionQuest:{...this.constructionQuest,stock:{...this.constructionQuest?.stock}},repairQuest:{...this.repairQuest},hull:this.hull,inventory:{...this.inventory},carriedLoot:{...this.carriedLoot},combat:this.combatSnapshot(),armoryQuest:{...this.armoryQuest},workshopQuest:{...this.workshopQuest},porodnikJob:this.porodnikJob?{...this.porodnikJob}:null,cargoHold:{...this.cargoHold},cargo:this.cargo,credits:this.credits,location:this.floorNumber?'floor':'base',floor:this.floorNumber,base,floors,keycards,highestFloor:this.campaign.highestFloor||0};
  }
  persist() {
    if(this.leaving||!this.rig)return;
    this.campaign=this.snapshotCampaign();const saved=writeSave(this.campaign);
    const status=document.querySelector('#base-save');if(status){status.hidden=saved;status.textContent=saved?'':'Не удалось сохранить прогресс';}this.lastSave=this.time.now;
  }
  openInventory(){
    if(this.layoutEditing||this.busy||this.storyActive||document.querySelector('#dialog').open)return;
    this.dialogClosed();this.persist();const panel=createInventoryPanel(this.snapshotCampaign());const specs=document.createElement('button');specs.className='metal-button';specs.textContent='ХАРАКТЕРИСТИКИ БУРА';specs.addEventListener('click',()=>showGamePanel('ХАРАКТЕРИСТИКИ БУРА',createDrillPanel(this.snapshotCampaign()),'drill',()=>{document.querySelector('#dialog').close();this.openInventory();}));panel.append(specs);const collections=document.createElement('button');collections.className='metal-button';collections.textContent='КОЛЛЕКЦИИ · '+this.closedCollections.length+'/1000';collections.addEventListener('click',()=>this.openCollections(()=>{document.querySelector('#dialog').close();this.openInventory();}));panel.append(collections);if(!this.floorNumber){const button=document.createElement('button');button.className='metal-button';button.textContent='ПОСТРОЙКИ · ПЕРЕМЕСТИТЬ ЗДАНИЯ';button.addEventListener('click',()=>{document.querySelector('#dialog').close();this.toggleBuildingEditor();});panel.append(button);}showGamePanel('ИНВЕНТАРЬ',panel,'inventory');
  }
  goMenu() {if(this.layoutEditing){this.toggleBuildingEditor();return;}if(this.busy||this.storyActive||document.querySelector('#dialog').open)return;openPauseMenu(this);}
  interact() {
    if(this.constructionQuest.dialogue||this.repairQuest.serviceRemaining!=null||this.repairQuest.dialogue||this.armoryQuest.serviceRemaining!=null||this.armoryQuest.dialogue||this.workshopQuest.serviceRemaining!=null||this.workshopQuest.dialogue||this.world.dialogue||this.layoutEditing||this.busy||this.storyActive||document.querySelector('#dialog').open)return;
    if(this.interactConstruction())return;
    const repairItem=this.repairFloorAction();
    if(repairItem){this.collectRepairItem(repairItem);return;}
    if(!this.floorNumber&&this.repairQuest.ready&&onRepairDeck(this.rig,this.buildingDeck('repair'))){this.openRepair();return;}
    const armoryItem=this.armoryFloorAction();
    if(armoryItem){this.collectArmoryItem(armoryItem);return;}
    if(!this.floorNumber&&this.armoryQuest.ready&&onArmoryDeck(this.rig,this.buildingDeck('armory'))){this.openArmory();return;}
    const item=this.workshopFloorAction();
    if(item)this.collectWorkshopItem(item);
    else if(!this.floorNumber&&this.workshopQuest.ready&&onWorkshopDeck(this.rig,this.buildingDeck('workshop')))this.openWorkshop();
    else if(!this.floorNumber&&!this.world.rescued)this.rescue();
    else if(!this.floorNumber&&this.world.porodnikPowered&&onPorodnikDeck(this.rig,this.buildingDeck('porodnik')))this.unloadPorodnik();
    else if(this.liftReady()&&this.lift.contains(this.rig))this.openLift();
  }
  unloadPorodnik() {
    if(this.porodnikJob||!this.world.porodnikPowered||!onPorodnikDeck(this.rig,this.buildingDeck('porodnik'))||!this.cargo)return;
    this.openPorodnik();
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
    const m=this.buildingGeom('porodnik').body,g=this.porodnikMotion,job=this.porodnikJob;
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
    const text=`Переработка: ${(job.remaining/1000).toFixed(1)} с · Груз: ${this.cargo}/${this.cargoCapacity()} · Кредиты: ${this.credits}`;
    if(status&&status.textContent!==text)status.textContent=text;
  }
  checkPorodnik() {
    if(this.floorNumber||this.world.porodnikPowered||!this.world.porodnikBriefed||porodnikBlockCount(this.world)>0)return;
    this.world.porodnikPowered=true;this.rewardQuest('porodnik');this.refreshHUD();this.persist();
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
    if(this.layoutEditing||this.busy||this.storyActive||!STORY_LINES[kind])return;
    const holder=BUILDER_STORIES.includes(kind)?this.constructionQuest:REPAIR_STORIES.includes(kind)?this.repairQuest:ARMORY_STORIES.includes(kind)?this.armoryQuest:['workshop','mechanic','workshopReturn','workshopReady'].includes(kind)?this.workshopQuest:this.world;
    this.storyActive=true;this.speed=0;this.dialogClosed();holder.dialogue=kind;this.persist();
    showStoryDialogue(this,{kind,lines:STORY_LINES[kind],page:holder.dialoguePage,
      onPage:page=>{holder.dialoguePage=page;this.persist();},
      onFinish:()=>{
        holder.dialogue=null;holder.dialoguePage=0;this.rewardQuest(kind);
        if(kind==='builderBrief'){this.constructionQuest.briefed=true;this.notify('ПОЛУЧЕНА КЛЮЧ-КАРТА · ЭТАЖ 4');}
        if(kind==='builderSignal')this.constructionQuest.signalHeard=true;
        if(kind==='builderReturn'){this.constructionQuest.unlocked=true;this.grantStarterWarehouse();this.builderPassenger?.setVisible(false);this.passenger?.setVisible(false);this.renderConstruction();this.notify('СТРОИТЕЛЬСТВО ОТКРЫТО · ПЕРВЫЙ СКЛАД ГОТОВ');}
        if(kind==='repairBrief')this.repairQuest.briefed=true;
        if(kind==='repairReturn')this.repairQuest.returnBriefed=true;
        if(kind==='waveBrief'){this.repairQuest.wave='active';this.beginDefense();}
        if(kind==='armoryBrief')this.armoryQuest.briefed=true;if(kind==='armoryReturn')this.armoryQuest.returnBriefed=true;if(kind==='workshop')this.workshopQuest.briefed=true;if(kind==='workshopReturn')this.workshopQuest.returnBriefed=true;if(kind==='porodnik')this.world.porodnikBriefed=true;this.storyActive=false;this.dialogClosed();this.refreshHUD();this.persist();
        if(kind==='repairBrief')this.notify('ПОЛУЧЕНА КЛЮЧ-КАРТА · ЭТАЖ 3\nНОВОЕ ЗАДАНИЕ · РЕМОНТНЫЙ КОМПЛЕКТ');
        if(kind==='workshop')this.notify('НОВОЕ ЗАДАНИЕ · ИНСТРУМЕНТЫ ДЛЯ МАСТЕРСКОЙ');
        if(kind==='workshopReady')this.notify('МАСТЕРСКАЯ ВОССТАНОВЛЕНА · МЕХАНИК КОНСТАНТИН Б');
        if(kind==='porodnik')this.notify('НОВОЕ ЗАДАНИЕ · «РАСЧИСТИТЬ ПОРОДНИК»');
        if(kind==='rescue')this.notify('ПОЛУЧЕНА КЛЮЧ-КАРТА · ЭТАЖ 1\nНОВОЕ ЗАДАНИЕ · «РАСЧИСТИТЬ ЛИФТ»');
        this.checkLift();this.checkPorodnik();this.checkRepair();this.checkConstruction();
      }
    });
  }
  rewardQuest(id) {const result=claimQuestReward(this.questRewards||(this.questRewards=[]),id,this.credits);if(!result.amount)return;this.credits=result.credits;this.persist();this.notify(`ЗАДАНИЕ ВЫПОЛНЕНО · +${result.amount} КРЕДИТОВ`);}
  notify(text) {
    const hud=document.querySelector('.base-hud');let toast=hud.querySelector('.quest-toast');if(toast)toast.textContent+='\n'+text;else{toast=document.createElement('div');toast.className='quest-toast';toast.setAttribute('role','status');toast.textContent=text;hud.append(toast);}this.toastTimer?.remove();this.toastTimer=this.time.delayedCall(4200,()=>toast.remove());
  }
  checkLift() {
    if(this.floorNumber||!this.liftReady())return;
    if(!this.world.liftAnnounced) {
      this.world.liftAnnounced=true;this.rewardQuest('lift');this.refreshHUD();this.persist();this.cameras.main.shake(160,.001);this.lift.motor(.35);
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
    const floors=document.createElement('div');floors.className='lift-floor-list';floors.setAttribute('aria-label','Этажи');
    const baseDock=document.createElement('aside');baseDock.className='lift-base-dock';
    for(const entry of liftDestinations(this.campaign)) {
      const button=document.createElement('button');button.className='floor-button';button.dataset.floor=entry.floor;
      button.textContent=entry.floor===0?'⌂ БАЗА · №72':`ЭТАЖ ${entry.floor}${entry.enabled?'':' · НУЖНА КЛЮЧ-КАРТА'}`;
      button.disabled=!entry.enabled;button.classList.toggle('selected',entry.floor===selected);
      button.addEventListener('click',()=>{selected=entry.floor;buttons.forEach(b=>b.classList.toggle('selected',Number(b.dataset.floor)===selected));display.textContent=selected===0?'БАЗА · №72':`ЭТАЖ ${selected}`;travel.disabled=selected===this.floorNumber;status.textContent=selected===this.floorNumber?'Ты уже на этой остановке.':'Платформа готова к отправлению.';});
      buttons.push(button);(entry.floor===0?baseDock:floors).append(button);
    }
    panel.append(baseDock,floors);status.textContent='База — отдельная кнопка. Этажи можно прокручивать.';
    travel.addEventListener('click',()=>{document.querySelector('#dialog').close();this.travelTo(selected);});panel.append(travel);
    showBuildingMenu('lift',panel);
  }
  async travelTo(target) {
    if(this.busy||this.storyActive||target===this.floorNumber||![0,1,2,3,4].includes(target)||this.repairQuest.wave==='active'||!this.liftReady()||!this.lift.contains(this.rig)||!liftDestinations(this.campaign).some(e=>e.floor===target&&e.enabled))return;
    this.busy=true;this.speed=0;this.dialogClosed();this.persist();
    await this.lift.depart(this.rig,this.shadow,target);
    this.campaign=this.snapshotCampaign();this.campaign.location=target===0?'base':'floor';this.campaign.floor=target;
    this.campaign.highestFloor=Math.max(this.campaign.highestFloor,target);
    if(!writeSave(this.campaign)){this.notifySaveFailure();return;}
    this.leaving=true;this.scene.start(target===0?'Base':'Floor',{save:{version:1,progress:this.campaign},arrival:true});
  }
  notifySaveFailure() {
    this.cameras.main.fadeIn(200);this.lift.arrive(this.rig,this.shadow).then(()=>{this.busy=false;this.refreshHUD();});
    const p=document.createElement('p');p.textContent='Браузер не разрешил сохранить поездку. Разреши локальное хранение данных и попробуй ещё раз.';showGamePanel('СОХРАНЕНИЕ НЕДОСТУПНО',p);
  }
  makeEffects() {
    this.combatEffects=this.add.graphics().setDepth(26);
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
    if(this.layoutEditing){this.speed=0;this.cutting=false;return;}
    this.syncAction();this.drawLiftGlow(time);this.lift.update(Math.min(delta,50));
    if(this.busy||this.storyActive)return;
    if(document.querySelector('#dialog').open){
      if(this.workshopPanelRender){
        this.workshop?.update(Math.min(delta,50),this.workshopQuest.serviceRemaining>0);
        if(this.workshopQuest.serviceRemaining!=null)this.updateWorkshopService(time,Math.min(delta,50)/1000);
        this.workshopPanelRender();
      }
      if(this.armoryPanelRender){this.armory?.update(Math.min(delta,50),this.armoryQuest.serviceRemaining>0);if(this.armoryQuest.serviceRemaining!=null)this.updateWorkshopService(time,Math.min(delta,50)/1000,this.armoryQuest,this.buildingDeck('armory'));this.armoryPanelRender();}
      return;
    }
    for(const person of [this.person,this.mechanic,this.armorer,this.repairman])updatePerson(person,delta,this.rig);
    this.updateConstruction(Math.min(delta,50));if(this.storyActive)return;this.refreshConstructionHUD();
    this.updatePorodnikCycle(Math.min(delta,50));this.animatePorodnik(time);
    this.workshop?.update(Math.min(delta,50),this.workshopQuest.serviceRemaining>0);
    this.repairShop?.update(Math.min(delta,50),this.repairQuest.serviceRemaining>0);
    this.armory?.update(Math.min(delta,50),this.armoryQuest.serviceRemaining>0);
    if(!this.floorNumber&&this.repairQuest.serviceRemaining!=null){this.updateWorkshopService(time,Math.min(delta,50)/1000,this.repairQuest,this.buildingDeck('repair'));return;}
    if(!this.floorNumber&&this.armoryQuest.serviceRemaining!=null){this.updateWorkshopService(time,Math.min(delta,50)/1000,this.armoryQuest,this.buildingDeck('armory'));return;}
    if(!this.floorNumber&&this.workshopQuest.serviceRemaining!=null){this.updateWorkshopService(time,Math.min(delta,50)/1000);return;}
    const dt=Math.min(delta,50)/1000,k=this.keys;
    // The last pressed direction wins, even when the previous key is still held.
    const pressed=[['left',k.LEFT],['left',k.A],['right',k.RIGHT],['right',k.D],['up',k.UP],['up',k.W],['down',k.DOWN],['down',k.S]].filter(([,key])=>key.isDown).sort((a,b)=>b[1].timeDown-a[1].timeDown);
    const direction=this.touchStick || this.hold || pressed[0]?.[0] || null;
    this.cutting=false;
    this.advanceVehicle(time,dt,direction);
    this.animateVehicle(time,dt);this.updateCombat(Math.min(delta,50));if(this.busy||this.leaving)return;this.checkWorkshop();this.checkArmory();this.checkRepair();this.checkConstruction();
  }
  updateWorkshopService(time,dt,q=this.workshopQuest,deck=null) {
    deck ||= this.buildingDeck(q===this.armoryQuest?'armory':q===this.repairQuest?'repair':'workshop');
    const next=stepWorkshopService(q,{x:this.rig.x,y:this.rig.y,angle:this.rig.angle},dt,this.driveSolids(),deck,q===this.workshopQuest||q===this.armoryQuest);
    this.turnVelocity=wrapDegrees(next.angle-this.rig.angle)/Math.max(dt,.001);
    this.rig.setPosition(next.x,next.y).setAngle(next.angle);this.speed=next.speed;this.moving=next.moving;this.cutting=false;this.drillBar.clear();
    this.world.x=Math.floor(next.x/CELL);this.world.y=Math.floor(next.y/CELL);this.animateVehicle(time,dt);
    if(q.serviceRemaining==null){this.dialogClosed();this.refreshMountedWeapon();this.refreshHUD();this.persist();if(q===this.armoryQuest)this.checkRepair();this.checkConstruction();return;}
    const status=document.querySelector('#quest-status');
    if(status)status.textContent=q.serviceRemaining>0?`Модернизация: ${(q.serviceRemaining/1000).toFixed(1)} с`:'Модернизация завершена · Выезд с площадки';
    if(time-this.lastSave>1000)this.persist();
  }
  drawLiftGlow(time) {
    this.blockGlow.clear();if(this.floorNumber||!this.world.rescued)return;
    const blocks=this.repairQuest?.returnBriefed&&!this.repairQuest.ready?REPAIR_BLOCKS:this.armoryQuest?.returnBriefed&&!this.armoryQuest.ready?ARMORY_BLOCKS:this.workshopQuest?.returnBriefed&&!this.workshopQuest.ready?WORKSHOP_BLOCKS:this.liftReady()?(this.world.porodnikBriefed&&!this.world.porodnikPowered?PORODNIK_BLOCKS:[]):LIFT_BLOCKS;
    const pulse=.35+.15*Math.sin(time*.0035);
    for(const p of blocks)if(this.world.blocked(p.x,p.y)) {
      this.blockGlow.fillStyle(0xffcc6c,pulse*.22);this.blockGlow.fillRoundedRect(p.x*CELL+3,p.y*CELL+3,58,58,8);
      this.blockGlow.lineStyle(3,0xffd078,pulse+.2);this.blockGlow.strokeRoundedRect(p.x*CELL+4,p.y*CELL+4,56,56,8);
    }
  }
  solidCell(x,y) { return (this.floorNumber===4&&!this.constructionQuest.rescued&&x===BUILDER_SITE.x&&y===BUILDER_SITE.y)||(this.floorNumber===3&&!this.repairQuest.rescued&&x===REPAIRMAN_SITE.x&&y===REPAIRMAN_SITE.y)||(this.floorNumber===2&&!this.armoryQuest.rescued&&x===ARMORER_SITE.x&&y===ARMORER_SITE.y)||(this.floorNumber===1&&!this.workshopQuest.mechanic&&x===MECHANIC_SITE.x&&y===MECHANIC_SITE.y)||!this.world.inside(x,y)||this.world.blocked(x,y)||(!this.floorNumber&&x===RESCUE.x&&y===RESCUE.y&&!this.world.rescued); }
  driveSolids() {
    const solid=(x,y)=>this.solidCell(x,y);
    solid.rectangles=[...this.lift.colliders,...(this.floorNumber?[]:[this.buildingGeom('porodnik').collider,this.buildingGeom('workshop').body,this.buildingGeom('armory').body,this.buildingGeom('repair').body,...(this.constructionQuest?.warehouse||this.constructionQuest?.remaining!=null?[warehouseBody(this.constructionQuest)]:[])])];
    return solid;
  }
  advanceVehicle(time,dt,direction) {
    const solid=this.driveSolids();
    const next=driveStep({x:this.rig.x,y:this.rig.y,angle:this.rig.angle,speed:this.speed},direction,dt,solid,280*(1+(this.collectionBuffs?.speed||0)));
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
    const digDirection=typeof direction==='string'?direction:next.cardinal;
    const [dx,dy]={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[digDirection];
    const x=this.world.x+dx,y=this.world.y+dy;
    // Cut only the block directly ahead once the chassis has turned toward it.
    if(Math.abs(wrapDegrees(heading[digDirection]-this.rig.angle))>20||!this.world.inside(x,y))return;
    if(!this.floorNumber&&x===RESCUE.x&&y===RESCUE.y&&!this.world.rescued){this.refreshHUD();return;}
    if(this.world.blocked(x,y)) {
      this.cutting=true;
      const key=y*BASE_SIZE+x;
      const material=this.world.material?.(x,y)||'earth';
      const broken=this.world.drill(x,y,dt*(1+this.workshopQuest.upgrades*.02+(this.collectionBuffs?.drill||0)));
      this.terrain.paintCell(x,y);
      this.drillBar.clear();this.drillBar.fillStyle(0x112d2b,.85);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48,6,3);
      this.drillBar.fillStyle(0xffcd6a);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48*(this.world.damage.get(key)||1),6,3);
      if(broken) {
        this.findArtifactInBrokenBlock();
        const collected=addCargo(this.cargoHold,material,this.cargoCapacity());this.cargo=cargoCount(this.cargoHold);
        this.showCargoPickup(material,middle(x),middle(y),collected);
        this.terrain.refreshAround(x,y);this.drillBar.clear();
        this.dustEmitter.emitParticleAt(middle(x),middle(y),12);
        this.chipEmitter.emitParticleAt(middle(x),middle(y),10);
        this.sparkEmitter.emitParticleAt(middle(x),middle(y),14);
        this.refreshHUD();this.checkLift();this.checkPorodnik();this.persist();
      } else if(time-this.lastSave>300)this.persist();
      return;
    }

  }
  showCargoPickup(material,x,y,collected) {
    this.pickupLabels ||= [];
    // Limit transient labels when several blocks break in quick succession.
    if(this.pickupLabels.length>=6){
      const old=this.pickupLabels.shift();this.tweens.killTweensOf(old);old.destroy();
    }
    const label=this.add.text(x,y-20,collected?'+1 '+materialDefinition(material).name:'Отсек заполнен',{
      fontFamily:'Arial',fontSize:'15px',fontStyle:'bold',color:collected?'#d6f5aa':'#ffcf85',
      stroke:'#102e2b',strokeThickness:4,padding:{x:4,y:2}
    }).setOrigin(.5).setDepth(35);
    this.pickupLabels.push(label);
    this.tweens.add({targets:label,y:y-62,alpha:0,delay:150,duration:1050,ease:'Sine.Out',
      onComplete:()=>{this.pickupLabels=this.pickupLabels.filter(item=>item!==label);label.destroy();}
    });
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


Object.assign(Base.prototype,armoryMethods,repairMethods,combatMethods,cargoMethods,constructionMethods,buildingLayoutMethods,artifactSceneMethods,collectionMethods);
