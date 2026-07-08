import type { Paytable } from "../types/paytable.interface";
import { symbols } from "./symbol-data";
import { payoutRules } from "./payout-data";
import { lines } from "./line-data";

export const paytable: Paytable = {
  symbols,
  payouts: payoutRules,
  lines,
};
