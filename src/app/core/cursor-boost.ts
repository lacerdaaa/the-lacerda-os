const SPEED_THRESHOLD = 1800; // px per second
const BOOST_DURATION_MS = 140;
const BOOST_CLASS = 'cursor-boost';

/**
 * Swaps in a "motion blur" retro cursor while the mouse moves fast.
 * Returns a cleanup function.
 */
export function installCursorBoost(target: Window = window): () => void {
  let last: { x: number; y: number; time: number } | null = null;
  let timeout: number | null = null;

  const onMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    const time = event.timeStamp || performance.now();
    if (last) {
      const speed = (Math.hypot(event.clientX - last.x, event.clientY - last.y) * 1000) / Math.max(1, time - last.time);
      if (speed >= SPEED_THRESHOLD) {
        document.body.classList.add(BOOST_CLASS);
        if (timeout !== null) {
          target.clearTimeout(timeout);
        }
        timeout = target.setTimeout(() => {
          document.body.classList.remove(BOOST_CLASS);
          timeout = null;
        }, BOOST_DURATION_MS);
      }
    }
    last = { x: event.clientX, y: event.clientY, time };
  };

  target.addEventListener('pointermove', onMove, { passive: true });
  return () => {
    target.removeEventListener('pointermove', onMove);
    if (timeout !== null) {
      target.clearTimeout(timeout);
    }
    document.body.classList.remove(BOOST_CLASS);
  };
}
