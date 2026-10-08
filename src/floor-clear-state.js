import { BASE_SIZE } from './base-state.js';
export function floorClearReward(floor){return Number.isInteger(floor)&&floor>=0&&floor<=100?5000+floor*2500:0;}
export function restoreClearedFloors(value){return [...new Set(Array.isArray(value)?value.filter(f=>Number.isInteger(f)&&f>=0&&f<=100):[])].sort((a,b)=>a-b);}
export function remainingFloorBlocks(world){let n=0;for(let y=2;y<BASE_SIZE-2;y++)for(let x=2;x<BASE_SIZE-2;x++)if(world.blocked(x,y)&&Number.isFinite(world.hardness?.(x,y)??1))n++;return n;}
export function claimFloorClear(state,world,floor){
 const reward=floorClearReward(floor);if(!reward||state.clearedFloors?.includes(floor)||remainingFloorBlocks(world)>0)return 0;
 state.clearedFloors||=[];state.clearedFloors.push(floor);state.credits+=reward;return reward;
}
// Both automatic and manual collapse must consult this permanent campaign flag.
export function floorCanCollapse(progress,floor){return !restoreClearedFloors(progress?.clearedFloors).includes(floor);}
