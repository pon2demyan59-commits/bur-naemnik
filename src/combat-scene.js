import { CELL } from './base-state.js';
import { driveFits } from './drive-controller.js';
import { createFloorSpiders, restoreSpider, spiderSnapshot, nearestTarget, clearShot, clearWalk, findPath, moveEnemy, stepSpider, hitSpider, WEAPON_RANGE } from './combat-state.js';
import { DRILL_MAX_HP } from './repair-state.js';
import { makePerson } from './people-view.js';
export const combatMethods={
 makeCombat(){
  const texture=this.textures.get('spider'),source=texture.getSourceImage();
  for(let i=0;i<4;i++)if(!texture.has('walk-'+i))texture.add('walk-'+i,0,i*source.width/4,0,source.width/4,source.height);
  this.spiders=this.floorNumber===3?createFloorSpiders(this.campaign.combat?.floor3):[];
  this.spiderViews=[];this.allies=[];this.combatShots=[];this.weaponCooldown=Number.isFinite(this.campaign.combat?.cooldown)?Math.max(0,Math.min(1000,this.campaign.combat.cooldown)):0;
  this.combatTime=0;this.combatReady=true;
  if(this.floorNumber===3)this.createSpiderViews();
  if(!this.floorNumber&&this.repairQuest.wave==='active')this.beginDefense(this.campaign.combat?.wave);
 },
 createSpiderViews(){
  this.spiderViews=this.spiders.map(s=>{
   const root=this.add.container(s.x,s.y).setDepth(15);
   const shadow=this.add.ellipse(0,7,50,32,0x071919,.35);
   const art=this.add.image(0,0,'spider','walk-0').setDisplaySize(76,76);
   const bar=this.add.graphics();root.add([shadow,art,bar]);return {root,art,bar};
  });
 },
 combatSnapshot(){
  if(!this.combatReady)return {...(this.campaign.combat||{})};
  const combat={...(this.campaign.combat||{}),cooldown:this.weaponCooldown};
  if(this.floorNumber===3)combat.floor3=spiderSnapshot(this.spiders);
  if(!this.floorNumber&&this.repairQuest.wave==='active')combat.wave=spiderSnapshot(this.spiders);
  if(this.repairQuest.wave==='done')delete combat.wave;
  return combat;
 },
 beginDefense(saved){
  if(this.floorNumber||this.repairQuest.wave==='done'||this.spiders.length===20)return;
  this.repairQuest.wave='active';
  const solid=this.driveSolids(),start={x:this.rig.x,y:this.rig.y};
  // Spawn in the connected, excavated part of the base, never inside soil or buildings.
  const cells=[],queue=[{x:Math.floor(start.x/CELL),y:Math.floor(start.y/CELL)}],seen=new Set();
  for(let i=0;i<queue.length;i++){
   const p=queue[i],key=p.y*50+p.x;if(seen.has(key))continue;seen.add(key);
   const pos={x:(p.x+.5)*CELL,y:(p.y+.5)*CELL};
   if(!driveFits(pos.x,pos.y,solid,12))continue;
   cells.push(pos);
   if(cells.length>1500)break;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(p.x+dx>=2&&p.x+dx<48&&p.y+dy>=2&&p.y+dy<48)queue.push({x:p.x+dx,y:p.y+dy});
  }
  if(!cells.length)cells.push(start);
  const edge=cells.filter(p=>Math.hypot(p.x-start.x,p.y-start.y)>190&&Math.hypot(p.x-start.x,p.y-start.y)<850);
  const spawn=(edge.length?edge:cells).sort((a,b)=>Math.hypot(b.x-start.x,b.y-start.y)-Math.hypot(a.x-start.x,a.y-start.y));
  this.spiders=Array.from({length:20},(_,id)=>{
   const pos=spawn[(id*7)%spawn.length],site={x:Math.floor(pos.x/CELL),y:Math.floor(pos.y/CELL)};
   return restoreSpider(Array.isArray(saved)?saved.find(s=>s?.id===id):null,site,id);
  });
  this.createSpiderViews();
  ['serega','mechanic','armorer','ilya'].forEach((name,i)=>{
   const pos=cells[Math.min(cells.length-1,i+1)],root=makePerson(this,pos.x,pos.y,name).setDepth(16);
   const gun=this.add.graphics();gun.fillStyle(0x182b2d);gun.fillRoundedRect(-6,-4,26,8,2);gun.fillStyle(0x8d9c8a);gun.fillRect(18,-2,15,4);gun.setPosition(8,3);root.add(gun);
   this.allies.push({root,gun,x:pos.x,y:pos.y,cooldown:i*250,pathTime:0,path:[]});
  });
  this.refreshHUD();this.persist();
 },
 updateCombat(delta){
  const ms=Math.max(0,Math.min(delta,50)),dt=ms/1000,solid=this.driveSolids(),tutorial=!this.floorNumber&&this.repairQuest.wave==='active';
  this.combatTime+=ms;this.weaponCooldown=Math.max(0,this.weaponCooldown-ms);
  const safe=this.lift.contains(this.rig);
  for(const s of this.spiders){
   // Base enemies belong only to the finite tutorial wave, never to floor respawns.
   if(!this.floorNumber&&!tutorial)continue;
   const damage=stepSpider(s,this.rig,ms,solid,{tutorial,safe,world:this.world,onDig:(x,y,broken,spider)=>this.showMonsterDig(x,y,broken,spider)});
   if(damage){
    this.hull=Math.max(tutorial?1:0,this.hull-damage);
    const indicator=document.querySelector('#combat-hull');indicator?.classList.add('hull-hit');this.time.delayedCall(180,()=>indicator?.classList.remove('hull-hit'));
    if(this.hull<=0){this.emergencyReturn();return;}
   }
  }
  if(this.armoryQuest.installed&&this.weaponCooldown===0){
   const target=nearestTarget(this.rig,this.spiders,WEAPON_RANGE,solid);
   if(target){this.weaponCooldown=1000;if(this.weaponArt)this.weaponArt.rotation=Math.atan2(target.y-this.rig.y,target.x-this.rig.x)-this.rig.rotation;this.fireAt(this.rig,target,1+this.armoryQuest.weaponLevel*.02);this.animateWeaponShot?.();}
  }
  if(tutorial){
   for(const ally of this.allies){
    ally.cooldown=Math.max(0,ally.cooldown-ms);
    let target=nearestTarget(ally,this.spiders,3*CELL,solid);
    if(target){
     ally.gun.rotation=Math.atan2(target.y-ally.y,target.x-ally.x);
     if(ally.cooldown===0){ally.cooldown=1000;this.fireAt(ally,target,1);}
    }else{
     target=this.spiders.filter(s=>s.hp>0).sort((a,b)=>Math.hypot(a.x-ally.x,a.y-ally.y)-Math.hypot(b.x-ally.x,b.y-ally.y))[0];
     if(target){
      ally.pathTime-=ms;
      if(ally.pathTime<=0){ally.path=findPath(ally,target,solid);ally.pathTime=500;}
      while(ally.path.length&&Math.hypot(ally.path[0].x-ally.x,ally.path[0].y-ally.y)<5)ally.path.shift();
      if(clearWalk(ally,target,solid))moveEnemy(ally,target,dt,solid,100);
      else if(ally.path.length)moveEnemy(ally,ally.path[0],dt,solid,100);
      ally.root.setPosition(ally.x,ally.y);
     }
    }
   }
   if(this.spiders.every(s=>s.hp<=0)){
    this.repairQuest.wave='done';this.allies.forEach(a=>a.root.destroy());this.allies=[];
    this.spiderViews?.forEach(view=>view.root.destroy());this.spiderViews=[];this.spiders=[];
    this.refreshHUD();this.persist();this.startStory('waveComplete');
   }
  }
  this.renderCombat(ms);
  if(ms&&this.time.now-this.lastSave>1000)this.persist();
 },
 showMonsterDig(x,y,broken,spider){
  this.terrain.paintCell(x,y);
  if(broken){this.terrain.refreshAround(x,y);this.chipEmitter.emitParticleAt((x+.5)*CELL,(y+.5)*CELL,8);this.persist();}
  const cx=(x+.5)*CELL,cy=(y+.5)*CELL,dx=spider.x-cx,dy=spider.y-cy,distance=Math.max(1,Math.hypot(dx,dy));
  this.dustEmitter.emitParticleAt(cx+dx/distance*CELL/2,cy+dy/distance*CELL/2,broken?10:3);
 },
 fireAt(from,target,damage){
  this.combatShots.push({x:from.x,y:from.y,tx:target.x,ty:target.y,remaining:150});
  target.flash=130;
  if(hitSpider(target,damage)){
   const bag=this.floorNumber?this.carriedLoot:this.inventory;
   bag.fiber++;if(Math.random()<.001)bag.heads++;
   this.refreshHUD();this.persist();
  }
 },
 renderCombat(ms){
  const g=this.combatEffects;g.clear();
  this.combatShots=this.combatShots.filter(shot=>{
   shot.remaining-=ms;if(shot.remaining<=0)return false;
   g.lineStyle(2,0xffd47c,shot.remaining/150);g.lineBetween(shot.x,shot.y,shot.tx,shot.ty);
   g.fillStyle(0xffedb2,shot.remaining/150);g.fillCircle(shot.tx,shot.ty,4);return true;
  });
  this.spiders.forEach((s,i)=>{
   const view=this.spiderViews[i];if(!view)return;view.root.setVisible(s.hp>0).setPosition(s.x,s.y);
   const moving=Math.hypot(s.x-(s.lastX??s.x),s.y-(s.lastY??s.y))>.05;
   s.lastX=s.x;s.lastY=s.y;
   view.art.setFrame('walk-'+(moving||s.digging?Math.floor(this.combatTime/(s.digging?80:110)+i)%4:0)).setAngle(s.angle);
   s.flash=Math.max(0,(s.flash||0)-ms);view.art.setTint(s.flash?0xffca86:0xffffff);
   view.bar.clear();
   if(s.hp<3){view.bar.fillStyle(0x112523,.85);view.bar.fillRoundedRect(-20,-39,40,5,2);view.bar.fillStyle(0xf2b35d);view.bar.fillRoundedRect(-20,-39,40*s.hp/3,5,2);}
  });
  this.refreshCombatHUD();
 },
 refreshCombatHUD(){
  const node=document.querySelector('#combat-hull');if(!node)return;
  const text='Прочность '+Math.ceil(this.hull)+'/'+DRILL_MAX_HP;
  if(node.textContent!==text)node.textContent=text;
  node.classList.toggle('low-hull',this.hull<=5);
  const tip=document.querySelector('#combat-tip');
  tip.hidden=!this.armoryQuest.installed;
  tip.textContent=this.repairQuest.wave==='active'?'Учебная оборона · союзники прикрывают':'Пушка: автоогонь · 2 клетки';
  const loot=document.querySelector('#combat-loot');
  const fiber=(this.inventory.fiber||0)+(this.carriedLoot.fiber||0),heads=(this.inventory.heads||0)+(this.carriedLoot.heads||0);
  if(loot){loot.hidden=!fiber&&!heads;loot.textContent='Паучье волокно: '+fiber+(heads?' · Трофеи: '+heads:'');}
  if(!this.floorNumber&&this.repairQuest.wave==='active')this.refreshRepairHUD();
 },
 emergencyReturn(){
  if(this.busy)return;
  this.busy=true;this.speed=0;this.cargo=0;this.cargoHold={};this.carriedLoot={fiber:0,heads:0};
  this.campaign=this.snapshotCampaign();this.campaign.hull=DRILL_MAX_HP;
  this.campaign.location='base';this.campaign.floor=0;
  const base={...(this.campaign.base||{}),x:22,y:26,drive:{x:22.5*CELL,y:26.5*CELL,angle:0}};
  this.campaign.base=base;this.leaving=true;
  this.scene.start('Base',{save:{version:1,progress:this.campaign},emergency:true});
 }
};
