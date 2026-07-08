import type Symbol from "./symbol.interface";
import type PayoutRule from "./payout-rule.interface";
import type Line from "./line.interface";

export interface Paytable {
  symbols: Symbol[];
  payouts: PayoutRule[];
  lines: Line[];
}
