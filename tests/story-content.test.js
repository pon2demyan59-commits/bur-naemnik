import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STORY_LINES } from '../src/story-content.js';
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
