import { BASE_SIZE, CELL } from './base-state.js';
export const EDITOR_ZOOM_MIN=.45,EDITOR_ZOOM_MAX=1.1;
export function editorCameraActive(scene){return !!(scene.layoutEditing||scene.hqSelecting||scene.projectSelecting);}
export function editorZoomLimits(camera){return {min:Math.min(EDITOR_ZOOM_MAX,Math.max(EDITOR_ZOOM_MIN,camera.width/(BASE_SIZE*CELL),camera.height/(BASE_SIZE*CELL))),max:EDITOR_ZOOM_MAX};}
export function clampEditorZoom(camera,value){const {min,max}=editorZoomLimits(camera);return Math.max(min,Math.min(max,value));}
export const editorCameraMethods={
 makeEditorCamera(){
  const wheel=(pointer,over,dx,dy)=>{
   if(!editorCameraActive(this)||document.querySelector('#dialog').open||!Number.isFinite(dy)||!dy)return;
   const camera=this.cameras.main,old=camera.zoom,next=clampEditorZoom(camera,old*Math.exp(-Math.max(-200,Math.min(200,dy))*.0015));if(next===old)return;
   const x=pointer.x-camera.x-camera.width/2,y=pointer.y-camera.y-camera.height/2;
   camera.setZoom(next);this.panEditorCamera(x*(1/old-1/next),y*(1/old-1/next));
   // Rebase an empty-map drag when zoom changes; retain building drag world anchors.
   const anchors=[!this.layoutSelected&&this.layoutStart,this.hqPointer,this.projectPanPointer].filter(Boolean);
   for(const a of anchors){a.scrollX=camera.scrollX;a.scrollY=camera.scrollY;if('screenX' in a){a.screenX=pointer.x;a.screenY=pointer.y;}else{a.x=pointer.x;a.y=pointer.y;}a.moved=true;}
   this.editorZoom=next;
  };
  this.input.on('wheel',wheel);this.events.once('shutdown',()=>this.input.off('wheel',wheel));
 },
 panEditorCamera(dx,dy){
  const camera=this.cameras.main,oldX=camera.scrollX,oldY=camera.scrollY;
  camera.setScroll(camera.clampX(oldX+dx),camera.clampY(oldY+dy));
  for(const a of [this.layoutStart,this.hqPointer,this.projectPanPointer])if(a){a.scrollX+=camera.scrollX-oldX;a.scrollY+=camera.scrollY-oldY;}
 },
 updateEditorCamera(delta){
  if(!editorCameraActive(this)||document.querySelector('#dialog').open)return;
  const keys=this.keys||{},held=(...names)=>names.some(n=>keys[n]?.isDown);
  let x=Number(held('D','RIGHT'))-Number(held('A','LEFT')),y=Number(held('S','DOWN'))-Number(held('W','UP'));
  const p=this.input.activePointer,camera=this.cameras.main;
  // Keep following a dragged building when the cursor reaches the screen edge.
  if(this.layoutPointer!=null&&this.layoutSelected&&p?.isDown){const edge=40;if(p.x<camera.x+edge)x-=1;else if(p.x>camera.x+camera.width-edge)x+=1;if(p.y<camera.y+edge)y-=1;else if(p.y>camera.y+camera.height-edge)y+=1;}
  if(!x&&!y)return;const length=Math.hypot(x,y),distance=600*Math.min(.05,Math.max(0,delta/1000))/camera.zoom;
  this.panEditorCamera(x/length*distance,y/length*distance);
  if(this.layoutPointer!=null&&this.layoutSelected&&p?.isDown){const world={x:camera.scrollX+camera.width/2+(p.x-camera.x-camera.width/2)/camera.zoom,y:camera.scrollY+camera.height/2+(p.y-camera.y-camera.height/2)/camera.zoom};this.layoutCandidate={dx:this.layoutOriginal.dx+Math.round((world.x-this.layoutStart.x)/CELL),dy:this.layoutOriginal.dy+Math.round((world.y-this.layoutStart.y)/CELL)};this.drawBuildingCandidate();}
 }
};
