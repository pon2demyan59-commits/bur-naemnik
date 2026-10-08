import { startViewportSync } from './viewport-sync.js';
import { showGamePanel, createSettingsPanel } from './game-menus.js';
import { readSave, readSettings, resetSave } from './storage.js';
import { Base } from './base-scene.js';
import { Floor } from './floor-scene.js';
import { createHelpPanel } from './interface-panels.js';
const Phaser = globalThis.Phaser;
const ui = document.querySelector('#ui');
const dialog = document.querySelector('#dialog');
let audio;
let game;
function clickSound() {
  if (!readSettings().sound) return;
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
  if(typeof content==='string'){const p=document.createElement('p');p.textContent=content;content=p;}
  showGamePanel(title,content);
}
document.querySelector('.close-dialog').addEventListener('click',()=>{clickSound();if(dialog.menuBack)dialog.menuBack();else dialog.close();});
dialog.addEventListener('cancel',event=>{if(dialog.menuBack){event.preventDefault();dialog.menuBack();}});
function showSettings(){showGamePanel('НАСТРОЙКИ',createSettingsPanel(),'settings');}
function requestGameplay() {
  game.scene.stop('Menu');
  const save=readSave();game.scene.start(save?.progress?.location==='floor'?'Floor':'Base',{save});
}
class ArtworkScene extends Phaser.Scene {
  showArt(key) {
    this.art = this.add.image(0, 0, key).setOrigin(.5);
    const fit = ({ width, height }) => {
      const texture = this.textures.get(key).getSourceImage();
      // Art and HTML hit areas share one proportional rectangle at every size.
      let scale = Math.min(width / texture.width, height / texture.height);
      const portrait = width < height;
      if (portrait) {
        scale = key === 'console'
          ? Math.min(width / (texture.width * .5), height / (texture.height * .78))
          : Math.min(Math.max(width / texture.width, height / texture.height), width / (texture.width * .30));
      } else if (width < 1100 && height < 520 && key === 'console') {
        scale = Math.min(width / (texture.width * .75), height / (texture.height * .72));
      }
      this.art.setPosition(width / 2, height / 2).setScale(scale).setAlpha(1);
      const stage = ui.querySelector('.stage');
      if (stage) {
        stage.style.width = `${texture.width * scale}px`;
        stage.style.height = `${texture.height * scale}px`;
        stage.style.setProperty('--viewport-width', `${width}px`);
        stage.style.setProperty('--viewport-height', `${height}px`);
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
    this.load.image('armory', './public/assets/game/armory-v2.webp');
    for(const kind of ['tools','repair-kit','blueprint'])this.load.svg('quest-'+kind,'./public/assets/quests/'+kind+'.svg',{width:128,height:128});
    this.load.svg('bonus-cache','./public/assets/quests/discovery-crate.svg',{width:128,height:128});
    for(const key of ['warehouse-house','military-guard'])this.load.image(key,'./public/assets/game/'+key+'.webp');
    this.load.image('headquarters','./public/assets/game/headquarters-v2.webp');
    this.load.image('architect-house', './public/assets/game/architect-house.webp');
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
    const primary = this.button(stage, readSave() ? 'ПРОДОЛЖИТЬ' : 'НАЧАТЬ ИГРУ', 'menu-button primary', requestGameplay);
    this.button(stage, 'НАСТРОЙКИ', 'menu-button settings-button', showSettings);
    this.button(stage, 'КАК ИГРАТЬ', 'menu-button help-button', () => openDialog('СПРАВОЧНИК БУРА', createHelpPanel()));
    this.button(stage, 'ОБ ИГРЕ', 'menu-button about-button', () => openDialog('ОБ ИГРЕ',
      'БУР: Забытые внизу — подземное приключение с бурением, развитием базы и обороной. Бинарный импульс.'));
    this.button(stage, 'СБРОСИТЬ ПРОГРЕСС', 'reset-button', () => {
      if(resetSave()){primary.textContent='НАЧАТЬ ИГРУ';}
      else openDialog('СБРОС НЕ ВЫПОЛНЕН','Браузер не разрешил удалить сохранение.');
    });
    this.button(stage, '← НАЗАД', 'back-button', () => this.scene.start('Title'));
    const refresh = () => { primary.textContent = readSave() ? 'ПРОДОЛЖИТЬ' : 'НАЧАТЬ ИГРУ'; };
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
  render: { antialias: true }, audio: { noAudio: false }, scene: [Boot, Title, Menu, Base, Floor],
});


if(game?.scale&&game?.events)startViewportSync(game,document.querySelector('#canvas-host'));
