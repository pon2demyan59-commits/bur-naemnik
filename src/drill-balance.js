// Balance approved 2026-10-08: ten compound upgrades per material tier.
export const DRILL_UPGRADE_FACTOR=1.05;
export const DRILL_UPGRADE_LIMIT=120;
export const DRILL_UPGRADE_PRICE_STEP=100;
export const DRILL_MATERIAL_ORDER=['earth','stone','iron','copper','bauxite','tin','zinc','nickel','chromium','titanium','gold','tungsten','xenorite'];
export function drillUpgradePower(upgrades=0){return Math.pow(DRILL_UPGRADE_FACTOR,Math.max(0,Math.min(DRILL_UPGRADE_LIMIT,Number.isInteger(upgrades)?upgrades:0)));}
export function materialUpgradeTarget(id){return Math.max(0,DRILL_MATERIAL_ORDER.indexOf(id))*10;}
export function drillMaterialHardness(id){return drillUpgradePower(materialUpgradeTarget(id));}
