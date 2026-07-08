export type SpinPhase = "idle" | "spinning" | "revealing";

export class GameStateModel {
  private _balance: number;
  private _bet: number;
  private _phase: SpinPhase = "idle";

  constructor(startingBalance: number, defaultBet: number) {
    this._balance = startingBalance;
    this._bet = defaultBet;
  }

  get balance(): number {
    return this._balance;
  }

  get bet(): number {
    return this._bet;
  }

  get phase(): SpinPhase {
    return this._phase;
  }

  get canSpin(): boolean {
    return this._phase === "idle" && this._balance >= this._bet;
  }

  setPhase(phase: SpinPhase): void {
    this._phase = phase;
  }

  deductBet(): void {
    this._balance -= this._bet;
  }

  addWins(amount: number): void {
    this._balance += amount;
  }
}
