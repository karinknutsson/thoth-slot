import type Line from "../types/line.interface";

export const lines: Line[] = [
  {
    id: "horizontal5ReelsTop",
    name: "Top Row",
    startReel: 0,
    rowPerReel: [0, 0, 0, 0, 0],
  },
  {
    id: "horizontal5ReelsMiddle",
    name: "Middle Row",
    startReel: 0,
    rowPerReel: [1, 1, 1, 1, 1],
  },
  {
    id: "horizontal5ReelsBottom",
    name: "Bottom Row",
    startReel: 0,
    rowPerReel: [2, 2, 2, 2, 2],
  },
  {
    id: "horizontal3Reels1to3Top",
    name: "Reels 1-3 Top Row",
    startReel: 0,
    rowPerReel: [0, 0, 0],
  },
  {
    id: "horizontal3Reels1to3Middle",
    name: "Reels 1-3 Middle Row",
    startReel: 0,
    rowPerReel: [1, 1, 1],
  },
  {
    id: "horizontal3Reels1to3Bottom",
    name: "Reels 1-3 Bottom Row",
    startReel: 0,
    rowPerReel: [2, 2, 2],
  },
  {
    id: "horizontal3Reels2to4Top",
    name: "Reels 2-4 Top Row",
    startReel: 1,
    rowPerReel: [0, 0, 0],
  },
  {
    id: "horizontal3Reels2to4Middle",
    name: "Reels 2-4 Middle Row",
    startReel: 1,
    rowPerReel: [1, 1, 1],
  },
  {
    id: "horizontal3Reels2to4Bottom",
    name: "Reels 2-4 Bottom Row",
    startReel: 1,
    rowPerReel: [2, 2, 2],
  },
  {
    id: "horizontal3Reels3to5Top",
    name: "Reels 3-5 Top Row",
    startReel: 2,
    rowPerReel: [0, 0, 0],
  },
  {
    id: "horizontal3Reels3to5Middle",
    name: "Reels 3-5 Middle Row",
    startReel: 2,
    rowPerReel: [1, 1, 1],
  },
  {
    id: "horizontal3Reels3to5Bottom",
    name: "Reels 3-5 Bottom Row",
    startReel: 2,
    rowPerReel: [2, 2, 2],
  },
  {
    id: "diagonalReels1to3DownRight",
    name: "Reels 1-3 Diagonal Down",
    startReel: 0,
    rowPerReel: [0, 1, 2],
  },
  {
    id: "diagonalReels1to3UpRight",
    name: "Reels 1-3 Diagonal Up",
    startReel: 0,
    rowPerReel: [2, 1, 0],
  },
  {
    id: "diagonalReels2to4DownRight",
    name: "Reels 2-4 Diagonal Down",
    startReel: 1,
    rowPerReel: [0, 1, 2],
  },
  {
    id: "diagonalReels2to4UpRight",
    name: "Reels 2-4 Diagonal Up",
    startReel: 1,
    rowPerReel: [2, 1, 0],
  },
  {
    id: "diagonalReels3to5DownRight",
    name: "Reels 3-5 Diagonal Down",
    startReel: 2,
    rowPerReel: [0, 1, 2],
  },
  {
    id: "diagonalReels3to5UpRight",
    name: "Reels 3-5 Diagonal Up",
    startReel: 2,
    rowPerReel: [2, 1, 0],
  },
];
