// Painted vector turret: facing right in drill-local coordinates.
export function drawMountedTurret(scene,root,upgraded=false) {
 const base=scene.add.graphics(),barrel=scene.add.container(0,0),steel=scene.add.graphics(),armor=scene.add.graphics(),flash=scene.add.graphics();
 root.add([base,barrel,armor,flash]);barrel.add(steel);
 const outline=0x172e32,accent=upgraded?0xe4b85c:0xaab9a0;
 base.fillStyle(0x07191e,.5);base.fillEllipse(1,5,46,35);
 base.fillStyle(outline);base.fillCircle(0,2,19);
 base.fillStyle(0x657d77);base.fillCircle(0,0,17);
 base.lineStyle(2,0xb3c1a0);base.strokeCircle(0,0,14);
 base.fillStyle(0x263f42);base.fillCircle(0,0,11);
 // A chunky cannon with a shaded sleeve, cooling rings and a dark muzzle.
 steel.fillStyle(outline);steel.fillRoundedRect(3,-8,37,17,4);
 steel.fillStyle(0x425d63);steel.fillRoundedRect(5,-6,32,12,3);
 steel.fillStyle(0xabc1b6);steel.fillRoundedRect(6,-6,29,3,1);
 steel.fillStyle(0x253e46);steel.fillRect(7,4,31,3);
 for(const x of [17,23,29]){
  steel.fillStyle(outline);steel.fillRoundedRect(x,-8,3,16,1);
  steel.fillStyle(0x78948b);steel.fillRect(x,-6,2,4);
 }
 steel.fillStyle(outline);steel.fillRoundedRect(34,-10,11,20,3);
 steel.fillStyle(0x698079);steel.fillRoundedRect(35,-8,8,16,2);
 steel.fillStyle(0xc0c9a8);steel.fillRect(36,-8,6,3);
 steel.fillStyle(0x102329);steel.fillRoundedRect(41,-5,4,10,1);
 // Layered armour, rounded silhouette, rivets and a small glowing sight.
 armor.fillStyle(outline);armor.fillRoundedRect(-19,-14,34,29,8);
 armor.fillStyle(0x405954);armor.fillRoundedRect(-17,-11,30,25,6);
 armor.fillStyle(0x91a58a);armor.fillRoundedRect(-17,-14,29,20,6);
 armor.fillStyle(0xbdc5a1);armor.fillRoundedRect(-14,-13,23,4,2);
 armor.fillStyle(0x6f866f);armor.fillRoundedRect(-15,-5,27,10,4);
 armor.lineStyle(1,0x425b50);armor.lineBetween(-11,5,7,5);
 armor.fillStyle(0x263d3a);armor.fillRoundedRect(-14,-8,8,12,2);
 armor.lineStyle(1,0xadb59a);for(const y of [-5,-2,1])armor.lineBetween(-12,y,-8,y);
 armor.fillStyle(0xb58645);armor.fillRoundedRect(-2,-8,12,12,3);
 armor.fillStyle(accent);armor.fillRoundedRect(-1,-8,10,8,2);
 armor.fillStyle(outline);armor.fillCircle(4,-4,3);
 armor.fillStyle(0x8ef1c4);armor.fillCircle(4,-5,1.6);
 for(const [x,y] of [[-13,-10],[8,-10],[-13,9],[8,9]]){
  armor.fillStyle(outline);armor.fillCircle(x,y,2.2);
  armor.fillStyle(0xe0d6a5);armor.fillCircle(x-.5,y-.7,1);
 }
 flash.fillStyle(0xffad46);flash.fillTriangle(44,0,58,-9,54,8);
 flash.fillStyle(0xffefb0);flash.fillTriangle(44,0,54,-4,52,4);flash.setVisible(false);
 return {barrel,flash};
}
