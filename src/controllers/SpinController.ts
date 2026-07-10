import type { GameStateModel } from "../models/GameStateModel";
import type { BackendManager } from "../services/BackendManager";
import type { GameView } from "../views/GameView";
import type { AudioController } from "./AudioController";
import { GameConfig } from "../config/GameConfig";

export class SpinController {
  private readonly model: GameStateModel;
  private readonly backend: BackendManager;
  private readonly view: GameView;
  private readonly audio: AudioController;

  constructor(
    model: GameStateModel,
    backend: BackendManager,
    view: GameView,
    audio: AudioController,
  ) {
    this.model = model;
    this.backend = backend;
    this.view = view;
    this.audio = audio;
  }

  async spin(): Promise<void> {
    if (!this.model.canSpin) return;

    this.model.setPhase("spinning");
    this.model.deductBet();
    this.view.updateBalance(this.model.balance);

    this.view.reels.forEach((reel) => reel.startSpin());

    const grid = this.backend.randomGrid();

    await this.wait(GameConfig.spin.minDurationMs);
    await Promise.all(
      this.view.reels.map((reel, index) =>
        this.wait(index * GameConfig.spin.stopStaggerMs).then(() =>
          reel.stopSpin(grid[index]),
        ),
      ),
    );

    const wins = this.backend.evaluateWins(grid, this.model.bet);
    const totalWin = wins.reduce((sum, win) => sum + win.amount, 0);

    // A full row of 5 also satisfies its overlapping 3- and 4-reel sub-lines,
    // so when a 5-of-a-kind win is present, only play the bigger sound for it
    const hasFiveOfAKind = wins.some((win) => win.count === 5);

    if (hasFiveOfAKind) {
      this.audio.play("big-win-sound");
    } else if (wins.some((win) => win.count === 3 || win.count === 4)) {
      this.audio.play("win-sound");
    }

    this.view.celebrateWinningSymbols(wins);

    if (totalWin > 0) {
      this.model.addWins(totalWin);
      this.view.updateBalance(this.model.balance);
      await this.wait(GameConfig.spin.winDisplayDelayMs * 2);
      this.audio.play("add-to-win");
      await this.view.celebrateWin(this.model.totalWin);
    }

    this.model.setPhase("idle");
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
