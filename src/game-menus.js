import { readSettings, writeSettings } from './storage.js';
import { createInventoryPanel, createHelpPanel } from './interface-panels.js';

const BUILDING_MENUS={
 workshop:{title:'МАСТЕРСКАЯ',portrait:'konstantin-portrait',name:'Константин Б',role:'Механик',art:'drill-compact',hint:'Улучшение мощности · 4 секунды'},
 armory:{title:'ОРУЖЕЙНАЯ',portrait:'armorer-portrait',name:'Оружейник',role:'Оружие для бура',art:'armory',hint:'Установка и модернизация · 4 секунды'},
 repair:{title:'РЕМОНТНЫЙ ЦЕХ',portrait:'ilya-portrait',name:'Илья К',role:'Ремонтник',art:'drill-compact',hint:'Восстановление прочности · 4 секунды'},
 lift:{title:'ГРУЗОВОЙ ЛИФТ',art:'freight-lift',hint:'Открытые этажи доступны навсегда'},
 porodnik:{title:'ПОРОДНИК',art:'porodnik',hint:'Продажа выбранной породы · переработка 10 секунд'}
};
export function showGamePanel(title,content,kind='terminal',back=null){
 const dialog=document.querySelector('#dialog');dialog.className='game-dialog';dialog.menuBack=back;
 // Property assignment also supports the lightweight DOM used by scene tests.
 if(dialog.dataset)dialog.dataset.menu=kind;
 document.querySelector('#dialog-title').textContent=title;
 document.querySelector('#dialog-body').replaceChildren(content);
 const close=document.querySelector('.close-dialog');if(close)close.textContent=back?'← НАЗАД':kind==='pause'?'ПРОДОЛЖИТЬ':'ЗАКРЫТЬ';
 if(!dialog.open)dialog.showModal();
}
export function showBuildingMenu(kind,controls){
 const spec=BUILDING_MENUS[kind],layout=document.createElement('section');layout.className='service-layout service-'+kind;
 const staff=document.createElement('aside');staff.className='service-staff';
 const art=document.createElement('img');art.className='service-art';art.src='./public/assets/game/'+spec.art+'.webp';art.alt='';
 if(spec.portrait){
  const portrait=document.createElement('img');portrait.className='service-portrait';portrait.src='./public/assets/ui/'+spec.portrait+'.webp';portrait.alt=spec.name;
  const name=document.createElement('strong'),role=document.createElement('span');name.textContent=spec.name;role.textContent=spec.role;
  staff.append(portrait,name,role);
 }else staff.append(art);
 const hint=document.createElement('p');hint.className='service-hint';hint.textContent=spec.hint;staff.append(hint);
 controls.className+=' service-controls';layout.append(staff,controls);
 if(spec.portrait){const machine=document.createElement('div');machine.className='service-machine';machine.append(art);layout.append(machine);}
 showGamePanel(spec.title,layout,kind);
}
export function createSettingsPanel(){
 const settings=readSettings(),panel=document.createElement('div');panel.className='settings terminal-section';
 const row=document.createElement('label');row.className='setting-row';
 const caption=document.createElement('span');caption.textContent='Звуки интерфейса';
 const toggle=document.createElement('input');toggle.type='checkbox';toggle.checked=settings.sound;
 const status=document.createElement('p');status.className='storage-note';status.setAttribute('role','status');
 toggle.addEventListener('change',()=>{settings.sound=toggle.checked;status.textContent=writeSettings(settings)?'':'Браузер не разрешает сохранить настройки.';});
 row.append(caption,toggle);panel.append(row,status);return panel;
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
   ['НАСТРОЙКИ',()=>showGamePanel('НАСТРОЙКИ',createSettingsPanel(),'settings',render)],
   ['КАК ИГРАТЬ',()=>showGamePanel('СПРАВОЧНИК БУРА',createHelpPanel(),'help',render)],
   ['ГЛАВНОЕ МЕНЮ',()=>{dialog.close();scene.persist();scene.scene.start('Menu');}]
  ]){const button=document.createElement('button');button.type='button';button.className=primary?'metal-button pause-primary':'floor-button';button.textContent=label;button.addEventListener('click',action);panel.append(button);}
  showGamePanel('ПАУЗА',panel,'pause');
 };
 render();
}
