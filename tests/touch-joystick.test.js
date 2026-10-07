import test from 'node:test';
import assert from 'node:assert/strict';
import {createTouchJoystick} from '../src/touch-joystick.js';
import {driveStep,driveFits} from '../src/drive-controller.js';
class Surface extends EventTarget {
 constructor(){super();this.knob={style:{}};this.classList={add(){},remove(){}};this.captured=new Set();}
 querySelector(){return this.knob;}
 getBoundingClientRect(){return {left:0,top:0,width:144,height:144};}
 setPointerCapture(id){this.captured.add(id);}
 hasPointerCapture(id){return this.captured.has(id);}
 releasePointerCapture(id){this.captured.delete(id);}
 send(type,id,x=72,y=72){const e=new Event(type,{cancelable:true});Object.assign(e,{pointerId:id,clientX:x,clientY:y,pointerType:'touch'});this.dispatchEvent(e);}
}
test('one finger steers, ignores other fingers and releases outside the circle',()=>{
 globalThis.window=new EventTarget();const e=new Surface();let input;
 const stick=createTouchJoystick(e,value=>input=value);
 e.send('pointerdown',1);assert.equal(input,null);
 e.send('pointermove',1,115,115);assert.ok(input.x>.7&&input.y>.7);assert.ok(input.strength>.99);
 e.send('pointerdown',2,0,0);e.send('pointerup',2);assert.ok(input.x>.7);
 e.send('pointermove',1,500,72);assert.equal(input.x,1);assert.equal(input.strength,1);
 e.send('pointerup',1,500,72);assert.equal(input,null);assert.equal(e.captured.size,0);
 stick.destroy();
});
test('cancel, lost capture, orientation change, modal reset and disposal clear held input',()=>{
 globalThis.window=new EventTarget();const e=new Surface();let input,allowed=true;
 const stick=createTouchJoystick(e,value=>input=value,()=>allowed);
 for(const type of ['pointercancel','lostpointercapture']){e.send('pointerdown',1,115,72);assert.ok(input);e.send(type,1);assert.equal(input,null);}
 e.send('pointerdown',1,115,72);window.dispatchEvent(new Event('resize'));assert.equal(input,null);
 e.send('pointerdown',1,115,72);stick.reset();assert.equal(input,null);
 allowed=false;e.send('pointerdown',1,115,72);assert.equal(input,null);
 allowed=true;e.send('pointerdown',1,115,72);stick.destroy();assert.equal(input,null);e.send('pointerdown',1,115,72);assert.equal(input,null);
});
test('analog movement turns diagonally, creeps at low deflection and preserves collisions',()=>{
 const open=()=>false,origin={x:160,y:160,angle:45,speed:0};
 let full=origin,slow=origin;
 for(let i=0;i<60;i++){full=driveStep(full,{x:1,y:1,strength:1},1/60,open);slow=driveStep(slow,{x:1,y:1,strength:.25},1/60,open);}
 assert.ok(Math.abs(full.angle-45)<.01);assert.ok(full.x>300&&full.y>300);assert.ok(slow.x<full.x&&slow.speed<full.speed*.3);
 const solid=(x,y)=>x>=3||y>=3;let s={...origin};
 for(let i=0;i<120;i++){s=driveStep(s,{x:1,y:1,strength:1},1/60,solid);assert.ok(driveFits(s.x,s.y,solid));}
 assert.ok(s.x<=171&&s.y<=171);
 const snapped=driveStep(origin,{x:1,y:.7,strength:1},.05,solid);assert.ok(snapped.angle<origin.angle);
 let released=full;for(let i=0;i<90;i++)released=driveStep(released,null,1/60,open);assert.equal(released.speed,0);
});
