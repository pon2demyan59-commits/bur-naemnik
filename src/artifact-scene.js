import { awardArtifactDrop, artifactRarity } from './artifact-state.js';
export const artifactSceneMethods={
 findArtifactInBrokenBlock(){
  const artifact=awardArtifactDrop(this.artifacts,this.floorNumber);if(!artifact)return null;
  this.showDiscovery({kind:'artifact',name:artifact.name,rarity:artifactRarity(artifact.id)});return artifact;
 }
};
