import { WEAPON_CATALOG, WEAPON_COMPONENTS, weaponDefinition, weaponStats, weaponFullCost } from './weapon-catalog.js';
import { hasWeaponBlueprint, buyWeaponBlueprint, buyWeaponParts, weaponPartsPrice, weaponMissingParts, craftWeapon, equipCraftedWeapon, installWeapon, buyWeaponUpgrade, weaponUpgradePrice } from './armory-state.js';

export function createWeaponPanel(scene,onInstall){
 const q=scene.armoryQuest,panel=document.createElement('div');panel.className='weapon-console';
 const readout=document.createElement('p'),status=document.createElement('p'),catalog=document.createElement('div'),detail=document.createElement('section'),body=document.createElement('div'),exit=document.createElement('button');
 readout.className='service-readout';status.className='service-status';status.setAttribute('role','status');catalog.className='weapon-list';catalog.setAttribute('aria-label','Каталог оружия');detail.className='weapon-detail';body.className='weapon-browser';exit.className='floor-button';exit.textContent='ГОТОВО';body.append(catalog,detail);panel.append(readout,status,body,exit);
 let selected=q.equippedWeapon||'basic',signature='',message='';
 const node=(tag,text,className)=>{const el=document.createElement(tag);el.textContent=text;if(className)el.className=className;return el;};
 const number=n=>Number(n.toFixed(2)).toLocaleString('ru-RU');
 const metrics=(w,level=0)=>{const box=node('div','','weapon-metrics'),damage=w.damage*(1+level*.02+(scene.collectionBuffs?.weapon||0));for(const [label,value] of [['Урон',number(damage)],['Дальность',number(w.range)+' м'],['Скорострельность',number(1000/w.interval)+' /с'],['Урон в секунду',number(damage*1000/w.interval)]]){const item=node('div','','weapon-metric');item.append(node('small',label),node('strong',value));box.append(item);}return box;};
 const action=(label,disabled,run)=>{const button=node('button',label,'metal-button');button.disabled=disabled;button.addEventListener('click',()=>{run();scene.refreshMountedWeapon();scene.refreshHUD();scene.persist();render();});detail.append(button);};
 const pay=(result,text)=>{if(result.bought){scene.credits=result.credits;message=text;}};
 const mounted=()=>{onInstall();message='Оружейник устанавливает оружие.';};
 const render=()=>{
  const busy=q.serviceRemaining!=null,w=weaponDefinition(selected),stats=weaponStats(q,scene.collectionBuffs?.weapon||0);
  readout.textContent=`Кредиты: ${scene.credits}\n${q.installed?'На буре: '+weaponDefinition(q.equippedWeapon).name:'Пушка ещё не установлена'}${q.installed?'\nУрон: '+Number(stats.damage.toFixed(3)):''}`;
  status.textContent=`Кредиты: ${scene.credits} · `+(busy?`Оружейник работает · ${(q.serviceRemaining/1000).toFixed(1)} с`:(message||'Выбери оружие. Чертёж → материалы → изготовление → установка.'));exit.disabled=busy;
  const next=JSON.stringify([selected,scene.credits,q.weapons,q.components,q.blueprints,q.blueprint,q.weaponLevels,q.installed,q.equippedWeapon,busy]);if(next===signature)return;signature=next;
  catalog.replaceChildren();
  for(const entry of WEAPON_CATALOG){const button=node('button','','weapon-choice'+(entry.id===selected?' is-selected':''));button.setAttribute('aria-pressed',String(entry.id===selected));button.dataset.weapon=entry.id;const owned=q.weapons[entry.id]||0;button.append(node('span',entry.name),node('small',q.installed&&q.equippedWeapon===entry.id?'НА БУРЕ':owned?'В АРСЕНАЛЕ · '+owned:hasWeaponBlueprint(q,entry.id)?'ЧЕРТЁЖ ИЗУЧЕН':'НЕТ ЧЕРТЕЖА'),metrics(entry,q.weaponLevels[entry.id]||0),node('small',Object.entries(entry.recipe).map(([id,n])=>WEAPON_COMPONENTS.find(p=>p.id===id).name+' ×'+n).join(' · '),'weapon-card-materials'),node('strong',entry.id==='basic'?'ПЕРВАЯ ПУШКА · ПОДАРОК':'С НУЛЯ · '+weaponFullCost(entry).toLocaleString('ru-RU')+' КР.','weapon-card-price'));button.addEventListener('click',()=>{selected=entry.id;message='';render();});catalog.append(button);}
  detail.replaceChildren();const preview=node('div','','weapon-preview weapon-'+w.id);preview.setAttribute('aria-hidden','true');preview.append(node('i','','weapon-mount'),node('i','','weapon-barrels'));detail.append(preview,node('h3',w.name));
  const level=q.weaponLevels[w.id]||0;detail.append(metrics(w,level),node('p',`Уровень улучшения: ${level}/100 · Экземпляров: ${q.weapons[w.id]||0}`,'weapon-stats'),node('p',w.id==='basic'?'Первая пушка — подарок оружейника. Дополнительные экземпляры изготовляются по рецепту.':'Полный комплект с нуля: '+weaponFullCost(w).toLocaleString('ru-RU')+' кр. Включает чертёж и все материалы.','weapon-note'));
  if(!hasWeaponBlueprint(q,w.id)){
   detail.append(node('p',w.id==='basic'?'Чертёж находится на втором этаже, в оружейном шкафу.':'Оружейник может передать чертёж за кредиты.','weapon-note'));
   if(w.id!=='basic')action(`ИЗУЧИТЬ ЧЕРТЁЖ · ${w.blueprintPrice} КР.`,busy||scene.credits<w.blueprintPrice,()=>pay(buyWeaponBlueprint(q,w.id,scene.credits),'Чертёж изучен. Теперь доступны материалы и изготовление.'));
  }
  detail.append(node('h4','РЕЦЕПТ · 1 ЭКЗЕМПЛЯР'));
  const recipe=node('ul','','weapon-recipe');for(const [id,n] of Object.entries(w.recipe)){const owned=q.components[id]||0,part=WEAPON_COMPONENTS.find(p=>p.id===id);recipe.append(node('li',`${part.name} · ${owned}/${n} · ${part.price} кр./шт.`,owned>=n?'is-ready':'is-missing'));}detail.append(recipe);
  const price=weaponPartsPrice(q,w.id),known=hasWeaponBlueprint(q,w.id);
  detail.append(node('p','Материалы хранятся в оружейной. Пока производство сплавов не запущено, их можно закупать здесь.','weapon-note'));
  if(price)action(`ЗАКУПИТЬ НЕДОСТАЮЩЕЕ · ${price} КР.`,busy||!known||scene.credits<price,()=>pay(buyWeaponParts(q,w.id,scene.credits),'Материалы закуплены. Можно изготовить оружие.'));
  action('ИЗГОТОВИТЬ · 4 СЕКУНДЫ',busy||!known||weaponMissingParts(q,w.id).length>0,()=>{if(craftWeapon(q,w.id))message='Создаётся один экземпляр. После завершения установи его на бур.';});
  const equipped=q.installed&&q.equippedWeapon===w.id;
  action(equipped?'УСТАНОВЛЕНО НА БУРЕ':'УСТАНОВИТЬ · БЕСПЛАТНО',busy||!(q.weapons[w.id]||(w.id==='basic'&&q.gifted))||equipped,()=>{const ok=w.id==='basic'&&!q.installed&&q.gifted?installWeapon(q):equipCraftedWeapon(q,w.id);if(ok)mounted();});
  if(equipped)action(level>=100?'МАКСИМАЛЬНЫЙ УРОВЕНЬ':`УЛУЧШИТЬ +2% · ${weaponUpgradePrice(q)} КР.`,level>=100||scene.credits<weaponUpgradePrice(q),()=>pay(buyWeaponUpgrade(q,scene.credits,true),'Улучшение оплачено. Оно сохраняется у выбранного оружия.'));
 };
 exit.addEventListener('click',()=>{if(q.serviceRemaining==null){document.querySelector('#dialog').close();scene.checkRepair();}});
 render();return {panel,render};
}
