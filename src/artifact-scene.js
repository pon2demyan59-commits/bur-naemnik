import { collectArtifact } from './artifact-state.js';
import { CELL } from './base-state.js';
export const artifactSceneMethods={
 updateArtifactFinds(){
  const hidden=this.world.hiddenArtifacts;if(!hidden)return;
  this.artifactViews??=new Map();
  for(const item of hidden.items){
   const x=item.cell%50,y=Math.floor(item.cell/50),revealed=item.cell>=0&&!item.found&&!this.world.blocked(x,y);
   let view=this.artifactViews.get(item.id);
   if(!revealed){view?.destroy();this.artifactViews.delete(item.id);continue;}
   if(!view){const cx=(x+.5)*CELL,cy=(y+.5)*CELL,g=this.add.graphics().setDepth(12);g.fillStyle(0x0c2526,.35);g.fillEllipse(cx,cy+15,38,14);g.lineStyle(4,0x49331d);g.fillStyle(0xe5aa55);g.fillRoundedRect(cx-15,cy-19,30,34,8);g.strokeRoundedRect(cx-15,cy-19,30,34,8);g.fillStyle(0x73babe);g.fillCircle(cx,cy-4,8);g.lineStyle(2,0xffe9a5);g.strokeCircle(cx,cy-4,11);this.artifactViews.set(item.id,g);view=g;}
   if(Math.hypot(this.rig.x-(x+.5)*CELL,this.rig.y-(y+.5)*CELL)<CELL){const a=collectArtifact(hidden,this.artifacts,item.cell);if(a){view.destroy();this.artifactViews.delete(item.id);this.notify('АРТЕФАКТ НАЙДЕН · '+a.name);this.persist();}}
  }
 }
};
