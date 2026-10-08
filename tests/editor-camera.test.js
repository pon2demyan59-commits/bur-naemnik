import test from 'node:test';
import assert from 'node:assert/strict';
import { editorCameraMethods, editorZoomLimits } from '../src/editor-camera.js';
function scene(){
 const listeners=new Map(),shutdown=[];
 const camera={x:0,y:0,width:1000,height:700,zoom:.7,scrollX:800,scrollY:800,setZoom(z){this.zoom=z;return this;},setScroll(x,y){this.scrollX=x;this.scrollY=y;return this;},clampX(x){return Math.max((this.width/this.zoom-this.width)/2,Math.min(3200-this.width/2-this.width/(2*this.zoom),x));},clampY(y){return Math.max((this.height/this.zoom-this.height)/2,Math.min(3200-this.height/2-this.height/(2*this.zoom),y));}};
 globalThis.document={querySelector:()=>({open:false})};
 const s={...editorCameraMethods,layoutEditing:true,keys:{},cameras:{main:camera},input:{on:(k,f)=>listeners.set(k,f),off:(k,f)=>{if(listeners.get(k)===f)listeners.delete(k);}},events:{once:(k,f)=>shutdown.push(f)}};s.makeEditorCamera();return {s,camera,listeners,shutdown};
}
const point=(c,p)=>({x:c.scrollX+c.width/2+(p.x-c.width/2)/c.zoom,y:c.scrollY+c.height/2+(p.y-c.height/2)/c.zoom});
test('wheel keeps the world under the cursor stable and cannot zoom beyond the editor limits',()=>{
 const {camera,listeners}=scene(),wheel=listeners.get('wheel'),p={x:600,y:400};const before=point(camera,p);wheel(p,[],0,-100);const after=point(camera,p);assert.ok(camera.zoom>.7);assert.ok(Math.abs(before.x-after.x)<1e-10);assert.ok(Math.abs(before.y-after.y)<1e-10);
 for(let i=0;i<50;i++)wheel(p,[],0,-200);assert.equal(camera.zoom,1.1);for(let i=0;i<50;i++)wheel(p,[],0,200);assert.equal(camera.zoom,.45);
 camera.width=2400;assert.equal(editorZoomLimits(camera).min,.75);
});
test('all placement modes allow keyboard panning; play mode ignores editor wheel and panning',()=>{
 const {s,camera,listeners,shutdown}=scene();for(const mode of ['layoutEditing','hqSelecting','projectSelecting']){s.layoutEditing=s.hqSelecting=s.projectSelecting=false;s[mode]=true;s.keys={D:{isDown:true}};const x=camera.scrollX;s.updateEditorCamera(50);assert.ok(camera.scrollX>x);}
 s.layoutEditing=s.hqSelecting=s.projectSelecting=false;const x=camera.scrollX,z=camera.zoom;s.updateEditorCamera(50);listeners.get('wheel')({x:500,y:350},[],0,-100);assert.equal(camera.scrollX,x);assert.equal(camera.zoom,z);shutdown[0]();assert.equal(listeners.has('wheel'),false);
});
test('edge pan updates a dragged building and external panning keeps empty-map drag anchors in sync',()=>{
 const {s,camera}=scene();s.layoutStart={x:1500,y:1300,scrollX:800,scrollY:800};s.layoutPointer=1;s.layoutSelected='workshop';s.layoutOriginal={dx:0,dy:0};s.input.activePointer={x:995,y:350,isDown:true};let redraws=0;s.drawBuildingCandidate=()=>redraws++;s.updateEditorCamera(50);assert.ok(camera.scrollX>800);assert.equal(redraws,1);assert.equal(s.layoutStart.scrollX,camera.scrollX);assert.ok(Number.isInteger(s.layoutCandidate.dx));
});
