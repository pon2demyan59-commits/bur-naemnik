import { BUILDING_BLUEPRINTS, knowsBuildingBlueprint, buildingBlueprintAvailable, buyBuildingBlueprint } from './building-blueprints.js';
import { showBuildingMenu } from './game-menus.js';
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
  if(this.floorNumber||!this.constructionQuest.unlocked)return;this.dialogClosed();const panel=document.createElement('div');panel.className='lift-console construction-controls blueprint-catalog';
  const title=document.createElement('p');title.className='service-readout';title.textContent='ЧЕРТЕЖИ БАЗЫ · '+this.credits+' КРЕДИТОВ';const note=document.createElement('p');note.className='terminal-note';note.textContent='Кредиты: '+this.credits+'. Чертёж покупается один раз и сохраняется навсегда. Материалы для строительства и цена каждого улучшения оплачиваются отдельно. Первый склад уже готов бесплатно.';panel.append(title,note);
  for(const b of BUILDING_BLUEPRINTS){const card=document.createElement('section');card.className='settlement-project-card';const heading=document.createElement('h3');heading.textContent=b.name;const desc=document.createElement('p');desc.textContent=b.description;const status=document.createElement('p');status.className='terminal-note';const available=buildingBlueprintAvailable(b.id,this.constructionQuest,this.demyanQuest),known=this.knowsBuildingBlueprint(b.id);status.textContent=known?'Чертёж изучен':available?'Доступен у архитектора':b.id==='hq'?'После спасения и возвращения Демьяна':b.id==='warehouse-upgrade'?'После открытия склада':'После строительства штаба и поручения Демьяна';card.append(heading,desc,status);this.addBuildingBlueprintPurchase(card,b.id,()=>this.openBuildingBlueprints());
   if(known&&available){const use=document.createElement('button');use.className='floor-button';use.textContent=b.kind==='upgrade'?'К СКЛАДУ · УЛУЧШЕНИЯ':b.id==='hq'&&this.demyanQuest.hq?'ШТАБ ПОСТРОЕН':'ПЕРЕЙТИ К СТРОИТЕЛЬСТВУ';use.disabled=b.id==='hq'&&this.demyanQuest.hq;use.addEventListener('click',()=>{if(b.id==='hq')this.openHeadquartersBuild();else if(b.id==='warehouse-upgrade'){if(this.constructionAction()==='warehouse'){this.openWarehouse();return;}const d=document.createElement('p');d.className='terminal-note';d.textContent='Подъедь к воротам склада: улучшения доступны там. Чертёж открывает все его уровни.';card.append(d);use.disabled=true;}else this.openSettlementConstruction();});card.append(use);}
   panel.append(card);
  }
  showBuildingMenu('construction',panel);panel.parentElement.classList.add('settlement-layout');
 }
};
