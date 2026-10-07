import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BaseWorld, CELL } from '../src/base-state.js';
import { FloorWorld } from '../src/lift-state.js';
import { restoreWorkshop, TOOLS_SITE, MECHANIC_SITE, WORKSHOP_BLOCKS, WORKSHOP_BODY, WORKSHOP_DECK, nearWorkshopItem, onWorkshopDeck, canRestoreWorkshop, buyWorkshopUpgrade, workshopPrice } from '../src/workshop-state.js';
import { driveFits } from '../src/drive-controller.js';
import { STORY_LINES, storyPresentation } from '../src/story-content.js';
globalThis.Phaser={Scene:class {}};
const { Base }=await import('../src/base-scene.js');
test('workshop brief preserves every approved speaker and phrase',()=>{
 const canon=readFileSync(new URL('../docs/canon-miro.txt',import.meta.url),'utf8');
 const lines=canon.split('Диалог перед поездкой\n')[1].split('Инопланетные руды')[0].trim().split('\n');
 assert.deepEqual(STORY_LINES.workshop,lines.map(line=>{const i=line.indexOf(': ');return {speaker:line.slice(0,i),text:line.slice(i+2)};}));
 assert.equal(storyPresentation('mechanic',0).portrait,'konstantin-portrait.webp');
 assert.equal(storyPresentation('mechanic',0).role,'МЕХАНИК');
});
test('tools and mechanic have reachable excavatable sites and survive return travel and reload',()=>{
 const floor=new FloorWorld();for(const site of [TOOLS_SITE,MECHANIC_SITE]) {
  assert.equal(floor.blocked(site.x,site.y),false);assert.equal(floor.blocked(site.x-1,site.y),true);
  assert.equal(nearWorkshopItem({x:(site.x+.5)*CELL-54,y:(site.y+.5)*CELL},site),true);
  assert.equal(nearWorkshopItem({x:(site.x+.5)*CELL-80,y:(site.y+.5)*CELL},site),false);
 }
 const scene=new Base();scene.floorNumber=1;scene.world=floor;scene.workshopQuest=restoreWorkshop({briefed:true});scene.campaign={base:{rescued:true,porodnikPowered:true}};scene.cargo=12;scene.credits=35;scene.rig={x:1200,y:1500,angle:-90};
 const hidden={setVisible(){}};scene.toolsArt=hidden;scene.toolsMarker=hidden;scene.mechanic=hidden;scene.mechanicMarker=hidden;scene.mechanicPassenger=hidden;
 scene.notify=()=>{};scene.refreshHUD=()=>{};scene.persist=()=>{};let stories=0;scene.startStory=()=>stories++;
 scene.collectWorkshopItem('tools');scene.collectWorkshopItem('tools');scene.collectWorkshopItem('mechanic');scene.collectWorkshopItem('mechanic');assert.equal(stories,1);
 const save=JSON.parse(JSON.stringify(scene.snapshotCampaign()));const q=restoreWorkshop(save.workshopQuest);
 assert.equal(q.tools,true);assert.equal(q.mechanic,true);assert.equal(save.cargo,12);assert.equal(save.credits,35);assert.equal(save.base.porodnikPowered,true);
 assert.equal(canRestoreWorkshop(q,new BaseWorld()),false);
});
test('workshop requires both delivered items and cleared entrance; body stays solid and bay is driveable',()=>{
 const world=new BaseWorld();const q=restoreWorkshop({briefed:true,tools:true,mechanic:true,returnBriefed:true});
 assert.equal(canRestoreWorkshop(q,world),false);
 WORKSHOP_BLOCKS.forEach(p=>world.drill(p.x,p.y,1));assert.equal(canRestoreWorkshop(q,world),true);
 q.mechanic=false;assert.equal(canRestoreWorkshop(q,world),false);q.mechanic=true;q.tools=false;assert.equal(canRestoreWorkshop(q,world),false);
 const solid=(x,y)=>world.blocked(x,y)||!world.inside(x,y);solid.rectangles=[WORKSHOP_BODY];
 assert.equal(driveFits(WORKSHOP_BODY.x+160,WORKSHOP_BODY.y+80,solid),false);
 const rig={x:WORKSHOP_DECK.x+96,y:WORKSHOP_DECK.y+64};assert.equal(driveFits(rig.x,rig.y,solid),true);assert.equal(onWorkshopDeck(rig),true);
});
test('first upgrade needs an open workshop and sufficient credits, gives additive two percent and persists',()=>{
 const q=restoreWorkshop();assert.equal(workshopPrice(q),100);assert.equal(buyWorkshopUpgrade(q,1000).bought,false);
 q.ready=true;assert.deepEqual(buyWorkshopUpgrade(q,99),{bought:false,credits:99});
 const first=buyWorkshopUpgrade(q,100);assert.deepEqual(first,{bought:true,credits:0});assert.equal(q.upgrades,1);assert.equal(1+q.upgrades*.02,1.02);
 assert.equal(workshopPrice(q),125);assert.equal(restoreWorkshop(JSON.parse(JSON.stringify(q))).upgrades,1);
 q.upgrades=100;assert.equal(buyWorkshopUpgrade(q,Number.MAX_SAFE_INTEGER).bought,false);
 assert.equal(restoreWorkshop(null).upgrades,0);
});
test('pending quest dialogue restores its phrase across scenes and does not skip base return',()=>{
 const q=restoreWorkshop({briefed:true,mechanic:true,dialogue:'mechanic',dialoguePage:2});
 assert.equal(restoreWorkshop(JSON.parse(JSON.stringify(q))).dialoguePage,2);
 assert.equal(q.returnBriefed,false);assert.equal(q.ready,false);
});
