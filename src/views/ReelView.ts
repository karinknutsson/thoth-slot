import { Container, FillGradient, Graphics, Sprite, Texture } from "pixi.js";

export class ReelView extends Container {
  static readonly VISIBLE_SYMBOLS = 3;
  private static readonly BACKGROUND_COLOR_TOP = 0xa9510c;
  private static readonly BACKGROUND_COLOR_BOTTOM = 0x75310e;
  private static readonly BACKGROUND_COLOR_MIDDLE = 0xdb9d34;
  private static readonly ICON_SCALE = 0.8;
  private static readonly SYMBOL_BACKGROUND_ALPHA = 0.5;
  private static readonly SYMBOL_BACKGROUND_SCALE = 1.5;
  private static readonly FLICKER_INTERVAL_MS = 60;

  private readonly background: Graphics;
  private readonly symbolBackgrounds: Sprite[];
  private readonly symbolSprites: Sprite[];
  private readonly textureMap: Record<string, Texture>;
  private symbolIds: string[];
  private flickerIntervalId: number | null = null;
  private readonly weightedPool: string[];

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

    this.symbolBackgrounds = Array.from(
      { length: ReelView.VISIBLE_SYMBOLS },
      () => {
        const symbolBackground = new Sprite(symbolBackgroundTexture);
        symbolBackground.anchor.set(0.5);
        symbolBackground.alpha = ReelView.SYMBOL_BACKGROUND_ALPHA;
        return symbolBackground;
      },
    );
    this.addChild(...this.symbolBackgrounds);

    // Create the symbol sprites for the reel
    this.symbolIds = Array.from({ length: ReelView.VISIBLE_SYMBOLS }, () =>
      this.randomSymbolId(),
    );

    this.symbolSprites = this.symbolIds.map((id) => {
      const sprite = new Sprite(this.textureMap[id]);
      sprite.anchor.set(0.5);
      return sprite;
    });
    this.addChild(...this.symbolSprites);
  }

  // Generate a random symbol ID from the weighted pool
  private randomSymbolId(): string {
    return this.weightedPool[
      Math.floor(Math.random() * this.weightedPool.length)
    ];
  }

  // Set the symbols for the reel based on the provided symbol IDs
  setSymbols(symbolIds: string[]): void {
    this.symbolIds = symbolIds;
    symbolIds.forEach((id, index) => {
      this.symbolSprites[index].texture = this.textureMap[id];
    });
  }

  // Swap symbols to simulate spinning
  startSpin(): void {
    if (this.flickerIntervalId !== null) return;

    this.flickerIntervalId = window.setInterval(() => {
      const randomIds = Array.from({ length: ReelView.VISIBLE_SYMBOLS }, () =>
        this.randomSymbolId(),
      );
      this.setSymbols(randomIds);
    }, ReelView.FLICKER_INTERVAL_MS);
  }

  // Stop the spinning and set the final symbols
  stopSpin(finalSymbolIds: string[]): void {
    if (this.flickerIntervalId !== null) {
      clearInterval(this.flickerIntervalId);
      this.flickerIntervalId = null;
    }
    this.setSymbols(finalSymbolIds);
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

    // Calculate the size of the icons based on the symbol size and the defined scale
    const iconSize = symbolSize * ReelView.ICON_SCALE;

    // Distribute the same total gap space evenly
    const totalGapSpace = (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;
    const evenGap = totalGapSpace / (ReelView.VISIBLE_SYMBOLS + 1);

    // Calculate the size of the symbol backgrounds based on the symbol size and the defined scale
    const symbolBackgroundSize = symbolSize * ReelView.SYMBOL_BACKGROUND_SCALE;

    // Position the symbol backgrounds evenly within the reel
    this.symbolBackgrounds.forEach((symbolBackground, index) => {
      const centerY = evenGap + index * (symbolSize + evenGap) + symbolSize / 2;
      symbolBackground.width = symbolBackgroundSize;
      symbolBackground.height = symbolBackgroundSize;
      symbolBackground.position.set(reelWidth / 2, centerY);
    });

    // Position the symbol sprites evenly within the reel
    this.symbolSprites.forEach((sprite, index) => {
      sprite.width = iconSize;
      sprite.height = iconSize;
      sprite.position.set(
        reelWidth / 2,
        evenGap + index * (symbolSize + evenGap) + symbolSize / 2,
      );
    });
  }
}
