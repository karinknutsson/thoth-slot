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
  private static readonly TITLE_FONT_SIZE = 115.2;
  private static readonly PANEL_WIDTH_RATIO = 0.22;
  private static readonly PANEL_WIDTH_RATIO_MOBILE = 0.44;
  private static readonly PANEL_MARGIN_X = 30;
  private static readonly PANEL_MARGIN_Y = 50;
  private static readonly PANEL_TEXT_PADDING = 45;
  private static readonly PANEL_FONT_SIZE = 75;
  private static readonly SPIN_BUTTON_HEIGHT_MULTIPLIER_DESKTOP = 2.475;
  private static readonly SPIN_BUTTON_HEIGHT_MULTIPLIER_COMPACT = 2.2;
  private static readonly SPIN_BUTTON_HEIGHT_MULTIPLIER_MOBILE = 1.65;
  private static readonly SPIN_BUTTON_MARGIN = 188;
  private static readonly SPIN_BUTTON_LABEL_FONT_SIZE = 175;
  private static readonly SPIN_BUTTON_LABEL_LETTER_SPACING = 8;
  private static readonly SPIN_BUTTON_ACTIVE_COLOR = 0xed1c1c;
  private static readonly SPIN_BUTTON_DISABLED_COLOR = 0x808080;

  private readonly imageWidth = 3080;
  private readonly imageHeight = 2320;
  private readonly background: Sprite;
  private readonly reelsBackground: Sprite;
  private readonly contentBackground: Graphics;
  private readonly balancePanelBackground: Sprite;
  private readonly balancePanelFill: Graphics;
  private readonly winPanelBackground: Sprite;
  private readonly winPanelFill: Graphics;

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

    this.balancePanelBackground = new Sprite(balanceWinBackgroundTexture);
    this.balancePanelBackground.anchor.set(0, 0);
    this.addChild(this.balancePanelBackground);

    this.balancePanelFill = new Graphics();
    this.addChild(this.balancePanelFill);

    this.winPanelBackground = new Sprite(balanceWinBackgroundTexture);
    this.winPanelBackground.anchor.set(0, 0);
    this.addChild(this.winPanelBackground);

    this.winPanelFill = new Graphics();
    this.addChild(this.winPanelFill);

    this.titleLabel = new Text({
      text: "Th0th Sl0t",
      style: {
        fill: 0xfbd554,
        fontSize: 48,
        fontFamily: "Caesar Dressing",
        align: "center",
      },
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
      text: "BALANCE:",
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
      text: "WIN:",
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

  private layoutPanel(
    background: Sprite,
    fill: Graphics,
    label: Text,
    value: Text,
    x: number,
    y: number,
    width: number,
    height: number,
    scale: number,
  ): void {
    background.width = width;
    background.height = height;
    background.position.set(x, y);

    const marginX = GameView.PANEL_MARGIN_X * scale;
    const marginY = GameView.PANEL_MARGIN_Y * scale;

    fill
      .clear()
      .rect(x + marginX, y + marginY, width - marginX * 2, height - marginY * 2)
      .fill({ color: GameView.REEL_GAP_COLOR });

    const textInset =
      (GameView.PANEL_MARGIN_X + GameView.PANEL_TEXT_PADDING) * scale;
    const fontSize = GameView.PANEL_FONT_SIZE * scale;
    label.style.fontSize = fontSize;
    value.style.fontSize = fontSize;

    const rowY = y + height / 2 - label.height / 2;
    label.position.set(x + textInset, rowY);
    value.position.set(x + width - textInset, rowY);
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

    // Centered between the top of the window and the top of the game board
    this.titleLabel.text = isMobile ? "Th0th\nSl0t" : "Th0th Sl0t";
    this.titleLabel.style.fontSize = GameView.TITLE_FONT_SIZE;
    const boardTop = centerY - boardHeight / 2;
    this.titleLabel.position.set(centerX, boardTop / 2);

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

    const panelTexture = this.balancePanelBackground.texture;
    const spinButtonTexture = this.spinButtonFrame.texture;

    let panelWidth: number;
    let panelScale: number;
    let panelHeight: number;
    let spinButtonSize: number;
    let balancePanelX: number;
    let balancePanelY: number;
    let winPanelX: number;
    let winPanelY: number;
    let spinButtonX: number;
    let spinButtonY: number;

    if (isMobile) {
      // Stacked vertically under the board: spin button, then balance, then
      // win, spaced evenly (equal gaps before, between, and after them) across
      // all of the space between the board and the bottom of the window
      panelWidth = boardWidth * GameView.PANEL_WIDTH_RATIO_MOBILE;
      panelScale = panelWidth / panelTexture.width;
      panelHeight = panelTexture.height * panelScale;

      spinButtonSize =
        panelHeight * GameView.SPIN_BUTTON_HEIGHT_MULTIPLIER_MOBILE;
      const spinButtonScale = spinButtonSize / spinButtonTexture.width;
      const spinButtonHeight = spinButtonTexture.height * spinButtonScale;

      const stackTop = centerY + boardHeight / 2;
      const stackAvailableHeight = window.innerHeight - stackTop;
      const stackContentHeight = spinButtonHeight + panelHeight * 2;
      const stackGap = (stackAvailableHeight - stackContentHeight) / 4;

      spinButtonX = centerX - spinButtonSize / 2;
      spinButtonY = stackTop + stackGap;

      balancePanelX = centerX - panelWidth / 2;
      balancePanelY = spinButtonY + spinButtonHeight + stackGap;

      winPanelX = centerX - panelWidth / 2;
      winPanelY = balancePanelY + panelHeight + stackGap;
    } else {
      // One row below the board: balance panel, spin button, and win panel
      // spaced evenly (equal gaps before, between, and after them) across
      // the game background's width
      panelWidth = boardWidth * GameView.PANEL_WIDTH_RATIO;
      panelScale = panelWidth / panelTexture.width;
      panelHeight = panelTexture.height * panelScale;

      const spinButtonMultiplier =
        window.innerWidth < GameConfig.layout.desktopBreakpoint
          ? GameView.SPIN_BUTTON_HEIGHT_MULTIPLIER_COMPACT
          : GameView.SPIN_BUTTON_HEIGHT_MULTIPLIER_DESKTOP;
      spinButtonSize = panelHeight * spinButtonMultiplier;

      const footerTop = centerY + boardHeight / 2;
      const footerCenterY = (footerTop + window.innerHeight) / 2;

      const rowLeft = centerX - boardWidth / 2;
      const rowContentWidth = panelWidth * 2 + spinButtonSize;
      const rowGap = (boardWidth - rowContentWidth) / 4;

      balancePanelX = rowLeft + rowGap;
      spinButtonX = balancePanelX + panelWidth + rowGap;
      winPanelX = spinButtonX + spinButtonSize + rowGap;

      const spinButtonScale = spinButtonSize / spinButtonTexture.width;
      const spinButtonHeight = spinButtonTexture.height * spinButtonScale;

      balancePanelY = footerCenterY - panelHeight / 2;
      winPanelY = balancePanelY;
      spinButtonY = footerCenterY - spinButtonHeight / 2;
    }

    this.layoutPanel(
      this.balancePanelBackground,
      this.balancePanelFill,
      this.balanceLabel,
      this.balanceValue,
      balancePanelX,
      balancePanelY,
      panelWidth,
      panelHeight,
      panelScale,
    );

    this.layoutPanel(
      this.winPanelBackground,
      this.winPanelFill,
      this.winLabel,
      this.winValue,
      winPanelX,
      winPanelY,
      panelWidth,
      panelHeight,
      panelScale,
    );

    const spinButtonScale = spinButtonSize / spinButtonTexture.width;
    const spinButtonHeight = spinButtonTexture.height * spinButtonScale;

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
