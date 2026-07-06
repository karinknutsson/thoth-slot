import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { ReelView } from "./ReelView";

export class GameView extends Container {
  private static readonly MOBILE_BREAKPOINT = 768;
  private static readonly REEL_COUNT = 5;
  private static readonly SYMBOL_SIZE_RATIO_MOBILE = 0.15;
  private static readonly SYMBOL_SIZE_RATIO_DESKTOP = 0.2;
  private static readonly SYMBOL_SPACING_RATIO = 0.15;
  private static readonly REEL_SPACING_RATIO =
    GameView.SYMBOL_SPACING_RATIO * 2;
  private static readonly CONTAINER_PADDING_RATIO = 0.4;

  private readonly imageWidth = 3080;
  private readonly imageHeight = 2320;
  private readonly background: Sprite;
  private readonly reelsBackground: Graphics;
  private readonly reels: ReelView[];

  public constructor(backgroundTexture: Texture, symbolTextures: Texture[]) {
    super();

    this.background = new Sprite(backgroundTexture);
    this.background.anchor.set(0.5);
    this.addChild(this.background);

    this.reelsBackground = new Graphics();
    this.addChild(this.reelsBackground);

    this.reels = Array.from(
      { length: GameView.REEL_COUNT },
      () => new ReelView(symbolTextures),
    );
    this.addChild(...this.reels);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  private resize(): void {
    const scale = Math.max(
      window.innerWidth / this.imageWidth,
      window.innerHeight / this.imageHeight,
    );

    this.background.width = this.imageWidth * scale;
    this.background.height = this.imageHeight * scale;
    this.background.position.set(
      window.innerWidth / 2,
      window.innerHeight / 2,
    );

    const isMobile = window.innerWidth < GameView.MOBILE_BREAKPOINT;
    const symbolSize = isMobile
      ? window.innerWidth * GameView.SYMBOL_SIZE_RATIO_MOBILE
      : window.innerHeight * GameView.SYMBOL_SIZE_RATIO_DESKTOP;

    const symbolSpacing = symbolSize * GameView.SYMBOL_SPACING_RATIO;
    const spacing = symbolSize * GameView.REEL_SPACING_RATIO;
    const padding = symbolSize * GameView.CONTAINER_PADDING_RATIO;

    const reelHeight =
      symbolSize * ReelView.VISIBLE_SYMBOLS +
      (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;
    const reelsWidth =
      GameView.REEL_COUNT * symbolSize + (GameView.REEL_COUNT - 1) * spacing;

    const containerWidth = reelsWidth + padding * 2;
    const containerHeight = reelHeight + padding * 2;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    this.reelsBackground
      .clear()
      .roundRect(
        -containerWidth / 2,
        -containerHeight / 2,
        containerWidth,
        containerHeight,
        16,
      )
      .fill({ color: 0x000000, alpha: 0.5 });
    this.reelsBackground.position.set(centerX, centerY);

    const startX = centerX - reelsWidth / 2;
    const startY = centerY - reelHeight / 2;

    this.reels.forEach((reel, index) => {
      reel.resize(symbolSize, symbolSpacing);
      reel.position.set(startX + index * (symbolSize + spacing), startY);
    });
  }
}
