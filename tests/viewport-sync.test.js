import test from 'node:test';
import assert from 'node:assert/strict';
import {startViewportSync,gameplayZoom} from '../src/viewport-sync.js';
test('late container resize and stale camera recover without a window resize event',()=>{
 let pending,observed,rect={width:390,height:844};
 globalThis.window=new EventTarget();window.requestAnimationFrame=fn=>{pending=fn;return 1;};window.cancelAnimationFrame=()=>{pending=null;};window.visualViewport=new EventTarget();globalThis.document=new EventTarget();
 globalThis.ResizeObserver=class{constructor(fn){observed=fn;}observe(){}disconnect(){observed=null;}};
 const camera={width:390,height:844,setViewport(x,y,w,h){this.width=w;this.height=h;}};let fits=0,resets=0;
 const scene={cameras:{main:camera},fit:()=>fits++,joystick:{reset:()=>resets++}};
 const canvas={width:390,height:844},size={width:390,height:844};
 const game={canvas,scale:{canvas,gameSize:size,setParentSize(w,h){Object.assign(size,{width:w,height:h});Object.assign(canvas,{width:w,height:h});}},scene:{getScenes:()=>[scene]},events:{once(){},off(){}}};
 const dispose=startViewportSync(game,{getBoundingClientRect:()=>rect});pending();
 window.dispatchEvent(new Event('orientationchange'));pending();
 rect={width:740,height:280};observed();pending();assert.deepEqual(size,{width:740,height:280});assert.equal(camera.width,740);assert.equal(camera.height,280);assert.equal(fits,1);assert.equal(resets,1);
 camera.width=390;observed();pending();assert.equal(camera.width,740);assert.equal(fits,2);
 rect={width:0,height:0};observed();pending();assert.equal(canvas.width,740);
 dispose();assert.equal(observed,null);
});
test('landscape gameplay zoom shows more than four cells while desktop zoom is preserved',()=>{
 assert.ok(280/gameplayZoom(740,280)>380);
 assert.equal(gameplayZoom(390,844),.82);assert.equal(gameplayZoom(1440,900),1.12);
});
