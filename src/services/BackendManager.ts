import type { Paytable } from "../types/paytable.interface";

export class BackendManager {
  private readonly paytable: Paytable;

  constructor(paytable: Paytable) {
    this.paytable = paytable;
  }

  public weightedRandomSymbol(): string {
    const totalWeight = this.paytable.symbols.reduce(
      (sum, symbol) => sum + symbol.weight,
      0,
    );
    
    let roll = Math.random() * totalWeight;

    for (const symbol of this.paytable.symbols) {
      roll -= symbol.weight;
      if (roll <= 0) return symbol.id;
    }

    return this.paytable.symbols[0].id;
}
