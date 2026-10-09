// Compact roof-mounted cannon, facing right in drill-local coordinates.
import { weaponVisual } from './weapon-catalog.js';
export function drawMountedTurret(scene,root,upgraded=false,weapon='basic') {
 const visual=weaponVisual(weapon);
 if(scene.textures?.exists(visual.texture)){
  const base=scene.add.graphics(),barrel=scene.add.container(0,0),flash=scene.add.graphics();
  base.fillStyle(0x07191e,.45);base.fillEllipse(0,2,24,18);
  base.fillStyle(0x203c3b);base.fillCircle(0,0,10);
  base.lineStyle(1,upgraded?0xe4b85c:0x8aa998);base.strokeCircle(0,0,9);
  const image=scene.add.image(0,0,visual.texture).setOrigin(visual.originX,visual.originY).setDisplaySize(visual.width,visual.height);
  barrel.add(image);root.add([base,barrel,flash]);
  const muzzle=visual.width*(visual.muzzleX-visual.originX),muzzleY=visual.height*(visual.muzzleY-visual.originY),color={flame:0xff9950,electric:0x7cdaff,acid:0x8fe67a,plasma:0xc0a1ff,rail:0x9aeaff}[weapon]||0xffad46;
  flash.fillStyle(color);flash.fillTriangle(muzzle,muzzleY,muzzle+10,muzzleY-4,muzzle+10,muzzleY+4);
  flash.fillStyle(0xffefdb);flash.fillTriangle(muzzle,muzzleY,muzzle+7,muzzleY-2,muzzle+7,muzzleY+2);flash.setVisible(false);
  return {barrel,flash,image};
 }
 const base=scene.add.graphics(),barrel=scene.add.container(0,0),steel=scene.add.graphics(),armor=scene.add.graphics(),flash=scene.add.graphics();
 root.add([base,barrel,armor,flash]);barrel.add(steel);
 const outline=0x172e32,accent=upgraded?0xe4b85c:0xdb9149;
 base.fillStyle(0x07191e,.4);base.fillEllipse(0,3,25,19);
 base.fillStyle(outline);base.fillCircle(0,1,11);
 base.fillStyle(0x627c76);base.fillCircle(0,0,9);
 base.lineStyle(1,0xa8b8a2);base.strokeCircle(0,0,7);
 // Short tapered barrel with a single cooling sleeve and bevelled muzzle.
 steel.fillStyle(outline);steel.fillRoundedRect(4,-4,21,8,2);
 steel.fillStyle(0x597980);steel.fillRect(6,-2,17,4);
 steel.fillStyle(0xc0cfbb);steel.fillRect(7,-3,15,1);
 steel.fillStyle(outline);steel.fillRoundedRect(12,-5,4,10,1);
 steel.fillStyle(0x92a89c);steel.fillRect(13,-3,2,3);
 steel.fillStyle(outline);steel.fillRoundedRect(22,-5,6,10,2);
 steel.fillStyle(0x879b91);steel.fillRect(23,-3,3,6);
 steel.fillStyle(0x0d252b);steel.fillRect(26,-2,2,4);
 if(['machinegun','shotgun'].includes(weapon)){
  for(const y of [-7,5]){steel.fillStyle(outline);steel.fillRoundedRect(9,y,19,3,1);steel.fillStyle(0x93a69c);steel.fillRect(11,y,14,1);}
 }
 if(['heavy','rocket','rail','plasma'].includes(weapon)){
  steel.fillStyle(outline);steel.fillRoundedRect(10,-6,25,12,2);steel.fillStyle(0x729088);steel.fillRect(12,-4,21,8);steel.fillStyle(0x162f34);steel.fillRect(32,-4,3,8);
 }
 if(['flame','electric','acid','plasma'].includes(weapon)){
  const glow={flame:0xff9950,electric:0x7cdaff,acid:0x8fe67a,plasma:0xc0a1ff}[weapon];steel.fillStyle(glow);steel.fillRect(14,-3,14,2);steel.fillRect(14,2,14,1);
 }
 // Low, rounded housing leaves the drill cabin and tracks visible.
 armor.fillStyle(outline);armor.fillRoundedRect(-11,-9,23,18,5);
 armor.fillStyle(0x3e6664);armor.fillRoundedRect(-9,-7,19,14,4);
 armor.fillStyle(0x7a9b87);armor.fillRoundedRect(-9,-7,19,8,4);
 armor.fillStyle(0xc1c9a7);armor.fillRoundedRect(-7,-7,14,2,1);
 armor.fillStyle(accent);armor.fillRoundedRect(-4,-4,8,8,2);
 armor.fillStyle(outline);armor.fillCircle(0,0,2.5);
 armor.fillStyle(0x8ef1c4);armor.fillCircle(0,-.5,1.2);
 armor.fillStyle(0x263f43);armor.fillRoundedRect(-8,2,5,3,1);
 for(const [x,y] of [[-7,-4],[7,-4],[-7,5],[7,5]]){
  armor.fillStyle(outline);armor.fillCircle(x,y,1.4);
  armor.fillStyle(0xe0d6a5);armor.fillCircle(x-.3,y-.4,.6);
 }
 flash.fillStyle(0xffad46);flash.fillTriangle(28,0,38,-5,35,5);
 flash.fillStyle(0xffefb0);flash.fillTriangle(28,0,35,-2,34,2);flash.setVisible(false);
 return {barrel,flash};
}
