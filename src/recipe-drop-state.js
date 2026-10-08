import { STRUCTURE_RECIPES } from './structure-recipes.js';
import { WEAPON_CATALOG } from './weapon-catalog.js';
import { BUILDING_BLUEPRINTS } from './building-blueprints.js';
export const RECIPE_DROP_CHANCE=.02;
export const RECIPE_DROP_POOL=[...STRUCTURE_RECIPES.filter(r=>r.id!=='weapon-basic'),{id:'warehouse-upgrade',name:'Расширение склада',category:'Улучшение здания',availability:'upgrade'}];
const validRecipeIds=new Set([...STRUCTURE_RECIPES.map(r=>r.id),'warehouse-upgrade']);
export function restoreRecipeKnowledge(value,blueprints=[],armory={}){
 const known=new Set(Array.isArray(value)?value.filter(id=>validRecipeIds.has(id)):[]);
 for(const b of BUILDING_BLUEPRINTS)if(blueprints.includes(b.id))known.add(b.id);
 for(const w of WEAPON_CATALOG)if(armory.blueprints?.includes(w.id)||(w.id==='basic'&&armory.blueprint))known.add('weapon-'+w.id);
 return [...validRecipeIds].filter(id=>known.has(id));
}
export function recipeIsLearned(state,id){return restoreRecipeKnowledge(state.learnedRecipes,state.buildingBlueprints,state.armoryQuest).includes(id);}
export function learnRecipe(state,id){
 if(!validRecipeIds.has(id))return false;
 state.learnedRecipes=restoreRecipeKnowledge(state.learnedRecipes,state.buildingBlueprints,state.armoryQuest);
 if(!state.learnedRecipes.includes(id))state.learnedRecipes.push(id);
 if(BUILDING_BLUEPRINTS.some(b=>b.id===id)){state.buildingBlueprints||=[];if(!state.buildingBlueprints.includes(id))state.buildingBlueprints.push(id);}
 if(id.startsWith('weapon-')){const key=id.slice(7);state.armoryQuest.blueprints||=[];if(!state.armoryQuest.blueprints.includes(key))state.armoryQuest.blueprints.push(key);}
 return true;
}
export function restoreRecipeAccess(state){for(const id of [...state.learnedRecipes])learnRecipe(state,id);}
export function awardRecipeDrop(state,floor,rng=Math.random){
 if(!Number.isInteger(floor)||floor<1||floor>100)return null;
 const known=new Set(restoreRecipeKnowledge(state.learnedRecipes,state.buildingBlueprints,state.armoryQuest)),pool=RECIPE_DROP_POOL.filter(r=>!known.has(r.id));
 if(!pool.length||rng()>=RECIPE_DROP_CHANCE)return null;
 const recipe=pool[Math.min(pool.length-1,Math.max(0,Math.floor(rng()*pool.length)))];learnRecipe(state,recipe.id);return recipe;
}
