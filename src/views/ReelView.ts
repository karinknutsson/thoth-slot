import { Container, Sprite, Texture } from "pixi.js";

export class ReelView extends Container {
  static readonly VISIBLE_SYMBOLS = 3;

  private readonly symbolSprites: Sprite[];

  constructor(symbolTextures: Texture[]) {
    super();

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
