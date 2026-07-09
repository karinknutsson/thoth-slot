import type { GameStateModel } from "../models/GameStateModel";
import type { BackendManager } from "../services/BackendManager";
import type { GameView } from "../views/GameView";
import { GameConfig } from "../config/GameConfig";

export class SpinController {
  private readonly model: GameStateModel;
  private readonly backend: BackendManager;
  private readonly view: GameView;

  constructor(model: GameStateModel, backend: BackendManager, view: GameView) {
    this.model = model;
    this.backend = backend;
    this.view = view;
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

    if (totalWin > 0) {
      console.log(`Win: ${totalWin}`, wins);
      this.model.addWins(totalWin);
      this.view.updateBalance(this.model.balance);
      this.view.updateWin(this.model.totalWin);
    }

    this.model.setPhase("idle");
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
