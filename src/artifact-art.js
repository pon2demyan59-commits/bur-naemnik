import { ARTIFACTS } from './artifact-catalog.js';
// Cartoon relics: each catalog entry has a stable silhouette, facets and rarity glow.
const ARTIFACT_PALETTES=['#a9cf91','#79ddae','#5edbd0','#70b9ff','#a894ff','#ee88d9','#ffa76e','#ffe078','#ff837f','#e9daff'];
const artifactImages=new Map();
export function artifactArtSource(idOrName){
 const index=ARTIFACTS.findIndex(a=>a.id===idOrName||a.name===idOrName);
 if(index<0)return './public/assets/quests/discovery-artifact.svg';
 if(artifactImages.has(index))return artifactImages.get(index);
 const a=ARTIFACTS[index],tier=Math.floor(index/20),variant=index%20,c=ARTIFACT_PALETTES[tier];
 const n=a.name.toLocaleLowerCase('ru-RU');
 let shape;
 if(/кольцо|петля|венец|корона/.test(n))shape='<ellipse cx="128" cy="127" rx="56" ry="62" fill="none" stroke="url(#metal)" stroke-width="23"/><path d="M78 91l8-27 22 16 20-31 20 31 22-16 8 27" fill="url(#gem)"/>';
 else if(/сердце|пульс|нерв/.test(n))shape='<path d="M128 190L67 130C35 87 88 47 128 83C168 47 221 87 189 130Z" fill="url(#gem)"/><path d="M72 126h27l13-23 19 44 14-23h37" fill="none" stroke="#fff4c8" stroke-width="5"/>';
 else if(/глаз|око|линза|зеркало/.test(n))shape='<path d="M55 128Q128 42 201 128Q128 214 55 128Z" fill="url(#metal)"/><circle cx="128" cy="128" r="42" fill="url(#gem)"/><ellipse cx="128" cy="128" rx="12" ry="31" fill="#152930"/><circle cx="116" cy="112" r="9" fill="#fff" opacity=".8"/>';
 else if(/звезда|солнце|рассвет|свет|искра|маяк/.test(n))shape='<path d="M128 49l20 46 50-5-31 39 20 47-48-17-34 35-1-52-48-21 49-16Z" fill="url(#gem)"/><circle cx="128" cy="126" r="22" fill="#fff1b2"/><path d="M128 49v47M198 90l-49 24M187 176l-43-33M105 194l13-49M56 121l48 5" fill="none" stroke="#fff" opacity=".3"/>';
 else if(/нить|узел|голос|шёпот|эхо|зов/.test(n))shape='<path d="M70 169C24 69 183 37 177 116C172 178 68 201 81 122C94 44 217 79 185 181" fill="none" stroke="url(#gem)" stroke-width="19" stroke-linecap="round"/><circle cx="70" cy="169" r="13" fill="#fff1b2"/><circle cx="185" cy="181" r="13" fill="#fff1b2"/>';
 else if(/капля|слеза|сгусток/.test(n))shape='<path d="M128 48C118 86 65 111 71 151C78 211 183 211 187 151C193 111 143 87 128 48Z" fill="url(#gem)"/><path d="M119 89C105 112 88 134 90 151" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round" opacity=".55"/>';
 else if(/печать|ключ|память/.test(n))shape='<path d="M83 66h90l25 37-15 76-55 25-55-25-15-76Z" fill="url(#metal)"/><path d="M100 89h56l17 24-9 48-36 18-36-18-9-48Z" fill="url(#gem)"/><path d="M128 106v45m-14-31h28m-28 17h28" fill="none" stroke="#fff0b0" stroke-width="7"/>';
 else if(/мотылёк|кокон|призрак|дыхание/.test(n))shape='<path d="M126 117C51 24 24 131 96 157C48 223 133 201 128 151C123 201 208 223 160 157C232 131 205 24 130 117Z" fill="url(#gem)"/><path d="M128 98v76" fill="none" stroke="url(#metal)" stroke-width="13" stroke-linecap="round"/>';
 else {const tip=49+(variant%5)*4,left=65+(variant%4)*3;shape=`<path d="M128 ${tip}L184 91 192 151 145 204 85 181 ${left} 113Z" fill="url(#gem)"/><path d="M128 ${tip}l-19 77 36 78 7-94 32-19-75 35-44-13" fill="none" stroke="#fff" opacity=".32" stroke-width="3"/>`;}
 const shards=Array.from({length:3+tier},(_,i)=>{const angle=(i*137+variant*11)*Math.PI/180,r=83+(i%3)*7,x=128+Math.cos(angle)*r,y=126+Math.sin(angle)*r;return `<path d="M${x.toFixed(1)} ${(y-5).toFixed(1)}l4 5-4 5-4-5Z" fill="${c}" opacity="${.4+(i%3)*.2}"/>`;}).join('');
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><radialGradient id="halo"><stop stop-color="${c}" stop-opacity=".38"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient><linearGradient id="gem" x2=".7" y2="1"><stop stop-color="#f1ffdd"/><stop offset=".35" stop-color="${c}"/><stop offset="1" stop-color="#263747"/></linearGradient><linearGradient id="metal" x2=".8" y2="1"><stop stop-color="#efd8a0"/><stop offset=".45" stop-color="#80785e"/><stop offset="1" stop-color="#384044"/></linearGradient></defs><circle cx="128" cy="126" r="118" fill="url(#halo)"/><ellipse cx="128" cy="216" rx="62" ry="10" fill="#071b20" opacity=".5"/>${shards}<g stroke="#182b31" stroke-width="6" stroke-linejoin="round" transform="rotate(${(variant%5-2)*4} 128 128)">${shape}</g><path d="M${97+variant} 98l8-9 8 9-8 9Z" fill="#fff" opacity=".6"/><circle cx="${100+variant*2}" cy="${165-tier*3}" r="${3+tier*.3}" fill="${c}" stroke="#eefadc" stroke-width="2"/></svg>`;
 const source='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);artifactImages.set(index,source);return source;
}
