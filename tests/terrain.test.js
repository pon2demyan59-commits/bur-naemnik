import test from 'node:test';
import assert from 'node:assert/strict';
import { terrainTileIndex, floorFixtureIndex, soilCornerBounds, soilFacePolygon, terrainCornerTypes } from '../src/terrain.js';
function world(cells) {return {inside:(x,y)=>x>=0&&y>=0&&x<50&&y<50,blocked:(x,y)=>cells.has(y*50+x)};}
test('adjacent earth has no internal cut edges; excavation exposes only bordering cells',()=>{
  const cells=new Set();for(let y=9;y<=11;y++)for(let x=9;x<=11;x++)cells.add(y*50+x);
  const w=world(cells);
  assert.equal(terrainTileIndex(w,10,10)%16,0);
  cells.delete(10*50+10);
  assert.equal(terrainTileIndex(w,10,10),271);
  assert.equal(terrainTileIndex(w,10,9)%16&4,4);
  assert.equal(terrainTileIndex(w,9,10)%16&2,2);
  assert.equal(terrainTileIndex(w,11,10)%16&8,8);
  assert.equal(terrainTileIndex(w,10,11)%16&1,1);
});
test('a completely cleared area shows the bunker floor without soil edges',()=>{
  const w=world(new Set());assert.equal(terrainTileIndex(w,20,20),256);
});

test('bunker fixtures stay hidden under soil and their placement persists after excavation',()=>{
  const cells=new Set([10*50+7]);const w=world(cells);
  assert.equal(floorFixtureIndex(w,7,10),-1);
  cells.delete(10*50+7);
  const fixture=floorFixtureIndex(w,7,10);assert.ok(fixture>=272&&fixture<=275);
  assert.equal(floorFixtureIndex(world(new Set(cells)),7,10),fixture);
});

test('corner faces cover the cell without overlapping the top or leaving corner gaps',()=>{
  const area=polygon=>Math.abs(polygon.reduce((sum,[x,y],i)=>{const [nx,ny]=polygon[(i+1)%polygon.length];return sum+x*ny-y*nx;},0)/2);
  for(let mask=0;mask<16;mask++) {
    const bounds=soilCornerBounds(mask);
    const top=(bounds.right-bounds.left)*(bounds.bottom-bounds.top);
    const faces=[0,1,2,3].reduce((sum,side)=>sum+area(soilFacePolygon(mask,side)),0);
    assert.equal(top+faces,64*64,'gap or overlap for neighbor mask '+mask);
  }
});
test('excavating neighboring rubble does not move or regenerate floor fixtures',()=>{
  const cells=new Set();for(let y=0;y<50;y++)for(let x=0;x<50;x++)cells.add(y*50+x);
  cells.delete(10*50+7);const w=world(cells),before=floorFixtureIndex(w,7,10);
  assert.ok(before>=272);
  cells.delete(9*50+7);cells.delete(10*50+6);cells.delete(10*50+8);
  assert.equal(floorFixtureIndex(w,7,10),before);
});

test('diagonal excavation rounds the inside bend and refreshes its corner without removing soil',()=>{
  const cells=new Set();for(let y=9;y<=11;y++)for(let x=9;x<=11;x++)cells.add(y*50+x);
  const w=world(cells);assert.deepEqual(terrainCornerTypes(w,10,10),[-1,-1,-1,-1]);
  cells.delete(11*50+11);
  assert.deepEqual(terrainCornerTypes(w,10,10),[-1,-1,2,-1]);
  assert.equal(terrainTileIndex(w,10,10)%16,0);
  assert.deepEqual(terrainCornerTypes(w,11,11),[-1,-1,-1,-1]);
  assert.deepEqual(terrainCornerTypes(world(new Set([10*50+10])),10,10),[4,5,6,7]);
});
