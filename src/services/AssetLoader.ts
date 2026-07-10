import { Assets, Texture } from "pixi.js";
import type Symbol from "../types/symbol.interface";

export class AssetLoader {
  private static readonly MUSIC_PATHS = [
    "/assets/music/egypt-desert-music-01.mp3",
    "/assets/music/egypt-desert-music-02.mp3",
  ];
  private static readonly SOUND_PATHS = [
    "/assets/sounds/win-sound.mp3",
    "/assets/sounds/big-win-sound.mp3",
    "/assets/sounds/add-to-win.mp3",
  ];

  static async loadGameAssets(
    symbols: Symbol[],
    onProgress?: (progress: number) => void,
  ): Promise<{
    gameBackground: Texture;
    symbols: Record<string, Texture>;
    symbolBackground: Texture;
    symbolHighlightBackground: Texture;
    balanceWinBackground: Texture;
    spinButtonBackground: Texture;
    music: HTMLAudioElement[];
    sounds: Record<string, HTMLAudioElement>;
  }> {
    const gameBackgroundPath = "/assets/images/game-background.png";
    const symbolBackgroundPath =
      "/assets/images/squircles/yellow-gradient.svg";
    const symbolHighlightBackgroundPath =
      "/assets/images/squircles/yellow-gradient-inverse.svg";
    const balanceWinBackgroundPath =
      "/assets/images/balance-win-background.png";
    const spinButtonBackgroundPath =
      "/assets/images/gold-star-spin-background.png";

    const symbolPathToId = new Map<string, string>();
    for (const symbol of symbols) {
      symbolPathToId.set(`/assets/symbols/${symbol.textureKey}.png`, symbol.id);
    }
    const symbolPaths = Array.from(symbolPathToId.keys());

    // Load all textures, music, and sounds concurrently, reporting
    // progress if a callback is provided
    const [textures, music, sounds] = await Promise.all([
      Assets.load(
        [
          gameBackgroundPath,
          symbolBackgroundPath,
          symbolHighlightBackgroundPath,
          balanceWinBackgroundPath,
          spinButtonBackgroundPath,
          ...symbolPaths,
        ],
        onProgress,
      ),
      AssetLoader.loadMusic(),
      AssetLoader.loadSounds(),
    ]);

    const symbolTextureMap: Record<string, Texture> = {};
    for (const [path, id] of symbolPathToId) {
      symbolTextureMap[id] = textures[path];
    }

    return {
      gameBackground: textures[gameBackgroundPath],
      symbols: symbolTextureMap,
      symbolBackground: textures[symbolBackgroundPath],
      symbolHighlightBackground: textures[symbolHighlightBackgroundPath],
      balanceWinBackground: textures[balanceWinBackgroundPath],
      spinButtonBackground: textures[spinButtonBackgroundPath],
      music,
      sounds,
    };
  }

  // Load the background music tracks and return them, ready to be played
  // in sequence
  private static loadMusic(): Promise<HTMLAudioElement[]> {
    return Promise.all(
      AssetLoader.MUSIC_PATHS.map(AssetLoader.loadAudioElement),
    );
  }

  // Load the one-shot sound effects, keyed by file name without extension
  private static async loadSounds(): Promise<
    Record<string, HTMLAudioElement>
  > {
    const audios = await Promise.all(
      AssetLoader.SOUND_PATHS.map(AssetLoader.loadAudioElement),
    );

    const sounds: Record<string, HTMLAudioElement> = {};
    AssetLoader.SOUND_PATHS.forEach((path, index) => {
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
}
