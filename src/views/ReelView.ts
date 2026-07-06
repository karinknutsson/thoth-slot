import { Container, FillGradient, Graphics, Sprite, Texture } from "pixi.js";

export class ReelView extends Container {
  static readonly VISIBLE_SYMBOLS = 3;
  private static readonly BACKGROUND_COLOR_TOP = 0xa9510c;
  private static readonly BACKGROUND_COLOR_BOTTOM = 0x75310e;
  private static readonly BACKGROUND_COLOR_MIDDLE = 0xdb9d34;
  private static readonly ICON_SCALE = 0.8;
  private static readonly SYMBOL_BACKGROUND_ALPHA = 0.5;
  private static readonly SYMBOL_BACKGROUND_SCALE = 1.5;

  private readonly background: Graphics;
  private readonly symbolBackgrounds: Sprite[];
  private readonly symbolSprites: Sprite[];

  constructor(symbolTextures: Texture[], symbolBackgroundTexture: Texture) {
    super();

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
    this.symbolSprites = Array.from(
      { length: ReelView.VISIBLE_SYMBOLS },
      () => {
        const texture =
          symbolTextures[Math.floor(Math.random() * symbolTextures.length)];
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        return sprite;
      },
    );

    // Add the symbol sprites to the reel container
    this.addChild(...this.symbolSprites);
  }

  resize(reelWidth: number, symbolSize: number, symbolSpacing: number): void {
    const reelHeight =
      symbolSize * ReelView.VISIBLE_SYMBOLS +
      (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;

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

    this.background.clear().rect(0, 0, reelWidth, reelHeight).fill(gradient);

    const iconSize = symbolSize * ReelView.ICON_SCALE;

    // Distribute the same total gap space evenly: before the first symbol,
    // between each symbol, and after the last one (space-evenly, not
    // space-between).
    const totalGapSpace = (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;
    const evenGap = totalGapSpace / (ReelView.VISIBLE_SYMBOLS + 1);

    const symbolBackgroundSize = symbolSize * ReelView.SYMBOL_BACKGROUND_SCALE;

    this.symbolBackgrounds.forEach((symbolBackground, index) => {
      const centerY = evenGap + index * (symbolSize + evenGap) + symbolSize / 2;
      symbolBackground.width = symbolBackgroundSize;
      symbolBackground.height = symbolBackgroundSize;
      symbolBackground.position.set(reelWidth / 2, centerY);
    });

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
