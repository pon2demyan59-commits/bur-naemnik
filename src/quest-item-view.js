export function makeQuestItem(scene,x,y,kind){
 const root=scene.add.container(x,y).setDepth(10);
 const shadow=scene.add.ellipse(0,25,65,20,0x102b28,.3);
 const art=scene.add.image(0,-3,'quest-'+kind).setDisplaySize(84,84);
 root.add([shadow,art]);scene.tweens.add({targets:art,y:-7,duration:1200,yoyo:true,repeat:-1,ease:'Sine.InOut'});return root;
}
