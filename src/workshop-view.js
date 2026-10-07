import { WORKSHOP_BODY, WORKSHOP_DECK } from './workshop-state.js';
export class WorkshopView {
 constructor(scene) {
  this.scene=scene;this.art=scene.add.graphics().setDepth(2.4);
  const b=WORKSHOP_BODY;
  this.label=scene.add.text(b.x+b.width/2,b.y+35,'МАСТЕРСКАЯ',{fontFamily:'Arial',fontStyle:'bold',fontSize:'18px',color:'#e5d0a0',backgroundColor:'#283c3d',padding:{x:9,y:6}}).setOrigin(.5).setDepth(5);
  this.led=scene.add.circle(b.x+b.width-26,b.y+145,5,0xffac46).setDepth(5);
  this.powered(false);
 }
 powered(ready) {
  const g=this.art,b=WORKSHOP_BODY,d=WORKSHOP_DECK;g.clear();
  g.fillStyle(0x142123,.8);g.fillRoundedRect(b.x+5,b.y+6,b.width,b.height,10);
  g.fillStyle(ready?0x526567:0x3c4746);g.fillRoundedRect(b.x,b.y,b.width,b.height,10);
  g.lineStyle(4,0x243537);g.strokeRoundedRect(b.x+3,b.y+3,b.width-6,b.height-6,8);
  g.fillStyle(ready?0xaf7739:0x6d6247);g.fillRoundedRect(b.x+14,b.y+12,b.width-28,63,5);
  for(let x=b.x+25;x<b.x+b.width-10;x+=45){g.fillStyle(0xc8ba91);g.fillCircle(x,b.y+17,2);g.fillCircle(x,b.y+68,2);}
  for(let i=0;i<4;i++){g.fillStyle(0x1b2d30);g.fillRect(b.x+27+i*16,b.y+105,8,46);}
  g.fillStyle(0x1a2c2e);g.fillRoundedRect(b.x+144,b.y+93,95,65,4);
  g.lineStyle(3,ready?0xccae67:0x766d53);g.strokeRect(b.x+144,b.y+93,95,65);
  // A visible wrench on the roof identifies the service bay without a menu marker.
  g.lineStyle(7,0xd8cba7);g.lineBetween(b.x+166,b.y+140,b.x+206,b.y+111);
  g.fillStyle(0xd8cba7);g.fillCircle(b.x+166,b.y+140,7);g.lineStyle(5,0xd8cba7);g.strokeCircle(b.x+207,b.y+110,10);
  g.fillStyle(0x202f31);g.fillRect(d.x,d.y,d.width,d.height);
  g.lineStyle(2,0x6d8080);for(let y=d.y+8;y<d.y+d.height;y+=12)g.lineBetween(d.x+12,y,d.x+d.width-12,y);
  for(let y=d.y;y<d.y+d.height;y+=20){g.fillStyle(ready?0xe3af4b:0x8b784f);g.fillRect(d.x,y,9,12);g.fillRect(d.x+d.width-9,y,9,12);}
  g.fillStyle(ready?0xe7bb66:0x83744d);g.fillTriangle(d.x+d.width/2,d.y+21,d.x+d.width/2-13,d.y+39,d.x+d.width/2+13,d.y+39);
  this.led.setFillStyle(ready?0x77ee8d:0xffac46);
 }
}
