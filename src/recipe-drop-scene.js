import { awardRecipeDrop, recipeIsLearned } from './recipe-drop-state.js';
export const recipeDropMethods={
 recipeLearned(id){return recipeIsLearned(this,id);},
 findRecipeInBrokenBlock(){
  const recipe=awardRecipeDrop(this,this.floorNumber);if(!recipe)return null;
  this.persist();this.refreshHUD();const note=recipe.availability==='planned'||recipe.availability==='story'?'Рецепт изучен навсегда. Он сохранён в книге; строительство этого проекта откроется позже.':recipe.id.startsWith('weapon-')?'Чертёж изучен бесплатно. В оружейной осталось собрать материалы и изготовить оружие.':'Чертёж изучен бесплатно. Выполни сюжетные условия и собери материалы, чтобы использовать его на базе.';
  this.showDiscovery({kind:'blueprint',name:recipe.name,description:'Найден рецепт · '+recipe.category,note});return recipe;
 }
};
