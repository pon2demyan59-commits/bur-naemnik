// Initial credit balance. Only implemented construction and building upgrades are sold.
export const BUILDING_BLUEPRINTS=[
 {id:'hq',name:'Штаб',price:400,description:'Командный центр Демьяна П. · 9×8 клеток',kind:'build'},
 {id:'housing',name:'Жилой комплекс',price:500,description:'Жильё на 10 человек · 5×5 клеток',kind:'build'},
 {id:'power',name:'Электростанция',price:700,description:'Энергия для будущих производств · 4×4 клетки',kind:'build'},
 {id:'warehouse-upgrade',name:'Расширение склада',price:300,description:'Открывает улучшения склада: +100 каждого материала за уровень',kind:'upgrade'}
];
export function restoreBuildingBlueprints(value,construction={},demyan={},projects={}){
 const known=new Set(Array.isArray(value)?value:[]);
 // Existing and paid construction keeps its access when migrating old saves.
 if(demyan.hq||demyan.remaining!=null)known.add('hq');
 for(const key of ['housing','power'])if(projects[key]?.built||projects[key]?.remaining!=null)known.add(key);
 if(construction.warehouseLevel>=2)known.add('warehouse-upgrade');
 return BUILDING_BLUEPRINTS.filter(b=>known.has(b.id)).map(b=>b.id);
}
export function knowsBuildingBlueprint(known,id){return Array.isArray(known)&&known.includes(id);}
export function buildingBlueprintAvailable(id,construction,demyan){
 if(!construction?.unlocked)return false;
 if(id==='hq')return !!demyan?.returned;
 if(id==='warehouse-upgrade')return !!construction.warehouse;
 if(id==='housing'||id==='power')return !!demyan?.hq&&!!demyan?.settlementBriefed;
 return false;
}
export function buyBuildingBlueprint(known,id,credits,construction,demyan){
 const b=BUILDING_BLUEPRINTS.find(b=>b.id===id);
 if(!b||knowsBuildingBlueprint(known,id)||!buildingBlueprintAvailable(id,construction,demyan)||!Number.isSafeInteger(credits)||credits<b.price)return {bought:false,credits};
 known.push(id);return {bought:true,credits:credits-b.price};
}
