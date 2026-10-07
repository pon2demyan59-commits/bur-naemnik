import { liftGeometry } from './lift-state.js';
import { CELL } from './base-state.js';
import { readSettings } from './storage.js';
export class LiftView {
  constructor(scene,center) {
    this.scene=scene;this.x=(center.x+.5)*CELL;this.y=(center.y+.5)*CELL;
    const texture=scene.textures.get('freight-lift'),scale=384/1077;
    const originX=this.x-1077*scale/2,originY=this.y-1063*scale/2;
    const pieces={top:[127,40,1077,280],bottomLeft:[127,885,291,218],bottomRight:[915,885,289,218],ramp:[418,885,497,218],left:[127,320,206,565],right:[998,320,206,565],deck:[333,320,665,565],gate:[334,280,664,32]};
    const image=(key,depth)=>{const [x,y,w,h]=pieces[key];if(!texture.has(key))texture.add(key,0,x,y,w,h);return scene.add.image(originX+(x-127)*scale,originY+(y-40)*scale,'freight-lift',key).setOrigin(0).setScale(scale).setDepth(depth);};
    this.deckX=originX+(333-127)*scale;this.deckY=originY+(320-40)*scale;
    this.deckW=665*scale;this.deckH=565*scale;
    this.colliders=liftGeometry(center).colliders;
    this.shaft=scene.add.rectangle(this.deckX,this.deckY,this.deckW,this.deckH,0x0c1719).setOrigin(0).setDepth(2);
    this.platform=image('deck',2.2);
    // The entry ramp is driveable floor; only the housing covers the drill.
    this.ramp=image('ramp',2.2);this.parts=['top','bottomLeft','bottomRight','left','right'].map(key=>image(key,25));
    this.gates=[-1,1].map(side=>scene.add.image(this.x+side*this.deckW,this.deckY+this.deckH-7,'freight-lift','gate').setDisplaySize(this.deckW/2,12).setDepth(26));
    const gateClip=scene.make.graphics({x:0,y:0,add:false});gateClip.fillRect(this.deckX,this.deckY+this.deckH-15,this.deckW,24);this.gateMask=gateClip.createGeometryMask();this.gates.forEach(g=>g.setMask(this.gateMask));
    const shaftClip=scene.make.graphics({x:0,y:0,add:false});shaftClip.fillRect(this.deckX,this.deckY,this.deckW,this.deckH+2);this.mask=shaftClip.createGeometryMask();
    // Actual amber lamps in the four painted corner housings.
    this.lamps=[[200,140],[1135,140],[200,928],[1135,928]].map(([x,y])=>({x:originX+(x-127)*scale,y:originY+(y-40)*scale}));
    this.elapsed=0;this.ambient=scene.add.graphics().setDepth(26);
    this.indicator=scene.add.circle(this.x+169,this.y+24,4,0x86f672).setDepth(27);
    scene.events.once('shutdown',()=>{this.mask.destroy();this.gateMask.destroy();shaftClip.destroy();gateClip.destroy();});
  }
  contains(rig){return rig.x>this.deckX+21&&rig.x<this.deckX+this.deckW-21&&rig.y>this.deckY+21&&rig.y<this.deckY+this.deckH-21;}
  powered(value){this.ready=value;this.indicator.setFillStyle(value?0x74ee87:0xffad46);this.parts.forEach(p=>p.setDepth(value?25:2.5));}
  update(delta) {
    this.elapsed+=delta;const pulse=.45+.5*(.5+.5*Math.sin(this.elapsed*.0017));this.indicator.setAlpha(this.ready?pulse:1);
    const g=this.ambient;g.clear();g.setDepth(27);
    for(let i=0;i<this.lamps.length;i++) {
      const p=this.lamps[i];
      if(!this.ready){g.fillStyle(0x26312e,.65);g.fillEllipse(p.x,p.y,14,22);continue;}
      // Diagonal pairs breathe alternately, with a bright core and soft amber halo.
      const light=.16+.7*(.5+.5*Math.sin(this.elapsed*.0022+(i===0||i===3?0:Math.PI)));
      g.fillStyle(0x493624,(1-light)*.65);g.fillEllipse(p.x,p.y,13,21);
      g.fillStyle(0xffb43e,light*.18);g.fillCircle(p.x,p.y,18);
      g.fillStyle(0xffc257,light*.65);g.fillEllipse(p.x,p.y,13,21);
      g.fillStyle(0xffedaf,light);g.fillEllipse(p.x,p.y,5,13);
    }
    if(!this.ready)return;
    g.fillStyle(0xffce75,.055+.025*Math.sin(this.elapsed*.0017));g.fillEllipse(this.x,this.deckY+this.deckH-5,this.deckW*.8,22);
  }
  motor(duration=.8) {
    if(!readSettings().sound)return;
    try {
      const audio=new (window.AudioContext||window.webkitAudioContext)(),osc=audio.createOscillator(),gain=audio.createGain(),filter=audio.createBiquadFilter();
      audio.resume().catch(()=>{});osc.type='sawtooth';osc.frequency.setValueAtTime(65,audio.currentTime);osc.frequency.linearRampToValueAtTime(90,audio.currentTime+duration*.6);
      filter.type='lowpass';filter.frequency.value=180;gain.gain.setValueAtTime(.001,audio.currentTime);gain.gain.linearRampToValueAtTime(.025,audio.currentTime+.08);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
      osc.connect(filter);filter.connect(gain);gain.connect(audio.destination);osc.start();osc.stop(audio.currentTime+duration);osc.onended=()=>audio.close().catch(()=>{});
    } catch { /* Mechanical sound is optional when browser audio is unavailable. */ }
  }
  tween(config){return new Promise(resolve=>this.scene.tweens.add({...config,onComplete:resolve}));}
  async depart(rig,shadow,targetFloor) {
    const s=this.scene;this.motor(1.1);s.cameras.main.stopFollow();s.cameras.main.shake(180,.001);rig.setPosition(this.x,this.deckY+this.deckH/2);shadow.setVisible(false);
    await Promise.all(this.gates.map((gate,i)=>this.tween({targets:gate,x:this.x+(i===0?-1:1)*this.deckW/4,duration:330,ease:'Cubic.Out'})));
    rig.setMask(this.mask);this.platform.setMask(this.mask);this.indicator.setFillStyle(0xffcb55);
    const dy=targetFloor===0?-55:55;
    await Promise.all([this.tween({targets:rig,y:rig.y+dy,alpha:.1,scale:.92,duration:850,ease:'Sine.In'}),this.tween({targets:this.platform,y:this.platform.y+dy,alpha:.15,duration:850,ease:'Sine.In'})]);
    await new Promise(resolve=>{s.cameras.main.once('camerafadeoutcomplete',resolve);s.cameras.main.fadeOut(230,8,19,21);});
  }
  async arrive(rig,shadow) {
    this.scene.cameras.main.stopFollow();this.scene.cameras.main.centerOn(this.x,this.deckY+this.deckH/2);
    rig.setPosition(this.x,this.deckY+this.deckH/2+45).setAlpha(.15).setScale(.92).setMask(this.mask);shadow.setVisible(false);
    const y=this.platform.y;this.platform.setY(y+45).setAlpha(.15).setMask(this.mask);
    this.gates.forEach((g,i)=>g.x=this.x+(i===0?-1:1)*this.deckW/4);
    await Promise.all([this.tween({targets:rig,y:this.deckY+this.deckH/2,alpha:1,scale:1,duration:650,ease:'Sine.Out'}),this.tween({targets:this.platform,y,alpha:1,duration:650,ease:'Sine.Out'})]);
    await Promise.all(this.gates.map((gate,i)=>this.tween({targets:gate,x:this.x+(i===0?-1:1)*this.deckW,duration:330,ease:'Cubic.Out'})));
    rig.clearMask();this.platform.clearMask();shadow.setVisible(true);this.powered(true);this.scene.cameras.main.startFollow(rig,true,.10,.10);
  }
}
