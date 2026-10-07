import test from 'node:test';
import assert from 'node:assert/strict';
import { findTunnelPath } from '../src/tunnel-path.js';
import { stepSpider } from '../src/combat-state.js';
const at=(x,y)=>({x:(x+.5)*64,y:(y+.5)*64});
function corridor(){
 const cleared=new Set([10*50+7,10*50+11]),damage=new Map();
 return {
  damage,cleared,inside:(x,y)=>x>=6&&x<=12&&y>=9&&y<=11,
  blocked(x,y){return this.inside(x,y)&&!cleared.has(y*50+x);},
  hardness:(x,y)=>y===9?1:y===10?20:Infinity,
  drill(x,y,power){
   const key=y*50+x,value=(damage.get(key)||0)+power/this.hardness(x,y);
   if(value>=1){cleared.add(key);damage.delete(key);return true;}
   damage.set(key,value);return false;
  }
 };
}
test('weighted tunnels prefer weaker soil rather than the shorter route through hard rock',()=>{
 const world=corridor(),solid=(x,y)=>!world.inside(x,y)||world.blocked(x,y);
 const path=findTunnelPath(at(7,10),at(11,10),world,solid);
 assert.ok(path.some(p=>Math.floor(p.y/64)===9));
 assert.ok(!path.some(p=>Math.floor(p.y/64)===10&&Math.floor(p.x/64)===9));
 for(const p of path)assert.ok(world.inside(Math.floor(p.x/64),Math.floor(p.y/64)));
});
test('partly broken rock becomes preferable when its remaining resistance is lower',()=>{
 const world=corridor();for(let x=8;x<=10;x++)world.damage.set(10*50+x,.999);
 const solid=(x,y)=>!world.inside(x,y)||world.blocked(x,y);
 const path=findTunnelPath(at(7,10),at(11,10),world,solid);
 assert.equal(path.length,4);assert.ok(path.every(p=>Math.floor(p.y/64)===10));
});
test('tunnel planning never removes structural collisions or indestructible blocks',()=>{
 const world=corridor(),solid=(x,y)=>!world.inside(x,y)||world.blocked(x,y);
 solid.rectangles=[{x:9*64,y:9*64,width:64,height:3*64}];
 assert.deepEqual(findTunnelPath(at(7,10),at(11,10),world,solid),[]);
 const withoutRubble={...world,blocked:()=>false};
 const protectedCell=(x,y)=>!world.inside(x,y)||(x===9&&y>=9&&y<=11);
 assert.deepEqual(findTunnelPath(at(7,10),at(11,10),withoutRubble,protectedCell),[]);
});
test('spider digs gradually, shares saved block damage and walks through only after the block breaks',()=>{
 const cleared=new Set([10*50+10,10*50+12]),damage=new Map(),changes=[];
 const world={damage,blocked:(x,y)=>!cleared.has(y*50+x),hardness:()=>1,
  drill(x,y,power){const key=y*50+x,next=(damage.get(key)||0)+power;if(next>=1){cleared.add(key);damage.delete(key);return true;}damage.set(key,next);return false;}
 };
 const solid=(x,y)=>x<10||x>12||y!==10||world.blocked(x,y);
 const spider={...at(10,10),hp:3,bite:0,angle:0},rig=at(12,10);
 const options={world,onDig:(x,y,broken)=>changes.push({x,y,broken})};
 for(let i=0;i<20;i++)stepSpider(spider,rig,50,solid,options);
 assert.equal(world.blocked(11,10),true);assert.ok(damage.get(10*50+11)>0);assert.ok(spider.x<11*64);
 // This fraction is shared with the drill and survives the ordinary world snapshot.
 const savedDamage=JSON.parse(JSON.stringify([...damage]));world.damage=new Map(savedDamage);
 for(let i=0;i<70;i++)stepSpider(spider,rig,50,solid,options);
 assert.equal(world.blocked(11,10),false);assert.ok(spider.x>11*64);
 assert.equal(changes.filter(c=>c.broken).length,1);
});
