import { Container, Graphics, Text, Assets, Sprite, Texture } from "pixi.js";
import type Symbol from "../types/symbol.interface";
import { GameConfig } from "../config/GameConfig";

export class LoadingView extends Container {
  private static readonly BAR_WIDTH_MOBILE = 200;
  private static readonly BAR_HEIGHT_MOBILE = 12;
  private static readonly BAR_WIDTH_DESKTOP = 320;
  private static readonly BAR_HEIGHT_DESKTOP = 20;
  private static readonly PAGE_BACKGROUND_PATH =
    "/assets/images/page-background.jpg";
  private static readonly SILHOUETTE_PATH =
    "/assets/images/thoth-silhouette.svg";
  private static readonly SILHOUETTE_HEIGHT_RATIO_MOBILE = 0.525;
  private static readonly SILHOUETTE_HEIGHT_RATIO_DESKTOP = 0.55;
  private static readonly BAR_CORNER_RADIUS = 4;
  private static readonly SILHOUETTE_BOTTOM_MARGIN_RATIO = 0.05;
  private static readonly TITLE_TOP_MARGIN_RATIO = 0.1;
  private static readonly MUSIC_PATHS = [
    "/assets/music/egypt-desert-music-01.mp3",
    "/assets/music/egypt-desert-music-02.mp3",
  ];
  private static readonly SOUND_PATHS = [
    "/assets/sounds/magic-spell-3.mp3",
    "/assets/sounds/magic-spell-5.mp3",
    "/assets/sounds/magic-spell-win.mp3",
    "/assets/sounds/magic-twinkle.mp3",
  ];

  private barWidth = LoadingView.BAR_WIDTH_DESKTOP;
  private barHeight = LoadingView.BAR_HEIGHT_DESKTOP;
  private progress = 0;
  private readonly pageBackground: Sprite;
  private readonly silhouette: Sprite;
  private readonly barBackground: Graphics;
  private readonly barFill: Graphics;
  private readonly titleLabel: Text;

  private constructor(
    pageBackgroundTexture: Texture,
    silhouetteTexture: Texture,
  ) {
    super();

    this.pageBackground = new Sprite(pageBackgroundTexture);
    this.pageBackground.anchor.set(0.5);

    this.silhouette = new Sprite(silhouetteTexture);
    this.silhouette.anchor.set(0.5);

    this.titleLabel = new Text({
      text: "Th0th Sl0t",
      style: { fill: 0xfbd554, fontSize: 48, fontFamily: "Caesar Dressing" },
    });
    this.titleLabel.anchor.set(0.5);

    this.barBackground = new Graphics();
    this.barFill = new Graphics();

    this.addChild(
      this.pageBackground,
      this.titleLabel,
      this.barBackground,
      this.barFill,
      this.silhouette,
    );
    this.setProgress(0);

    this.resize();
    window.addEventListener("resize", () => this.resize());
  }

  get pageBackgroundTexture(): Texture {
    return this.pageBackground.texture;
  }

  static async create(): Promise<LoadingView> {
    const [pageBackgroundTexture, silhouetteTexture] = await Promise.all([
      Assets.load(LoadingView.PAGE_BACKGROUND_PATH),
      Assets.load(LoadingView.SILHOUETTE_PATH),
      document.fonts.load('24px "Caesar Dressing"'),
      document.fonts.load('800 24px "Inter"'),
    ]);
    return new LoadingView(pageBackgroundTexture, silhouetteTexture);
  }

  static async loadAssets(
    symbols: Symbol[],
    onProgress?: (progress: number) => void,
  ): Promise<{
    gameBackground: Texture;
    symbols: Record<string, Texture>;
    symbolBackground: Texture;
    balanceWinBackground: Texture;
    spinButtonBackground: Texture;
    music: HTMLAudioElement[];
    sounds: Record<string, HTMLAudioElement>;
  }> {
    const gameBackgroundPath = "/assets/images/game-background.png";
    const symbolBackgroundPath = "/assets/images/squircles/yellow-gradient.svg";
    const balanceWinBackgroundPath =
      "/assets/images/balance-win-background.png";
    const spinButtonBackgroundPath =
      "/assets/images/gold-star-spin-background.png";

    const symbolPathToId = new Map<string, string>();
    for (const symbol of symbols) {
      symbolPathToId.set(`/assets/symbols/${symbol.textureKey}.png`, symbol.id);
    }
    const symbolPaths = Array.from(symbolPathToId.keys());

    // Load all textures, music, and sounds concurrently, reporting progress if a callback is provided
    const [textures, music, sounds] = await Promise.all([
      Assets.load(
        [
          gameBackgroundPath,
          symbolBackgroundPath,
          balanceWinBackgroundPath,
          spinButtonBackgroundPath,
          ...symbolPaths,
        ],
        onProgress,
      ),
      LoadingView.loadMusic(),
      LoadingView.loadSounds(),
    ]);

    const symbolTextureMap: Record<string, Texture> = {};
    for (const [path, id] of symbolPathToId) {
      symbolTextureMap[id] = textures[path];
    }

    return {
      gameBackground: textures[gameBackgroundPath],
      symbols: symbolTextureMap,
      symbolBackground: textures[symbolBackgroundPath],
      balanceWinBackground: textures[balanceWinBackgroundPath],
      spinButtonBackground: textures[spinButtonBackgroundPath],
      music,
      sounds,
    };
  }

  // Load the background music tracks and return them, ready to be played in sequence
  private static loadMusic(): Promise<HTMLAudioElement[]> {
    return Promise.all(
      LoadingView.MUSIC_PATHS.map(LoadingView.loadAudioElement),
    );
  }

  // Load the one-shot sound effects, keyed by file name without extension
  private static async loadSounds(): Promise<Record<string, HTMLAudioElement>> {
    const audios = await Promise.all(
      LoadingView.SOUND_PATHS.map(LoadingView.loadAudioElement),
    );

    const sounds: Record<string, HTMLAudioElement> = {};
    LoadingView.SOUND_PATHS.forEach((path, index) => {
      const name = path
        .split("/")
        .pop()!
        .replace(/\.[^.]+$/, "");
      sounds[name] = audios[index];
    });

    return sounds;
  }

  private static loadAudioElement(path: string): Promise<HTMLAudioElement> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(path);
      // Some browsers (Safari in particular) are inconsistent about
      // autoplay/gesture handling for media elements that aren't in the DOM.
      audio.style.display = "none";
      document.body.appendChild(audio);
      audio.addEventListener("canplaythrough", () => resolve(audio), {
        once: true,
      });
      audio.addEventListener(
        "error",
        () => reject(new Error(`Failed to load audio: ${path}`)),
        { once: true },
      );
      audio.load();
    });
  }

  setProgress(ratio: number): void {
    this.progress = Math.max(0, Math.min(1, ratio));
    this.drawLoadingBar();
  }

  // Draw the loading bar based on the current progress
  private drawLoadingBar(): void {
    this.barBackground
      .clear()
      .roundRect(
        -this.barWidth / 2,
        -this.barHeight / 2,
        this.barWidth,
        this.barHeight,
        LoadingView.BAR_CORNER_RADIUS,
      )
      .fill({ color: 0x000000 });

    this.barFill
      .clear()
      .roundRect(
        0,
        0,
        this.barWidth * this.progress,
        this.barHeight,
        LoadingView.BAR_CORNER_RADIUS,
      )
      .fill({ color: 0xfbd554 });
  }

  // Set the position of the loading bar and its fill based on the center coordinates
  private setBarPosition(centerX: number, centerY: number): void {
    this.barBackground.position.set(centerX, centerY);
    this.barFill.position.set(
      centerX - this.barWidth / 2,
      centerY - this.barHeight / 2,
    );
  }

  private resize(): void {
    const isMobile = window.innerWidth < GameConfig.layout.mobileBreakpoint;

    // Scale the page background to cover the entire window while maintaining its aspect ratio
    const scale = Math.max(
      window.innerWidth / this.pageBackground.texture.width,
      window.innerHeight / this.pageBackground.texture.height,
    );
    this.pageBackground.width = this.pageBackground.texture.width * scale;
    this.pageBackground.height = this.pageBackground.texture.height * scale;
    this.pageBackground.position.set(
      window.innerWidth / 2,
      window.innerHeight / 2,
    );

    // Adjust the loading bar dimensions based on the device type
    this.barWidth = isMobile
      ? LoadingView.BAR_WIDTH_MOBILE
      : LoadingView.BAR_WIDTH_DESKTOP;
    this.barHeight = isMobile
      ? LoadingView.BAR_HEIGHT_MOBILE
      : LoadingView.BAR_HEIGHT_DESKTOP;
    this.drawLoadingBar();

    // Adjust the title label font size based on the device type
    this.titleLabel.style.fontSize = isMobile ? 48 : 96;

    // Adjust the silhouette size based on the device type and window dimensions
    const silhouetteHeightRatio = isMobile
      ? LoadingView.SILHOUETTE_HEIGHT_RATIO_MOBILE
      : LoadingView.SILHOUETTE_HEIGHT_RATIO_DESKTOP;
    const silhouetteHeight = window.innerHeight * silhouetteHeightRatio;
    const silhouetteAspect =
      this.silhouette.texture.width / this.silhouette.texture.height;
    this.silhouette.height = silhouetteHeight;
    this.silhouette.width = silhouetteHeight * silhouetteAspect;

    // Calculate the center X position and spacing for layout adjustments
    const centerX = window.innerWidth / 2;
    const spacing = isMobile ? 24 : 32;

    // Set the positions of the title label
    const titleTopMargin =
      window.innerHeight * LoadingView.TITLE_TOP_MARGIN_RATIO;
    this.titleLabel.position.set(
      centerX,
      titleTopMargin + this.titleLabel.height / 2,
    );

    // Set the position of the loading bar
    this.setBarPosition(
      centerX,
      titleTopMargin + this.titleLabel.height + spacing + this.barHeight / 2,
    );

    // Set the position of the Thoth silhouette
    const silhouetteBottomMargin =
      window.innerHeight * LoadingView.SILHOUETTE_BOTTOM_MARGIN_RATIO;
    this.silhouette.position.set(
      centerX,
      window.innerHeight - silhouetteBottomMargin - silhouetteHeight / 2,
    );
  }
}
