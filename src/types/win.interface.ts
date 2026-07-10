export default interface Win {
  lineId: string;
  lineName: string;
  symbolId: string;
  count: number;
  payoutMultiplier: number;
  amount: number;
  // Grid positions (reel, row) of the matching symbols, for highlighting them
  positions: { reel: number; row: number }[];
}
