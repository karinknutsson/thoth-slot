import {
  Container,
  FillGradient,
  Graphics,
  Sprite,
  Texture,
  Ticker,
} from "pixi.js";

type SpinPhase = "idle" | "spinning" | "stopping";

export class ReelView extends Container {
  static readonly VISIBLE_SYMBOLS = 3;
  private static readonly STRIP_LENGTH = ReelView.VISIBLE_SYMBOLS + 1;
  private static readonly BACKGROUND_COLOR_TOP = 0xa9510c;
  private static readonly BACKGROUND_COLOR_BOTTOM = 0x75310e;
  private static readonly BACKGROUND_COLOR_MIDDLE = 0xdb9d34;
  private static readonly ICON_SCALE = 0.8;
  private static readonly SYMBOL_BACKGROUND_ALPHA = 0.5;
  private static readonly SYMBOL_BACKGROUND_SCALE = 1.5;
  private static readonly MAX_SPIN_SPEED = 3200; // px per second
  private static readonly SPIN_UP_DURATION_MS = 200;
  private static readonly SPIN_DOWN_DURATION_MS = 650;
  private static readonly SPIN_DOWN_CREEP_FACTOR = 0.1;

  private readonly background: Graphics;
  private readonly contentMask: Graphics;
  private readonly symbolBackgrounds: Sprite[];
  private readonly symbolSprites: Sprite[];
  private readonly textureMap: Record<string, Texture>;
  private readonly weightedPool: string[];

  // symbol ids for rows -1..VISIBLE_SYMBOLS-1 (top-to-bottom), where row -1
  // is an offscreen buffer symbol scrolling in from above
  private stripIds: string[];

  private phase: SpinPhase = "idle";
  private phaseElapsedMs = 0;
  private offsetY = 0;
  private finalQueue: string[] | null = null;
  private finalShiftPending = false;
  private onStopped: (() => void) | null = null;

  private reelWidth = 0;
  private symbolSize = 0;
  private iconSize = 0;
  private evenGap = 0;

  constructor(
    textureMap: Record<string, Texture>,
    weightedPool: string[],
    symbolBackgroundTexture: Texture,
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
  }

  // Ease the reel to a stop, landing on the given symbols (top to bottom).
  // Resolves once the reel has fully settled on those symbols.
  stopSpin(finalSymbolIds: string[]): Promise<void> {
    return new Promise((resolve) => {
      this.finalQueue = [...finalSymbolIds].reverse();
      this.finalShiftPending = false;
      this.phase = "stopping";
      this.phaseElapsedMs = 0;
      this.onStopped = resolve;
    });
  }

  private get stepY(): number {
    return this.symbolSize + this.evenGap;
  }

  private onTick = (ticker: Ticker): void => {
    if (this.phase === "idle") return;

    this.phaseElapsedMs += ticker.deltaMS;

    const speed = this.currentSpeed();
    this.offsetY += speed * (ticker.deltaMS / 1000);

    while (this.stepY > 0 && this.offsetY >= this.stepY) {
      this.offsetY -= this.stepY;
      this.shiftStrip();
      if ((this.phase as SpinPhase) === "idle") {
        this.offsetY = 0;
        break;
      }
    }

    this.renderStrip();
  };

  private currentSpeed(): number {
    if (this.phase === "spinning") {
      const t = Math.min(
        this.phaseElapsedMs / ReelView.SPIN_UP_DURATION_MS,
        1,
      );
      return ReelView.MAX_SPIN_SPEED * this.easeOutQuad(t);
    }

    if (this.phase === "stopping") {
      const t = Math.min(
        this.phaseElapsedMs / ReelView.SPIN_DOWN_DURATION_MS,
        1,
      );
      const factor = Math.max(
        1 - this.easeInQuad(t),
        ReelView.SPIN_DOWN_CREEP_FACTOR,
      );
      return ReelView.MAX_SPIN_SPEED * factor;
    }

    return 0;
  }

  private easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }

  private easeInQuad(t: number): number {
    return t * t;
  }

  // Shift the strip down by one row, pulling in a new symbol at the top.
  // While stopping, the final symbols are fed in bottom-to-top so the reel
  // lands exactly on them once the queue drains.
  private shiftStrip(): void {
    const usingFinal = !!this.finalQueue && this.finalQueue.length > 0;
    const nextId = usingFinal
      ? this.finalQueue!.shift()!
      : this.randomSymbolId();

    this.stripIds.pop();
    this.stripIds.unshift(nextId);

    if (this.finalQueue && this.finalQueue.length === 0) {
      if (this.finalShiftPending) {
        this.finalize();
      } else {
        this.finalShiftPending = true;
      }
    }
  }

  private finalize(): void {
    this.phase = "idle";
    this.finalQueue = null;
    this.finalShiftPending = false;
    this.onStopped?.();
    this.onStopped = null;
  }

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
    });
  }

  private baseY(row: number): number {
    return this.evenGap + row * this.stepY + this.symbolSize / 2;
  }

  resize(reelWidth: number, symbolSize: number, symbolSpacing: number): void {
    // Calculate the total height of the reel based on the number of visible symbols, their size, and the spacing between them
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

    // Calculate the size of the symbol backgrounds based on the symbol size and the defined scale
    const symbolBackgroundSize = symbolSize * ReelView.SYMBOL_BACKGROUND_SCALE;

    this.symbolBackgrounds.forEach((symbolBackground) => {
      symbolBackground.width = symbolBackgroundSize;
      symbolBackground.height = symbolBackgroundSize;
    });

    // Position the symbol sprites and their backgrounds evenly within the reel
    this.renderStrip();
  }
}
