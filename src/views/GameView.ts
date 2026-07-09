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
  private static readonly BALANCE_WIN_MARGIN_X = 30;
  private static readonly BALANCE_WIN_MARGIN_Y = 50;
  private static readonly BALANCE_WIN_TEXT_PADDING = 20;
  private static readonly BALANCE_WIN_TEXT_GAP = 20;
  private static readonly BALANCE_WIN_FONT_SIZE = 95;
  private static readonly SPIN_BUTTON_HEIGHT_MULTIPLIER = 1.7;
  private static readonly SPIN_BUTTON_MARGIN = 188;
  private static readonly SPIN_BUTTON_LABEL_FONT_SIZE = 175;
  private static readonly SPIN_BUTTON_LABEL_LETTER_SPACING = 4;
  private static readonly SPIN_BUTTON_ACTIVE_COLOR = 0xd91e1e;
  private static readonly SPIN_BUTTON_DISABLED_COLOR = 0x808080;

  private readonly imageWidth = 3080;
  private readonly imageHeight = 2320;
  private readonly background: Sprite;
  private readonly reelsBackground: Sprite;
  private readonly contentBackground: Graphics;
  private readonly balanceWinBackground: Sprite;
  private readonly balanceWinContentBackground: Graphics;

  readonly spinButton: Container;
  private readonly spinButtonFrame: Sprite;
  private readonly spinButtonCircle: Graphics;
  private readonly spinButtonLabel: Text;
  private spinButtonEnabled = true;
  private spinCircleCx = 0;
  private spinCircleCy = 0;
  private spinCircleRx = 0;
  private spinCircleRy = 0;

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
    spinButtonBackgroundTexture: Texture,
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

    this.spinButtonFrame = new Sprite(spinButtonBackgroundTexture);
    this.spinButtonFrame.anchor.set(0, 0);

    this.spinButtonCircle = new Graphics();

    this.spinButtonLabel = new Text({
      text: "SPIN",
      style: {
        fill: 0xffffff,
        fontSize: 24,
        fontFamily: "Inter",
        fontWeight: "800",
        letterSpacing: GameView.SPIN_BUTTON_LABEL_LETTER_SPACING,
      },
    });
    this.spinButtonLabel.anchor.set(0.5);

    this.spinButton.addChild(
      this.spinButtonFrame,
      this.spinButtonCircle,
      this.spinButtonLabel,
    );
    this.addChild(this.spinButton);

    this.balanceLabel = new Text({
      text: "Balance:",
      style: {
        fill: 0xfbd554,
        fontSize: 26,
        fontFamily: "Inter",
        fontWeight: "700",
      },
    });
    this.addChild(this.balanceLabel);

    this.balanceValue = new Text({
      text: "0",
      style: {
        fill: 0xfbd554,
        fontSize: 26,
        fontFamily: "Inter",
        fontWeight: "700",
      },
    });
    this.balanceValue.anchor.set(1, 0);
    this.addChild(this.balanceValue);

    this.winLabel = new Text({
      text: "Win:",
      style: {
        fill: 0xfbd554,
        fontSize: 26,
        fontFamily: "Inter",
        fontWeight: "700",
      },
    });
    this.addChild(this.winLabel);

    this.winValue = new Text({
      text: "0",
      style: {
        fill: 0xfbd554,
        fontSize: 26,
        fontFamily: "Inter",
        fontWeight: "700",
      },
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
    this.spinButtonEnabled = enabled;
    this.drawSpinButtonCircle();
  }

  private drawSpinButtonCircle(): void {
    const color = this.spinButtonEnabled
      ? GameView.SPIN_BUTTON_ACTIVE_COLOR
      : GameView.SPIN_BUTTON_DISABLED_COLOR;

    this.spinButtonCircle
      .clear()
      .ellipse(
        this.spinCircleCx,
        this.spinCircleCy,
        this.spinCircleRx,
        this.spinCircleRy,
      )
      .fill({ color });
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

    // Vertically centered in the space below the board, aligned with the
    // board's own left edge (not the padded reel content area)
    const footerTop = centerY + boardHeight / 2;
    const footerCenterY = (footerTop + window.innerHeight) / 2;

    const balanceWinX = centerX - boardWidth / 2;
    const balanceWinY = footerCenterY - balanceWinHeight / 2;

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

    const spinButtonTexture = this.spinButtonFrame.texture;
    const spinButtonSize =
      balanceWinHeight * GameView.SPIN_BUTTON_HEIGHT_MULTIPLIER;
    const spinButtonScale = spinButtonSize / spinButtonTexture.width;
    const spinButtonHeight = spinButtonTexture.height * spinButtonScale;

    // Aligned with the board's own right edge, mirroring the balance/win panel
    const spinButtonX = centerX + boardWidth / 2 - spinButtonSize;
    const spinButtonY = balanceWinCenterY - spinButtonHeight / 2;

    this.spinButtonFrame.width = spinButtonSize;
    this.spinButtonFrame.height = spinButtonHeight;
    this.spinButton.position.set(spinButtonX, spinButtonY);

    const spinMargin = GameView.SPIN_BUTTON_MARGIN * spinButtonScale;

    const circleWidth = spinButtonSize - spinMargin * 2;
    const circleHeight = spinButtonHeight - spinMargin * 2;

    this.spinCircleCx = spinMargin + circleWidth / 2;
    this.spinCircleCy = spinMargin + circleHeight / 2;
    this.spinCircleRx = circleWidth / 2;
    this.spinCircleRy = circleHeight / 2;
    this.drawSpinButtonCircle();

    this.spinButtonLabel.style.fontSize =
      GameView.SPIN_BUTTON_LABEL_FONT_SIZE * spinButtonScale;
    this.spinButtonLabel.style.letterSpacing =
      GameView.SPIN_BUTTON_LABEL_LETTER_SPACING * spinButtonScale;
    this.spinButtonLabel.position.set(this.spinCircleCx, this.spinCircleCy);
  }
}
