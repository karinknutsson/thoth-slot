import "./style.css";
import { LoadingView } from "./views/LoadingView";
import { GameView } from "./views/GameView";
import { Application } from "pixi.js";

async function createApp(): Promise<void> {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#000000", resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Start loading the game assets in the background right away
  const assetsPromise = LoadingView.loadAssets();

  // Create and add the loading view to the stage
  const loadingView = await LoadingView.create();
  app.stage.addChild(loadingView);

  // Simulate loading progress
  const fakeProgressPromise = new Promise<void>((resolve) => {
    let progress = 0.02;

    const loadingInterval = setInterval(() => {
      progress += 0.01;
      loadingView.setProgress(progress);

      if (progress >= 1) {
        clearInterval(loadingInterval);
        resolve();
      }
    }, 50);
  });

  // Wait for both the fake progress bar and the real assets to finish
  const [
    { gameBackground: gameBackgroundTexture, symbols: symbolTextures, music },
  ] = await Promise.all([assetsPromise, fakeProgressPromise]);

  // Remove the loading view now that loading is complete
  app.stage.removeChild(loadingView);

  // Create and add the game view to the stage
  const gameView = new GameView(
    loadingView.pageBackgroundTexture,
    gameBackgroundTexture,
    symbolTextures,
  );
  app.stage.addChild(gameView);

  // Start the background music now that the game view is showing.
  // Browsers block audio autoplay without a prior user gesture, so fall
  // back to starting it on the first interaction if that happens.
  music.play().catch((error) => {
    console.warn("Music autoplay was blocked, waiting for user input:", error);

    const startMusic = () => {
      music.play().catch((retryError) => {
        console.warn(
          "Music still failed to play after user input:",
          retryError,
        );
      });
    };

    for (const eventName of ["pointerdown", "keydown", "touchstart"]) {
      document.addEventListener(eventName, startMusic, {
        once: true,
        capture: true,
      });
    }
  });
}

await createApp();
