// One captured finger can steer continuously while another uses an action button.
export function createTouchJoystick(element, onInput, canStart = () => true) {
  let pointerId = null;
  const knob = element.querySelector('.joystick-knob');
  const reset = () => {
    const captured = pointerId; pointerId = null;
    knob.style.transform = 'translate(-50%, -50%)';
    element.classList.remove('active'); onInput(null);
    if (captured != null && element.hasPointerCapture?.(captured)) element.releasePointerCapture(captured);
  };
  const move = event => {
    if (event.pointerId !== pointerId) return;
    event.preventDefault();
    const rect = element.getBoundingClientRect();
    const radius = rect.width * .30;
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(dx, dy), amount = Math.min(1, distance / radius);
    const x = distance ? dx / distance : 0, y = distance ? dy / distance : 0;
    knob.style.transform = `translate(-50%, -50%) translate(${x * amount * radius}px, ${y * amount * radius}px)`;
    onInput(amount <= .16 ? null : {x, y, strength: (amount - .16) / .84});
  };
  const start = event => {
    if (pointerId != null || (event.pointerType === 'mouse' && event.button !== 0) || !canStart()) return;
    pointerId = event.pointerId; element.setPointerCapture(pointerId);
    element.classList.add('active'); move(event);
  };
  const end = event => { if (event.pointerId === pointerId) reset(); };
  element.addEventListener('pointerdown', start);
  element.addEventListener('pointermove', move);
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.addEventListener(type, end);
  window.addEventListener('resize', reset);
  return {reset, destroy() {
    reset(); element.removeEventListener('pointerdown', start); element.removeEventListener('pointermove', move);
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) element.removeEventListener(type, end);
    window.removeEventListener('resize', reset);
  }};
}
