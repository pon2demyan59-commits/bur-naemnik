export function wrapDegrees(angle) { return ((angle + 180) % 360 + 360) % 360 - 180; }
export function smoothHeading(current, target, dt) {
  const difference = wrapDegrees(target - current);
  const step = Math.min(360 * dt, Math.abs(difference) * (1 - Math.exp(-12 * dt)));
  return wrapDegrees(current + Math.sign(difference) * step);
}
export function damp(value, target, rate, dt) { return value + (target - value) * (1 - Math.exp(-rate * dt)); }
export function updateHeat(heat, cutting, dt) { return Math.max(0,Math.min(1,heat + (cutting ? .42 : -.25) * dt)); }
