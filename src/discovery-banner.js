import { RARITY_NAMES } from './collection-catalog.js';
import { readSettings } from './storage.js';
export const DISCOVERY_COLORS=['#d6c79c','#99d796','#6ed8cf','#78b7ff','#b798ff','#ef8cd8','#ffad70','#ffe180','#ff837e','#f5ecff'];
export function discoveryDetails(item){
 const rarity=Math.max(1,Math.min(10,Number.isInteger(item.rarity)?item.rarity:1));
 if(item.kind==='artifact')return {eyebrow:'ПОЗДРАВЛЯЕМ!',heading:'ВЫ ОБНАРУЖИЛИ АРТЕФАКТ',name:item.name,description:RARITY_NAMES[rarity-1]+' · Редкость '+rarity+'/10',note:'Артефакт добавлен в коллекционный запас.',art:'discovery-artifact.svg',color:DISCOVERY_COLORS[rarity-1],rarity};
 if(item.kind==='keycard')return {eyebrow:'НОВЫЙ ПУТЬ ОТКРЫТ',heading:'ВЫ ПОЛУЧИЛИ КЛЮЧ-КАРТУ',name:'Карта '+item.floor+'-го этажа',description:'Грузовой лифт · Этаж '+item.floor,note:'Теперь можно выбрать этот этаж в пульте лифта.',art:'keycard.svg',color:'#8fe2cb',rarity:3};
 return {eyebrow:'ПОЗДРАВЛЯЕМ!',heading:item.kind==='blueprint'?'ВЫ ОБНАРУЖИЛИ ЧЕРТЁЖ':'ВЫ ОБНАРУЖИЛИ ЯЩИК',name:item.name||'Бонусный ящик',description:item.description||'Новая находка',note:item.note||'Содержимое получено.',art:item.kind==='blueprint'?'blueprint.svg':'discovery-crate.svg',color:'#ffd780',rarity:5};
}
export const discoveryMethods={
 showDiscovery(item){
  this.discoveryQueue ||= [];this.discoveryQueue.push({...item});
  if(!this.discoveryActive)this.openNextDiscovery();
 },
 showKeycardDiscovery(floor){
  this.discoveryCards ||= [];if(this.discoveryCards.includes(floor))return false;
  this.discoveryCards.push(floor);this.persist();this.showDiscovery({kind:'keycard',floor});return true;
 },
 showBonusBoxDiscovery(name='Бонусный ящик',contents='Содержимое получено'){
  this.showDiscovery({kind:'crate',name,description:'Бонусный ящик',note:contents});
 },
 openNextDiscovery(){
  const item=this.discoveryQueue?.shift();if(!item){this.discoveryActive=false;return;}
  const spec=discoveryDetails(item);this.discoveryActive=true;this.dialogClosed();this.speed=0;this.persist();
  const previousFocus=document.activeElement,dialog=document.createElement('dialog');dialog.className='discovery-dialog';dialog.setAttribute('aria-labelledby','discovery-heading');dialog.style.setProperty('--discovery-color',spec.color);
  const card=document.createElement('section');card.className='discovery-card';card.dataset.rarity=String(spec.rarity);
  const beams=document.createElement('div');beams.className='discovery-beams';beams.setAttribute('aria-hidden','true');
  const sparks=document.createElement('div');sparks.className='discovery-sparks';sparks.setAttribute('aria-hidden','true');for(let i=0;i<16;i++){const dot=document.createElement('i');dot.style.setProperty('--i',String(i));dot.style.setProperty('--top',String(15+(i*17)%65)+'%');sparks.append(dot);}
  const eyebrow=document.createElement('p');eyebrow.className='discovery-eyebrow';eyebrow.textContent=spec.eyebrow;
  const heading=document.createElement('h2');heading.id='discovery-heading';heading.textContent=spec.heading;
  const art=document.createElement('img');art.className='discovery-art';art.src='./public/assets/quests/'+spec.art;art.alt='';
  const name=document.createElement('strong');name.className='discovery-name';name.textContent=spec.name;
  const rarity=document.createElement('p');rarity.className='discovery-rarity';rarity.textContent=spec.description;
  const note=document.createElement('p');note.className='discovery-note';note.textContent=spec.note;
  const button=document.createElement('button');button.type='button';button.className='discovery-continue';button.textContent='ПРОДОЛЖИТЬ';
  card.append(beams,sparks,eyebrow,heading,art,name,rarity,note,button);dialog.append(card);document.querySelector('#ui').append(dialog);let closed=false;
  const cleanup=()=>{document.removeEventListener('keydown',keyboard,true);dialog.removeEventListener('cancel',cancel);dialog.remove();};
  const finish=()=>{if(closed)return;closed=true;cleanup();this.events.off('shutdown',abort);this.discoveryActive=false;
   if(this.discoveryQueue.length){this.openNextDiscovery();return;}
   this.input.enabled=true;this.scene.resume();this.dialogClosed();if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  };
  const keyboard=e=>{if(['Enter','Space','KeyE'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)finish();}else if(['Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD'].includes(e.code)){e.preventDefault();e.stopImmediatePropagation();}};
  const cancel=e=>e.preventDefault();const abort=()=>{closed=true;cleanup();this.discoveryActive=false;this.discoveryQueue=[];};
  document.addEventListener('keydown',keyboard,true);dialog.addEventListener('cancel',cancel);button.addEventListener('click',finish);this.events.once('shutdown',abort);
  dialog.showModal();button.focus({preventScroll:true});this.input.enabled=false;this.scene.pause();this.playDiscoveryFanfare(spec.rarity);
 },
 playDiscoveryFanfare(rarity){
  const ctx=this.sound?.context;if(!readSettings().sound||!ctx||ctx.state!=='running')return;
  [392,493.88,587.33,783.99].forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain(),at=ctx.currentTime+i*.11;osc.type='triangle';osc.frequency.value=hz*(rarity>=8?1.25:1);gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.035,at+.015);gain.gain.exponentialRampToValueAtTime(.001,at+.5);osc.connect(gain);gain.connect(ctx.destination);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(at);osc.stop(at+.55);});
 }
};
