import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { ReelView } from "./ReelView";

export class GameView extends Container {
  private static readonly MOBILE_BREAKPOINT = 768;
  private static readonly DESKTOP_BREAKPOINT = 1400;
  private static readonly BOARD_WIDTH_RATIO_DESKTOP = 0.6;
  private static readonly BOARD_WIDTH_RATIO_TABLET = 0.8;
  private static readonly BOARD_WIDTH_RATIO_MOBILE = 0.9;
  private static readonly REEL_COUNT = 5;
  private static readonly SYMBOL_SPACING_RATIO = 0.15;
  private static readonly REEL_GAP = 32;
  private static readonly REEL_GAP_COLOR = 0x240902;
  private static readonly CONTENT_PADDING_LEFT_RIGHT = 80;
  private static readonly CONTENT_PADDING_TOP = 140;
  private static readonly CONTENT_PADDING_BOTTOM = 130;

  private readonly imageWidth = 3080;
  private readonly imageHeight = 2320;
  private readonly background: Sprite;
  private readonly reelsBackground: Sprite;
  private readonly contentBackground: Graphics;

  readonly spinButton: Container;
  private readonly spinButtonBackground: Graphics;
  private readonly spinButtonLabel: Text;

  readonly reels: ReelView[];

  private readonly balanceText: Text;
  private readonly winText: Text;

  public constructor(
    pageBackgroundTexture: Texture,
    gameBackgroundTexture: Texture,
    symbolTextureMap: Record<string, Texture>,
    weightedPool: string[],
    symbolBackgroundTexture: Texture,
  ) {
    super();

    this.background = new Sprite(pageBackgroundTexture);
    this.background.anchor.set(0.5);
    this.addChild(this.background);

    this.reelsBackground = new Sprite(gameBackgroundTexture);
    this.reelsBackground.anchor.set(0.5);
    this.addChild(this.reelsBackground);

    this.contentBackground = new Graphics();
    this.addChild(this.contentBackground);

    this.reels = Array.from(
      { length: GameView.REEL_COUNT },
      () =>
        new ReelView(symbolTextureMap, weightedPool, symbolBackgroundTexture),
    );

    this.addChild(...this.reels);

    // Create the spin button
    this.spinButton = new Container();
    this.spinButton.eventMode = "static";
    this.spinButton.cursor = "pointer";

    this.spinButtonBackground = new Graphics()
      .roundRect(0, 0, 140, 60, 12)
      .fill({ color: 0xfbd554 });

    this.spinButtonLabel = new Text({
      text: "SPIN",
      style: {
        fill: 0x1a1a22,
        fontSize: 24,
        fontFamily: "sans-serif",
        fontWeight: "bold",
      },
    });
    this.spinButtonLabel.anchor.set(0.5);
    this.spinButtonLabel.position.set(70, 30);

    this.spinButton.addChild(this.spinButtonBackground, this.spinButtonLabel);
    this.addChild(this.spinButton);

    this.balanceText = new Text({
      text: "Balance: 0",
      style: { fill: 0xffffff, fontSize: 22, fontFamily: "sans-serif" },
    });
    this.addChild(this.balanceText);

    this.winText = new Text({
      text: "Win: 0",
      style: { fill: 0xffd24d, fontSize: 22, fontFamily: "sans-serif" },
    });
    this.addChild(this.winText);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  updateBalance(balance: number): void {
    this.balanceText.text = `Balance: ${balance}`;
  }

  updateWin(amount: number): void {
    this.winText.text = `Win: ${amount}`;
  }

  setSpinButtonEnabled(enabled: boolean): void {
    this.spinButton.eventMode = enabled ? "static" : "none";
    this.spinButton.alpha = enabled ? 1 : 0.5;
  }

  private resize(): void {
    const pageScale = Math.max(
      window.innerWidth / this.imageWidth,
      window.innerHeight / this.imageHeight,
    );

    this.background.width = this.imageWidth * pageScale;
    this.background.height = this.imageHeight * pageScale;
    this.background.position.set(window.innerWidth / 2, window.innerHeight / 2);

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const boardWidthRatio =
      window.innerWidth < GameView.MOBILE_BREAKPOINT
        ? GameView.BOARD_WIDTH_RATIO_MOBILE
        : window.innerWidth < GameView.DESKTOP_BREAKPOINT
          ? GameView.BOARD_WIDTH_RATIO_TABLET
          : GameView.BOARD_WIDTH_RATIO_DESKTOP;

    const boardTexture = this.reelsBackground.texture;
    const boardWidth = window.innerWidth * boardWidthRatio;
    const scale = boardWidth / boardTexture.width;
    const boardHeight = boardTexture.height * scale;

    this.reelsBackground.width = boardWidth;
    this.reelsBackground.height = boardHeight;
    this.reelsBackground.position.set(centerX, centerY);

    const paddingLeftRight = GameView.CONTENT_PADDING_LEFT_RIGHT * scale;
    const paddingTop = GameView.CONTENT_PADDING_TOP * scale;
    const paddingBottom = GameView.CONTENT_PADDING_BOTTOM * scale;

    const contentLeft = centerX - boardWidth / 2 + paddingLeftRight;
    const contentTop = centerY - boardHeight / 2 + paddingTop;
    const contentWidth = boardWidth - paddingLeftRight * 2;
    const contentHeight = boardHeight - paddingTop - paddingBottom;

    this.contentBackground
      .clear()
      .rect(contentLeft, contentTop, contentWidth, contentHeight)
      .fill({ color: GameView.REEL_GAP_COLOR });

    const reelGap = GameView.REEL_GAP * scale;

    const symbolSpacingFactor =
      ReelView.VISIBLE_SYMBOLS +
      (ReelView.VISIBLE_SYMBOLS - 1) * GameView.SYMBOL_SPACING_RATIO;
    const symbolSize = contentHeight / symbolSpacingFactor;
    const symbolSpacing = symbolSize * GameView.SYMBOL_SPACING_RATIO;

    const reelHeight =
      symbolSize * ReelView.VISIBLE_SYMBOLS +
      (ReelView.VISIBLE_SYMBOLS - 1) * symbolSpacing;
    const reelWidth =
      (contentWidth - (GameView.REEL_COUNT - 1) * reelGap) /
      GameView.REEL_COUNT;

    const startX = contentLeft;
    const startY = contentTop + (contentHeight - reelHeight) / 2;

    this.reels.forEach((reel, index) => {
      reel.resize(reelWidth, symbolSize, symbolSpacing);
      reel.position.set(startX + index * (reelWidth + reelGap), startY);
    });

    this.balanceText.position.set(40, window.innerHeight - 60);
    this.winText.position.set(40, window.innerHeight - 30);
  }
}
