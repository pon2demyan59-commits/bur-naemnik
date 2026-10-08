import { weaponDefinition, weaponStats } from './weapon-catalog.js';
import { warehouseCapacity } from './construction-state.js';
import { collectionCargoCapacity, collectionBuffTotals } from './collection-state.js';
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
 const cargo=restoreCargo(p.cargoHold,p.cargo,collectionCargoCapacity(p.closedCollections));
 return {location:p.location==='floor'?'Этаж '+(p.floor||1):'Бункер №72 · база',objective:campaignObjective(p),
  credits:p.credits||0,cargo:cargoCount(cargo),hull:Number.isFinite(p.hull)?Math.ceil(p.hull):DRILL_MAX_HP,
  power:Number((100+(p.workshopQuest?.upgrades||0)*2+collectionBuffTotals(p.closedCollections).drill*100).toFixed(3))};
}
function panelSection(panel,title){const section=document.createElement('section');section.className='terminal-section';const h=document.createElement('h3');h.textContent=title;section.append(h);panel.append(section);return section;}
function infoRow(section,label,value){const row=document.createElement('div');row.className='terminal-row';const name=document.createElement('span'),amount=document.createElement('strong');name.textContent=label;amount.textContent=value;row.append(name,amount);section.append(row);return row;}
export function createInventoryPanel(p={}){
 const panel=document.createElement('div');panel.className='inventory-panel';
 const summary=campaignSummary(p),cargo=restoreCargo(p.cargoHold,p.cargo,collectionCargoCapacity(p.closedCollections));
 const radio=panelSection(panel,'Рация · текущее задание');
 infoRow(radio,'Задание',globalThis.document?.querySelector?.('#quest-name')?.textContent||campaignObjective(p));
 const message=document.createElement('p');message.className='terminal-note';message.textContent=globalThis.document?.querySelector?.('#radio-text')?.textContent||'';radio.append(message);
 const tracker=globalThis.document?.querySelector?.('#quest-status')?.textContent;if(tracker)infoRow(radio,'Ориентир',tracker);
 const rig=panelSection(panel,'Бур');
 infoRow(rig,'Прочность',summary.hull+'/'+DRILL_MAX_HP);infoRow(rig,'Мощность',summary.power+'%');
 infoRow(rig,'Кредиты',summary.credits);infoRow(rig,'Оружие',p.armoryQuest?.installed?weaponDefinition(p.armoryQuest.equippedWeapon).name+' · ур. '+(p.armoryQuest.weaponLevel||0):'Не установлено');
 const hold=panelSection(panel,'Грузовой отсек · '+summary.cargo+'/'+collectionCargoCapacity(p.closedCollections));
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
 const artifacts=panelSection(panel,'Артефакты');const collection=restoreArtifacts(p.artifacts);let found=0;for(const a of ARTIFACTS)if(collection[a.id]){infoRow(artifacts,a.name,collection[a.id]);found++;}if(!found)infoRow(artifacts,'Артефактов пока нет','—');const artifactNote=document.createElement('p');artifactNote.className='terminal-note';artifactNote.textContent='Артефакты выпадают по шансу при разрушении блоков буром на этажах. Обычная редкость: 0,1% на блок. Более редкие встречаются реже, с глубиной их шансы растут. Количество не ограничено; повторные экземпляры хранятся здесь. Артефакты расходуются при закрытии коллекций. Баф действует только после полного закрытия набора.';artifacts.append(artifactNote);
 const access=panelSection(panel,'Карты доступа');const cards=ownedKeycards(p);
 for(const floor of cards)infoRow(access,'Карта этажа '+floor,floor<=(p.highestFloor||0)?'Этаж открыт':'Готова к использованию');
 if(!cards.length)infoRow(access,'Карты пока не найдены','—');
 const note=document.createElement('p');note.className='terminal-note';note.textContent='Открытые этажи доступны навсегда. При гибели груз бура теряется; кредиты, полученные карты и сюжетные предметы сохраняются.';panel.append(note);
 return panel;
}
export function createHelpPanel(){
 const panel=document.createElement('div');panel.className='help-panel';
 const sections=[['Управление',[['WASD / стрелки','Двигаться и бурить: удерживай направление к блоку.'],['E / пробел','Взаимодействовать рядом с человеком, предметом или постройкой.'],['Esc','Открыть паузу. Прогресс сохраняется.'],['На телефоне','Круглый джойстик слева: потяни для движения и бурения, отпусти для остановки. Чем дальше тянешь, тем быстрее едешь. Кнопка действия справа.']]],
 ['Добыча и база',[['Груз · 200','Коллекции могут увеличить базовую вместимость 200. Порода попадает в отсек. В Породнике выбирай, что продать, а что оставить.'],['Строительство','После спасения мастера на четвёртом этаже подъедь ко входу в дом архитектора на базе. Первый склад появляется готовым бесплатно, без строительства и расхода материалов. Первый склад хранит до 100 единиц каждого материала; улучшения увеличивают лимит каждой секции на 100; запас не теряется при гибели.'],['Перенос зданий','На базе открой «Инвентарь → Постройки», потяни восстановленное здание на расчищенное место и подтверди. Потяни пустое место, чтобы переместить камеру.'],['Коллекции','Открой отдельную страницу через инвентарь или паузу. Полный набор закрывается по подтверждению, артефакты расходуются. Неполный набор даёт ноль. Баф закрытой коллекции постоянный и сохраняется после гибели.'],['Награды','Завершённые задания дают кредиты один раз. Повторная загрузка не выдаёт их заново.'],['Мастерская','Улучшай мощность за кредиты. Можно купить несколько улучшений подряд.'],['Оружейная и ремонт','В оружейной выбери чертёж, закупи недостающие материалы, изготовь оружие и установи его на бур. Улучшения каждого вида сохраняются отдельно. Прочность восстанавливай в ремонтном цехе.']]],
 ['Бои и лифт',[['Пушка','Базовая пушка стреляет автоматически: дальность две клетки. Урон, дальность и частота зависят от установленного оружия. Порода мешает выстрелам.'],['Пауки','Могут прорыть путь через слабые блоки. На третьем этаже возрождаются через 15 секунд.'],['Первая волна','Союзники помогают отбить 20 пауков. После победы они больше не появляются на базе.'],['Карты доступа','Открывай новые этажи. Открытый этаж остаётся доступным навсегда.']]]];
 for(const [title,rows] of sections){const section=panelSection(panel,title);for(const [label,value] of rows)infoRow(section,label,value);}
 return panel;
}

export function createDrillPanel(p={}){
 const panel=document.createElement('section');panel.className='drill-page';const buffs=collectionBuffTotals(p.closedCollections),summary=campaignSummary(p),capacity=collectionCargoCapacity(p.closedCollections),power=summary.power/100;
 const hero=document.createElement('div');hero.className='drill-hero';const art=document.createElement('img');art.src='./public/assets/game/drill-compact.webp';art.alt='Бур';const title=document.createElement('h3');title.textContent='ПАСПОРТ БУРА · БУНКЕР №72';hero.append(art,title);panel.append(hero);
 const hull=panelSection(panel,'Состояние и груз');infoRow(hull,'Прочность',summary.hull+' / '+DRILL_MAX_HP);infoRow(hull,'Грузовой отсек',summary.cargo+' / '+capacity);infoRow(hull,'Свободное место',capacity-summary.cargo);infoRow(hull,'Кредиты',summary.credits);infoRow(hull,'Местоположение',summary.location);
 const mining=panelSection(panel,'Бурение и движение');infoRow(mining,'Насадка на головку',p.workshopQuest?.earthHead?'Усиленная земляная':'Стандартная');infoRow(mining,'Мощность',summary.power+'%');infoRow(mining,'Улучшения мощности',(p.workshopQuest?.upgrades||0)+' / 100 · +2% за улучшение');infoRow(mining,'Скорость бурения',Number(power.toFixed(3))+' прочности/с');infoRow(mining,'Земля · целый блок',Number((1/(power*(p.workshopQuest?.earthHead?12.5:1))).toFixed(3))+' с');infoRow(mining,'Камень · целый блок',Number((2/power).toFixed(3))+' с');infoRow(mining,'Максимальная скорость',Number((280*(1+buffs.speed)/64).toFixed(3))+' клеток/с');
 const weapon=panelSection(panel,'Оружие');infoRow(weapon,'Установлено',p.armoryQuest?.installed?weaponDefinition(p.armoryQuest.equippedWeapon).name:'Нет');if(p.armoryQuest?.installed){infoRow(weapon,'Улучшения',(p.armoryQuest.weaponLevel||0)+' / 100');infoRow(weapon,'Урон за выстрел',Number(weaponStats(p.armoryQuest,buffs.weapon).damage.toFixed(3)));infoRow(weapon,'Дальность',weaponDefinition(p.armoryQuest.equippedWeapon).range+' клетки');infoRow(weapon,'Частота',Number((1000/weaponDefinition(p.armoryQuest.equippedWeapon).interval).toFixed(2))+' выстрел/с');}
 const effects=panelSection(panel,'Действующие бафы коллекций');for(const [key,label] of Object.entries({drill:'Мощность бура',weapon:'Урон оружия',speed:'Скорость движения',defense:'Снижение входящего урона',cargo:'Вместимость груза',sale:'Доход от продажи'}))infoRow(effects,label,'+'+Number((buffs[key]*100).toFixed(3))+'%');
 const base=panelSection(panel,'База');infoRow(base,'Мастерская',p.workshopQuest?.ready?'Работает':'Не восстановлена');infoRow(base,'Оружейная',p.armoryQuest?.ready?'Работает':'Не восстановлена');infoRow(base,'Ремонтный цех',p.repairQuest?.ready?'Работает':'Не восстановлен');infoRow(base,'Склад',p.constructionQuest?.warehouse?'Уровень '+(p.constructionQuest.warehouseLevel||1)+' · '+warehouseCapacity(p.constructionQuest)+' каждого материала':'Не открыт');
 const note=document.createElement('p');note.className='terminal-note';note.textContent='Показаны текущие параметры с улучшениями и бафами полностью закрытых коллекций. Время бурения указано при непрерывной работе по целому блоку. При гибели груз теряется, складской запас сохраняется.';panel.append(note);return panel;
}
