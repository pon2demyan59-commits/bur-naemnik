import { WORKSHOP_BODY, WORKSHOP_DECK } from './workshop-state.js';
export class WorkshopView {
 constructor(scene,{body=WORKSHOP_BODY,deck=WORKSHOP_DECK,key='workshop',sign=null}={}) {
  this.scene=scene;this.elapsed=0;this.body=body;this.deck=deck;
  const b=body,d=deck,texture=scene.textures.get(key);
  // Frames follow the roof and narrower attached bay in the painted sprite.
  if(!texture.has('roof')) {
   texture.add('roof',0,0,0,640,292);
   texture.add('bay',0,90,292,460,640-292);
  }
  this.roof=scene.add.image(b.x,b.y,key,'roof').setOrigin(0).setDisplaySize(b.width,b.height).setDepth(2.4);
  this.bay=scene.add.image(d.x,d.y,key,'bay').setOrigin(0).setDisplaySize(d.width,d.height).setDepth(2.3);
  this.effects=scene.add.graphics().setDepth(5);
  if(sign)this.makeFacadeSign(sign);
  this.powered(false);
 }
 makeFacadeSign(label){
  const scene=this.scene,b=this.body;
  // Mounted on the front lintel, above its recessed entrance light.
  this.sign=scene.add.container(b.x+b.width*.50,b.y+b.height*.795).setDepth(2.5);
  const plate=scene.add.graphics();
  plate.fillStyle(0x101b1a,.65);plate.fillRoundedRect(-55,-8,112,22,2);
  plate.fillStyle(0x253e3b);plate.fillRoundedRect(-56,-11,112,22,2);
  plate.lineStyle(1.5,0x65786b);plate.strokeRoundedRect(-55,-10,110,20,2);
  plate.lineStyle(1,0x8c9980,.7);plate.lineBetween(-53,-9,53,-9);
  plate.lineStyle(1,0x101f20,.9);plate.lineBetween(-53,9,53,9);
  const letters=scene.add.text(0,-.5,label,{fontFamily:'Arial',fontSize:'10px',fontStyle:'bold',color:'#c9c6a2',stroke:'#182c2a',strokeThickness:.5}).setOrigin(.5);
  if(letters.width>94)letters.setScale(94/letters.width,1);
  const wear=scene.add.graphics();
  for(const x of [-51,51])for(const y of [-6,6]){
   wear.fillStyle(0x142827);wear.fillCircle(x,y,1.9);
   wear.fillStyle(0x9b9d7d);wear.fillCircle(x-.3,y-.4,1.1);
   wear.lineStyle(.6,0x3c4d45);wear.lineBetween(x-.6,y-.6,x+.5,y+.4);
  }
  wear.lineStyle(.7,0x9f8b61,.65);wear.lineBetween(-47,8,-39,8);wear.lineBetween(32,-8,40,-8);
  wear.lineStyle(.7,0x233c36,.6);wear.lineBetween(-27,-2,-22,-3);wear.lineBetween(13,3,18,2);
  this.sign.add([plate,letters,wear]);
 }
 powered(ready) {
  this.ready=ready;this.roof.setTint(ready?0xffffff:0x788589);this.bay.setTint(ready?0xffffff:0x788589);
  this.sign?.setAlpha(ready?1:.65);
  this.effects.clear();this.roof.setPosition(this.body.x,this.body.y);
 }
 update(delta,intensive=false) {
  const g=this.effects;g.clear();if(!this.ready)return;
  this.elapsed+=delta;
  const t=this.elapsed/1000,b=this.body,d=this.deck;
  // Warm light breathes behind the entrance; the green control lamp pulses.
  g.fillStyle(0xffba50,(intensive ? .22:.045)+(intensive ? .1:.018)*Math.sin(t*(intensive?8:3)));g.fillEllipse(d.x+d.width/2,d.y+13,110,30);
  g.fillStyle(0x75ff82,.65+.25*Math.sin(t*4));g.fillCircle(b.x+b.width*.91,b.y+b.height*.806,3);
  // Subtle rotating roof ventilator.
  const fx=b.x+b.width*.218,fy=b.y+b.height*.455;
  for(let i=0;i<6;i++) {
   const a=t*(intensive?7:2)+i*Math.PI/3;g.lineStyle(1.4,0xaeb7a6,.55);
   g.lineBetween(fx+Math.cos(a)*2,fy+Math.sin(a)*2,fx+Math.cos(a+.18)*10,fy+Math.sin(a+.18)*10);
  }
  // Small welding heads move along both rails, taking turns to work.
  for(let side=0;side<2;side++) {
   const x=d.x+(side?d.width-20:20),y=d.y+38+Math.sin(t*(intensive?3.5:1.7)+side*Math.PI)*(intensive?22:14);
   g.lineStyle(3,0x26383a);g.lineBetween(x+(side?9:-9),y-15,x,y);
   g.fillStyle(0xc18b3d);g.fillCircle(x,y,3);
   const period=intensive ? .85:2.4,burst=intensive ? .6:.48;
   const phase=(t+side*.75)%period;
   if(phase<burst) {
    g.fillStyle(0xb7f7ff,.5);g.fillCircle(x,y,5+Math.sin(t*65)*2);
    g.fillStyle(0xffffff,.9);g.fillCircle(x,y,1.8);
    for(let i=0;i<(intensive?14:8);i++) {
     const age=(phase+i*.057)%burst,a=i*2.399+side*Math.PI;
     const sx=x+Math.cos(a)*age*45,sy=y+Math.sin(a)*age*28+age*age*28;
     g.lineStyle(1,0xffc362,1-age/burst);g.lineBetween(sx,sy,sx+Math.cos(a)*3,sy+Math.sin(a)*2);
    }
   }
  }
  // Exhaust puffs drift and fade instead of accumulating game objects.
  for(let i=0;i<3;i++) {
   const age=(t*(intensive?1.5:.35)+i/3)%1;
   g.fillStyle(0xa9bab0,(1-age)*(intensive ? .25:.13));g.fillEllipse(b.x+b.width*.83+Math.sin(age*4+i)*4,b.y+9-age*22,8+age*13,6+age*11);
  }
 }
}
