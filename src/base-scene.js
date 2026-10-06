import { WorldTerrain } from './terrain.js';
import { BaseWorld, BASE_SIZE, CELL, RESCUE } from './base-state.js';
import { writeSave } from './storage.js';
import { driveStep, driveFits } from './drive-controller.js';
import { wrapDegrees, updateHeat } from './drill-motion.js';
const middle = n => n * CELL + CELL / 2;
const heading = {left:180,right:0,up:-90,down:90};
export class Base extends globalThis.Phaser.Scene {
  constructor() { super('Base'); }
  init({save} = {}) { this.world = new BaseWorld(save?.progress); this.parked=save?.progress?.drive; this.touchDirections=new Map(); this.moving=false; this.hold=null; this.lastSave=0; this.dustTime=0; this.trackDustTime=0; this.sparkTime=0; this.speed=0; this.heat=0; this.beltPhases=[0,0];this.turnVelocity=0; this.cutting=false; }
  create() {
    this.makeTextures();
    this.makeMap();
    this.makeHUD();
    this.rig = this.add.container(middle(this.world.x),middle(this.world.y)).setDepth(20);
    const parked=this.parked;
    if(parked&&[parked.x,parked.y,parked.angle].every(Number.isFinite)&&Math.floor(parked.x/CELL)===this.world.x&&Math.floor(parked.y/CELL)===this.world.y&&driveFits(parked.x,parked.y,(x,y)=>this.solidCell(x,y))) {
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
    this.input.keyboard.on('keydown-E',this.rescue,this);
    this.input.keyboard.on('keydown-SPACE',this.rescue,this);
    this.clearInput = () => { this.hold=null; this.touchDirections.clear(); this.speed=0; this.input.keyboard.resetKeys(); this.persist(); };
    window.addEventListener('blur',this.clearInput);
    document.addEventListener('visibilitychange',this.clearInput);
    this.fit = size => { this.cameras.main.setSize(size.width,size.height); this.cameras.main.setZoom(size.width < 600 ? .82 : 1.12); };
    this.scale.on('resize',this.fit);
    this.events.once('shutdown',()=>{
      this.persist(); this.hold=null;
      window.removeEventListener('blur',this.clearInput); document.removeEventListener('visibilitychange',this.clearInput);
      this.scale.off('resize',this.fit);
      this.input.keyboard.removeCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    });
    this.refreshHUD(); this.persist();
    this.cameras.main.fadeIn(300,12,26,27);
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
    g.generateTexture('serega',32,40);g.destroy();
  }
  makeMap() {
    const floor=this.add.tileSprite(0,0,BASE_SIZE*CELL,BASE_SIZE*CELL,'bunker-floor').setOrigin(0).setDepth(0);
    const source=this.textures.get('bunker-floor').getSourceImage();floor.setTileScale(256/source.width,256/source.height);
    const border=this.add.graphics().setDepth(1);
    border.fillStyle(0x203b3c);border.fillRect(0,0,3200,128);border.fillRect(0,3072,3200,128);border.fillRect(0,0,128,3200);border.fillRect(3072,0,128,3200);
    border.lineStyle(8,0x809187);border.strokeRect(128,128,2944,2944);
    this.terrain=new WorldTerrain(this,this.world);
    const bx=middle(25),by=middle(8),vault=this.add.graphics().setDepth(2);
    vault.fillStyle(0x162f30,.6);vault.fillRoundedRect(bx-265,by-110,530,230,24);
    vault.fillStyle(0x396b69);vault.fillRoundedRect(bx-245,by-115,490,200,24);
    vault.lineStyle(12,0xc79049);vault.strokeCircle(bx,by-15,84);
    vault.fillStyle(0x254e50);vault.fillCircle(bx,by-15,74);
    vault.lineStyle(4,0x8ba399);vault.strokeCircle(bx,by-15,63);
    this.add.text(bx,by-15,'72',{fontFamily:'Arial',fontSize:'56px',fontStyle:'bold',color:'#edc777'}).setOrigin(.5).setDepth(3);
    this.add.text(bx,by-145,'БУНКЕР №72',{fontFamily:'Arial',fontSize:'24px',fontStyle:'bold',color:'#e2d0a2'}).setOrigin(.5).setDepth(3);
    for(const x of [bx-202,bx+202]) { this.add.circle(x,by-35,15,0xf5b759).setDepth(4);this.add.circle(x,by-35,32,0xffd37c,.12).setDepth(4); }
    this.add.text(middle(33),middle(21),'ЛИФТ\nПОД ЗАВАЛОМ',{fontFamily:'Arial',fontSize:'16px',align:'center',color:'#d2c7a3',backgroundColor:'#254d4b',padding:{x:10,y:7}}).setOrigin(.5).setDepth(5);
    this.add.text(middle(18),middle(32),'ПОРОДНИК\nНЕ ЗАПУЩЕН',{fontFamily:'Arial',fontSize:'16px',align:'center',color:'#d2c7a3',backgroundColor:'#254d4b',padding:{x:10,y:7}}).setOrigin(.5).setDepth(5);
    this.person=this.add.image(middle(RESCUE.x),middle(RESCUE.y),'serega').setDepth(10);
    this.marker=this.add.text(this.person.x,this.person.y-44,'! СЕРЁГА Т',{fontFamily:'Arial',fontSize:'16px',fontStyle:'bold',color:'#163d3b',backgroundColor:'#ffd372',padding:{x:9,y:5}}).setOrigin(.5).setDepth(11);
    this.tweens.add({targets:this.marker,y:this.marker.y-6,duration:800,yoyo:true,repeat:-1});
    this.drillBar=this.add.graphics().setDepth(30);
  }
  makeHUD() {
    const ui=document.querySelector('#ui');ui.replaceChildren();ui.dataset.screen='base';
    const hud=document.createElement('section');hud.className='base-hud';hud.innerHTML=`
      <header class="base-top"><div class="base-location">БУНКЕР №72 <span>База · 50 × 50</span></div><button class="hud-button" id="base-menu">☰ МЕНЮ</button></header>
      <aside class="radio-card"><div class="radio-title"><span class="radio-led"></span> РАЦИЯ · БАЗА</div><strong id="quest-name"></strong><p id="radio-text"></p><div class="quest-track" id="quest-status"></div></aside>
      <footer class="base-bottom"><div class="base-tip">WASD / стрелки — движение и бурение<br>E / пробел — спасти человека рядом</div><div id="base-save" role="status"></div><button class="hud-button rescue-button" id="rescue-action">СПАСТИ СЕРЁГУ</button></footer>
      <div class="touch-pad" aria-label="Управление буром"><button data-dir="up" aria-label="Вверх">▲</button><button data-dir="left" aria-label="Влево">◀</button><button data-dir="down" aria-label="Вниз">▼</button><button data-dir="right" aria-label="Вправо">▶</button></div>`;
    ui.append(hud);
    hud.querySelector('#base-menu').addEventListener('click',()=>this.goMenu());
    hud.querySelector('#rescue-action').addEventListener('click',()=>this.rescue());
    for(const button of hud.querySelectorAll('[data-dir]')) {
      button.addEventListener('pointerdown',event=> { event.preventDefault();button.setPointerCapture(event.pointerId);this.touchDirections.delete(event.pointerId);this.touchDirections.set(event.pointerId,button.dataset.dir);this.hold=button.dataset.dir; });
      const stop=event=>{this.touchDirections.delete(event.pointerId);this.hold=[...this.touchDirections.values()].at(-1)||null;};
      button.addEventListener('pointerup',stop);button.addEventListener('pointercancel',stop);button.addEventListener('lostpointercapture',stop);
    }
  }
  refreshHUD() {
    const w=this.world;
    document.querySelector('#quest-name').textContent=w.rescued?'Голос за завалом — выполнено':'Голос за завалом';
    document.querySelector('#radio-text').textContent=w.rescued?'Серёга Т: «Живой! Строитель я. С лифта начнём — только сначала передохнём».':w.heard?'Серёга Т: «Эй, в железяке! Я за завалом справа. Разгреби проход и подъедь — помогу с базой».':'Ты очнулся один. Бур завёлся. Двинься с места — рация ещё подаёт признаки жизни.';
    document.querySelector('#quest-status').textContent=w.rescued?'✓ Строитель спасён · Следующее задание: «Расчистить лифт»':`Расчищено: ${w.cleared.size} · Доберись до отметки справа`;
    const action=document.querySelector('#rescue-action');action.disabled=!w.canRescue();action.hidden=w.rescued;
    this.marker.setText(w.rescued?'✓ СЕРЁГА Т':'! СЕРЁГА Т');this.marker.setBackgroundColor(w.rescued?'#86c3a6':'#ffd372');
  }
  persist() {
    const saved=writeSave({...this.world.snapshot(),drive:{x:this.rig.x,y:this.rig.y,angle:this.rig.angle}});
    const status=document.querySelector('#base-save');if(status)status.textContent=saved?'Прогресс сохранён':'Сохранение недоступно в этом браузере';
    this.lastSave=this.time.now;
  }
  goMenu() { if(document.querySelector('#dialog').open) return; this.persist();this.scene.start('Menu'); }
  rescue() {
    if(!this.world.canRescue() || document.querySelector('#dialog').open)return;
    this.world.rescued=true;this.world.heard=true;this.refreshHUD();this.persist();
    const d=document.querySelector('#dialog');document.querySelector('#dialog-title').textContent='СЕРЁГА Т СПАСЁН';
    const p=document.createElement('p');p.textContent='«Спасибо, командир. Серёга Т, строитель. Ещё немного — и стал бы частью фундамента. Давай вернём этой площадке жизнь. Первым делом расчистим лифт».\n\nПервое задание выполнено. Продолжение истории появится в следующем обновлении.';
    document.querySelector('#dialog-body').replaceChildren(p);d.showModal();
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
    if(!this.keys || document.querySelector('#dialog').open || document.hidden)return;
    const dt=Math.min(delta,50)/1000,k=this.keys;
    // The last pressed direction wins, even when the previous key is still held.
    const pressed=[['left',k.LEFT],['left',k.A],['right',k.RIGHT],['right',k.D],['up',k.UP],['up',k.W],['down',k.DOWN],['down',k.S]].filter(([,key])=>key.isDown).sort((a,b)=>b[1].timeDown-a[1].timeDown);
    const direction=this.hold || pressed[0]?.[0] || null;
    this.cutting=false;
    this.advanceVehicle(time,dt,direction);
    this.animateVehicle(time,dt);
  }
  solidCell(x,y) { return !this.world.inside(x,y)||this.world.blocked(x,y)||(x===RESCUE.x&&y===RESCUE.y&&!this.world.rescued); }
  advanceVehicle(time,dt,direction) {
    const solid=(x,y)=>this.solidCell(x,y);
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
    if(!this.world.heard){this.world.heard=true;this.refreshHUD();this.persist();}
    const [dx,dy]={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[direction];
    const x=this.world.x+dx,y=this.world.y+dy;
    // Cut only the block directly ahead once the chassis has turned toward it.
    if(Math.abs(wrapDegrees(heading[direction]-this.rig.angle))>20||!this.world.inside(x,y))return;
    if(x===RESCUE.x&&y===RESCUE.y&&!this.world.rescued){this.refreshHUD();return;}
    if(this.world.blocked(x,y)) {
      this.cutting=true;
      const key=y*BASE_SIZE+x;
      const broken=this.world.drill(x,y,dt);
      this.terrain.paintCell(x,y);
      this.drillBar.clear();this.drillBar.fillStyle(0x112d2b,.85);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48,6,3);
      this.drillBar.fillStyle(0xffcd6a);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48*(this.world.damage.get(key)||1),6,3);
      if(broken) {
        this.terrain.refreshAround(x,y);this.drillBar.clear();
        this.dustEmitter.emitParticleAt(middle(x),middle(y),12);
        this.chipEmitter.emitParticleAt(middle(x),middle(y),10);
        this.sparkEmitter.emitParticleAt(middle(x),middle(y),14);
        this.refreshHUD();this.persist();
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
