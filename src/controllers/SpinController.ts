import type { GameStateModel } from "../models/GameStateModel";
import type { BackendManager } from "../services/BackendManager";
import type { GameView } from "../views/GameView";

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

    await this.wait(1500);
    await Promise.all(
      this.view.reels.map((reel, index) => reel.stopSpin(grid[index])),
    );

    // TODO: check grid against paytable for wins, add to balance
    this.model.setPhase("idle");
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
