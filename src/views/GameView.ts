import { Container, Graphics, Sprite, Text, Texture } from "pixi.js";
import { ReelView } from "./ReelView";
import { GameConfig } from "../config/GameConfig";

export class GameView extends Container {
  private static readonly BOARD_WIDTH_RATIO_DESKTOP = 0.6;
  private static readonly BOARD_WIDTH_RATIO_TABLET = 0.8;
  private static readonly BOARD_WIDTH_RATIO_MOBILE = 0.9;
  private static readonly SYMBOL_SPACING_RATIO = 0.15;
  private static readonly REEL_GAP = 32;
  private static readonly REEL_GAP_COLOR = 0x240902;
  private static readonly CONTENT_PADDING_LEFT_RIGHT = 80;
  private static readonly CONTENT_PADDING_TOP = 140;
  private static readonly CONTENT_PADDING_BOTTOM = 130;
  private static readonly TITLE_TOP_MARGIN_RATIO = 0.1;
  private static readonly BALANCE_WIN_WIDTH_RATIO = 0.27;
  private static readonly BALANCE_WIN_TOP_MARGIN = 24;
  private static readonly BALANCE_WIN_MARGIN_X = 30;
  private static readonly BALANCE_WIN_MARGIN_Y = 50;
  private static readonly BALANCE_WIN_TEXT_PADDING = 20;
  private static readonly BALANCE_WIN_TEXT_GAP = 20;
  private static readonly BALANCE_WIN_FONT_SIZE = 120;

  private readonly imageWidth = 3080;
  private readonly imageHeight = 2320;
  private readonly background: Sprite;
  private readonly reelsBackground: Sprite;
  private readonly contentBackground: Graphics;
  private readonly balanceWinBackground: Sprite;
  private readonly balanceWinContentBackground: Graphics;

  readonly spinButton: Container;
  private readonly spinButtonBackground: Graphics;
  private readonly spinButtonLabel: Text;

  readonly reels: ReelView[];

  private readonly titleLabel: Text;
  private readonly balanceLabel: Text;
  private readonly balanceValue: Text;
  private readonly winLabel: Text;
  private readonly winValue: Text;

  public constructor(
    pageBackgroundTexture: Texture,
    gameBackgroundTexture: Texture,
    symbolTextureMap: Record<string, Texture>,
    weightedPool: string[],
    symbolBackgroundTexture: Texture,
    balanceWinBackgroundTexture: Texture,
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

    this.balanceWinBackground = new Sprite(balanceWinBackgroundTexture);
    this.balanceWinBackground.anchor.set(0, 0);
    this.addChild(this.balanceWinBackground);

    this.balanceWinContentBackground = new Graphics();
    this.addChild(this.balanceWinContentBackground);

    this.titleLabel = new Text({
      text: "Th0th Sl0t",
      style: { fill: 0xfbd554, fontSize: 48, fontFamily: "Caesar Dressing" },
    });
    this.titleLabel.anchor.set(0.5);
    this.addChild(this.titleLabel);

    this.reels = Array.from(
      { length: GameConfig.reels.count },
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

    this.balanceLabel = new Text({
      text: "Balance:",
      style: { fill: 0xfbd554, fontSize: 26, fontFamily: "Caesar Dressing" },
    });
    this.addChild(this.balanceLabel);

    this.balanceValue = new Text({
      text: "0",
      style: { fill: 0xfbd554, fontSize: 26, fontFamily: "Caesar Dressing" },
    });
    this.balanceValue.anchor.set(1, 0);
    this.addChild(this.balanceValue);

    this.winLabel = new Text({
      text: "Win:",
      style: { fill: 0xfbd554, fontSize: 26, fontFamily: "Caesar Dressing" },
    });
    this.addChild(this.winLabel);

    this.winValue = new Text({
      text: "0",
      style: { fill: 0xfbd554, fontSize: 26, fontFamily: "Caesar Dressing" },
    });
    this.winValue.anchor.set(1, 0);
    this.addChild(this.winValue);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  updateBalance(balance: number): void {
    this.balanceValue.text = `${balance}`;
  }

  updateWin(amount: number): void {
    this.winValue.text = `${amount}`;
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

    const isMobile = window.innerWidth < GameConfig.layout.mobileBreakpoint;
    this.titleLabel.style.fontSize = isMobile ? 48 : 96;
    const titleTopMargin = window.innerHeight * GameView.TITLE_TOP_MARGIN_RATIO;
    this.titleLabel.position.set(
      centerX,
      titleTopMargin + this.titleLabel.height / 2,
    );

    const boardWidthRatio =
      window.innerWidth < GameConfig.layout.mobileBreakpoint
        ? GameView.BOARD_WIDTH_RATIO_MOBILE
        : window.innerWidth < GameConfig.layout.desktopBreakpoint
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
      (contentWidth - (GameConfig.reels.count - 1) * reelGap) /
      GameConfig.reels.count;

    const startX = contentLeft;
    const startY = contentTop + (contentHeight - reelHeight) / 2;

    this.reels.forEach((reel, index) => {
      reel.resize(reelWidth, symbolSize, symbolSpacing);
      reel.position.set(startX + index * (reelWidth + reelGap), startY);
    });

    const balanceWinTexture = this.balanceWinBackground.texture;
    const balanceWinWidth = boardWidth * GameView.BALANCE_WIN_WIDTH_RATIO;
    const balanceWinScale = balanceWinWidth / balanceWinTexture.width;
    const balanceWinHeight = balanceWinTexture.height * balanceWinScale;

    // Aligned with the board's own left edge, not the padded reel content area
    const balanceWinX = centerX - boardWidth / 2;
    const balanceWinY =
      centerY + boardHeight / 2 + GameView.BALANCE_WIN_TOP_MARGIN * scale;

    this.balanceWinBackground.width = balanceWinWidth;
    this.balanceWinBackground.height = balanceWinHeight;
    this.balanceWinBackground.position.set(balanceWinX, balanceWinY);

    const balanceWinMarginX = GameView.BALANCE_WIN_MARGIN_X * balanceWinScale;
    const balanceWinMarginY = GameView.BALANCE_WIN_MARGIN_Y * balanceWinScale;

    this.balanceWinContentBackground
      .clear()
      .rect(
        balanceWinX + balanceWinMarginX,
        balanceWinY + balanceWinMarginY,
        balanceWinWidth - balanceWinMarginX * 2,
        balanceWinHeight - balanceWinMarginY * 2,
      )
      .fill({ color: GameView.REEL_GAP_COLOR });

    const textInset =
      (GameView.BALANCE_WIN_MARGIN_X + GameView.BALANCE_WIN_TEXT_PADDING) *
      balanceWinScale;
    const textGap = GameView.BALANCE_WIN_TEXT_GAP * balanceWinScale;
    const textLeftX = balanceWinX + textInset;
    const textRightX = balanceWinX + balanceWinWidth - textInset;
    const balanceWinCenterY = balanceWinY + balanceWinHeight / 2;

    const balanceWinFontSize = GameView.BALANCE_WIN_FONT_SIZE * balanceWinScale;
    this.balanceLabel.style.fontSize = balanceWinFontSize;
    this.balanceValue.style.fontSize = balanceWinFontSize;
    this.winLabel.style.fontSize = balanceWinFontSize;
    this.winValue.style.fontSize = balanceWinFontSize;

    const balanceRowY =
      balanceWinCenterY - this.balanceLabel.height - textGap / 2;
    const winRowY = balanceWinCenterY + textGap / 2;

    this.balanceLabel.position.set(textLeftX, balanceRowY);
    this.balanceValue.position.set(textRightX, balanceRowY);
    this.winLabel.position.set(textLeftX, winRowY);
    this.winValue.position.set(textRightX, winRowY);
  }
}
