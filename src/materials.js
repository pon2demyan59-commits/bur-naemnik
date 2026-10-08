import { drillMaterialHardness, materialUpgradeTarget } from './drill-balance.js';
// Sprite-sheet slots match docs/canon-miro.txt. Asterion is not a mined block.
export const MATERIALS=[
 {id:'earth',name:'Земля',frames:[0,13],canonicalHardness:drillMaterialHardness('earth'),upgradeTarget:materialUpgradeTarget('earth')},
 {id:'stone',name:'Камень',frames:[1,14],canonicalHardness:drillMaterialHardness('stone'),upgradeTarget:materialUpgradeTarget('stone')},
 {id:'iron',name:'Железная руда',frames:[2,15],canonicalHardness:drillMaterialHardness('iron'),upgradeTarget:materialUpgradeTarget('iron')},
 {id:'copper',name:'Медная руда',frames:[3],canonicalHardness:drillMaterialHardness('copper'),upgradeTarget:materialUpgradeTarget('copper')},
 {id:'bauxite',name:'Алюминиевая руда (боксит)',frames:[4],canonicalHardness:drillMaterialHardness('bauxite'),upgradeTarget:materialUpgradeTarget('bauxite')},
 {id:'tin',name:'Оловянная руда',frames:[5],canonicalHardness:drillMaterialHardness('tin'),upgradeTarget:materialUpgradeTarget('tin')},
 {id:'zinc',name:'Цинковая руда',frames:[6],canonicalHardness:drillMaterialHardness('zinc'),upgradeTarget:materialUpgradeTarget('zinc')},
 {id:'nickel',name:'Никелевая руда',frames:[7],canonicalHardness:drillMaterialHardness('nickel'),upgradeTarget:materialUpgradeTarget('nickel')},
 {id:'chromium',name:'Хромовая руда',frames:[8],canonicalHardness:drillMaterialHardness('chromium'),upgradeTarget:materialUpgradeTarget('chromium')},
 {id:'titanium',name:'Титановая руда',frames:[9],canonicalHardness:drillMaterialHardness('titanium'),upgradeTarget:materialUpgradeTarget('titanium')},
 {id:'tungsten',name:'Вольфрамовая руда',frames:[10],canonicalHardness:drillMaterialHardness('tungsten'),upgradeTarget:materialUpgradeTarget('tungsten')},
 {id:'gold',name:'Золотосодержащая руда',frames:[11],canonicalHardness:drillMaterialHardness('gold'),upgradeTarget:materialUpgradeTarget('gold')},
 {id:'xenorite',name:'Ксенорит',frames:[12],canonicalHardness:drillMaterialHardness('xenorite'),upgradeTarget:materialUpgradeTarget('xenorite')}
];
export function materialDefinition(id){return MATERIALS.find(material=>material.id===id)||MATERIALS[0];}
export function materialFrameRect(id,variant,width,height=width){const m=materialDefinition(id),slot=m.frames[Math.floor(variant/4)%m.frames.length];return {x:(slot%4)*width/4,y:Math.floor(slot/4)*height/4,w:width/4,h:height/4};}
export function terrainMaterial(world,x,y){return world.blocked(x,y)?materialDefinition(world.material?.(x,y)||'earth').id:'earth';}
