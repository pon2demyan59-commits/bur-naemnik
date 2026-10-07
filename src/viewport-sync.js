export function gameplayZoom(width, height) {
  return width < 600 || height < 520 ? Math.max(.55, Math.min(.82, height / 384)) : 1.12;
}
// Mobile browsers can finish changing the host size after their orientation event.
// Observe the actual container instead of relying only on window.resize.
export function startViewportSync(game, host) {
  let frame = null, destroyed = false;
  const sync = () => {
    frame = null;
    if (destroyed || !game.scale.canvas) return;
    const rect = host.getBoundingClientRect();
    const width = Math.round(rect.width), height = Math.round(rect.height);
    if (width < 1 || height < 1) return;
    const size = game.scale.gameSize;
    if (size.width !== width || size.height !== height || game.canvas.width !== width || game.canvas.height !== height) {
      game.scale.setParentSize(width, height);
      for (const scene of game.scene.getScenes(true)) scene.joystick?.reset();
    }
    // Repair a stale camera as well, even if the canvas has already resized.
    for (const scene of game.scene.getScenes(true)) {
      const camera = scene.cameras?.main;
      if (camera && (camera.width !== width || camera.height !== height)) {
        camera.setViewport(0, 0, width, height);
        scene.fit?.({width, height});
      }
    }
  };
  const schedule = () => { if (!destroyed && frame == null) frame = window.requestAnimationFrame(sync); };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(schedule) : null;
  observer?.observe(host);
  window.addEventListener('resize', schedule);
  window.addEventListener('orientationchange', schedule);
  window.visualViewport?.addEventListener('resize', schedule);
  document.addEventListener('visibilitychange', schedule);
  game.events.once('ready', schedule);
  const destroy = () => {
    destroyed = true;
    if (frame != null) window.cancelAnimationFrame(frame);
    observer?.disconnect();
    window.removeEventListener('resize', schedule);
    window.removeEventListener('orientationchange', schedule);
    window.visualViewport?.removeEventListener('resize', schedule);
    document.removeEventListener('visibilitychange', schedule);
    game.events.off('ready', schedule);
  };
  game.events.once('destroy', destroy);
  schedule();
  return destroy;
}
