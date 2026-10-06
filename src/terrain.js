import { BASE_SIZE, CELL } from './base-state.js';
export function terrainTileIndex(world,x,y) {
  const soil=(cx,cy)=>world.inside(cx,cy)&&world.blocked(cx,cy);
  const filled=soil(x,y);
  const neighbors=[soil(x,y-1),soil(x+1,y),soil(x,y+1),soil(x-1,y)];
  const mask=neighbors.reduce((bits,value,i)=>bits|((filled?!value:value)?1<<i:0),0);
  return filled?((y%4)*4+x%4)*16+mask:256+mask;
}
function cutEdge(ctx,side,variant) {
  ctx.save();
  if(side===0) {ctx.translate(64,64);ctx.rotate(Math.PI);}
  if(side===1) {ctx.translate(0,64);ctx.rotate(-Math.PI/2);}
  if(side===3) {ctx.translate(64,0);ctx.rotate(Math.PI/2);}
  const depth=side===2?15:side===1?9:6;
  const rim=64-depth;
  const points=[];
  for(let x=0;x<=64;x+=8)points.push([x,rim+(x===0||x===64?0:((x/8+variant*3)%3)-1)]);
  const grad=ctx.createLinearGradient(0,rim,0,64);
  grad.addColorStop(0,'#a66b30');grad.addColorStop(.3,'#835024');grad.addColorStop(1,'#493221');
  ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.lineTo(64,64);ctx.lineTo(0,64);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
  ctx.save();ctx.clip();
  ctx.strokeStyle='rgba(219,160,81,.45)';ctx.lineWidth=1;
  for(let y=rim+4;y<64;y+=5) {ctx.beginPath();ctx.moveTo(0,y);for(let x=8;x<=64;x+=8)ctx.lineTo(x,y+((x/8+variant)%3)-1);ctx.stroke();}
  for(let i=0;i<5;i++) {
    const x=(variant*13+i*17)%64,y=rim+4+(i*3)%Math.max(1,depth-5);
    ctx.fillStyle=i%2?'#866449':'#b08852';ctx.beginPath();ctx.ellipse(x,y,2.2,1.4,0,0,Math.PI*2);ctx.fill();
  }
  if(side===2) {ctx.strokeStyle='#c6a572';ctx.beginPath();const x=12+(variant*7)%40;ctx.moveTo(x,rim-1);ctx.lineTo(x-1,rim+4);ctx.lineTo(x+2,62);ctx.stroke();}
  ctx.restore();
  ctx.beginPath();ctx.moveTo(...points[0]);for(const point of points.slice(1))ctx.lineTo(...point);
  ctx.strokeStyle=side===0||side===3?'rgba(255,205,112,.8)':'rgba(233,170,83,.6)';ctx.lineWidth=2;ctx.stroke();
  ctx.restore();
}
function floorShadow(ctx,mask) {
  for(let side=0;side<4;side++) if(mask&(1<<side)) {
    ctx.save();
    if(side===1){ctx.translate(64,0);ctx.rotate(Math.PI/2);}
    if(side===2){ctx.translate(64,64);ctx.rotate(Math.PI);}
    if(side===3){ctx.translate(0,64);ctx.rotate(-Math.PI/2);}
    const depth=side===0?12:7;
    const grad=ctx.createLinearGradient(0,0,0,depth);grad.addColorStop(0,'rgba(32,24,16,.52)');grad.addColorStop(1,'rgba(32,24,16,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,64,depth);
    for(let i=0;i<6;i++){ctx.fillStyle=i%2?'#89714e':'#b59b74';ctx.beginPath();ctx.ellipse(5+i*10,2+(i%3),1.2+(i%2),.9,0,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}
function makeTerrainAtlas(scene) {
  if(scene.textures.exists('terrain-atlas'))return;
  const texture=scene.textures.createCanvas('terrain-atlas',1088,1156);
  const ctx=texture.getContext(),source=scene.textures.get('soil-surface').getSourceImage();
  for(let variant=0;variant<16;variant++)for(let mask=0;mask<16;mask++) {
    const index=variant*16+mask,ox=index%16*68+2,oy=Math.floor(index/16)*68+2;
    ctx.save();ctx.translate(ox,oy);ctx.beginPath();ctx.rect(0,0,64,64);ctx.clip();
    ctx.drawImage(source,(variant%4)*source.width/4,Math.floor(variant/4)*source.height/4,source.width/4,source.height/4,0,0,64,64);
    for(let side=0;side<4;side++)if(mask&(1<<side))cutEdge(ctx,side,variant);
    ctx.restore();
    // Extruded texels prevent neighbouring atlas variants bleeding into cell seams.
    const canvas=texture.getSourceImage();
    ctx.drawImage(canvas,ox,oy,64,1,ox,oy-2,64,2);
    ctx.drawImage(canvas,ox,oy+63,64,1,ox,oy+64,64,2);
    ctx.drawImage(canvas,ox,oy-2,1,68,ox-2,oy-2,2,68);
    ctx.drawImage(canvas,ox+63,oy-2,1,68,ox+64,oy-2,2,68);
  }
  for(let mask=0;mask<16;mask++){ctx.save();ctx.translate(mask*68+2,1090);floorShadow(ctx,mask);ctx.restore();}
  texture.refresh();
}
export class WorldTerrain {
  constructor(scene,world) {
    this.world=world;makeTerrainAtlas(scene);
    this.map=scene.make.tilemap({tileWidth:CELL,tileHeight:CELL,width:BASE_SIZE,height:BASE_SIZE});
    const tiles=this.map.addTilesetImage('terrain-atlas','terrain-atlas',CELL,CELL,2,4);
    this.layer=this.map.createBlankLayer('soil',tiles).setDepth(3);
    for(let y=0;y<BASE_SIZE;y++)for(let x=0;x<BASE_SIZE;x++)this.paintCell(x,y);
    scene.events.once('shutdown',()=>this.map.destroy());
  }
  paintCell(x,y) {
    if(x<0||y<0||x>=BASE_SIZE||y>=BASE_SIZE)return;
    const tile=this.layer.putTileAt(terrainTileIndex(this.world,x,y),x,y);
    tile.tint=this.world.damage.has(y*BASE_SIZE+x)?0xf4d6aa:0xffffff;
  }
  refreshAround(x,y) {
    for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1]])this.paintCell(x+dx,y+dy);
  }
}
