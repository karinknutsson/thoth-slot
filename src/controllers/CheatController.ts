import { cheats } from "../data/cheat-data";
import type { BackendManager } from "../services/BackendManager";

export class CheatsController {
  private readonly backend: BackendManager;

  constructor(backend: BackendManager) {
    this.backend = backend;
  }

  select(cheatName: string): void {
    const grid = cheats[cheatName];
    if (!grid) return;
    this.backend.setCheatGrid(grid);
  }
}
