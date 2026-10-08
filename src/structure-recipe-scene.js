import { STRUCTURE_CATEGORIES, STRUCTURE_RECIPES, filterStructureRecipes, formatStructureRecipe } from './structure-recipes.js';
import { showBuildingMenu } from './game-menus.js';
export const structureRecipeMethods={
 openStructureRecipes(category='Здания'){
  if(this.floorNumber||!this.constructionQuest.unlocked)return;this.dialogClosed();const panel=document.createElement('div');panel.className='lift-console structure-recipe-console';
  const title=document.createElement('p');title.className='service-readout';title.textContent='КНИГА РЕЦЕПТОВ\n'+STRUCTURE_RECIPES.length+' проектов';
  const note=document.createElement('p');note.className='terminal-note';note.textContent='Состав на одну постройку или один предмет. Проекты с отметкой «План» можно изучить здесь; их строительство откроется позже.';
  const filters=document.createElement('div');filters.className='structure-recipe-filters';const select=document.createElement('select');select.setAttribute('aria-label','Тип сооружения');
  for(const key of STRUCTURE_CATEGORIES){const option=document.createElement('option');option.value=key;option.textContent=key+' · '+STRUCTURE_RECIPES.filter(r=>r.category===key).length;select.append(option);}select.value=STRUCTURE_CATEGORIES.includes(category)?category:'Здания';
  const search=document.createElement('input');search.type='search';search.placeholder='Название или материал';search.setAttribute('aria-label','Поиск рецепта');filters.append(select,search);
  const count=document.createElement('p');count.className='terminal-note';count.setAttribute('role','status');const list=document.createElement('div');list.className='structure-recipe-grid';
  const render=()=>{const recipes=filterStructureRecipes(select.value,search.value);count.textContent='Найдено: '+recipes.length;list.replaceChildren();for(const r of recipes){const card=document.createElement('section');card.className='structure-recipe-card';card.dataset.recipe=r.id;const name=document.createElement('h3');name.textContent=r.name+(r.size?' · '+r.size:'');const status=document.createElement('p');status.className='recipe-availability';status.textContent=r.availability==='build'?'Строительство доступно по чертежу':r.availability==='weapon'?'Изготовление в оружейной':r.availability==='story'?'Сюжетная постройка · дополнительные экземпляры в плане':'План · строительство ещё не введено';
   const recipe=document.createElement('p');recipe.className='structure-recipe-ingredients';recipe.textContent=formatStructureRecipe(r);card.append(name,status,recipe);const learned=document.createElement('p');learned.className='recipe-availability';learned.textContent=this.recipeLearned(r.id)?'✓ Рецепт изучен':'○ Рецепт ещё не найден';card.append(learned);
   if(r.leader){const leader=document.createElement('p');leader.className='terminal-note';leader.textContent=r.leader+' · '+r.role;card.append(leader);}
   if(r.id==='warehouse'){const gift=document.createElement('p');gift.className='terminal-note';gift.textContent='Первый склад появляется бесплатно. Этот рецепт — для будущих дополнительных складов.';card.append(gift);}
   list.append(card);
  }};
  select.addEventListener('change',render);search.addEventListener('input',render);const back=document.createElement('button');back.className='floor-button';back.textContent='← К ЧЕРТЕЖАМ';back.addEventListener('click',()=>this.openBuildingBlueprints());panel.append(title,note,filters,count,list,back);render();showBuildingMenu('construction',panel);panel.parentElement.classList.add('settlement-layout');
 }
};
