import { Ticker } from "pixi.js";

// Runs onUpdate every frame for durationMs, passing progress from 0 to 1,
// then resolves once the duration has elapsed
export function tween(
  durationMs: number,
  onUpdate: (t: number) => void,
): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;

    const onTick = (ticker: Ticker): void => {
      elapsed += ticker.deltaMS;
      const t = Math.min(elapsed / durationMs, 1);
      onUpdate(t);

      if (t >= 1) {
        Ticker.shared.remove(onTick);
        resolve();
      }
    };

    Ticker.shared.add(onTick);
  });
}
