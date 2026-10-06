import { readSave, readSettings, writeSettings } from './storage.js';
const Phaser = globalThis.Phaser;
const ui = document.querySelector('#ui');
const dialog = document.querySelector('#dialog');
const settings = readSettings();
let audio;
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
  for (const [key, label] of [['sound', 'Звуки'], ['music', 'Музыка']]) {
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
  const note = document.createElement('p'); note.textContent = 'Музыкальное сопровождение появится вместе с игровыми сценами.'; panel.append(note);
  const status = document.createElement('p'); status.className = 'storage-note'; status.setAttribute('role','status'); panel.append(status);
  openDialog('НАСТРОЙКИ', panel);
}
function requestGameplay() {
  const save = readSave();
  // A future base scene handles this event and prevents the fallback dialog.
  const handled = !window.dispatchEvent(new CustomEvent('bur:play', { cancelable: true, detail: { save } }));
  if (!handled) openDialog(save ? 'ПРОДОЛЖИТЬ' : 'НАЧАТЬ ИГРУ',
    'Главная и меню готовы. Игровая база ещё в разработке. Следующий этап — площадка 50×50 и спасение Серёги Т.');
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
    this.load.image('title', './assets/ui/title.webp');
    this.load.image('console', './assets/ui/console.webp');
    this.load.on('loaderror', () => {
      const loading = document.querySelector('#loading'); loading.hidden = false;
      loading.textContent = 'Не удалось загрузить оформление. Обновите страницу.';
    });
  }
  create() {
    if (!this.textures.exists('title') || !this.textures.exists('console')) return;
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
    this.button(stage, 'КАК ИГРАТЬ', 'menu-button help-button', () => openDialog('КАК ИГРАТЬ',
      'В игре предстоит управлять буром, расчищать породу, спасать людей и восстанавливать базу бункера №72. Подробное управление добавим вместе с первой игровой локацией.'));
    this.button(stage, 'ОБ ИГРЕ', 'menu-button about-button', () => openDialog('ОБ ИГРЕ',
      'БУР: Забытые внизу — подземное приключение с бурением, развитием базы и обороной. Бинарный импульс.'));
    this.button(stage, '← НАЗАД', 'back-button', () => this.scene.start('Title'));
    const refresh = () => { primary.textContent = readSave() ? 'ПРОДОЛЖИТЬ' : 'НАЧАТЬ ИГРУ'; };
    window.addEventListener('storage', refresh); window.addEventListener('focus', refresh);
    this.events.once('shutdown', () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); });
    this.showArt('console');
  }
}
if (!Phaser) document.querySelector('#loading').textContent = 'Движок не загрузился. Обновите страницу.';
else new Phaser.Game({
  type: Phaser.AUTO, parent: 'canvas-host', backgroundColor: '#0c1a1b',
  scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
  render: { antialias: true }, audio: { noAudio: true }, scene: [Boot, Title, Menu],
});
