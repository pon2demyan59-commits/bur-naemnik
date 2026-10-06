import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STORY_LINES, storyPresentation } from '../src/story-content.js';
import { BaseWorld } from '../src/base-state.js';
const canon=readFileSync(new URL('../docs/canon-miro.txt',import.meta.url),'utf8');
test('radio and complete rescued-builder speech exactly match approved source',()=>{
 assert.equal(STORY_LINES.radio[0],canon.match(/«(Кто-нибудь….*?)»/)[1]);
 assert.equal(STORY_LINES.rescue.join(' '),canon.match(/«(Живой….*?)»/)[1]);
});
test('saved dialogue restores its current phrase independently of rescue and excavation',()=>{
 const w=new BaseWorld({rescued:true,dialogue:'rescue',dialoguePage:2,cleared:[1324,1325,1326]});
 const restored=new BaseWorld(JSON.parse(JSON.stringify(w.snapshot())));
 assert.equal(restored.dialogue,'rescue');assert.equal(restored.dialoguePage,2);assert.equal(restored.rescued,true);assert.equal(restored.cleared.size,3);
});
test('Porodnik dialogue exactly matches every approved speaker and phrase',()=>{
 const section=canon.split('Согласованный диалог\n')[1].split('После расчистки и восстановления питания')[0].trim();
 assert.deepEqual(STORY_LINES.porodnik,section.split('\n').map(line=>{const split=line.indexOf(': ');return {speaker:line.slice(0,split),text:line.slice(split+2)};}));
});
test('Porodnik conversation restores late pages and completion flag',()=>{
 const w=new BaseWorld({rescued:true,liftAnnounced:true,dialogue:'porodnik',dialoguePage:6});
 const restored=new BaseWorld(JSON.parse(JSON.stringify(w.snapshot())));
 assert.equal(restored.dialoguePage,6);assert.equal(restored.dialogue,'porodnik');assert.equal(restored.porodnikBriefed,false);
 w.porodnikBriefed=true;assert.equal(new BaseWorld(w.snapshot()).porodnikBriefed,true);
});

test('keycard portrait appears only during lift-related rescue phrases',()=>{
 assert.equal(storyPresentation('radio',0).portrait,'serega-neutral.webp');
 for(let i=0;i<2;i++)assert.equal(storyPresentation('rescue',i).portrait,'serega-neutral.webp');
 for(let i=2;i<4;i++)assert.equal(storyPresentation('rescue',i).portrait,'serega-portrait.webp');
 for(let i=0;i<8;i++)assert.equal(storyPresentation('porodnik',i).portrait,'serega-neutral.webp');
});
