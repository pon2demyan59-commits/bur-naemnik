import test from 'node:test';
import assert from 'node:assert/strict';
import {campaignSummary,campaignObjective,createInventoryPanel,createHelpPanel} from '../src/interface-panels.js';
test('menu summary follows the actual mission and handles legacy cargo saves',()=>{
 assert.equal(campaignObjective({}),'Голос за завалом');
 const p={location:'floor',floor:3,cargo:7,credits:45,hull:12.2,workshopQuest:{upgrades:4},repairQuest:{briefed:true}};
 assert.deepEqual(campaignSummary(p),{location:'Этаж 3',objective:'Найти комплект и спасти Илью',credits:45,cargo:7,hull:13,power:108});
 assert.equal(campaignObjective({...p,repairQuest:{wave:'done'}}),'Первая атака отбита');
});
function fakeDOM(){
 globalThis.document={createElement:()=>({children:[],textContent:'',append(...items){this.children.push(...items);}})};
 return node=>[node.textContent,...node.children.map(child=>flatten(child))].join(' ');
 function flatten(node){return [node.textContent,...node.children.map(flatten)].join(' ');}
}
test('inventory separates ore and archived access cards and hides consumed mission supplies',()=>{
 const text=fakeDOM();const panel=createInventoryPanel({base:{rescued:true},highestFloor:2,keycards:[1,2,3],cargoHold:{earth:3,gold:2},inventory:{fiber:5},carriedLoot:{fiber:2},workshopQuest:{ready:true,tools:true},armoryQuest:{blueprint:true},repairQuest:{ready:true,kit:true}});
 const content=text(panel);assert.match(content,/Грузовой отсек · 5\/200/);assert.match(content,/Золотосодержащая руда 2/);
 assert.match(content,/Паучье волокно 7/);assert.match(content,/Карта этажа 1 Этаж открыт/);assert.match(content,/Карта этажа 3 Готова к использованию/);
 assert.match(content,/Чертёж первой пушки/);assert.ok(!content.includes('Ремонтный комплект'));assert.ok(!content.includes('Инструменты'));
});
test('guide explains current combat, repeat upgrades and permanent lift access',()=>{
 const text=fakeDOM(),content=text(createHelpPanel());
 assert.match(content,/несколько улучшений подряд/);assert.match(content,/дальность две клетки/);
 assert.match(content,/доступным навсегда/);assert.match(content,/больше не появляются на базе/);
});
