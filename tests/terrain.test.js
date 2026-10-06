import test from 'node:test';
import assert from 'node:assert/strict';
import { terrainTileIndex, floorFixtureIndex } from '../src/terrain.js';
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
  const cells=new Set([10*50+7,9*50+7]);const w=world(cells);
  assert.equal(floorFixtureIndex(w,7,10),-1);
  cells.delete(10*50+7);
  const fixture=floorFixtureIndex(w,7,10);assert.ok(fixture>=272&&fixture<=275);
  assert.equal(floorFixtureIndex(world(new Set(cells)),7,10),fixture);
});
