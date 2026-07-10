import {
  Container,
  FillGradient,
  Graphics,
  Sprite,
  Texture,
  Ticker,
} from "pixi.js";
import { GameConfig } from "../config/GameConfig";
import { tween } from "../utils/tween";

type SpinPhase = "idle" | "spinning" | "stopping" | "settling";

export class ReelView extends Container {
  static readonly VISIBLE_SYMBOLS = GameConfig.reels.visibleSymbols;
  private static readonly STRIP_LENGTH = ReelView.VISIBLE_SYMBOLS + 1;
  private static readonly BACKGROUND_COLOR_TOP = 0xa9510c;
  private static readonly BACKGROUND_COLOR_BOTTOM = 0x75310e;
  private static readonly BACKGROUND_COLOR_MIDDLE = 0xdb9d34;
  private static readonly ICON_SCALE = 0.8;
  private static readonly SYMBOL_BACKGROUND_ALPHA = 0.5;
  private static readonly SYMBOL_BACKGROUND_SCALE = 1.5;
  private static readonly WIN_SYMBOL_GROW_SCALE = 1.3;
  private static readonly WIN_SYMBOL_GROW_MS = 250;
  private static readonly WIN_SYMBOL_SHRINK_MS = 300;

  private readonly background: Graphics;
  private readonly contentMask: Graphics;
  private readonly symbolBackgrounds: Sprite[];
  private readonly symbolHighlights: Sprite[];
  private readonly symbolSprites: Sprite[];
  private readonly textureMap: Record<string, Texture>;
  private readonly weightedPool: string[];

  // The current symbol IDs in the strip, top to bottom. The first one is
  // offscreen above the reel, the last one is offscreen below the reel.
  private stripIds: string[];

  // The current phase of the reel's spin, and how long it's been in that phase.
  private phase: SpinPhase = "idle";
  private phaseElapsedMs = 0;
  private continuousElapsedMs = 0;

  // The current vertical offset of the strip, in pixels, from its resting
  // position.
  private offsetY = 0;

  // When stopping, the final symbols to land on, in bottom-to-top order.
  private finalQueue: string[] | null = null;
  private finalShiftPending = false;
  private onSettled: (() => void) | null = null;

  private reelWidth = 0;
  private symbolSize = 0;
  private iconSize = 0;
  private evenGap = 0;

  constructor(
    textureMap: Record<string, Texture>,
    weightedPool: string[],
    symbolBackgroundTexture: Texture,
    symbolHighlightTexture: Texture,
  ) {
    super();

    this.textureMap = textureMap;
    this.weightedPool = weightedPool;

    this.background = new Graphics();
    this.addChild(this.background);

    this.contentMask = new Graphics();
    this.addChild(this.contentMask);
    this.mask = this.contentMask;

    this.symbolBackgrounds = Array.from(
      { length: ReelView.STRIP_LENGTH },
      () => {
        const symbolBackground = new Sprite(symbolBackgroundTexture);
        symbolBackground.anchor.set(0.5);
        symbolBackground.alpha = ReelView.SYMBOL_BACKGROUND_ALPHA;
        return symbolBackground;
      },
    );
    this.addChild(...this.symbolBackgrounds);

    // Highlight glow shown behind a symbol while it celebrates a win; hidden
    // (alpha 0) the rest of the time
    this.symbolHighlights = Array.from(
      { length: ReelView.STRIP_LENGTH },
      () => {
        const symbolHighlight = new Sprite(symbolHighlightTexture);
        symbolHighlight.anchor.set(0.5);
        symbolHighlight.alpha = 0;
        return symbolHighlight;
      },
    );
    this.addChild(...this.symbolHighlights);

    // Create the symbol strip: 3 visible rows plus one offscreen buffer row
    this.stripIds = Array.from({ length: ReelView.STRIP_LENGTH }, () =>
      this.randomSymbolId(),
    );

    this.symbolSprites = this.stripIds.map((id) => {
      const sprite = new Sprite(this.textureMap[id]);
      sprite.anchor.set(0.5);
      return sprite;
    });
    this.addChild(...this.symbolSprites);

    Ticker.shared.add(this.onTick, this);
  }

  // Generate a random symbol ID from the weighted pool
  private randomSymbolId(): string {
    return this.weightedPool[
      Math.floor(Math.random() * this.weightedPool.length)
    ];
  }

  // Start scrolling the reel at increasing speed
  startSpin(): void {
    if (this.phase !== "idle") return;
    this.phase = "spinning";
    this.phaseElapsedMs = 0;
    this.continuousElapsedMs = 0;
  }

  // Ease the reel to a stop, landing on the given symbols (top to bottom).
  // Resolves once the reel has fully settled on those symbols.
  stopSpin(finalSymbolIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      this.finalQueue = [...finalSymbolIds].reverse();
      this.finalShiftPending = false;
      this.phase = "stopping";
      this.phaseElapsedMs = 0;
      this.onSettled = resolve;
    });
  }

  private get stepY(): number {
    return this.symbolSize + this.evenGap;
  }

  private onTick = (ticker: Ticker): void => {
    if (this.phase === "idle") return;

    this.phaseElapsedMs += ticker.deltaMS;
    this.continuousElapsedMs += ticker.deltaMS;

    if (this.phase === "settling") {
      this.updateSettle();
      this.renderStrip();
      return;
    }

    const speed = this.currentSpeed();
    this.offsetY += speed * (ticker.deltaMS / 1000);

    while (this.stepY > 0 && this.offsetY >= this.stepY) {
      this.offsetY -= this.stepY;
      this.shiftStrip();
      const phaseAfterShift = this.phase as SpinPhase;
      if (phaseAfterShift !== "spinning" && phaseAfterShift !== "stopping") {
        this.offsetY = 0;
        break;
      }
    }

    this.renderStrip();
  };

  // After the final symbols are in place, let the reel overshoot slightly
  // past its resting spot and spring back, instead of snapping to a stop
  private updateSettle(): void {
    const settleT = Math.min(
      this.phaseElapsedMs / GameConfig.spin.settleDurationMs,
      1,
    );
    this.offsetY =
      Math.sin(Math.PI * settleT) *
      this.stepY *
      GameConfig.spin.settleOvershootFraction;

    if (settleT >= 1) {
      this.finalize();
    }
  }

  // Calculate the current speed of the reel based on its phase and how
  // long it's been in that phase
  private currentSpeed(): number {
    if (this.phase === "spinning") {
      const rampT = Math.min(
        this.phaseElapsedMs / GameConfig.spin.upDurationMs,
        1,
      );
      const envelope = this.easeInOutSine(rampT);
      return this.oscillatingSpeed(envelope);
    }

    if (this.phase === "stopping") {
      const decayT = Math.min(
        this.phaseElapsedMs / GameConfig.spin.downDurationMs,
        1,
      );
      const envelope = Math.max(
        1 - this.easeInCubic(decayT),
        GameConfig.spin.downCreepFactor,
      );
      return this.oscillatingSpeed(envelope);
    }

    return 0;
  }

  // The oscillating speed is a base speed plus a sine wave that oscillates
  // up and down, scaled by the given envelope factor. The envelope factor
  // is typically between 0 and 1, where 1 means full speed and 0 means no
  // speed.
  private oscillatingSpeed(envelope: number): number {
    const wave = Math.sin(
      (this.continuousElapsedMs / GameConfig.spin.oscillationPeriodMs) *
        Math.PI *
        2,
    );
    const speed =
      envelope *
      (GameConfig.spin.baseSpeed + wave * GameConfig.spin.speedAmplitude);

    return Math.max(speed, 0);
  }

  // Stays close to 0 for most of the range and rises sharply near t=1, so the
  // deceleration it drives stays brisk and only drops off late
  private easeInCubic(t: number): number {
    return t * t * t;
  }

  // Smoothly eases in and out, so the acceleration and deceleration are gradual
  private easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  // Shift the strip down by one row, pulling in a new symbol at the top
  private shiftStrip(): void {
    const usingFinal = !!this.finalQueue && this.finalQueue.length > 0;
    const nextId = usingFinal
      ? this.finalQueue!.shift()!
      : this.randomSymbolId();

    this.stripIds.pop();
    this.stripIds.unshift(nextId);

    if (this.finalQueue && this.finalQueue.length === 0) {
      if (this.finalShiftPending) {
        this.beginSettle();
      } else {
        this.finalShiftPending = true;
      }
    }
  }

  // Transition from the final shift to the settling phase, where the reel
  // overshoots and springs back to its resting position
  private beginSettle(): void {
    this.phase = "settling";
    this.phaseElapsedMs = 0;
    this.finalQueue = null;
    this.finalShiftPending = false;
  }

  // Called when the reel has fully settled on its final symbols, to reset
  // state and resolve the promise returned by stopSpin()
  private finalize(): void {
    this.phase = "idle";
    this.offsetY = 0;
    this.onSettled?.();
    this.onSettled = null;
  }

  // Render the strip's symbols, backgrounds, and highlight glows based on
  // the current strip IDs and the vertical offset
  private renderStrip(): void {
    this.stripIds.forEach((id, index) => {
      const row = index - 1;
      const y = this.baseY(row) + this.offsetY;

      const sprite = this.symbolSprites[index];
      sprite.texture = this.textureMap[id];
      sprite.width = this.iconSize;
      sprite.height = this.iconSize;
      sprite.position.set(this.reelWidth / 2, y);

      this.symbolBackgrounds[index].position.set(this.reelWidth / 2, y);
      this.symbolHighlights[index].position.set(this.reelWidth / 2, y);
    });
  }

  private baseY(row: number): number {
    return this.evenGap + row * this.stepY + this.symbolSize / 2;
  }

  resize(reelWidth: number, symbolSize: number, symbolSpacing: number): void {
    // Calculate the total height of the reel based on the number of
    // visible symbols, their size, and the spacing between them
    const reelHeight =
      symbolSize * ReelView.VISIBLE_SYMBOLS +
      (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;

    // Create a linear gradient for the reel background
    const gradient = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: ReelView.BACKGROUND_COLOR_TOP },
        { offset: 0.5, color: ReelView.BACKGROUND_COLOR_MIDDLE },
        { offset: 1, color: ReelView.BACKGROUND_COLOR_BOTTOM },
      ],
    });

    // Clear the previous background and draw the new gradient background
    this.background.clear().rect(0, 0, reelWidth, reelHeight).fill(gradient);

    // Clip scrolling symbols to the reel's visible rows so the offscreen
    // buffer symbol doesn't poke out above the reel while spinning
    this.contentMask.clear().rect(0, 0, reelWidth, reelHeight).fill(0xffffff);

    this.reelWidth = reelWidth;
    this.symbolSize = symbolSize;
    this.iconSize = symbolSize * ReelView.ICON_SCALE;

    // Distribute the same total gap space evenly
    const totalGapSpace = (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;
    this.evenGap = totalGapSpace / (ReelView.VISIBLE_SYMBOLS + 1);

    // Calculate the size of the symbol backgrounds based on the symbol
    // size and the defined scale
    const symbolBackgroundSize = symbolSize * ReelView.SYMBOL_BACKGROUND_SCALE;

    this.symbolBackgrounds.forEach((symbolBackground) => {
      symbolBackground.width = symbolBackgroundSize;
      symbolBackground.height = symbolBackgroundSize;
    });

    this.symbolHighlights.forEach((symbolHighlight) => {
      symbolHighlight.width = symbolBackgroundSize;
      symbolHighlight.height = symbolBackgroundSize;
    });

    // Position the symbol sprites, backgrounds, and highlight glows evenly
    // within the reel
    this.renderStrip();
  }

  // Pops the symbol at the given visible row (0 = top) up to a larger size
  // and back down, while its highlight glow fades in and out in sync with it
  async celebrateWin(row: number): Promise<void> {
    const index = row + 1;
    const symbol = this.symbolSprites[index];
    const highlight = this.symbolHighlights[index];

    const symbolBaseScale = symbol.scale.x;
    const highlightBaseScale = highlight.scale.x;

    await this.tweenWinCelebration(
      symbol,
      highlight,
      symbolBaseScale,
      highlightBaseScale,
      ReelView.WIN_SYMBOL_GROW_SCALE,
      ReelView.WIN_SYMBOL_GROW_MS,
    );
    await this.tweenWinCelebration(
      symbol,
      highlight,
      symbolBaseScale,
      highlightBaseScale,
      1,
      ReelView.WIN_SYMBOL_SHRINK_MS,
    );
  }

  // Animate the symbol and its highlight glow toward a target scale
  // multiplier over a duration, then resolve the promise when done
  private tweenWinCelebration(
    symbol: Sprite,
    highlight: Sprite,
    symbolBaseScale: number,
    highlightBaseScale: number,
    targetMultiplier: number,
    durationMs: number,
  ): Promise<void> {
    const startMultiplier = symbol.scale.x / symbolBaseScale;

    return tween(durationMs, (t) => {
      const multiplier =
        startMultiplier + (targetMultiplier - startMultiplier) * t;

      symbol.scale.set(symbolBaseScale * multiplier);
      highlight.scale.set(highlightBaseScale * multiplier);
      highlight.alpha = Math.max(
        0,
        Math.min((multiplier - 1) / (ReelView.WIN_SYMBOL_GROW_SCALE - 1), 1),
      );
    });
  }
}
