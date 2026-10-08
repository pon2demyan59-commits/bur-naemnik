import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeaponPanel } from '../src/weapon-panel.js';
import { restoreArmory } from '../src/armory-state.js';
test('all weapon cards show real upgraded stats, recipes and total costs without spending on selection',()=>{
 class Element {
  children=[];dataset={};listeners={};
  append(...items){this.children.push(...items);}
  replaceChildren(...items){this.children=items;}
  setAttribute(){}
  addEventListener(type,fn){this.listeners[type]=fn;}
 }
 globalThis.document={createElement:()=>new Element(),querySelector:()=>({close(){}})};
 const q=restoreArmory({ready:true,gifted:true,installed:true,blueprint:true,weaponLevels:{basic:4,machinegun:7}});
 const s={armoryQuest:q,credits:30000,collectionBuffs:{weapon:.1},persist(){throw Error('selection must not save a purchase');}};
 const {panel}=createWeaponPanel(s,()=>{}),catalog=panel.children[2].children[0];
 assert.equal(catalog.children.length,10);
 const machine=catalog.children.find(c=>c.dataset.weapon==='machinegun');
 assert.equal(machine.children[2].children.length,4);assert.equal(machine.children[2].children[0].children[1].textContent,'0,68');
 assert.match(machine.children[3].textContent,/Ствольная сталь ×5/);assert.match(machine.children[4].textContent,/5.?470/);
 machine.listeners.click();assert.equal(s.credits,30000);assert.equal(q.equippedWeapon,'basic');
 const detail=panel.children[2].children[1];assert.equal(detail.children[1].textContent,'Пулемёт');assert.equal(detail.children[2].children[0].children[1].textContent,'0,68');
});
