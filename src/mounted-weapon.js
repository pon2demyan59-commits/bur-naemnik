// Compact roof-mounted cannon, facing right in drill-local coordinates.
export function drawMountedTurret(scene,root,upgraded=false) {
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
