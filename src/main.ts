import "./style.css";
import { LoadingView } from "./views/LoadingView";
import { GameView } from "./views/GameView";
import { CheatView } from "./views/CheatView";
import { AudioView } from "./views/AudioView";
import { Application } from "pixi.js";
import { BackendManager } from "./services/BackendManager";
import { paytable } from "./data/paytable-data";
import { SpinController } from "./controllers/SpinController";
import { CheatsController } from "./controllers/CheatController";
import { AudioController } from "./controllers/AudioController";
import { GameStateModel } from "./models/GameStateModel";
import { GameConfig } from "./config/GameConfig";

async function createApp(): Promise<void> {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#000000", resizeTo: window });

  // Append the application canvas to the document body
  document.body.appendChild(app.canvas);

  // Create and add the loading view to the stage
  const loadingView = await LoadingView.create();
  app.stage.addChild(loadingView);

  // Load the game assets, updating the loading bar with their real progress
  const {
    gameBackground: gameBackgroundTexture,
    symbols: symbolTextures,
    symbolBackground: symbolBackgroundTexture,
    balanceWinBackground: balanceWinBackgroundTexture,
    spinButtonBackground: spinButtonBackgroundTexture,
    music,
  } = await LoadingView.loadAssets(paytable.symbols, (progress) =>
    loadingView.setProgress(progress),
  );

  // Remove the loading view now that loading is complete
  app.stage.removeChild(loadingView);

  // Create and add the game view to the stage
  const backend = new BackendManager(paytable);
  const gameView = new GameView(
    loadingView.pageBackgroundTexture,
    gameBackgroundTexture,
    symbolTextures,
    backend.getWeightedPool(),
    symbolBackgroundTexture,
    balanceWinBackgroundTexture,
    spinButtonBackgroundTexture,
  );
  app.stage.addChild(gameView);

  const model = new GameStateModel(
    GameConfig.balance.starting,
    GameConfig.balance.defaultBet,
  );
  gameView.updateBalance(model.balance);

  // Create the spin controller to handle the game logic
  const spinController = new SpinController(model, backend, gameView);

  gameView.spinButton.on("pointertap", () => {
    gameView.setSpinButtonEnabled(false);
    void spinController.spin().finally(() => {
      gameView.setSpinButtonEnabled(true);
    });
  });

  if (GameConfig.showCheatMenu) {
    const cheatsController = new CheatsController(backend);
    const cheatView = new CheatView((cheatName) =>
      cheatsController.select(cheatName),
    );
    app.stage.addChild(cheatView);
  }

  // Start the background music now that the game view is showing
  const audioController = new AudioController(music);
  audioController.playWithAutoplayFallback();

  if (GameConfig.showAudioMenu) {
    const audioView = new AudioView(
      (volume) => audioController.setMusicVolume(volume),
      (volume) => audioController.setSoundVolume(volume),
    );
    app.stage.addChild(audioView);
  }
}

await createApp();
