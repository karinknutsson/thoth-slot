import { Container, Graphics, Text, Assets, Sprite, Texture } from "pixi.js";

export class LoadingView extends Container {
  private static readonly MOBILE_BREAKPOINT = 768;
  private static readonly IMAGE_HEIGHT_RATIO_MOBILE = 0.48;
  private static readonly IMAGE_HEIGHT_RATIO_DESKTOP = 0.6;
  private static readonly IMAGE_ASPECT = 456 / 1042;
  private static readonly BAR_WIDTH_MOBILE = 200;
  private static readonly BAR_HEIGHT_MOBILE = 12;
  private static readonly BAR_WIDTH_DESKTOP = 320;
  private static readonly BAR_HEIGHT_DESKTOP = 20;
  private static readonly SYMBOL_COUNT = 16;

  private barWidth = LoadingView.BAR_WIDTH_DESKTOP;
  private barHeight = LoadingView.BAR_HEIGHT_DESKTOP;
  private progress = 0;
  private readonly barBackground: Graphics;
  private readonly barFill: Graphics;
  private readonly loadingLabel: Text;
  private readonly titleLabel: Text;
  private readonly thoth: Sprite;

  private constructor(thothTexture: Texture) {
    super();

    this.thoth = new Sprite(thothTexture);
    this.thoth.anchor.set(0.5);

    this.titleLabel = new Text({
      text: "Thoth Slot",
      style: { fill: 0xffaf46, fontSize: 48, fontFamily: "Caesar Dressing" },
    });
    this.titleLabel.anchor.set(0.5);

    this.barBackground = new Graphics();
    this.barFill = new Graphics();

    this.loadingLabel = new Text({
      text: "Loading...",
      style: { fill: 0xfbd554, fontSize: 24, fontFamily: "Caesar Dressing" },
    });
    this.loadingLabel.anchor.set(0.5);

    this.addChild(
      this.thoth,
      this.titleLabel,
      this.barBackground,
      this.barFill,
      this.loadingLabel,
    );
    this.setProgress(0);

    this.resize();
    window.addEventListener("resize", () => this.resize());
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
  ): Promise<{ background: Texture; symbols: Texture[] }> {
    const backgroundPath = "/assets/background.jpg";
    const symbolPaths = Array.from(
      { length: LoadingView.SYMBOL_COUNT },
      (_, i) => `/assets/symbols/${String(i + 1).padStart(2, "0")}.png`,
    );

    const textures = await Assets.load(
      [backgroundPath, ...symbolPaths],
      onProgress,
    );

    return {
      background: textures[backgroundPath],
      symbols: symbolPaths.map((path) => textures[path]),
    };
  }

  setProgress(ratio: number): void {
    this.progress = Math.max(0, Math.min(1, ratio));
    this.drawBar();
  }

  private drawBar(): void {
    this.barBackground
      .clear()
      .roundRect(
        -this.barWidth / 2,
        -this.barHeight / 2,
        this.barWidth,
        this.barHeight,
        12,
      )
      .fill({ color: 0x1a1a22 });

    this.barFill
      .clear()
      .roundRect(0, 0, this.barWidth * this.progress, this.barHeight, 12)
      .fill({ color: 0xffaf46 });
  }

  private setBarPosition(centerX: number, centerY: number): void {
    this.barBackground.position.set(centerX, centerY);
    this.barFill.position.set(
      centerX - this.barWidth / 2,
      centerY - this.barHeight / 2,
    );
  }

  private resize(): void {
    const isMobile = window.innerWidth < LoadingView.MOBILE_BREAKPOINT;

    const imageHeightRatio = isMobile
      ? LoadingView.IMAGE_HEIGHT_RATIO_MOBILE
      : LoadingView.IMAGE_HEIGHT_RATIO_DESKTOP;
    const imageHeight = window.innerHeight * imageHeightRatio;
    const imageWidth = imageHeight * LoadingView.IMAGE_ASPECT;
    this.thoth.width = imageWidth;
    this.thoth.height = imageHeight;

    this.barWidth = isMobile
      ? LoadingView.BAR_WIDTH_MOBILE
      : LoadingView.BAR_WIDTH_DESKTOP;
    this.barHeight = isMobile
      ? LoadingView.BAR_HEIGHT_MOBILE
      : LoadingView.BAR_HEIGHT_DESKTOP;
    this.drawBar();

    this.titleLabel.style.fontSize = isMobile ? 48 : 96;

    const spacing = isMobile ? 24 : 32;

    if (isMobile) {
      // Mobile layout: Thoth image on top, title, progress bar, and loading label below
      const centerX = window.innerWidth / 2;
      const totalHeight =
        imageHeight +
        spacing * 2 +
        this.titleLabel.height +
        spacing +
        this.barHeight +
        spacing +
        this.loadingLabel.height;

      let currentY = (window.innerHeight - totalHeight) / 2;

      this.thoth.position.set(centerX, currentY + imageHeight / 2);
      currentY += imageHeight + spacing * 2;

      this.titleLabel.position.set(
        centerX,
        currentY + this.titleLabel.height / 2,
      );
      currentY += this.titleLabel.height + spacing;

      this.setBarPosition(centerX, currentY + this.barHeight / 2);
      currentY += this.barHeight + spacing;

      this.loadingLabel.position.set(
        centerX,
        currentY + this.loadingLabel.height / 2,
      );
    } else {
      // Desktop layout: Thoth image on the left, title, progress bar, and loading label on the right
      const centerY = window.innerHeight / 2;
      const leftCenterX = window.innerWidth * 0.35;
      const rightCenterX = window.innerWidth * 0.6;

      this.thoth.position.set(leftCenterX, centerY);

      const totalHeight =
        this.titleLabel.height +
        spacing * 2 +
        this.barHeight +
        spacing +
        this.loadingLabel.height;

      let currentY = centerY - totalHeight / 2;

      this.titleLabel.position.set(
        rightCenterX,
        currentY + this.titleLabel.height / 2,
      );
      currentY += this.titleLabel.height + spacing * 2;

      this.setBarPosition(rightCenterX, currentY + this.barHeight / 2);
      currentY += this.barHeight + spacing;

      this.loadingLabel.position.set(
        rightCenterX,
        currentY + this.loadingLabel.height / 2,
      );
    }
  }
}
