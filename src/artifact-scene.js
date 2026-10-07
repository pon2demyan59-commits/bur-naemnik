import { awardArtifactDrop, artifactRarity } from './artifact-state.js';
import { RARITY_NAMES } from './collection-catalog.js';
export const artifactSceneMethods={
 findArtifactInBrokenBlock(){
  const artifact=awardArtifactDrop(this.artifacts,this.floorNumber);if(!artifact)return null;
  this.notify('АРТЕФАКТ НАЙДЕН · '+artifact.name+' · '+RARITY_NAMES[artifactRarity(artifact.id)-1]);return artifact;
 }
};
