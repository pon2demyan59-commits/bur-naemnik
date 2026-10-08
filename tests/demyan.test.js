import test from 'node:test';
import assert from 'node:assert/strict';
import { restoreDemyan, canEvacuateDemyan, DEMYAN_ENTRANCE, DEMYAN_GUARDS, DEMYAN_SITE, beginHeadquarters, stepHeadquarters, demyanGeometry, HQ_RECIPE } from '../src/demyan-state.js';
import { demyanMethods } from '../src/demyan-scene.js';
import { FloorWorld, ownedKeycards, questKeycard, liftDestinations } from '../src/lift-state.js';
import { restoreSpider } from '../src/combat-state.js';
import { storyPresentation } from '../src/story-content.js';
import { restoreRewards, claimQuestReward } from '../src/quest-rewards.js';
globalThis.Phaser={Scene:class{}};
const {Base}=await import('../src/base-scene.js');
test('old warehouse saves start the signal, fifth-floor access waits for its completed briefing',()=>{
 globalThis.document={querySelector:()=>({open:false})};const s=new Base();s.sys={settings:{key:'Base'}};s.init({save:{progress:{base:{rescued:true,heard:true},constructionQuest:{rescued:true,unlocked:true,warehouse:true}}}});
 s.rig={x:22.5*64,y:26.5*64,angle:0};let story;s.startStory=k=>story=k;s.checkDemyan();assert.equal(story,'demyanBrief');assert.ok(!s.snapshotCampaign().keycards.includes(5));
 s.notify=()=>{};s.finishDemyanStory('demyanBrief');const p=s.snapshotCampaign();assert.ok(ownedKeycards(p).includes(5));assert.equal(questKeycard(p),5);assert.equal(liftDestinations(p).find(d=>d.floor===5).enabled,true);
 s.demyanQuest.rescued=true;assert.equal(questKeycard(s.snapshotCampaign()),null);assert.ok(s.snapshotCampaign().keycards.includes(5));
});
test('rescue requires briefing contact, three entrance blocks and all eight finite enemies',()=>{
 const w=new FloorWorld({},5),q=restoreDemyan({briefed:true,contact:true}),spiders=DEMYAN_GUARDS.map((p,id)=>restoreSpider(null,p,id));assert.equal(w.floor,5);assert.equal(w.blocked(DEMYAN_SITE.x,DEMYAN_SITE.y),false);
 assert.equal(canEvacuateDemyan(q,w,spiders),false);DEMYAN_ENTRANCE.forEach(p=>w.drill(p.x,p.y,100));assert.equal(canEvacuateDemyan(q,w,spiders),false);
 spiders.forEach(s=>s.hp=0);assert.equal(canEvacuateDemyan(q,w,spiders),true);q.evacuating=true;assert.equal(canEvacuateDemyan(q,w,spiders),false);
});
test('real evacuation navigation seats three people before Demyan and completes once',()=>{
 const w=new FloorWorld({},5);for(let y=28;y<=33;y++)for(let x=32;x<=37;x++)w.cleared.add(y*50+x);
 const root=()=>({visible:false,x:35.5*64,y:31.5*64,setPosition(x,y){this.x=x;this.y=y;return this;},setVisible(v){this.visible=false;return this;}});
 const q=restoreDemyan({briefed:true,contact:true,evacuating:true}),person=root(),events=[];
 const s={floorNumber:5,demyanQuest:q,world:w,rig:{x:32.5*64,y:30.5*64},demyanPerson:person,demyanGun:{},demyanCooldown:0,evacPathTime:0,spiders:[],evacuees:Array.from({length:3},(_,i)=>({x:(34.5+i)*64,y:29.5*64,root:root(),path:[]})),demyanPassenger:root(),driveSolids:()=>((x,y)=>!w.inside(x,y)||w.blocked(x,y)),notify:m=>events.push(m),persist(){},refreshHUD(){},startStory:k=>events.push(k)};
 for(let i=0;i<800&&!q.rescued;i++)demyanMethods.updateDemyan.call(s,50);
 assert.equal(q.evacuated,3);assert.equal(q.rescued,true);assert.equal(q.evacuating,false);assert.equal(events.at(-1),'demyanRescue');assert.equal(events.filter(e=>e==='demyanRescue').length,1);
 demyanMethods.updateDemyan.call(s,50);assert.equal(events.filter(e=>e==='demyanRescue').length,1);
});
test('headquarters consumes combined cargo and warehouse once and resumes fifteen-second construction',()=>{
 const q=restoreDemyan({rescued:true,returned:true,plot:{x:12,y:15}}),cargo={earth:80,stone:30,iron:5},stock={earth:20,stone:30,iron:5};
 const missing={...cargo,iron:4};assert.equal(beginHeadquarters(q,missing,stock),false);assert.equal(stock.iron,5);
 assert.equal(beginHeadquarters(q,cargo,stock),true);assert.deepEqual(cargo,{});assert.deepEqual(stock,{});assert.equal(beginHeadquarters(q,{...HQ_RECIPE},{}),false);
 for(let i=0;i<100;i++)stepHeadquarters(q,50);const restored=restoreDemyan(JSON.parse(JSON.stringify(q)));assert.equal(restored.remaining,10000);
 let completions=0;for(let i=0;i<210;i++)if(stepHeadquarters(restored,50))completions++;assert.equal(completions,1);assert.equal(restored.hq,true);
 const g=demyanGeometry(restored);assert.equal(g.footprint.width/64*g.footprint.height/64,72);assert.equal(g.body.height+g.deck.height+64,g.footprint.height);
});
test('fifth-floor campaign, partial evacuation, dialogue page and HQ survive reload and emergency return',()=>{
 const s=new Base();s.sys={settings:{key:'Floor'}};s.init({save:{progress:{floor:5,base:{rescued:true},demyanQuest:{briefed:true,contact:true,evacuating:true,evacuated:2,dialogue:'demyanBrief',dialoguePage:6},combat:{floor5:[{id:0,hp:0}]}}}});
 assert.equal(s.floorNumber,5);assert.equal(s.world.floor,5);assert.equal(s.demyanQuest.dialoguePage,6);s.rig={x:25.5*64,y:7.5*64,angle:0};const saved=s.snapshotCampaign();assert.equal(saved.demyanQuest.evacuated,2);assert.equal(saved.combat.floor5[0].hp,0);
 let returned;s.scene={start:(key,args)=>returned=args.save.progress};s.emergencyReturn();assert.equal(returned.floor,0);assert.equal(returned.demyanQuest.evacuated,2);assert.equal(returned.combat.floor5[0].hp,0);
});
test('Demyan identity and one-time quest rewards survive save migration',()=>{
 assert.equal(storyPresentation('demyanReturn',1).role,'НАЧАЛЬНИК ШТАБА');assert.equal(storyPresentation('demyanReturn',1).portrait,'demyan-portrait.webp');
 const ids=restoreRewards({demyanQuest:{rescued:true,returned:true,hq:true}});assert.ok(ids.includes('hqReady'));assert.equal(claimQuestReward(ids,'hqReady',0).amount,0);
});

test('HQ placement rejects an exactly overlapping building and a parked rig',()=>{
 const q=restoreDemyan({rescued:true,returned:true,plot:{x:12,y:12}}),geom=demyanGeometry(q);
 const s={demyanQuest:q,world:{blocked:()=>false},rig:{x:0,y:0},occupiedBuildingGeometries:()=>[{...geom,kind:'hq'},geom]};
 assert.match(demyanMethods.headquartersError.call(s),/другая постройка/);
 s.occupiedBuildingGeometries=()=>[{...geom,kind:'hq'}];s.rig={x:13*64,y:13*64};assert.match(demyanMethods.headquartersError.call(s),/Бур/);
 s.rig={x:0,y:0};assert.equal(demyanMethods.headquartersError.call(s),null);
});

test('expanded HQ keeps an old edge placement inside the base without losing progress',()=>{
 const q=restoreDemyan({rescued:true,returned:true,hq:true,plot:{x:43,y:43}});
 const f=demyanGeometry(q).footprint;assert.ok(f.x+f.width<=48*64);assert.ok(f.y+f.height<=48*64);assert.equal(q.hq,true);
 const building=restoreDemyan({rescued:true,returned:true,plot:{x:43,y:43},remaining:8000});assert.equal(building.remaining,8000);assert.deepEqual(building.plot,q.plot);
});
