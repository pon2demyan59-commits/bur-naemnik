import { claimFloorClear, remainingFloorBlocks, floorClearReward } from './floor-clear-state.js';
export const floorClearMethods={
 checkFloorClear(){
  if(!this.world?.cleared||this.discoveryActive||this.storyActive||this.busy||this.leaving)return;
  if(this.lastClearSize===this.world.cleared.size)return;this.lastClearSize=this.world.cleared.size;
  this.blocksRemaining=remainingFloorBlocks(this.world);const reward=claimFloorClear(this,this.world,this.floorNumber);this.renderFloorClearProgress();
  if(reward){this.refreshHUD();this.persist();this.showDiscovery({kind:'floor-clear',name:this.floorNumber?'Этаж '+this.floorNumber+' расчищен':'База полностью расчищена',description:'Награда за полную расчистку',note:'Эта территория больше не обрушится. Оставшуюся породу можно забрать в любое время.',rewards:[{kind:'credits',name:'Кредиты',count:reward}]});}
 },
 renderFloorClearProgress(){
  const el=document.querySelector('#floor-clear-progress');if(!el)return;el.textContent=this.clearedFloors?.includes(this.floorNumber)?'✓ РАСЧИЩЕНО · ОБВАЛОВ НЕ БУДЕТ':this.blocksRemaining==null?'':`До полной расчистки: ${this.blocksRemaining} блоков · +${floorClearReward(this.floorNumber)} кр.`;
 }
};
