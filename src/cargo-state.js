import { MATERIALS } from './materials.js';
export const CARGO_CAPACITY=200;
// Earth/stone are canonical. Ore prices are temporary balance for the new sale UI.
export const MATERIAL_PRICES={earth:2,stone:5,iron:12,copper:16,bauxite:20,tin:24,zinc:32,nickel:48,chromium:64,titanium:96,tungsten:160,gold:200,xenorite:1000};
export function cargoCount(hold){return MATERIALS.reduce((n,m)=>n+(hold?.[m.id]||0),0);}
export function restoreCargo(hold,legacyCount=0,capacity=CARGO_CAPACITY){
 const out={};let remaining=capacity;
 if(hold&&typeof hold==='object'&&!Array.isArray(hold)){
  for(const {id} of MATERIALS){const value=hold[id];if(Number.isSafeInteger(value)&&value>0){out[id]=Math.min(value,remaining);remaining-=out[id];}}
 }else if(Number.isInteger(legacyCount)&&legacyCount>0)out.earth=Math.min(capacity,legacyCount);
 return out;
}
export function addCargo(hold,id,capacity=CARGO_CAPACITY){
 if(!Object.hasOwn(MATERIAL_PRICES,id)||cargoCount(hold)>=capacity)return false;
 hold[id]=(hold[id]||0)+1;return true;
}
export function quoteCargo(hold,selection,saleBonus=0){
 const sale={};let amount=0,payout=0;
 for(const {id} of MATERIALS){
  const requested=selection?.[id];
  if(!Number.isSafeInteger(requested)||requested<=0)continue;
  const quantity=Math.min(requested,hold[id]||0);
  if(quantity<=0)continue;
  sale[id]=quantity;amount+=quantity;payout+=quantity*MATERIAL_PRICES[id];
 }
 return {sale,amount,payout:Math.round(payout*(1+saleBonus))};
}
export function takeCargoSale(hold,selection,saleBonus=0){
 const result=quoteCargo(hold,selection,saleBonus);if(!result.amount)return null;
 for(const [id,count] of Object.entries(result.sale)){hold[id]-=count;if(hold[id]===0)delete hold[id];}
 return {...result,...(saleBonus?{saleBonus}:{}),remaining:10000};
}

