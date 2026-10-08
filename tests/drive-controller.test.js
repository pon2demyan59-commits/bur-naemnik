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

test('an off-center drill enters a one-cell passage without sticking to its corner',()=>{
  for(const offset of [-25,-17,17,25]) {
    const solid=(x,y)=>x>=3 && y!==2;
    let state={x:148,y:160+offset,angle:0,speed:240};
    assert.ok(driveFits(state.x,state.y,solid));
    for(let i=0;i<120;i++) {
      state=driveStep(state,'right',1/60,solid);
      assert.ok(driveFits(state.x,state.y,solid));
    }
    assert.ok(state.x>500, 'failed to enter the passage from offset '+offset);
    assert.ok(Math.abs(state.y-160)<1);
  }
});
test('passage assistance works vertically and cannot open a blocked passage',()=>{
  const solid=(x,y)=>(y>=3&&x!==2)||y>=6;
  let state={x:184,y:148,angle:90,speed:240};
  for(let i=0;i<180;i++) {
    state=driveStep(state,'down',1/60,solid);
    assert.ok(driveFits(state.x,state.y,solid));
  }
  assert.ok(Math.abs(state.x-160)<1);
  assert.ok(state.y>300&&state.y<=363);
});

test('off-center entry assistance works in all four directions',()=>{
  for(const direction of ['right','left','down','up']) {
    const horizontal=direction==='left'||direction==='right';
    const positive=direction==='right'||direction==='down';
    const solid=(x,y)=> (positive?(horizontal?x:y)>=3:(horizontal?x:y)<=1) && (horizontal?y:x)!==2;
    const position=positive?148:172;
    let state={x:horizontal?position:183,y:horizontal?183:position,angle:{right:0,left:180,down:90,up:-90}[direction],speed:240};
    for(let i=0;i<120;i++) {
      state=driveStep(state,direction,1/60,solid);
      assert.ok(driveFits(state.x,state.y,solid));
    }
    const forward=horizontal?state.x:state.y;
    assert.ok(positive?forward>500:forward< -180,direction+' remained stuck');
    assert.ok(Math.abs((horizontal?state.y:state.x)-160)<1);
  }
});

test('sliding along every building edge preserves speed with keyboard and analog input',()=>{
 const solid=()=>false;solid.rectangles=[{x:200,y:200,width:1600,height:1600}];
 const cases=[
  [{x:179,y:400,angle:84,speed:280},'down',{x:.1,y:1,strength:1},'y',1],
  [{x:1821,y:1500,angle:-96,speed:280},'up',{x:-.1,y:-1,strength:1},'y',-1],
  [{x:400,y:179,angle:6,speed:280},'right',{x:1,y:.1,strength:1},'x',1],
  [{x:1500,y:1821,angle:-174,speed:280},'left',{x:-1,y:-.1,strength:1},'x',-1]
 ];
 for(const [start,key,stick,axis,sign] of cases)for(const input of [key,stick]){
  let s={...start};for(let i=0;i<120;i++){s=driveStep(s,input,1/60,solid);assert.ok(driveFits(s.x,s.y,solid));assert.ok(s.speed>260);assert.equal(s.blocked,false);}
  assert.ok((s[axis]-start[axis])*sign>540);
 }
});
test('a one-cell concrete corridor remains drivable while touching either foundation',()=>{
 const solid=()=>false;solid.rectangles=[{x:0,y:0,width:256,height:2000},{x:320,y:0,width:256,height:2000}];
 for(const [x,dx] of [[277,-.1],[299,.1]]){let s={x,y:300,angle:90,speed:280};for(let i=0;i<120;i++){s=driveStep(s,{x:dx,y:1,strength:1},1/60,solid);assert.ok(driveFits(s.x,s.y,solid));assert.ok(s.speed>260);}assert.ok(s.y>840);}
});
test('wall sliding still stops frontal impacts and sealed corners, including long frames',()=>{
 const wall=()=>false;wall.rectangles=[{x:200,y:0,width:200,height:2000}];
 for(const dt of [1/120,1/30,.2]){let s={x:179,y:400,angle:12,speed:280};for(let i=0;i<60;i++){s=driveStep(s,'right',dt,wall);assert.ok(driveFits(s.x,s.y,wall));}assert.equal(s.speed,0);assert.ok(s.y<401);}
 const corner=()=>false;corner.rectangles=[{x:200,y:0,width:200,height:400},{x:0,y:200,width:400,height:200}];let s={x:179,y:179,angle:45,speed:280};for(let i=0;i<60;i++){s=driveStep(s,{x:1,y:1,strength:1},.2,corner);assert.ok(driveFits(s.x,s.y,corner));}assert.equal(s.speed,0);assert.equal(s.x,179);assert.equal(s.y,179);
});
