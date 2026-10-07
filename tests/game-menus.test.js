import test from 'node:test';
import assert from 'node:assert/strict';
import {openPauseMenu,showBuildingMenu} from '../src/game-menus.js';
function menuDOM(){
 class Element {
  constructor(){this.children=[];this.listeners={};this.dataset={};this.open=false;}
  append(...children){this.children.push(...children);}
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
  const controls=new Element();controls.className='lift-console';showBuildingMenu(kind,controls);
  assert.equal(dialog.dataset.menu,kind);assert.equal(body.children[0].children[1],controls);
  const image=body.children[0].children[0].children[0];
  assert.ok(image.src.includes(portrait?'/ui/'+portrait:'/game/'));
  assert.equal(dialog.menuBack,null);
 }
});
