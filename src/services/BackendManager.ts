import type { Paytable } from "../types/paytable.interface";

export class BackendManager {
  private readonly paytable: Paytable;
  private readonly weightedPool: string[];

  constructor(paytable: Paytable) {
    this.paytable = paytable;
    this.weightedPool = this.buildWeightedPool();
  }

  private buildWeightedPool(): string[] {
    const pool: string[] = [];
    for (const symbol of this.paytable.symbols) {
      for (let i = 0; i < symbol.weight; i++) {
        pool.push(symbol.id);
      }
    }
    return pool;
  }

  public getWeightedPool(): string[] {
    return this.weightedPool;
  }

  public weightedRandomSymbol(): string {
    return this.weightedPool[
      Math.floor(Math.random() * this.weightedPool.length)
    ];
  }

  public randomGrid(): string[][] {
    const reelCount = 5;
    const rowCount = 3;
    const grid: string[][] = [];

    for (let reel = 0; reel < reelCount; reel++) {
      const column: string[] = [];
      for (let row = 0; row < rowCount; row++) {
        column.push(this.weightedRandomSymbol());
      }
      grid.push(column);
    }

    return grid;
  }
}
