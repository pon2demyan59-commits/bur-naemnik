import test from 'node:test';
import assert from 'node:assert/strict';
import {openPauseMenu,showBuildingMenu} from '../src/game-menus.js';
function menuDOM(){
 class Element {
  constructor(){this.children=[];this.listeners={};this.dataset={};this.open=false;}
  append(...children){for(const child of children){if(child.parent)child.parent.children=child.parent.children.filter(c=>c!==child);child.parent=this;this.children.push(child);}}
  replaceChildren(...children){this.children=children;}
  setAttribute(){}
  addEventListener(type,fn,options){(this.listeners[type]??=[]).push({fn,once:options?.once});}
  removeEventListener(type,fn){this.listeners[type]=(this.listeners[type]||[]).filter(l=>l.fn!==fn);}
  emit(type){for(const l of [...(this.listeners[type]||[])]){if(l.once)this.removeEventListener(type,l.fn);l.fn();}}
  showModal(){this.open=true;}
  close(){this.open=false;this.emit('close');}
 }
 const dialog=new Element(),body=new Element(),title=new Element(),close=new Element();
 globalThis.document={createElement:()=>new Element(),querySelector:s=>({'#dialog':dialog,'#dialog-body':body,'#dialog-title':title,'.close-dialog':close}[s])};
 return {dialog,body,title,close,Element};
}
test('pause submenus keep the scene paused, return to pause, then resume exactly once',()=>{
 const {dialog,body,title}=menuDOM();let pauses=0,resumes=0,saves=0;const listeners={};
 const scene={floorNumber:3,input:{enabled:true},dialogClosed(){},persist(){saves++;},snapshotCampaign:()=>({floor:3,location:'floor'}),
  scene:{pause(){pauses++;},resume(){resumes++;},start(){}},events:{once(type,fn){listeners[type]=fn;},off(type){delete listeners[type];}}};
 openPauseMenu(scene);assert.equal(title.textContent,'ПАУЗА');assert.equal(pauses,1);assert.equal(scene.input.enabled,false);assert.equal(saves,1);
 const select=label=>body.children[0].children.find(b=>b.textContent===label).emit('click');
 for(const label of ['ИНВЕНТАРЬ','НАСТРОЙКИ','КАК ИГРАТЬ']){
  select(label);assert.ok(dialog.menuBack);assert.equal(resumes,0);dialog.menuBack();assert.equal(title.textContent,'ПАУЗА');
 }
 select('ПРОДОЛЖИТЬ');assert.equal(dialog.open,false);assert.equal(resumes,1);assert.equal(scene.input.enabled,true);
 dialog.close();assert.equal(resumes,1);
});
test('pause escape closure resumes and shutdown removes the resume callback',()=>{
 const {dialog}=menuDOM();let resumes=0;const listeners={};
 const scene={input:{enabled:true},dialogClosed(){},persist(){},scene:{pause(){},resume(){resumes++;}},events:{once(type,fn){listeners[type]=fn;},off(type){delete listeners[type];}}};
 openPauseMenu(scene);dialog.close();assert.equal(resumes,1);
 openPauseMenu(scene);listeners.shutdown();assert.equal(dialog.open,false);assert.equal(resumes,1);
});
test('building consoles use canonical staff portraits and retain interactive controls',()=>{
 const {dialog,body,Element}=menuDOM();
 for(const [kind,portrait] of [['workshop','konstantin-portrait'],['armory','armorer-portrait'],['repair','ilya-portrait'],['lift',null],['porodnik',null]]){
  const controls=new Element();controls.className='lift-console';controls.append(new Element());showBuildingMenu(kind,controls);
  assert.equal(dialog.dataset.menu,kind);assert.equal(body.children[0].children[1],controls);
  const image=body.children[0].children[0].children[0];
  assert.ok(image.src.includes(portrait?'/ui/'+portrait:kind==='lift'?'/ui/menu-lift-scene':'/game/'));
  assert.equal(dialog.menuBack,null);
 }
});

test('repeated pause requests cannot attach a second resume handler or transparent menu',()=>{
 const {dialog}=menuDOM();let pauses=0,resumes=0;const scene={input:{enabled:true},dialogClosed(){},persist(){},scene:{pause(){pauses++;},resume(){resumes++;}},events:{once(){},off(){}}};
 openPauseMenu(scene);openPauseMenu(scene);assert.equal(pauses,1);assert.equal(dialog.listeners.close.length,1);dialog.close();assert.equal(resumes,1);assert.equal(scene.pauseMenuActive,false);
 openPauseMenu(scene);dialog.close();assert.equal(resumes,2);
});
test('Escape returns from a submenu once, then closes pause, and HUD focus cannot reopen it with Space',async()=>{
 const {bindGameDialogControls}=await import('../src/game-menus.js');const {dialog}=menuDOM();let handler,back=0,blocked=0,blurred=0;const hud={blur(){blurred++;}};
 const doc={activeElement:hud,addEventListener(type,fn){handler=fn;},removeEventListener(){},querySelector:id=>id==='#base-menu'?hud:null};dialog.contains=()=>false;
 const cleanup=bindGameDialogControls(dialog,doc);dialog.showModal();dialog.menuBack=()=>{back++;dialog.menuBack=null;};
 const event={code:'Escape',preventDefault(){blocked++;},stopImmediatePropagation(){blocked++;}};
 handler(event);assert.equal(back,1);assert.equal(dialog.open,true);handler({...event,repeat:true});assert.equal(dialog.open,true);handler(event);assert.equal(dialog.open,false);assert.equal(blurred,1);assert.equal(dialog.menuBack,null);assert.equal(blocked,6);
 handler(event);assert.equal(blocked,6);cleanup();
});
