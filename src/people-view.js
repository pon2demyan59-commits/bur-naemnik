export const PEOPLE_ROWS = ['serega','mechanic','armorer'];
export function preparePeopleFrames(scene) {
  const texture=scene.textures.get('people'),source=texture.getSourceImage();
  const width=source.width/4,height=source.height/3;
  PEOPLE_ROWS.forEach((name,row)=>{
    for(let pose=0;pose<4;pose++)if(!texture.has(`${name}-${pose}`))texture.add(`${name}-${pose}`,0,pose*width,row*height,width,height);
  });
  const ilya=scene.textures.get('ilya'),image=ilya.getSourceImage();
  for(let pose=0;pose<4;pose++)if(!ilya.has('ilya-'+pose))ilya.add('ilya-'+pose,0,pose*image.width/4,0,image.width/4,image.height);
}
export function makePerson(scene,x,y,name) {
  const person=scene.add.container(x,y).setDepth(10);
  const shadow=scene.add.ellipse(0,18,29,10,0x071919,.32);
  const previous=scene.add.image(0,23,name==='ilya'?'ilya':'people',`${name}-0`).setOrigin(.5,.85).setDisplaySize(78,78).setAlpha(0);
  const art=scene.add.image(0,23,name==='ilya'?'ilya':'people',`${name}-0`).setOrigin(.5,.85).setDisplaySize(78,78);
  person.add([shadow,previous,art]);person.workerName=name;person.workerArt=art;
  person.workerPrevious=previous;person.workerPose=0;person.workerBlend=1;
  person.workerTime=(name==='ilya'?3:PEOPLE_ROWS.indexOf(name))*1.37;
  return person;
}
export function updatePerson(person,delta,rig) {
  if(!person?.visible)return;
  person.workerTime+=Math.max(0,Math.min(delta,50))/1000;
  const t=person.workerTime;
  const near=rig&&Math.hypot(rig.x-person.x,rig.y-person.y)<220;
  const phase=t%(near?4.5:6.5);
  // A short greeting, then a longer rest. Keep the feet anchored.
  const pose=phase<2.2?(phase<.3||phase>1.9?1:1+Math.floor((phase-.3)/.38)%2):0;
  if(pose!==person.workerPose){
    person.workerPrevious.setFrame(`${person.workerName}-${person.workerPose}`);
    person.workerPose=pose;person.workerBlend=0;
  }
  person.workerBlend=Math.min(1,person.workerBlend+Math.max(0,Math.min(delta,50))/160);
  person.workerArt.setAlpha(person.workerBlend);
  person.workerPrevious.setAlpha(1-person.workerBlend);
  person.workerArt.setFrame(`${person.workerName}-${pose}`);
  for(const art of [person.workerArt,person.workerPrevious])art.setScale(78/art.frame.width,78/art.frame.height*(1+Math.sin(t*2.1)*.012));
}
