import type { Paytable } from "../types/paytable.interface";
import type Win from "../types/win.interface";
import { GameConfig } from "../config/GameConfig";

export class BackendManager {
  private readonly paytable: Paytable;
  private readonly weightedPool: string[];
  private cheatGrid: string[][] | null = null;

  constructor(paytable: Paytable) {
    this.paytable = paytable;
    this.weightedPool = this.buildWeightedPool();
  }

  // Generates a weighted pool of symbol IDs based on their weights in the paytable
  private buildWeightedPool(): string[] {
    const pool: string[] = [];
    for (const symbol of this.paytable.symbols) {
      for (let i = 0; i < symbol.weight; i++) {
        pool.push(symbol.id);
      }
    }
    return pool;
  }

  // Returns the weighted pool of symbol IDs
  public getWeightedPool(): string[] {
    return this.weightedPool;
  }

  // Returns a random symbol ID from the weighted pool
  public weightedRandomSymbol(): string {
    return this.weightedPool[
      Math.floor(Math.random() * this.weightedPool.length)
    ];
  }

  // Sets a cheat grid for testing purposes
  public setCheatGrid(grid: string[][] | null): void {
    this.cheatGrid = grid;
  }

  // Generates a random grid of symbols based on the weighted pool
  public randomGrid(): string[][] {
    if (this.cheatGrid) return this.cheatGrid;

    const grid: string[][] = [];

    for (let reel = 0; reel < GameConfig.reels.count; reel++) {
      const column: string[] = [];
      for (let row = 0; row < GameConfig.reels.visibleSymbols; row++) {
        column.push(this.weightedRandomSymbol());
      }
      grid.push(column);
    }

    return grid;
  }

  // Evaluates the grid against the paytable and returns an array of win objects for any winning lines
  public evaluateWins(grid: string[][], bet: number): Win[] {
    const wins: Win[] = [];

    for (const line of this.paytable.lines) {
      const lineSymbolIds = line.rowPerReel.map(
        (row, offset) => grid[line.startReel + offset][row],
      );

      const symbolId = lineSymbolIds[0];
      let count = 1;
      while (
        count < lineSymbolIds.length &&
        lineSymbolIds[count] === symbolId
      ) {
        count++;
      }

      const payoutRule = this.paytable.payouts.find(
        (rule) => rule.symbolId === symbolId && rule.count === count,
      );
      if (!payoutRule) continue;

      const positions = line.rowPerReel
        .slice(0, count)
        .map((row, offset) => ({ reel: line.startReel + offset, row }));

      wins.push({
        count,
        amount: payoutRule.payoutMultiplier * bet,
        positions,
      });
    }

    return this.removeSubsumedWins(wins);
  }

  // To keep lines from overlapping, we remove any wins that are fully contained within another win
  private removeSubsumedWins(wins: Win[]): Win[] {
    const deduped = this.dedupeByPositions(wins);
    return deduped.filter(
      (win) => !deduped.some((other) => this.isSubsumedBy(win, other)),
    );
  }

  // Removes duplicate wins that have the same positions, keeping only the first occurrence
  private dedupeByPositions(wins: Win[]): Win[] {
    const seenPositionKeys = new Set<string>();
    return wins.filter((win) => {
      const key = this.positionsKey(win.positions);
      if (seenPositionKeys.has(key)) return false;
      seenPositionKeys.add(key);
      return true;
    });
  }

  private positionsKey(positions: Win["positions"]): string {
    return positions
      .map((position) => `${position.reel}:${position.row}`)
      .sort()
      .join(",");
  }

  private isSubsumedBy(win: Win, other: Win): boolean {
    if (win === other || win.positions.length >= other.positions.length) {
      return false;
    }

    return win.positions.every((position) =>
      other.positions.some(
        (otherPosition) =>
          otherPosition.reel === position.reel &&
          otherPosition.row === position.row,
      ),
    );
  }
}
