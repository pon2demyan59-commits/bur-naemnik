import { readSave, readSettings, writeSettings, resetSave } from './storage.js';
import { Base } from './base-scene.js';
import { Floor } from './floor-scene.js';
import { campaignSummary, createInventoryPanel, createHelpPanel } from './interface-panels.js';
const Phaser = globalThis.Phaser;
const ui = document.querySelector('#ui');
const dialog = document.querySelector('#dialog');
const settings = readSettings();
let audio;
let game;
function clickSound() {
  if (!settings.sound) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(220, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audio.currentTime + .06);
    gain.gain.setValueAtTime(.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .08);
    oscillator.connect(gain); gain.connect(audio.destination);
    oscillator.start(); oscillator.stop(audio.currentTime + .08);
  } catch { /* Audio is optional. */ }
}
function openDialog(title, content) {
  document.querySelector('#dialog-title').textContent = title;
  const body = document.querySelector('#dialog-body'); body.replaceChildren();
  if (typeof content === 'string') { const p = document.createElement('p'); p.textContent = content; body.append(p); }
  else body.append(content);
  dialog.showModal();
}
document.querySelector('.close-dialog').addEventListener('click', () => { clickSound(); dialog.close(); });
function showSettings() {
  const panel = document.createElement('div'); panel.className = 'settings';
  for (const [key, label] of [['sound', 'Звуки интерфейса']]) {
    const row = document.createElement('label'); row.className = 'setting-row';
    const caption = document.createElement('span'); caption.textContent = label;
    const toggle = document.createElement('input'); toggle.type = 'checkbox'; toggle.checked = settings[key];
    toggle.addEventListener('change', () => {
      settings[key] = toggle.checked;
      const stored = writeSettings(settings);
      panel.querySelector('.storage-note').textContent = stored ? '' : 'Браузер не разрешает сохранить настройки.';
      clickSound();
    });
    row.append(caption, toggle); panel.append(row);
  }
  const status = document.createElement('p'); status.className = 'storage-note'; status.setAttribute('role','status'); panel.append(status);
  openDialog('НАСТРОЙКИ', panel);
}
function requestGameplay() {
  game.scene.stop('Menu');
  const save=readSave();game.scene.start(save?.progress?.location==='floor'?'Floor':'Base',{save});
}
class ArtworkScene extends Phaser.Scene {
  showArt(key) {
    this.art = this.add.image(0, 0, key).setOrigin(.5);
    const fit = ({ width, height }) => {
      const portrait = width / height < 1;
      const texture = this.textures.get(key).getSourceImage();
      const isConsole = key === 'console';
      const scale = portrait ? (isConsole ? width / (texture.width * .66) : Math.max(width / texture.width, height / texture.height)) : Math.min(width / texture.width, height / texture.height);
      const y = portrait ? (isConsole ? texture.height * scale / 2 : height * .20) : height / 2;
      this.art.setPosition(width / 2, y).setScale(scale).setAlpha(portrait && !isConsole ? .65 : 1);
      const stage = ui.querySelector('.stage');
      if (stage) {
        stage.style.width = portrait ? '100%' : `${texture.width * scale}px`;
        stage.style.height = portrait ? '100%' : `${texture.height * scale}px`;
      }
    };
    this.scale.on('resize', fit);
    this.events.once('shutdown', () => this.scale.off('resize', fit));
    fit(this.scale.gameSize);
    this.cameras.main.fadeIn(220, 12, 26, 27);
  }
  createUI(type) {
    ui.replaceChildren(); ui.dataset.screen = type;
    const stage = document.createElement('section'); stage.className = `stage ${type}`;
    const title = document.createElement('h1'); title.className = 'mobile-title'; title.innerHTML = 'БУР<span>Забытые внизу</span>';
    stage.append(title); ui.append(stage); return stage;
  }
  button(stage, label, cls, action) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.className = cls;
    b.addEventListener('click', () => { clickSound(); action(); }); stage.append(b); return b;
  }
}
class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    this.load.image('title', './public/assets/ui/title.webp');
    this.load.image('console', './public/assets/ui/console.webp');
    for(const name of ['serega-neutral','serega-portrait','konstantin-portrait','armorer-portrait','ilya-portrait'])this.load.image(name,'./public/assets/ui/'+name+'.webp');
    for(const name of ['pipe','cap','vent','drain','cable'])this.load.image('prop-'+name,'./public/assets/game/prop-'+name+'.webp');
    this.load.image('repair-shop', './public/assets/game/repair-shop.webp');
    this.load.image('spider', './public/assets/game/spider.webp');
    this.load.image('ilya', './public/assets/game/ilya.webp');
    this.load.image('people', './public/assets/game/people.webp');
    this.load.image('material-surfaces', './public/assets/game/material-surfaces.webp');
    this.load.image('bunker-floor', './public/assets/game/bunker-floor-painted.webp');
    this.load.image('armory', './public/assets/game/armory.webp');
    this.load.image('workshop', './public/assets/game/workshop.webp');
    this.load.image('porodnik', './public/assets/game/porodnik.webp');
    this.load.image('freight-lift', './public/assets/game/freight-lift.webp');
    this.load.image('bunker-door', './public/assets/game/bunker-door.webp');
    this.load.image('drill', './public/assets/game/drill-compact.webp');
    this.load.on('loaderror', () => {
      const loading = document.querySelector('#loading'); loading.hidden = false;
      loading.textContent = 'Не удалось загрузить оформление. Обновите страницу.';
    });
  }
  create() {
    if(!['repair-shop','spider','ilya','people','armory','workshop','title','console','serega-neutral','serega-portrait','freight-lift','bunker-door','drill','material-surfaces','bunker-floor','prop-pipe','prop-cap','prop-vent','prop-drain','prop-cable'].every(key=>this.textures.exists(key)))return;
    document.querySelector('#loading').hidden = true; this.scene.start('Title');
  }
}
class Title extends ArtworkScene {
  constructor() { super('Title'); }
  create() {
    const stage = this.createUI('title');
    this.button(stage, 'ВХОД', 'entry art-button', () => this.scene.start('Menu'));
    this.showArt('title');
  }
}
class Menu extends ArtworkScene {
  constructor() { super('Menu'); }
  create() {
    const stage = this.createUI('menu');
    const terminal=document.createElement('div');terminal.className='bunker-terminal';stage.append(terminal);
    const badge=document.createElement('div');badge.className='terminal-badge';badge.textContent='БУНКЕР №72 · ТЕРМИНАЛ';terminal.append(badge);
    const title=document.createElement('h2');title.className='terminal-title';title.innerHTML='БУР<span>Забытые внизу</span>';terminal.append(title);
    const summary=document.createElement('div');summary.className='campaign-summary';terminal.append(summary);
    const primary = this.button(terminal, readSave() ? 'ПРОДОЛЖИТЬ' : 'НАЧАТЬ ИГРУ', 'terminal-primary', requestGameplay);
    const actions=document.createElement('div');actions.className='terminal-actions';terminal.append(actions);
    const inventory=this.button(actions,'ИНВЕНТАРЬ','terminal-button',()=>openDialog('ИНВЕНТАРЬ',createInventoryPanel(readSave()?.progress||{})));
    this.button(actions, 'КАК ИГРАТЬ', 'terminal-button', () => openDialog('СПРАВОЧНИК БУРА',createHelpPanel()));
    this.button(actions, 'НАСТРОЙКИ', 'terminal-button', showSettings);
    this.button(actions, 'ОБ ИГРЕ', 'terminal-button', () => openDialog('БУР: ЗАБЫТЫЕ ВНИЗУ',
      'После войны люди ушли под землю. В бункере №72 остались завалы, старые машины и те, кто не успел выбраться. Спасай людей, восстанавливай базу и исследуй глубины. Создано «Бинарным импульсом».'));
    const footer=document.createElement('div');footer.className='terminal-footer';terminal.append(footer);
    this.button(footer, 'СБРОСИТЬ ПРОГРЕСС', 'terminal-reset', () => {
      if(resetSave()){primary.textContent='НАЧАТЬ ИГРУ';}
      else openDialog('СБРОС НЕ ВЫПОЛНЕН','Браузер не разрешил удалить сохранение.');
      refresh();
    });
    this.button(footer, '← НА ГЛАВНУЮ', 'terminal-back', () => this.scene.start('Title'));
    const refresh = () => {const save=readSave();primary.textContent=save?'ПРОДОЛЖИТЬ':'НАЧАТЬ ИГРУ';inventory.disabled=!save;
      summary.replaceChildren();
      if(save){const p=campaignSummary(save.progress);const location=document.createElement('strong'),quest=document.createElement('span');location.textContent=p.location;quest.textContent=p.objective;summary.append(location,quest);}
      else{summary.textContent='Связь восстановлена. Бункер ждёт.';}
    };refresh();
    window.addEventListener('storage', refresh); window.addEventListener('focus', refresh);
    this.events.once('shutdown', () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); });
    this.showArt('console');
  }
}
if (!Phaser) document.querySelector('#loading').textContent = 'Движок не загрузился. Обновите страницу.';
else game = new Phaser.Game({
  type: location.protocol === 'file:' ? Phaser.CANVAS : Phaser.AUTO, parent: 'canvas-host', backgroundColor: '#0c1a1b',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  loader: { imageLoadType: 'HTMLImageElement' },
  render: { antialias: true }, audio: { noAudio: true }, scene: [Boot, Title, Menu, Base, Floor],
});

