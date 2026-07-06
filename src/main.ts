import "./style.css";
import { LoadingView } from "./views/LoadingView";
import { GameView } from "./views/GameView";
import { Application, Assets, Container, Sprite, Ticker } from "pixi.js";

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
    let progress = 0;

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
  const [{ background: backgroundTexture, symbols: symbolTextures }] =
    await Promise.all([assetsPromise, fakeProgressPromise]);

  // Remove the loading view now that loading is complete
  app.stage.removeChild(loadingView);

  // Create and add the game view to the stage
  const gameView = new GameView(backgroundTexture, symbolTextures);
  app.stage.addChild(gameView);

  // Create and add a container to the stage
  // const container = new Container();

  // app.stage.addChild(container);

  // // Load the bunny texture
  // const texture = await Assets.load("https://pixijs.com/assets/bunny.png");

  // // Create a 5x5 grid of bunnies in the container
  // for (let i = 0; i < 25; i++) {
  //   const bunny = new Sprite(texture);

  //   bunny.x = (i % 5) * 40;
  //   bunny.y = Math.floor(i / 5) * 40;
  //   container.addChild(bunny);
  // }

  // // Move the container to the center
  // container.x = app.screen.width / 2;
  // container.y = app.screen.height / 2;

  // // Center the bunny sprites in local container coordinates
  // container.pivot.x = container.width / 2;
  // container.pivot.y = container.height / 2;

  // // Listen for animate update
  // app.ticker.add((time: Ticker) => {
  //   // Continuously rotate the container!
  //   // * use delta to create frame-independent transform *
  //   container.rotation -= 0.01 * time.deltaTime;
  // });
}

await createApp();
