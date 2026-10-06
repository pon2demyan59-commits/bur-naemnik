import { smoothHeading, wrapDegrees, damp } from './drill-motion.js';
const angles = {right:0,down:90,left:180,up:-90};
// A compact collision circle keeps narrow cleared passages usable.
export function driveFits(x,y,solid,radius=21,cell=64) {
  for(let cy=Math.floor((y-radius)/cell);cy<=Math.floor((y+radius)/cell);cy++)
    for(let cx=Math.floor((x-radius)/cell);cx<=Math.floor((x+radius)/cell);cx++) {
      if(!solid(cx,cy))continue;
      const nx=Math.max(cx*cell,Math.min(x,(cx+1)*cell));
      const ny=Math.max(cy*cell,Math.min(y,(cy+1)*cell));
      if((x-nx)**2+(y-ny)**2<radius**2)return false;
    }
  return true;
}
export function driveStep(state,direction,dt,solid) {
  dt=Math.min(.05,Math.max(0,dt));
  const angle=direction?smoothHeading(state.angle,angles[direction],dt,720,18):state.angle;
  const error=direction?Math.abs(wrapDegrees(angles[direction]-angle)):0;
  // Turn while travelling: reduce speed in a tight bend, never wait for alignment.
  const desired=direction?280*(1-.55*Math.min(1,error/90)):0;
  let speed=damp(state.speed,desired,direction?12:16,dt);
  if(!direction&&speed<3)speed=0;
  let x=state.x,y=state.y,blocked=false;
  const distance=speed*dt,steps=Math.max(1,Math.ceil(distance/3));
  const radians=angle*Math.PI/180;
  for(let i=0;i<steps;i++) {
    const nx=x+Math.cos(radians)*distance/steps,ny=y+Math.sin(radians)*distance/steps;
    if(!driveFits(nx,ny,solid)) {blocked=true;speed=0;break;}
    x=nx;y=ny;
  }
  return {x,y,angle,speed,blocked,moving:Math.hypot(x-state.x,y-state.y)>.001};
}
