import { BASE_SIZE, CELL, initialRubble } from './base-state.js';
export function terrainTileIndex(world,x,y) {
  const soil=(cx,cy)=>world.inside(cx,cy)&&world.blocked(cx,cy);
  const filled=soil(x,y);
  const neighbors=[soil(x,y-1),soil(x+1,y),soil(x,y+1),soil(x-1,y)];
  const mask=neighbors.reduce((bits,value,i)=>bits|((filled?!value:value)?1<<i:0),0);
  return filled?((y%4)*4+x%4)*16+mask:256+mask;
}
export function soilCornerBounds(mask) {
  return {left:mask&8?11:0,right:mask&2?48:64,top:mask&1?8:0,bottom:mask&4?37:64};
}
export function soilFacePolygon(mask,side) {
  if(!(mask&(1<<side)))return [];
  const {left,right,top,bottom}=soilCornerBounds(mask);
  const inner=[[[left,top],[right,top]],[[right,top],[right,bottom]],[[right,bottom],[left,bottom]],[[left,bottom],[left,top]]][side];
  const outer=[[[0,0],[64,0]],[[64,0],[64,64]],[[64,64],[0,64]],[[0,64],[0,0]]][side];
  return [inner[0],inner[1],outer[1],outer[0]];
}
function cutEdge(ctx,side,variant,face,mask) {
  const polygon=soilFacePolygon(mask,side);
  const inner=polygon.slice(0,2),outer=[polygon[3],polygon[2]];
  const [start,end]=inner,points=[start];
  for(let i=1;i<8;i++) {
    const t=i/8,jitter=(((i+variant*5)%4)-1.5)*.8;
    points.push([start[0]+(end[0]-start[0])*t+(side%2?jitter:0),start[1]+(end[1]-start[1])*t+(side%2?0:jitter)]);
  }
  points.push(end);
  ctx.save();ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.lineTo(...outer[1]);ctx.lineTo(...outer[0]);ctx.closePath();ctx.clip();
  ctx.save();
  if(side===0){ctx.translate(64,64);ctx.rotate(Math.PI);}
  if(side===1){ctx.translate(0,64);ctx.rotate(-Math.PI/2);}
  if(side===3){ctx.translate(64,0);ctx.rotate(Math.PI/2);}
  const depth=side===2?27:side===1?16:side===3?11:8,rim=64-depth;
  const panel=side===1||side===3?Math.floor(variant/4):variant%4;
  ctx.drawImage(face,panel*face.width/4,0,face.width/4,face.height,0,rim-3,64,depth+3);
  const shade=ctx.createLinearGradient(0,rim,0,64);
  shade.addColorStop(0,'rgba(39,23,13,.05)');shade.addColorStop(.55,'rgba(39,23,13,.12)');shade.addColorStop(1,'rgba(25,19,14,.48)');
  ctx.fillStyle=shade;ctx.fillRect(0,rim-3,64,depth+3);
  if(side===1){ctx.fillStyle='rgba(32,23,16,.16)';ctx.fillRect(0,rim-3,64,depth+3);}
  ctx.restore();ctx.restore();
  ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.strokeStyle=side===0||side===3?'rgba(255,211,123,.85)':'rgba(248,186,94,.85)';ctx.lineWidth=2.5;ctx.stroke();
  ctx.strokeStyle='rgba(31,23,17,.7)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(...outer[0]);ctx.lineTo(...outer[1]);ctx.stroke();
}
function floorShadow(ctx,mask) {
  for(let side=0;side<4;side++) if(mask&(1<<side)) {
    ctx.save();
    if(side===1){ctx.translate(64,0);ctx.rotate(Math.PI/2);}
    if(side===2){ctx.translate(64,64);ctx.rotate(Math.PI);}
    if(side===3){ctx.translate(0,64);ctx.rotate(-Math.PI/2);}
    const depth=side===0?24:side===3?15:10;
    const grad=ctx.createLinearGradient(0,0,0,depth);grad.addColorStop(0,'rgba(23,20,16,.82)');grad.addColorStop(.22,'rgba(23,20,16,.45)');grad.addColorStop(1,'rgba(23,20,16,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,64,depth);
    for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#89714e':'#b59b74';ctx.beginPath();ctx.ellipse(5+i*10,2+(i%3),1.2+(i%2),.9,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
export function floorFixtureIndex(world,x,y) {
  const clear=(cx,cy)=>world.inside(cx,cy)&&!world.blocked(cx,cy);
  if(!clear(x,y))return -1;
  const pipe=(cx,cy)=>world.inside(cx,cy)&&initialRubble(cx,cy-1)&&((cx+cy*3)%12)<4;
  if(pipe(x,y))return 272+(pipe(x-1,y)?1:0)+(pipe(x+1,y)?2:0);
  const seed=(x*197+y*83+x*y*17)%997;
  if(seed%61===0)return 276;
  if(seed%73===0)return 277;
  if(seed%11===0&&initialRubble(x-1,y))return 278;
  if(seed%11===0&&initialRubble(x+1,y))return 279;
  return -1;
}
function floorFixture(ctx,type) {
  ctx.save();
  if(type<4) {
    const left=type&1?0:8,right=type&2?64:56;
    ctx.strokeStyle='rgba(20,22,20,.4)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(left,19);ctx.lineTo(right,19);ctx.stroke();
    ctx.strokeStyle='#27393c';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(left,14);ctx.lineTo(right,14);ctx.stroke();
    ctx.strokeStyle='#708187';ctx.lineWidth=4;ctx.stroke();ctx.strokeStyle='#b2b4a0';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,12);ctx.lineTo(right,12);ctx.stroke();
    for(const x of [left+6,right-6]){ctx.fillStyle='#8d6f4d';ctx.fillRect(x,9,3,10);ctx.fillStyle='#bcab81';ctx.fillRect(x,9,3,2);}
    ctx.fillStyle='#a79875';
    if(!(type&1))ctx.fillRect(left-1,10,2,8);if(!(type&2))ctx.fillRect(right-1,10,2,8);
    if(type===0){ctx.fillStyle='#73644d';ctx.fillRect(29,9,6,10);ctx.strokeStyle='#b79c64';ctx.lineWidth=2;ctx.beginPath();ctx.arc(32,11,5,0,Math.PI*2);ctx.stroke();}
  } else if(type===4) {
    ctx.fillStyle='rgba(24,26,22,.4)';ctx.beginPath();ctx.ellipse(33,35,14,12,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#3a4340';ctx.beginPath();ctx.arc(32,32,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#afa488';ctx.lineWidth=2;ctx.stroke();
    ctx.save();ctx.beginPath();ctx.arc(32,32,9,0,Math.PI*2);ctx.clip();ctx.strokeStyle='#171f1d';ctx.lineWidth=3;
    for(let x=18;x<48;x+=5){ctx.beginPath();ctx.moveTo(x,20);ctx.lineTo(x-7,44);ctx.stroke();}ctx.restore();
    for(const [x,y] of [[32,21],[21,32],[43,32],[32,43]]){ctx.fillStyle='#c7bba0';ctx.fillRect(x-1,y-1,2,2);}
  } else if(type===5) {
    ctx.fillStyle='rgba(20,23,22,.35)';ctx.fillRect(17,25,32,18);ctx.fillStyle='#353f3e';ctx.fillRect(16,22,32,18);ctx.strokeStyle='#9e9b86';ctx.lineWidth=2;ctx.strokeRect(16,22,32,18);
    for(let y=26;y<38;y+=4){ctx.fillStyle='#141f1d';ctx.fillRect(20,y,24,2);ctx.fillStyle='#6a7976';ctx.fillRect(20,y-1,24,1);}
    for(const [x,y] of [[18,24],[46,24],[18,38],[46,38]]){ctx.fillStyle='#b6a889';ctx.fillRect(x,y,1.5,1.5);}
  } else {
    const x=type===6?10:54;
    ctx.strokeStyle='rgba(20,21,19,.35)';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+2,3);ctx.bezierCurveTo(x+6,20,x-5,42,x+2,61);ctx.stroke();
    ctx.strokeStyle='#322e21';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,2);ctx.bezierCurveTo(x+4,20,x-7,42,x,61);ctx.stroke();ctx.strokeStyle='#a18b5a';ctx.lineWidth=1;ctx.stroke();
    for(const y of [17,46]){ctx.fillStyle='#586463';ctx.fillRect(x-4,y,7,3);ctx.fillStyle='#a0a38f';ctx.fillRect(x-4,y,7,1);}
  }
  ctx.restore();
}
function makeTerrainAtlas(scene) {
  if(scene.textures.exists('terrain-atlas'))return;
  const texture=scene.textures.createCanvas('terrain-atlas',1088,1224);
  const ctx=texture.getContext(),source=scene.textures.get('soil-surface').getSourceImage(),face=scene.textures.get('soil-cut').getSourceImage();
  for(let variant=0;variant<16;variant++)for(let mask=0;mask<16;mask++) {
    const index=variant*16+mask,ox=index%16*68+2,oy=Math.floor(index/16)*68+2;
    ctx.save();ctx.translate(ox,oy);ctx.beginPath();ctx.rect(0,0,64,64);ctx.clip();
    ctx.drawImage(source,(variant%4)*source.width/4,Math.floor(variant/4)*source.height/4,source.width/4,source.height/4,0,0,64,64);
    for(let side=0;side<4;side++)if(mask&(1<<side))cutEdge(ctx,side,variant,face,mask);
    ctx.restore();
    // Extruded texels prevent neighbouring atlas variants bleeding into cell seams.
    const canvas=texture.getSourceImage();
    ctx.drawImage(canvas,ox,oy,64,1,ox,oy-2,64,2);
    ctx.drawImage(canvas,ox,oy+63,64,1,ox,oy+64,64,2);
    ctx.drawImage(canvas,ox,oy-2,1,68,ox-2,oy-2,2,68);
    ctx.drawImage(canvas,ox+63,oy-2,1,68,ox+64,oy-2,2,68);
  }
  for(let mask=0;mask<16;mask++){ctx.save();ctx.translate(mask*68+2,1090);floorShadow(ctx,mask);ctx.restore();}
  for(let type=0;type<8;type++){ctx.save();ctx.translate(type*68+2,1158);floorFixture(ctx,type);ctx.restore();}
  texture.refresh();
}
export class WorldTerrain {
  constructor(scene,world) {
    this.world=world;makeTerrainAtlas(scene);
    this.map=scene.make.tilemap({tileWidth:CELL,tileHeight:CELL,width:BASE_SIZE,height:BASE_SIZE});
    const tiles=this.map.addTilesetImage('terrain-atlas','terrain-atlas',CELL,CELL,2,4);
    this.fixtures=this.map.createBlankLayer('bunker-fixtures',tiles).setDepth(2);
    this.layer=this.map.createBlankLayer('soil',tiles).setDepth(3);
    for(let y=0;y<BASE_SIZE;y++)for(let x=0;x<BASE_SIZE;x++)this.paintCell(x,y);
    scene.events.once('shutdown',()=>this.map.destroy());
  }
  paintCell(x,y) {
    if(x<0||y<0||x>=BASE_SIZE||y>=BASE_SIZE)return;
    const tile=this.layer.putTileAt(terrainTileIndex(this.world,x,y),x,y);
    const fixture=floorFixtureIndex(this.world,x,y);
    if(fixture<0)this.fixtures.removeTileAt(x,y);else this.fixtures.putTileAt(fixture,x,y);
    tile.tint=this.world.damage.has(y*BASE_SIZE+x)?0xf4d6aa:0xffffff;
  }
  refreshAround(x,y) {
    for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)if(Math.abs(dx)+Math.abs(dy)<=2)this.paintCell(x+dx,y+dy);
  }
}

export function bunkerFloorTexture(scene) {
  const key='bunker-floor-joined';
  if(scene.textures.exists(key))return key;
  const source=scene.textures.get('bunker-floor').getSourceImage();
  const texture=scene.textures.createCanvas(key,512,512),ctx=texture.getContext();
  // Mirrored neighbors share the same boundary pixels, including the slab joints.
  for(let y=0;y<2;y++)for(let x=0;x<2;x++) {
    ctx.save();ctx.translate(x?512:0,y?512:0);ctx.scale(x?-1:1,y?-1:1);
    ctx.drawImage(source,0,0,256,256);ctx.restore();
  }
  texture.refresh();return key;
}
