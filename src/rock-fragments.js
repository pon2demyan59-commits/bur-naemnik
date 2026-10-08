export const ROCK_COLORS={earth:0xc89b6b,stone:0xb6c2be,iron:0xd89778,copper:0xf0af69,bauxite:0xe4c8a1,tin:0xd4e7e6,zinc:0x91d7dd,nickel:0xc7dba3,chromium:0xadddc5,titanium:0xa9cbf4,tungsten:0xa4a7cf,gold:0xffdb6e,xenorite:0xdfadff};
function rockPolygon(g,points,color,stroke=false){g.fillStyle(color);g.beginPath();g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.closePath();g.fillPath();if(stroke){g.lineStyle(1.4,0x293d3b,.9);g.strokePath();}}
export function drawRockFragment(g,material,x,y,size=10,variant=0){
 const tone=ROCK_COLORS[material]||ROCK_COLORS.stone,body=material==='earth'?0xb38a60:0x82948d;
 const point=(a,b)=>[x+a*size,y+b*size],top=point(-.18,-.82),left=point(-.86,-.3),right=point(.68,-.38),bottom=point(.47,.66),front=point(-.4,.8),center=point(-.07,.05);
 rockPolygon(g,[left,top,right,bottom,front],body,true);
 rockPolygon(g,[left,top,right,center],material==='earth'?0xddb57e:0xc3d1c5);
 rockPolygon(g,[center,right,bottom,front],material==='earth'?0x99704f:0x637b76);
 g.lineStyle(1.2,0xf2e6c3,.75);g.lineBetween(...left,...top);g.lineBetween(...top,...right);
 if(material!=='earth'&&material!=='stone'){
  rockPolygon(g,[point(-.48,-.3),point(-.1,-.58),point(.21,-.28),point(-.08,.1)],tone);
  rockPolygon(g,[point(.08,.28),point(.39,.09),point(.46,.42),point(.2,.6)],tone);
  g.lineStyle(1,0xfff5d1,.85);g.lineBetween(x-size*.46,y-size*.3,x-size*.1,y-size*.53);
 }else {g.lineStyle(1,0x43594d,.65);g.lineBetween(x-size*.15,y-size*.48,x+size*.04,y-size*.12);g.lineBetween(x+size*.04,y-size*.12,x+size*.37,y-size*.16);}
 if(variant%2){g.fillStyle(tone,.7);g.fillCircle(x-size*.37,y+size*.4,1.1);}
}
