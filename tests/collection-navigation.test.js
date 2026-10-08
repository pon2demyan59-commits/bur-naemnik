import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollectionPage } from '../src/collection-page.js';
import { COLLECTIONS } from '../src/collection-catalog.js';

function setup(back){
 class Element {
  children=[];listeners={};dataset={};style={};classList={add(){},toggle(){}};
  append(...items){this.children.push(...items);}
  prepend(...items){this.children.unshift(...items);}
  replaceChildren(...items){this.children=items;}
  setAttribute(){}
  addEventListener(type,fn){this.listeners[type]=fn;}
  click(){if(!this.disabled)this.listeners.click?.();}
 }
 const dialog=new Element();dialog.open=true;dialog.close=()=>{dialog.open=false;};
 globalThis.document={createElement:()=>new Element(),querySelector:()=>dialog};
 const first=COLLECTIONS[0],scene={artifacts:Object.fromEntries(first.artifacts.map(id=>[id,1])),closedCollections:[],closeCollection(){throw Error('navigation must not spend artifacts');}};
 const root=createCollectionPage(scene,back);
 return {root,dialog,scene,backButton:root.children[0],list:root.children[5],pager:root.children[6]};
}
test('collection Back exits even on the first page; page controls only paginate',()=>{
 let returned=0;const {backButton,pager,dialog}=setup(()=>returned++);
 assert.equal(backButton.disabled,undefined);assert.equal(pager.children[0].disabled,true);
 assert.match(pager.children[0].textContent,/ПРЕДЫДУЩАЯ СТРАНИЦА/);
 pager.children[2].click();assert.match(pager.children[1].textContent,/^2 \/ 50/);
 pager.children[0].click();assert.match(pager.children[1].textContent,/^1 \/ 50/);
 assert.equal(returned,0);backButton.click();assert.equal(returned,1);assert.equal(dialog.open,true);
 const direct=setup();direct.backButton.click();assert.equal(direct.dialog.open,false);
});
test('collection Back cancels confirmation, restores its list page, then returns to the parent',()=>{
 let returned=0;const {backButton,list,pager,scene}=setup(()=>returned++),artifacts={...scene.artifacts};
 list.children[0].click();const close=list.children.find(b=>b.textContent==='ЗАКРЫТЬ КОЛЛЕКЦИЮ');assert.equal(close.disabled,false);close.click();
 assert.ok(list.children.some(b=>b.textContent==='ПОДТВЕРДИТЬ ЗАКРЫТИЕ'));
 backButton.click();assert.equal(returned,0);assert.equal(list.children.length,20);assert.match(pager.children[1].textContent,/^1 \/ 50/);assert.deepEqual(scene.artifacts,artifacts);
 backButton.click();assert.equal(returned,1);
});
