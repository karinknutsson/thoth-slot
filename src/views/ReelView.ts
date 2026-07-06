import { Container, FillGradient, Graphics, Sprite, Texture } from "pixi.js";

export class ReelView extends Container {
  static readonly VISIBLE_SYMBOLS = 3;
  private static readonly BACKGROUND_COLOR_BOTTOM = 0xaa875f;
  private static readonly BACKGROUND_COLOR_TOP = 0xe0c6a8;
  private static readonly BACKGROUND_PADDING_RATIO = 0.05;

  private readonly background: Graphics;
  private readonly symbolSprites: Sprite[];

  constructor(symbolTextures: Texture[]) {
    super();

    this.background = new Graphics();
    this.addChild(this.background);

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

  resize(symbolSize: number, symbolSpacing: number): void {
    const reelHeight =
      symbolSize * ReelView.VISIBLE_SYMBOLS +
      (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;

    const padding = symbolSize * ReelView.BACKGROUND_PADDING_RATIO;

    const gradient = new FillGradient({
      type: "linear",
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: ReelView.BACKGROUND_COLOR_TOP },
        { offset: 1, color: ReelView.BACKGROUND_COLOR_BOTTOM },
      ],
    });

    this.background
      .clear()
      .rect(
        -padding,
        -padding,
        symbolSize + padding * 2,
        reelHeight + padding * 2,
      )
      .fill(gradient);

    this.symbolSprites.forEach((sprite, index) => {
      sprite.width = symbolSize;
      sprite.height = symbolSize;
      sprite.position.set(
        symbolSize / 2,
        index * (symbolSize + symbolSpacing) + symbolSize / 2,
      );
    });
  }
}
