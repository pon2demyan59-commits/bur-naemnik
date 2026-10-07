import { materialDefinition, materialFrameRect, terrainMaterial } from './materials.js';
import { FLOOR_PROP_FRAMES } from './floor-prop-frames.js';
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
// NW, NE, SE, SW: diagonals expose inside bends hidden by cardinal masks.
export function terrainCornerTypes(world,x,y) {
  if(!world.inside(x,y)||!world.blocked(x,y))return [-1,-1,-1,-1];
  const soil=(cx,cy)=>world.inside(cx,cy)&&world.blocked(cx,cy);
  return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dy],corner)=>{
    const horizontal=soil(x+dx,y),vertical=soil(x,y+dy);
    if(!horizontal&&!vertical)return corner+4;
    if(horizontal&&vertical&&!soil(x+dx,y+dy))return corner;
    return -1;
  });
}
function cornerPatch(ctx,type,variant,face) {
  const corner=type%4,right=corner===1||corner===2,bottom=corner>=2;
  const width=right?16:11,height=bottom?27:8;
  ctx.save();ctx.translate(right?64:0,bottom?64:0);ctx.scale(right?-1:1,bottom?-1:1);
  ctx.beginPath();
  if(type<4) {
    // A concave ellipse joins the two neighboring cut faces at their exact insets.
    ctx.moveTo(0,0);ctx.lineTo(width,0);
    ctx.bezierCurveTo(width,height*.552,width*.552,height,0,height);ctx.closePath();
  } else {
    // Shave the pointed top corner into a small rounded clay rim.
    const r=5;ctx.moveTo(width,height);ctx.lineTo(width+r,height);
    ctx.quadraticCurveTo(width,height,width,height+r);ctx.closePath();
  }
  ctx.save();ctx.clip();
  const panel=variant%4;
  ctx.drawImage(face,panel*face.width/4,0,face.width/4,face.height,0,0,64,height+6);
  const shade=ctx.createLinearGradient(0,0,0,height+5);
  shade.addColorStop(0,'rgba(25,19,14,.48)');shade.addColorStop(1,'rgba(39,23,13,.05)');
  ctx.fillStyle=shade;ctx.fillRect(0,0,64,height+6);ctx.restore();
  ctx.beginPath();
  if(type<4){ctx.moveTo(width,0);ctx.bezierCurveTo(width,height*.552,width*.552,height,0,height);}
  else {ctx.moveTo(width+5,height);ctx.quadraticCurveTo(width,height,width,height+5);}
  ctx.strokeStyle='rgba(248,193,107,.9)';ctx.lineWidth=2.5;ctx.lineCap='round';ctx.stroke();ctx.restore();
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
function spriteSource(scene,key) {
  const texture=scene.textures.get(key),bounds=FLOOR_PROP_FRAMES[key];
  if(!texture.has('trimmed'))texture.add('trimmed',0,bounds.x,bounds.y,bounds.w,bounds.h);
  const frame=texture.get('trimmed');
  return {image:texture.getSourceImage(),x:frame.cutX,y:frame.cutY,w:frame.cutWidth,h:frame.cutHeight};
}
function drawSprite(ctx,sprite,x,y,w,h,flip=false) {
  ctx.save();if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);x=0;y=0;}
  ctx.drawImage(sprite.image,sprite.x,sprite.y,sprite.w,sprite.h,x,y,w,h);ctx.restore();
}
function floorFixture(ctx,type,sprites) {
  if(type<4) {
    const left=type&1?0:9,right=type&2?64:55;
    drawSprite(ctx,sprites.pipe,left,7,right-left,15);
    if(!(type&1))drawSprite(ctx,sprites.cap,left-5,6,10,17,true);
    if(!(type&2))drawSprite(ctx,sprites.cap,right-5,6,10,17);
  } else if(type===4) {
    drawSprite(ctx,sprites.drain,17,17,30,30);
  } else if(type===5) {
    drawSprite(ctx,sprites.vent,12,18,40,28);
  } else {
    drawSprite(ctx,sprites.cable,type===6?4:46,3,14,58);
  }
}
function drawMaterialSurface(ctx,source,material,variant) {
  const r=materialFrameRect(material,variant,source.width,source.height);
  // Rotate and mirror painted variants without changing the frame's scale or coverage.
  ctx.save();ctx.translate(32,32);ctx.rotate((variant%4)*Math.PI/2);
  ctx.scale(variant&4?-1:1,variant&8?-1:1);
  ctx.drawImage(source,r.x,r.y,r.w,r.h,-32,-32,64,64);ctx.restore();
}
function makeTerrainAtlas(scene,material='earth') {
  const key=material==='earth'?'terrain-atlas':'terrain-'+material;
  if(scene.textures.exists(key))return key;
  const texture=scene.textures.createCanvas(key,1088,1768);
  const sprites=Object.fromEntries(['pipe','cap','vent','drain','cable'].map(name=>[name,spriteSource(scene,'prop-'+name)]));
  const ctx=texture.getContext(),source=scene.textures.get('material-surfaces').getSourceImage();
  const faceTexture=scene.textures.createCanvas('material-face-'+material,256,64),faceCtx=faceTexture.getContext();
  for(let i=0;i<4;i++){faceCtx.save();faceCtx.translate(i*64,0);drawMaterialSurface(faceCtx,source,material,i);faceCtx.fillStyle='rgba(13,18,20,.25)';faceCtx.fillRect(0,0,64,64);faceCtx.restore();}
  faceTexture.refresh();const face=faceTexture.getSourceImage();
  for(let variant=0;variant<16;variant++)for(let mask=0;mask<16;mask++) {
    const index=variant*16+mask,ox=index%16*68+2,oy=Math.floor(index/16)*68+2;
    ctx.save();ctx.translate(ox,oy);ctx.beginPath();ctx.rect(0,0,64,64);ctx.clip();
    drawMaterialSurface(ctx,source,material,variant);
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
  for(let type=0;type<8;type++){ctx.save();ctx.translate(type*68+2,1158);floorFixture(ctx,type,sprites);ctx.restore();}
  for(let variant=0;variant<16;variant++)for(let type=0;type<8;type++) {
    const index=288+variant*8+type;
    ctx.save();ctx.translate(index%16*68+2,Math.floor(index/16)*68+2);
    ctx.beginPath();ctx.rect(0,0,64,64);ctx.clip();cornerPatch(ctx,type,variant,face);ctx.restore();
  }
  texture.refresh();return key;
}
export class WorldTerrain {
  constructor(scene,world) {
    this.world=world;this.scene=scene;
    this.map=scene.make.tilemap({tileWidth:CELL,tileHeight:CELL,width:BASE_SIZE,height:BASE_SIZE});
    this.materialLayers=new Map();const earth=this.layersFor('earth');this.layer=earth.layer;this.corners=earth.corners;
    this.fixtures=this.map.createBlankLayer('bunker-fixtures',earth.tiles).setDepth(2);
    for(let y=0;y<BASE_SIZE;y++)for(let x=0;x<BASE_SIZE;x++)this.paintCell(x,y);
    scene.events.once('shutdown',()=>this.map.destroy());
  }
  layersFor(id) {
    const material=materialDefinition(id).id;if(this.materialLayers.has(material))return this.materialLayers.get(material);
    // Only materials present on this floor allocate a GPU atlas and tile layers.
    const key=makeTerrainAtlas(this.scene,material),tiles=this.map.addTilesetImage(key,key,CELL,CELL,2,4);
    const layer=this.map.createBlankLayer('surface-'+material,tiles).setDepth(3);
    const corners=Array.from({length:4},(_,i)=>this.map.createBlankLayer('corner-'+material+'-'+i,tiles).setDepth(3.1));
    const group={tiles,layer,corners};this.materialLayers.set(material,group);return group;
  }
  paintCell(x,y) {
    if(x<0||y<0||x>=BASE_SIZE||y>=BASE_SIZE)return;
    const group=this.layersFor(terrainMaterial(this.world,x,y));
    for(const other of this.materialLayers.values())if(other!==group){other.layer.removeTileAt(x,y);for(const corner of other.corners)corner.removeTileAt(x,y);}
    const tile=group.layer.putTileAt(terrainTileIndex(this.world,x,y),x,y);
    terrainCornerTypes(this.world,x,y).forEach((type,i)=>{
      if(type<0)group.corners[i].removeTileAt(x,y);
      else group.corners[i].putTileAt(288+((y%4)*4+x%4)*8+type,x,y);
    });
    const fixture=floorFixtureIndex(this.world,x,y);
    if(fixture<0)this.fixtures.removeTileAt(x,y);else this.fixtures.putTileAt(fixture,x,y);
    // Distinct material artwork stays intact while existing drill damage remains visible.
    tile.tint=this.world.damage.has(y*BASE_SIZE+x)?0xf4d6aa:0xffffff;
    for(const layer of group.corners){const corner=layer.getTileAt(x,y);if(corner)corner.tint=tile.tint;}
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

