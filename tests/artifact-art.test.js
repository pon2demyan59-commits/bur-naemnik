import test from 'node:test';
import assert from 'node:assert/strict';
import { ARTIFACTS } from '../src/artifact-catalog.js';
import { artifactArtSource } from '../src/artifact-art.js';
import { discoveryDetails } from '../src/discovery-banner.js';
import { artifactSceneMethods } from '../src/artifact-scene.js';
test('all 200 catalog relics have distinct self-contained portraits and discovery uses the same identity',()=>{
 const sources=ARTIFACTS.map(a=>artifactArtSource(a.id));assert.equal(new Set(sources).size,200);
 for(const [i,a] of ARTIFACTS.entries()){assert.match(decodeURIComponent(sources[i]),/<svg.*viewBox="0 0 256 256"/);assert.equal(artifactArtSource(a.name),sources[i]);assert.equal(discoveryDetails({kind:'artifact',id:a.id,name:a.name,rarity:Math.floor(i/20)+1}).artSource,sources[i]);}
});
test('a mined artifact is credited before its banner and carries the catalog id',()=>{
 const previous=Math.random;Math.random=()=>0;
 try{const scene={artifacts:{},floorNumber:1,showDiscovery(item){assert.equal(this.artifacts[item.id],1);assert.equal(item.id,ARTIFACTS[0].id);assert.equal(item.name,ARTIFACTS[0].name);}};assert.equal(artifactSceneMethods.findArtifactInBrokenBlock.call(scene).id,ARTIFACTS[0].id);}finally{Math.random=previous;}
});
