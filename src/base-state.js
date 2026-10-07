export const BASE_SIZE = 50;
export const CELL = 64;
export const RESCUE = { x: 27, y: 26 };
export const SPAWN = { x: 22, y: 26 };
const id = (x, y) => y * BASE_SIZE + x;
const validCell = n => Number.isInteger(n) && n >= 0 && n < BASE_SIZE * BASE_SIZE;
export function initialRubble(x, y) {
  if (x < 2 || y < 2 || x >= 48 || y >= 48) return false;
  if ((x >= 19 && x <= 23 && y >= 23 && y <= 29) || (x === RESCUE.x && y === RESCUE.y)) return false;
  // Space reserved for the physical freight lift; three entrance blocks jam it.
  if(x>=30&&x<=36&&y>=18&&y<=24)return y===24&&x>=32&&x<=34;
  // Five blocks obstruct the unloading deck; the machine and approach stay clear.
  if(x>=15&&x<=21&&y>=28&&y<=36)return y===33&&x>=16&&x<=20;
  // A fixed, reproducible starting base, not a regenerated level.
  if (x >= 24 && x <= 26 && y >= 24 && y <= 28) return true;
  if (y >= 6 && y <= 10 && x >= 18 && x <= 32) return false;
  return ((x * 127 + y * 67 + x * y * 13) % 100) < 67;
}
export class BaseWorld {
  constructor(progress = {}) {
    this.x = Number.isInteger(progress.x) && progress.x >= 2 && progress.x < 48 ? progress.x : SPAWN.x;
    this.y = Number.isInteger(progress.y) && progress.y >= 2 && progress.y < 48 ? progress.y : SPAWN.y;
    this.cleared = new Set(Array.isArray(progress.cleared) ? progress.cleared.filter(validCell) : []);
    this.damage = new Map(Array.isArray(progress.damage) ? progress.damage.filter(v => Array.isArray(v) && validCell(v[0]) && Number.isFinite(v[1]) && v[1] > 0 && v[1] < 1) : []);
    this.rescued = progress.rescued === true;
    this.dialogue=['radio','rescue','porodnik'].includes(progress.dialogue)?progress.dialogue:null;
    this.dialoguePage=Number.isInteger(progress.dialoguePage)?Math.max(0,Math.min(this.dialogue==='porodnik'?7:3,progress.dialoguePage)):0;
    this.porodnikPowered=progress.porodnikPowered===true;
    this.porodnikBriefed=progress.porodnikBriefed===true;
    this.liftAnnounced = progress.liftAnnounced === true;
    this.heard = progress.heard === true || this.rescued;
    if (this.blocked(this.x, this.y) || (!this.rescued && this.x === RESCUE.x && this.y === RESCUE.y)) { this.x = SPAWN.x; this.y = SPAWN.y; }
  }
  blocked(x, y) { return initialRubble(x, y) && !this.cleared.has(id(x, y)); }
  inside(x, y) { return x >= 2 && y >= 2 && x < 48 && y < 48; }
  drill(x, y, amount) {
    if (!this.blocked(x, y)) return false;
    const key = id(x,y), damage = (this.damage.get(key) || 0) + amount;
    if (damage >= 1) { this.cleared.add(key); this.damage.delete(key); return true; }
    this.damage.set(key, damage); return false;
  }
  canRescue(px=(this.x+.5)*CELL,py=(this.y+.5)*CELL) {
    return !this.rescued&&Math.hypot(px-(RESCUE.x+.5)*CELL,py-(RESCUE.y+.5)*CELL)<=58;
  }
  snapshot() { return { location:'base', x:this.x, y:this.y, cleared:[...this.cleared], damage:[...this.damage], rescued:this.rescued, heard:this.heard, liftAnnounced:this.liftAnnounced, porodnikBriefed:this.porodnikBriefed, porodnikPowered:this.porodnikPowered, dialogue:this.dialogue, dialoguePage:this.dialoguePage }; }
}

