import { readSettings, writeSettings } from './storage.js';
import { createInventoryPanel, createHelpPanel, createDrillPanel } from './interface-panels.js';

const BUILDING_MENUS={
 construction:{title:'ДОМ АРХИТЕКТОРА',portrait:'builder-portrait-v2',name:'Строительный мастер',role:'Чертежи и постройки',art:'menu-construction-scene',artSvg:true,hint:'Первый чертёж — склад'},
 warehouse:{title:'СКЛАД',portrait:'builder-portrait-v2',name:'Строительный мастер',role:'Хранение материалов',art:'menu-construction-scene',artSvg:true,hint:'Запас сохраняется между вылазками'},
 hq:{title:'ШТАБ',portrait:'demyan-portrait',name:'Демьян П.',role:'Начальник штаба',art:'headquarters',artGame:true,hint:'Сюжетные задания · Выход на поверхность'},
 workshop:{title:'МАСТЕРСКАЯ',portrait:'konstantin-portrait',name:'Константин Б',role:'Механик',art:'menu-workshop-scene',hint:'Улучшение мощности · 4 секунды'},
 armory:{title:'ОРУЖЕЙНАЯ',portrait:'armorer-portrait',name:'Оружейник',role:'Оружие для бура',art:'menu-armory-scene',hint:'Установка и модернизация · 4 секунды'},
 repair:{title:'РЕМОНТНЫЙ ЦЕХ',portrait:'ilya-portrait',name:'Илья К',role:'Ремонтник',art:'menu-workshop-scene',hint:'Восстановление прочности · 4 секунды'},
 lift:{title:'ГРУЗОВОЙ ЛИФТ',art:'menu-lift-scene',hint:'Открытые этажи доступны навсегда'},
 porodnik:{title:'ПОРОДНИК',art:'porodnik',hint:'Продажа выбранной породы · переработка 10 секунд'}
};
export function showGamePanel(title,content,kind='terminal',back=null){
 const dialog=document.querySelector('#dialog');dialog.className='game-dialog';dialog.menuBack=back;
 // Property assignment also supports the lightweight DOM used by scene tests.
 if(dialog.dataset)dialog.dataset.menu=kind;
 document.querySelector('#dialog-title').textContent=title;
 const close=document.querySelector('.close-dialog');
 const shell=document.querySelector('.dialog-shell');if(close&&shell) shell.append(close);
 document.querySelector('#dialog-body').replaceChildren(content);
 if(close)close.textContent=back?'← НАЗАД':kind==='pause'?'ПРОДОЛЖИТЬ':'ЗАКРЫТЬ';
 if(!dialog.open)dialog.showModal();
}
export function showBuildingMenu(kind,controls){
 const spec=BUILDING_MENUS[kind],layout=document.createElement('section');layout.className='service-layout service-'+kind;
 const staff=document.createElement('aside');staff.className='service-staff';
 const art=document.createElement('img');art.className='service-art';art.src='./public/assets/'+(kind==='porodnik'||spec.artGame?'game/':'ui/')+spec.art+(spec.artSvg?'.svg':'.webp');art.alt='';
 if(spec.portrait){
  const portrait=document.createElement('img');portrait.className='service-portrait';portrait.src='./public/assets/ui/'+spec.portrait+(spec.svg?'.svg':'.webp');portrait.alt=spec.name;
  const name=document.createElement('strong'),role=document.createElement('span');name.textContent=spec.name;role.textContent=spec.role;
  staff.append(portrait,name,role);
  if(controls.children?.[0])staff.append(controls.children[0]);
  if(kind==='repair'&&controls.children?.[0])staff.append(controls.children[0]);
 }else staff.append(art);
 const hint=document.createElement('p');hint.className='service-hint';hint.textContent=spec.hint;staff.append(hint);
 controls.className+=' service-controls';layout.append(staff,controls);
 if(spec.portrait){const machine=document.createElement('div');machine.className='service-machine';machine.append(art);layout.append(machine);}
 showGamePanel(spec.title,layout,kind);
 const close=document.querySelector('.close-dialog');if(close)controls.append(close);
}
export function createSettingsPanel(){
 const settings=readSettings(),panel=document.createElement('div');panel.className='settings terminal-section';
 const row=document.createElement('label');row.className='setting-row';
 const caption=document.createElement('span');caption.textContent='Звуки интерфейса';
 const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=settings.sound;
 const status=document.createElement('p');status.className='storage-note';status.setAttribute('role','status');
 toggle.addEventListener('change',()=>{settings.sound=toggle.checked;status.textContent=writeSettings(settings)?'':'Браузер не разрешает сохранить настройки.';});
 row.append(caption,toggle);panel.append(row);
 const radioRow=document.createElement('label');radioRow.className='setting-row';const radioCaption=document.createElement('span');radioCaption.textContent='Убрать рацию в инвентарь';const radioToggle=document.createElement('input');radioToggle.type='checkbox';radioToggle.checked=settings.radioInInventory;
 radioToggle.addEventListener('change',()=>{settings.radioInInventory=radioToggle.checked;const saved=writeSettings(settings);status.textContent=saved?'':'Браузер не разрешает сохранить настройки.';if(saved){document.querySelector('.radio-card')?.classList.toggle('radio-in-inventory',settings.radioInInventory);}});
 radioRow.append(radioCaption,radioToggle);panel.append(radioRow,status);return panel;
}
export function openPauseMenu(scene){
 const dialog=document.querySelector('#dialog');scene.dialogClosed();scene.persist();
 scene.scene.pause();scene.input.enabled=false;
 const resume=()=>{dialog.menuBack=null;scene.input.enabled=true;scene.dialogClosed();scene.scene.resume();scene.events.off('shutdown',abort);};
 const abort=()=>{dialog.removeEventListener('close',resume);dialog.menuBack=null;if(dialog.open)dialog.close();};
 dialog.addEventListener('close',resume,{once:true});scene.events.once('shutdown',abort);
 const render=()=>{
  const panel=document.createElement('div');panel.className='pause-panel';
  const badge=document.createElement('p');badge.className='pause-badge';badge.textContent=scene.floorNumber?'ШАХТА · ЭТАЖ '+scene.floorNumber:'БУНКЕР №72 · БАЗА';panel.append(badge);
  for(const [label,action,primary] of [
   ['ПРОДОЛЖИТЬ',()=>dialog.close(),true],
   ['ИНВЕНТАРЬ',()=>showGamePanel('ИНВЕНТАРЬ',createInventoryPanel(scene.snapshotCampaign()),'inventory',render)],
   ['ХАРАКТЕРИСТИКИ БУРА',()=>showGamePanel('ХАРАКТЕРИСТИКИ БУРА',createDrillPanel(scene.snapshotCampaign()),'drill',render)],
   ['КОЛЛЕКЦИИ',()=>scene.openCollections(render)],
   ['НАСТРОЙКИ',()=>showGamePanel('НАСТРОЙКИ',createSettingsPanel(),'settings',render)],
   ['КАК ИГРАТЬ',()=>showGamePanel('СПРАВОЧНИК БУРА',createHelpPanel(),'help',render)],
   ['ГЛАВНОЕ МЕНЮ',()=>{dialog.close();scene.persist();scene.scene.start('Menu');}]
  ]){const button=document.createElement('button');button.type='button';button.className=primary?'metal-button pause-primary':'floor-button';button.textContent=label;button.addEventListener('click',action);panel.append(button);}
  showGamePanel('ПАУЗА',panel,'pause');
 };
 render();
}
