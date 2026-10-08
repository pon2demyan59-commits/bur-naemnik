import { rollBonusCache, collectBonusCache, formatBonusLoot, bonusLootDetails } from './bonus-cache-state.js';
import { CELL } from './base-state.js';
export const bonusCacheMethods={
 makeBonusCaches(){this.bonusCacheViews=new Map();this.renderBonusCaches();},
 renderBonusCaches(){
  if(!this.bonusCacheViews||!this.floorNumber)return;
  const active=new Set((this.bonusCaches||[]).map(c=>c.y*50+c.x));
  for(const [key,view] of this.bonusCacheViews)if(!active.has(key)){view.destroy();this.bonusCacheViews.delete(key);}
  for(const cache of this.bonusCaches||[]){const key=cache.y*50+cache.x;if(this.bonusCacheViews.has(key))continue;
   const root=this.add.container((cache.x+.5)*CELL,(cache.y+.5)*CELL).setDepth(13);
   const glow=this.add.ellipse(0,4,58,42,0xffd276,.25),art=this.add.image(0,-8,'bonus-cache').setDisplaySize(62,62),label=this.add.text(0,-43,'ТАЙНИК',{fontFamily:'Arial',fontSize:'13px',fontStyle:'bold',color:'#ffe3a1',backgroundColor:'#263e33',padding:{x:5,y:3}}).setOrigin(.5);root.add([glow,art,label]);this.bonusCacheViews.set(key,root);
  }
 },
 findBonusCacheInBrokenBlock(x,y){
  const cache=rollBonusCache(this.floorNumber,x,y);if(!cache)return null;
  this.bonusCaches ||= [];this.bonusCaches.push(cache);const received=collectBonusCache(cache,this);this.bonusCaches=this.bonusCaches.filter(c=>c.items.length);this.renderBonusCaches();this.persist();
  this.showBonusBoxDiscovery('Бонусный тайник',received.length?'Запасы уже добавлены в твой инвентарь.':'Освободи грузовой отсек — тайник останется здесь.',received,bonusLootDetails(cache.items));for(const a of received)if(a.kind==='artifact')this.showDiscovery({kind:'artifact',id:a.id,name:a.name,rarity:a.rarity});return cache;
 },
 bonusCacheAction(){if(!this.floorNumber)return null;return (this.bonusCaches||[]).find(c=>Math.hypot(this.rig.x-(c.x+.5)*CELL,this.rig.y-(c.y+.5)*CELL)<1.5*CELL)||null;},
 interactBonusCache(){
  const cache=this.bonusCacheAction();if(!cache)return false;
  const received=collectBonusCache(cache,this);if(!received.length){this.notify('ТАЙНИК НА МЕСТЕ · Освободи грузовой отсек, чтобы забрать материалы.');return true;}
  this.bonusCaches=this.bonusCaches.filter(c=>c.items.length);this.renderBonusCaches();this.refreshHUD();this.persist();
  this.showBonusBoxDiscovery('Запасы из тайника',cache.items.length?'Часть запасов остаётся на месте находки.':'Тайник полностью разобран.',received,bonusLootDetails(cache.items));return true;
 }
};
