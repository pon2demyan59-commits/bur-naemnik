import { WORKSHOP_BODY, WORKSHOP_DECK } from './workshop-state.js';
export class WorkshopView {
 constructor(scene,{body=WORKSHOP_BODY,deck=WORKSHOP_DECK,key='workshop'}={}) {
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
  this.powered(false);
 }
 powered(ready) {
  this.ready=ready;this.roof.setTint(ready?0xffffff:0x788589);this.bay.setTint(ready?0xffffff:0x788589);
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
