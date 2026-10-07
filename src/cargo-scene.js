import { MATERIALS } from './materials.js';
import { MATERIAL_PRICES, cargoCount, quoteCargo, takeCargoSale } from './cargo-state.js';
import { onPorodnikDeck } from './porodnik-state.js';
export const cargoMethods={
 openPorodnik(){
  if(this.porodnikJob||!this.world.porodnikPowered||!onPorodnikDeck(this.rig)||!this.cargo)return;
  this.dialogClosed();this.persist();
  const panel=document.createElement('div');panel.className='cargo-console';
  const intro=document.createElement('p');intro.textContent='Выбери породу и количество для продажи. Остальное останется в буре.';
  const list=document.createElement('div');list.className='cargo-list';
  const rows=[],selection=()=>Object.fromEntries(rows.filter(r=>r.check.checked).map(r=>[r.id,Math.max(0,Math.min(r.count,Math.floor(Number(r.input.value))))]));
  const total=document.createElement('p');total.className='cargo-total';
  const sell=document.createElement('button');sell.className='metal-button';sell.textContent='ПРОДАТЬ ВЫБРАННОЕ · ПЕРЕРАБОТКА 10 С';
  const render=()=>{const quote=quoteCargo(this.cargoHold,selection());total.textContent='Продать: '+quote.amount+' · Выручка: '+quote.payout+' кредитов · Оставить: '+(this.cargo-quote.amount);sell.disabled=!quote.amount;};
  for(const m of MATERIALS){
   const count=this.cargoHold[m.id]||0;if(!count)continue;
   const row=document.createElement('div');row.className='cargo-row';
   const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=m.id==='earth';
   const swatch=document.createElement('span');swatch.className='cargo-swatch';const slot=m.frames[0];swatch.style.backgroundPosition=((slot%4)*100/3)+'% '+(Math.floor(slot/4)*100/3)+'%';
   const caption=document.createElement('span'),name=document.createElement('strong'),details=document.createElement('small');
   name.textContent=m.name;details.textContent='В буре: '+count+' · '+MATERIAL_PRICES[m.id]+' кр./шт.';caption.append(name,details);label.append(check,swatch,caption);
   const input=document.createElement('input');input.type='number';input.min='1';input.max=String(count);input.step='1';input.value=String(count);input.disabled=!check.checked;input.setAttribute('aria-label','Количество: '+m.name);
   check.addEventListener('change',()=>{input.disabled=!check.checked;render();});input.addEventListener('input',render);
   rows.push({id:m.id,count,check,input});row.append(label,input);list.append(row);
  }
  sell.addEventListener('click',()=>{if(!this.sellCargo(selection()))return;document.querySelector('#dialog').close();this.dialogClosed();});
  panel.append(intro,list,total,sell);render();
  document.querySelector('#dialog-title').textContent='«ПОРОДНИК» · ПРОДАЖА ПОРОДЫ';document.querySelector('#dialog-body').replaceChildren(panel);document.querySelector('#dialog').showModal();
 },
 sellCargo(selection){
  if(this.porodnikJob||!this.world.porodnikPowered||!onPorodnikDeck(this.rig))return false;
  const job=takeCargoSale(this.cargoHold,selection);if(!job)return false;
  this.porodnikJob=job;this.cargo=cargoCount(this.cargoHold);this.speed=0;this.refreshHUD();this.persist();return true;
 }
};
