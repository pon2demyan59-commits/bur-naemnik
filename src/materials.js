// Sprite-sheet slots match docs/canon-miro.txt. Asteryon is not a mined block.
export const MATERIALS=[
 {id:'earth',name:'Земля',frames:[0,13],firstFloor:0},
 {id:'stone',name:'Камень',frames:[1,14],firstFloor:2},
 {id:'iron',name:'Железная руда',frames:[2,15],firstFloor:3},
 {id:'copper',name:'Медная руда',frames:[3],firstFloor:4},
 {id:'bauxite',name:'Алюминиевая руда (боксит)',frames:[4],firstFloor:5},
 {id:'tin',name:'Оловянная руда',frames:[5],firstFloor:6},
 {id:'zinc',name:'Цинковая руда',frames:[6],firstFloor:8},
 {id:'nickel',name:'Никелевая руда',frames:[7],firstFloor:12},
 {id:'chromium',name:'Хромовая руда',frames:[8],firstFloor:16},
 {id:'titanium',name:'Титановая руда',frames:[9],firstFloor:24},
 {id:'tungsten',name:'Вольфрамовая руда',frames:[10],firstFloor:40},
 {id:'gold',name:'Золотосодержащая руда',frames:[11],firstFloor:30},
 {id:'xenorite',name:'Ксенорит',frames:[12],firstFloor:100}
];
export function materialDefinition(id){return MATERIALS.find(material=>material.id===id)||MATERIALS[0];}
export function materialFrameRect(id,variant,width,height=width){const m=materialDefinition(id),slot=m.frames[Math.floor(variant/4)%m.frames.length];return {x:(slot%4)*width/4,y:Math.floor(slot/4)*height/4,w:width/4,h:height/4};}
export function terrainMaterial(world,x,y){return world.blocked(x,y)?materialDefinition(world.material?.(x,y)||'earth').id:'earth';}
