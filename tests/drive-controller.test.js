import test from 'node:test';
import assert from 'node:assert/strict';
import { driveStep, driveFits } from '../src/drive-controller.js';
const open=()=>false;
test('a ninety degree turn begins travelling and steering in the first frame',()=>{
  const start={x:500,y:500,angle:0,speed:280};
  const next=driveStep(start,'down',1/60,open);
  assert.ok(next.x>start.x&&next.y>start.y);
  assert.ok(next.angle>0&&next.angle<90);
  assert.ok(next.speed>200);
  let state=next;
  for(let i=0;i<45;i++) {state=driveStep(state,'down',1/60,open);assert.ok(state.moving);}
  assert.ok(Math.abs(state.angle-90)<.1);
});
test('release brakes over a short distance without finishing a whole cell',()=>{
  let state={x:500,y:500,angle:0,speed:280};
  for(let i=0;i<90;i++)state=driveStep(state,null,1/60,open);
  assert.equal(state.speed,0);
  assert.ok(state.x>500&&state.x<520);
});
test('fast movement and turns cannot cross rubble, borders or blocked corners',()=>{
  const solid=(x,y)=>x>=8||y>=8||x<0||y<0;
  for(const frame of [1/120,1/30,.2]) {
    let state={x:480,y:480,angle:0,speed:280};
    for(let i=0;i<120;i++) {
      state=driveStep(state,i<60?'right':'down',frame,solid);
      assert.ok(driveFits(state.x,state.y,solid));
      assert.ok(state.x<=491&&state.y<=491);
    }
  }
});
