import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STRUCTURE_RECIPES, STRUCTURE_CATEGORIES, structureRecipe, formatStructureRecipe, filterStructureRecipes } from '../src/structure-recipes.js';
import { HQ_RECIPE } from '../src/demyan-state.js';
import { SETTLEMENT_PROJECTS } from '../src/settlement-state.js';
import { WAREHOUSE_RECIPE } from '../src/construction-state.js';
import { buyBuildingBlueprint } from '../src/building-blueprints.js';
test('catalogue has fifteen buildings, three obstacles, three traps and ten recipes in other categories',()=>{
 assert.equal(STRUCTURE_RECIPES.length,51);assert.equal(new Set(STRUCTURE_RECIPES.map(r=>r.id)).size,51);
 for(const category of STRUCTURE_CATEGORIES)assert.equal(filterStructureRecipes(category).length,category==='Здания'?15:['Препятствия','Ловушки'].includes(category)?3:10);
 assert.deepEqual(filterStructureRecipes('Препятствия').map(r=>r.name),['Колючая проволока','Электрическая преграда','Вращающееся лезвие']);
 assert.deepEqual(filterStructureRecipes('Ловушки').map(r=>r.name).sort(),['Капкан','Мины','Шипы']);
 for(const id of ['hq','architect','housing','power','warehouse','porodnik','workshop','armory','repair','smelter','alloy','assembly','lab','fame','lift'])assert.ok(structureRecipe(id));
 for(const r of STRUCTURE_RECIPES){assert.ok(r.ingredients.length);for(const p of r.ingredients){assert.ok(p.name);assert.ok(Number.isSafeInteger(p.count)&&p.count>0);}}
});
test('remaining defense and weapon recipes retain canonical ingredient names and amounts after approved simplification',()=>{
 const lines=readFileSync(new URL('../docs/canon-miro.txt',import.meta.url),'utf8').split('\n').map(l=>l.split('\t')).filter(c=>STRUCTURE_CATEGORIES.includes(c[1])&&c[1]!=='Здания');assert.equal(lines.length,50);
 const originalNames={'Электрическая преграда':'Электрическая ограда','Вращающееся лезвие':'Вращающиеся лезвия','Капкан':'Электрический капкан','Мины':'Осколочная мина','Шипы':'Нажимные шипы'};
 for(const r of STRUCTURE_RECIPES.filter(r=>r.category!=='Здания')){const line=lines.find(([name,category])=>name===(originalNames[r.name]||r.name)&&category===r.category);assert.ok(line,r.name);assert.equal(formatStructureRecipe(r),line[2]);assert.equal(r.balance,'canon');}
});
test('catalogue recipes for existing construction match real material debits and keep the first warehouse free',()=>{
 for(const [id,recipe] of Object.entries({hq:HQ_RECIPE,housing:SETTLEMENT_PROJECTS.housing.recipe,power:SETTLEMENT_PROJECTS.power.recipe,warehouse:WAREHOUSE_RECIPE}))assert.deepEqual(Object.fromEntries(structureRecipe(id).ingredients.map(p=>[p.id,p.count])),recipe);
 assert.equal(structureRecipe('warehouse').availability,'story');assert.equal(structureRecipe('lift').size,'7×7');assert.equal(structureRecipe('architect').size,'4×4');
});
test('unimplemented projects cannot be bought or placed through the blueprint shop',()=>{
 for(const r of STRUCTURE_RECIPES.filter(r=>r.availability==='planned'))assert.deepEqual(buyBuildingBlueprint([],r.id,100000,{unlocked:true,warehouse:true},{hq:true,settlementBriefed:true,returned:true}),{bought:false,credits:100000});
});
test('recipe lookup searches materials and names without mixing category results',()=>{
 assert.equal(filterStructureRecipes('Башни','пЛаЗмЕнНаЯ').length,1);assert.equal(filterStructureRecipes('Здания','золотосодержащая')[0].id,'lab');assert.equal(filterStructureRecipes('Ловушки','Бункерный бетон').length,0);assert.equal(filterStructureRecipes('Преграды','несуществующий рецепт').length,0);
});
