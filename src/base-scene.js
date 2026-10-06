import { BaseWorld, BASE_SIZE, CELL, RESCUE } from './base-state.js';
import { writeSave } from './storage.js';
const middle = n => n * CELL + CELL / 2;
export class Base extends globalThis.Phaser.Scene {
  constructor() { super('Base'); }
  init({save} = {}) { this.world = new BaseWorld(save?.progress); this.moving=false; this.hold=null; this.lastSave=0; this.dustTime=0; }
  create() {
    this.makeTextures();
    this.makeMap();
    this.makeHUD();
    this.drillSprite = this.add.image(middle(this.world.x),middle(this.world.y),'drill').setDisplaySize(96,96).setDepth(20);
    this.drillSprite.setAngle(0);
    this.shadow = this.add.ellipse(this.drillSprite.x,this.drillSprite.y+22,78,38,0x071919,.45).setDepth(19);
    this.cameras.main.setBounds(0,0,BASE_SIZE*CELL,BASE_SIZE*CELL).startFollow(this.drillSprite,true,.12,.12);
    this.cameras.main.setZoom(this.scale.width < 600 ? .82 : 1.12);
    this.keys=this.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC');
    this.input.keyboard.addCapture(['UP','DOWN','LEFT','RIGHT','SPACE']);
    this.input.keyboard.on('keydown-ESC',this.goMenu,this);
    this.input.keyboard.on('keydown-E',this.rescue,this);
    this.input.keyboard.on('keydown-SPACE',this.rescue,this);
    this.clearInput = () => { this.hold=null; this.input.keyboard.resetKeys(); this.persist(); };
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
    if(this.textures.exists('base-floor')) return;
    const g=this.make.graphics({x:0,y:0,add:false});
    g.fillStyle(0x3f5958);g.fillRect(0,0,CELL,CELL);
    g.fillStyle(0x496360);g.fillRoundedRect(2,2,CELL-4,CELL-4,7);
    g.lineStyle(1,0x78918b,.28);g.strokeRoundedRect(3,3,CELL-6,CELL-6,6);
    g.lineStyle(2,0x273f3d,.55);g.lineBetween(8,48,21,48);g.lineBetween(21,48,25,52);
    g.generateTexture('base-floor',CELL,CELL);g.clear();
    for(let variant=0;variant<4;variant++) {
      const colors=[0x9c8665,0xa38e6e,0x968167,0xb09772];
      g.fillStyle(0x0e2826,.4);g.fillEllipse(32,48,60,28);
      g.fillStyle(0x6f5a45);g.fillRoundedRect(3,12,58,46,11);
      g.fillStyle(colors[variant]);g.fillRoundedRect(4,6,54,43,12);
      g.fillStyle(0xc6b28c,.7);g.fillTriangle(7,14,29,7,14,32);
      g.fillStyle(0x786b56);g.fillTriangle(38,12,57,22,51,45);
      g.fillStyle(0xbfaa84);g.fillRoundedRect(22,20,25,29,8);
      g.lineStyle(2,0x62523f);g.lineBetween(29,10,34,22);g.lineBetween(34,22,27,31);
      g.generateTexture('rubble-'+variant,CELL,CELL);g.clear();
    }
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
    this.add.tileSprite(0,0,BASE_SIZE*CELL,BASE_SIZE*CELL,'base-floor').setOrigin(0).setDepth(0);
    const border=this.add.graphics().setDepth(1);
    border.fillStyle(0x203b3c);border.fillRect(0,0,3200,128);border.fillRect(0,3072,3200,128);border.fillRect(0,0,128,3200);border.fillRect(3072,0,128,3200);
    border.lineStyle(8,0x809187);border.strokeRect(128,128,2944,2944);
    this.blocks=new Map();
    for(let y=2;y<48;y++)for(let x=2;x<48;x++) if(this.world.blocked(x,y)) {
      const block=this.add.image(middle(x),middle(y),'rubble-'+((x+y)%4)).setDepth(3);
      this.blocks.set(y*50+x,block);
      if(this.world.damage.has(y*50+x)) block.setTint(0xd2aa6b);
    }
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
      button.addEventListener('pointerdown',event=> { event.preventDefault();button.setPointerCapture(event.pointerId);this.hold=button.dataset.dir; });
      const stop=()=>{this.hold=null;};
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
    const saved=writeSave(this.world.snapshot());
    const status=document.querySelector('#base-save');if(status)status.textContent=saved?'Прогресс сохранён':'Сохранение недоступно в этом браузере';
    this.lastSave=this.time.now;
  }
  goMenu() { if(document.querySelector('#dialog').open) return; this.persist();this.scene.start('Menu'); }
  rescue() {
    if(this.moving || !this.world.canRescue() || document.querySelector('#dialog').open)return;
    this.world.rescued=true;this.world.heard=true;this.refreshHUD();this.persist();
    const d=document.querySelector('#dialog');document.querySelector('#dialog-title').textContent='СЕРЁГА Т СПАСЁН';
    const p=document.createElement('p');p.textContent='«Спасибо, командир. Серёга Т, строитель. Ещё немного — и стал бы частью фундамента. Давай вернём этой площадке жизнь. Первым делом расчистим лифт».\n\nПервое задание выполнено. Продолжение истории появится в следующем обновлении.';
    document.querySelector('#dialog-body').replaceChildren(p);d.showModal();
  }
  update(time,delta) {
    if(!this.keys || document.querySelector('#dialog').open || document.hidden) return;
    const dt=Math.min(delta,50);
    this.shadow.setPosition(this.drillSprite.x,this.drillSprite.y+22);
    if(this.moving)return;
    const k=this.keys;
    const direction=this.hold || (k.LEFT.isDown||k.A.isDown?'left':k.RIGHT.isDown||k.D.isDown?'right':k.UP.isDown||k.W.isDown?'up':k.DOWN.isDown||k.S.isDown?'down':null);
    if(!direction) { this.drillBar.clear();this.drillSprite.setPosition(middle(this.world.x),middle(this.world.y));return; }
    if(!this.world.heard){this.world.heard=true;this.refreshHUD();this.persist();}
    const [dx,dy,angle]={left:[-1,0,180],right:[1,0,0],up:[0,-1,-90],down:[0,1,90]}[direction];
    this.drillSprite.setAngle(angle);
    const x=this.world.x+dx,y=this.world.y+dy;
    if(!this.world.inside(x,y))return;
    if(x===RESCUE.x&&y===RESCUE.y&&!this.world.rescued){this.refreshHUD();return;}
    if(this.world.blocked(x,y)) {
      const key=y*BASE_SIZE+x;
      this.drillSprite.setPosition(middle(this.world.x)+Math.sin(time*.08)*1.5,middle(this.world.y));
      const broken=this.world.drill(x,y,dt/1000);
      const block=this.blocks.get(key);if(block)block.setTint(0xdcc28a);
      this.drillBar.clear();this.drillBar.fillStyle(0x112d2b,.85);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48,6,3);
      this.drillBar.fillStyle(0xffcd6a);this.drillBar.fillRoundedRect(middle(x)-24,middle(y)-29,48*(this.world.damage.get(key)||1),6,3);
      if(time-this.dustTime>90){this.dustTime=time;this.spawnDust(middle(x),middle(y));}
      if(broken){block?.destroy();this.blocks.delete(key);this.drillBar.clear();this.refreshHUD();this.persist();}
      else if(time-this.lastSave>300)this.persist();
      return;
    }
    this.drillBar.clear();this.moving=true;
    this.tweens.add({targets:this.drillSprite,x:middle(x),y:middle(y),duration:230,onComplete:()=>{
      this.world.x=x;this.world.y=y;this.moving=false;this.refreshHUD();this.persist();
    }});
  }
  spawnDust(x,y) {
    for(let i=0;i<3;i++) {
      const p=this.add.image(x,y,'dust').setDepth(25).setScale(.5+Math.random()*.4).setAlpha(.6);
      this.tweens.add({targets:p,x:x+(Math.random()-.5)*40,y:y-15-Math.random()*20,alpha:0,scale:1.3,duration:450,onComplete:()=>p.destroy()});
    }
  }
}
