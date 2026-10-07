import test from 'node:test';
import assert from 'node:assert/strict';
import { MATERIALS,materialFrameRect,terrainMaterial } from '../src/materials.js';
import { WorldTerrain,terrainTileIndex } from '../src/terrain.js';
import { FloorWorld } from '../src/lift-state.js';
test('all thirteen mined materials have separate sheet frames, fully inside the sixteen-cell atlas',()=>{
 assert.equal(MATERIALS.length,13);assert.equal(new Set(MATERIALS.map(m=>m.frames[0])).size,13);
 for(const m of MATERIALS)for(let v=0;v<16;v++){const r=materialFrameRect(m.id,v,640);assert.equal(r.w,160);assert.equal(r.h,160);assert.ok(r.x>=0&&r.y>=0&&r.x+r.w<=640&&r.y+r.h<=640);}
 assert.equal(MATERIALS.find(m=>m.id==='xenorite').firstFloor,100);assert.equal(MATERIALS.some(m=>m.id==='asterion'),false);
});
function fakeScene(){
 const textures=new Map();const context=new Proxy({drawImage(){},createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{}});
 const image=(w=640,h=w)=>({width:w,height:h});
 const get=k=>{if(!textures.has(k)){textures.set(k,{has:()=>true,add(){},get:()=>({cutX:0,cutY:0,cutWidth:64,cutHeight:64}),getSourceImage:()=>image()});}return textures.get(k);};
 const map={groups:new Map(),addTilesetImage:key=>({key}),createBlankLayer(name,tiles){const data=new Map();const layer={tiles,data,setDepth(){return this;},putTileAt(index,x,y){const t={index,tint:0xffffff};data.set(`${x},${y}`,t);return t;},removeTileAt(x,y){data.delete(`${x},${y}`);},getTileAt:(x,y)=>data.get(`${x},${y}`)};map.groups.set(name,layer);return layer;},destroy(){}};
 return {textures:{exists:k=>textures.has(k),get,createCanvas(k,w,h){const tex={getContext:()=>context,getSourceImage:()=>image(w,h),refresh(){}};textures.set(k,tex);return tex;}},make:{tilemap:()=>map},events:{once(){}},map};
}
test('earth and stone use different tile layers and excavation removes stone artwork including corner faces',()=>{
 const scene=fakeScene(),cells=new Set([10*50+10,10*50+11]);const world={inside:(x,y)=>x>=2&&y>=2&&x<48&&y<48,blocked:(x,y)=>cells.has(y*50+x),material:(x,y)=>x===11?'stone':'earth',damage:new Map()};
 const terrain=new WorldTerrain(scene,world);assert.deepEqual([...terrain.materialLayers.keys()],['earth','stone']);
 const earth=terrain.materialLayers.get('earth'),stone=terrain.materialLayers.get('stone');assert.notEqual(earth.tiles.key,stone.tiles.key);assert.ok(earth.layer.getTileAt(10,10));assert.ok(stone.layer.getTileAt(11,10));assert.equal(earth.layer.getTileAt(11,10),undefined);
 assert.equal(terrainTileIndex(world,10,10)%16&2,0,'material boundary does not create a false open cut');
 cells.delete(10*50+11);terrain.refreshAround(11,10);assert.equal(stone.layer.getTileAt(11,10),undefined);assert.equal(earth.layer.getTileAt(11,10).index>=256,true);for(const layer of stone.corners)assert.equal(layer.getTileAt(11,10),undefined);
 assert.equal(terrainMaterial(world,11,10),'earth');
});
test('every catalog material is wired to a real atlas, with only present materials allocated',()=>{
 const scene=fakeScene(),world={inside:()=>true,blocked:(x,y)=>y===10&&x>=5&&x<5+MATERIALS.length,material:(x,y)=>MATERIALS[x-5]?.id||'earth',damage:new Map()};
 const terrain=new WorldTerrain(scene,world);assert.equal(terrain.materialLayers.size,13);for(let i=0;i<MATERIALS.length;i++){const m=MATERIALS[i],g=terrain.materialLayers.get(m.id);assert.ok(g.layer.getTileAt(i+5,10));assert.equal(g.tiles.key,m.id==='earth'?'terrain-atlas':'terrain-'+m.id);}
});
test('both available mine floors can render every generated ore while the base remains earth',async()=>{
 const {BaseWorld}=await import('../src/base-state.js');const base=new BaseWorld();for(let y=2;y<48;y++)for(let x=2;x<48;x++)assert.equal(base.material(x,y),'earth');
 for(const floor of [1,2]){const world=new FloorWorld({materialSeed:12345},floor),seen=new Set();for(let y=2;y<48;y++)for(let x=2;x<48;x++)if(world.blocked(x,y))seen.add(terrainMaterial(world,x,y));assert.deepEqual([...seen].sort(),MATERIALS.map(m=>m.id).sort());}
});
