import { ARTIFACTS } from './artifact-catalog.js';
import { restoreArtifacts } from './artifact-state.js';
import { MATERIALS } from './materials.js';
import { restoreCargo, cargoCount } from './cargo-state.js';
import { ownedKeycards } from './lift-state.js';
import { DRILL_MAX_HP } from './repair-state.js';
export function campaignObjective(p={}){
 const c=p.constructionQuest||{};if(c.warehouse)return 'Склад построен';if(c.remaining!=null)return 'Строительство склада';if(c.unlocked)return 'Построить первый склад';if(c.briefed)return c.rescued?'Вернуть мастера на базу':'Найти строительного мастера';
 const b=p.base||p,w=p.workshopQuest||{},a=p.armoryQuest||{},r=p.repairQuest||{};
 if(r.wave==='done')return 'Первая атака отбита';
 if(r.wave==='active')return 'Защитить бункер';
 if(r.ready)return 'Ремонтный цех работает';
 if(r.briefed)return r.kit&&r.rescued?'Восстановить ремонтный цех':'Найти комплект и спасти Илью';
 if(a.ready)return a.installed?'Бур вооружён':'Установить первую пушку';
 if(a.briefed)return a.rescued&&a.blueprint?'Восстановить оружейную':'Спасти оружейника';
 if(w.ready)return w.upgrades?'Бур улучшен':'Улучшить бур';
 if(w.briefed)return w.tools&&w.mechanic?'Восстановить мастерскую':'Найти инструменты и механика';
 if(b.porodnikPowered)return 'Породник работает';
 if(b.liftAnnounced)return 'Запустить Породник';
 if(b.rescued)return 'Расчистить лифт';
 return 'Голос за завалом';
}
export function campaignSummary(p={}){
 const cargo=restoreCargo(p.cargoHold,p.cargo);
 return {location:p.location==='floor'?'Этаж '+(p.floor||1):'Бункер №72 · база',objective:campaignObjective(p),
  credits:p.credits||0,cargo:cargoCount(cargo),hull:Number.isFinite(p.hull)?Math.ceil(p.hull):DRILL_MAX_HP,
  power:100+(p.workshopQuest?.upgrades||0)*2};
}
function panelSection(panel,title){const section=document.createElement('section');section.className='terminal-section';const h=document.createElement('h3');h.textContent=title;section.append(h);panel.append(section);return section;}
function infoRow(section,label,value){const row=document.createElement('div');row.className='terminal-row';const name=document.createElement('span'),amount=document.createElement('strong');name.textContent=label;amount.textContent=value;row.append(name,amount);section.append(row);return row;}
export function createInventoryPanel(p={}){
 const panel=document.createElement('div');panel.className='inventory-panel';
 const summary=campaignSummary(p),cargo=restoreCargo(p.cargoHold,p.cargo);
 const radio=panelSection(panel,'Рация · текущее задание');
 infoRow(radio,'Задание',globalThis.document?.querySelector?.('#quest-name')?.textContent||campaignObjective(p));
 const message=document.createElement('p');message.className='terminal-note';message.textContent=globalThis.document?.querySelector?.('#radio-text')?.textContent||'';radio.append(message);
 const tracker=globalThis.document?.querySelector?.('#quest-status')?.textContent;if(tracker)infoRow(radio,'Ориентир',tracker);
 const rig=panelSection(panel,'Бур');
 infoRow(rig,'Прочность',summary.hull+'/'+DRILL_MAX_HP);infoRow(rig,'Мощность',summary.power+'%');
 infoRow(rig,'Кредиты',summary.credits);infoRow(rig,'Оружие',p.armoryQuest?.installed?'Пушка · '+(100+(p.armoryQuest.weaponLevel||0)*2)+'%':'Не установлено');
 const hold=panelSection(panel,'Грузовой отсек · '+summary.cargo+'/200');
 for(const m of MATERIALS)if(cargo[m.id])infoRow(hold,m.name,cargo[m.id]);
 if(!summary.cargo)infoRow(hold,'Отсек пуст','—');
 if(p.constructionQuest?.warehouse){const stock=panelSection(panel,'Запас на складе');for(const m of MATERIALS)if(p.constructionQuest.stock?.[m.id])infoRow(stock,m.name,p.constructionQuest.stock[m.id]);if(!Object.keys(p.constructionQuest.stock||{}).length)infoRow(stock,'Склад пуст','—');}
 const loot=panelSection(panel,'Добыча монстров');
 const fiber=(p.inventory?.fiber||0)+(p.carriedLoot?.fiber||0),heads=(p.inventory?.heads||0)+(p.carriedLoot?.heads||0);
 infoRow(loot,'Паучье волокно',fiber);if(heads)infoRow(loot,'Головы Шуршунов',heads);
 if(p.carriedLoot?.fiber||p.carriedLoot?.heads){const note=document.createElement('p');note.className='terminal-note';note.textContent='Добыча в буре будет доставлена в запас при возвращении на базу.';loot.append(note);}
 const items=panelSection(panel,'Сюжетные предметы');let count=0;
 for(const [has,label,asset] of [[p.workshopQuest?.tools&&!p.workshopQuest?.ready,'Инструменты','tools'],[p.armoryQuest?.blueprint,'Чертёж первой пушки','blueprint'],[p.constructionQuest?.unlocked,'Чертёж склада','blueprint'],[p.repairQuest?.kit&&!p.repairQuest?.ready,'Ремонтный комплект','repair-kit']])if(has){const row=infoRow(items,label,'Получено');row.className+=' quest-item-row';const img=document.createElement('img');img.src='./public/assets/quests/'+asset+'.svg';img.alt='';row.append(img);count++;}
 if(!count)infoRow(items,'Предметов пока нет','—');
 const artifacts=panelSection(panel,'Артефакты');const collection=restoreArtifacts(p.artifacts);let found=0;for(const a of ARTIFACTS)if(collection[a.id]){infoRow(artifacts,a.name,collection[a.id]);found++;}if(!found)infoRow(artifacts,'Артефактов пока нет','—');const artifactNote=document.createElement('p');artifactNote.className='terminal-note';artifactNote.textContent='По два артефакта спрятано в породе каждого этажа. Повторы хранятся здесь. Назначение артефактов пока не определено.';artifacts.append(artifactNote);
 const access=panelSection(panel,'Карты доступа');const cards=ownedKeycards(p);
 for(const floor of cards)infoRow(access,'Карта этажа '+floor,floor<=(p.highestFloor||0)?'Этаж открыт':'Готова к использованию');
 if(!cards.length)infoRow(access,'Карты пока не найдены','—');
 const note=document.createElement('p');note.className='terminal-note';note.textContent='Открытые этажи доступны навсегда. При гибели груз бура теряется; кредиты, полученные карты и сюжетные предметы сохраняются.';panel.append(note);
 return panel;
}
export function createHelpPanel(){
 const panel=document.createElement('div');panel.className='help-panel';
 const sections=[['Управление',[['WASD / стрелки','Двигаться и бурить: удерживай направление к блоку.'],['E / пробел','Взаимодействовать рядом с человеком, предметом или постройкой.'],['Esc','Открыть паузу. Прогресс сохраняется.'],['На телефоне','Круглый джойстик слева: потяни для движения и бурения, отпусти для остановки. Чем дальше тянешь, тем быстрее едешь. Кнопка действия справа.']]],
 ['Добыча и база',[['Груз · 200','Порода попадает в отсек. В Породнике выбирай, что продать, а что оставить.'],['Строительство','После спасения мастера на четвёртом этаже подойди к столу с чертежами на базе. Первый склад появляется готовым бесплатно, без строительства и расхода материалов. Склад хранит до 1000 единиц; запас не теряется при гибели.'],['Перенос зданий','На базе открой «Инвентарь → Постройки», потяни восстановленное здание на расчищенное место и подтверди. Потяни пустое место, чтобы переместить камеру.'],['Награды','Завершённые задания дают кредиты один раз. Повторная загрузка не выдаёт их заново.'],['Мастерская','Улучшай мощность за кредиты. Можно купить несколько улучшений подряд.'],['Оружейная и ремонт','Установи пушку, покупай несколько улучшений подряд и восстанавливай прочность в ремонтном цехе.']]],
 ['Бои и лифт',[['Пушка','Стреляет автоматически: дальность две клетки. Порода мешает выстрелам.'],['Пауки','Могут прорыть путь через слабые блоки. На третьем этаже возрождаются через 15 секунд.'],['Первая волна','Союзники помогают отбить 20 пауков. После победы они больше не появляются на базе.'],['Карты доступа','Открывай новые этажи. Открытый этаж остаётся доступным навсегда.']]]];
 for(const [title,rows] of sections){const section=panelSection(panel,title);for(const [label,value] of rows)infoRow(section,label,value);}
 return panel;
}
