import { Container, Graphics, Text, Assets, Sprite, Texture } from "pixi.js";

export class LoadingView extends Container {
  private readonly barWidth = 400;
  private readonly barHeight = 24;
  private readonly barBackground: Graphics;
  private readonly barFill: Graphics;
  private readonly loadingLabel: Text;
  private readonly thoth: Sprite;

  private constructor(thothTexture: Texture) {
    super();

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    this.thoth = new Sprite(thothTexture);
    this.thoth.anchor.set(0.5);
    this.thoth.width = 456;
    this.thoth.height = 1042;
    this.thoth.position.set(centerX, centerY - 120);

    this.barBackground = new Graphics()
      .roundRect(
        -this.barWidth / 2,
        -this.barHeight / 2,
        this.barWidth,
        this.barHeight,
        12,
      )
      .fill({ color: 0x1a1a22 });
    this.barBackground.position.set(centerX, centerY);

    this.barFill = new Graphics();
    this.barFill.position.set(
      centerX - this.barWidth / 2,
      centerY - this.barHeight / 2,
    );

    this.loadingLabel = new Text({
      text: "Loading...",
      style: { fill: 0xffffff, fontSize: 24, fontFamily: "Caesar Dressing" },
    });
    this.loadingLabel.anchor.set(0.5);
    this.loadingLabel.position.set(centerX, centerY + 40);

    this.addChild(
      this.thoth,
      this.barBackground,
      this.barFill,
      this.loadingLabel,
    );
    this.setProgress(0);
  }

  static async create(): Promise<LoadingView> {
    const [logoTexture] = await Promise.all([
      Assets.load("/assets/thoth.png"),
      document.fonts.load('24px "Caesar Dressing"'),
    ]);
    return new LoadingView(logoTexture);
  }

  static async loadAssets(
    onProgress?: (progress: number) => void,
  ): Promise<Texture> {
    return Assets.load("/assets/background.jpg", onProgress);
  }

  setProgress(ratio: number): void {
    const clamped = Math.max(0, Math.min(1, ratio));
    this.barFill
      .clear()
      .roundRect(0, 0, this.barWidth * clamped, this.barHeight, 12)
      .fill({ color: 0xffaf46 });
  }
}
