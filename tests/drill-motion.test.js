import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothHeading, updateHeat } from '../src/drill-motion.js';

test('turns cross the angle boundary without spinning the long way or snapping', () => {
  const next = smoothHeading(179, -179, 1 / 60);
  assert.ok(next > 179 && next < 180);
  let angle = 0;
  for (let i=0;i<60;i++) {
    const next = smoothHeading(angle, 90, 1 / 60);
    assert.ok(next >= angle && next <= 90);
    assert.ok(next-angle <= 6.000001);
    angle = next;
  }
  assert.ok(Math.abs(angle-90)<.1);
});

test('drill heat builds gradually, stays bounded and cools completely', () => {
  let heat = 0;
  for(let i=0;i<60;i++) heat=updateHeat(heat,true,1/60);
  assert.ok(heat>.4 && heat<.45);
  for(let i=0;i<600;i++) heat=updateHeat(heat,true,1/60);
  assert.equal(heat,1);
  for(let i=0;i<300;i++) heat=updateHeat(heat,false,1/60);
  assert.equal(heat,0);
});
