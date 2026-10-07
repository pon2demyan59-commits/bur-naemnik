import test from 'node:test';
import assert from 'node:assert/strict';
import { preparePeopleFrames, updatePerson } from '../src/people-view.js';
test('worker sheet has separate four-pose rows, reused on scene changes',()=>{
  const frames=new Map();
  const texture={getSourceImage:()=>({width:1024,height:768}),has:key=>frames.has(key),add:(key,...rect)=>frames.set(key,rect)};
  preparePeopleFrames({textures:{get:()=>texture}});
  preparePeopleFrames({textures:{get:()=>texture}});
  assert.equal(frames.size,12);
  assert.deepEqual(frames.get('armorer-3'),[0,768,512,256,256]);
});
test('rescued people stop animating; visible workers wave and rest without moving their position',()=>{
  const poses=new Set();
  const person={visible:true,x:10,y:20,workerName:'mechanic',workerTime:0,workerArt:{
    frame:{width:256,height:256},setFrame(key){poses.add(key);},setScale(){},setAlpha(){},
  }};
  person.workerPrevious=person.workerArt;person.workerPose=0;person.workerBlend=1;
  for(let i=0;i<140;i++)updatePerson(person,50,{x:500,y:500});
  assert.deepEqual([...poses].sort(),[0,1,2].map(n=>'mechanic-'+n));
  assert.equal(person.x,10);assert.equal(person.y,20);
  person.visible=false;const time=person.workerTime;
  updatePerson(person,50);assert.equal(person.workerTime,time);
});
