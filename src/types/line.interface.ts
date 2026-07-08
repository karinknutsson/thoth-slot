export default interface Line {
  id: string;
  name: string;
  // reel index (0-based) that rowPerReel[0] corresponds to
  startReel: number;
  rowPerReel: number[];
}
