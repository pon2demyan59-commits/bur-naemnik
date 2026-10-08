import { smoothHeading, wrapDegrees, damp } from './drill-motion.js';
const angles = {right:0,down:90,left:180,up:-90};
// A compact collision circle keeps narrow cleared passages usable.
export function circleHitsRect(x,y,rect,radius=21) {
  const nx=Math.max(rect.x,Math.min(x,rect.x+rect.width));
  const ny=Math.max(rect.y,Math.min(y,rect.y+rect.height));
  return (x-nx)**2+(y-ny)**2<radius**2;
}
export function driveFits(x,y,solid,radius=21,cell=64) {
  if((solid.rectangles||[]).some(rect=>circleHitsRect(x,y,rect,radius)))return false;
  for(let cy=Math.floor((y-radius)/cell);cy<=Math.floor((y+radius)/cell);cy++)
    for(let cx=Math.floor((x-radius)/cell);cx<=Math.floor((x+radius)/cell);cx++) {
      if(!solid(cx,cy))continue;
      const nx=Math.max(cx*cell,Math.min(x,(cx+1)*cell));
      const ny=Math.max(cy*cell,Math.min(y,(cy+1)*cell));
      if((x-nx)**2+(y-ny)**2<radius**2)return false;
    }
  return true;
}
const clamp=(value,limit)=>Math.max(-limit,Math.min(limit,value));
function passageGuide(state,direction,solid) {
  if(!direction)return null;
  const horizontal=direction==='left'||direction==='right';
  const dx=direction==='right'?1:direction==='left'?-1:0;
  const dy=direction==='down'?1:direction==='up'?-1:0;
  const cx=Math.floor(state.x/64),cy=Math.floor(state.y/64);
  const flank=(x,y)=>horizontal?(solid(x,y-1)||solid(x,y+1)):(solid(x-1,y)||solid(x+1,y));
  // Assist only near walls or at the entrance to a clear, narrow passage.
  if(!flank(cx,cy)&&(solid(cx+dx,cy+dy)||!flank(cx+dx,cy+dy)))return null;
  const center=((horizontal?cy:cx)+.5)*64;
  const offset=center-(horizontal?state.y:state.x);
  const cross=horizontal?offset*dx:-offset*dy;
  const correction=clamp(Math.atan2(cross*9,Math.max(140,state.speed))*180/Math.PI,18);
  return {horizontal,center,dx,dy,target:angles[direction]+correction};
}
export function driveStep(state,direction,dt,solid,maxSpeed=280) {
  dt=Math.min(.05,Math.max(0,dt));
  const analog=direction&&typeof direction==='object';
  const length=analog?Math.hypot(direction.x,direction.y):0;
  if(analog&&(!Number.isFinite(length)||length<.001||!Number.isFinite(direction.strength)||direction.strength<=0))direction=null;
  const cardinal=direction?(analog?(Math.abs(direction.x)>=Math.abs(direction.y)?(direction.x>0?'right':'left'):(direction.y>0?'down':'up')):direction):null;
  let inputAngle=direction?(analog?Math.atan2(direction.y,direction.x)*180/Math.PI:angles[direction]):state.angle;
  // Rock is a grid: gently face the nearest side when the stick presses into it.
  const dx=cardinal==='right'?1:cardinal==='left'?-1:0,dy=cardinal==='down'?1:cardinal==='up'?-1:0;
  if(analog&&direction&&solid(Math.floor(state.x/64)+dx,Math.floor(state.y/64)+dy))inputAngle=angles[cardinal];
  const guide=Math.abs(wrapDegrees(inputAngle-angles[cardinal]))<23?passageGuide(state,cardinal,solid):null;
  const target=guide?.target??inputAngle;
  const angle=direction?smoothHeading(state.angle,target,dt,720,18):state.angle;
  const error=direction?Math.abs(wrapDegrees(inputAngle-angle)):0;
  const strength=direction?(analog?Math.min(1,direction.strength):1):0;
  // A short deflection creeps; a full deflection drives at normal speed.
  const desired=maxSpeed*strength*(1-.55*Math.min(1,error/90));
  let speed=damp(state.speed,desired,direction?12:16,dt);
  if(!direction&&speed<3)speed=0;
  let x=state.x,y=state.y,blocked=false;
  const distance=speed*dt,steps=Math.max(1,Math.ceil(distance/3));
  const radians=angle*Math.PI/180;
  for(let i=0;i<steps;i++) {
    const nx=x+Math.cos(radians)*distance/steps,ny=y+Math.sin(radians)*distance/steps;
    if(!driveFits(nx,ny,solid)) {
      if(guide) {
        // Glide along the edge when the nose touches an entrance corner.
        // Every small corrective step still uses the same collision checks.
        const stride=distance/steps;
        const fx=x+guide.dx*stride,fy=y+guide.dy*stride;
        if(driveFits(fx,fy,solid)) {x=fx;y=fy;continue;}
        const sx=guide.horizontal?x:x+clamp(guide.center-x,stride);
        const sy=guide.horizontal?y+clamp(guide.center-y,stride):y;
        if(Math.hypot(sx-x,sy-y)>.001&&driveFits(sx,sy,solid)) {x=sx;y=sy;continue;}
      }
      // A blocked normal component must not cancel travel along the wall.
      // This also handles building rectangles, which are outside the tile guide.
      // Require meaningful input along the edge so pressing straight into a
      // wall still stops instead of creeping sideways during the chassis turn.
      const inputRadians=inputAngle*Math.PI/180;
      const slides=[
        {x:nx,y,amount:Math.abs(nx-x),intent:Math.abs(Math.cos(inputRadians))},
        {x,y:ny,amount:Math.abs(ny-y),intent:Math.abs(Math.sin(inputRadians))}
      ].sort((a,b)=>b.amount-a.amount);
      const slide=direction&&slides.find(p=>p.amount>.001&&p.intent>=.25&&driveFits(p.x,p.y,solid));
      if(slide){x=slide.x;y=slide.y;continue;}
      blocked=true;speed=0;break;
    }
    x=nx;y=ny;
  }
  return {x,y,angle,speed,blocked,cardinal,moving:Math.hypot(x-state.x,y-state.y)>.001};
}


