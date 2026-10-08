import { showGamePanel } from './game-menus.js';
import { MATERIALS } from './materials.js';
import { MATERIAL_PRICES, cargoCount, quoteCargo, takeCargoSale } from './cargo-state.js';
import { onPorodnikDeck } from './porodnik-state.js';
export const cargoMethods={
 openPorodnik(){
  if(this.porodnikJob||!this.world.porodnikPowered||!onPorodnikDeck(this.rig,this.buildingDeck('porodnik'))||!this.cargo)return;
  this.dialogClosed();this.persist();
  const panel=document.createElement('div');panel.className='porodnik-console';
  const intro=document.createElement('p');intro.className='porodnik-intro';intro.textContent='Выбери блоки для продажи. Остальное останется в буре.';
  const toolbar=document.createElement('div');toolbar.className='porodnik-toolbar';
  const list=document.createElement('div');list.className='porodnik-grid';
  const rows=[],selection=()=>Object.fromEntries(rows.filter(r=>r.check.checked).map(r=>{const n=Number(r.input.value);return [r.id,Number.isFinite(n)?Math.max(0,Math.min(r.count,Math.floor(n))):0];}));
  const summary=document.createElement('div');summary.className='porodnik-summary';summary.setAttribute('aria-live','polite');
  const metrics=['Продать блоков','Останется в буре','Выручка'].map(label=>{const cell=document.createElement('div'),caption=document.createElement('span'),value=document.createElement('strong');caption.textContent=label;cell.append(caption,value);summary.append(cell);return value;});
  const footer=document.createElement('div');footer.className='porodnik-footer';
  const sell=document.createElement('button');sell.className='metal-button porodnik-sell';sell.textContent='ПРОДАТЬ · 10 СЕК';
  const render=()=>{const quote=quoteCargo(this.cargoHold,selection(),this.collectionBuffs?.sale||0);metrics[0].textContent=String(quote.amount);metrics[1].textContent=String(this.cargo-quote.amount);metrics[2].textContent=quote.payout+' кр.';sell.disabled=!quote.amount;for(const r of rows)r.row.classList.toggle('is-selected',r.check.checked);};
  for(const m of MATERIALS){
   const count=this.cargoHold[m.id]||0;if(!count)continue;
   const row=document.createElement('div');row.className='porodnik-material';row.dataset.material=m.id;
   const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=m.id==='earth';check.setAttribute('aria-label','Продать: '+m.name);
   const art=document.createElement('span');art.className='porodnik-block-stage';art.setAttribute('aria-hidden','true');const block=document.createElement('span');block.className='porodnik-block';const slot=m.frames[0];block.style.backgroundPosition=((slot%4)*100/3)+'% '+(Math.floor(slot/4)*100/3)+'%';art.append(block);
   const name=document.createElement('strong'),details=document.createElement('span');name.className='porodnik-material-name';name.textContent=m.name;details.className='porodnik-material-details';details.textContent='В буре: '+count+' · '+MATERIAL_PRICES[m.id]+' кр./блок';label.append(check,art,name,details);
   const input=document.createElement('input');input.type='number';input.min='0';input.max=String(count);input.step='1';input.value=String(count);input.setAttribute('aria-label','Количество: '+m.name);
   const stepper=document.createElement('div');stepper.className='porodnik-quantity';
   const minus=document.createElement('button'),plus=document.createElement('button'),all=document.createElement('button');minus.type=plus.type=all.type='button';minus.textContent='−';plus.textContent='+';all.textContent='ВСЁ';minus.setAttribute('aria-label','Уменьшить: '+m.name);plus.setAttribute('aria-label','Увеличить: '+m.name);all.setAttribute('aria-label','Все блоки: '+m.name);
   const enabled=()=>{input.disabled=minus.disabled=plus.disabled=all.disabled=!check.checked;};enabled();
   const step=delta=>{input.value=String(Math.max(0,Math.min(count,(Number(input.value)||0)+delta)));render();};minus.addEventListener('click',()=>step(-1));plus.addEventListener('click',()=>step(1));all.addEventListener('click',()=>{input.value=String(count);render();});
   check.addEventListener('change',()=>{enabled();render();});input.addEventListener('input',render);input.addEventListener('change',()=>{input.value=String(selection()[m.id]||0);render();});stepper.append(minus,input,plus,all);
   rows.push({id:m.id,count,check,input,row,enabled});row.append(label,stepper);list.append(row);
  }
  for(const [text,mode] of [['Всё','all'],['Только земля','earth'],['Снять выбор','none']]){const button=document.createElement('button');button.type='button';button.textContent=text;button.addEventListener('click',()=>{for(const r of rows){r.check.checked=mode==='all'||mode==='earth'&&r.id==='earth';r.enabled();}render();});toolbar.append(button);}
  sell.addEventListener('click',()=>{if(!this.sellCargo(selection()))return;document.querySelector('#dialog').close();this.dialogClosed();});
  const checkout=document.createElement('div');checkout.className='porodnik-checkout';footer.append(sell);checkout.append(summary,footer);panel.append(intro,toolbar,list,checkout);render();showGamePanel('ПОРОДНИК',panel,'porodnik');document.querySelector('#dialog').dataset.materialTypes=String(rows.length);const close=document.querySelector('.close-dialog');if(close)footer.append(close);

 },
 sellCargo(selection){
  if(this.porodnikJob||!this.world.porodnikPowered||!onPorodnikDeck(this.rig,this.buildingDeck('porodnik')))return false;
  const job=takeCargoSale(this.cargoHold,selection,this.collectionBuffs?.sale||0);if(!job)return false;
  this.porodnikJob=job;this.cargo=cargoCount(this.cargoHold);this.speed=0;this.refreshHUD();this.persist();return true;
 }
};

