import { recipeArt } from './recipe-presentation.js';
import { STRUCTURE_RECIPES, structureRecipe, formatStructureRecipe } from './structure-recipes.js';
import { warehouseUpgradePrice } from './construction-state.js';
import { BUILDING_BLUEPRINTS, knowsBuildingBlueprint, buildingBlueprintAvailable, buyBuildingBlueprint } from './building-blueprints.js';
import { showGamePanel } from './game-menus.js';
export const buildingBlueprintMethods={
 knowsBuildingBlueprint(id){return knowsBuildingBlueprint(this.buildingBlueprints,id);},
 purchaseBuildingBlueprint(id){
  const result=buyBuildingBlueprint(this.buildingBlueprints,id,this.credits,this.constructionQuest,this.demyanQuest);
  if(!result.bought)return false;this.credits=result.credits;this.refreshHUD();this.persist();return true;
 },
 addBuildingBlueprintPurchase(panel,id,refresh){
  const b=BUILDING_BLUEPRINTS.find(b=>b.id===id),known=this.knowsBuildingBlueprint(id),button=document.createElement('button');button.className='metal-button';button.dataset.blueprint=id;
  button.textContent=known?'ЧЕРТЁЖ ИЗУЧЕН':`КУПИТЬ ЧЕРТЁЖ · ${b.price} КР.`;
  button.disabled=known||!buildingBlueprintAvailable(id,this.constructionQuest,this.demyanQuest)||this.credits<b.price;
  button.addEventListener('click',()=>{if(this.purchaseBuildingBlueprint(id))refresh();});panel.append(button);
 },
 openBuildingBlueprints(){
  if(this.floorNumber||!this.constructionQuest.unlocked)return;this.dialogClosed();const panel=document.createElement('div');panel.className='blueprint-catalog';
  const title=document.createElement('p');title.className='service-readout';title.textContent='ЧЕРТЕЖИ БАЗЫ · '+this.credits+' КРЕДИТОВ';const note=document.createElement('p');note.className='terminal-note';note.textContent='Кредиты: '+this.credits+'. Чертёж покупается один раз и сохраняется навсегда. Материалы для строительства и цена каждого улучшения оплачиваются отдельно. Первый склад уже готов бесплатно.';const intro=document.createElement('header');intro.className='blueprint-intro';intro.append(title,note);panel.append(intro);const book=document.createElement('button');book.className='floor-button structure-book-button';book.textContent='ВСЕ РЕЦЕПТЫ · '+STRUCTURE_RECIPES.length+' ПРОЕКТОВ';book.addEventListener('click',()=>this.openStructureRecipes());panel.append(book);const grid=document.createElement('div');grid.className='blueprint-project-grid';panel.append(grid);
  for(const b of BUILDING_BLUEPRINTS){const card=document.createElement('section');card.className='settlement-project-card blueprint-banner';const drawing=document.createElement('div');drawing.className='blueprint-banner-drawing';const image=document.createElement('img');image.src=recipeArt(structureRecipe(b.id==='warehouse-upgrade'?'warehouse':b.id));image.alt=b.name;image.loading='lazy';const seal=document.createElement('span');seal.className='blueprint-banner-seal';seal.textContent='ПРОЕКТ УБЕЖИЩА';drawing.append(image,seal);card.append(drawing);const body=document.createElement('div');body.className='blueprint-banner-body';card.append(body);const heading=document.createElement('h3');heading.textContent=b.name;const desc=document.createElement('p');desc.textContent=b.description;const status=document.createElement('p');status.className='terminal-note';const available=buildingBlueprintAvailable(b.id,this.constructionQuest,this.demyanQuest),known=this.knowsBuildingBlueprint(b.id);status.textContent=known?'Чертёж изучен':available?'Доступен у архитектора':b.id==='hq'?'После спасения и возвращения Демьяна':b.id==='warehouse-upgrade'?'После открытия склада':'После строительства штаба и поручения Демьяна';body.append(heading,desc,status);const recipe=document.createElement('p');recipe.className='structure-recipe-ingredients';recipe.textContent=b.id==='warehouse-upgrade'?'Следующий уровень: '+warehouseUpgradePrice(this.constructionQuest)+' кредитов':formatStructureRecipe(structureRecipe(b.id));body.append(recipe);this.addBuildingBlueprintPurchase(body,b.id,()=>this.openBuildingBlueprints());
   if(known&&available){const built=b.id==='hq'?this.demyanQuest.hq:this.baseProjects[b.id]?.built;const use=document.createElement('button');use.className='floor-button';use.textContent=b.kind==='upgrade'?'К СКЛАДУ · УЛУЧШЕНИЯ':built?'ЗДАНИЕ ПОСТРОЕНО':'ПЕРЕЙТИ К СТРОИТЕЛЬСТВУ';use.disabled=!!built;use.addEventListener('click',()=>{if(b.id==='hq')this.openHeadquartersBuild();else if(b.id==='warehouse-upgrade'){if(this.constructionAction()==='warehouse'){this.openWarehouse();return;}const d=document.createElement('p');d.className='terminal-note';d.textContent='Подъедь к воротам склада: улучшения доступны там. Чертёж открывает все его уровни.';body.append(d);use.disabled=true;}else this.openSettlementConstruction();});body.append(use);}
   grid.append(card);
  }
  showGamePanel('ДОМ АРХИТЕКТОРА',panel,'blueprints');
 }
};
